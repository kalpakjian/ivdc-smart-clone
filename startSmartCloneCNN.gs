function startSmartCloneCNN() {
  // 0. 防止「手動執行」與「自動排程」同時跑造成重複複製
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    Logger.log("⏳ 另一個同步正在執行中，本次自動跳過");
    return;
  }

  try {
    // 1. CNN 共用資料夾 ID（已填好）
    var sourceFolderId = "13IA9Ad_sqJrTVXoNdMowTQh09Ds9ASVV";

    // 2. 目的地資料夾名稱（自動在我的雲端硬碟建立，已存在就沿用）
    var targetName = "CNN課程備份";

    var sourceFolder = DriveApp.getFolderById(sourceFolderId);

    // --- 自動建立 / 取得目的地資料夾（免手動建資料夾、免複製 ID）---
    var targetFolder = null;
    var rootFolders = DriveApp.getRootFolder().getFolders();
    while (rootFolders.hasNext()) {
      var f = rootFolders.next();
      if (f.getName() === targetName) {
        targetFolder = f;
        break;
      }
    }
    if (targetFolder === null) {
      targetFolder = DriveApp.getRootFolder().createFolder(targetName);
      Logger.log("📂 已自動建立目的地資料夾: " + targetName);
    } else {
      Logger.log("📂 使用既有的目的地資料夾: " + targetName);
    }
    Logger.log("🔗 目的地資料夾連結: " + targetFolder.getUrl());

    Logger.log("🚀 開始智慧同步（已存在的同名檔案會自動比對新舊）...");
    copyFolderSmart(sourceFolder, targetFolder);
    Logger.log("🎉 智慧同步完成！");

    // 全部完成 → 自動關閉自動排程（若有的話）
    cleanupAutoRetry();
    Logger.log("⏰ 自動排程已關閉（若之前有開啟）。以後想再同步，重新執行即可。");
  } finally {
    lock.releaseLock();
  }
}

// ---------- 自動續跑小幫手 ----------
// 在編輯器選單選 installAutoRetry 按一次「執行」，
// 之後每 10 分鐘自動同步一次，全部完成後會自動關閉自己。

function installAutoRetry() {
  cleanupAutoRetry(); // 先清掉舊排程，避免重複建立
  ScriptApp.newTrigger("startSmartCloneCNN").timeBased().everyMinutes(10).create();
  Logger.log("⏰ 自動排程已啟動：每 10 分鐘自動同步一次，全部完成後會自動關閉。可以放心關掉瀏覽器了！");
}

function cleanupAutoRetry() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
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
