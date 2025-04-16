/**
 * YouTube 下載插件 - 核心模組
 * 負責初始化和協調各個功能模組
 */

// 確保全局命名空間存在
window.YTExtension = window.YTExtension || {};

// 核心模組
window.YTExtension.Core = {
  // 初始化函數
  initialize: async function() {
    console.log('初始化 YouTube 下載插件...');

    // 初始化 URL 變化觀察者
    await this.initUrlChangeObserver();

    // 初始化設置監聽器
    await this.initSettingsListener();
    
    // 在初始化完成後立即檢查當前頁面
    await this.checkCurrentPage();
    
    console.log('YouTube 下載插件初始化完成');
  },
  
  // 檢查當前頁面
  checkCurrentPage: async function() {
    // 一律都先移除所有按鈕
    await window.YTExtension.UI.Buttons.removeAllButtons();

    // 檢查是否為 YouTube 影片頁面
    if (window.YTExtension.Utils.isYouTubeVideoPage()) {
      console.log('檢測到 YouTube 影片頁面');

      // 初始化模組
      await this.initModules();
    }
  },

  // 初始化模組
  initModules: async function() {
    // 初始化總結管理模組
    await window.YTExtension.Summary.initialize();

    // 初始化 UI
    await window.YTExtension.UI.initialize();
  },
  
  // 初始化 URL 變化觀察器
  initUrlChangeObserver: async function() {
    // 保存當前 URL
    let lastUrl = window.location.href;
    
    // 創建 MutationObserver 實例
    const observer = new MutationObserver(async () => {
      // 檢查 URL 是否變化
      if (lastUrl !== window.location.href) {
        console.log('URL 已變化:', lastUrl, '->', window.location.href);
        
        // 更新 lastUrl
        lastUrl = window.location.href;

        // 檢查新頁面
        await this.checkCurrentPage();
      }
    });
    
    // 開始觀察
    observer.observe(document, { subtree: true, childList: true });
    
    console.log('URL 變化觀察器已初始化');
  },

  // 初始化設置監聽器
  initSettingsListener: async function() {
    // 監聽來自 background.js 的設置更新訊息
    chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
      // 設置更新
      if (message.action === 'settingsUpdated') {
        console.log('收到設置更新訊息:', message);
        
        // 更新下載按鈕
        await window.YTExtension.Download.updateDownloadButtonSettings();
        
        // 回應
        sendResponse({ success: true });
      }
      // 顯示對話框
      else if (message.action === 'showDialog') {
        window.YTExtension.UI.Dialog.showDialog(message.title, message.message, message.buttons);
        sendResponse({ success: true });
      }
    });
    
    console.log('設置監聽器已初始化');
  },
};
