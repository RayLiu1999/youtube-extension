
/**
 * YouTube 下載插件 - 背景腳本
 * 整合所有功能模組，處理擴充功能的主要邏輯
 */

// 導入配置管理器
import configManager from './config.js';

// 導入功能模組
import { initKeepAlive } from './keepAlive.js';
import { handleDownloadRequest } from './download.js';
import { handleCheckVideoSummaryRequest, handleSummaryRequest } from './summary.js';
import { createContextMenus } from './menu.js';
import { initCommandListener } from './commands.js';

// 初始化保活機制
initKeepAlive();

// 初始化命令監聽器
initCommandListener();

let CONFIG = {};
let userSettings = {};

// 初始化應用程序
async function initializeApp() {
  try {
    // 載入設定
    await configManager.initialize();
    console.log('設定已載入');
    
    CONFIG = configManager.getConfig();
    userSettings = configManager.getUserSettings();

    console.log('CONFIG:', CONFIG);
    console.log('userSettings:', userSettings);
    
    // 創建右鍵選單
    createContextMenus();
    
    console.log('應用程序初始化完成');
  } catch (error) {
    console.error('初始化應用程序時發生錯誤:', error);
  }
}

// ===== 事件處理 =====

// 操作初始化
chrome.runtime.onInstalled.addListener(() => {
  initializeApp();
});

// 處理右鍵選單點擊事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId.startsWith('quality-')) {
    const quality = info.menuItemId.replace('quality-', '');
    userSettings.video.quality = quality;
    console.log(`品質已設置為: ${quality}`);
    // 通知內容腳本設置已更改
    chrome.tabs.sendMessage(tab.id, { action: 'settingsUpdated', settings: userSettings });
  } else if (info.menuItemId.startsWith('format-')) {
    const format = info.menuItemId.replace('format-', '');
    userSettings.video.format = format;
    console.log(`格式已設置為: ${format}`);
    // 通知內容腳本設置已更改
    chrome.tabs.sendMessage(tab.id, { action: 'settingsUpdated', settings: userSettings });
  }
});

// 處理來自 content script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);
  
  if (message && message.action === 'getSettings') {
    // 先確保 URL 與當前模式一致
    configManager.updateServiceUrl();
    
    // 返回當前設置 (不包含 API Key)
    const safeSettings = {
      quality: userSettings.video.quality,
      format: userSettings.video.format,
      isOnlineMode: userSettings.isOnlineMode,
      hasApiKey: !!userSettings.apiKey // 只傳遞是否有 API Key 的狀態，不傳遞 Key 本身
    };
    sendResponse({ success: true, settings: safeSettings });
    return true;
  }
  else if (message && message.action === 'settingsUpdated' && message.settings) {
    console.log('收到設定更新消息:', message.settings);
    
    // 更新 API Key
    if (message.settings.apiKey !== undefined) {
      userSettings.apiKey = message.settings.apiKey;
    }
    
    // 處理模式設定
    if (message.settings.isOnlineMode !== undefined) {
      userSettings.isOnlineMode = message.settings.isOnlineMode === true;
      console.log('模式設定已更新為: ' + (userSettings.isOnlineMode ? '線上' : '本地'));
      
      // 更新 URL
      configManager.updateServiceUrl();
    }
    
    console.log('設定已更新:');
    console.log('API Key: ' + (userSettings.apiKey ? '已設定' : '未設定'));
    console.log('當前模式: ' + (userSettings.isOnlineMode ? '線上' : '本地'));
    return true;
  }
  else if (message && message.action === 'summarizeVideo' && message.videoUrl) {
    handleSummaryRequest(message, sendResponse);
    return true; // 保持消息通道開放以進行異步回應
  }
  else if (message && message.action === 'checkVideoSummary' && message.videoId) {
    handleCheckVideoSummaryRequest(message, sender, sendResponse);
    return true; // 保持消息通道開放以進行異步回應
  }
  else if (message && message.action === 'triggerVideoDownload' && message.videoUrl) {
    handleDownloadRequest(message, sendResponse);
    return true; // 保持消息通道開放以進行異步回應
  } else {
    console.error('Invalid message format or missing data');
    sendResponse({ success: false, error: '無效的消息格式或缺少數據' });
    return true;
  }
});