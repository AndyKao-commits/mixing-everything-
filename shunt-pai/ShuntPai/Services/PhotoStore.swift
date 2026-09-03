import Foundation
import ImageIO
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

    func saveCapturedPhoto(data: Data, modelContext: ModelContext) async throws -> PhotoRecord {
        let filename = makeFilename()
        let photoURL = photosDirectory.appendingPathComponent(filename)
        let thumbURL = thumbnailsDirectory.appendingPathComponent(filename)
        let payload = data

        try await Task.detached(priority: .userInitiated) {
            try payload.write(to: photoURL, options: .atomic)
            ImageProcessing.writeJPEGThumbnail(from: payload, to: thumbURL, maxPixelSize: 300)
        }.value

        if let thumb = UIImage(contentsOfFile: thumbURL.path) {
            cacheThumbnail(thumb, key: filename as NSString)
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

    func loadThumbnail(for record: PhotoRecord) async -> UIImage? {
        let key = record.localFileName as NSString
        if let cached = thumbnailCache.object(forKey: key) {
            return cached
        }

        let thumbPath = thumbnailURL(for: record).path
        if let image = await downsample(path: thumbPath, maxPixelSize: 300) {
            cacheThumbnail(image, key: key)
            return image
        }

        let fullPath = localURL(for: record).path
        if let image = await downsample(path: fullPath, maxPixelSize: 300) {
            cacheThumbnail(image, key: key)
            if let jpeg = image.jpegData(compressionQuality: 0.75) {
                try? jpeg.write(to: thumbnailURL(for: record), options: .atomic)
            }
            return image
        }

        return nil
    }

    func loadDisplayImage(for record: PhotoRecord) async -> UIImage? {
        let path = localURL(for: record).path
        let maxPixel = Int(max(UIScreen.main.bounds.width, UIScreen.main.bounds.height) * UIScreen.main.scale)
        return await downsample(path: path, maxPixelSize: max(maxPixel, 1200))
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

    func formattedStorageUsage() async -> String {
        let photos = photosDirectory
        let thumbs = thumbnailsDirectory
        let bytes = await Task.detached(priority: .utility) {
            ImageProcessing.directorySize(photos) + ImageProcessing.directorySize(thumbs)
        }.value
        return ByteCountFormatter.string(fromByteCount: bytes, countStyle: .file)
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

    private func downsample(path: String, maxPixelSize: Int) async -> UIImage? {
        await withCheckedContinuation { continuation in
            DispatchQueue.global(qos: .userInitiated).async {
                let image = ImageProcessing.downsampledImage(atPath: path, maxPixelSize: maxPixelSize)
                DispatchQueue.main.async {
                    continuation.resume(returning: image)
                }
            }
        }
    }
}

private enum ImageProcessing {
    static func writeJPEGThumbnail(from data: Data, to url: URL, maxPixelSize: Int) {
        guard let source = CGImageSourceCreateWithData(
            data as CFData,
            [kCGImageSourceShouldCache: false] as CFDictionary
        ) else { return }
        guard let image = makeThumbnail(from: source, maxPixelSize: maxPixelSize) else { return }
        guard let destination = CGImageDestinationCreateWithURL(
            url as CFURL,
            "public.jpeg" as CFString,
            1,
            nil
        ) else { return }
        CGImageDestinationAddImage(
            destination,
            image,
            [kCGImageDestinationLossyCompressionQuality: 0.75] as CFDictionary
        )
        CGImageDestinationFinalize(destination)
    }

    static func downsampledImage(atPath path: String, maxPixelSize: Int) -> UIImage? {
        guard FileManager.default.fileExists(atPath: path) else { return nil }
        let url = URL(fileURLWithPath: path) as CFURL
        guard let source = CGImageSourceCreateWithURL(
            url,
            [kCGImageSourceShouldCache: false] as CFDictionary
        ) else { return nil }
        guard let image = makeThumbnail(from: source, maxPixelSize: maxPixelSize) else { return nil }
        return UIImage(cgImage: image)
    }

    static func directorySize(_ url: URL) -> Int64 {
        guard let enumerator = FileManager.default.enumerator(
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

    private static func makeThumbnail(from source: CGImageSource, maxPixelSize: Int) -> CGImage? {
        let options: [CFString: Any] = [
            kCGImageSourceCreateThumbnailFromImageAlways: true,
            kCGImageSourceCreateThumbnailFromImageIfAbsent: true,
            kCGImageSourceThumbnailMaxPixelSize: maxPixelSize,
            kCGImageSourceCreateThumbnailWithTransform: true,
            kCGImageSourceShouldCacheImmediately: true
        ]
        return CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary)
    }
}
