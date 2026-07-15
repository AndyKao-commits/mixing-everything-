# Mixing Everything

多功能小工具站。旗艦遊戲：**Goblin Raid Remastered 2.0**。

## Stack

- Next.js 15
- TypeScript
- React 19
- Tailwind CSS
- Framer Motion
- LocalStorage save

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

## Goblin Raid Remastered

路徑：`/tools/goblin-raid`

模組化 Idle RPG：

- 即時自動戰鬥、必殺技、藥劑
- 波次 + 每 10 波 Boss（二階段／狂暴）
- 裝備稀有度、強化／附魔／重鑄
- 永久強化、六系技能樹（每系 18 技）
- 任務、成就、商店、地圖解鎖
- 轉生、離線收益、30 秒自動存檔

結構見 `src/systems/`、`src/data/`、`src/components/`。

## 立繪資源（下一階段管線）

- 放圖：`public/art/heroes|monsters|bosses/*.webp`
- 登錄：`src/data/art.ts`
- 戰鬥優先讀 WebP，失敗則回退 SVG
- 目前示範：巡衛、哥布林、林緣暴君 Boss
- 待補：`ART_BACKLOG`（見 `src/data/art.ts`）
