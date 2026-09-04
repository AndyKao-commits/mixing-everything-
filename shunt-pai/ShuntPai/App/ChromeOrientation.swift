import Combine
import SwiftUI
import UIKit

/// Tracks physical device orientation so camera chrome can stay readable
/// relative to gravity while the interface itself stays portrait-locked.
@MainActor
final class ChromeOrientation: ObservableObject {
    /// Counter-rotation applied to chrome so labels/icons read upright.
    @Published private(set) var angle: Angle = .zero
    @Published private(set) var isLandscapeHold = false

    private var observer: NSObjectProtocol?

    func start() {
        UIDevice.current.beginGeneratingDeviceOrientationNotifications()
        refresh()
        guard observer == nil else { return }
        observer = NotificationCenter.default.addObserver(
            forName: UIDevice.orientationDidChangeNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                self?.refresh()
            }
        }
    }

    func stop() {
        if let observer {
            NotificationCenter.default.removeObserver(observer)
            self.observer = nil
        }
        UIDevice.current.endGeneratingDeviceOrientationNotifications()
        angle = .zero
        isLandscapeHold = false
    }

    private func refresh() {
        let orientation = UIDevice.current.orientation
        let nextAngle: Angle
        let landscape: Bool
        switch orientation {
        case .landscapeLeft:
            // Device rotated CCW; rotate chrome CCW (+90°) so glyphs follow gravity "up".
            nextAngle = .degrees(90)
            landscape = true
        case .landscapeRight:
            nextAngle = .degrees(-90)
            landscape = true
        case .portraitUpsideDown:
            nextAngle = .degrees(180)
            landscape = false
        case .portrait:
            nextAngle = .zero
            landscape = false
        default:
            // faceUp / faceDown / unknown — keep last stable angle.
            return
        }

        withAnimation(.easeInOut(duration: 0.2)) {
            angle = nextAngle
            isLandscapeHold = landscape
        }
    }
}

extension View {
    /// Rotate chrome content so it reads upright when the phone is tilted.
    func chromeUpright(_ angle: Angle) -> some View {
        self.rotationEffect(angle)
    }
}
