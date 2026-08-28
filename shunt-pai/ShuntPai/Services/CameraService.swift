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

@MainActor
final class CameraService: NSObject, ObservableObject {
    @Published private(set) var isRunning = false
    @Published private(set) var authorizationStatus: AVAuthorizationStatus = .notDetermined
    @Published private(set) var flashMode: AVCaptureDevice.FlashMode = .off
    @Published private(set) var zoomFactor: CGFloat = 1
    @Published var errorMessage: String?

    let session = AVCaptureSession()

    private let sessionQueue = DispatchQueue(label: "com.shuntpai.camera.session")
    private let photoOutput = AVCapturePhotoOutput()
    private var videoInput: AVCaptureDeviceInput?
    private var currentDevice: AVCaptureDevice?
    private var captureContinuation: CheckedContinuation<Data, Error>?

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

    func configureSession() {
        sessionQueue.async {
            self.session.beginConfiguration()
            self.session.sessionPreset = .photo

            self.session.inputs.forEach { self.session.removeInput($0) }
            self.session.outputs.forEach { self.session.removeOutput($0) }

            do {
                guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) else {
                    throw CameraServiceError.unavailable
                }

                let input = try AVCaptureDeviceInput(device: device)
                if self.session.canAddInput(input) {
                    self.session.addInput(input)
                    self.videoInput = input
                    self.currentDevice = device
                }

                if self.session.canAddOutput(self.photoOutput) {
                    self.session.addOutput(self.photoOutput)
                    self.photoOutput.maxPhotoQualityPrioritization = .quality
                }

                self.session.commitConfiguration()
            } catch {
                DispatchQueue.main.async {
                    self.errorMessage = error.localizedDescription
                }
            }
        }
    }

    func startSession() {
        guard authorizationStatus == .authorized else { return }

        sessionQueue.async {
            guard !self.session.isRunning else { return }
            self.configureSession()
            self.session.startRunning()
            DispatchQueue.main.async {
                self.isRunning = true
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
            guard let currentInput = self.videoInput else { return }
            let newPosition: AVCaptureDevice.Position = currentInput.device.position == .back ? .front : .back

            guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: newPosition) else {
                return
            }

            do {
                let newInput = try AVCaptureDeviceInput(device: device)
                self.session.beginConfiguration()
                self.session.removeInput(currentInput)

                if self.session.canAddInput(newInput) {
                    self.session.addInput(newInput)
                    self.videoInput = newInput
                    self.currentDevice = device
                    DispatchQueue.main.async {
                        self.zoomFactor = 1
                    }
                } else {
                    self.session.addInput(currentInput)
                }

                self.session.commitConfiguration()
            } catch {
                DispatchQueue.main.async {
                    self.errorMessage = error.localizedDescription
                }
            }
        }
    }

    func toggleFlash() {
        guard let device = currentDevice, device.hasFlash else { return }
        flashMode = flashMode == .off ? .on : .off
    }

    func setZoom(_ factor: CGFloat) {
        sessionQueue.async {
            guard let device = self.currentDevice else { return }
            let clamped = min(max(factor, 1), min(device.activeFormat.videoMaxZoomFactor, 5))

            do {
                try device.lockForConfiguration()
                device.videoZoomFactor = clamped
                device.unlockForConfiguration()
                DispatchQueue.main.async {
                    self.zoomFactor = clamped
                }
            } catch {
                DispatchQueue.main.async {
                    self.errorMessage = error.localizedDescription
                }
            }
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
                if self.photoOutput.supportedFlashModes.contains(self.flashMode) {
                    settings.flashMode = self.flashMode
                }

                self.photoOutput.capturePhoto(with: settings, delegate: self)
            }
        }
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
