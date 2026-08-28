# 分流拍（ShuntPai）

iPhone 工作拍照 App MVP：開啟即拍、Google Drive 雲端上傳、內建相簿、預設不進系統「照片 App」。

## MVP 功能

- Google 個人帳號 OAuth 登入（不另建 App 帳號）
- 選擇 / 建立 Google Drive 資料夾
- iOS 風格全螢幕相機（快門、閃光、變焦、前後鏡頭）
- 拍完背景上傳 Google Drive
- 離線先拍、有網自動上傳
- 內建相簿（依日期格狀瀏覽、分享、刪除）
- 設定：資料夾、是否同步到 iPhone 相簿、登出

**MVP 不包含：** 人像模式、Live Photo、錄影、iCloud、OneDrive

## 環境需求

- macOS + Xcode 16+
- iPhone 實機（相機與 OAuth 建議用實機測試）
- Apple Developer 帳號（TestFlight / App Store）
- Google Cloud 專案（OAuth iOS Client）

## 1. Google Cloud 設定

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立專案並啟用 **Google Drive API**
3. 設定 OAuth 同意畫面（External，測試階段可加入自己的 Gmail）
4. 建立 **OAuth Client ID → iOS**
   - Bundle ID：`com.shuntpai.app`
5. 複製 Client ID，貼到：

```swift
// ShuntPai/App/AppConstants.swift
static let googleClientID = "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com"
```

6. OAuth 重新導向 URI 使用：`com.shuntpai.app:/oauth2redirect`

## 2. 開啟 Xcode 專案

```bash
open shunt-pai/ShuntPai.xcodeproj
```

1. 選 Target **ShuntPai**
2. Signing & Capabilities → 選擇你的 Team
3. Bundle Identifier 維持 `com.shuntpai.app`（需與 Google OAuth Client 一致）
4. 連接 iPhone，Run

## 3. 首次使用流程

1. 歡迎頁 → Google 登入
2. 選 Drive 資料夾（或建立「分流拍」）
3. 選是否同步到 iPhone 相簿（預設否）
4. 允許相機 → 進入拍照畫面

## 專案結構

```
shunt-pai/
├── ShuntPai.xcodeproj
└── ShuntPai/
    ├── App/                 # 入口、常數
    ├── Models/              # SwiftData 模型
    ├── Services/            # Google、相機、上傳佇列
    ├── Views/               # 相機、相簿、設定、Onboarding
    └── Resources/           # Info.plist、Assets
```

## OAuth Scopes

目前使用：

- `drive.file` — 上傳 App 建立的檔案
- `drive.metadata.readonly` — 列出資料夾供選擇

若資料夾選擇或上傳遇到權限問題，可暫時改為 `https://www.googleapis.com/auth/drive` 做測試，上架前再收斂 scope。

## Phase 2（尚未實作）

- iCloud Drive 專用資料夾
- Microsoft OneDrive
- 依日期自動分子資料夾

## 授權

Private MVP scaffold.
