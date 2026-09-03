import SwiftUI

struct OnboardingFlowView: View {
    @EnvironmentObject private var appState: AppState
    @State private var saveToPhotoLibrary = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 28) {
                Spacer()

                Image(systemName: "camera.circle.fill")
                    .font(.system(size: 72))
                    .foregroundStyle(.yellow)

                Text("工作拍照，不混進私人相簿")
                    .font(.title3.weight(.semibold))
                    .multilineTextAlignment(.center)

                Text("照片只保存在分流拍裡，預設不會進入 iPhone「照片」。")
                    .font(.body)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)

                VStack(spacing: 12) {
                    SelectableOptionRow(
                        title: "只存在分流拍（建議）",
                        isSelected: saveToPhotoLibrary == false
                    ) {
                        saveToPhotoLibrary = false
                    }

                    SelectableOptionRow(
                        title: "同時也存到 iPhone 相簿",
                        isSelected: saveToPhotoLibrary == true
                    ) {
                        saveToPhotoLibrary = true
                    }
                }

                Button {
                    UserDefaults.standard.set(saveToPhotoLibrary, forKey: AppConstants.saveToPhotoLibraryKey)
                    appState.markOnboarded()
                } label: {
                    Text("開始拍照")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(PrimaryButtonStyle())

                Spacer()
            }
            .padding(24)
            .background(Color.black.ignoresSafeArea())
            .navigationTitle(AppConstants.appName)
            .navigationBarTitleDisplayMode(.inline)
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
