/**
 * YouTube 下載插件 - 工具函數模組
 * 提供各種通用工具函數
 */

/**
 * 檢查 URL 是否為有效的 YouTube 影片 URL
 * @param {string} url - 要檢查的 URL
 * @returns {boolean} - URL 是否有效
 */
function isValidYouTubeUrl(url) {
  return url && url.includes('youtube.com/watch?v=');
}

/**
 * 清理 YouTube 標題，移除前面的通知數字和" - YouTube"
 * @param {string} title - 原始 YouTube 標題
 * @returns {string} - 清理後的標題
 */
function cleanYouTubeTitle(title) {
  if (!title) return '';
  
  // 移除標題前面的通知數字，如 "(2) "，"(10) "等
  let cleanedTitle = title.replace(/^\([0-9]+\)\s+/, '');
  
  // 移除標題後面的" - YouTube"
  cleanedTitle = cleanedTitle.replace(/ - YouTube$/, '');
  
  if (cleanedTitle !== title) {
    console.log('已清理 YouTube 標題，從', title, '到', cleanedTitle);
  }
  
  return cleanedTitle;
}

/**
 * 如果存在 sendResponse，則發送回應
 * @param {Function} sendResponse - 用於回應的函數
 * @param {Object} options - 要發送的回應物件
 */
function ifHasSendResponse(sendResponse, options = {}) {
  if (sendResponse) {
    sendResponse(options);
  }
}

export {
  isValidYouTubeUrl,
  cleanYouTubeTitle,
  ifHasSendResponse
};
