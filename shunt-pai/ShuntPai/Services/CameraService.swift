@preconcurrency import AVFoundation
import Foundation
import UIKit

enum CameraServiceError: LocalizedError {
    case unavailable
    case permissionDenied
    case captureFailed

    var errorDescription: String? {
        switch self {
        case .unavailable: return "此裝置無法使用相機。"
        case .permissionDenied: return "請在設定中允許分流拍使用相機。"
        case .captureFailed: return "拍照失敗，請再試一次。"
        }
    }
}

struct ZoomOption: Hashable, Identifiable {
    let id: String
    let label: String
    let deviceFactor: CGFloat
}

/// Camera hardware runs on `sessionQueue`; UI state is published on the main queue.
final class CameraService: NSObject, ObservableObject, @unchecked Sendable {
    @Published private(set) var isRunning = false
    @Published private(set) var authorizationStatus: AVAuthorizationStatus = .notDetermined
    @Published private(set) var flashMode: AVCaptureDevice.FlashMode = .off
    @Published private(set) var displayZoom: CGFloat = 1
    @Published private(set) var selectedZoomID: String = "1x"
    @Published private(set) var zoomOptions: [ZoomOption] = [ZoomOption(id: "1x", label: "1x", deviceFactor: 1)]
    @Published private(set) var supportsFlash = false
    @Published private(set) var focusPoint: CGPoint?
    @Published private(set) var isAEAFLocked = false
    @Published private(set) var exposureBias: Float = 0
    @Published private(set) var minExposureBias: Float = -2
    @Published private(set) var maxExposureBias: Float = 2
    @Published var errorMessage: String?

    let session = AVCaptureSession()

    private let sessionQueue = DispatchQueue(label: "com.shuntpai.camera.session")
    private let photoOutput = AVCapturePhotoOutput()
    private var videoInput: AVCaptureDeviceInput?
    private var isConfigured = false
    private var captureContinuation: CheckedContinuation<Data, Error>?
    private var currentPosition: AVCaptureDevice.Position = .back
    private var flashModeValue: AVCaptureDevice.FlashMode = .off
    private var baselineZoom: CGFloat = 1
    private var aeafLocked = false
    private var subjectAreaObserver: NSObjectProtocol?

    override init() {
        super.init()
        authorizationStatus = AVCaptureDevice.authorizationStatus(for: .video)
    }

    @MainActor
    func requestPermissionIfNeeded() async -> Bool {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            authorizationStatus = .authorized
            return true
        case .notDetermined:
            let granted = await AVCaptureDevice.requestAccess(for: .video)
            authorizationStatus = granted ? .authorized : .denied
            return granted
        case .denied, .restricted:
            authorizationStatus = .denied
            return false
        @unknown default:
            return false
        }
    }

    @MainActor
    func refreshAuthorizationStatus() {
        authorizationStatus = AVCaptureDevice.authorizationStatus(for: .video)
    }

    func startSession() {
        sessionQueue.async { [weak self] in
            guard let self else { return }
            guard AVCaptureDevice.authorizationStatus(for: .video) == .authorized else { return }

            do {
                if !self.isConfigured {
                    try self.configureSessionLocked(position: .back)
                    self.isConfigured = true
                    self.refreshZoomMetadata()
                }
                if !self.session.isRunning {
                    self.session.startRunning()
                }
                self.publishOnMain { $0.isRunning = true }
            } catch {
                self.publishOnMain { $0.errorMessage = error.localizedDescription }
            }
        }
    }

    func stopSession() {
        sessionQueue.async { [weak self] in
            guard let self else { return }
            if let pending = self.captureContinuation {
                pending.resume(throwing: CameraServiceError.captureFailed)
                self.captureContinuation = nil
            }
            guard self.session.isRunning else { return }
            self.session.stopRunning()
            self.publishOnMain { $0.isRunning = false }
        }
    }

    func switchCamera() {
        sessionQueue.async { [weak self] in
            guard let self else { return }
            let newPosition: AVCaptureDevice.Position = self.currentPosition == .back ? .front : .back
            do {
                try self.configureSessionLocked(position: newPosition)
                self.refreshZoomMetadata()
            } catch {
                self.publishOnMain { $0.errorMessage = error.localizedDescription }
            }
        }
    }

    func toggleFlash() {
        sessionQueue.async { [weak self] in
            guard let self else { return }
            guard let device = self.videoInput?.device, device.hasFlash else { return }
            let next: AVCaptureDevice.FlashMode = self.flashModeValue == .off ? .on : .off
            self.flashModeValue = next
            self.publishOnMain { $0.flashMode = next }
        }
    }

    func applyZoomOption(_ option: ZoomOption) {
        sessionQueue.async { [weak self] in
            guard let self else { return }
            self.setDeviceZoom(option.deviceFactor, animated: true)
            let baseline = self.baselineZoom
            self.publishOnMain {
                $0.selectedZoomID = option.id
                $0.displayZoom = option.deviceFactor / max(baseline, 0.01)
            }
        }
    }

    func bumpZoom(by scale: CGFloat) {
        sessionQueue.async { [weak self] in
            guard let self, let device = self.videoInput?.device else { return }
            self.setDeviceZoom(device.videoZoomFactor * scale, animated: false)
            self.syncPublishedZoom(from: device)
        }
    }

    func focusAndExpose(at devicePoint: CGPoint) {
        sessionQueue.async { [weak self] in
            guard let self, let device = self.videoInput?.device else { return }
            self.aeafLocked = false
            do {
                try device.lockForConfiguration()
                if device.isFocusPointOfInterestSupported {
                    device.focusPointOfInterest = devicePoint
                    if device.isFocusModeSupported(.autoFocus) {
                        device.focusMode = .autoFocus
                    }
                }
                if device.isExposurePointOfInterestSupported {
                    device.exposurePointOfInterest = devicePoint
                    if device.isExposureModeSupported(.autoExpose) {
                        device.exposureMode = .autoExpose
                    }
                }
                device.isSubjectAreaChangeMonitoringEnabled = true
                device.unlockForConfiguration()
                self.publishOnMain {
                    $0.isAEAFLocked = false
                    $0.exposureBias = device.exposureTargetBias
                }
            } catch {
                self.publishOnMain { $0.errorMessage = error.localizedDescription }
            }
        }
    }

    func lockFocusAndExposure(at devicePoint: CGPoint) {
        sessionQueue.async { [weak self] in
            guard let self, let device = self.videoInput?.device else { return }
            do {
                try device.lockForConfiguration()
                if device.isFocusPointOfInterestSupported {
                    device.focusPointOfInterest = devicePoint
                    if device.isFocusModeSupported(.autoFocus) {
                        device.focusMode = .autoFocus
                    }
                }
                if device.isExposurePointOfInterestSupported {
                    device.exposurePointOfInterest = devicePoint
                    if device.isExposureModeSupported(.autoExpose) {
                        device.exposureMode = .autoExpose
                    }
                }
                device.isSubjectAreaChangeMonitoringEnabled = false
                device.unlockForConfiguration()

                // After AF settles, lock both.
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) { [weak self] in
                    self?.sessionQueue.async {
                        self?.finishAEAFLock()
                    }
                }
            } catch {
                self.publishOnMain { $0.errorMessage = error.localizedDescription }
            }
        }
    }

    func setExposureBias(_ value: Float) {
        sessionQueue.async { [weak self] in
            guard let self, let device = self.videoInput?.device else { return }
            let clamped = min(max(value, device.minExposureTargetBias), device.maxExposureTargetBias)
            if abs(device.exposureTargetBias - clamped) < 0.01 { return }
            do {
                try device.lockForConfiguration()
                device.setExposureTargetBias(clamped, completionHandler: nil)
                device.unlockForConfiguration()
                self.publishOnMain { $0.exposureBias = clamped }
            } catch {
                self.publishOnMain { $0.errorMessage = error.localizedDescription }
            }
        }
    }

    func unlockFocusToContinuous() {
        sessionQueue.async { [weak self] in
            guard let self, let device = self.videoInput?.device else { return }
            self.aeafLocked = false
            self.applyContinuousAutoFocusLocked(on: device)
            self.publishOnMain {
                $0.isAEAFLocked = false
                $0.focusPoint = nil
            }
        }
    }

    func showFocusIndicator(at viewPoint: CGPoint, locked: Bool) {
        publishOnMain { service in
            service.focusPoint = viewPoint
            service.isAEAFLocked = locked
        }
        // Locked AF/AE stays until the user taps again. Unlocked only fades after a pause.
        guard !locked else { return }
        DispatchQueue.main.asyncAfter(deadline: .now() + 5.0) { [weak self] in
            self?.publishOnMain { service in
                if service.focusPoint == viewPoint, !service.isAEAFLocked {
                    service.focusPoint = nil
                }
            }
        }
    }

    func refreshMirroring() {
        sessionQueue.async { [weak self] in
            self?.applyMirroringLocked()
        }
    }

    func capturePhoto() async throws -> Data {
        try await withCheckedThrowingContinuation { continuation in
            sessionQueue.async { [weak self] in
                guard let self else {
                    continuation.resume(throwing: CameraServiceError.captureFailed)
                    return
                }

                guard self.session.isRunning else {
                    continuation.resume(throwing: CameraServiceError.captureFailed)
                    return
                }

                if self.captureContinuation != nil {
                    continuation.resume(throwing: CameraServiceError.captureFailed)
                    return
                }

                self.captureContinuation = continuation

                let settings: AVCapturePhotoSettings
                if self.photoOutput.availablePhotoCodecTypes.contains(.jpeg) {
                    settings = AVCapturePhotoSettings(format: [AVVideoCodecKey: AVVideoCodecType.jpeg])
                } else {
                    settings = AVCapturePhotoSettings()
                }
                if let device = self.videoInput?.device,
                   device.hasFlash,
                   self.photoOutput.supportedFlashModes.contains(self.flashModeValue) {
                    settings.flashMode = self.flashModeValue
                }
                settings.photoQualityPrioritization = self.photoOutput.maxPhotoQualityPrioritization

                self.photoOutput.capturePhoto(with: settings, delegate: self)
            }
        }
    }

    // MARK: - Session queue

    private func configureSessionLocked(position: AVCaptureDevice.Position) throws {
        session.beginConfiguration()

        session.sessionPreset = .photo
        session.inputs.forEach { session.removeInput($0) }
        session.outputs.forEach { session.removeOutput($0) }

        let device = try preferredDevice(for: position)
        let input = try AVCaptureDeviceInput(device: device)
        guard session.canAddInput(input) else {
            session.commitConfiguration()
            throw CameraServiceError.unavailable
        }
        session.addInput(input)
        videoInput = input
        currentPosition = position

        if session.canAddOutput(photoOutput) {
            session.addOutput(photoOutput)
            photoOutput.maxPhotoQualityPrioritization = .quality
        }

        session.commitConfiguration()

        baselineZoom = Self.oneXFactor(for: device)
        setDeviceZoom(baselineZoom, animated: false)
        applyContinuousAutoFocusLocked(on: device)
        observeSubjectAreaChanges()
        applyMirroringLocked()
        aeafLocked = false
        publishOnMain {
            $0.isAEAFLocked = false
            $0.exposureBias = 0
            $0.minExposureBias = device.minExposureTargetBias
            $0.maxExposureBias = device.maxExposureTargetBias
        }
    }

    private func applyMirroringLocked() {
        let shouldMirror = currentPosition == .front && AppConstants.isFrontCameraMirrored
        for connection in session.connections where connection.isVideoMirroringSupported {
            connection.automaticallyAdjustsVideoMirroring = false
            connection.isVideoMirrored = shouldMirror
        }
        for connection in photoOutput.connections where connection.isVideoMirroringSupported {
            connection.automaticallyAdjustsVideoMirroring = false
            connection.isVideoMirrored = shouldMirror
        }
    }

    private func preferredDevice(for position: AVCaptureDevice.Position) throws -> AVCaptureDevice {
        if position == .back {
            if let triple = AVCaptureDevice.default(.builtInTripleCamera, for: .video, position: .back) {
                return triple
            }
            if let dualWide = AVCaptureDevice.default(.builtInDualWideCamera, for: .video, position: .back) {
                return dualWide
            }
            if let dual = AVCaptureDevice.default(.builtInDualCamera, for: .video, position: .back) {
                return dual
            }
            if let wide = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) {
                return wide
            }
        } else if let front = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front) {
            return front
        }
        throw CameraServiceError.unavailable
    }

    private func setDeviceZoom(_ factor: CGFloat, animated: Bool) {
        guard let device = videoInput?.device else { return }
        let minZoom = device.minAvailableVideoZoomFactor
        let maxZoom = min(device.maxAvailableVideoZoomFactor, 15)
        let clamped = min(max(factor, minZoom), maxZoom)

        do {
            try device.lockForConfiguration()
            if animated {
                device.ramp(toVideoZoomFactor: clamped, withRate: 8)
            } else {
                device.videoZoomFactor = clamped
            }
            device.unlockForConfiguration()
        } catch {
            publishOnMain { $0.errorMessage = error.localizedDescription }
        }
    }

    private func refreshZoomMetadata() {
        guard let device = videoInput?.device else { return }
        baselineZoom = Self.oneXFactor(for: device)
        let options = Self.makeZoomOptions(for: device, baseline: baselineZoom)
        setDeviceZoom(baselineZoom, animated: false)
        publishOnMain {
            $0.zoomOptions = options
            $0.selectedZoomID = "1x"
            $0.displayZoom = 1
            $0.supportsFlash = device.hasFlash
        }
    }

    private func syncPublishedZoom(from device: AVCaptureDevice) {
        let display = device.videoZoomFactor / max(baselineZoom, 0.01)
        let options = Self.makeZoomOptions(for: device, baseline: baselineZoom)
        let matched = options.min { lhs, rhs in
            abs(lhs.deviceFactor - device.videoZoomFactor) < abs(rhs.deviceFactor - device.videoZoomFactor)
        }
        let matchThreshold = max(0.2, baselineZoom * 0.08)
        let currentFactor = device.videoZoomFactor
        publishOnMain {
            $0.displayZoom = display
            $0.zoomOptions = options
            if let matched, abs(matched.deviceFactor - currentFactor) < matchThreshold {
                $0.selectedZoomID = matched.id
            }
        }
    }

    private func publishOnMain(_ update: @escaping (CameraService) -> Void) {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            update(self)
        }
    }

    /// Wide camera optical baseline (often 2.0 on dual-wide / triple cameras).
    private static func oneXFactor(for device: AVCaptureDevice) -> CGFloat {
        let switchOvers = device.virtualDeviceSwitchOverVideoZoomFactors.map { CGFloat(truncating: $0) }
        if let first = switchOvers.first {
            return first
        }
        return max(device.minAvailableVideoZoomFactor, 1)
    }

    private static func makeZoomOptions(for device: AVCaptureDevice, baseline: CGFloat) -> [ZoomOption] {
        var options: [ZoomOption] = []
        let minZoom = device.minAvailableVideoZoomFactor
        let maxZoom = device.maxAvailableVideoZoomFactor

        if minZoom < baseline - 0.05 {
            options.append(ZoomOption(id: "0.5", label: "0.5", deviceFactor: minZoom))
        }

        options.append(ZoomOption(id: "1x", label: "1×", deviceFactor: baseline))

        let two = baseline * 2
        if maxZoom >= two {
            options.append(ZoomOption(id: "2", label: "2", deviceFactor: two))
        }

        let three = baseline * 3
        if maxZoom >= three {
            options.append(ZoomOption(id: "3", label: "3", deviceFactor: three))
        }

        return options
    }

    private func applyContinuousAutoFocusLocked(on device: AVCaptureDevice) {
        do {
            try device.lockForConfiguration()
            if device.isFocusModeSupported(.continuousAutoFocus) {
                device.focusMode = .continuousAutoFocus
            }
            if device.isExposureModeSupported(.continuousAutoExposure) {
                device.exposureMode = .continuousAutoExposure
            }
            device.isSubjectAreaChangeMonitoringEnabled = true
            device.unlockForConfiguration()
        } catch {
            publishOnMain { $0.errorMessage = error.localizedDescription }
        }
    }

    private func finishAEAFLock() {
        guard let device = videoInput?.device else { return }
        do {
            try device.lockForConfiguration()
            if device.isFocusModeSupported(.locked) {
                device.focusMode = .locked
            }
            if device.isExposureModeSupported(.locked) {
                device.exposureMode = .locked
            }
            device.isSubjectAreaChangeMonitoringEnabled = false
            device.unlockForConfiguration()
            aeafLocked = true
            publishOnMain { $0.isAEAFLocked = true }
        } catch {
            publishOnMain { $0.errorMessage = error.localizedDescription }
        }
    }

    private func observeSubjectAreaChanges() {
        if let subjectAreaObserver {
            NotificationCenter.default.removeObserver(subjectAreaObserver)
            self.subjectAreaObserver = nil
        }

        guard let device = videoInput?.device else { return }
        subjectAreaObserver = NotificationCenter.default.addObserver(
            forName: .AVCaptureDeviceSubjectAreaDidChange,
            object: device,
            queue: nil
        ) { [weak self] _ in
            self?.sessionQueue.async {
                guard let self, !self.aeafLocked, let device = self.videoInput?.device else { return }
                self.applyContinuousAutoFocusLocked(on: device)
            }
        }
    }

    deinit {
        if let subjectAreaObserver {
            NotificationCenter.default.removeObserver(subjectAreaObserver)
        }
    }
}

extension CameraService: AVCapturePhotoCaptureDelegate {
    nonisolated func photoOutput(
        _ output: AVCapturePhotoOutput,
        didFinishProcessingPhoto photo: AVCapturePhoto,
        error: Error?
    ) {
        let photoData = photo.fileDataRepresentation()
        let didFail = error != nil
        sessionQueue.async { [weak self] in
            guard let self else { return }

            if didFail {
                self.captureContinuation?.resume(throwing: CameraServiceError.captureFailed)
                self.captureContinuation = nil
                return
            }

            guard let photoData else {
                self.captureContinuation?.resume(throwing: CameraServiceError.captureFailed)
                self.captureContinuation = nil
                return
            }

            self.captureContinuation?.resume(returning: photoData)
            self.captureContinuation = nil
        }
    }
}
