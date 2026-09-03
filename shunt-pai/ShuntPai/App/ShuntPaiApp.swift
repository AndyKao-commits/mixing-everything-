import SwiftUI
import SwiftData

@main
struct ShuntPaiApp: App {
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(appState)
                .modelContainer(for: [PhotoRecord.self])
                .preferredColorScheme(.dark)
        }
    }
}

final class AppState: ObservableObject {
    @Published var isOnboarded: Bool
    @Published var selectedTab: MainTab = .camera

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
