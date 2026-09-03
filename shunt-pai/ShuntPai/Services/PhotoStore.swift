import Foundation
import SwiftData
import UIKit

@MainActor
final class PhotoStore: ObservableObject {
    private let fileManager = FileManager.default

    var photosDirectory: URL {
        let base = fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
        let directory = base.appendingPathComponent(AppConstants.photosDirectoryName, isDirectory: true)
        if !fileManager.fileExists(atPath: directory.path) {
            try? fileManager.createDirectory(at: directory, withIntermediateDirectories: true)
        }
        return directory
    }

    var thumbnailsDirectory: URL {
        let base = fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
        let directory = base.appendingPathComponent(AppConstants.thumbnailsDirectoryName, isDirectory: true)
        if !fileManager.fileExists(atPath: directory.path) {
            try? fileManager.createDirectory(at: directory, withIntermediateDirectories: true)
        }
        return directory
    }

    func makeFilename(for date: Date = .now) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyyMMdd_HHmmss"
        let stamp = formatter.string(from: date)
        return "ShuntPai_\(stamp)_\(Int.random(in: 100...999)).jpg"
    }

    func saveCapturedPhoto(data: Data, modelContext: ModelContext) throws -> PhotoRecord {
        let filename = makeFilename()
        let localURL = photosDirectory.appendingPathComponent(filename)
        try data.write(to: localURL, options: .atomic)

        if let thumbnail = UIImage(data: data)?.preparingThumbnail(of: CGSize(width: 300, height: 300)),
           let thumbnailData = thumbnail.jpegData(compressionQuality: 0.75) {
            let thumbURL = thumbnailsDirectory.appendingPathComponent(filename)
            try? thumbnailData.write(to: thumbURL, options: .atomic)
        }

        let record = PhotoRecord(localFileName: filename)
        modelContext.insert(record)
        try modelContext.save()
        return record
    }

    func localURL(for record: PhotoRecord) -> URL {
        photosDirectory.appendingPathComponent(record.localFileName)
    }

    func thumbnailURL(for record: PhotoRecord) -> URL {
        thumbnailsDirectory.appendingPathComponent(record.localFileName)
    }

    func loadImage(for record: PhotoRecord) -> UIImage? {
        UIImage(contentsOfFile: localURL(for: record).path)
    }

    func loadThumbnail(for record: PhotoRecord) -> UIImage? {
        if let image = UIImage(contentsOfFile: thumbnailURL(for: record).path) {
            return image
        }
        return loadImage(for: record)
    }

    func delete(record: PhotoRecord, modelContext: ModelContext) throws {
        try? fileManager.removeItem(at: localURL(for: record))
        try? fileManager.removeItem(at: thumbnailURL(for: record))
        modelContext.delete(record)
        try modelContext.save()
    }

    func groupedRecords(_ records: [PhotoRecord]) -> [(String, [PhotoRecord])] {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "zh_TW")
        formatter.dateFormat = "yyyy年M月d日"

        let grouped = Dictionary(grouping: records.sorted { $0.capturedAt > $1.capturedAt }) {
            formatter.string(from: $0.capturedAt)
        }

        return grouped.keys.sorted(by: >).map { key in
            (key, grouped[key] ?? [])
        }
    }

    func storageUsageBytes() -> Int64 {
        directorySize(photosDirectory) + directorySize(thumbnailsDirectory)
    }

    func formattedStorageUsage() -> String {
        ByteCountFormatter.string(fromByteCount: storageUsageBytes(), countStyle: .file)
    }

    func deviceFreeSpaceFormatted() -> String {
        let home = URL(fileURLWithPath: NSHomeDirectory())
        let values = try? home.resourceValues(forKeys: [.volumeAvailableCapacityForImportantUsageKey])
        let free = values?.volumeAvailableCapacityForImportantUsage ?? 0
        return ByteCountFormatter.string(fromByteCount: free, countStyle: .file)
    }

    private func directorySize(_ url: URL) -> Int64 {
        guard let enumerator = fileManager.enumerator(
            at: url,
            includingPropertiesForKeys: [.fileSizeKey, .isRegularFileKey],
            options: [.skipsHiddenFiles]
        ) else { return 0 }

        var total: Int64 = 0
        for case let fileURL as URL in enumerator {
            guard
                let values = try? fileURL.resourceValues(forKeys: [.isRegularFileKey, .fileSizeKey]),
                values.isRegularFile == true
            else { continue }
            total += Int64(values.fileSize ?? 0)
        }
        return total
    }
}
