/**
 * YouTube 下載插件 - 主入口文件
 * 負責整合所有模組並初始化插件
 */

// 確保全局命名空間存在
window.YTExtension = window.YTExtension || {};

// 當頁面載入時執行初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
}

// 初始化擴充功能
function initializeExtension() {
  console.log('YouTube 下載插件啟動中...');
  
  // 檢查所有必要的模組是否已載入
  if (!window.YTExtension.Utils) {
    console.error('錯誤: Utils 模組未載入');
    return;
  }
  
  if (!window.YTExtension.UI) {
    console.error('錯誤: UI 模組未載入');
    return;
  }
  
  if (!window.YTExtension.Download) {
    console.error('錯誤: Download 模組未載入');
    return;
  }
  
  if (!window.YTExtension.Summary) {
    console.error('錯誤: Summary 模組未載入');
    return;
  }
  
  if (!window.YTExtension.Core) {
    console.error('錯誤: Core 模組未載入');
    return;
  }
  
  // 初始化核心模組
  window.YTExtension.Core.initialize();
  
  console.log('YouTube 下載插件已成功啟動');
}

// 監聽來自背景腳本的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 處理模式切換通知
  if (message.action === 'toggleOnlineOrLocal') {
    console.log('線上/本地模式已切換:', message.isOnlineMode ? '線上' : '本地');
    // 顯示對話框
    window.YTExtension.UI.Dialog.showDialog(
      '線上/本地模式已切換',
      `已切換到${message.isOnlineMode ? '線上' : '本地'}模式`,
      [
        {
          text: '確定',
          primary: true,
          onClick: () => {}
        }
      ]
    );
    
    // 回應背景腳本
    sendResponse({ success: true });
    return true;
  }
  else if (message.action === "updateSummary" && message.summary) {
    console.log("收到摘要更新通知:", message.summary);
    sendResponse({ success: true });
    return true;
  }
});