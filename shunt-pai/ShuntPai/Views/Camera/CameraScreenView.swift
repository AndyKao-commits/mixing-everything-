@preconcurrency import AVFoundation
import SwiftData
import SwiftUI

struct CameraScreenView: View {
    @Environment(\.modelContext) private var modelContext
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var entitlements: EntitlementService

    @ObservedObject var photoStore: PhotoStore
    @StateObject private var cameraService = CameraService()

    @Query(sort: \PhotoRecord.capturedAt, order: .reverse) private var records: [PhotoRecord]

    @State private var showSettings = false
    @State private var isCapturing = false
    @State private var toast: String?

    private var latestThumbnail: UIImage? {
        guard let latest = records.first else { return nil }
        return photoStore.loadThumbnail(for: latest)
    }

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            if cameraService.authorizationStatus == .authorized {
                CameraPreviewView(
                    session: cameraService.session,
                    onTapToFocus: { viewPoint, devicePoint in
                        cameraService.focusAndExpose(at: devicePoint)
                        cameraService.showFocusIndicator(at: viewPoint, locked: false)
                    },
                    onLongPressLock: { viewPoint, devicePoint in
                        cameraService.lockFocusAndExposure(at: devicePoint)
                        cameraService.showFocusIndicator(at: viewPoint, locked: true)
                    },
                    onPinch: { scale in
                        cameraService.bumpZoom(by: scale)
                    }
                )
                .ignoresSafeArea()

                if let focusPoint = cameraService.focusPoint {
                    FocusReticle(locked: cameraService.isAEAFLocked)
                        .position(focusPoint)
                        .allowsHitTesting(false)
                }
            } else {
                permissionView
            }

            VStack(spacing: 0) {
                topBar
                    .padding(.horizontal, 16)
                    .padding(.top, 10)

                exposureSlider
                    .padding(.horizontal, 20)
                    .padding(.top, 10)

                Spacer(minLength: 0)
                    .allowsHitTesting(false)

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
                .allowsHitTesting(false)
            }

            if cameraService.isAEAFLocked {
                VStack {
                    Text("AE/AF 鎖定")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.yellow)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.black.opacity(0.55))
                        .clipShape(Capsule())
                        .padding(.top, 118)
                    Spacer()
                }
                .allowsHitTesting(false)
            }
        }
        .sheet(isPresented: $showSettings) {
            SettingsView(photoStore: photoStore)
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

            Text(exposureLabel)
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

    private var exposureSlider: some View {
        HStack(spacing: 10) {
            Image(systemName: "sun.min.fill")
                .font(.caption)
                .foregroundStyle(.yellow)
            Slider(
                value: Binding(
                    get: { Double(cameraService.exposureBias) },
                    set: { cameraService.setExposureBias(Float($0)) }
                ),
                in: Double(cameraService.minExposureBias)...Double(max(cameraService.maxExposureBias, cameraService.minExposureBias + 0.1)),
                step: 0.1
            )
            .tint(.yellow)
            Image(systemName: "sun.max.fill")
                .font(.caption)
                .foregroundStyle(.yellow)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Color.black.opacity(0.35))
        .clipShape(Capsule())
    }

    private var exposureLabel: String {
        if cameraService.isAEAFLocked {
            return "AE/AF 鎖定"
        }
        let ev = cameraService.exposureBias
        let sign = ev > 0.05 ? "+" : ""
        return String(format: "%@%.1f EV", sign, ev)
    }

    private var zoomLabel: String {
        let value = cameraService.displayZoom
        if abs(value - 0.5) < 0.05 { return "0.5x" }
        if abs(value - value.rounded()) < 0.05 {
            return "\(Int(value.rounded()))x"
        }
        return String(format: "%.1fx", value)
    }

    private var zoomControls: some View {
        HStack(spacing: 10) {
            ForEach(cameraService.zoomOptions) { option in
                Button {
                    cameraService.applyZoomOption(option)
                } label: {
                    Text(option.label)
                        .font(.caption.weight(.bold))
                        .foregroundStyle(cameraService.selectedZoomID == option.id ? .black : .white)
                        .frame(width: 42, height: 42)
                        .background(
                            Circle().fill(
                                cameraService.selectedZoomID == option.id
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

    private func capturePhoto() async {
        guard entitlements.canCaptureMore(currentCount: records.count) else {
            showToast("免費版最多 \(AppConstants.freePhotoLimit) 張")
            return
        }

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
        withAnimation { toast = message }
        Task {
            try? await Task.sleep(for: .seconds(1.2))
            withAnimation { toast = nil }
        }
    }
}

private struct FocusReticle: View {
    let locked: Bool

    var body: some View {
        VStack(spacing: 6) {
            RoundedRectangle(cornerRadius: 4)
                .stroke(Color.yellow, lineWidth: locked ? 3 : 2)
                .frame(width: 78, height: 78)
            if locked {
                Text("鎖定")
                    .font(.caption2.weight(.bold))
                    .foregroundStyle(.yellow)
            }
        }
        .shadow(color: .black.opacity(0.4), radius: 2)
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
    let onTapToFocus: (CGPoint, CGPoint) -> Void
    let onLongPressLock: (CGPoint, CGPoint) -> Void
    let onPinch: (CGFloat) -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(onTapToFocus: onTapToFocus, onLongPressLock: onLongPressLock, onPinch: onPinch)
    }

    func makeUIView(context: Context) -> PreviewView {
        let view = PreviewView()
        view.videoPreviewLayer.session = session
        view.videoPreviewLayer.videoGravity = .resizeAspectFill
        context.coordinator.attach(to: view)
        return view
    }

    func updateUIView(_ uiView: PreviewView, context: Context) {
        uiView.videoPreviewLayer.session = session
        context.coordinator.onTapToFocus = onTapToFocus
        context.coordinator.onLongPressLock = onLongPressLock
        context.coordinator.onPinch = onPinch
    }

    final class Coordinator: NSObject, UIGestureRecognizerDelegate {
        var onTapToFocus: (CGPoint, CGPoint) -> Void
        var onLongPressLock: (CGPoint, CGPoint) -> Void
        var onPinch: (CGFloat) -> Void
        private var lastPinch: CGFloat = 1
        private weak var previewView: PreviewView?

        init(
            onTapToFocus: @escaping (CGPoint, CGPoint) -> Void,
            onLongPressLock: @escaping (CGPoint, CGPoint) -> Void,
            onPinch: @escaping (CGFloat) -> Void
        ) {
            self.onTapToFocus = onTapToFocus
            self.onLongPressLock = onLongPressLock
            self.onPinch = onPinch
        }

        func attach(to view: PreviewView) {
            previewView = view
            view.isUserInteractionEnabled = true

            let tap = UITapGestureRecognizer(target: self, action: #selector(handleTap(_:)))
            tap.delegate = self
            view.addGestureRecognizer(tap)

            let press = UILongPressGestureRecognizer(target: self, action: #selector(handleLongPress(_:)))
            press.minimumPressDuration = 0.45
            press.delegate = self
            view.addGestureRecognizer(press)

            let pinch = UIPinchGestureRecognizer(target: self, action: #selector(handlePinch(_:)))
            pinch.delegate = self
            view.addGestureRecognizer(pinch)
        }

        @objc private func handleTap(_ gesture: UITapGestureRecognizer) {
            guard let view = previewView else { return }
            let point = gesture.location(in: view)
            let devicePoint = view.videoPreviewLayer.captureDevicePointConverted(fromLayerPoint: point)
            onTapToFocus(point, devicePoint)
        }

        @objc private func handleLongPress(_ gesture: UILongPressGestureRecognizer) {
            guard gesture.state == .began, let view = previewView else { return }
            let point = gesture.location(in: view)
            let devicePoint = view.videoPreviewLayer.captureDevicePointConverted(fromLayerPoint: point)
            onLongPressLock(point, devicePoint)
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        }

        @objc private func handlePinch(_ gesture: UIPinchGestureRecognizer) {
            switch gesture.state {
            case .began:
                lastPinch = 1
            case .changed:
                let delta = gesture.scale / lastPinch
                lastPinch = gesture.scale
                onPinch(delta)
            default:
                lastPinch = 1
            }
        }

        func gestureRecognizer(
            _ gestureRecognizer: UIGestureRecognizer,
            shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer
        ) -> Bool {
            true
        }
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
