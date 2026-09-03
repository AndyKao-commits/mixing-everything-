import SwiftUI

struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var appState: AppState

    @State private var saveToPhotoLibrary = UserDefaults.standard.bool(forKey: AppConstants.saveToPhotoLibraryKey)

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Toggle("同步到 iPhone 相簿", isOn: $saveToPhotoLibrary)
                        .onChange(of: saveToPhotoLibrary) { _, newValue in
                            UserDefaults.standard.set(newValue, forKey: AppConstants.saveToPhotoLibraryKey)
                        }
                } footer: {
                    Text("關閉時，照片只保存在分流拍，不會出現在系統「照片」。")
                }

                Section("關於") {
                    LabeledContent("App", value: AppConstants.appName)
                    LabeledContent("儲存位置", value: "本機 App 內")
                }

                Section {
                    Button("重新顯示歡迎頁") {
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
        }
    }
}
