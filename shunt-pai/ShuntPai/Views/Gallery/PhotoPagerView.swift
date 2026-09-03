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

struct PhotoPagerView: View {
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
                            LazyPhotoPage(record: record, photoStore: photoStore)
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
                if let record = currentRecord {
                    ActivityShareSheet(items: photoStore.shareableURLs(for: [record]))
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

private struct LazyPhotoPage: View {
    let record: PhotoRecord
    let photoStore: PhotoStore
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
        .task(id: record.id) {
            image = await photoStore.loadImage(for: record)
        }
    }
}
