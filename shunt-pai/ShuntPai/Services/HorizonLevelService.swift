import Combine
import CoreMotion
import Foundation
import UIKit

/// Native-style level guide: hidden until the phone is nearly level, then a short bar appears.
@MainActor
final class HorizonLevelService: ObservableObject {
    /// Signed tilt in degrees (0 = level).
    @Published private(set) var tiltDegrees: Double = 0
    @Published private(set) var shouldShow = false
    @Published private(set) var isLevel = false

    private let manager = CMMotionManager()
    private let queue = OperationQueue()

    private let showThreshold = 5.5
    private let levelThreshold = 1.0

    func setInterfaceLandscape(_ landscape: Bool) {
        // Kept for call-site compatibility; tilt axis follows physical device orientation.
        _ = landscape
    }

    func start() {
        guard manager.isDeviceMotionAvailable else { return }
        manager.deviceMotionUpdateInterval = 1.0 / 30.0
        manager.startDeviceMotionUpdates(using: .xArbitraryZVertical, to: queue) { [weak self] motion, _ in
            guard let self, let gravity = motion?.gravity else { return }
            // Side-to-side tilt relative to how the phone is physically held.
            let deviceLandscape: Bool = {
                switch UIDevice.current.orientation {
                case .landscapeLeft, .landscapeRight: return true
                default: return false
                }
            }()
            let axis = deviceLandscape ? gravity.y : gravity.x
            let degrees = asin(min(max(axis, -1), 1)) * 180 / Double.pi

            Task { @MainActor in
                self.tiltDegrees = degrees
                self.shouldShow = abs(degrees) <= self.showThreshold
                self.isLevel = abs(degrees) <= self.levelThreshold
            }
        }
    }

    func stop() {
        manager.stopDeviceMotionUpdates()
        tiltDegrees = 0
        shouldShow = false
        isLevel = false
    }
}
