import Foundation
import Photos
import UIKit

enum PhotoLibrarySaver {
    static func saveIfNeeded(_ image: UIImage, enabled: Bool) async {
        guard enabled else { return }

        await withCheckedContinuation { continuation in
            PHPhotoLibrary.requestAuthorization(for: .addOnly) { status in
                guard status == .authorized || status == .limited else {
                    continuation.resume()
                    return
                }

                PHPhotoLibrary.shared().performChanges {
                    PHAssetChangeRequest.creationRequestForAsset(from: image)
                } completionHandler: { _, _ in
                    continuation.resume()
                }
            }
        }
    }
}
