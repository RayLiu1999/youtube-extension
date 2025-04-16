/**
 * YouTube 下載插件 - 下載功能模組
 * 處理影片下載相關功能
 */

import configManager from './config.js';
import { buildRequestHeaders } from './webhook.js';
import { isValidYouTubeUrl, ifHasSendResponse } from './utils.js';

/**
 * 處理下載請求
 * @param {Object} request - 請求物件
 * @param {Function} sendResponse - 回應函數
 * @returns {Promise<Object>} - 下載結果物件
 */
async function handleDownloadRequest(request, sendResponse) {
  try {
    // 獲取用戶設置
    const userSettings = configManager.getUserSettings();
    
    // 初始化錯誤訊息物件
    let errorMessage = {
      success: false,
      error: ''
    };
    
    // 檢查 URL 是否有效
    if (!isValidYouTubeUrl(request.videoUrl)) {
      console.error('無效的 YouTube URL:', request.videoUrl);
      errorMessage.error = '無效的 YouTube URL';
      ifHasSendResponse(sendResponse, errorMessage);
      return errorMessage;
    }
    
    // 獲取品質和格式設置
    const quality = request.quality || userSettings.video.quality;
    const format = request.format || userSettings.video.format;
    
    // 組合觸發下載網址
    const triggerDownloadUrl = userSettings.download_and_summary_url + 
    `?url=${request.videoUrl}&quality=${quality}&format=${format}`;

    console.log('觸發下載網址:', triggerDownloadUrl);
    
    // 構建請求標頭
    const headers = await buildRequestHeaders();
    
    // 發送請求到 webhook
    const response = await fetch(triggerDownloadUrl, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Webhook 請求失敗:', response.status, errorText);
      errorMessage.error = `Webhook 請求失敗: ${response.status}`;
      ifHasSendResponse(sendResponse, errorMessage);
      return errorMessage;
    }
    
    const jsonData = await response.json();
    console.log('Webhook 回應:', jsonData);
    
    // 處理下載回應
    const result = await handleDownloadResponse(jsonData, sendResponse);
    return result;
  } catch (error) {
    console.error('處理下載請求時發生錯誤:', error);
    errorMessage.error = error.message;
    ifHasSendResponse(sendResponse, errorMessage);
    return errorMessage;
  }
}

/**
 * 處理下載回應
 * @param {Object} jsonData - 響應的 JSON 資料
 * @param {Function} sendResponse - 用於回傳訊息的函數
 * @returns {Promise<Object>} - 下載結果物件
 */
function handleDownloadResponse(jsonData, sendResponse) {
  return new Promise((resolve, reject) => {
    // 初始化成功訊息物件
    let successMessage = {
      success: true,
      message: '',
    };

    // 初始化失敗訊息物件
    let errorMessage = {
      success: false,
      error: ''
    };

    if (!jsonData) {
      errorMessage.error = '無效的 JSON 資料';
      ifHasSendResponse(sendResponse, errorMessage);
      resolve(errorMessage);
      return;
    }

    if (jsonData.status === 'error') {
      errorMessage.error = jsonData.message;
      ifHasSendResponse(sendResponse, errorMessage);
      resolve(errorMessage);
      return;
    }

    if (jsonData.status === 'success' && parseInt(jsonData.data.online) === 0) {
      successMessage.message = '下載成功';
      ifHasSendResponse(sendResponse, successMessage);
      resolve(successMessage);
      return;
    }

    // 檢查是否有線上檔案可下載
    if (jsonData.data && parseInt(jsonData.data.online) === 1 && jsonData.data.download_file_name) {
      console.log('檢測到可下載檔案:', jsonData.data.download_file_name);
      
      // 構建完整的下載 URL
      const userSettings = configManager.getUserSettings();
      const downloadFileUrl = `${userSettings.file_url}${jsonData.data.download_file_name}`;
      console.log('下載檔案 URL:', downloadFileUrl);
      
      // 使用 Chrome 下載 API 下載檔案
      chrome.downloads.download({
        url: downloadFileUrl,
        filename: jsonData.data.download_file_name,
        saveAs: false
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error('下載檔案錯誤:', chrome.runtime.lastError);
          errorMessage.error = chrome.runtime.lastError.message;
          ifHasSendResponse(sendResponse, errorMessage);
          resolve(errorMessage);
        } else {
          console.log('檔案下載已開始，下載 ID:', downloadId);
          successMessage.message = '檔案下載已開始';
          ifHasSendResponse(sendResponse, successMessage);
          resolve(successMessage);
        }
      });
    }

    errorMessage.error = '下載失敗';
    ifHasSendResponse(sendResponse, errorMessage);
    resolve(errorMessage);
  });
}

export { handleDownloadRequest };
