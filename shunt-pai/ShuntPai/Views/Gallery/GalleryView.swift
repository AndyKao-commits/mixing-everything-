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
                    .foregroundStyle(.white)
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
                let items = selectedShareItems()
                if items.isEmpty {
                    Text("找不到檔案")
                        .padding()
                } else {
                    ActivityShareSheet(items: items)
                }
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

struct GalleryCell: View {
    let record: PhotoRecord
    let photoStore: PhotoStore
    var isSelecting: Bool = false
    var isChosen: Bool = false
    @State private var image: UIImage?

    var body: some View {
        Color.black
            .aspectRatio(1, contentMode: .fit)
            .overlay {
                if let image {
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
            .task(id: record.id) {
                image = await photoStore.loadThumbnail(for: record)
            }
    }
}
