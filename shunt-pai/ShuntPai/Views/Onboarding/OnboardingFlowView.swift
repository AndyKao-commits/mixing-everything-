import SwiftUI

struct OnboardingFlowView: View {
    @EnvironmentObject private var appState: AppState
    @StateObject private var authService = GoogleAuthService()

    @State private var step: Step = .welcome
    @State private var saveToPhotoLibrary = false
    @State private var folders: [DriveFolder] = []
    @State private var selectedFolder: DriveFolder?
    @State private var isLoading = false
    @State private var errorMessage: String?

    private var driveService: GoogleDriveService {
        GoogleDriveService(authService: authService)
    }

    enum Step {
        case welcome
        case folder
        case preference
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Spacer()

                switch step {
                case .welcome:
                    welcomeContent
                case .folder:
                    folderContent
                case .preference:
                    preferenceContent
                }

                Spacer()
            }
            .padding(24)
            .background(Color.black.ignoresSafeArea())
            .navigationTitle(AppConstants.appName)
            .navigationBarTitleDisplayMode(.inline)
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

    private var welcomeContent: some View {
        VStack(spacing: 20) {
            Image(systemName: "camera.circle.fill")
                .font(.system(size: 72))
                .foregroundStyle(.yellow)

            Text("工作拍照，不混進私人相簿")
                .font(.title3.weight(.semibold))
                .multilineTextAlignment(.center)

            Text("我們不另建帳號，只用你的 Google 雲端存照片。")
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            Button {
                Task { await signIn() }
            } label: {
                Text(isLoading ? "登入中…" : "用 Google 帳號開始")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(PrimaryButtonStyle())
            .disabled(isLoading)
        }
    }

    private var folderContent: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("照片要存到哪？")
                .font(.title3.weight(.semibold))

            if let email = authService.profile?.email {
                Text(email)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            ScrollView {
                LazyVStack(spacing: 10) {
                    ForEach(folders) { folder in
                        Button {
                            selectedFolder = folder
                        } label: {
                            HStack {
                                Image(systemName: "folder.fill")
                                    .foregroundStyle(.yellow)
                                Text(folder.name)
                                    .foregroundStyle(.primary)
                                Spacer()
                                if selectedFolder?.id == folder.id {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundStyle(.yellow)
                                }
                            }
                            .padding()
                            .background(Color.white.opacity(0.08))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                    }
                }
            }

            Button {
                Task { await createDefaultFolder() }
            } label: {
                Label("建立「\(AppConstants.appFolderName)」資料夾", systemImage: "folder.badge.plus")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(SecondaryButtonStyle())
            .disabled(isLoading)

            Button {
                guard let selectedFolder else { return }
                driveService.saveSelectedFolder(selectedFolder)
                step = .preference
            } label: {
                Text("選擇此資料夾")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(PrimaryButtonStyle())
            .disabled(selectedFolder == nil || isLoading)
        }
    }

    private var preferenceContent: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("是否也存到 iPhone 相簿？")
                .font(.title3.weight(.semibold))

            VStack(spacing: 12) {
                SelectableOptionRow(
                    title: "否（建議）— 公私分明",
                    isSelected: saveToPhotoLibrary == false
                ) {
                    saveToPhotoLibrary = false
                }

                SelectableOptionRow(
                    title: "是 — 相簿也留一份",
                    isSelected: saveToPhotoLibrary == true
                ) {
                    saveToPhotoLibrary = true
                }
            }

            Button {
                UserDefaults.standard.set(saveToPhotoLibrary, forKey: AppConstants.saveToPhotoLibraryKey)
                appState.markOnboarded()
            } label: {
                Text("完成，開始拍照")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(PrimaryButtonStyle())
        }
    }

    private func signIn() async {
        isLoading = true
        defer { isLoading = false }

        do {
            try await authService.signIn()
            folders = try await driveService.listFolders()
            if folders.isEmpty {
                let created = try await driveService.createFolder(named: AppConstants.appFolderName)
                folders = [created]
                selectedFolder = created
            } else if let existing = folders.first(where: { $0.name == AppConstants.appFolderName }) {
                selectedFolder = existing
            }
            step = .folder
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func createDefaultFolder() async {
        isLoading = true
        defer { isLoading = false }

        do {
            let folder = try await driveService.createFolder(named: AppConstants.appFolderName)
            folders.insert(folder, at: 0)
            selectedFolder = folder
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct SelectableOptionRow: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: isSelected ? "largecircle.fill.circle" : "circle")
                    .foregroundStyle(isSelected ? .yellow : .secondary)
                Text(title)
                    .foregroundStyle(.primary)
                Spacer()
            }
            .padding()
            .background(Color.white.opacity(0.08))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }
}

struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .padding()
            .background(Color.yellow.opacity(configuration.isPressed ? 0.75 : 1))
            .foregroundStyle(.black)
            .clipShape(RoundedRectangle(cornerRadius: 14))
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .padding()
            .background(Color.white.opacity(configuration.isPressed ? 0.12 : 0.08))
            .foregroundStyle(.primary)
            .clipShape(RoundedRectangle(cornerRadius: 14))
    }
}
