/**
 * YouTube 下載插件 - 摘要功能模組
 * 處理影片摘要相關功能
 */

import configManager from './config.js';
import { buildRequestHeaders } from './webhook.js';
import { isValidYouTubeUrl } from './utils.js';

/**
 * 處理檢查摘要請求
 * @param {Object} request - 請求物件
 * @param {Object} sender - 發送者物件
 * @param {Function} sendResponse - 回應函數
 */
async function handleCheckVideoSummaryRequest(request, sender, sendResponse) {
  try {
    // 獲取用戶設置
    const userSettings = configManager.getUserSettings();
    console.log('用戶設置:', userSettings);
    
    // 檢查 URL 是否有效
    if (!isValidYouTubeUrl(request.videoUrl)) {
      console.error('無效的 YouTube URL:', request.videoUrl);
      sendResponse({ success: false, error: '無效的 YouTube URL' });
      return;
    }
    
    console.log(`處理檢查摘要請求: ${request.videoUrl}`);

    // 組合取得總結網址
    const getSummaryUrl = userSettings.get_summary_url + 
    `?video_id=${request.videoId}`;
    
    // 構建請求標頭
    const headers = await buildRequestHeaders();
    
    // 發送請求到 webhook
    console.log('發送檢查摘要請求到 webhook:', getSummaryUrl);
    
    const response = await fetch(getSummaryUrl, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Webhook 請求失敗:', response.status, errorText);
      sendResponse({ success: false, error: `Webhook 請求失敗: ${response.status}` });
      return;
    }
    
    const jsonData = await response.json();
    console.log('Webhook 檢查摘要回應:', jsonData);
    
    // 處理檢查摘要回應
    if (jsonData.status === 'success' && jsonData.data) {
      sendResponse({ success: true, data: jsonData.data });
    } else {
      console.error('檢查摘要請求回應無效:', jsonData);
      sendResponse({ success: false, error: '檢查摘要請求回應無效' });
    }
  } catch (error) {
    console.error('處理檢查摘要請求時發生錯誤:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * 處理摘要請求
 * @param {Object} request - 請求物件
 * @param {Function} sendResponse - 回應函數
 * @returns {void}
 */
async function handleSummaryRequest(request, sendResponse) {
  try {
    // 獲取用戶設置
    const userSettings = configManager.getUserSettings();
    console.log('用戶設置:', userSettings);
    
    // 檢查 URL 是否有效
    if (!isValidYouTubeUrl(request.videoUrl)) {
      console.error('無效的 YouTube URL:', request.videoUrl);
      sendResponse({ success: false, error: '無效的 YouTube URL' });
      return;
    }

    // 檢查 API Key 是否存在
    if (!userSettings.apiKey) {
      console.error('未設定 API Key');
      sendResponse({ success: false, error: '未設定 API Key' });
      return;
    }
    
    // 先創建一個新分頁並直接開啟 summary.html
    chrome.tabs.create({ url: 'html/summary.html' }, async (tab) => {
      // 組合觸發摘要網址
      const triggerSummaryUrl = userSettings.download_and_summary_url + 
      `?url=${request.videoUrl}&` + 
      `format=mp3&` + 
      `summarize=1&` + 
      `token=${userSettings.apiKey}&` + 
      `title=${encodeURIComponent(request.videoTitle)}`;

      console.log('觸發摘要網址:', triggerSummaryUrl);
    
      const headers = await buildRequestHeaders();

      const response = await fetch(triggerSummaryUrl, {
        method: 'GET',
        headers: headers
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Webhook 請求失敗:', response.status, errorText);
        responseAndSendSummary(sendResponse, tab, { error: `Webhook 請求失敗: ${response.status}` });
        return;
      }
      
      const jsonData = await response.json();
      console.log('Webhook 摘要回應:', jsonData);
      
      // 處理摘要回應
      if (jsonData.status === 'success' && jsonData.data) {
        let responseData = jsonData.data;
        responseData['videoUrl'] = request.videoUrl;
        responseData['videoTitle'] = request.videoTitle;
        responseAndSendSummary(sendResponse, tab, { summary: responseData });
        return;
      } else {
        // 發送摘要更新通知失敗
        responseAndSendSummary(sendResponse, tab, { error: '發送摘要更新通知失敗' });
        return;
      }
    });
  } catch (error) {
    // 發送摘要更新通知失敗
    responseAndSendSummary(sendResponse, tab, { error: error.message });
    return;
  }
}

/**
 * 處理摘要回應
 * @param {Function} sendResponse - 用於回傳訊息的函數
 * @param {Object} tab - 用於回傳訊息的 tab 物件
 * @param {Object} options - 額外的回應訊息
 * @returns {void}
 */
function responseAndSendSummary(sendResponse, tab, options = {}) {
  chrome.tabs.sendMessage(
    tab.id,
    {
      action: 'updateSummary',
      summary: options?.summary || {}
    });
  
  let message = {};
  if (options.error) {
    message.success = false;
  } else {
    message.success = true;
  }

  message = { ...message, ...options };
  sendResponse(message);
  return;
}

export { handleCheckVideoSummaryRequest, handleSummaryRequest };
