# 今晚玩什麼？ / Party Room

手機優先的聚會派對遊戲 Web App。

核心流程：建立房間 → 分享房號 → 輸入代號進房 → 選遊戲 → 馬上玩。

## Stack

- Next.js 15 + React 19 + TypeScript + Tailwind CSS
- 預設：Node 記憶體 store + 輪詢同步（本機 / 單實例可直接玩）
- 可選：Supabase Database + Realtime（部署多實例時建議接上）

## 開發

```bash
npm install
npm run dev
```

開啟 http://localhost:3000

## 環境變數（可選）

複製 `.env.example`：

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Supabase schema 見 `supabase/schema.sql`。

目前 MVP 以記憶體 store 為準；接上 Supabase 後可把 `party-store` 換成 DB 實作。

## MVP 功能

- 首頁 / 建立房間 / 加入房間
- Lobby 玩家同步、房主選遊戲
- 滿分男：經典 / 反向 / 主題 / 極速
- 評分、全員回答後同時翻牌、平均分、最高最低吐槽
- localStorage 重連、房主離線 30 秒轉移

## 專案結構

```
app/                 頁面與 API
src/components/      UI 與遊戲模組
src/data/            題庫與遊戲清單
src/lib/             store / api / storage
src/types/           型別
supabase/            SQL schema
```

房間是平台，遊戲是模組。新增遊戲時加 Game Module，不必重做房間系統。
