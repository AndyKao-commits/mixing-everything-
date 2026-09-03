import SwiftUI

struct RootView: View {
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
    }
}

struct MainTabView: View {
    @EnvironmentObject private var appState: AppState
    @StateObject private var photoStore = PhotoStore()

    var body: some View {
        TabView(selection: $appState.selectedTab) {
            CameraScreenView(photoStore: photoStore)
                .tabItem {
                    Label("相機", systemImage: "camera.fill")
                }
                .tag(MainTab.camera)

            GalleryView(photoStore: photoStore)
                .tabItem {
                    Label("相簿", systemImage: "photo.on.rectangle")
                }
                .tag(MainTab.gallery)
        }
        .tint(.yellow)
    }
}
