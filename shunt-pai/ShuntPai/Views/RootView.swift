import SwiftUI

struct RootView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        Group {
            if appState.isOnboarded {
                MainTabView()
            } else {
                OnboardingFlowView()
            }
        }
    }
}

struct MainTabView: View {
    @EnvironmentObject private var appState: AppState
    @StateObject private var authService: GoogleAuthService
    @StateObject private var photoStore: PhotoStore
    @StateObject private var uploadManager: UploadQueueManager

    private let driveService: GoogleDriveService

    init() {
        let authService = GoogleAuthService()
        let photoStore = PhotoStore()
        let driveService = GoogleDriveService(authService: authService)
        _authService = StateObject(wrappedValue: authService)
        _photoStore = StateObject(wrappedValue: photoStore)
        _uploadManager = StateObject(
            wrappedValue: UploadQueueManager(
                authService: authService,
                driveService: driveService,
                photoStore: photoStore
            )
        )
        self.driveService = driveService
    }

    var body: some View {
        TabView(selection: $appState.selectedTab) {
            CameraScreenView(
                authService: authService,
                driveService: driveService,
                photoStore: photoStore,
                uploadManager: uploadManager
            )
            .tabItem {
                Label("相機", systemImage: "camera.fill")
            }
            .tag(MainTab.camera)

            GalleryView(
                authService: authService,
                driveService: driveService,
                photoStore: photoStore,
                uploadManager: uploadManager
            )
            .tabItem {
                Label("相簿", systemImage: "photo.on.rectangle")
            }
            .tag(MainTab.gallery)
        }
        .tint(.yellow)
    }
}
