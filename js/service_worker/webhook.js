/**
 * YouTube 下載插件 - Webhook 相關功能模組
 * 處理與 Webhook 相關的請求和回應
 */

/**
 * 構建 HTTP 請求標頭
 * @returns {Object} - 請求標頭物件
 */
async function buildRequestHeaders() {
  const result = await chrome.storage.local.get(['CONFIG']);
  const config = result.CONFIG;

  const headers = {
    'Accept': 'application/json, text/plain, */*'
  };

  // 添加 Authorization 標頭
  headers['Authorization'] = `Bearer ${config.BEARER_TOKEN}`;
  
  return headers;
}

export { buildRequestHeaders };
