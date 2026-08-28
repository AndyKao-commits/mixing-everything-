import Foundation
import SwiftData

enum UploadStatus: String, Codable, CaseIterable {
    case pending
    case uploading
    case uploaded
    case failed

    var displayTitle: String {
        switch self {
        case .pending: return "待傳"
        case .uploading: return "上傳中"
        case .uploaded: return "已上傳"
        case .failed: return "失敗"
        }
    }

    var symbolName: String {
        switch self {
        case .pending: return "clock"
        case .uploading: return "arrow.up.circle"
        case .uploaded: return "checkmark.circle.fill"
        case .failed: return "exclamationmark.circle"
        }
    }
}

@Model
final class PhotoRecord {
    var id: UUID
    var capturedAt: Date
    var localFileName: String
    var remoteFileID: String?
    var remoteFileName: String
    var uploadStatusRaw: String
    var lastError: String?

    init(
        id: UUID = UUID(),
        capturedAt: Date = .now,
        localFileName: String,
        remoteFileID: String? = nil,
        remoteFileName: String,
        uploadStatus: UploadStatus = .pending,
        lastError: String? = nil
    ) {
        self.id = id
        self.capturedAt = capturedAt
        self.localFileName = localFileName
        self.remoteFileID = remoteFileID
        self.remoteFileName = remoteFileName
        self.uploadStatusRaw = uploadStatus.rawValue
        self.lastError = lastError
    }

    var uploadStatus: UploadStatus {
        get { UploadStatus(rawValue: uploadStatusRaw) ?? .pending }
        set { uploadStatusRaw = newValue.rawValue }
    }
}
