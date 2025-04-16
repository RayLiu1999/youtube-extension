/**
 * YouTube 下載插件 - Service Worker 保活機制
 * 確保 Service Worker 不會休眠，避免跳轉問題
 */

// 設定唤醒間隔時間（毫秒）
// 注意：不要設置太短，以避免使用過多系統資源
// 25 秒是一個更平衡的選擇，這比大多數 Service Worker 的休眠間隔短
// (通常為 30 秒左右)
const KEEP_ALIVE_INTERVAL = 25000;

// Keep-Alive 函數
function keepServiceWorkerAlive() {
  // 記錄唤醒時間戳記
  const now = new Date();
  const timestamp = now.toISOString();
  
  // 將時間存入 chrome.storage
  chrome.storage.local.set({ 'serviceWorkerLastWakeup': timestamp }, function() {
    // 進行一個簡單讀取操作來保持 Service Worker 活躍
    chrome.storage.local.get(['serviceWorkerLastWakeup'], function(data) {
      console.log('服務工作器唤醒成功，時間：', data.serviceWorkerLastWakeup);
    });
  });
}

// 初始化保活機制
function initKeepAlive() {
  // 1. 使用 setInterval 進行定期唤醒
  const keepAliveInterval = setInterval(keepServiceWorkerAlive, KEEP_ALIVE_INTERVAL);

  // 2. 初始化時立即執行一次
  keepServiceWorkerAlive();

  // 3. 使用備用的定時喚醒機制
  // 每 40 秒再次執行一次喚醒，以防主要機制失效
  setTimeout(function backupWakeup() {
    console.log('備用定時器喚醒 Service Worker');
    keepServiceWorkerAlive();
    
    // 過一段時間後再次執行
    setTimeout(backupWakeup, 40000);
  }, 40000);
}

export { initKeepAlive };
