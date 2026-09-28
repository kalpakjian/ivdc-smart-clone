# 🎓 IVDC 課程講義「全自動智慧備份」工具

這是一個專為 Google 雲端硬碟設計的自動備份腳本（Google Apps Script）。
它可以幫你把 IVDC 共用資料夾內的所有檔案與無限層級的子目錄，完整複製到你自己的雲端硬碟，並且具備「防重複（智慧同步）」功能。以後老師有更新檔案，你只要再按一次執行，它**只會複製新檔案、自動取代有更新的舊檔**，不會製造一堆「xxx 的複本」！

## ✨ 功能特色

- ✅ **防重複**：同名檔案已存在就跳過，不會產生「...的複本」
- 🔄 **智慧更新**：同名檔案若老師有更新（修改時間較新），自動取代舊檔
- 📂 **無限層級**：子資料夾一層一層往下全部同步
- 🔁 **可重複執行**：課程更新後再按一次「執行」即可增量同步
- 💰 **完全免費**：使用 Google 官方 Apps Script，不需安裝任何軟體

---

## 🛠️ 使用說明（新手免驚步驟）

### 第一步：在自己的雲端硬碟建好目的地

1. 回到你的「我的雲端硬碟」，新建一個資料夾（例如命名為 `LLM` 或 `IVDC課程講義`）。
2. 點進去這個新資料夾，點擊瀏覽器上方的網址列，把網址最後面那一長串亂碼（`folders/` 後面的字串）複製下來備用。這就是你的「**目的地資料夾 ID**」。

### 第二步：開啟 Google 雲端腳本編輯器

1. 點擊開啟 [Google Apps Script 網站](https://script.google.com/)。
2. 點選左上角的「**＋ 新專案**」。
3. 把編輯器裡面原本預設的幾行程式碼**全部刪除**。

### 第三步：貼上並修改程式碼

1. 將下方「完整程式碼」複製並貼入編輯器中。
2. 將 **第 7 行** 雙引號內的文字，換成你在「第一步」複製的資料夾 ID：

```javascript
var targetFolderId = "把這幾個字換成你自己的資料夾ID";
```

### 第四步：儲存並啟動

1. 點擊上方的 💾「**儲存**」圖示（或按 `Ctrl + S` / `Cmd + S`）。
2. 確認中間上方的下拉選單顯示的是 `startSmartClone`。
3. 點擊 ▶️「**執行**」。

---

## ⚠️ 第一次執行必看（安全授權提示）

因為這是你自己的帳號在跑腳本，Google 會跳出安全檢查，請跟著點選：

1. 彈出視窗點選「**查看權限**」。
2. 選擇你的 Google 帳號。
3. 看到「Google 尚未驗證這個應用程式」時，**不用擔心**，點選左下角的「**進階**」。
4. 點選最下方的「**前往『未命名專案』(不安全)**」（這是因為這是你自己寫的內部腳本，所以會有此提示）。
5. 最後點選「**允許**」。

下方的執行記錄開始跑出「跳過...」、「複製新檔案...」或「取代舊檔...」就代表成功運作囉！以後課程更新，只要回來重新點選「執行」即可！

---

## 📌 注意事項與常見問題

| 情況 | 說明 |
|---|---|
| **老師「新增」了檔案** | 再按一次執行，會自動複製新檔案 ✅ |
| **老師「更新」了同名舊檔** | 再按一次執行，會自動比對修改時間並取代舊檔 ✅（本強化版特色） |
| **檔案量很大、跑到一半停了** | Apps Script 單次執行上限約 6 分鐘。不用緊張，**再按一次執行**即可，防重複機制會自動從斷點繼續 |
| **雲端空間不足** | 複製過來的檔案會佔用「你自己」的 Google 雲端空間，執行前先確認容量足夠 |
| **授權畫面寫「不安全」** | 這是自己寫的內部腳本的正常提示，不是詐騙頁面，照上面步驟按「進階」即可 |
| **如何找到資料夾 ID** | 網址 `folders/` 後面那串亂碼就是；來源（老師的）ID 腳本裡已填好，你只需要填自己的 |

---

## 💻 完整程式碼（v2 智慧同步版）

```javascript
function startSmartClone() {
  // 1. 原 IVDC 官方資料夾 ID (已幫大家填好)
  var sourceFolderId = "1Z8vYqP_LI1gYXLCpcXISJ1tPve3lqxa-";

  // 2. ⚠️ 請在下方雙引號內，貼上你自己建立的資料夾 ID
  var targetFolderId = "把這幾個字換成你自己的資料夾ID";

  var sourceFolder = DriveApp.getFolderById(sourceFolderId);
  var targetFolder = DriveApp.getFolderById(targetFolderId);

  Logger.log("🚀 開始智慧同步（已存在的同名檔案會自動比對新舊）...");
  copyFolderSmart(sourceFolder, targetFolder);
  Logger.log("🎉 智慧同步完成！");
}

function copyFolderSmart(source, target) {
  // --- 1. 處理檔案複製（防重複，且會自動取代「已更新」的同名舊檔）---
  // 先把目的地資料夾裡「檔名 -> 檔案物件」建成索引，方便之後比對
  var existingFiles = {};
  var targetFiles = target.getFiles();
  while (targetFiles.hasNext()) {
    var f = targetFiles.next();
    existingFiles[f.getName()] = f;
  }

  var sourceFiles = source.getFiles();
  while (sourceFiles.hasNext()) {
    var file = sourceFiles.next();
    var fileName = file.getName();

    if (existingFiles[fileName]) {
      // 同名檔案已存在：比對最後修改時間，來源較新才取代
      var oldFile = existingFiles[fileName];
      if (file.getLastUpdated().getTime() > oldFile.getLastUpdated().getTime()) {
        Logger.log("🔄 檔案有更新，取代舊檔: " + fileName);
        oldFile.setTrashed(true);
        file.makeCopy(fileName, target);
      } else {
        Logger.log("跳過已存在的檔案: " + fileName);
      }
    } else {
      Logger.log("➕ 複製新檔案: " + fileName);
      file.makeCopy(fileName, target);
    }
  }

  // --- 2. 處理子資料夾複製（防重複且支援無限層級）---
  var existingFolders = {};
  var targetFolders = target.getFolders();
  while (targetFolders.hasNext()) {
    var folder = targetFolders.next();
    existingFolders[folder.getName()] = folder;
  }

  var sourceFolders = source.getFolders();
  while (sourceFolders.hasNext()) {
    var subFolder = sourceFolders.next();
    var folderName = subFolder.getName();
    var nextTargetFolder;

    if (existingFolders[folderName]) {
      Logger.log("進入已存在的資料夾: " + folderName);
      nextTargetFolder = existingFolders[folderName];
    } else {
      Logger.log("📂 建立新資料夾: " + folderName);
      nextTargetFolder = target.createFolder(folderName);
    }

    copyFolderSmart(subFolder, nextTargetFolder);
  }
}
```

---

## 🆚 v1 與 v2 差異（本份為 v2）

| 版本 | 同名檔案的處理 |
|---|---|
| v1（原版） | 只要比同名就跳過 → 老師「更新」的舊檔不會同步 |
| **v2（本版）** | 比對最後修改時間 → 新檔才取代，其餘照樣跳過 |

祝大家備份順利！🎉
