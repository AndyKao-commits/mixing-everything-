import SwiftUI

/// Clips-style floating chrome: album in a pill, camera as a circular button.
struct FloatingNavBar: View {
    @Binding var selectedTab: MainTab

    var body: some View {
        HStack(spacing: 12) {
            Button {
                withAnimation(.easeInOut(duration: 0.2)) {
                    selectedTab = .gallery
                }
            } label: {
                VStack(spacing: 4) {
                    Image(systemName: "photo.on.rectangle")
                        .font(.system(size: 18, weight: .semibold))
                    Text("相簿")
                        .font(.caption2.weight(.semibold))
                }
                .foregroundStyle(Color.primary)
                .frame(width: 72, height: 54)
                .background(Capsule().fill(Color.primary.opacity(0.08)))
            }
            .buttonStyle(.plain)
            .padding(6)
            .background(.ultraThinMaterial, in: Capsule())
            .overlay(Capsule().stroke(Color.black.opacity(0.06), lineWidth: 0.5))
            .shadow(color: .black.opacity(0.12), radius: 16, y: 6)

            Button {
                withAnimation(.easeInOut(duration: 0.2)) {
                    selectedTab = .camera
                }
            } label: {
                Image(systemName: "camera.fill")
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundStyle(.primary)
                    .frame(width: 58, height: 58)
                    .background(.ultraThinMaterial, in: Circle())
                    .overlay(Circle().stroke(Color.black.opacity(0.06), lineWidth: 0.5))
                    .shadow(color: .black.opacity(0.14), radius: 16, y: 6)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("相機")
        }
    }
}
