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
    @StateObject private var horizon = HorizonLevelService()

    @Query(sort: \PhotoRecord.capturedAt, order: .reverse) private var records: [PhotoRecord]

    @State private var isCapturing = false
    @State private var toast: String?
    @State private var toastToken = UUID()
    @State private var latestThumbnail: UIImage?
    @State private var aspectRatio: AppConstants.CaptureAspectRatio = .sixteenNine
    @State private var interfaceIsLandscape = false

    var body: some View {
        GeometryReader { geo in
            let isLandscape = geo.size.width > geo.size.height
            let previewArea = previewContentSize(isLandscape: isLandscape, in: geo.size)

            ZStack {
                Color.black.ignoresSafeArea()

                // Preview centered; chrome floats over it (native Camera style).
                previewStage(isLandscape: isLandscape, previewSize: previewArea)
                    .frame(width: previewArea.width, height: previewArea.height)

                VStack(spacing: 0) {
                    topChrome
                        .padding(.horizontal, isLandscape ? 24 : 18)
                        .padding(.top, isLandscape ? 6 : 8)

                    Spacer(minLength: 0)

                    bottomChrome(isLandscape: isLandscape)
                        .padding(.top, isLandscape ? 6 : 10)
                        .padding(.bottom, isLandscape ? 6 : 8)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)

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
            .onAppear {
                interfaceIsLandscape = isLandscape
                horizon.setInterfaceLandscape(isLandscape)
                UIDevice.current.beginGeneratingDeviceOrientationNotifications()
            }
            .onDisappear {
                UIDevice.current.endGeneratingDeviceOrientationNotifications()
            }
            .onChange(of: isLandscape) { _, landscape in
                interfaceIsLandscape = landscape
                horizon.setInterfaceLandscape(landscape)
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

            Button {
                aspectRatio = aspectRatio.next
            } label: {
                Text(aspectRatio.rawValue)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.white.opacity(0.9))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(Capsule().fill(Color.white.opacity(0.12)))
            }
            .buttonStyle(.plain)

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

    /// Native-style fit:
    /// - Portrait 16:9 → full width, letterbox above/below (tall 9:16 frame)
    /// - Landscape 16:9 → fill screen height, thin pillar boxes if needed (wide 16:9)
    private func previewContentSize(isLandscape: Bool, in size: CGSize) -> CGSize {
        let available: CGSize
        if isLandscape {
            // Use the full short edge so landscape feels edge-to-edge like native Camera.
            available = size
        } else {
            let topReserve: CGFloat = 52
            let bottomReserve: CGFloat = 176
            available = CGSize(
                width: size.width,
                height: max(size.height - topReserve - bottomReserve, 160)
            )
        }
        let targetWH = aspectRatio.uprightWidthOverHeight(isLandscape: isLandscape)
        let availableWH = available.width / max(available.height, 1)

        if availableWH > targetWH {
            let height = available.height
            return CGSize(width: height * targetWH, height: height)
        } else {
            let width = available.width
            return CGSize(width: width, height: width / max(targetWH, 0.01))
        }
    }

    private func previewStage(isLandscape: Bool, previewSize: CGSize) -> some View {
        ZStack {
            if cameraService.authorizationStatus == .authorized {
                CameraPreviewView(
                    session: cameraService.session,
                    onPreviewReady: { layer in
                        cameraService.bindPreviewLayer(layer)
                    },
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
                    },
                    onExposureDrag: cameraService.focusPoint == nil ? nil : { deltaY in
                        cameraService.adjustExposure(by: Float(-deltaY / 140))
                    }
                )
                .frame(width: previewSize.width, height: previewSize.height)
                .clipped()

                if horizon.shouldShow {
                    HorizonGuideLine(tiltDegrees: horizon.tiltDegrees, isLevel: horizon.isLevel)
                        .frame(width: previewSize.width, height: previewSize.height)
                        .transition(.opacity)
                        .allowsHitTesting(false)
                }

                if let focusPoint = cameraService.focusPoint {
                    FocusReticle(
                        locked: cameraService.isAEAFLocked,
                        exposureBias: cameraService.exposureBias
                    )
                    .position(focusPoint)
                    .allowsHitTesting(false)
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
                    .frame(width: previewSize.width, height: previewSize.height)
            }
        }
        .frame(width: previewSize.width, height: previewSize.height)
        .animation(.easeInOut(duration: 0.2), value: aspectRatio)
        .animation(.easeInOut(duration: 0.15), value: horizon.shouldShow)
    }

    private func bottomChrome(isLandscape: Bool) -> some View {
        let shutterOuter: CGFloat = isLandscape ? 64 : 78
        let shutterInner: CGFloat = isLandscape ? 52 : 64
        let sideButton: CGFloat = isLandscape ? 48 : 56

        return VStack(spacing: isLandscape ? 10 : 16) {
            if cameraService.authorizationStatus == .authorized {
                zoomControls

                if !entitlements.isPaid && !isLandscape {
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
                        .frame(width: sideButton, height: sideButton)
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
                                .frame(width: shutterOuter, height: shutterOuter)
                            Circle()
                                .fill(Color.white.opacity(isCapturing ? 0.4 : 1))
                                .frame(width: shutterInner, height: shutterInner)
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
                            .frame(width: sideButton, height: sideButton)
                            .background(Circle().fill(Color.white.opacity(0.14)))
                    }
                    .buttonStyle(.plain)
                }
                .padding(.horizontal, isLandscape ? 36 : 28)

                if !isLandscape {
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
            // Match the live preview: portrait UI → tall crop; landscape UI → wide crop.
            let isLandscape = Self.isCaptureLandscape(interfaceIsLandscape: interfaceIsLandscape)
            let record = try await photoStore.saveCapturedPhoto(
                data: data,
                aspectRatio: aspectRatio,
                isLandscape: isLandscape,
                modelContext: modelContext
            )

            let saveToLibrary = UserDefaults.standard.bool(forKey: AppConstants.saveToPhotoLibraryKey)
            if saveToLibrary {
                let url = photoStore.localURL(for: record)
                Task {
                    guard let saved = try? Data(contentsOf: url) else { return }
                    let outcome = await PhotoLibrarySaver.saveIfNeeded(data: saved, enabled: true)
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
            horizon.start()
            if cameraService.authorizationStatus == .authorized {
                cameraService.startSession()
            }
        } else {
            horizon.stop()
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

    /// Prefer the interface layout (what the user sees); fall back to device / screen.
    private static func isCaptureLandscape(interfaceIsLandscape: Bool) -> Bool {
        switch UIDevice.current.orientation {
        case .landscapeLeft, .landscapeRight:
            return true
        case .portrait, .portraitUpsideDown:
            return false
        default:
            if let scene = UIApplication.shared.connectedScenes
                .compactMap({ $0 as? UIWindowScene })
                .first(where: { $0.activationState == .foregroundActive }) {
                switch scene.interfaceOrientation {
                case .landscapeLeft, .landscapeRight:
                    return true
                case .portrait, .portraitUpsideDown:
                    return false
                default:
                    break
                }
            }
            return interfaceIsLandscape
        }
    }
}

private struct FocusReticle: View {
    let locked: Bool
    let exposureBias: Float

    var body: some View {
        HStack(spacing: 10) {
            RoundedRectangle(cornerRadius: 4)
                .stroke(Color.yellow, lineWidth: locked ? 3 : 2)
                .frame(width: 70, height: 70)

            VStack(spacing: 0) {
                Image(systemName: "sun.max.fill")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.yellow)
                    .offset(y: CGFloat(-exposureBias) * 10)
            }
            .frame(width: 20, height: 70)
        }
        .shadow(color: .black.opacity(0.35), radius: 2)
    }
}

private struct HorizonGuideLine: View {
    let tiltDegrees: Double
    let isLevel: Bool

    var body: some View {
        Capsule()
            .fill(isLevel ? Color.yellow : Color.white.opacity(0.85))
            .frame(width: 72, height: isLevel ? 3 : 2)
            .rotationEffect(.degrees(tiltDegrees))
            .shadow(color: .black.opacity(0.35), radius: 1)
    }
}

struct CameraPreviewView: UIViewRepresentable {
    let session: AVCaptureSession
    var onPreviewReady: ((AVCaptureVideoPreviewLayer) -> Void)?
    let onTapToFocus: (CGPoint, CGPoint) -> Void
    let onLongPressLock: (CGPoint, CGPoint) -> Void
    let onPinch: (CGFloat) -> Void
    var onExposureDrag: ((CGFloat) -> Void)?

    func makeCoordinator() -> Coordinator {
        Coordinator(
            onTapToFocus: onTapToFocus,
            onLongPressLock: onLongPressLock,
            onPinch: onPinch,
            onExposureDrag: onExposureDrag
        )
    }

    func makeUIView(context: Context) -> PreviewView {
        let view = PreviewView()
        view.videoPreviewLayer.session = session
        view.videoPreviewLayer.videoGravity = .resizeAspectFill
        context.coordinator.attach(to: view)
        onPreviewReady?(view.videoPreviewLayer)
        return view
    }

    func updateUIView(_ uiView: PreviewView, context: Context) {
        uiView.videoPreviewLayer.session = session
        context.coordinator.onTapToFocus = onTapToFocus
        context.coordinator.onLongPressLock = onLongPressLock
        context.coordinator.onPinch = onPinch
        context.coordinator.onExposureDrag = onExposureDrag
        context.coordinator.exposureEnabled = onExposureDrag != nil
        onPreviewReady?(uiView.videoPreviewLayer)
    }

    final class Coordinator: NSObject, UIGestureRecognizerDelegate {
        var onTapToFocus: (CGPoint, CGPoint) -> Void
        var onLongPressLock: (CGPoint, CGPoint) -> Void
        var onPinch: (CGFloat) -> Void
        var onExposureDrag: ((CGFloat) -> Void)?
        var exposureEnabled = false
        private var lastPinch: CGFloat = 1
        private var lastExposureY: CGFloat?
        private weak var previewView: PreviewView?

        init(
            onTapToFocus: @escaping (CGPoint, CGPoint) -> Void,
            onLongPressLock: @escaping (CGPoint, CGPoint) -> Void,
            onPinch: @escaping (CGFloat) -> Void,
            onExposureDrag: ((CGFloat) -> Void)?
        ) {
            self.onTapToFocus = onTapToFocus
            self.onLongPressLock = onLongPressLock
            self.onPinch = onPinch
            self.onExposureDrag = onExposureDrag
            self.exposureEnabled = onExposureDrag != nil
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

            let pan = UIPanGestureRecognizer(target: self, action: #selector(handlePan(_:)))
            pan.delegate = self
            pan.maximumNumberOfTouches = 1
            view.addGestureRecognizer(pan)
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

        @objc private func handlePan(_ gesture: UIPanGestureRecognizer) {
            guard exposureEnabled, let onExposureDrag else { return }
            let translation = gesture.translation(in: gesture.view)
            if abs(translation.y) < abs(translation.x) * 0.6 {
                return
            }
            switch gesture.state {
            case .began:
                lastExposureY = 0
            case .changed:
                let previous = lastExposureY ?? 0
                let delta = translation.y - previous
                lastExposureY = translation.y
                if abs(delta) > 0.2 {
                    onExposureDrag(delta)
                }
            default:
                lastExposureY = nil
            }
        }

        func gestureRecognizer(
            _ gestureRecognizer: UIGestureRecognizer,
            shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer
        ) -> Bool {
            true
        }

        func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
            if gestureRecognizer is UIPanGestureRecognizer {
                return exposureEnabled
            }
            return true
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
