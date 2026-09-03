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
