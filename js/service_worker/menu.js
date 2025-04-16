/**
 * YouTube 下載插件 - 選單功能模組
 * 處理右鍵選單相關功能
 */

import configManager from "./config.js";

// 選單 ID 常量
const MENU_DOWNLOAD_VIDEO_OPTIONS = "menu-download-video-options";
const MENU_DOWNLOAD_VIDEO_QUALITY = "menu-download-video-quality";
const MENU_DOWNLOAD_VIDEO_FORMAT = "menu-download-video-format";

/**
 * 創建右鍵選單
 */
function createContextMenus() {
  // 移除所有現有選單
  chrome.contextMenus.removeAll(() => {
    console.log("已移除所有現有選單");

    // 創建下載影片選單項
    chrome.contextMenus.create({
      id: MENU_DOWNLOAD_VIDEO_OPTIONS,
      title: "影片下載設定",
      contexts: ["page", "link", "video"],
    });

    // 創建品質選項選單
    chrome.contextMenus.create({
      id: MENU_DOWNLOAD_VIDEO_QUALITY,
      parentId: MENU_DOWNLOAD_VIDEO_OPTIONS,
      title: "品質",
      contexts: ["page", "link", "video"],
    });

    // 創建格式選項選單
    chrome.contextMenus.create({
      id: MENU_DOWNLOAD_VIDEO_FORMAT,
      parentId: MENU_DOWNLOAD_VIDEO_OPTIONS,
      title: "格式",
      contexts: ["page", "link", "video"],
    });

    // 創建品質選項選單
    configManager.getQualityOptions().forEach((option) => {
      chrome.contextMenus.create({
        id: `quality-${option.id}`,
        parentId: MENU_DOWNLOAD_VIDEO_QUALITY,
        title: option.title,
        type: "radio",
        contexts: ["page", "link", "video"],
        checked: option.id === configManager.getUserSettings().video.quality,
      });
    });

    // 創建格式選項選單
    configManager.getFormatOptions().forEach((option) => {
      chrome.contextMenus.create({
        id: `format-${option.id}`,
        parentId: MENU_DOWNLOAD_VIDEO_FORMAT,
        title: option.title,
        type: "radio",
        contexts: ["page", "link", "video"],
        checked: option.id === configManager.getUserSettings().video.format,
      });
    });

    // 事件監聽
    chrome.contextMenus.onClicked.addListener(handleMenuClick);
  });
}

/**
 * 處理選單點擊事件
 * @param {Object} info - 選單點擊信息
 * @param {Object} tab - 標籤信息
 */
function handleMenuClick(info, tab) {
  if (info.menuItemId.startsWith("quality-")) {
    const quality = info.menuItemId.replace("quality-", "");
    configManager.updateUserSettings({ video: { quality } });
    console.log(`品質已設置為: ${quality}`);
    // 通知內容腳本設置已更改
    chrome.tabs.sendMessage(tab.id, {
      action: "settingsUpdated",
      settings: configManager.getUserSettings(),
    });
  } else if (info.menuItemId.startsWith("format-")) {
    const format = info.menuItemId.replace("format-", "");
    configManager.updateUserSettings({ video: { format } });
    console.log(`格式已設置為: ${format}`);
    // 通知內容腳本設置已更改
    chrome.tabs.sendMessage(tab.id, {
      action: "settingsUpdated",
      settings: configManager.getUserSettings(),
    });
  }
}

export {
  createContextMenus,
  handleMenuClick,
};
