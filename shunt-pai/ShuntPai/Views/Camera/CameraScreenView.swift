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
    @StateObject private var chromeOrientation = ChromeOrientation()

    @Query(sort: \PhotoRecord.capturedAt, order: .reverse) private var records: [PhotoRecord]
    @Query(sort: \TagRecord.createdAt, order: .forward) private var tags: [TagRecord]

    @State private var isCapturing = false
    @State private var pendingSaves = 0
    @State private var toast: String?
    @State private var toastToken = UUID()
    @State private var latestThumbnail: UIImage?
    @State private var aspectRatio: AppConstants.CaptureAspectRatio = .sixteenNine
    /// Session-only capture tag. Resets to nil on process relaunch.
    @State private var selectedTagID: UUID?

    private var chromeAngle: Angle { chromeOrientation.angle }

    var body: some View {
        GeometryReader { geo in
            // UI stays portrait-locked (native Camera). Preview fills the tall frame.
            let previewArea = previewContentSize(in: geo.size)

            ZStack {
                Color.black.ignoresSafeArea()

                previewStage(previewSize: previewArea)
                    .frame(width: previewArea.width, height: previewArea.height)

                VStack(spacing: 0) {
                    topChrome
                        .padding(.horizontal, 18)
                        .padding(.top, 8)

                    Spacer(minLength: 0)

                    bottomChrome
                        .padding(.top, 10)
                        .padding(.bottom, 8)
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
                        .chromeUpright(chromeAngle)
                        .padding(.bottom, 180)
                        .frame(maxHeight: .infinity, alignment: .bottom)
                        .allowsHitTesting(false)
                }
            }
            .onAppear {
                horizon.setInterfaceLandscape(false)
                chromeOrientation.start()
            }
            .onDisappear {
                chromeOrientation.stop()
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
        .onChange(of: tags.map(\.id)) { _, ids in
            if let selectedTagID, !ids.contains(selectedTagID) {
                self.selectedTagID = nil
            }
        }
        .statusBarHidden(true)
        .persistentSystemOverlays(.hidden)
        .preferredColorScheme(.dark)
    }

    private var selectedTagName: String {
        guard let selectedTagID,
              let tag = tags.first(where: { $0.id == selectedTagID }) else {
            return "無標籤"
        }
        return tag.name
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
                        .chromeUpright(chromeAngle)
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
                    .chromeUpright(chromeAngle)
            }
            .buttonStyle(.plain)

            Spacer()

            Menu {
                Button {
                    selectedTagID = nil
                } label: {
                    Label("無標籤", systemImage: selectedTagID == nil ? "checkmark" : "tag.slash")
                }
                if !tags.isEmpty {
                    Divider()
                    ForEach(tags) { tag in
                        Button {
                            selectedTagID = tag.id
                        } label: {
                            Label(
                                tag.name,
                                systemImage: selectedTagID == tag.id ? "checkmark" : "tag"
                            )
                        }
                    }
                }
            } label: {
                HStack(spacing: 4) {
                    Image(systemName: "tag.fill")
                        .font(.caption.weight(.semibold))
                    Text(selectedTagName)
                        .font(.caption.weight(.semibold))
                        .lineLimit(1)
                }
                .foregroundStyle(selectedTagID == nil ? .white.opacity(0.85) : .yellow)
                .padding(.horizontal, 10)
                .padding(.vertical, 7)
                .background(Capsule().fill(Color.white.opacity(0.12)))
                .chromeUpright(chromeAngle)
            }
            .buttonStyle(.plain)
        }
    }

    /// Portrait 16:9 → tall 9:16 full-bleed (native-style). Chrome overlays the frame.
    private func previewContentSize(in size: CGSize) -> CGSize {
        let targetWH = aspectRatio.uprightWidthOverHeight(isLandscape: false)
        let availableWH = size.width / max(size.height, 1)

        if availableWH > targetWH {
            let height = size.height
            return CGSize(width: height * targetWH, height: height)
        } else {
            let width = size.width
            var height = width / max(targetWH, 0.01)
            // Prefer near full-screen for 16:9 — stretch to screen height when close.
            if aspectRatio == .sixteenNine, height < size.height {
                height = size.height
            }
            return CGSize(width: width, height: min(height, size.height))
        }
    }

    private func previewStage(previewSize: CGSize) -> some View {
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
                    onExposureDrag: cameraService.focusPoint == nil ? nil : { deltaUp in
                        // deltaUp is gravity-upward pixels (landscape → true vertical).
                        cameraService.adjustExposure(by: Float(deltaUp / 140))
                    },
                    exposureUprightDegrees: chromeAngle.degrees
                )
                .frame(width: previewSize.width, height: previewSize.height)
                .clipped()

                if horizon.shouldShow {
                    HorizonGuideLine(
                        tiltDegrees: horizon.tiltDegrees,
                        uprightAngle: chromeAngle,
                        isLevel: horizon.isLevel
                    )
                    .frame(width: previewSize.width, height: previewSize.height)
                    .transition(.opacity)
                    .allowsHitTesting(false)
                }

                if let focusPoint = cameraService.focusPoint {
                    FocusReticle(
                        locked: cameraService.isAEAFLocked,
                        exposureBias: cameraService.exposureBias
                    )
                    .chromeUpright(chromeAngle)
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
                        .chromeUpright(chromeAngle)
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

    private var bottomChrome: some View {
        VStack(spacing: 16) {
            if cameraService.authorizationStatus == .authorized {
                zoomControls

                if !entitlements.isPaid {
                    Text("免費 \(records.count)/\(AppConstants.freePhotoLimit)")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(.white.opacity(0.7))
                        .chromeUpright(chromeAngle)
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
                        .chromeUpright(chromeAngle)
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
                            .chromeUpright(chromeAngle)
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
                    .chromeUpright(chromeAngle)
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
                    Text(zoomLabel(for: option))
                        .font(.caption.weight(.bold))
                        .foregroundStyle(isZoomSelected(option) ? .black : .white)
                        .frame(width: 44, height: 44)
                        .background(
                            Circle().fill(
                                isZoomSelected(option)
                                ? Color.yellow
                                : Color.black.opacity(0.35)
                            )
                        )
                        // Keep pill position; only turn the glyph upright with gravity.
                        .chromeUpright(chromeAngle)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(Capsule().fill(Color.black.opacity(0.28)))
    }

    private func isZoomSelected(_ option: ZoomOption) -> Bool {
        cameraService.selectedZoomID == option.id
    }

    private func zoomLabel(for option: ZoomOption) -> String {
        guard isZoomSelected(option) else { return option.label }
        let display = cameraService.displayZoom
        // While pinching past a preset, show the live factor (e.g. 4.2× … up to 17×).
        if abs(display - 1) < 0.05, option.id == "1x" { return "1×" }
        if display >= 1.05 || display <= 0.95 {
            if display >= 10 {
                return String(format: "%.0f×", display)
            }
            return String(format: "%.1f×", display)
        }
        return option.label
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
        guard entitlements.canCaptureMore(currentCount: records.count + pendingSaves) else {
            showToast("免費版最多 \(AppConstants.freePhotoLimit) 張")
            return
        }
        guard !isCapturing else { return }

        isCapturing = true
        pendingSaves += 1
        let isLandscapeHold = chromeOrientation.isLandscapeHold
        let ratio = aspectRatio
        let tagID = selectedTagID
        let saveToLibrary = UserDefaults.standard.bool(forKey: AppConstants.saveToPhotoLibraryKey)

        do {
            let data = try await cameraService.capturePhoto()
            // Unlock shutter as soon as JPEG bytes arrive — persist in the background.
            isCapturing = false

            Task {
                defer { pendingSaves = max(0, pendingSaves - 1) }
                do {
                    let record = try await photoStore.saveCapturedPhoto(
                        data: data,
                        aspectRatio: ratio,
                        isLandscape: isLandscapeHold,
                        modelContext: modelContext
                    )
                    if let tagID, let tag = tags.first(where: { $0.id == tagID }) {
                        if !record.tags.contains(where: { $0.id == tag.id }) {
                            record.tags.append(tag)
                            try modelContext.save()
                        }
                    }
                    if saveToLibrary {
                        let url = photoStore.localURL(for: record)
                        guard let saved = try? Data(contentsOf: url) else { return }
                        let outcome = await PhotoLibrarySaver.saveIfNeeded(data: saved, enabled: true)
                        if outcome == .denied {
                            showToast("系統相簿權限未開啟")
                        }
                    }
                } catch {
                    showToast(error.localizedDescription)
                }
            }
        } catch {
            isCapturing = false
            pendingSaves = max(0, pendingSaves - 1)
            showToast(error.localizedDescription)
        }
    }

    private func setCameraActive(_ active: Bool) {
        UIApplication.shared.isIdleTimerDisabled = active
        if active {
            horizon.start()
            chromeOrientation.start()
            if cameraService.authorizationStatus == .authorized {
                cameraService.startSession()
            }
        } else {
            horizon.stop()
            chromeOrientation.stop()
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
    let uprightAngle: Angle
    let isLevel: Bool

    var body: some View {
        // Capsule is drawn level in portrait coords; add chrome upright angle so that
        // when the phone is tilted, the guide stays gravity-horizontal (not phone-horizontal).
        Capsule()
            .fill(isLevel ? Color.yellow : Color.white.opacity(0.85))
            .frame(width: 72, height: isLevel ? 3 : 2)
            .rotationEffect(uprightAngle + .degrees(tiltDegrees))
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
    /// Chrome upright angle in degrees (0 portrait, ±90 landscape). Maps pan to gravity-up.
    var exposureUprightDegrees: Double = 0

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
        context.coordinator.exposureUprightDegrees = exposureUprightDegrees
        onPreviewReady?(uiView.videoPreviewLayer)
    }

    final class Coordinator: NSObject, UIGestureRecognizerDelegate {
        var onTapToFocus: (CGPoint, CGPoint) -> Void
        var onLongPressLock: (CGPoint, CGPoint) -> Void
        var onPinch: (CGFloat) -> Void
        var onExposureDrag: ((CGFloat) -> Void)?
        var exposureEnabled = false
        var exposureUprightDegrees: Double = 0
        private var lastPinch: CGFloat = 1
        private var lastUpward: CGFloat?
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
            let radians = exposureUprightDegrees * .pi / 180
            // Gravity-up component in portrait-locked view coords (UIKit y grows down).
            let upward = translation.x * sin(radians) - translation.y * cos(radians)

            // Prefer motion along the upright axis (reject mostly sideways swipes).
            let sideways = translation.x * cos(radians) + translation.y * sin(radians)
            if abs(upward) < abs(sideways) * 0.6 {
                return
            }

            switch gesture.state {
            case .began:
                lastUpward = 0
            case .changed:
                let previous = lastUpward ?? 0
                let delta = upward - previous
                lastUpward = upward
                if abs(delta) > 0.2 {
                    onExposureDrag(delta)
                }
            default:
                lastUpward = nil
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
