import Foundation

@MainActor
final class EntitlementService: ObservableObject {
    @Published private(set) var isPaid: Bool

    init() {
        isPaid = UserDefaults.standard.bool(forKey: AppConstants.paidModeEnabledKey)
    }

    var planName: String {
        isPaid ? "訂閱制（測試）" : "免費版"
    }

    func setPaid(_ paid: Bool) {
        isPaid = paid
        UserDefaults.standard.set(paid, forKey: AppConstants.paidModeEnabledKey)
    }

    func canCaptureMore(currentCount: Int) -> Bool {
        isPaid || currentCount < AppConstants.freePhotoLimit
    }

    func remainingFreeSlots(currentCount: Int) -> Int {
        max(0, AppConstants.freePhotoLimit - currentCount)
    }
}
