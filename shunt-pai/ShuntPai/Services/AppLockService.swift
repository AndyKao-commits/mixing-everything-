import LocalAuthentication
import Foundation

@MainActor
final class AppLockService: ObservableObject {
    @Published var isEnabled: Bool
    @Published private(set) var isUnlocked: Bool
    @Published var lastError: String?

    init() {
        isEnabled = UserDefaults.standard.bool(forKey: AppConstants.appLockEnabledKey)
        isUnlocked = !UserDefaults.standard.bool(forKey: AppConstants.appLockEnabledKey)
    }

    var needsLockScreen: Bool {
        isEnabled && !isUnlocked
    }

    func setEnabled(_ enabled: Bool) async -> Bool {
        if enabled {
            let ok = await authenticate(reason: "啟用分流拍上鎖")
            guard ok else { return false }
            isEnabled = true
            isUnlocked = true
            UserDefaults.standard.set(true, forKey: AppConstants.appLockEnabledKey)
            return true
        } else {
            let ok = await authenticate(reason: "關閉分流拍上鎖")
            guard ok else { return false }
            isEnabled = false
            isUnlocked = true
            UserDefaults.standard.set(false, forKey: AppConstants.appLockEnabledKey)
            return true
        }
    }

    func unlock() async -> Bool {
        let ok = await authenticate(reason: "解鎖分流拍")
        if ok {
            isUnlocked = true
            lastError = nil
        }
        return ok
    }

    /// Relock when the app is freshly launched or sent to the background.
    func relockIfNeededOnLaunch() {
        if isEnabled {
            isUnlocked = false
        }
    }

    private func authenticate(reason: String) async -> Bool {
        let context = LAContext()
        var error: NSError?
        let policy: LAPolicy = context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error)
            ? .deviceOwnerAuthentication
            : .deviceOwnerAuthenticationWithBiometrics

        guard context.canEvaluatePolicy(policy, error: &error) else {
            lastError = error?.localizedDescription ?? "此裝置無法使用鎖定驗證。"
            return false
        }

        do {
            return try await context.evaluatePolicy(policy, localizedReason: reason)
        } catch {
            lastError = error.localizedDescription
            return false
        }
    }
}
