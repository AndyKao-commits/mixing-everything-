# Mixing Everything

多功能小工具站基礎模板。左側列表點開頁面／工具；主頁是可即時顯示的日誌。

## Stack

- Next.js 15（靜態匯出）
- TypeScript
- React 19
- Tailwind CSS

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

## 結構

- 左側導覽：日誌、工具總覽、關於、各工具
- 主頁日誌：寫完立刻顯示，並存到 LocalStorage
- 工具註冊表：`src/data/tools.ts`

## 如何新增工具

1. 在 `src/tools/<tool-id>/` 建立元件
2. 到 `src/data/tools.ts` 註冊
3. 左側「工具」列表會自動出現，點開即可使用

目前內建：

- **計數器** `/tools/counter`
- **隨手記** `/tools/notes`
