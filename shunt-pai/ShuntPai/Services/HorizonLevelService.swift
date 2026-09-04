import Combine
import CoreMotion
import Foundation

/// Portrait-camera horizon helper. The line tilts with the phone like the system Camera app.
@MainActor
final class HorizonLevelService: ObservableObject {
    @Published private(set) var rollDegrees: Double = 0
    @Published private(set) var isLevel = false

    private let manager = CMMotionManager()
    private let queue = OperationQueue()

    func start() {
        guard manager.isDeviceMotionAvailable else { return }
        manager.deviceMotionUpdateInterval = 1.0 / 60.0
        manager.startDeviceMotionUpdates(using: .xArbitraryZVertical, to: queue) { [weak self] motion, _ in
            guard let motion else { return }
            // In portrait, roll tracks left/right tilt of the horizon.
            let degrees = motion.attitude.roll * 180 / .pi
            Task { @MainActor in
                self?.rollDegrees = degrees
                self?.isLevel = abs(degrees) < 1.2
            }
        }
    }

    func stop() {
        manager.stopDeviceMotionUpdates()
        rollDegrees = 0
        isLevel = false
    }
}
