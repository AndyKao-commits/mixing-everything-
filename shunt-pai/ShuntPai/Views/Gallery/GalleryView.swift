import AVKit
import SwiftData
import SwiftUI
import UIKit

struct GalleryView: View {
    @Environment(\.modelContext) private var modelContext
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var entitlements: EntitlementService
    @ObservedObject var photoStore: PhotoStore

    @Query(sort: \PhotoRecord.capturedAt, order: .reverse) private var records: [PhotoRecord]
    @Query(sort: \TagRecord.createdAt, order: .forward) private var tags: [TagRecord]

    @State private var selectedID: UUID?
    @State private var showSettings = false
    @State private var isSelecting = false
    @State private var selectedIDs: Set<UUID> = []
    @State private var showShareSheet = false
    @State private var showDeleteConfirm = false
    @State private var errorMessage: String?
    /// `nil` = all, `untaggedFilterID` = no tags, otherwise a tag id.
    @State private var filterTagID: UUID?

    /// Cell frames in global coordinates for drag-select.
    @State private var cellFrames: [UUID: CGRect] = [:]
    @State private var dragAnchorID: UUID?
    @State private var dragSelects = true
    @State private var dragVisited: Set<UUID> = []

    private static let untaggedFilterID = UUID(uuidString: "00000000-0000-0000-0000-000000000001")!

    private let columns = [
        GridItem(.flexible(), spacing: 3),
        GridItem(.flexible(), spacing: 3),
        GridItem(.flexible(), spacing: 3)
    ]

    private var filteredRecords: [PhotoRecord] {
        if filterTagID == Self.untaggedFilterID {
            return records.filter(\.tags.isEmpty)
        }
        guard let filterTagID else { return records }
        return records.filter { photo in
            photo.tags.contains(where: { $0.id == filterTagID })
        }
    }

    private var untaggedCount: Int {
        records.filter(\.tags.isEmpty).count
    }

    var body: some View {
        NavigationStack {
            Group {
                if records.isEmpty {
                    ContentUnavailableView {
                        Label("尚無照片", systemImage: "photo.on.rectangle.angled")
                    } description: {
                        Text("點右下角相機開始拍攝。")
                    }
                } else {
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 18, pinnedViews: [.sectionHeaders]) {
                            tagsSection

                            ForEach(photoStore.groupedRecords(filteredRecords), id: \.0) { section, items in
                                Section {
                                    LazyVGrid(columns: columns, spacing: 3) {
                                        ForEach(items) { record in
                                            GalleryCell(
                                                record: record,
                                                photoStore: photoStore,
                                                isSelecting: isSelecting,
                                                isChosen: selectedIDs.contains(record.id)
                                            )
                                            .contentShape(Rectangle())
                                            .background(
                                                GeometryReader { geo in
                                                    Color.clear.preference(
                                                        key: GalleryCellFrameKey.self,
                                                        value: [record.id: geo.frame(in: .named("galleryScroll"))]
                                                    )
                                                }
                                            )
                                            .onTapGesture {
                                                handleTap(record)
                                            }
                                        }
                                    }
                                    .padding(.horizontal, 2)
                                } header: {
                                    HStack {
                                        Text(friendlySectionTitle(for: items, fallback: section))
                                            .font(.title3.weight(.bold))
                                        Spacer()
                                        Text("\(items.count)")
                                            .font(.subheadline.weight(.semibold))
                                            .foregroundStyle(.secondary)
                                    }
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 8)
                                    .background(Color(.systemBackground).opacity(0.94))
                                }
                            }
                        }
                        .padding(.bottom, isSelecting ? 88 : 96)
                    }
                    .coordinateSpace(name: "galleryScroll")
                    .onPreferenceChange(GalleryCellFrameKey.self) { cellFrames = $0 }
                    .simultaneousGesture(isSelecting ? dragSelectGesture : nil)
                    .safeAreaInset(edge: .bottom) {
                        if isSelecting {
                            selectionBar
                        }
                    }
                }
            }
            .background(Color(.systemBackground).ignoresSafeArea())
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text(AppConstants.appName)
                        .font(.title2.weight(.heavy))
                }
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        showSettings = true
                    } label: {
                        Image(systemName: "gearshape")
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    if !records.isEmpty {
                        Button(isSelecting ? "取消" : "選取") {
                            isSelecting.toggle()
                            if !isSelecting { selectedIDs.removeAll() }
                        }
                        .fontWeight(.semibold)
                    }
                }
            }
            .fullScreenCover(isPresented: Binding(
                get: { selectedID != nil },
                set: { if !$0 { selectedID = nil } }
            )) {
                if let selectedID {
                    PhotoPagerView(
                        initialID: selectedID,
                        photoStore: photoStore,
                        onClose: { self.selectedID = nil }
                    )
                }
            }
            .sheet(isPresented: $showSettings) {
                SettingsView(photoStore: photoStore)
            }
            .sheet(isPresented: $showShareSheet) {
                let items = selectedShareItems()
                if items.isEmpty {
                    Text("找不到檔案").padding()
                } else {
                    ActivityShareSheet(items: items)
                }
            }
            .confirmationDialog(
                "確定刪除 \(selectedIDs.count) 項？",
                isPresented: $showDeleteConfirm,
                titleVisibility: .visible
            ) {
                Button("刪除", role: .destructive) {
                    deleteSelected()
                }
            }
            .alert("操作失敗", isPresented: Binding(
                get: { errorMessage != nil },
                set: { if !$0 { errorMessage = nil } }
            )) {
                Button("好", role: .cancel) {}
            } message: {
                Text(errorMessage ?? "")
            }
            .onChange(of: entitlements.isPaid) { _, isPaid in
                if !isPaid {
                    isSelecting = false
                    selectedIDs.removeAll()
                }
            }
            .onChange(of: isSelecting) { _, selecting in
                appState.isGallerySelecting = selecting
                if !selecting {
                    selectedIDs.removeAll()
                    resetDragState()
                }
            }
            .onDisappear {
                appState.isGallerySelecting = false
            }
        }
    }

    private var dragSelectGesture: some Gesture {
        // Press briefly then drag across cells — like Photos range select.
        LongPressGesture(minimumDuration: 0.15)
            .sequenced(before: DragGesture(minimumDistance: 0, coordinateSpace: .named("galleryScroll")))
            .onChanged { value in
                switch value {
                case .second(true, let drag?):
                    handleDragChanged(at: drag.location)
                default:
                    break
                }
            }
            .onEnded { _ in
                resetDragState()
            }
    }

    private var tagsSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("標籤")
                .font(.title3.weight(.bold))
                .padding(.horizontal, 16)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    tagChip(title: "全部 \(records.count)", selected: filterTagID == nil) {
                        filterTagID = nil
                    }

                    if untaggedCount > 0 {
                        tagChip(
                            title: "無標籤 \(untaggedCount)",
                            selected: filterTagID == Self.untaggedFilterID
                        ) {
                            filterTagID = Self.untaggedFilterID
                        }
                    }

                    ForEach(tags) { tag in
                        tagChip(
                            title: "\(tag.name) \(tag.photos.count)",
                            selected: filterTagID == tag.id
                        ) {
                            filterTagID = tag.id
                        }
                    }
                }
                .padding(.horizontal, 16)
            }
        }
        .padding(.top, 8)
    }

    private func tagChip(title: String, selected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(selected ? Color.white : Color.primary)
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(
                    Capsule().fill(selected ? Color.primary : Color(.secondarySystemBackground))
                )
        }
        .buttonStyle(.plain)
    }

    private var selectionBar: some View {
        HStack(spacing: 16) {
            Button {
                showShareSheet = true
            } label: {
                Label("分享／下載", systemImage: "square.and.arrow.up")
            }
            .disabled(selectedIDs.isEmpty)

            Spacer()

            Button(role: .destructive) {
                showDeleteConfirm = true
            } label: {
                Label("刪除", systemImage: "trash")
            }
            .disabled(selectedIDs.isEmpty || (!entitlements.isPaid && selectedIDs.count > 1))
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 14)
        .background(.ultraThinMaterial)
    }

    private func friendlySectionTitle(for items: [PhotoRecord], fallback: String) -> String {
        guard let first = items.first else { return fallback }
        let calendar = Calendar.current
        if calendar.isDateInToday(first.capturedAt) { return "今天" }
        if calendar.isDateInYesterday(first.capturedAt) { return "昨天" }
        return fallback
    }

    private func handleTap(_ record: PhotoRecord) {
        if isSelecting {
            if selectedIDs.contains(record.id) {
                selectedIDs.remove(record.id)
            } else {
                selectedIDs.insert(record.id)
            }
        } else {
            selectedID = record.id
        }
    }

    private func handleDragChanged(at point: CGPoint) {
        guard let hitID = cellFrames.first(where: { $0.value.contains(point) })?.key else { return }
        let ordered = filteredRecords.map(\.id)

        if dragAnchorID == nil {
            dragAnchorID = hitID
            dragSelects = !selectedIDs.contains(hitID)
            dragVisited = [hitID]
            applyDragSelection(to: hitID)
            return
        }

        guard let anchor = dragAnchorID,
              let start = ordered.firstIndex(of: anchor),
              let end = ordered.firstIndex(of: hitID) else { return }

        let range = Set(ordered[min(start, end)...max(start, end)])
        // Clear previous drag range side-effects by re-applying from anchor state.
        for id in dragVisited where !range.contains(id) && id != anchor {
            if dragSelects {
                selectedIDs.remove(id)
            } else {
                selectedIDs.insert(id)
            }
        }
        for id in range {
            applyDragSelection(to: id)
        }
        dragVisited = range
    }

    private func applyDragSelection(to id: UUID) {
        if dragSelects {
            selectedIDs.insert(id)
        } else {
            selectedIDs.remove(id)
        }
    }

    private func resetDragState() {
        dragAnchorID = nil
        dragVisited = []
    }

    private func selectedShareItems() -> [URL] {
        photoStore.shareableURLs(for: records.filter { selectedIDs.contains($0.id) })
    }

    private func deleteSelected() {
        let targets = records.filter { selectedIDs.contains($0.id) }
        do {
            for record in targets {
                try photoStore.delete(record: record, modelContext: modelContext)
            }
            selectedIDs.removeAll()
            isSelecting = false
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

private struct GalleryCellFrameKey: PreferenceKey {
    static var defaultValue: [UUID: CGRect] = [:]
    static func reduce(value: inout [UUID: CGRect], nextValue: () -> [UUID: CGRect]) {
        value.merge(nextValue(), uniquingKeysWith: { $1 })
    }
}

struct GalleryCell: View {
    let record: PhotoRecord
    let photoStore: PhotoStore
    var isSelecting: Bool = false
    var isChosen: Bool = false
    @State private var image: UIImage?

    private static let timeFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "zh_TW")
        formatter.dateFormat = "HH:mm"
        return formatter
    }()

    var body: some View {
        Color(.secondarySystemBackground)
            .aspectRatio(1, contentMode: .fit)
            .overlay {
                if let image {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFill()
                }
            }
            .overlay(alignment: .bottomLeading) {
                HStack(spacing: 4) {
                    if record.isVideo {
                        Image(systemName: "video.fill")
                            .font(.caption2.weight(.bold))
                    }
                    Text(Self.timeFormatter.string(from: record.capturedAt))
                        .font(.caption2.weight(.semibold))
                }
                .foregroundStyle(.white)
                .shadow(color: .black.opacity(0.55), radius: 2, y: 1)
                .padding(6)
            }
            .overlay(alignment: .topTrailing) {
                if isSelecting {
                    Image(systemName: isChosen ? "checkmark.circle.fill" : "circle")
                        .font(.title3)
                        .foregroundStyle(isChosen ? Color.yellow : Color.white)
                        .padding(6)
                        .shadow(radius: 2)
                }
            }
            .opacity(isSelecting && !isChosen ? 0.72 : 1)
            .clipped()
            .contentShape(Rectangle())
            .task(id: record.id) {
                image = await photoStore.loadThumbnail(for: record)
            }
    }
}
