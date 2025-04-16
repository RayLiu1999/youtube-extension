/**
 * YouTube 下載插件 - 彈出頁面
 * 處理彈出頁面的邏輯
 */

import configManager from '../service_worker/config.js';

// 當頁面載入完成後執行
document.addEventListener('DOMContentLoaded', async function() {
  // 初始化配置管理器
  await configManager.initialize();
  let userSettings = configManager.getUserSettings();

  // 獲取頁面元素
  const apiKeyDisplay = document.getElementById('api-key-display');
  const qualityDisplay = document.getElementById('quality-display');
  const formatDisplay = document.getElementById('format-display');
  const apiKeyStatus = document.getElementById('api-key-status');
  const openOptionsLink = document.getElementById('open-options');
  
  // 顯示 API Key 狀態
  if (userSettings.apiKey) {
    apiKeyDisplay.textContent = '已設定 (' + maskApiKey(userSettings.apiKey) + ')';
    apiKeyStatus.textContent = 'API Key 已設定，可以正常使用擴充功能。';
    apiKeyStatus.className = 'status success';
  } else {
    apiKeyDisplay.textContent = '未設定';
    apiKeyStatus.textContent = '請先設定 OpenAI API Key 才能使用完整功能。';
    apiKeyStatus.className = 'status warning';
  }
  
  // 顯示品質設定
  const qualityOptions = configManager.getQualityOptions();
  // 將選項轉換為 id -> title 的對應表
  const qualityMap = {};
  qualityOptions.forEach(option => {
    qualityMap[option.id] = option.title;
  });
  qualityDisplay.textContent = qualityMap[userSettings.video.quality] || userSettings.video.quality;
  
  // 顯示格式設定
  const formatOptions = configManager.getFormatOptions();
  // 將選項轉換為 id -> title 的對應表
  const formatMap = {};
  formatOptions.forEach(option => {
    formatMap[option.id] = option.title;
  });
  formatDisplay.textContent = formatMap[userSettings.video.format] || userSettings.video.format;
  
  // 開啟設定頁面
  openOptionsLink.addEventListener('click', function(e) {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
  
  // 遮罩 API Key 只顯示前4個和後4個字符
  function maskApiKey(apiKey) {
    if (apiKey.length <= 8) {
      return apiKey;
    }
    return apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4);
  }
});
