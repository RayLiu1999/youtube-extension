/**
 * YouTube 下載插件 - 工具函數
 */

// 創建全局命名空間
window.YTExtension = window.YTExtension || {};

// 工具函數
window.YTExtension.Utils = {
  // 檢查是否為 YouTube 影片頁面
  isYouTubeVideoPage: function() {
    return window.location.href.includes('youtube.com/watch');
  },

  // 檢查是否在直播中
  isLiveStream: function() {
    // 方法 1：檢查是否有直播標記
    const hasLiveBadge = document.querySelector('.ytp-live-badge') !== null;
    
    // 方法 2：檢查是否有直播聊天室
    const hasLiveChat = document.querySelector('#chat-messages, #chat-container') !== null;
    
    // 方法 3：檢查頁面源碼是否包含直播相關字標
    const isLiveMetadata = document.querySelector('meta[itemprop="isLiveBroadcast"][content="true"]') !== null;
    
    // 方法 4：檢查 URL 是否包含直播相關參數
    const urlHasLiveParam = window.location.href.includes('/live/');
    
    // 結合多種方法判斷
    return hasLiveBadge || hasLiveChat || isLiveMetadata || urlHasLiveParam;
  },
  
  // 從 URL 獲取視頻 ID
  getVideoIdFromUrl: function(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('v');
    } catch (error) {
      console.error('解析 URL 錯誤:', error);
      return null;
    }
  },
  
  // 獲取當前視頻 ID
  getCurrentVideoId: function() {
    return this.getVideoIdFromUrl(window.location.href);
  },

  // 獲取當前視頻標題
  getCurrentVideoTitle: function() {
    return this.cleanYouTubeTitle(document.title);
  },
  
  // 清理 YouTube 標題
  cleanYouTubeTitle: function(title) {
    return title.replace(/^\(\d+\)\s*/, '').replace(/ - YouTube$/, '').trim();
  },
};
