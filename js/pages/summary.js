/**
 * YouTube 下載插件 - 摘要頁面
 * 處理摘要頁面的邏輯
 */

document.addEventListener("DOMContentLoaded", function () {
  // 取得頁面元素
  const loadingView = document.getElementById("loading-view");
  const summaryView = document.getElementById("summary-view");
  const summaryContent = document.getElementById("summary-content");
  const processTimeEl = document.getElementById("process-time");
  let seconds = 0;
  let checkInterval;
  let timerInterval;

  // 初始化頁面 - 預設顯示載入視圖
  loadingView.classList.remove("hidden");
  summaryView.classList.add("hidden");

  // 顯示總結視圖函數
  function showSummaryView(summaryData) {
    // 清除載入定時器
    if (checkInterval) clearInterval(checkInterval);
    if (timerInterval) clearInterval(timerInterval);

    // 切換視圖
    loadingView.classList.add("hidden");
    summaryView.classList.remove("hidden");

    try {
      // 填充總結內容
      if (summaryData.content) {
        summaryContent.textContent = summaryData.content;
      } else {
        summaryContent.innerHTML = /*html*/ `<p>無法解析總結內容。</p>`;
      }

      // 填充影片資訊
      const videoInfo = document.getElementById("video-info");
      if (summaryData.videoUrl) {
        videoInfo.innerHTML = /*html*/ `
          <p><strong>標題：</strong> ${summaryData.videoTitle}</p>
          <p><strong>URL：</strong> <a href="${summaryData.videoUrl}" target="_blank">${summaryData.videoUrl}</a></p>
        `;
      } else {
        videoInfo.innerHTML = /*html*/ `<p>未提供影片資訊</p>`;
      }

      // 設置生成時間
      const timestamp = summaryData.timestamp
        ? new Date(summaryData.timestamp).toLocaleString("zh-TW")
        : new Date().toLocaleString("zh-TW");
      document.getElementById("gen-time").textContent = timestamp;
    } catch (error) {
      console.error("解析數據時出錯:", error);
      summaryContent.innerHTML = /*html*/ `<p>處理總結時發生錯誤：${error.message}</p>`;
    }
  }

  // 開始計時
  timerInterval = setInterval(() => {
    seconds++;
    processTimeEl.textContent = seconds;

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      // 處理模式切換通知
      if (message.action === "updateSummary" && message.summary) {
        console.log("收到摘要更新通知:", message.summary);
        showSummaryView(message.summary);
        sendResponse({ success: true });
        return true;
      }
    });
  }, 1000);

  // 加入一個安全的自動跳轉機制，確保各種情況下都能正確切換
  setTimeout(() => {
    console.log("安全備用檢查：5秒後重新檢查");
    // 取得完整存儲資訊
    chrome.storage.local.get(null, function (allData) {
      console.log("安全檢查結果：", allData);
      // 如果有任何總結相關的數據，嘗試顯示
      if (
        allData.summaryReady === true ||
        (allData.currentSummary &&
          Object.keys(allData.currentSummary).length > 0)
      ) {
        showSummaryView(allData.currentSummary);
      }
    });
  }, 5000); // 5 秒後再檢查一次

  // 複製按鈕功能
  document.getElementById("copy-btn").addEventListener("click", function () {
    const summaryText = document
      .getElementById("summary-content")
      .textContent.trim();
    navigator.clipboard
      .writeText(summaryText)
      .then(() => {
        this.textContent = "已複製！";
        setTimeout(() => {
          this.textContent = "複製總結內容";
        }, 2000);
      })
      .catch((err) => {
        console.error("複製失敗:", err);
        this.textContent = "複製失敗";
        setTimeout(() => {
          this.textContent = "複製總結內容";
        }, 2000);
      });
  });


});
