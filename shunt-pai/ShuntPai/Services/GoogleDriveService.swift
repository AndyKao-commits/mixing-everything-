import Foundation

struct DriveFolder: Identifiable, Equatable {
    let id: String
    let name: String
}

enum GoogleDriveError: LocalizedError {
    case notConfigured
    case invalidResponse
    case uploadFailed
    case folderCreationFailed

    var errorDescription: String? {
        switch self {
        case .notConfigured: return "尚未選擇 Google Drive 資料夾。"
        case .invalidResponse: return "Google Drive 回應無效。"
        case .uploadFailed: return "照片上傳失敗。"
        case .folderCreationFailed: return "無法建立資料夾。"
        }
    }
}

final class GoogleDriveService {
    private let authService: GoogleAuthService

    init(authService: GoogleAuthService) {
        self.authService = authService
    }

    var selectedFolderID: String? {
        KeychainHelper.read(AppConstants.folderIDKey)
    }

    var selectedFolderName: String? {
        KeychainHelper.read(AppConstants.folderNameKey)
    }

    func saveSelectedFolder(_ folder: DriveFolder) {
        KeychainHelper.save(folder.id, for: AppConstants.folderIDKey)
        KeychainHelper.save(folder.name, for: AppConstants.folderNameKey)
    }

    func listFolders(parentID: String = "root") async throws -> [DriveFolder] {
        let token = try await authService.validAccessToken()

        var components = URLComponents(string: "https://www.googleapis.com/drive/v3/files")!
        components.queryItems = [
            URLQueryItem(name: "q", value: "'\(parentID)' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false"),
            URLQueryItem(name: "fields", value: "files(id,name)"),
            URLQueryItem(name: "orderBy", value: "name"),
            URLQueryItem(name: "pageSize", value: "100")
        ]

        var request = URLRequest(url: components.url!)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            throw GoogleDriveError.invalidResponse
        }

        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        let files = json?["files"] as? [[String: Any]] ?? []

        return files.compactMap { item in
            guard let id = item["id"] as? String, let name = item["name"] as? String else { return nil }
            return DriveFolder(id: id, name: name)
        }
    }

    func createFolder(named name: String, parentID: String = "root") async throws -> DriveFolder {
        let token = try await authService.validAccessToken()

        var request = URLRequest(url: URL(string: "https://www.googleapis.com/drive/v3/files")!)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let payload: [String: Any] = [
            "name": name,
            "mimeType": "application/vnd.google-apps.folder",
            "parents": [parentID]
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard
            let http = response as? HTTPURLResponse,
            (200...299).contains(http.statusCode),
            let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
            let id = json["id"] as? String
        else {
            throw GoogleDriveError.folderCreationFailed
        }

        return DriveFolder(id: id, name: name)
    }

    func ensureDefaultFolderSelected() async throws -> DriveFolder {
        if
            let id = selectedFolderID,
            let name = selectedFolderName
        {
            return DriveFolder(id: id, name: name)
        }

        let folders = try await listFolders()
        if let existing = folders.first(where: { $0.name == AppConstants.appFolderName }) {
            saveSelectedFolder(existing)
            return existing
        }

        let created = try await createFolder(named: AppConstants.appFolderName)
        saveSelectedFolder(created)
        return created
    }

    func uploadPhoto(data: Data, filename: String, mimeType: String = "image/jpeg") async throws -> String {
        guard let folderID = selectedFolderID else {
            throw GoogleDriveError.notConfigured
        }

        let token = try await authService.validAccessToken()
        let boundary = "Boundary-\(UUID().uuidString)"

        var body = Data()
        let metadata: [String: Any] = [
            "name": filename,
            "parents": [folderID]
        ]
        let metadataData = try JSONSerialization.data(withJSONObject: metadata)

        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Type: application/json; charset=UTF-8\r\n\r\n".data(using: .utf8)!)
        body.append(metadataData)
        body.append("\r\n".data(using: .utf8)!)
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Type: \(mimeType)\r\n\r\n".data(using: .utf8)!)
        body.append(data)
        body.append("\r\n".data(using: .utf8)!)
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)

        var request = URLRequest(url: URL(string: "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id")!)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("multipart/related; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        request.httpBody = body

        let (responseData, response) = try await URLSession.shared.data(for: request)
        guard
            let http = response as? HTTPURLResponse,
            (200...299).contains(http.statusCode),
            let json = try JSONSerialization.jsonObject(with: responseData) as? [String: Any],
            let fileID = json["id"] as? String
        else {
            throw GoogleDriveError.uploadFailed
        }

        return fileID
    }

    func deleteRemoteFile(id: String) async throws {
        let token = try await authService.validAccessToken()
        var request = URLRequest(url: URL(string: "https://www.googleapis.com/drive/v3/files/\(id)")!)
        request.httpMethod = "DELETE"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        let (_, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            throw GoogleDriveError.invalidResponse
        }
    }
}
