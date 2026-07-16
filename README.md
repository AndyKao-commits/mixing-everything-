# Mixing Everything

多功能小工具站基礎模板。左側列表點開頁面／工具；主頁可寫日誌，也可把做菜影片整理成食譜日誌。

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

## 主頁功能

### 影片轉食譜（類似 Albo）

1. 貼上影片連結（Instagram / YouTube / TikTok）
2. 貼上影片說明或字幕文字
3. 按「整理材料／步驟」
4. 微調後「寫入日誌」

> 靜態站無法直接下載並解析私密平台影片本體；請複製貼文說明／字幕後整理。之後若接上後端 AI，可再升級成一鍵解析。

### 一般日誌

直接寫文字，送出後立刻顯示，並存到 LocalStorage。

## 如何新增工具

1. 在 `src/tools/<tool-id>/` 建立元件
2. 到 `src/data/tools.ts` 註冊
3. 左側「工具」列表會自動出現

目前內建：

- **計數器** `/tools/counter`
- **隨手記** `/tools/notes`
