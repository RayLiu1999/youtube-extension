/**
 * YouTube 下載插件 - 樣式模組
 */

// 確保全局命名空間存在
window.YTExtension = window.YTExtension || {};
window.YTExtension.UI = window.YTExtension.UI || {};

// 樣式模組
window.YTExtension.UI.Styles = {
  // 初始化函數
  initialize: async function() {
    await this.loadStyles();
  },
  
  // 載入樣式
  loadStyles: function() {
    return new Promise((resolve, reject) => {
      // 從外部 CSS 檔案載入樣式
      const linkElement = document.createElement('link');
      linkElement.rel = 'stylesheet';
      linkElement.type = 'text/css';
      linkElement.href = chrome.runtime.getURL('css/styles.css');

      linkElement.onload = () => resolve();
      linkElement.onerror = (error) => reject(error);
      document.head.appendChild(linkElement);
      console.log('已載入樣式表');
    });
  },
};
