# 🎓 IVDC 課程講義「全自動智慧備份」工具

一個基於 **Google Apps Script** 的雲端硬碟智慧備份腳本，可將共用資料夾內的所有檔案與**無限層級**子目錄完整複製到自己的 Google 雲端硬碟，並具備**防重複（智慧同步）**功能。

## ✨ 功能特色

- ✅ **防重複**：同名檔案已存在就跳過，不會產生「...的複本」
- 🔄 **智慧更新**：同名檔案若來源有更新（修改時間較新），自動取代舊檔
- 📂 **無限層級**：子資料夾一層一層往下全部同步
- 🔁 **可重複執行**：課程更新後再按一次執行即可增量同步
- 🤖 **自動續跑**（CNN 版）：排程每 10 分鐘自動重跑，全部完成後自動關閉排程
- 🔒 **Lock 防護**（CNN 版）：手動執行與排程撞期時自動跳過，不會重複複製
- 📁 **免手動建資料夾**（CNN 版）：目的地資料夾由腳本自動建立

## 📦 檔案結構

| 檔案 | 說明 |
|---|---|
| `startSmartClone.gs` | LLM／IVDC 講義備份腳本（v2 智慧同步版） |
| `startSmartCloneCNN.gs` | CNN 訓練資料備份腳本（v2 + 自動續跑 + Lock 防護） |
| `appsscript.json` | Apps Script 專案設定（時區 Asia/Taipei、V8 執行環境） |
| `docs/IVDC_SmartClone_分享文案.md` | 完整新手教學文案（含逐步圖解說明與常見問題） |

## 🚀 快速上手

### 方式一：手動貼上（新手推薦）

詳細步驟請看 [`docs/IVDC_SmartClone_分享文案.md`](docs/IVDC_SmartClone_分享文案.md)。重點摘要：

1. 在自己的雲端硬碟建立目的地資料夾，複製網址 `folders/` 後的資料夾 ID
2. 開啟 [Google Apps Script](https://script.google.com/) → 新專案
3. 貼上腳本程式碼，把 `targetFolderId` 換成自己的資料夾 ID（CNN 版免此步驟）
4. 儲存 → 選 `startSmartClone` → 執行 → 完成 OAuth 授權

### 方式二：clasp 命令列部署

```bash
npm install -g @google/clasp

# 啟用 Apps Script API（一次性）：
# https://script.google.com/home/usersettings

clasp login
clasp create-script --title "課程備份" --type standalone
clasp push
clasp open-script   # 開啟編輯器執行
```

## ⚠️ 注意事項

- **執行時間上限**：Apps Script 單次執行上限約 6 分鐘。檔案很多時（如 CNN 訓練圖片）會自動中斷，再執行一次或啟用 `installAutoRetry` 自動排程即可斷點續傳。
- **雲端空間**：複製的檔案會佔用自己帳號的 Google 雲端空間。
- **授權提示**：第一次執行會出現「Google 尚未驗證這個應用程式」畫面，這是自寫內部腳本的正常現象，點「進階 → 前往(不安全) → 允許」即可。
- **同名判斷**：以「檔名」為比對基準，同一層資料夾內同名檔案只會同步第一個（一般講義情境不會發生）。

## 🆚 版本差異

| 版本 | 同名檔案的處理 |
|---|---|
| v1（原版） | 只要比同名就跳過 → 來源「更新」的舊檔不會同步 |
| **v2（本版）** | 比對 `getLastUpdated()` → 來源較新才取代，其餘照樣跳過 |

## 📄 授權

開源、自由分享與使用。
