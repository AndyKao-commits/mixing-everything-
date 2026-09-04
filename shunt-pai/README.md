# 分流拍（ShuntPai）

iPhone 工作拍照 App：開啟即拍，照片只存在 App 內，預設不進系統「照片」。

## 功能

- 原生風格相機（4:3 預覽、快門、閃光、變焦、點擊對焦、長按 AE/AF、垂直曝光、前後鏡頭）
- 浮動導覽：相簿 + 相機（無資料夾）
- 本機相簿：日期分組、時間戳、標籤篩選、選取分享
- 照片詳情：備註、標籤分類、拍攝資訊（EXIF）、分享／下載到系統相簿
- Face ID / 密碼上鎖（可選；切到背景後會再上鎖）
- 可選：同時存到 iPhone 相簿（預設關閉）
- 測試用免費／付費切換（免費最多 43 張）

**不做：** Google Drive / iCloud 上傳、人像模式、錄影、正式 IAP、資料夾

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
3. 直接拍照；右上角 X 或縮圖進相簿
4. 在設定新增標籤；照片詳情可填備註、指定標籤、查看拍攝資訊
