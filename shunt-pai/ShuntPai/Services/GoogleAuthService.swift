import AuthenticationServices
import CryptoKit
import Foundation
import UIKit

struct GoogleUserProfile: Equatable {
    let email: String
}

enum GoogleAuthError: LocalizedError {
    case missingClientID
    case invalidCallback
    case missingCode
    case tokenExchangeFailed
    case missingRefreshToken
    case notSignedIn

    var errorDescription: String? {
        switch self {
        case .missingClientID: return "尚未設定 Google Client ID。"
        case .invalidCallback: return "Google 登入回呼失敗。"
        case .missingCode: return "未取得授權碼。"
        case .tokenExchangeFailed: return "無法取得 Google 存取權杖。"
        case .missingRefreshToken: return "缺少 refresh token，請重新登入。"
        case .notSignedIn: return "尚未登入 Google。"
        }
    }
}

@MainActor
final class GoogleAuthService: NSObject, ObservableObject {
    @Published private(set) var profile: GoogleUserProfile?
    @Published private(set) var isSignedIn = false
    @Published var lastError: String?

    private var authSession: ASWebAuthenticationSession?
    private var currentVerifier: String?

    override init() {
        super.init()
        restoreSession()
    }

    func restoreSession() {
        guard KeychainHelper.read(AppConstants.refreshTokenKey) != nil
            || KeychainHelper.read(AppConstants.accessTokenKey) != nil else {
            isSignedIn = false
            profile = nil
            return
        }

        if let email = KeychainHelper.read(AppConstants.userEmailKey) {
            profile = GoogleUserProfile(email: email)
        }
        isSignedIn = true
    }

    func signIn() async throws {
        guard AppConstants.googleClientID.hasPrefix("YOUR_") == false else {
            throw GoogleAuthError.missingClientID
        }

        let verifier = Self.randomURLSafeString(length: 64)
        let challenge = Self.codeChallenge(for: verifier)
        currentVerifier = verifier

        var components = URLComponents(string: "https://accounts.google.com/o/oauth2/v2/auth")!
        components.queryItems = [
            URLQueryItem(name: "client_id", value: AppConstants.googleClientID),
            URLQueryItem(name: "redirect_uri", value: AppConstants.googleRedirectURI),
            URLQueryItem(name: "response_type", value: "code"),
            URLQueryItem(name: "scope", value: AppConstants.googleAuthScope),
            URLQueryItem(name: "code_challenge", value: challenge),
            URLQueryItem(name: "code_challenge_method", value: "S256"),
            URLQueryItem(name: "access_type", value: "offline"),
            URLQueryItem(name: "prompt", value: "consent")
        ]

        guard let authURL = components.url else {
            throw GoogleAuthError.invalidCallback
        }

        let callbackURL = try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<URL, Error>) in
            authSession = ASWebAuthenticationSession(
                url: authURL,
                callbackURLScheme: AppConstants.googleRedirectScheme
            ) { url, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }
                guard let url else {
                    continuation.resume(throwing: GoogleAuthError.invalidCallback)
                    return
                }
                continuation.resume(returning: url)
            }

            authSession?.presentationContextProvider = self
            authSession?.prefersEphemeralWebBrowserSession = false
            authSession?.start()
        }

        authSession = nil

        guard
            let components = URLComponents(url: callbackURL, resolvingAgainstBaseURL: false),
            let code = components.queryItems?.first(where: { $0.name == "code" })?.value,
            let verifier = currentVerifier
        else {
            throw GoogleAuthError.missingCode
        }

        try await exchangeCode(code, verifier: verifier)
    }

    func signOut() {
        KeychainHelper.clearAuth()
        profile = nil
        isSignedIn = false
    }

    func validAccessToken() async throws -> String {
        if
            let token = KeychainHelper.read(AppConstants.accessTokenKey),
            let expiryString = KeychainHelper.read(AppConstants.tokenExpiryKey),
            let expiry = TimeInterval(expiryString),
            Date().timeIntervalSince1970 < expiry - 60
        {
            return token
        }

        guard let refreshToken = KeychainHelper.read(AppConstants.refreshTokenKey) else {
            isSignedIn = false
            throw GoogleAuthError.notSignedIn
        }

        try await refreshAccessToken(refreshToken: refreshToken)

        guard let token = KeychainHelper.read(AppConstants.accessTokenKey) else {
            throw GoogleAuthError.tokenExchangeFailed
        }
        return token
    }

    private func exchangeCode(_ code: String, verifier: String) async throws {
        var request = URLRequest(url: URL(string: "https://oauth2.googleapis.com/token")!)
        request.httpMethod = "POST"
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")

        let body = [
            "client_id": AppConstants.googleClientID,
            "code": code,
            "code_verifier": verifier,
            "redirect_uri": AppConstants.googleRedirectURI,
            "grant_type": "authorization_code"
        ]
        request.httpBody = body
            .map { "\($0.key)=\($0.value.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? $0.value)" }
            .joined(separator: "&")
            .data(using: .utf8)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            throw GoogleAuthError.tokenExchangeFailed
        }

        try persistTokenPayload(data)
    }

    private func refreshAccessToken(refreshToken: String) async throws {
        var request = URLRequest(url: URL(string: "https://oauth2.googleapis.com/token")!)
        request.httpMethod = "POST"
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")

        let body = [
            "client_id": AppConstants.googleClientID,
            "refresh_token": refreshToken,
            "grant_type": "refresh_token"
        ]
        request.httpBody = body
            .map { "\($0.key)=\($0.value.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? $0.value)" }
            .joined(separator: "&")
            .data(using: .utf8)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            signOut()
            throw GoogleAuthError.tokenExchangeFailed
        }

        try persistTokenPayload(data)
    }

    private func persistTokenPayload(_ data: Data) throws {
        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        guard let accessToken = json?["access_token"] as? String else {
            throw GoogleAuthError.tokenExchangeFailed
        }

        KeychainHelper.save(accessToken, for: AppConstants.accessTokenKey)

        if let refreshToken = json?["refresh_token"] as? String {
            KeychainHelper.save(refreshToken, for: AppConstants.refreshTokenKey)
        }

        if let expiresIn = json?["expires_in"] as? TimeInterval {
            let expiry = Date().timeIntervalSince1970 + expiresIn
            KeychainHelper.save(String(expiry), for: AppConstants.tokenExpiryKey)
        }

        Task {
            await fetchUserEmail(accessToken: accessToken)
        }

        isSignedIn = true
    }

    private func fetchUserEmail(accessToken: String) async {
        var request = URLRequest(url: URL(string: "https://www.googleapis.com/oauth2/v2/userinfo")!)
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")

        guard
            let (data, response) = try? await URLSession.shared.data(for: request),
            let http = response as? HTTPURLResponse,
            (200...299).contains(http.statusCode),
            let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
            let email = json["email"] as? String
        else { return }

        KeychainHelper.save(email, for: AppConstants.userEmailKey)
        profile = GoogleUserProfile(email: email)
    }

    private static func randomURLSafeString(length: Int) -> String {
        let bytes = (0..<length).map { _ in UInt8.random(in: 0...255) }
        return Data(bytes)
            .base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }

    private static func codeChallenge(for verifier: String) -> String {
        let hash = SHA256.hash(data: Data(verifier.utf8))
        return Data(hash)
            .base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }
}

extension GoogleAuthService: ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
            .first { $0.isKeyWindow } ?? ASPresentationAnchor()
    }
}
