import SwiftData
import SwiftUI
import UIKit

struct ZoomablePhotoView: View {
    let image: UIImage

    @State private var scale: CGFloat = 1
    @State private var lastScale: CGFloat = 1
    @State private var offset: CGSize = .zero
    @State private var lastOffset: CGSize = .zero

    var body: some View {
        GeometryReader { geo in
            Image(uiImage: image)
                .resizable()
                .scaledToFit()
                .scaleEffect(scale)
                .offset(offset)
                .frame(width: geo.size.width, height: geo.size.height)
                .clipped()
                .contentShape(Rectangle())
                .gesture(magnifyGesture(in: geo.size))
                .highPriorityGesture(panGesture(in: geo.size), including: scale > 1.02 ? .all : .subviews)
                .onTapGesture(count: 2, perform: toggleZoom)
        }
    }

    private func magnifyGesture(in size: CGSize) -> some Gesture {
        MagnificationGesture()
            .onChanged { value in
                let next = lastScale * value
                scale = min(max(next, 1), 6)
            }
            .onEnded { _ in
                lastScale = scale
                if scale <= 1.02 {
                    withAnimation(.easeOut(duration: 0.2)) { reset() }
                } else {
                    withAnimation(.easeOut(duration: 0.15)) {
                        offset = clamped(offset, in: size)
                        lastOffset = offset
                    }
                }
            }
    }

    private func panGesture(in size: CGSize) -> some Gesture {
        DragGesture()
            .onChanged { value in
                guard scale > 1.02 else { return }
                offset = clamped(
                    CGSize(
                        width: lastOffset.width + value.translation.width,
                        height: lastOffset.height + value.translation.height
                    ),
                    in: size
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

    private func clamped(_ value: CGSize, in size: CGSize) -> CGSize {
        let maxX = max((size.width * (scale - 1)) / 2, 0)
        let maxY = max((size.height * (scale - 1)) / 2, 0)
        return CGSize(
            width: min(max(value.width, -maxX), maxX),
            height: min(max(value.height, -maxY), maxY)
        )
    }
}

struct PhotoPagerView: View {
    @Environment(\.modelContext) private var modelContext
    @EnvironmentObject private var entitlements: EntitlementService

    let initialID: UUID
    let photoStore: PhotoStore
    let onClose: () -> Void

    @Query(sort: \PhotoRecord.capturedAt, order: .reverse) private var records: [PhotoRecord]
    @Query(sort: \TagRecord.createdAt, order: .forward) private var allTags: [TagRecord]

    @State private var currentID: UUID
    @State private var showFirstDeleteConfirm = false
    @State private var showSecondDeleteConfirm = false
    @State private var showShareSheet = false
    @State private var showNoteSheet = false
    @State private var showTagSheet = false
    @State private var showInfoSheet = false
    @State private var errorMessage: String?
    @State private var exportMessage: String?

    init(initialID: UUID, photoStore: PhotoStore, onClose: @escaping () -> Void) {
        self.initialID = initialID
        self.photoStore = photoStore
        self.onClose = onClose
        _currentID = State(initialValue: initialID)
    }

    private var currentRecord: PhotoRecord? {
        records.first { $0.id == currentID } ?? records.first
    }

    private var currentIndex: Int {
        records.firstIndex(where: { $0.id == currentID }) ?? 0
    }

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            if records.isEmpty {
                Text("沒有照片")
                    .foregroundStyle(.secondary)
            } else {
                TabView(selection: $currentID) {
                    ForEach(Array(records.enumerated()), id: \.element.id) { index, record in
                        LazyPhotoPage(
                            record: record,
                            photoStore: photoStore,
                            shouldLoad: abs(index - currentIndex) <= 1
                        )
                        .tag(record.id)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
            }

            VStack {
                topChrome
                    .padding(.horizontal, 16)
                    .padding(.top, 8)

                Spacer()

                HStack {
                    Spacer()
                    bottomChrome
                }
                .padding(.horizontal, 18)
                .padding(.bottom, 28)
            }
        }
        .statusBarHidden(true)
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
            if let record = currentRecord {
                let items = photoStore.shareableURLs(for: [record])
                if items.isEmpty {
                    Text("找不到檔案").padding()
                } else {
                    ActivityShareSheet(items: items)
                }
            }
        }
        .sheet(isPresented: $showNoteSheet) {
            if let record = currentRecord {
                PhotoNoteSheet(record: record)
            }
        }
        .sheet(isPresented: $showTagSheet) {
            if let record = currentRecord {
                PhotoTagSheet(record: record, allTags: allTags)
            }
        }
        .sheet(isPresented: $showInfoSheet) {
            if let record = currentRecord {
                PhotoInfoSheet(record: record, photoStore: photoStore)
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
        .alert("提示", isPresented: Binding(
            get: { exportMessage != nil },
            set: { if !$0 { exportMessage = nil } }
        )) {
            Button("好", role: .cancel) {}
        } message: {
            Text(exportMessage ?? "")
        }
        .onChange(of: records.map(\.id)) { _, ids in
            if records.isEmpty {
                onClose()
            } else if !ids.contains(currentID), let first = records.first {
                currentID = first.id
            }
        }
    }

    private var topChrome: some View {
        HStack {
            Button("關閉", action: onClose)
                .font(.body.weight(.semibold))
                .foregroundStyle(.primary)
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(.ultraThinMaterial, in: Capsule())

            Spacer()

            HStack(spacing: 2) {
                iconButton("note.text", active: !(currentRecord?.note.isEmpty ?? true)) {
                    showNoteSheet = true
                }
                iconButton("tag", active: !(currentRecord?.tags.isEmpty ?? true)) {
                    showTagSheet = true
                }
                iconButton("info.circle") {
                    showInfoSheet = true
                }
                Button {
                    showFirstDeleteConfirm = true
                } label: {
                    Image(systemName: "trash")
                        .font(.body.weight(.semibold))
                        .foregroundStyle(.red)
                        .frame(width: 40, height: 36)
                }
                .buttonStyle(.plain)
            }
            .padding(4)
            .background(.ultraThinMaterial, in: Capsule())
        }
    }

    private var bottomChrome: some View {
        HStack(spacing: 12) {
            roundIconButton("square.and.arrow.up") {
                showShareSheet = true
            }
            roundIconButton("square.and.arrow.down") {
                Task { await saveToLibrary() }
            }
        }
    }

    private func iconButton(_ systemName: String, active: Bool = false, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: systemName)
                .font(.body.weight(.semibold))
                .foregroundStyle(active ? Color.yellow : Color.primary)
                .frame(width: 40, height: 36)
        }
        .buttonStyle(.plain)
    }

    private func roundIconButton(_ systemName: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: systemName)
                .font(.title3.weight(.semibold))
                .foregroundStyle(.primary)
                .frame(width: 48, height: 48)
                .background(.ultraThinMaterial, in: Circle())
        }
        .buttonStyle(.plain)
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

    private func saveToLibrary() async {
        guard let record = currentRecord else { return }
        let url = photoStore.localURL(for: record)
        guard let data = try? Data(contentsOf: url) else {
            exportMessage = "找不到檔案"
            return
        }
        let outcome = await PhotoLibrarySaver.saveIfNeeded(data: data, enabled: true)
        exportMessage = outcome == .saved ? "已儲存到 iPhone 相簿" : "無法儲存，請檢查相簿權限"
    }
}

private struct LazyPhotoPage: View {
    let record: PhotoRecord
    let photoStore: PhotoStore
    let shouldLoad: Bool
    @State private var image: UIImage?

    var body: some View {
        Group {
            if let image {
                ZoomablePhotoView(image: image)
            } else {
                ProgressView()
                    .tint(.yellow)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .task(id: "\(record.id)-\(shouldLoad)") {
            if shouldLoad {
                image = await photoStore.loadDisplayImage(for: record)
            } else {
                image = nil
            }
        }
    }
}
