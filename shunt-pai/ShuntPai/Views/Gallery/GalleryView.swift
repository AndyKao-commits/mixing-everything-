import SwiftData
import SwiftUI
import UIKit

struct GalleryView: View {
    @Environment(\.modelContext) private var modelContext
    @EnvironmentObject private var entitlements: EntitlementService
    @ObservedObject var photoStore: PhotoStore

    @Query(sort: \PhotoRecord.capturedAt, order: .reverse) private var records: [PhotoRecord]

    @State private var selectedID: UUID?
    @State private var showSettings = false
    @State private var isSelecting = false
    @State private var selectedIDs: Set<UUID> = []
    @State private var showShareSheet = false
    @State private var showDeleteConfirm = false
    @State private var errorMessage: String?

    private let columns = [
        GridItem(.flexible(), spacing: 2),
        GridItem(.flexible(), spacing: 2),
        GridItem(.flexible(), spacing: 2)
    ]

    var body: some View {
        NavigationStack {
            Group {
                if records.isEmpty {
                    ContentUnavailableView {
                        Label("尚無照片", systemImage: "photo.on.rectangle.angled")
                    } description: {
                        Text("在相機頁拍的照片會保存在這裡。")
                    }
                } else {
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 20, pinnedViews: [.sectionHeaders]) {
                            ForEach(photoStore.groupedRecords(records), id: \.0) { section, items in
                                Section {
                                    LazyVGrid(columns: columns, spacing: 2) {
                                        ForEach(items) { record in
                                            Button {
                                                handleTap(record)
                                            } label: {
                                                GalleryCell(
                                                    record: record,
                                                    photoStore: photoStore,
                                                    isSelecting: isSelecting,
                                                    isChosen: selectedIDs.contains(record.id)
                                                )
                                            }
                                            .buttonStyle(.plain)
                                        }
                                    }
                                } header: {
                                    Text(section)
                                        .font(.subheadline.weight(.semibold))
                                        .foregroundStyle(.white)
                                        .frame(maxWidth: .infinity, alignment: .leading)
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 8)
                                        .background(Color.black.opacity(0.92))
                                }
                            }
                        }
                        .padding(.bottom, isSelecting ? 84 : 12)
                    }
                    .safeAreaInset(edge: .bottom) {
                        if isSelecting {
                            selectionBar
                        }
                    }
                }
            }
            .background(Color.black.ignoresSafeArea())
            .navigationTitle(navigationTitle)
            .navigationBarTitleDisplayMode(.large)
            .toolbarBackground(Color.black, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    if entitlements.isPaid, !records.isEmpty {
                        Button(isSelecting ? "取消" : "選取") {
                            isSelecting.toggle()
                            if !isSelecting { selectedIDs.removeAll() }
                        }
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showSettings = true
                    } label: {
                        Image(systemName: "gearshape")
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
                ActivityShareSheet(items: selectedImages())
            }
            .confirmationDialog(
                "確定刪除 \(selectedIDs.count) 張照片？",
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
        }
    }

    private var navigationTitle: String {
        if isSelecting {
            return selectedIDs.isEmpty ? "選取照片" : "已選 \(selectedIDs.count) 張"
        }
        if entitlements.isPaid {
            return "分流拍相簿"
        }
        return "相簿 \(records.count)/\(AppConstants.freePhotoLimit)"
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
            .disabled(selectedIDs.isEmpty)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 14)
        .background(.ultraThinMaterial)
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

    private func selectedImages() -> [UIImage] {
        records
            .filter { selectedIDs.contains($0.id) }
            .compactMap { photoStore.loadImage(for: $0) }
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

struct GalleryCell: View {
    let record: PhotoRecord
    let photoStore: PhotoStore
    var isSelecting: Bool = false
    var isChosen: Bool = false

    var body: some View {
        Color.black
            .aspectRatio(1, contentMode: .fit)
            .overlay {
                if let image = photoStore.loadThumbnail(for: record) {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFill()
                } else {
                    Color.white.opacity(0.08)
                }
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
    }
}

struct ZoomablePhotoView: View {
    let image: UIImage

    @State private var scale: CGFloat = 1
    @State private var lastScale: CGFloat = 1
    @State private var offset: CGSize = .zero
    @State private var lastOffset: CGSize = .zero

    var body: some View {
        Image(uiImage: image)
            .resizable()
            .scaledToFit()
            .scaleEffect(scale)
            .offset(offset)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .clipped()
            .gesture(magnifyGesture)
            .highPriorityGesture(panGesture, including: scale > 1.02 ? .all : .subviews)
            .onTapGesture(count: 2, perform: toggleZoom)
    }

    private var magnifyGesture: some Gesture {
        MagnificationGesture()
            .onChanged { value in
                let next = lastScale * value
                scale = min(max(next, 1), 6)
            }
            .onEnded { _ in
                lastScale = scale
                if scale <= 1.02 {
                    withAnimation(.easeOut(duration: 0.2)) { reset() }
                }
            }
    }

    private var panGesture: some Gesture {
        DragGesture()
            .onChanged { value in
                guard scale > 1.02 else { return }
                offset = CGSize(
                    width: lastOffset.width + value.translation.width,
                    height: lastOffset.height + value.translation.height
                )
            }
            .onEnded { _ in
                lastOffset = offset
            }
    }

    private func toggleZoom() {
        withAnimation(.easeInOut(duration: 0.2)) {
            if scale > 1.02 {
                reset()
            } else {
                scale = 2.5
                lastScale = 2.5
            }
        }
    }

    private func reset() {
        scale = 1
        lastScale = 1
        offset = .zero
        lastOffset = .zero
    }
}
    @Environment(\.modelContext) private var modelContext
    @EnvironmentObject private var entitlements: EntitlementService

    let initialID: UUID
    let photoStore: PhotoStore
    let onClose: () -> Void

    @Query(sort: \PhotoRecord.capturedAt, order: .reverse) private var records: [PhotoRecord]

    @State private var currentID: UUID
    @State private var showFirstDeleteConfirm = false
    @State private var showSecondDeleteConfirm = false
    @State private var showShareSheet = false
    @State private var errorMessage: String?

    init(initialID: UUID, photoStore: PhotoStore, onClose: @escaping () -> Void) {
        self.initialID = initialID
        self.photoStore = photoStore
        self.onClose = onClose
        _currentID = State(initialValue: initialID)
    }

    private var currentRecord: PhotoRecord? {
        records.first { $0.id == currentID } ?? records.first
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.black.ignoresSafeArea()

                if records.isEmpty {
                    Text("沒有照片")
                        .foregroundStyle(.secondary)
                } else {
                    TabView(selection: $currentID) {
                        ForEach(records) { record in
                            Group {
                                if let image = photoStore.loadImage(for: record) {
                                    ZoomablePhotoView(image: image)
                                } else {
                                    Color.black
                                }
                            }
                            .tag(record.id)
                        }
                    }
                    .tabViewStyle(.page(indexDisplayMode: .automatic))
                }

                VStack {
                    Spacer()
                    HStack(spacing: 28) {
                        Button {
                            showShareSheet = true
                        } label: {
                            Label("分享", systemImage: "square.and.arrow.up")
                        }

                        Button(role: .destructive) {
                            showFirstDeleteConfirm = true
                        } label: {
                            Label("刪除", systemImage: "trash")
                        }
                    }
                    .font(.headline)
                    .foregroundStyle(.white)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 14)
                    .background(Color.white.opacity(0.12))
                    .clipShape(Capsule())
                    .padding(.bottom, 28)
                }
            }
            .navigationTitle(titleText)
            .navigationBarTitleDisplayMode(.inline)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("關閉", action: onClose)
                }
            }
            .confirmationDialog("確定刪除這張照片？", isPresented: $showFirstDeleteConfirm, titleVisibility: .visible) {
                Button("刪除", role: .destructive) {
                    if entitlements.isPaid {
                        deleteCurrent()
                    } else {
                        showSecondDeleteConfirm = true
                    }
                }
            }
            .alert("再確認一次", isPresented: $showSecondDeleteConfirm) {
                Button("取消", role: .cancel) {}
                Button("確定刪除", role: .destructive) {
                    deleteCurrent()
                }
            } message: {
                Text("免費版刪除後無法復原，請再按一次確認。")
            }
            .sheet(isPresented: $showShareSheet) {
                if let record = currentRecord, let image = photoStore.loadImage(for: record) {
                    ActivityShareSheet(items: [image])
                }
            }
            .alert("刪除失敗", isPresented: Binding(
                get: { errorMessage != nil },
                set: { if !$0 { errorMessage = nil } }
            )) {
                Button("好", role: .cancel) {}
            } message: {
                Text(errorMessage ?? "")
            }
            .onChange(of: records.map(\.id)) { _, ids in
                if records.isEmpty {
                    onClose()
                } else if !ids.contains(currentID), let first = records.first {
                    currentID = first.id
                }
            }
        }
    }

    private var titleText: String {
        guard let index = records.firstIndex(where: { $0.id == currentID }) else {
            return "照片"
        }
        return "\(index + 1) / \(records.count)"
    }

    private func deleteCurrent() {
        guard let record = currentRecord else { return }
        let index = records.firstIndex(where: { $0.id == record.id }) ?? 0

        do {
            try photoStore.delete(record: record, modelContext: modelContext)
            let remaining = records.filter { $0.id != record.id }
            if remaining.isEmpty {
                onClose()
            } else {
                currentID = remaining[min(index, remaining.count - 1)].id
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

extension PhotoRecord: Identifiable {}
