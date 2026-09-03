import SwiftData
import SwiftUI

struct GalleryView: View {
    @Environment(\.modelContext) private var modelContext

    @ObservedObject var authService: GoogleAuthService
    let driveService: GoogleDriveService
    @ObservedObject var photoStore: PhotoStore
    @ObservedObject var uploadManager: UploadQueueManager

    @Query(sort: \PhotoRecord.capturedAt, order: .reverse) private var records: [PhotoRecord]

    @State private var selectedRecord: PhotoRecord?
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
                        description: Text("在相機頁拍的照片會顯示在這裡。")
                    )
                } else {
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 20, pinnedViews: [.sectionHeaders]) {
                            ForEach(photoStore.groupedRecords(records), id: \.0) { section, items in
                                Section {
                                    LazyVGrid(columns: columns, spacing: 2) {
                                        ForEach(items) { record in
                                            Button {
                                                selectedRecord = record
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

                ToolbarItem(placement: .topBarLeading) {
                    if records.contains(where: { $0.uploadStatus == .failed || $0.uploadStatus == .pending }) {
                        Button("重試上傳") {
                            Task { await uploadManager.retryFailed(modelContext: modelContext) }
                        }
                    }
                }
            }
            .sheet(item: $selectedRecord) { record in
                PhotoDetailView(
                    record: record,
                    photoStore: photoStore,
                    driveService: driveService,
                    modelContext: modelContext
                )
            }
            .sheet(isPresented: $showSettings) {
                SettingsView(authService: authService, driveService: driveService)
            }
            .task {
                await uploadManager.processPendingUploads(modelContext: modelContext)
            }
            .onChange(of: uploadManager.needsProcessing) { _, needs in
                guard needs else { return }
                Task {
                    await uploadManager.processPendingUploads(modelContext: modelContext)
                    uploadManager.needsProcessing = false
                }
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
            .overlay(alignment: .topTrailing) {
                if record.uploadStatus != .uploaded {
                    Image(systemName: record.uploadStatus.symbolName)
                        .font(.caption2.weight(.bold))
                        .padding(5)
                        .background(.black.opacity(0.6))
                        .foregroundStyle(record.uploadStatus == .failed ? Color.red : Color.yellow)
                        .clipShape(Circle())
                        .padding(5)
                }
            }
    }
}

struct PhotoDetailView: View {
    @Environment(\.dismiss) private var dismiss

    let record: PhotoRecord
    let photoStore: PhotoStore
    let driveService: GoogleDriveService
    let modelContext: ModelContext

    @State private var showDeleteConfirm = false
    @State private var showShareSheet = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            ZStack {
                Color.black.ignoresSafeArea()

                if let image = photoStore.loadImage(for: record) {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFit()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
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
                    .padding(.bottom, 24)
                }
            }
            .navigationTitle(record.uploadStatus.displayTitle)
            .navigationBarTitleDisplayMode(.inline)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("關閉") { dismiss() }
                }
            }
            .confirmationDialog("確定刪除這張照片？", isPresented: $showDeleteConfirm) {
                Button("刪除", role: .destructive) {
                    Task { await deletePhoto() }
                }
            }
            .sheet(isPresented: $showShareSheet) {
                if let image = photoStore.loadImage(for: record) {
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
        }
    }

    private func deletePhoto() async {
        do {
            if let remoteID = record.remoteFileID {
                try await driveService.deleteRemoteFile(id: remoteID)
            }
            try photoStore.delete(record: record, modelContext: modelContext)
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

extension PhotoRecord: Identifiable {}
