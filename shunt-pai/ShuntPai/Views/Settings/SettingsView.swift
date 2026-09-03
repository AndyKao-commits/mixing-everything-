import SwiftUI

struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var lockService: AppLockService
    @EnvironmentObject private var entitlements: EntitlementService

    @ObservedObject var photoStore: PhotoStore

    @State private var saveToPhotoLibrary = UserDefaults.standard.bool(forKey: AppConstants.saveToPhotoLibraryKey)
    @State private var appStorageText = "計算中…"
    @State private var freeSpaceText = "計算中…"
    @State private var lockBusy = false

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

                Section {
                    Toggle("啟用上鎖", isOn: Binding(
                        get: { lockService.isEnabled },
                        set: { newValue in
                            Task {
                                lockBusy = true
                                _ = await lockService.setEnabled(newValue)
                                lockBusy = false
                            }
                        }
                    ))
                    .disabled(lockBusy)
                } footer: {
                    Text("啟用後，每次重新打開 App 需 Face ID / 密碼解鎖一次；解鎖後本次使用期間不必再解鎖。")
                }

                Section {
                    LabeledContent("目前", value: entitlements.planName)
                    if entitlements.isPaid {
                        Text("可多選分享／下載／刪除；刪除只需確認一次。\(AppConstants.subscriptionPriceText)。")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    } else {
                        Text("最多 \(AppConstants.freePhotoLimit) 張。只能一張一張刪除，每次需確認兩次。")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                } header: {
                    Text("方案")
                }

                Section {
                    Button("啟動付費模式") {
                        entitlements.setPaid(true)
                    }
                    .disabled(entitlements.isPaid)

                    Button("免費版") {
                        entitlements.setPaid(false)
                    }
                    .disabled(!entitlements.isPaid)
                } header: {
                    Text("測試狀態")
                } footer: {
                    Text("僅供測試。未來免費版限 43 張、單張雙重確認刪除；訂閱每月 NT$40 可多選分享與刪除。")
                }

                Section {
                    LabeledContent("分流拍已用", value: appStorageText)
                    LabeledContent("裝置可用空間", value: freeSpaceText)
                } header: {
                    Text("容量")
                }

                Section {
                    LabeledContent("App", value: AppConstants.appName)
                    LabeledContent("儲存位置", value: "本機 App 內")
                } header: {
                    Text("關於")
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
            .task {
                appStorageText = photoStore.formattedStorageUsage()
                freeSpaceText = photoStore.deviceFreeSpaceFormatted()
            }
            .alert("無法變更上鎖", isPresented: Binding(
                get: { lockService.lastError != nil },
                set: { if !$0 { lockService.lastError = nil } }
            )) {
                Button("好", role: .cancel) {}
            } message: {
                Text(lockService.lastError ?? "")
            }
        }
    }
}
