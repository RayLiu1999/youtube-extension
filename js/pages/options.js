/**
 * YouTube 下載插件 - 設定頁面
 * 處理設定頁面的邏輯
 */

import configManager from '../service_worker/config.js';

// 當頁面載入完成後執行
document.addEventListener('DOMContentLoaded', async function() {
  // 初始化配置管理器
  await configManager.initialize();
  let userSettings = configManager.getUserSettings();
  
  // 獲取頁面元素
  const apiKeyInput = document.getElementById('api-key');
  const saveButton = document.getElementById('save-button');
  const statusMessage = document.getElementById('status-message');
  const toggleApiKey = document.getElementById('toggle-api-key');

  // 設定 API Key
  if (userSettings.apiKey) {
    apiKeyInput.value = userSettings.apiKey;
  }
  
  // 切換 API Key 的可見性
  toggleApiKey.addEventListener('click', function() {
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      toggleApiKey.textContent = '隱藏 API Key';
    } else {
      apiKeyInput.type = 'password';
      toggleApiKey.textContent = '顯示 API Key';
    }
  });
  
  // 儲存設定按鈕點擊事件
  saveButton.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();

    configManager.updateUserSettings({
      apiKey: apiKey,
    });

    // 更新顯示
    apiKeyInput.value = apiKey;

    showStatus('設定已成功儲存！', 'success');
  });
  
  // 顯示狀態訊息
  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = 'status ' + type;
    statusMessage.style.display = 'block';
    
    // 3秒後自動隱藏訊息
    setTimeout(function() {
      statusMessage.style.display = 'none';
    }, 3000);
  }
});
