import AVFoundation
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

    func startSession() {
        sessionQueue.async { [weak self] in
            guard let self else { return }
            guard AVCaptureDevice.authorizationStatus(for: .video) == .authorized else { return }

            do {
                if !self.isConfigured {
                    try self.configureSessionLocked(position: .back)
                    self.isConfigured = true
                }
                if !self.session.isRunning {
                    self.session.startRunning()
                }
                self.refreshZoomMetadata()
                self.publishOnMain { $0.isRunning = true }
            } catch {
                self.publishOnMain { $0.errorMessage = error.localizedDescription }
            }
        }
    }

    func stopSession() {
        sessionQueue.async { [weak self] in
            guard let self, self.session.isRunning else { return }
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
            self.publishOnMain {
                $0.selectedZoomID = option.id
                $0.displayZoom = option.deviceFactor / max(self.baselineZoom, 0.01)
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
        guard !locked else { return }
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.4) { [weak self] in
            self?.publishOnMain { service in
                if service.focusPoint == viewPoint, !service.isAEAFLocked {
                    service.focusPoint = nil
                }
            }
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

                self.captureContinuation = continuation

                let settings = AVCapturePhotoSettings()
                if let device = self.videoInput?.device,
                   device.hasFlash,
                   self.photoOutput.supportedFlashModes.contains(self.flashModeValue) {
                    settings.flashMode = self.flashModeValue
                }

                self.photoOutput.capturePhoto(with: settings, delegate: self)
            }
        }
    }

    // MARK: - Session queue

    private func configureSessionLocked(position: AVCaptureDevice.Position) throws {
        session.beginConfiguration()
        defer { session.commitConfiguration() }

        session.sessionPreset = .photo
        session.inputs.forEach { session.removeInput($0) }
        session.outputs.forEach { session.removeOutput($0) }

        let device = try preferredDevice(for: position)
        let input = try AVCaptureDeviceInput(device: device)
        guard session.canAddInput(input) else {
            throw CameraServiceError.unavailable
        }
        session.addInput(input)
        videoInput = input
        currentPosition = position

        if session.canAddOutput(photoOutput) {
            session.addOutput(photoOutput)
            photoOutput.maxPhotoQualityPrioritization = .quality
        }

        baselineZoom = Self.oneXFactor(for: device)
        setDeviceZoom(baselineZoom, animated: false)
        applyContinuousAutoFocusLocked(on: device)
        observeSubjectAreaChanges()
        aeafLocked = false
        publishOnMain {
            $0.isAEAFLocked = false
            $0.exposureBias = 0
            $0.minExposureBias = device.minExposureTargetBias
            $0.maxExposureBias = device.maxExposureTargetBias
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
        publishOnMain {
            $0.displayZoom = display
            $0.zoomOptions = options
            if let matched, abs(matched.deviceFactor - device.videoZoomFactor) < max(0.2, baselineZoom * 0.08) {
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
            options.append(ZoomOption(id: "0.5", label: ".5", deviceFactor: minZoom))
        }

        options.append(ZoomOption(id: "1x", label: "1x", deviceFactor: baseline))

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

        subjectAreaObserver = NotificationCenter.default.addObserver(
            forName: .AVCaptureDeviceSubjectAreaDidChange,
            object: nil,
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
        sessionQueue.async { [weak self] in
            guard let self else { return }

            if let error {
                self.captureContinuation?.resume(throwing: error)
                self.captureContinuation = nil
                return
            }

            guard let data = photo.fileDataRepresentation() else {
                self.captureContinuation?.resume(throwing: CameraServiceError.captureFailed)
                self.captureContinuation = nil
                return
            }

            self.captureContinuation?.resume(returning: data)
            self.captureContinuation = nil
        }
    }
}
