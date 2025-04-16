/**
 * YouTube 下載插件 - 命令功能模組
 * 處理鍵盤快捷鍵命令相關功能
 */

import configManager from "./config.js";
import { isValidYouTubeUrl } from "./utils.js";
import { handleDownloadRequest } from "./download.js";

/**
 * 初始化命令監聽器
 */
function initCommandListener() {
  chrome.commands.onCommand.addListener(async (command) => {
    console.log("收到鍵盤命令:", command);

    // 根據命令類型執行不同操作
    switch (command) {
      case "toggle-online-or-local":
        await handleToggleOnlineOrLocal();
        break;
      case "trigger-download":
        handleDownloadCommand();
        break;
      default:
        console.warn("未知的命令:", command);
    }
  });

  console.log("已初始化命令監聽器");
}

/**
 * 處理切換線上/本地模式命令
 */
async function handleToggleOnlineOrLocal() {
  let userSettings = configManager.getUserSettings();
  // 切換線上/本地模式
  if (userSettings.isOnlineMode === true) {
    await configManager.updateUserSettings({ isOnlineMode: false });
  } else {
    await configManager.updateUserSettings({ isOnlineMode: true });
  }

  // 更新 webhook URL
  configManager.updateServiceUrl();

  // 重新載入用戶設定
  userSettings = configManager.getUserSettings();

  console.log(
    "快捷鍵已切換模式為: " + (userSettings.isOnlineMode ? "線上" : "本地")
  );

  // 顯示通知
  chrome.notifications.create({
    type: "basic",
    iconUrl: "/assets/icon128.png", // 修正圖標路徑
    title: "線上/本地模式已切換",
    message: `已切換到${userSettings.isOnlineMode ? "線上" : "本地"}模式`,
    priority: 2,
  });

  // 獲取當前活動標籤頁
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) {
      console.error("找不到活動標籤頁");
      return;
    }

    const tab = tabs[0];

    // 檢查 URL 是否為 YouTube 頁面
    if (tab.url.includes("youtube.com")) {
      // 向標籤頁發送模式已切換的消息
      chrome.tabs.sendMessage(
        tab.id,
        {
          action: "toggleOnlineOrLocal",
          isOnlineMode: userSettings.isOnlineMode,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error("發送模式切換通知失敗:", chrome.runtime.lastError);
          } else {
            console.log("已發送模式切換通知到標籤頁");
          }
        }
      );
    }
  });
}

/**
 * 處理下載命令
 */
async function handleDownloadCommand() {
  const userSettings = configManager.getUserSettings();

  // 獲取當前活動標籤頁
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    if (tabs.length === 0) {
      console.error("找不到活動標籤頁");
      return;
    }

    const tab = tabs[0];

    // 檢查 URL 是否為有效的 YouTube 影片 URL
    if (!isValidYouTubeUrl(tab.url)) {
      console.error("不是有效的 YouTube 影片頁面:", tab.url);
      return;
    }

    // 顯示通知
    chrome.notifications.create({
      type: "basic",
      iconUrl: "/assets/icon128.png", // 修正圖標路徑
      title: "下載命令已發送",
      message: `已發送下載請求到${userSettings.isOnlineMode ? "線上" : "本地"}模式`,
      priority: 2,
    });

    console.log("處理下載命令，標籤頁:", tab.id, "，URL:", tab.url);

    const response = await handleDownloadRequest({
      videoUrl: tab.url,
      quality: userSettings.video.quality,
      format: userSettings.video.format
    });

    console.log("處理下載命令，回應:", response);

    if (response && response.success) {
      // 向標籤頁發送成功訊息
      chrome.tabs.sendMessage(
        tab.id,
        {
          action: "showDialog",
          title: "下載狀態",
          message: /*html*/
          `<p>下載請求已成功發送！</p>
         <p>狀態訊息: ${response.message}</p>`,
          buttons: [
            {
              text: "確定",
              primary: true,
              onClick: () => {},
            },
          ],
        },
        (response) => {
          if (response && response.success) {
            console.log("已發送成功訊息到標籤頁");
          } else {
            console.error("發送成功訊息失敗:", response);
          }
        }
      );
    } else {
      // 向標籤頁發送失敗訊息
      chrome.tabs.sendMessage(
        tab.id,
        {
          action: "showDialog",
          title: "下載失敗",
          message: /*html*/
          `<p>下載請求失敗！</p>
          <p>錯誤信息: ${response ? response.error || "未知錯誤" : "未知錯誤"}</p>`,
          buttons: [
            {
              text: "確定",
              primary: true,
              onClick: () => {},
            },
          ],
        },
        (response) => {
          if (response && response.success) {
            console.log("已發送失敗訊息到標籤頁");
          } else {
            console.error("發送失敗訊息失敗:", response);
          }
        }
      );
    }
  });
}

export { initCommandListener };
