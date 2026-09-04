import Foundation

enum AppConstants {
    static let appName = "分流拍"
    static let onboardingCompleteKey = "shuntpai.onboarding.complete.v2"
    static let saveToPhotoLibraryKey = "shuntpai.settings.saveToPhotoLibrary"
    static let appLockEnabledKey = "shuntpai.settings.appLockEnabled"
    static let paidModeEnabledKey = "shuntpai.settings.testPaidMode"
    static let frontCameraMirroredKey = "shuntpai.settings.frontCameraMirrored"

    static let photosDirectoryName = "CapturedPhotos"
    static let thumbnailsDirectoryName = "Thumbnails"

    static let freePhotoLimit = 43
    static let subscriptionPriceText = "每月 NT$40"

    enum CaptureAspectRatio: String, CaseIterable, Identifiable {
        case sixteenNine = "16:9"
        case fourThree = "4:3"
        case square = "1:1"

        var id: String { rawValue }

        /// Upright image width ÷ height for the current phone orientation.
        func uprightWidthOverHeight(isLandscape: Bool) -> CGFloat {
            switch self {
            case .square:
                return 1
            case .fourThree:
                return isLandscape ? (4.0 / 3.0) : (3.0 / 4.0)
            case .sixteenNine:
                return isLandscape ? (16.0 / 9.0) : (9.0 / 16.0)
            }
        }

        var next: CaptureAspectRatio {
            let all = Self.allCases
            let index = all.firstIndex(of: self) ?? 0
            return all[(index + 1) % all.count]
        }
    }


    static var isFrontCameraMirrored: Bool {
        get {
            if UserDefaults.standard.object(forKey: frontCameraMirroredKey) == nil {
                return true
            }
            return UserDefaults.standard.bool(forKey: frontCameraMirroredKey)
        }
        set {
            UserDefaults.standard.set(newValue, forKey: frontCameraMirroredKey)
        }
    }
}
