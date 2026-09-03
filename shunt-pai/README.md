# 分流拍（ShuntPai）

iPhone 工作拍照 App：開啟即拍，照片只存在 App 內，預設不進系統「照片」。

## 功能

- iOS 風格全螢幕相機（快門、閃光、變焦按鈕、雙指縮放、前後鏡頭）
- 照片保存在 App 本機（Application Support）
- 內建相簿（依日期格狀瀏覽、分享、刪除）
- 可選：同時存到 iPhone 相簿（預設關閉）

**不做：** Google Drive / iCloud 上傳、人像模式、錄影、帳號系統

## 環境需求

- macOS + Xcode 16+
- iPhone 實機（建議）
- 免費 Apple ID 即可自行測試（正式上架需 Apple Developer 年費）

## 開啟專案

```bash
open shunt-pai/ShuntPai.xcodeproj
```

1. Target **ShuntPai** → Signing & Capabilities → 選你的 Team
2. Bundle Identifier：`com.shuntpai.app`
3. 連接 iPhone → Run
4. 若提示未信任：iPhone **設定 → 一般 → VPN 與裝置管理** → 信任開發者

## 首次使用

1. 選擇是否同步到 iPhone 相簿（建議否）
2. 允許相機
3. 直接拍照；到「相簿」分頁查看

## 專案結構

```
shunt-pai/
├── ShuntPai.xcodeproj
└── ShuntPai/
    ├── App/
    ├── Models/
    ├── Services/     # 相機、本機儲存
    ├── Views/        # 相機、相簿、設定、Onboarding
    └── Resources/
```
