import AVFoundation
import SwiftData
import SwiftUI

struct CameraScreenView: View {
    @Environment(\.modelContext) private var modelContext
    @EnvironmentObject private var appState: AppState

    @ObservedObject var authService: GoogleAuthService
    let driveService: GoogleDriveService
    @ObservedObject var photoStore: PhotoStore
    @ObservedObject var uploadManager: UploadQueueManager

    @StateObject private var cameraService = CameraService()

    @Query(sort: \PhotoRecord.capturedAt, order: .reverse) private var records: [PhotoRecord]

    @State private var showSettings = false
    @State private var isCapturing = false
    @State private var uploadToast: String?

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
            } else {
                permissionView
            }

            VStack {
                topBar
                Spacer()
                if cameraService.authorizationStatus == .authorized {
                    zoomControls
                    controlBar
                }
                modeBar
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 8)

            if let uploadToast {
                VStack {
                    Spacer()
                    Text(uploadToast)
                        .font(.footnote.weight(.semibold))
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(.ultraThinMaterial)
                        .clipShape(Capsule())
                        .padding(.bottom, 120)
                }
                .transition(.opacity)
            }
        }
        .sheet(isPresented: $showSettings) {
            SettingsView(authService: authService, driveService: driveService)
        }
        .task {
            let granted = await cameraService.requestPermissionIfNeeded()
            if granted {
                cameraService.startSession()
            }
            await uploadManager.processPendingUploads(modelContext: modelContext)
        }
        .onChange(of: uploadManager.needsProcessing) { _, needs in
            guard needs else { return }
            Task {
                await uploadManager.processPendingUploads(modelContext: modelContext)
                uploadManager.needsProcessing = false
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
        HStack {
            Text(String(format: "%.1f EV", 0.0))
                .font(.caption.monospacedDigit())
                .foregroundStyle(.yellow)

            Spacer()

            Button {
                cameraService.toggleFlash()
            } label: {
                Image(systemName: cameraService.flashMode == .on ? "bolt.fill" : "bolt.slash.fill")
            }
            .cameraChromeButton()

            Button {
                showSettings = true
            } label: {
                Image(systemName: "ellipsis.circle")
            }
            .cameraChromeButton()
        }
        .padding(.top, 8)
    }

    private var zoomControls: some View {
        HStack(spacing: 18) {
            ForEach([0.5, 1.0, 2.0], id: \.self) { value in
                Button {
                    cameraService.setZoom(max(value, 1))
                } label: {
                    Text(value == 1.0 ? "1x" : String(format: "%.1f", value))
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(abs(cameraService.zoomFactor - max(value, 1)) < 0.1 ? .yellow : .white)
                        .frame(width: 36, height: 36)
                        .background(abs(cameraService.zoomFactor - max(value, 1)) < 0.1 ? Color.white.opacity(0.18) : Color.clear)
                        .clipShape(Circle())
                }
            }
        }
        .padding(.bottom, 8)
    }

    private var controlBar: some View {
        HStack {
            Button {
                appState.selectedTab = .gallery
            } label: {
                Group {
                    if let latestThumbnail {
                        Image(uiImage: latestThumbnail)
                            .resizable()
                            .scaledToFill()
                    } else {
                        Color.white.opacity(0.15)
                    }
                }
                .frame(width: 46, height: 46)
                .clipShape(RoundedRectangle(cornerRadius: 8))
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color.white.opacity(0.4), lineWidth: 1)
                )
            }

            Spacer()

            Button {
                Task { await capturePhoto() }
            } label: {
                ZStack {
                    Circle()
                        .stroke(Color.white, lineWidth: 4)
                        .frame(width: 78, height: 78)
                    Circle()
                        .fill(Color.white.opacity(isCapturing ? 0.35 : 1))
                        .frame(width: 64, height: 64)
                }
            }
            .disabled(isCapturing)
            .accessibilityLabel("快門")

            Spacer()

            Button {
                cameraService.switchCamera()
            } label: {
                Image(systemName: "arrow.triangle.2.circlepath.camera")
                    .cameraChromeButton()
            }
        }
        .padding(.vertical, 8)
    }

    private var modeBar: some View {
        HStack {
            Spacer()
            Text("拍照")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.yellow)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(Color.white.opacity(0.15))
                .clipShape(Capsule())
            Spacer()
        }
        .padding(.bottom, 4)
    }

    private func capturePhoto() async {
        isCapturing = true
        defer { isCapturing = false }

        do {
            let data = try await cameraService.capturePhoto()
            let record = try photoStore.saveCapturedPhoto(data: data, modelContext: modelContext)
            showToast("已儲存")

            let saveToLibrary = UserDefaults.standard.bool(forKey: AppConstants.saveToPhotoLibraryKey)
            await uploadManager.enqueueUpload(
                for: record,
                saveToPhotoLibrary: saveToLibrary,
                modelContext: modelContext
            )

            switch record.uploadStatus {
            case .uploaded:
                showToast("已上傳")
            case .failed:
                showToast("待傳")
            default:
                showToast("上傳中")
            }
        } catch {
            showToast(error.localizedDescription)
        }
    }

    private func showToast(_ message: String) {
        withAnimation {
            uploadToast = message
        }

        Task {
            try? await Task.sleep(for: .seconds(1.5))
            withAnimation {
                uploadToast = nil
            }
        }
    }
}

private extension View {
    func cameraChromeButton() -> some View {
        self
            .font(.title3)
            .foregroundStyle(.white)
            .frame(width: 40, height: 40)
            .background(Color.black.opacity(0.35))
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

    func updateUIView(_ uiView: PreviewView, context: Context) {}
}

final class PreviewView: UIView {
    override class var layerClass: AnyClass {
        AVCaptureVideoPreviewLayer.self
    }

    var videoPreviewLayer: AVCaptureVideoPreviewLayer {
        layer as! AVCaptureVideoPreviewLayer
    }
}
