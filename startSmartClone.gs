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
