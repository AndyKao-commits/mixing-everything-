import SwiftUI

struct RootView: View {
    @Environment(\.scenePhase) private var scenePhase
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var lockService: AppLockService

    var body: some View {
        Group {
            if !appState.isOnboarded {
                OnboardingFlowView()
            } else if lockService.needsLockScreen {
                LockScreenView()
            } else {
                MainTabView()
            }
        }
        .onChange(of: scenePhase) { _, phase in
            if phase == .background {
                lockService.relockIfNeededOnLaunch()
            }
        }
    }
}

struct MainTabView: View {
    @EnvironmentObject private var appState: AppState
    @StateObject private var photoStore = PhotoStore()

    var body: some View {
        ZStack(alignment: .bottom) {
            Group {
                switch appState.selectedTab {
                case .camera:
                    CameraScreenView(photoStore: photoStore)
                case .gallery:
                    GalleryView(photoStore: photoStore)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            if appState.selectedTab == .gallery {
                FloatingNavBar(selectedTab: $appState.selectedTab)
                    .padding(.bottom, 10)
            }
        }
        .ignoresSafeArea(.keyboard)
    }
}
