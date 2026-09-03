import AVFoundation
import SwiftData
import SwiftUI

struct CameraScreenView: View {
    @Environment(\.modelContext) private var modelContext
    @EnvironmentObject private var appState: AppState

    @ObservedObject var photoStore: PhotoStore
    @StateObject private var cameraService = CameraService()

    @Query(sort: \PhotoRecord.capturedAt, order: .reverse) private var records: [PhotoRecord]

    @State private var showSettings = false
    @State private var isCapturing = false
    @State private var toast: String?
    @State private var pinchBase: CGFloat = 1

    private var latestThumbnail: UIImage? {
        guard let latest = records.first else { return nil }
        return photoStore.loadThumbnail(for: latest)
    }

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            if cameraService.authorizationStatus == .authorized {
                CameraPreviewView(session: cameraService.session)
                    .ignoresSafeArea()
                    .gesture(pinchGesture)
            } else {
                permissionView
            }

            VStack(spacing: 0) {
                topBar
                    .padding(.horizontal, 16)
                    .padding(.top, 10)

                Spacer()

                if cameraService.authorizationStatus == .authorized {
                    zoomControls
                        .padding(.bottom, 14)

                    shutterRow
                        .padding(.horizontal, 28)
                        .padding(.bottom, 18)
                }
            }
            .safeAreaPadding(.bottom, 8)

            if let toast {
                VStack {
                    Spacer()
                    Text(toast)
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(Color.black.opacity(0.72))
                        .clipShape(Capsule())
                        .padding(.bottom, 140)
                }
                .transition(.opacity)
                .allowsHitTesting(false)
            }
        }
        .sheet(isPresented: $showSettings) {
            SettingsView()
        }
        .task {
            let granted = await cameraService.requestPermissionIfNeeded()
            if granted {
                cameraService.startSession()
            }
        }
        .onDisappear {
            cameraService.stopSession()
        }
    }

    private var permissionView: some View {
        VStack(spacing: 16) {
            Image(systemName: "camera.fill")
                .font(.system(size: 48))
                .foregroundStyle(.yellow)
            Text("需要相機權限才能拍照")
                .font(.headline)
            Text("請到「設定 > 分流拍」開啟相機。")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
    }

    private var topBar: some View {
        HStack(spacing: 12) {
            if cameraService.supportsFlash {
                Button {
                    cameraService.toggleFlash()
                } label: {
                    Image(systemName: cameraService.flashMode == .on ? "bolt.fill" : "bolt.slash.fill")
                        .cameraChromeButton()
                }
            }

            Spacer()

            Text(zoomLabel)
                .font(.caption.weight(.semibold).monospacedDigit())
                .foregroundStyle(.yellow)
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(Color.black.opacity(0.35))
                .clipShape(Capsule())

            Spacer()

            Button {
                showSettings = true
            } label: {
                Image(systemName: "gearshape.fill")
                    .cameraChromeButton()
            }
        }
    }

    private var zoomLabel: String {
        if cameraService.selectedPreset == .ultraWide {
            return "0.5x"
        }
        let value = cameraService.zoomFactor
        if abs(value - value.rounded()) < 0.05 {
            return "\(Int(value.rounded()))x"
        }
        return String(format: "%.1fx", value)
    }

    private var zoomControls: some View {
        HStack(spacing: 10) {
            ForEach(cameraService.availablePresets, id: \.self) { preset in
                Button {
                    cameraService.applyPreset(preset)
                } label: {
                    Text(preset.label)
                        .font(.caption.weight(.bold))
                        .foregroundStyle(cameraService.selectedPreset == preset ? .black : .white)
                        .frame(width: 40, height: 40)
                        .background(
                            Circle().fill(
                                cameraService.selectedPreset == preset
                                ? Color.yellow
                                : Color.black.opacity(0.45)
                            )
                        )
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Color.black.opacity(0.28))
        .clipShape(Capsule())
    }

    private var shutterRow: some View {
        HStack {
            Button {
                appState.selectedTab = .gallery
            } label: {
                ZStack {
                    RoundedRectangle(cornerRadius: 10)
                        .fill(Color.white.opacity(0.12))
                    if let latestThumbnail {
                        Image(uiImage: latestThumbnail)
                            .resizable()
                            .scaledToFill()
                    }
                }
                .frame(width: 52, height: 52)
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(Color.white.opacity(0.55), lineWidth: 1)
                )
            }
            .buttonStyle(.plain)

            Spacer()

            Button {
                Task { await capturePhoto() }
            } label: {
                ZStack {
                    Circle()
                        .stroke(Color.white, lineWidth: 5)
                        .frame(width: 82, height: 82)
                    Circle()
                        .fill(Color.white.opacity(isCapturing ? 0.4 : 1))
                        .frame(width: 68, height: 68)
                }
            }
            .buttonStyle(.plain)
            .disabled(isCapturing)
            .accessibilityLabel("快門")

            Spacer()

            Button {
                cameraService.switchCamera()
            } label: {
                Image(systemName: "arrow.triangle.2.circlepath")
                    .cameraChromeButton()
            }
            .buttonStyle(.plain)
        }
    }

    private var pinchGesture: some Gesture {
        MagnificationGesture()
            .onChanged { value in
                let delta = value / pinchBase
                pinchBase = value
                cameraService.bumpZoom(by: delta)
            }
            .onEnded { _ in
                pinchBase = 1
            }
    }

    private func capturePhoto() async {
        isCapturing = true
        defer { isCapturing = false }

        do {
            let data = try await cameraService.capturePhoto()
            let record = try photoStore.saveCapturedPhoto(data: data, modelContext: modelContext)

            let saveToLibrary = UserDefaults.standard.bool(forKey: AppConstants.saveToPhotoLibraryKey)
            if let image = photoStore.loadImage(for: record) {
                await PhotoLibrarySaver.saveIfNeeded(image, enabled: saveToLibrary)
            }

            showToast("已儲存")
        } catch {
            showToast(error.localizedDescription)
        }
    }

    private func showToast(_ message: String) {
        withAnimation {
            toast = message
        }

        Task {
            try? await Task.sleep(for: .seconds(1.2))
            withAnimation {
                toast = nil
            }
        }
    }
}

private extension View {
    func cameraChromeButton() -> some View {
        self
            .font(.title3.weight(.semibold))
            .foregroundStyle(.white)
            .frame(width: 42, height: 42)
            .background(Color.black.opacity(0.4))
            .clipShape(Circle())
    }
}

struct CameraPreviewView: UIViewRepresentable {
    let session: AVCaptureSession

    func makeUIView(context: Context) -> PreviewView {
        let view = PreviewView()
        view.videoPreviewLayer.session = session
        view.videoPreviewLayer.videoGravity = .resizeAspectFill
        return view
    }

    func updateUIView(_ uiView: PreviewView, context: Context) {
        uiView.videoPreviewLayer.session = session
    }
}

final class PreviewView: UIView {
    override class var layerClass: AnyClass {
        AVCaptureVideoPreviewLayer.self
    }

    var videoPreviewLayer: AVCaptureVideoPreviewLayer {
        layer as! AVCaptureVideoPreviewLayer
    }
}
