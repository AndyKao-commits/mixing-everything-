# Mixing Everything

多功能小工具站。之後做的各種小東西都會集中在這裡。

## 開發

```bash
npm install
npm run dev
```

## 建置

```bash
npm run build
npm run preview
```

## 如何新增工具

1. 在 `src/tools/<tool-id>/` 建立元件
2. 到 `src/data/tools.ts` 註冊（id、名稱、說明、Component）
3. 前往 `/tools/<tool-id>` 即可使用

目前內建：

- **計數器** `/tools/counter`
- **隨手記** `/tools/notes`
- **哥布林討伐** `/tools/goblin-raid`（奇幻遇敵小遊戲，等結果時用；不存檔）
