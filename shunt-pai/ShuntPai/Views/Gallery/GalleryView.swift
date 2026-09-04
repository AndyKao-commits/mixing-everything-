import AVKit
import PhotosUI
import SwiftData
import SwiftUI
import UIKit
import UniformTypeIdentifiers

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
    @State private var showBatchTagSheet = false
    @State private var errorMessage: String?
    @State private var importMessage: String?
    @State private var isImporting = false
    @State private var pickerItems: [PhotosPickerItem] = []
    /// `nil` = all, `untaggedFilterID` = no tags, otherwise a tag id.
    @State private var filterTagID: UUID?

    /// Cell frames in viewport coordinates for drag-select.
    @State private var cellFrames: [UUID: CGRect] = [:]
    @State private var dragAnchorID: UUID?
    @State private var dragLastHitID: UUID?
    @State private var dragSelects = true
    @State private var dragVisited: Set<UUID> = []
    @State private var isDragSelecting = false
    @State private var viewportHeight: CGFloat = 0
    @State private var autoScrollDirection = 0
    @State private var autoScrollTimer: Timer?
    @State private var scrollProxy: ScrollViewProxy?

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

    private var selectedRecords: [PhotoRecord] {
        records.filter { selectedIDs.contains($0.id) }
    }

    private var untaggedCount: Int {
        records.filter(\.tags.isEmpty).count
    }

    private var importSelectionLimit: Int {
        if entitlements.isPaid { return 100 }
        return max(entitlements.remainingFreeSlots(currentCount: records.count), 0)
    }

    var body: some View {
        NavigationStack {
            Group {
                if records.isEmpty {
                    emptyState
                } else {
                    galleryScroll
                }
            }
            .overlay {
                if isImporting {
                    ZStack {
                        Color.black.opacity(0.35).ignoresSafeArea()
                        ProgressView("匯入中…")
                            .padding(20)
                            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 14))
                    }
                }
            }
            .background(Color(.systemBackground).ignoresSafeArea())
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { toolbarContent }
            .onChange(of: pickerItems) { _, items in
                guard !items.isEmpty else { return }
                Task { await importPickedItems(items) }
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
            .sheet(isPresented: $showBatchTagSheet) {
                BatchTagSheet(records: selectedRecords, allTags: tags)
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
            .alert("匯入完成", isPresented: Binding(
                get: { importMessage != nil },
                set: { if !$0 { importMessage = nil } }
            )) {
                Button("好", role: .cancel) {}
            } message: {
                Text(importMessage ?? "")
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
                stopAutoScroll()
            }
        }
    }

    private var emptyState: some View {
        ContentUnavailableView {
            Label("尚無照片", systemImage: "photo.on.rectangle.angled")
        } description: {
            Text("點右下角相機拍攝，或從 iPhone 相簿匯入。")
        } actions: {
            importPickerButton
                .buttonStyle(.borderedProminent)
                .tint(.yellow)
                .foregroundStyle(.black)
                .disabled(importSelectionLimit == 0 || isImporting)
        }
    }

    private var galleryScroll: some View {
        ScrollViewReader { proxy in
            GeometryReader { viewport in
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
                                        .id(record.id)
                                        .contentShape(Rectangle())
                                        .background(
                                            GeometryReader { geo in
                                                Color.clear.preference(
                                                    key: GalleryCellFrameKey.self,
                                                    value: [record.id: geo.frame(in: .named("galleryViewport"))]
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
                .coordinateSpace(name: "galleryViewport")
                .scrollDisabled(isDragSelecting)
                .onAppear {
                    scrollProxy = proxy
                    viewportHeight = viewport.size.height
                }
                .onChange(of: viewport.size.height) { _, height in
                    viewportHeight = height
                }
                .onPreferenceChange(GalleryCellFrameKey.self) { cellFrames = $0 }
                .highPriorityGesture(isSelecting ? dragSelectGesture : nil)
                .safeAreaInset(edge: .bottom) {
                    if isSelecting {
                        selectionBar
                    }
                }
            }
        }
    }

    @ToolbarContentBuilder
    private var toolbarContent: some ToolbarContent {
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
        ToolbarItemGroup(placement: .topBarTrailing) {
            if !isSelecting {
                importPickerButton
                    .disabled(importSelectionLimit == 0 || isImporting)
            }
            if !records.isEmpty {
                Button(isSelecting ? "取消" : "選取") {
                    isSelecting.toggle()
                    if !isSelecting { selectedIDs.removeAll() }
                }
                .fontWeight(.semibold)
            }
        }
    }

    private var importPickerButton: some View {
        PhotosPicker(
            selection: $pickerItems,
            maxSelectionCount: max(importSelectionLimit, 1),
            matching: .any(of: [.images, .videos])
        ) {
            Label("匯入", systemImage: "square.and.arrow.down")
        }
    }

    private var dragSelectGesture: some Gesture {
        // Long-press then drag: locks scroll and selects a contiguous range.
        LongPressGesture(minimumDuration: 0.12)
            .sequenced(before: DragGesture(minimumDistance: 0, coordinateSpace: .named("galleryViewport")))
            .onChanged { value in
                switch value {
                case .first(true):
                    // Armed — wait for drag.
                    break
                case .second(true, let drag?):
                    if !isDragSelecting {
                        isDragSelecting = true
                    }
                    handleDragChanged(at: drag.location)
                    updateAutoScroll(for: drag.location.y)
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
        HStack(spacing: 14) {
            Button {
                showShareSheet = true
            } label: {
                Label("分享", systemImage: "square.and.arrow.up")
            }
            .disabled(selectedIDs.isEmpty)

            Button {
                showBatchTagSheet = true
            } label: {
                Label("標籤", systemImage: "tag")
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
        let hitID = cellFrames.first(where: { $0.value.contains(point) })?.key
            ?? nearestCellID(to: point)
        guard let hitID else { return }
        let ordered = filteredRecords.map(\.id)

        if dragAnchorID == nil {
            dragAnchorID = hitID
            dragSelects = !selectedIDs.contains(hitID)
            dragVisited = [hitID]
            dragLastHitID = hitID
            applyDragSelection(to: hitID)
            return
        }

        guard let anchor = dragAnchorID,
              let start = ordered.firstIndex(of: anchor),
              let end = ordered.firstIndex(of: hitID) else { return }

        let range = Set(ordered[min(start, end)...max(start, end)])
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
        dragLastHitID = hitID
    }

    private func nearestCellID(to point: CGPoint) -> UUID? {
        cellFrames.min { lhs, rhs in
            hypot(lhs.value.midX - point.x, lhs.value.midY - point.y)
                < hypot(rhs.value.midX - point.x, rhs.value.midY - point.y)
        }?.key
    }

    private func applyDragSelection(to id: UUID) {
        if dragSelects {
            selectedIDs.insert(id)
        } else {
            selectedIDs.remove(id)
        }
    }

    private func updateAutoScroll(for fingerY: CGFloat) {
        let edge: CGFloat = 64
        if fingerY < edge {
            startAutoScroll(direction: -1)
        } else if fingerY > max(viewportHeight - edge, edge + 1) {
            startAutoScroll(direction: 1)
        } else {
            stopAutoScroll()
        }
    }

    private func startAutoScroll(direction: Int) {
        guard autoScrollDirection != direction else { return }
        stopAutoScroll()
        autoScrollDirection = direction
        let timer = Timer.scheduledTimer(withTimeInterval: 0.11, repeats: true) { _ in
            Task { @MainActor in
                self.performAutoScrollStep()
            }
        }
        RunLoop.main.add(timer, forMode: .common)
        autoScrollTimer = timer
        performAutoScrollStep()
    }

    private func stopAutoScroll() {
        autoScrollTimer?.invalidate()
        autoScrollTimer = nil
        autoScrollDirection = 0
    }

    private func performAutoScrollStep() {
        guard isDragSelecting, autoScrollDirection != 0, let proxy = scrollProxy else { return }
        let ordered = filteredRecords.map(\.id)
        guard let current = dragLastHitID ?? dragAnchorID,
              let idx = ordered.firstIndex(of: current) else { return }
        let next = idx + autoScrollDirection
        guard ordered.indices.contains(next) else { return }
        let target = ordered[next]
        withAnimation(.easeOut(duration: 0.1)) {
            proxy.scrollTo(target, anchor: autoScrollDirection > 0 ? .bottom : .top)
        }
        // Extend selection toward the scrolled cell.
        if let anchor = dragAnchorID,
           let start = ordered.firstIndex(of: anchor) {
            let range = Set(ordered[min(start, next)...max(start, next)])
            for id in range { applyDragSelection(to: id) }
            dragVisited = range
            dragLastHitID = target
        }
    }

    private func resetDragState() {
        stopAutoScroll()
        isDragSelecting = false
        dragAnchorID = nil
        dragLastHitID = nil
        dragVisited = []
    }

    private func selectedShareItems() -> [URL] {
        photoStore.shareableURLs(for: selectedRecords)
    }

    private func deleteSelected() {
        let targets = selectedRecords
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

    @MainActor
    private func importPickedItems(_ items: [PhotosPickerItem]) async {
        defer {
            pickerItems = []
            isImporting = false
        }

        let limit = importSelectionLimit
        guard limit > 0 else {
            errorMessage = "免費版已達 \(AppConstants.freePhotoLimit) 張上限"
            return
        }

        isImporting = true
        let capped = Array(items.prefix(limit))
        var imported = 0
        var failed = 0

        for item in capped {
            do {
                if item.supportedContentTypes.contains(where: {
                    $0.conforms(to: .movie) || $0.conforms(to: .audiovisualContent)
                }) {
                    if let movie = try await item.loadTransferable(type: ImportedMovie.self) {
                        _ = try await photoStore.importVideo(from: movie.url, modelContext: modelContext)
                        imported += 1
                        continue
                    }
                }

                if let data = try await item.loadTransferable(type: Data.self) {
                    _ = try await photoStore.importImage(data: data, modelContext: modelContext)
                    imported += 1
                } else if let movie = try await item.loadTransferable(type: ImportedMovie.self) {
                    _ = try await photoStore.importVideo(from: movie.url, modelContext: modelContext)
                    imported += 1
                } else {
                    failed += 1
                }
            } catch {
                failed += 1
            }
        }

        let skipped = items.count - capped.count
        var parts: [String] = []
        if imported > 0 { parts.append("已匯入 \(imported) 項") }
        if skipped > 0 { parts.append("因免費上限略過 \(skipped) 項") }
        if failed > 0 { parts.append("失敗 \(failed) 項") }
        if parts.isEmpty {
            errorMessage = "無法匯入所選項目"
        } else {
            importMessage = parts.joined(separator: "，")
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

/// Apply / remove one tag across every currently selected record.
struct BatchTagSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext
    let records: [PhotoRecord]
    let allTags: [TagRecord]

    @State private var showCreate = false
    @State private var newTagName = ""

    var body: some View {
        NavigationStack {
            Group {
                if allTags.isEmpty {
                    ContentUnavailableView {
                        Label("尚無標籤", systemImage: "tag.slash")
                    } description: {
                        Text("先新增標籤，再一次套用到選取的 \(records.count) 項。")
                    }
                } else {
                    List {
                        Section {
                            Text("已選 \(records.count) 項。點標籤可全部加上；若已全部擁有則改為全部移除。")
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }

                        Section {
                            ForEach(allTags) { tag in
                                Button {
                                    apply(tag)
                                } label: {
                                    HStack {
                                        Text(tag.name)
                                            .foregroundStyle(.primary)
                                        Spacer()
                                        statusIcon(for: tag)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("一次標籤")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("新增") { showCreate = true }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("完成") {
                        try? modelContext.save()
                        dismiss()
                    }
                    .fontWeight(.semibold)
                }
            }
            .alert("新增標籤", isPresented: $showCreate) {
                TextField("標籤名稱", text: $newTagName)
                Button("取消", role: .cancel) { newTagName = "" }
                Button("新增") {
                    let name = newTagName.trimmingCharacters(in: .whitespacesAndNewlines)
                    guard !name.isEmpty else { return }
                    let tag = TagRecord(name: name)
                    modelContext.insert(tag)
                    apply(tag)
                    newTagName = ""
                }
            } message: {
                Text("例如：施工、驗收、客戶現場")
            }
        }
        .presentationDetents([.medium, .large])
    }

    @ViewBuilder
    private func statusIcon(for tag: TagRecord) -> some View {
        let count = records.filter { photo in
            photo.tags.contains(where: { $0.id == tag.id })
        }.count
        if count == records.count, !records.isEmpty {
            Image(systemName: "checkmark.circle.fill")
                .foregroundStyle(.yellow)
        } else if count > 0 {
            Image(systemName: "minus.circle.fill")
                .foregroundStyle(.orange)
        } else {
            Image(systemName: "circle")
                .foregroundStyle(.secondary)
        }
    }

    private func apply(_ tag: TagRecord) {
        let allHave = !records.isEmpty && records.allSatisfy { photo in
            photo.tags.contains(where: { $0.id == tag.id })
        }
        if allHave {
            for record in records {
                record.tags.removeAll { $0.id == tag.id }
            }
        } else {
            for record in records where !record.tags.contains(where: { $0.id == tag.id }) {
                record.tags.append(tag)
            }
        }
        try? modelContext.save()
    }
}
