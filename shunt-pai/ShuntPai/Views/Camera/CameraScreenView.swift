@preconcurrency import AVFoundation
import SwiftData
import SwiftUI
import UIKit

struct CameraScreenView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.scenePhase) private var scenePhase
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var entitlements: EntitlementService

    @ObservedObject var photoStore: PhotoStore
    @StateObject private var cameraService = CameraService()

    @Query(sort: \PhotoRecord.capturedAt, order: .reverse) private var records: [PhotoRecord]

    @State private var isCapturing = false
    @State private var toast: String?
    @State private var toastToken = UUID()
    @State private var latestThumbnail: UIImage?

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            VStack(spacing: 0) {
                topChrome
                    .padding(.horizontal, 18)
                    .padding(.top, 8)
                    .padding(.bottom, 10)

                previewStage
                    .frame(maxWidth: .infinity)
                    .layoutPriority(1)

                bottomChrome
                    .padding(.top, 14)
                    .padding(.bottom, 8)
            }

            if let toast {
                Text(toast)
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(Color.black.opacity(0.72))
                    .clipShape(Capsule())
                    .padding(.bottom, 180)
                    .frame(maxHeight: .infinity, alignment: .bottom)
                    .allowsHitTesting(false)
            }
        }
        .task {
            let granted = await cameraService.requestPermissionIfNeeded()
            if granted, appState.selectedTab == .camera {
                setCameraActive(true)
            }
        }
        .task(id: records.first?.id) {
            if let latest = records.first {
                latestThumbnail = await photoStore.loadThumbnail(for: latest)
            } else {
                latestThumbnail = nil
            }
        }
        .onAppear {
            if appState.selectedTab == .camera {
                setCameraActive(true)
            }
        }
        .onDisappear {
            setCameraActive(false)
        }
        .onChange(of: appState.selectedTab) { _, tab in
            setCameraActive(tab == .camera)
        }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active {
                cameraService.refreshAuthorizationStatus()
                if appState.selectedTab == .camera {
                    setCameraActive(true)
                }
            } else if phase == .background {
                setCameraActive(false)
            }
        }
        .onChange(of: cameraService.errorMessage) { _, message in
            guard let message else { return }
            showToast(message)
            cameraService.errorMessage = nil
        }
        .statusBarHidden(true)
        .persistentSystemOverlays(.hidden)
        .preferredColorScheme(.dark)
    }

    private var topChrome: some View {
        HStack {
            if cameraService.supportsFlash {
                Button {
                    cameraService.toggleFlash()
                } label: {
                    Image(systemName: cameraService.flashMode == .on ? "bolt.fill" : "bolt.slash.fill")
                        .font(.title3.weight(.semibold))
                        .foregroundStyle(.white)
                        .frame(width: 40, height: 40)
                }
            } else {
                Color.clear.frame(width: 40, height: 40)
            }

            Spacer()

            Text("4:3")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.white.opacity(0.9))

            Spacer()

            Button {
                appState.selectedTab = .gallery
            } label: {
                Image(systemName: "xmark")
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(.white)
                    .frame(width: 40, height: 40)
            }
        }
    }

    private var previewStage: some View {
        GeometryReader { geo in
            let width = geo.size.width
            let height = min(geo.size.height, width * 4 / 3)
            ZStack {
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
                    .frame(width: width, height: height)
                    .clipped()

                    // Horizon guide
                    Rectangle()
                        .fill(Color.white.opacity(0.35))
                        .frame(height: 1)
                        .frame(maxWidth: .infinity)
                        .allowsHitTesting(false)

                    if let focusPoint = cameraService.focusPoint {
                        FocusReticle(locked: cameraService.isAEAFLocked)
                            .position(focusPoint)
                            .allowsHitTesting(false)

                        VerticalExposureSlider(
                            value: Binding(
                                get: { Double(cameraService.exposureBias) },
                                set: { cameraService.setExposureBias(Float($0)) }
                            ),
                            range: Double(cameraService.minExposureBias)...Double(max(cameraService.maxExposureBias, cameraService.minExposureBias + 0.1))
                        )
                        .position(x: min(focusPoint.x + 52, width - 24), y: focusPoint.y)
                    }

                    if cameraService.isAEAFLocked {
                        Text("AE/AF 鎖定")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(.yellow)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(Color.black.opacity(0.45))
                            .clipShape(Capsule())
                            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
                            .padding(.top, 12)
                            .allowsHitTesting(false)
                    }
                } else {
                    permissionView
                        .frame(width: width, height: height)
                }
            }
            .frame(width: width, height: height)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }

    private var bottomChrome: some View {
        VStack(spacing: 16) {
            if cameraService.authorizationStatus == .authorized {
                zoomControls

                if !entitlements.isPaid {
                    Text("免費 \(records.count)/\(AppConstants.freePhotoLimit)")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(.white.opacity(0.7))
                }

                HStack {
                    Button {
                        appState.selectedTab = .gallery
                    } label: {
                        ZStack {
                            Circle().fill(Color.white.opacity(0.12))
                            if let latestThumbnail {
                                Image(uiImage: latestThumbnail)
                                    .resizable()
                                    .scaledToFill()
                            }
                        }
                        .frame(width: 56, height: 56)
                        .clipShape(Circle())
                        .overlay(Circle().stroke(Color.white.opacity(0.55), lineWidth: 1.5))
                    }
                    .buttonStyle(.plain)

                    Spacer()

                    Button {
                        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                        Task { await capturePhoto() }
                    } label: {
                        ZStack {
                            Circle()
                                .stroke(Color.white, lineWidth: 4)
                                .frame(width: 78, height: 78)
                            Circle()
                                .fill(Color.white.opacity(isCapturing ? 0.4 : 1))
                                .frame(width: 64, height: 64)
                        }
                    }
                    .buttonStyle(.plain)
                    .disabled(isCapturing)

                    Spacer()

                    Button {
                        cameraService.switchCamera()
                    } label: {
                        Image(systemName: "arrow.triangle.2.circlepath.camera")
                            .font(.title2.weight(.semibold))
                            .foregroundStyle(.white)
                            .frame(width: 56, height: 56)
                            .background(Circle().fill(Color.white.opacity(0.14)))
                    }
                    .buttonStyle(.plain)
                }
                .padding(.horizontal, 28)

                Text("照片")
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(.yellow)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 6)
                    .background(Capsule().fill(Color.yellow.opacity(0.18)))
                    .padding(.top, 4)
            }
        }
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
                        .frame(width: 44, height: 44)
                        .background(
                            Circle().fill(
                                cameraService.selectedZoomID == option.id
                                ? Color.yellow
                                : Color.black.opacity(0.35)
                            )
                        )
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(Capsule().fill(Color.black.opacity(0.28)))
    }

    private var permissionView: some View {
        VStack(spacing: 16) {
            Image(systemName: "camera.fill")
                .font(.system(size: 48))
                .foregroundStyle(.yellow)
            Text("需要相機權限才能拍照")
                .font(.headline)
                .foregroundStyle(.white)
            Text("請到「設定 > 分流拍」開啟相機。")
                .font(.footnote)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            if cameraService.authorizationStatus == .denied || cameraService.authorizationStatus == .restricted {
                Button {
                    if let url = URL(string: UIApplication.openSettingsURLString) {
                        UIApplication.shared.open(url)
                    }
                } label: {
                    Text("開啟設定")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(PrimaryButtonStyle())
                .padding(.horizontal, 40)
            }
        }
        .padding()
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
            _ = try await photoStore.saveCapturedPhoto(data: data, modelContext: modelContext)
            showToast("已儲存")

            let saveToLibrary = UserDefaults.standard.bool(forKey: AppConstants.saveToPhotoLibraryKey)
            if saveToLibrary {
                Task {
                    let outcome = await PhotoLibrarySaver.saveIfNeeded(data: data, enabled: true)
                    if outcome == .denied {
                        showToast("系統相簿權限未開啟")
                    }
                }
            }
        } catch {
            showToast(error.localizedDescription)
        }
    }

    private func setCameraActive(_ active: Bool) {
        UIApplication.shared.isIdleTimerDisabled = active
        if active {
            if cameraService.authorizationStatus == .authorized {
                cameraService.startSession()
            }
        } else {
            cameraService.stopSession()
        }
    }

    private func showToast(_ message: String) {
        let token = UUID()
        toastToken = token
        withAnimation { toast = message }
        Task {
            try? await Task.sleep(for: .seconds(1.2))
            if toastToken == token {
                withAnimation { toast = nil }
            }
        }
    }
}

private struct FocusReticle: View {
    let locked: Bool

    var body: some View {
        RoundedRectangle(cornerRadius: 4)
            .stroke(Color.yellow, lineWidth: locked ? 3 : 2)
            .frame(width: 72, height: 72)
            .shadow(color: .black.opacity(0.35), radius: 2)
    }
}

private struct VerticalExposureSlider: View {
    @Binding var value: Double
    let range: ClosedRange<Double>

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: "sun.max.fill")
                .font(.caption2)
                .foregroundStyle(.yellow)
            GeometryReader { geo in
                let height = geo.size.height
                let progress = (value - range.lowerBound) / max(range.upperBound - range.lowerBound, 0.001)
                ZStack(alignment: .bottom) {
                    Capsule()
                        .fill(Color.white.opacity(0.25))
                        .frame(width: 2)
                    Capsule()
                        .fill(Color.yellow)
                        .frame(width: 2, height: max(height * progress, 2))
                    Circle()
                        .fill(Color.yellow)
                        .frame(width: 14, height: 14)
                        .offset(y: -(height * progress) + 7)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .contentShape(Rectangle())
                .gesture(
                    DragGesture(minimumDistance: 0)
                        .onChanged { drag in
                            let y = min(max(0, height - drag.location.y), height)
                            let ratio = y / max(height, 1)
                            value = range.lowerBound + (range.upperBound - range.lowerBound) * ratio
                        }
                )
            }
            .frame(width: 28, height: 110)
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

    override func layoutSubviews() {
        super.layoutSubviews()
        // Portrait-only app: 90° is the iOS 17 replacement for `.portrait`.
        let portraitAngle: CGFloat = 90
        if let connection = videoPreviewLayer.connection,
           connection.isVideoRotationAngleSupported(portraitAngle) {
            connection.videoRotationAngle = portraitAngle
        }
    }
}
