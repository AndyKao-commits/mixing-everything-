import AVFoundation
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

    func makeFilename(extension ext: String = "jpg", for date: Date = .now) -> String {
        let stamp = filenameFormatter.string(from: date)
        return "ShuntPai_\(stamp)_\(Int.random(in: 100...999)).\(ext)"
    }

    func saveCapturedPhoto(
        data: Data,
        aspectRatio: AppConstants.CaptureAspectRatio = .sixteenNine,
        isLandscape: Bool = false,
        modelContext: ModelContext
    ) async throws -> PhotoRecord {
        let filename = makeFilename(extension: "jpg")
        let photoURL = photosDirectory.appendingPathComponent(filename)
        let thumbURL = thumbnailURL(forFileName: filename)
        let payload = data
        let uprightWH = aspectRatio.uprightWidthOverHeight(isLandscape: isLandscape)

        try await Task.detached(priority: .userInitiated) {
            let finalData = ImageProcessing.uprightCroppedJPEG(
                from: payload,
                uprightWidthOverHeight: uprightWH
            ) ?? payload
            try finalData.write(to: photoURL, options: .atomic)
            ImageProcessing.writeJPEGThumbnail(from: finalData, to: thumbURL, maxPixelSize: 300)
        }.value

        if let thumb = UIImage(contentsOfFile: thumbURL.path) {
            cacheThumbnail(thumb, key: filename as NSString)
        }

        let record = PhotoRecord(localFileName: filename, isVideo: false)
        modelContext.insert(record)
        try modelContext.save()
        return record
    }

    func saveRecordedVideo(
        from temporaryURL: URL,
        modelContext: ModelContext
    ) async throws -> PhotoRecord {
        let filename = makeFilename(extension: "mov")
        let destination = photosDirectory.appendingPathComponent(filename)
        let thumbURL = thumbnailURL(forFileName: filename)

        if fileManager.fileExists(atPath: destination.path) {
            try fileManager.removeItem(at: destination)
        }
        try fileManager.moveItem(at: temporaryURL, to: destination)

        let thumb = await Task.detached(priority: .userInitiated) {
            ImageProcessing.videoThumbnail(at: destination, maxPixelSize: 300)
        }.value
        if let thumb, let cg = thumb.cgImage {
            ImageProcessing.writeOpaqueJPEG(cg, to: thumbURL)
            cacheThumbnail(thumb, key: filename as NSString)
        }

        let record = PhotoRecord(localFileName: filename, isVideo: true)
        modelContext.insert(record)
        try modelContext.save()
        return record
    }

    /// Import a still from the system Photos picker into local storage (no forced crop).
    func importImage(
        data: Data,
        capturedAt: Date = .now,
        modelContext: ModelContext
    ) async throws -> PhotoRecord {
        let filename = makeFilename(extension: "jpg", for: capturedAt)
        let photoURL = photosDirectory.appendingPathComponent(filename)
        let thumbURL = thumbnailURL(forFileName: filename)

        try await Task.detached(priority: .userInitiated) {
            let jpeg = ImageProcessing.importedJPEG(from: data) ?? data
            try jpeg.write(to: photoURL, options: .atomic)
            ImageProcessing.writeJPEGThumbnail(from: jpeg, to: thumbURL, maxPixelSize: 300)
        }.value

        if let thumb = UIImage(contentsOfFile: thumbURL.path) {
            cacheThumbnail(thumb, key: filename as NSString)
        }

        let record = PhotoRecord(capturedAt: capturedAt, localFileName: filename, isVideo: false)
        modelContext.insert(record)
        try modelContext.save()
        return record
    }

    /// Import a movie file picked from the system library.
    func importVideo(
        from temporaryURL: URL,
        capturedAt: Date = .now,
        modelContext: ModelContext
    ) async throws -> PhotoRecord {
        let filename = makeFilename(extension: "mov", for: capturedAt)
        let destination = photosDirectory.appendingPathComponent(filename)
        let thumbURL = thumbnailURL(forFileName: filename)

        if fileManager.fileExists(atPath: destination.path) {
            try fileManager.removeItem(at: destination)
        }
        try fileManager.copyItem(at: temporaryURL, to: destination)
        try? fileManager.removeItem(at: temporaryURL)

        let thumb = await Task.detached(priority: .userInitiated) {
            ImageProcessing.videoThumbnail(at: destination, maxPixelSize: 300)
        }.value
        if let thumb, let cg = thumb.cgImage {
            ImageProcessing.writeOpaqueJPEG(cg, to: thumbURL)
            cacheThumbnail(thumb, key: filename as NSString)
        }

        let record = PhotoRecord(capturedAt: capturedAt, localFileName: filename, isVideo: true)
        modelContext.insert(record)
        try modelContext.save()
        return record
    }

    func localURL(for record: PhotoRecord) -> URL {
        photosDirectory.appendingPathComponent(record.localFileName)
    }

    func thumbnailURL(for record: PhotoRecord) -> URL {
        thumbnailURL(forFileName: record.localFileName)
    }

    private func thumbnailURL(forFileName fileName: String) -> URL {
        let base = (fileName as NSString).deletingPathExtension
        return thumbnailsDirectory.appendingPathComponent("\(base).jpg")
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

        if record.isVideo {
            let url = localURL(for: record)
            let thumb = await Task.detached(priority: .userInitiated) {
                ImageProcessing.videoThumbnail(at: url, maxPixelSize: 300)
            }.value
            if let thumb {
                cacheThumbnail(thumb, key: key)
                if let cg = thumb.cgImage {
                    ImageProcessing.writeOpaqueJPEG(cg, to: thumbnailURL(for: record))
                }
            }
            return thumb
        }

        let fullPath = localURL(for: record).path
        if let image = await downsample(path: fullPath, maxPixelSize: 300) {
            cacheThumbnail(image, key: key)
            if let cgImage = image.cgImage {
                ImageProcessing.writeOpaqueJPEG(cgImage, to: thumbnailURL(for: record))
            }
            return image
        }

        return nil
    }

    func loadDisplayImage(for record: PhotoRecord) async -> UIImage? {
        if record.isVideo {
            return await loadThumbnail(for: record)
        }
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
    /// Bake EXIF orientation into pixels, then center-crop to the target upright aspect.
    /// Portrait hold → tall image; landscape hold → wide image.
    static func uprightCroppedJPEG(from data: Data, uprightWidthOverHeight: CGFloat) -> Data? {
        guard let uiImage = UIImage(data: data) else { return nil }
        let upright = uiImage.normalizedUpOrientation()
        guard let cgImage = upright.cgImage else { return nil }

        let width = CGFloat(cgImage.width)
        let height = CGFloat(cgImage.height)
        guard width > 0, height > 0 else { return nil }

        let desired = max(uprightWidthOverHeight, 0.01) // width / height
        let current = width / height
        let cropped: CGImage
        if abs(current - desired) < 0.02 {
            cropped = cgImage
        } else if current > desired {
            let newWidth = height * desired
            let rect = CGRect(x: (width - newWidth) / 2, y: 0, width: newWidth, height: height).integral
            guard let slice = cgImage.cropping(to: rect) else { return nil }
            cropped = slice
        } else {
            let newHeight = width / desired
            let rect = CGRect(x: 0, y: (height - newHeight) / 2, width: width, height: newHeight).integral
            guard let slice = cgImage.cropping(to: rect) else { return nil }
            cropped = slice
        }

        let opaque = opaqueRGBImage(cropped)
        let mutable = NSMutableData()
        guard let destination = CGImageDestinationCreateWithData(
            mutable,
            "public.jpeg" as CFString,
            1,
            nil
        ) else { return nil }

        // Pixels are already upright — do not write a conflicting orientation tag.
        var props: [CFString: Any] = [
            kCGImageDestinationLossyCompressionQuality: 0.92,
            kCGImagePropertyOrientation: CGImagePropertyOrientation.up.rawValue
        ]
        if let original = CGImageSourceCreateWithData(data as CFData, nil),
           let sourceProps = CGImageSourceCopyPropertiesAtIndex(original, 0, nil) as? [CFString: Any] {
            if let exif = sourceProps[kCGImagePropertyExifDictionary] {
                props[kCGImagePropertyExifDictionary] = exif
            }
            if let tiff = sourceProps[kCGImagePropertyTIFFDictionary] as? [CFString: Any] {
                var cleaned = tiff
                cleaned[kCGImagePropertyTIFFOrientation] = CGImagePropertyOrientation.up.rawValue
                props[kCGImagePropertyTIFFDictionary] = cleaned
            }
        }
        CGImageDestinationAddImage(destination, opaque, props as CFDictionary)
        guard CGImageDestinationFinalize(destination) else { return nil }
        return mutable as Data
    }

    static func writeJPEGThumbnail(from data: Data, to url: URL, maxPixelSize: Int) {
        guard let source = CGImageSourceCreateWithData(
            data as CFData,
            [kCGImageSourceShouldCache: false] as CFDictionary
        ) else { return }
        guard let image = makeThumbnail(from: source, maxPixelSize: maxPixelSize) else { return }
        writeOpaqueJPEG(image, to: url)
    }

    static func writeOpaqueJPEG(_ image: CGImage, to url: URL) {
        let opaque = opaqueRGBImage(image)
        guard let destination = CGImageDestinationCreateWithURL(
            url as CFURL,
            "public.jpeg" as CFString,
            1,
            nil
        ) else { return }
        CGImageDestinationAddImage(
            destination,
            opaque,
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
        return UIImage(cgImage: opaqueRGBImage(image))
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

    /// JPEG has no alpha. ImageIO logs an error if we write an opaque bitmap that still
    /// carries `AlphaPremulLast`, and decoding it later uses about twice the memory.
    private static func opaqueRGBImage(_ image: CGImage) -> CGImage {
        guard image.alphaInfo != .none, image.alphaInfo != .noneSkipLast, image.alphaInfo != .noneSkipFirst else {
            return image
        }

        let colorSpace = CGColorSpaceCreateDeviceRGB()
        let bitmapInfo = CGBitmapInfo.byteOrder32Little.rawValue | CGImageAlphaInfo.noneSkipFirst.rawValue
        guard let context = CGContext(
            data: nil,
            width: image.width,
            height: image.height,
            bitsPerComponent: 8,
            bytesPerRow: 0,
            space: colorSpace,
            bitmapInfo: bitmapInfo
        ) else {
            return image
        }

        context.interpolationQuality = .high
        context.draw(image, in: CGRect(x: 0, y: 0, width: image.width, height: image.height))
        return context.makeImage() ?? image
    }

    static func videoThumbnail(at url: URL, maxPixelSize: Int) -> UIImage? {
        let asset = AVURLAsset(url: url)
        let generator = AVAssetImageGenerator(asset: asset)
        generator.appliesPreferredTrackTransform = true
        generator.maximumSize = CGSize(width: maxPixelSize, height: maxPixelSize)
        do {
            let cgImage = try generator.copyCGImage(at: .zero, actualTime: nil)
            return UIImage(cgImage: opaqueRGBImage(cgImage))
        } catch {
            return nil
        }
    }

    /// Bake orientation and encode JPEG for library imports (keep original framing).
    static func importedJPEG(from data: Data) -> Data? {
        guard let uiImage = UIImage(data: data) else { return nil }
        let upright = uiImage.normalizedUpOrientation()
        return upright.jpegData(compressionQuality: 0.92)
    }
}

private extension UIImage {
    /// Bake `imageOrientation` into pixel data so width/height match what the user saw.
    func normalizedUpOrientation() -> UIImage {
        guard imageOrientation != .up else { return self }
        let format = UIGraphicsImageRendererFormat.default()
        format.scale = scale
        format.opaque = true
        let renderer = UIGraphicsImageRenderer(size: size, format: format)
        return renderer.image { _ in
            draw(in: CGRect(origin: .zero, size: size))
        }
    }
}
