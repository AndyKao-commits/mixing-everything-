import SwiftUI

struct LockScreenView: View {
    @EnvironmentObject private var lockService: AppLockService
    @State private var isAuthenticating = false

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            VStack(spacing: 24) {
                Image(systemName: "lock.fill")
                    .font(.system(size: 48))
                    .foregroundStyle(.yellow)

                Text("分流拍已上鎖")
                    .font(.title2.weight(.semibold))

                Text("切到背景後會再上鎖。")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)

                Button {
                    Task { await unlock() }
                } label: {
                    Text(isAuthenticating ? "驗證中…" : "解鎖")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(PrimaryButtonStyle())
                .disabled(isAuthenticating)
                .padding(.horizontal, 32)
            }
        }
        .task {
            await unlock()
        }
    }

    private func unlock() async {
        isAuthenticating = true
        defer { isAuthenticating = false }
        _ = await lockService.unlock()
    }
}
