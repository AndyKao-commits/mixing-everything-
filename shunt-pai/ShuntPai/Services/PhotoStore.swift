import Foundation
import SwiftData
import UIKit

@MainActor
final class PhotoStore: ObservableObject {
    private let fileManager = FileManager.default
    private let thumbnailCache = NSCache<NSString, UIImage>()
    private let sectionFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "zh_TW")
        formatter.dateFormat = "yyyy年M月d日"
        return formatter
    }()
    private let filenameFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyyMMdd_HHmmss"
        return formatter
    }()

    init() {
        thumbnailCache.countLimit = 200
        thumbnailCache.totalCostLimit = 40 * 1024 * 1024
    }

    var photosDirectory: URL {
        directory(named: AppConstants.photosDirectoryName)
    }

    var thumbnailsDirectory: URL {
        directory(named: AppConstants.thumbnailsDirectoryName)
    }

    func makeFilename(for date: Date = .now) -> String {
        let stamp = filenameFormatter.string(from: date)
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
            cacheThumbnail(thumbnail, key: filename as NSString)
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

    func loadImage(for record: PhotoRecord) async -> UIImage? {
        let path = localURL(for: record).path
        guard let data = await Self.readFile(at: path) else { return nil }
        return UIImage(data: data)
    }

    func loadThumbnail(for record: PhotoRecord) async -> UIImage? {
        let key = record.localFileName as NSString
        if let cached = thumbnailCache.object(forKey: key) {
            return cached
        }

        let thumbPath = thumbnailURL(for: record).path
        if let data = await Self.readFile(at: thumbPath), let image = UIImage(data: data) {
            cacheThumbnail(image, key: key)
            return image
        }

        let fullPath = localURL(for: record).path
        if let data = await Self.readFile(at: fullPath),
           let full = UIImage(data: data) {
            let thumb = full.preparingThumbnail(of: CGSize(width: 300, height: 300)) ?? full
            cacheThumbnail(thumb, key: key)
            if let jpeg = thumb.jpegData(compressionQuality: 0.75) {
                try? jpeg.write(to: thumbnailURL(for: record), options: .atomic)
            }
            return thumb
        }

        return nil
    }

    func shareableURLs(for records: [PhotoRecord]) -> [URL] {
        records.compactMap { record in
            let source = localURL(for: record)
            guard fileManager.fileExists(atPath: source.path) else { return nil }
            let destination = fileManager.temporaryDirectory.appendingPathComponent(record.localFileName)
            if fileManager.fileExists(atPath: destination.path) {
                try? fileManager.removeItem(at: destination)
            }
            do {
                try fileManager.copyItem(at: source, to: destination)
                return destination
            } catch {
                return source
            }
        }
    }

    func delete(record: PhotoRecord, modelContext: ModelContext) throws {
        thumbnailCache.removeObject(forKey: record.localFileName as NSString)
        try? fileManager.removeItem(at: localURL(for: record))
        try? fileManager.removeItem(at: thumbnailURL(for: record))
        modelContext.delete(record)
        try modelContext.save()
    }

    func groupedRecords(_ records: [PhotoRecord]) -> [(String, [PhotoRecord])] {
        let calendar = Calendar.current
        let sorted = records.sorted { $0.capturedAt > $1.capturedAt }
        let grouped = Dictionary(grouping: sorted) { calendar.startOfDay(for: $0.capturedAt) }

        return grouped.keys.sorted(by: >).map { day in
            (sectionFormatter.string(from: day), grouped[day] ?? [])
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

    private func directory(named name: String) -> URL {
        let base = fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
        let directory = base.appendingPathComponent(name, isDirectory: true)
        if !fileManager.fileExists(atPath: directory.path) {
            try? fileManager.createDirectory(at: directory, withIntermediateDirectories: true)
        }
        return directory
    }

    private func cacheThumbnail(_ image: UIImage, key: NSString) {
        let cost = Int(image.size.width * image.size.height * image.scale * image.scale * 4)
        thumbnailCache.setObject(image, forKey: key, cost: max(cost, 1))
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

    private static func readFile(at path: String) async -> Data? {
        await Task.detached(priority: .userInitiated) {
            FileManager.default.contents(atPath: path)
        }.value
    }
}
