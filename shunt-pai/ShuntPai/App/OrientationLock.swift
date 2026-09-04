import UIKit

/// Native Camera keeps chrome fixed to the phone body. While the camera tab is
/// active we lock the interface to portrait so the shutter stays on the
/// physical bottom edge — which is the thumb side when the phone is tilted.
enum OrientationLock {
    static var mask: UIInterfaceOrientationMask = .all {
        didSet {
            guard mask != oldValue else { return }
            apply(mask)
        }
    }

    static func apply(_ mask: UIInterfaceOrientationMask) {
        guard let scene = UIApplication.shared.connectedScenes
            .compactMap({ $0 as? UIWindowScene })
            .first(where: { $0.activationState == .foregroundActive || $0.activationState == .foregroundInactive })
        else { return }

        scene.requestGeometryUpdate(.iOS(interfaceOrientations: mask)) { _ in }

        // iOS 16+: ask visible controllers to re-query supported orientations.
        for window in scene.windows {
            window.rootViewController?.setNeedsUpdateOfSupportedInterfaceOrientations()
            window.rootViewController?.presentedViewController?
                .setNeedsUpdateOfSupportedInterfaceOrientations()
        }
    }
}

final class AppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        supportedInterfaceOrientationsFor window: UIWindow?
    ) -> UIInterfaceOrientationMask {
        OrientationLock.mask
    }
}
