import Foundation
import SwiftData

@Model
final class PhotoRecord {
    var id: UUID
    var capturedAt: Date
    var localFileName: String

    init(
        id: UUID = UUID(),
        capturedAt: Date = .now,
        localFileName: String
    ) {
        self.id = id
        self.capturedAt = capturedAt
        self.localFileName = localFileName
    }
}
