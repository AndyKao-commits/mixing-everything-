import Foundation
import Photos

enum PhotoLibrarySaver {
    static func saveIfNeeded(data: Data, enabled: Bool) async {
        guard enabled else { return }

        await withCheckedContinuation { continuation in
            PHPhotoLibrary.requestAuthorization(for: .addOnly) { status in
                guard status == .authorized || status == .limited else {
                    continuation.resume()
                    return
                }

                PHPhotoLibrary.shared().performChanges {
                    let request = PHAssetCreationRequest.forAsset()
                    request.addResource(with: .photo, data: data, options: nil)
                } completionHandler: { _, _ in
                    continuation.resume()
                }
            }
        }
    }
}
