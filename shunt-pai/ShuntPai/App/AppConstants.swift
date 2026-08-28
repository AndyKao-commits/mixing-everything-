import Foundation

enum AppConstants {
    static let appName = "分流拍"
    static let appFolderName = "分流拍"
    static let onboardingCompleteKey = "shuntpai.onboarding.complete"
    static let saveToPhotoLibraryKey = "shuntpai.settings.saveToPhotoLibrary"

    // Replace with your Google Cloud OAuth iOS client ID before running on device.
    static let googleClientID = "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com"
    static let googleRedirectScheme = "com.shuntpai.app"
    static let googleRedirectURI = "com.shuntpai.app:/oauth2redirect"

    static let googleAuthScope = "openid email profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata.readonly"

    static let keychainService = "com.shuntpai.app.auth"
    static let accessTokenKey = "google.accessToken"
    static let refreshTokenKey = "google.refreshToken"
    static let tokenExpiryKey = "google.tokenExpiry"
    static let userEmailKey = "google.userEmail"
    static let folderIDKey = "google.drive.folderID"
    static let folderNameKey = "google.drive.folderName"

    static let photosDirectoryName = "CapturedPhotos"
    static let thumbnailsDirectoryName = "Thumbnails"
}
