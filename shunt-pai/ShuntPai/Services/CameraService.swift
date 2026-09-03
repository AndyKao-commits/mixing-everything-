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

@MainActor
final class CameraService: NSObject, ObservableObject {
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

    override init() {
        super.init()
        authorizationStatus = AVCaptureDevice.authorizationStatus(for: .video)
    }

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
        guard authorizationStatus == .authorized else { return }

        sessionQueue.async {
            do {
                if !self.isConfigured {
                    try self.configureSessionLocked(position: .back)
                    self.isConfigured = true
                }
                if !self.session.isRunning {
                    self.session.startRunning()
                }
                self.publishDeviceState()
                DispatchQueue.main.async {
                    self.isRunning = true
                }
            } catch {
                DispatchQueue.main.async {
                    self.errorMessage = error.localizedDescription
                }
            }
        }
    }

    func stopSession() {
        sessionQueue.async {
            guard self.session.isRunning else { return }
            self.session.stopRunning()
            DispatchQueue.main.async {
                self.isRunning = false
            }
        }
    }

    func switchCamera() {
        sessionQueue.async {
            let newPosition: AVCaptureDevice.Position = self.currentPosition == .back ? .front : .back
            do {
                try self.configureSessionLocked(position: newPosition)
                self.publishDeviceState()
            } catch {
                DispatchQueue.main.async {
                    self.errorMessage = error.localizedDescription
                }
            }
        }
    }

    func toggleFlash() {
        sessionQueue.async {
            guard let device = self.videoInput?.device, device.hasFlash else { return }
            let next: AVCaptureDevice.FlashMode = self.flashMode == .off ? .on : .off
            DispatchQueue.main.async {
                self.flashMode = next
            }
        }
    }

    func applyPreset(_ preset: ZoomPreset) {
        sessionQueue.async {
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
                            let preferredType: AVCaptureDevice.DeviceType =
                                AVCaptureDevice.default(.builtInTripleCamera, for: .video, position: .back) != nil
                                ? .builtInTripleCamera
                                : (AVCaptureDevice.default(.builtInDualWideCamera, for: .video, position: .back) != nil
                                   ? .builtInDualWideCamera
                                   : .builtInWideAngleCamera)
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
                DispatchQueue.main.async {
                    self.errorMessage = error.localizedDescription
                }
            }
        }
    }

    func bumpZoom(by scale: CGFloat) {
        sessionQueue.async {
            guard let device = self.videoInput?.device else { return }
            let next = device.videoZoomFactor * scale
            self.setZoomFactorLocked(next, preset: nil)
            self.publishDeviceState()
        }
    }

    func capturePhoto() async throws -> Data {
        try await withCheckedThrowingContinuation { continuation in
            sessionQueue.async {
                guard self.session.isRunning else {
                    continuation.resume(throwing: CameraServiceError.captureFailed)
                    return
                }

                self.captureContinuation = continuation

                let settings = AVCapturePhotoSettings()
                if let device = self.videoInput?.device,
                   device.hasFlash,
                   self.photoOutput.supportedFlashModes.contains(self.flashMode) {
                    settings.flashMode = self.flashMode
                }

                self.photoOutput.capturePhoto(with: settings, delegate: self)
            }
        }
    }

    // MARK: - Private

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

        setZoomFactorLocked(1, preset: .oneX)
    }

    private func preferredDevice(for position: AVCaptureDevice.Position) throws -> AVCaptureDevice {
        if position == .back {
            if let triple = AVCaptureDevice.default(.builtInTripleCamera, for: .video, position: .back) {
                return triple
            }
            if let dualWide = AVCaptureDevice.default(.builtInDualWideCamera, for: .video, position: .back) {
                return dualWide
            }
            if let wide = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) {
                return wide
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
            DispatchQueue.main.async {
                self.zoomFactor = clamped
                self.selectedPreset = resolvedPreset
            }
        } catch {
            DispatchQueue.main.async {
                self.errorMessage = error.localizedDescription
            }
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

        DispatchQueue.main.async {
            self.availablePresets = presets
            self.supportsFlash = flash
            self.zoomFactor = factor
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
        Task { @MainActor in
            if let error {
                captureContinuation?.resume(throwing: error)
                captureContinuation = nil
                return
            }

            guard let data = photo.fileDataRepresentation() else {
                captureContinuation?.resume(throwing: CameraServiceError.captureFailed)
                captureContinuation = nil
                return
            }

            captureContinuation?.resume(returning: data)
            captureContinuation = nil
        }
    }
}
