# Mixing Everything

多功能小工具站基礎模板。主頁可掃描做菜影片，整理材料／步驟並寫入日誌。

## Stack

- Next.js 15（含 API Routes）
- TypeScript / React 19
- OpenAI（Whisper + 食譜結構化，選用）
- Instagram OAuth 登入（選用）

## 開發

```bash
cp .env.example .env.local
npm install
npm run dev
```

## 建置

```bash
npm run build
npm start
```

## 影片掃描 API

`POST /api/recipe/extract`

可傳送：

- `url`：影片連結
- `caption`：補充說明／字幕
- `file`：上傳影片／音訊（multipart）

流程：

1. YouTube：抓字幕／oEmbed
2. Instagram：若已登入，用官方 Graph 讀自己的媒體；可選第三方 Media API；再嘗試公開頁 meta
3. 若拿到影片檔／遠端 media URL，且有 `OPENAI_API_KEY`，用 Whisper 掃描音訊
4. 用 OpenAI（或本機解析後援）整理標題、材料、步驟

狀態查詢：`GET /api/recipe/status`

### Instagram 登入

官方 API **不能**任意讀取別人的 Reel；登入後可讀你自己帳號媒體。

1. 在 Meta 建立 App，啟用 Instagram API with Instagram Login
2. 設定 `.env.local`：
   - `INSTAGRAM_APP_ID`
   - `INSTAGRAM_APP_SECRET`
   - `INSTAGRAM_REDIRECT_URI`
3. 到 `/settings` 按「登入 Instagram」

### OpenAI

設定 `OPENAI_API_KEY` 後才能：

- Whisper 掃描影片內容
- 更穩定地把字幕整理成材料／步驟

## 主頁使用

1. 貼影片連結（或上傳影片）
2. 按「掃描影片並整理」
3. 微調後「寫入日誌」

## 如何新增工具

1. 在 `src/tools/<tool-id>/` 建立元件
2. 到 `src/data/tools.ts` 註冊
3. 左側「工具」列表會自動出現
