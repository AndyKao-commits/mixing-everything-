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

            if appState.selectedTab == .gallery, !appState.isGallerySelecting {
                FloatingNavBar(selectedTab: $appState.selectedTab)
                    .padding(.bottom, 10)
            }
        }
        .ignoresSafeArea(.keyboard)
        .onAppear {
            applyOrientationLock(for: appState.selectedTab)
        }
        .onChange(of: appState.selectedTab) { _, tab in
            applyOrientationLock(for: tab)
        }
        .onDisappear {
            OrientationLock.mask = .all
        }
    }

    private func applyOrientationLock(for tab: MainTab) {
        // Camera chrome stays portrait-fixed like native Camera (shutter on phone bottom).
        OrientationLock.mask = tab == .camera ? .portrait : .all
    }
}
