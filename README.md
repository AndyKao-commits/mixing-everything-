# Mixing Everything

多功能小工具站基礎模板。之後做的各種小東西都會集中在這裡。

## Stack

- Next.js 15（靜態匯出）
- TypeScript
- React 19
- Tailwind CSS
- Framer Motion（可選，示範工具未強制）

## 開發

```bash
npm install
npm run dev
```

## 建置

```bash
npm run build
npm start
```

## 如何新增工具

1. 在 `src/tools/<tool-id>/` 建立元件
2. 到 `src/data/tools.ts` 註冊（id、名稱、說明、Component）
3. 前往 `/tools/<tool-id>/` 即可使用

目前內建：

- **計數器** `/tools/counter`
- **隨手記** `/tools/notes`

## 樣式

視覺方向結合：

- 復古視窗框線與桌面圖示語彙
- 柔和 pastel 風景插畫錨點
- 清楚的品牌首屏與單一區塊職責

設計權杖定義在 `app/globals.css`（`--coral`、`--sky`、`--cream` 等）。
