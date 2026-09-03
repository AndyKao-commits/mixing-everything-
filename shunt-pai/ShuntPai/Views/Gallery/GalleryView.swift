import SwiftData
import SwiftUI

struct GalleryView: View {
    @ObservedObject var photoStore: PhotoStore

    @Query(sort: \PhotoRecord.capturedAt, order: .reverse) private var records: [PhotoRecord]

    @State private var selectedID: UUID?
    @State private var showSettings = false

    private let columns = [
        GridItem(.flexible(), spacing: 2),
        GridItem(.flexible(), spacing: 2),
        GridItem(.flexible(), spacing: 2)
    ]

    var body: some View {
        NavigationStack {
            Group {
                if records.isEmpty {
                    ContentUnavailableView(
                        "尚無照片",
                        systemImage: "photo.on.rectangle.angled",
                        description: Text("在相機頁拍的照片會保存在這裡。")
                    )
                } else {
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 20, pinnedViews: [.sectionHeaders]) {
                            ForEach(photoStore.groupedRecords(records), id: \.0) { section, items in
                                Section {
                                    LazyVGrid(columns: columns, spacing: 2) {
                                        ForEach(items) { record in
                                            Button {
                                                selectedID = record.id
                                            } label: {
                                                GalleryCell(record: record, photoStore: photoStore)
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
                        .padding(.bottom, 12)
                    }
                }
            }
            .background(Color.black.ignoresSafeArea())
            .navigationTitle("分流拍相簿")
            .navigationBarTitleDisplayMode(.large)
            .toolbarBackground(Color.black, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
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
        }
    }
}

struct GalleryCell: View {
    let record: PhotoRecord
    let photoStore: PhotoStore

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
            .clipped()
            .contentShape(Rectangle())
    }
}

struct PhotoPagerView: View {
    @Environment(\.modelContext) private var modelContext

    let initialID: UUID
    let photoStore: PhotoStore
    let onClose: () -> Void

    @Query(sort: \PhotoRecord.capturedAt, order: .reverse) private var records: [PhotoRecord]

    @State private var currentID: UUID
    @State private var showDeleteConfirm = false
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
                                    Image(uiImage: image)
                                        .resizable()
                                        .scaledToFit()
                                        .frame(maxWidth: .infinity, maxHeight: .infinity)
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
                            showDeleteConfirm = true
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
            .confirmationDialog("確定刪除這張照片？", isPresented: $showDeleteConfirm) {
                Button("刪除", role: .destructive) {
                    deleteCurrent()
                }
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
