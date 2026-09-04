import SwiftUI
import SwiftData

@main
struct ShuntPaiApp: App {
    @StateObject private var appState = AppState()
    @StateObject private var lockService = AppLockService()
    @StateObject private var entitlements = EntitlementService()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(appState)
                .environmentObject(lockService)
                .environmentObject(entitlements)
                .modelContainer(for: [PhotoRecord.self, TagRecord.self])
                .onAppear {
                    lockService.relockIfNeededOnLaunch()
                }
        }
    }
}

final class AppState: ObservableObject {
    @Published var isOnboarded: Bool
    @Published var selectedTab: MainTab = .camera
    @Published var isGallerySelecting = false

    init() {
        isOnboarded = UserDefaults.standard.bool(forKey: AppConstants.onboardingCompleteKey)
    }

    func markOnboarded() {
        isOnboarded = true
        UserDefaults.standard.set(true, forKey: AppConstants.onboardingCompleteKey)
    }

    func resetOnboarding() {
        isOnboarded = false
        UserDefaults.standard.set(false, forKey: AppConstants.onboardingCompleteKey)
    }
}

enum MainTab: Hashable {
    case camera
    case gallery
}
