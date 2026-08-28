import SwiftUI

struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var appState: AppState

    @ObservedObject var authService: GoogleAuthService
    let driveService: GoogleDriveService

    @State private var saveToPhotoLibrary = UserDefaults.standard.bool(forKey: AppConstants.saveToPhotoLibraryKey)
    @State private var folders: [DriveFolder] = []
    @State private var isLoadingFolders = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Form {
                Section("雲端帳號") {
                    LabeledContent("Google", value: authService.profile?.email ?? "未登入")
                    LabeledContent("儲存位置", value: driveService.selectedFolderName ?? "未設定")
                }

                Section("資料夾") {
                    if isLoadingFolders {
                        ProgressView()
                    }

                    ForEach(folders) { folder in
                        Button(folder.name) {
                            driveService.saveSelectedFolder(folder)
                        }
                    }

                    Button("重新載入資料夾") {
                        Task { await loadFolders() }
                    }
                }

                Section("偏好設定") {
                    Toggle("同步到 iPhone 相簿", isOn: $saveToPhotoLibrary)
                        .onChange(of: saveToPhotoLibrary) { _, newValue in
                            UserDefaults.standard.set(newValue, forKey: AppConstants.saveToPhotoLibraryKey)
                        }
                }

                Section {
                    Button("登出", role: .destructive) {
                        authService.signOut()
                        appState.resetOnboarding()
                        dismiss()
                    }
                }
            }
            .navigationTitle("設定")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("完成") { dismiss() }
                }
            }
            .task {
                await loadFolders()
            }
            .alert("發生錯誤", isPresented: Binding(
                get: { errorMessage != nil },
                set: { if !$0 { errorMessage = nil } }
            )) {
                Button("好", role: .cancel) {}
            } message: {
                Text(errorMessage ?? "")
            }
        }
    }

    private func loadFolders() async {
        isLoadingFolders = true
        defer { isLoadingFolders = false }

        do {
            folders = try await driveService.listFolders()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
