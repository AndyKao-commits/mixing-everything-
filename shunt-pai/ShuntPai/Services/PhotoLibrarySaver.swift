import Foundation
import Photos

enum PhotoLibrarySaver {
    enum SaveOutcome {
        case skipped
        case saved
        case denied
    }

    static func saveIfNeeded(data: Data, enabled: Bool) async -> SaveOutcome {
        guard enabled else { return .skipped }

        return await withCheckedContinuation { continuation in
            PHPhotoLibrary.requestAuthorization(for: .addOnly) { status in
                guard status == .authorized || status == .limited else {
                    continuation.resume(returning: .denied)
                    return
                }

                PHPhotoLibrary.shared().performChanges {
                    let request = PHAssetCreationRequest.forAsset()
                    request.addResource(with: .photo, data: data, options: nil)
                } completionHandler: { success, _ in
                    continuation.resume(returning: success ? .saved : .denied)
                }
            }
        }
    }
}
