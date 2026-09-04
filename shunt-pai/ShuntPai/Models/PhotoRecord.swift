import Foundation
import SwiftData

@Model
final class PhotoRecord {
    var id: UUID
    var capturedAt: Date
    var localFileName: String
    var note: String = ""

    @Relationship(deleteRule: .nullify, inverse: \TagRecord.photos)
    var tags: [TagRecord] = []

    init(
        id: UUID = UUID(),
        capturedAt: Date = .now,
        localFileName: String,
        note: String = ""
    ) {
        self.id = id
        self.capturedAt = capturedAt
        self.localFileName = localFileName
        self.note = note
    }
}

@Model
final class TagRecord {
    var id: UUID
    var name: String
    var createdAt: Date
    var photos: [PhotoRecord] = []

    init(
        id: UUID = UUID(),
        name: String,
        createdAt: Date = .now
    ) {
        self.id = id
        self.name = name
        self.createdAt = createdAt
    }
}
