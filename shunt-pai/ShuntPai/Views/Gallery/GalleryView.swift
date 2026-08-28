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

    var body: some View {
        NavigationStack {
            ScrollView {
                if records.isEmpty {
                    ContentUnavailableView(
                        "尚無照片",
                        systemImage: "photo.on.rectangle.angled",
                        description: Text("在相機頁拍的照片會顯示在這裡。")
                    )
                    .padding(.top, 80)
                } else {
                    LazyVStack(alignment: .leading, spacing: 18) {
                        ForEach(photoStore.groupedRecords(records), id: \.0) { section, items in
                            VStack(alignment: .leading, spacing: 10) {
                                Text(section)
                                    .font(.headline)
                                    .padding(.horizontal, 4)

                                LazyVGrid(columns: [GridItem(.adaptive(minimum: 100), spacing: 4)], spacing: 4) {
                                    ForEach(items) { record in
                                        Button {
                                            selectedRecord = record
                                        } label: {
                                            GalleryCell(record: record, photoStore: photoStore)
                                        }
                                    }
                                }
                            }
                        }
                    }
                    .padding(12)
                }
            }
            .background(Color.black)
            .navigationTitle("分流拍相簿")
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
        ZStack(alignment: .topTrailing) {
            Group {
                if let image = photoStore.loadThumbnail(for: record) {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFill()
                } else {
                    Color.gray.opacity(0.3)
                }
            }
            .frame(minWidth: 0, maxWidth: .infinity)
            .aspectRatio(1, contentMode: .fill)
            .clipped()

            if record.uploadStatus != .uploaded {
                Image(systemName: record.uploadStatus.symbolName)
                    .font(.caption2)
                    .padding(6)
                    .background(.black.opacity(0.55))
                    .foregroundStyle(record.uploadStatus == .failed ? .red : .yellow)
                    .clipShape(Circle())
                    .padding(6)
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
                    .padding()
                    .background(.ultraThinMaterial)
                }
            }
            .navigationTitle(record.uploadStatus.displayTitle)
            .navigationBarTitleDisplayMode(.inline)
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
