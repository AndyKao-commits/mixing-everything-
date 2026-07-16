# Mixing Everything

多功能小工具站。主打：貼上**別人的**食譜影片連結，自動整理材料／步驟並寫入日誌。

## 開發

```bash
cp .env.example .env.local
# 填入 OPENAI_API_KEY（建議，才能掃旁白）
npm install
npm run dev
```

## 收入別人的食譜

1. 主頁貼上對方公開的 IG／YouTube／TikTok 連結
2. 按「收入並整理食譜」
3. 系統用 yt-dlp 抓公開說明／音訊，再用 AI 整理材料與步驟
4. 確認後寫入日誌

不需要 Instagram 登入，也不限自己的影片。

### API

`POST /api/recipe/extract`

- `url`：別人的公開影片連結
- `caption`：可選補充文字
- `file`：可選上傳影片

`GET /api/recipe/status`

### 環境變數

- `OPENAI_API_KEY`：Whisper 掃旁白 + 結構化食譜（強烈建議）
- `OPENAI_MODEL`：預設 `gpt-4o-mini`

## 注意

- 僅支援**公開**影片；私人帳號內容抓不到
- 伺服器需能跑 `yt-dlp`（透過 `youtube-dl-exec`）。極短 serverless 可能逾時，建議一般 Node／較長 timeout 環境
- 沒有 OpenAI key 時，仍會嘗試用貼文說明做文字整理

## 如何新增工具

1. `src/tools/<tool-id>/` 建立元件
2. `src/data/tools.ts` 註冊
