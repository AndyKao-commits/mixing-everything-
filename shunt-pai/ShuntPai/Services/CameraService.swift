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

enum ZoomPreset: Hashable {
    case ultraWide
    case oneX
    case twoX
    case threeX

    var label: String {
        switch self {
        case .ultraWide: return ".5"
        case .oneX: return "1x"
        case .twoX: return "2"
        case .threeX: return "3"
        }
    }

    var targetFactor: CGFloat {
        switch self {
        case .ultraWide: return 0.5
        case .oneX: return 1
        case .twoX: return 2
        case .threeX: return 3
        }
    }
}

/// Camera hardware runs on `sessionQueue`; UI state is published on the main queue.
final class CameraService: NSObject, ObservableObject, @unchecked Sendable {
    @Published private(set) var isRunning = false
    @Published private(set) var authorizationStatus: AVAuthorizationStatus = .notDetermined
    @Published private(set) var flashMode: AVCaptureDevice.FlashMode = .off
    @Published private(set) var zoomFactor: CGFloat = 1
    @Published private(set) var selectedPreset: ZoomPreset = .oneX
    @Published private(set) var availablePresets: [ZoomPreset] = [.oneX, .twoX]
    @Published private(set) var supportsFlash = false
    @Published var errorMessage: String?

    let session = AVCaptureSession()

    private let sessionQueue = DispatchQueue(label: "com.shuntpai.camera.session")
    private let photoOutput = AVCapturePhotoOutput()
    private var videoInput: AVCaptureDeviceInput?
    private var isConfigured = false
    private var captureContinuation: CheckedContinuation<Data, Error>?
    private var currentPosition: AVCaptureDevice.Position = .back
    private var flashModeValue: AVCaptureDevice.FlashMode = .off

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
                self.publishDeviceState()
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
                self.publishDeviceState()
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

    func applyPreset(_ preset: ZoomPreset) {
        sessionQueue.async { [weak self] in
            guard let self else { return }
            do {
                switch preset {
                case .ultraWide:
                    if let device = self.videoInput?.device,
                       self.currentPosition == .back,
                       device.minAvailableVideoZoomFactor <= 0.5 {
                        self.setZoomFactorLocked(0.5, preset: .ultraWide)
                    } else {
                        try self.switchToDeviceType(
                            .builtInUltraWideCamera,
                            position: .back,
                            displayFactor: 1,
                            preset: .ultraWide
                        )
                    }

                case .oneX, .twoX, .threeX:
                    if self.currentPosition == .back {
                        let onUltraWideOnly = self.videoInput?.device.deviceType == .builtInUltraWideCamera
                        if onUltraWideOnly {
                            let preferredType = self.preferredBackDeviceType()
                            try self.switchToDeviceType(
                                preferredType,
                                position: .back,
                                displayFactor: preset.targetFactor,
                                preset: preset
                            )
                        } else {
                            self.setZoomFactorLocked(preset.targetFactor, preset: preset)
                        }
                    } else {
                        self.setZoomFactorLocked(1, preset: .oneX)
                    }
                }

                self.publishDeviceState()
            } catch {
                self.publishOnMain { $0.errorMessage = error.localizedDescription }
            }
        }
    }

    func bumpZoom(by scale: CGFloat) {
        sessionQueue.async { [weak self] in
            guard let self, let device = self.videoInput?.device else { return }
            self.setZoomFactorLocked(device.videoZoomFactor * scale, preset: nil)
            self.publishDeviceState()
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

    // MARK: - Session queue only

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

        setZoomFactorLocked(1, preset: .oneX)
    }

    private func preferredBackDeviceType() -> AVCaptureDevice.DeviceType {
        if AVCaptureDevice.default(.builtInTripleCamera, for: .video, position: .back) != nil {
            return .builtInTripleCamera
        }
        if AVCaptureDevice.default(.builtInDualWideCamera, for: .video, position: .back) != nil {
            return .builtInDualWideCamera
        }
        return .builtInWideAngleCamera
    }

    private func preferredDevice(for position: AVCaptureDevice.Position) throws -> AVCaptureDevice {
        if position == .back {
            let type = preferredBackDeviceType()
            if let device = AVCaptureDevice.default(type, for: .video, position: .back) {
                return device
            }
        } else if let front = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front) {
            return front
        }
        throw CameraServiceError.unavailable
    }

    private func switchToDeviceType(
        _ type: AVCaptureDevice.DeviceType,
        position: AVCaptureDevice.Position,
        displayFactor: CGFloat,
        preset: ZoomPreset
    ) throws {
        guard let device = AVCaptureDevice.default(type, for: .video, position: position)
            ?? AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: position)
        else {
            throw CameraServiceError.unavailable
        }

        let input = try AVCaptureDeviceInput(device: device)
        session.beginConfiguration()
        if let current = videoInput {
            session.removeInput(current)
        }
        if session.canAddInput(input) {
            session.addInput(input)
            videoInput = input
            currentPosition = position
        }
        session.commitConfiguration()
        setZoomFactorLocked(max(displayFactor, device.minAvailableVideoZoomFactor), preset: preset)
    }

    private func setZoomFactorLocked(_ factor: CGFloat, preset: ZoomPreset?) {
        guard let device = videoInput?.device else { return }
        let minZoom = device.minAvailableVideoZoomFactor
        let maxZoom = min(device.maxAvailableVideoZoomFactor, 12)
        let clamped = min(max(factor, minZoom), maxZoom)

        do {
            try device.lockForConfiguration()
            device.videoZoomFactor = clamped
            device.unlockForConfiguration()

            let resolvedPreset = preset ?? Self.nearestPreset(for: clamped, position: currentPosition)
            publishOnMain {
                $0.zoomFactor = clamped
                $0.selectedPreset = resolvedPreset
            }
        } catch {
            publishOnMain { $0.errorMessage = error.localizedDescription }
        }
    }

    private func publishDeviceState() {
        guard let device = videoInput?.device else { return }

        var presets: [ZoomPreset] = [.oneX]
        if currentPosition == .back {
            if AVCaptureDevice.default(.builtInUltraWideCamera, for: .video, position: .back) != nil {
                presets.insert(.ultraWide, at: 0)
            }
            if device.maxAvailableVideoZoomFactor >= 2 {
                presets.append(.twoX)
            }
            if device.maxAvailableVideoZoomFactor >= 3 {
                presets.append(.threeX)
            }
        }

        let flash = device.hasFlash
        let factor = device.videoZoomFactor

        publishOnMain {
            $0.availablePresets = presets
            $0.supportsFlash = flash
            $0.zoomFactor = factor
        }
    }

    private func publishOnMain(_ update: @escaping (CameraService) -> Void) {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            update(self)
        }
    }

    private static func nearestPreset(for factor: CGFloat, position: AVCaptureDevice.Position) -> ZoomPreset {
        if position == .back, factor < 0.75 { return .ultraWide }
        if abs(factor - 2) < abs(factor - 3) && abs(factor - 2) < abs(factor - 1) { return .twoX }
        if abs(factor - 3) <= abs(factor - 2) && factor >= 2.5 { return .threeX }
        return .oneX
    }
}

extension CameraService: AVCapturePhotoCaptureDelegate {
    nonisolated func photoOutput(
        _ output: AVCapturePhotoOutput,
        didFinishProcessingPhoto photo: AVCapturePhoto,
        error: Error?
    ) {
        // Keep continuation resume on the same session queue that started capture.
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
