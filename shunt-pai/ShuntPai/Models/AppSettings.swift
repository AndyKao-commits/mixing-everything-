import Foundation
import SwiftData

@Model
final class AppSettings {
    var id: UUID
    var saveToPhotoLibrary: Bool

    init(id: UUID = UUID(), saveToPhotoLibrary: Bool = false) {
        self.id = id
        self.saveToPhotoLibrary = saveToPhotoLibrary
    }
}
