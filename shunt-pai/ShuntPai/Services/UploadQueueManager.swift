import Foundation
import Network
import Photos
import SwiftData

@MainActor
final class UploadQueueManager: ObservableObject {
    @Published private(set) var isUploading = false
    @Published var needsProcessing = false

    private let authService: GoogleAuthService
    private let driveService: GoogleDriveService
    private let photoStore: PhotoStore
    private let monitor = NWPathMonitor()
    private var isOnline = true
    private var isProcessing = false

    init(authService: GoogleAuthService, driveService: GoogleDriveService, photoStore: PhotoStore) {
        self.authService = authService
        self.driveService = driveService
        self.photoStore = photoStore

        monitor.pathUpdateHandler = { [weak self] path in
            Task { @MainActor in
                self?.isOnline = path.status == .satisfied
                if path.status == .satisfied {
                    self?.needsProcessing = true
                }
            }
        }
        monitor.start(queue: DispatchQueue(label: "com.shuntpai.network"))
    }

    func enqueueUpload(for record: PhotoRecord, saveToPhotoLibrary: Bool, modelContext: ModelContext) async {
        if saveToPhotoLibrary {
            await saveToLibrary(record: record)
        }
        await processPendingUploads(modelContext: modelContext)
    }

    func processPendingUploads(modelContext: ModelContext?) async {
        guard isOnline, authService.isSignedIn, !isProcessing else { return }
        isProcessing = true
        isUploading = true
        defer {
            isProcessing = false
            isUploading = false
        }

        guard let context = modelContext else { return }

        let descriptor = FetchDescriptor<PhotoRecord>(
            predicate: #Predicate { record in
                record.uploadStatusRaw == UploadStatus.pending.rawValue
                    || record.uploadStatusRaw == UploadStatus.failed.rawValue
            },
            sortBy: [SortDescriptor(\.capturedAt)]
        )

        guard let pending = try? context.fetch(descriptor), !pending.isEmpty else { return }

        for record in pending {
            record.uploadStatus = .uploading
            try? context.save()

            do {
                let data = try Data(contentsOf: photoStore.localURL(for: record))
                let remoteID = try await driveService.uploadPhoto(data: data, filename: record.remoteFileName)
                record.remoteFileID = remoteID
                record.uploadStatus = .uploaded
                record.lastError = nil
            } catch {
                record.uploadStatus = .failed
                record.lastError = error.localizedDescription
            }

            try? context.save()
        }
    }

    func retryFailed(modelContext: ModelContext) async {
        let descriptor = FetchDescriptor<PhotoRecord>(
            predicate: #Predicate { $0.uploadStatusRaw == UploadStatus.failed.rawValue }
        )
        if let failed = try? modelContext.fetch(descriptor) {
            for record in failed {
                record.uploadStatus = .pending
            }
            try? modelContext.save()
        }
        await processPendingUploads(modelContext: modelContext)
    }

    private func saveToLibrary(record: PhotoRecord) async {
        guard let image = photoStore.loadImage(for: record) else { return }

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
