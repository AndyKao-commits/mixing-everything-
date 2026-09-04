import Foundation
import ImageIO
import UIKit

struct PhotoShootingInfo: Equatable {
    var capturedAt: Date?
    var resolution: String?
    var fileSize: String?
    var format: String?
    var colorModel: String?
    var cameraMake: String?
    var cameraModel: String?
    var lens: String?
    var focalLength: String?
    var aperture: String?
    var shutterSpeed: String?
    var iso: String?
    var software: String?

    var rows: [(String, String)] {
        var result: [(String, String)] = []
        if let capturedAt {
            result.append(("拍攝時間", Self.dateFormatter.string(from: capturedAt)))
        }
        if let resolution { result.append(("解析度", resolution)) }
        if let fileSize { result.append(("檔案大小", fileSize)) }
        if let format { result.append(("格式", format)) }
        if let colorModel { result.append(("色彩模型", colorModel)) }
        if let cameraModel { result.append(("相機型號", cameraModel)) }
        if let cameraMake { result.append(("相機品牌", cameraMake)) }
        if let lens { result.append(("鏡頭", lens)) }
        if let focalLength { result.append(("焦距", focalLength)) }
        if let aperture { result.append(("光圈", aperture)) }
        if let shutterSpeed { result.append(("快門", shutterSpeed)) }
        if let iso { result.append(("ISO", iso)) }
        if let software { result.append(("軟體", software)) }
        return result
    }

    private static let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "zh_TW")
        formatter.dateStyle = .long
        formatter.timeStyle = .short
        return formatter
    }()
}

enum PhotoMetadataReader {
    static func shootingInfo(at url: URL, fallbackDate: Date) -> PhotoShootingInfo {
        var info = PhotoShootingInfo(capturedAt: fallbackDate)

        let values = try? url.resourceValues(forKeys: [.fileSizeKey])
        if let size = values?.fileSize {
            info.fileSize = ByteCountFormatter.string(fromByteCount: Int64(size), countStyle: .file)
        }
        info.format = url.pathExtension.uppercased().isEmpty ? "JPEG" : url.pathExtension.uppercased()

        guard let source = CGImageSourceCreateWithURL(url as CFURL, nil) else { return info }
        guard let properties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any] else {
            return info
        }

        if let width = properties[kCGImagePropertyPixelWidth] as? Int,
           let height = properties[kCGImagePropertyPixelHeight] as? Int {
            info.resolution = "\(width) x \(height)"
        }
        if let colorModel = properties[kCGImagePropertyColorModel] as? String {
            info.colorModel = colorModel
        }

        if let exif = properties[kCGImagePropertyExifDictionary] as? [CFString: Any] {
            if let dateString = exif[kCGImagePropertyExifDateTimeOriginal] as? String,
               let date = Self.exifDateFormatter.date(from: dateString) {
                info.capturedAt = date
            }
            if let aperture = exif[kCGImagePropertyExifFNumber] as? Double {
                info.aperture = String(format: "f/%.1f", aperture)
            } else if let aperture = exif[kCGImagePropertyExifFNumber] as? Int {
                info.aperture = "f/\(aperture)"
            }
            if let exposure = exif[kCGImagePropertyExifExposureTime] as? Double {
                info.shutterSpeed = formatShutter(exposure)
            }
            if let isoValues = exif[kCGImagePropertyExifISOSpeedRatings] as? [Int], let iso = isoValues.first {
                info.iso = "\(iso)"
            }
            if let focal = exif[kCGImagePropertyExifFocalLength] as? Double {
                info.focalLength = String(format: "%.0fmm", focal)
            }
            if let lensModel = exif["LensModel" as CFString] as? String {
                info.lens = lensModel
            } else if let lensMake = exif["LensMake" as CFString] as? String {
                info.lens = lensMake
            }
        }

        if let tiff = properties[kCGImagePropertyTIFFDictionary] as? [CFString: Any] {
            if let make = tiff[kCGImagePropertyTIFFMake] as? String {
                info.cameraMake = make
            }
            if let model = tiff[kCGImagePropertyTIFFModel] as? String {
                info.cameraModel = model
            }
            if let software = tiff[kCGImagePropertyTIFFSoftware] as? String {
                info.software = software
            }
        }

        return info
    }

    private static let exifDateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy:MM:dd HH:mm:ss"
        return formatter
    }()

    private static func formatShutter(_ seconds: Double) -> String {
        if seconds >= 1 {
            return String(format: "%.1fs", seconds)
        }
        let reciprocal = Int((1.0 / seconds).rounded())
        return "1/\(max(reciprocal, 1))s"
    }
}
