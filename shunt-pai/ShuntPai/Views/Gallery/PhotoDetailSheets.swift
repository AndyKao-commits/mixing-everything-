import SwiftData
import SwiftUI

struct PhotoNoteSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext
    @Bindable var record: PhotoRecord
    @State private var draft: String = ""
    @FocusState private var focused: Bool

    var body: some View {
        NavigationStack {
            TextEditor(text: $draft)
                .focused($focused)
                .padding()
                .scrollContentBackground(.hidden)
                .background(Color(.systemBackground))
                .overlay(alignment: .topLeading) {
                    if draft.isEmpty {
                        Text("加入簡短備註，方便日後回想當時情況。")
                            .foregroundStyle(.secondary)
                            .padding(.horizontal, 20)
                            .padding(.vertical, 24)
                            .allowsHitTesting(false)
                    }
                }
                .navigationTitle("備註")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .topBarLeading) {
                        Button("關閉") { dismiss() }
                    }
                    ToolbarItem(placement: .topBarTrailing) {
                        Button("完成") {
                            record.note = draft.trimmingCharacters(in: .whitespacesAndNewlines)
                            try? modelContext.save()
                            dismiss()
                        }
                        .fontWeight(.semibold)
                    }
                }
        }
        .presentationDetents([.medium, .large])
        .onAppear {
            draft = record.note
            focused = true
        }
    }
}

struct PhotoTagSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext
    @Bindable var record: PhotoRecord
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
                        Text("請先新增標籤分類，再指定到這張照片。")
                    }
                } else {
                    List {
                        ForEach(allTags) { tag in
                            Button {
                                toggle(tag)
                            } label: {
                                HStack {
                                    Text(tag.name)
                                        .foregroundStyle(.primary)
                                    Spacer()
                                    if record.tags.contains(where: { $0.id == tag.id }) {
                                        Image(systemName: "checkmark")
                                            .foregroundStyle(.yellow)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("指定標籤")
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
                Button("取消", role: .cancel) {
                    newTagName = ""
                }
                Button("新增") {
                    let name = newTagName.trimmingCharacters(in: .whitespacesAndNewlines)
                    guard !name.isEmpty else { return }
                    let tag = TagRecord(name: name)
                    modelContext.insert(tag)
                    if !record.tags.contains(where: { $0.id == tag.id }) {
                        record.tags.append(tag)
                    }
                    try? modelContext.save()
                    newTagName = ""
                }
            } message: {
                Text("例如：施工、驗收、客戶現場")
            }
        }
        .presentationDetents([.medium, .large])
    }

    private func toggle(_ tag: TagRecord) {
        if let index = record.tags.firstIndex(where: { $0.id == tag.id }) {
            record.tags.remove(at: index)
        } else {
            record.tags.append(tag)
        }
        try? modelContext.save()
    }
}

struct PhotoInfoSheet: View {
    @Environment(\.dismiss) private var dismiss
    let record: PhotoRecord
    let photoStore: PhotoStore

    private var info: PhotoShootingInfo {
        PhotoMetadataReader.shootingInfo(
            at: photoStore.localURL(for: record),
            fallbackDate: record.capturedAt
        )
    }

    var body: some View {
        NavigationStack {
            List {
                Section {
                    LabeledContent("備註", value: record.note.isEmpty ? "無" : record.note)
                    LabeledContent(
                        "標籤",
                        value: record.tags.isEmpty
                        ? "無"
                        : record.tags.map(\.name).joined(separator: "、")
                    )
                }

                Section {
                    ForEach(info.rows, id: \.0) { label, value in
                        LabeledContent(label, value: value)
                    }
                } header: {
                    Text("拍攝資訊")
                }
            }
            .navigationTitle("拍攝資訊")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("關閉") { dismiss() }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
}
