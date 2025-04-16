/**
 * YouTube 下載插件 - 總結管理模組
 * 負責管理總結數據，使用記憶體而非 storage
 */

// 確保全局命名空間存在
window.YTExtension = window.YTExtension || {};

// 總結管理模組
window.YTExtension.Summary = {
  currentSummaryData: {
    videoTitle: null,
    videoUrl: null,
    summary: null,
    generated_time: null
  },
  currentVideoId: null,
  hasSummary: false,

  // 初始化
  initialize: async function () {
    console.log("初始化總結管理模組...");

    // 初始化狀態
    this.hasSummary = false;
    this.currentSummaryData = {
      videoTitle: null,
      videoUrl: null,
      summary: null,
      generated_time: null
    };

    // 獲取當前視頻 ID
    this.currentVideoId = window.YTExtension.Utils.getCurrentVideoId();
    
    // 檢查視頻是否有總結
    await this.checkVideoSummary();

    console.log("總結管理模組初始化完成");
  },

  // 檢查視頻是否有總結
  checkVideoSummary: function () {
    return new Promise((resolve) => {
      // 如果沒有視頻 ID，直接返回
      if (!this.currentVideoId) {
        console.log("無法檢查總結：沒有視頻 ID");
        resolve(false);
        return;
      }

      console.log("檢查視頻是否有總結:", this.currentVideoId);

      // 發送請求到 background.js
      chrome.runtime.sendMessage(
        {
          action: "checkVideoSummary",
          videoUrl: window.location.href,
          videoId: this.currentVideoId,
        },
        (response) => {
          console.log("初始響應:", response);
          
          if (response.success) {
            // 更新總結狀態
            this.hasSummary = true;

            // 如果有總結，保存總結數據到記憶體中
            this.currentSummaryData = {
              videoTitle: window.YTExtension.Utils.getCurrentVideoTitle(),
              videoUrl: window.location.href,
              summary: response.data.content,
              generated_time: response.data.generated_time
            };

            resolve(true);
          }
          else {
            this.hasSummary = false;
            resolve(false);
          }
        }
      );
    });
  },

  // 創建總結影片按鈕
  createSummarizeVideoButton: function (buttonType) {
    // 如果已經有總結，則不創建按鈕
    if (this.hasSummary) {
      return;
    }

    // 使用 UI 模組創建按鈕
    window.YTExtension.UI.Buttons.createButton(buttonType, {
      iconName: "summary", // 使用文檔圖標
      text: "總結影片",
      customStyles: {
        backgroundColor: "#2196F3", // 藍色背景
        top: "120px", // 與查看總結按鈕保持一定距離
        right: "20px",
      },
      onClick: () => {
        // 顯示確認對話框
        window.YTExtension.UI.Dialog.showDialog(
          "確認總結影片",
          /*html*/
          `<p>您確定要總結這個影片嗎？</p>
          <p>這個過程可能需要一些時間，具體取決於影片長度。</p>`,
          [
            {
              text: "取消",
              primary: false,
              onClick: () => {
                console.log("用戶取消總結");
              },
            },
            {
              text: "總結",
              primary: true,
              onClick: () => {
                console.log("用戶確認總結");
                this.triggerSummarize();
              },
            },
          ]
        );
      }
    });

    // 檢查是否處於全螢幕模式
    const isFullscreen =
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement;

    if (isFullscreen) {
      const button = this.getButton();
      if (button) {
        button.style.display = "none";
      }
    }

    return this.getButton();
  },

  // 獲取按鈕元素
  getButton: function (buttonType) {
    return window.YTExtension.UI.Buttons.getButton(buttonType);
  },

  // 創建查看總結按鈕
  createCheckSummaryButton: function (buttonType) {
    // 如果沒有總結，則不創建按鈕
    if (!this.hasSummary) {
      return;
    }

    // 使用 UI 模組創建按鈕
    window.YTExtension.UI.Buttons.createButton(buttonType, {
      iconName: "summary", // 使用文檔圖標
      text: "查看總結",
      customStyles: {
        backgroundColor: "#4CAF50", // 綠色背景
        top: "120px",
        right: "20px",
      },
      onClick: () => {
        // 顯示總結對話框
        this.showSummaryDialog();
      }
    });

    // 檢查是否處於全螢幕模式
    const isFullscreen =
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement;

    if (isFullscreen) {
      const button = this.getButton();
      if (button) {
        button.style.display = "none";
      }
    }

    return this.getButton();
  },

  // 觸發總結
  triggerSummarize: async function () {
    // 發送總結請求到 background.js
    chrome.runtime.sendMessage(
      {
        action: "summarizeVideo",
        videoUrl: window.location.href,
        videoTitle: window.YTExtension.Utils.getCurrentVideoTitle(),
      },
      (response) => {
        console.log("總結請求響應:", response);

        // 處理響應
        if (response && response.success) {
          // 顯示成功訊息
          window.YTExtension.UI.Dialog.showDialog(
            "總結請求已發送",
            /*html*/
            `<p>總結請求已完成！</p>
             <p>完成後，您可以點擊「查看總結」按鈕查看結果。</p>`,
            [
              {
                text: "確定",
                primary: true,
                onClick: async () => {
                  // 初始化模組
                  await window.YTExtension.Core.initModules();
                },
              },
            ]
          );
        } else {
          // 顯示錯誤訊息
          window.YTExtension.UI.Dialog.showDialog(
            "總結失敗",
            /*html*/
            `<p>總結請求失敗！</p>
             <p>錯誤信息: ${
               response ? response.error || "未知錯誤" : "未知錯誤"
             }</p>
             <p>請檢查您的網絡連接和設置。</p>`,
            [
              {
                text: "確定",
                primary: true,
                onClick: () => {},
              },
            ]
          );
        }
      }
    );
  },

  // 顯示總結對話框
  showSummaryDialog: function () {
    if (!this.currentSummaryData) {
      console.error('無總結數據可顯示');
      return;
    }

    // 創建總結內容元素
    const contentElement = document.createElement("div");

    // 添加總結內容
    if (this.currentSummaryData.summary) {
      // 將內容分段
      const paragraphs = this.currentSummaryData.summary
        .split("\n")
        .filter((p) => p.trim() !== "");

      // 添加每個段落
      paragraphs.forEach((paragraph) => {
        const p = document.createElement("p");
        p.textContent = paragraph;
        contentElement.appendChild(p);
      });
    } else {
      const p = document.createElement("p");
      p.textContent = "無法解析總結內容。";
      contentElement.appendChild(p);
    }

    // 添加影片信息
    const infoElement = document.createElement("div");
    infoElement.style.marginTop = "20px";
    infoElement.style.padding = "10px";
    infoElement.style.backgroundColor = "#f5f5f5";
    infoElement.style.borderRadius = "5px";

    if (
      this.currentSummaryData.videoTitle &&
      this.currentSummaryData.videoUrl
    ) {
      infoElement.innerHTML = /*html*/ `
          <p><strong>標題：</strong> ${this.currentSummaryData.videoTitle}</p>
          <p><strong>URL：</strong> <a href="${this.currentSummaryData.videoUrl}" target="_blank">${this.currentSummaryData.videoUrl}</a></p>
        `;
    } else {
      infoElement.innerHTML = "<p>未提供影片資訊</p>";
    }

    contentElement.appendChild(infoElement);

    // 添加時間戳
    const timestampElement = document.createElement("div");
    timestampElement.style.marginTop = "10px";
    timestampElement.style.fontSize = "12px";
    timestampElement.style.color = "#666";

    const timestamp = this.currentSummaryData.generated_time
      ? new Date(this.currentSummaryData.generated_time).toLocaleString("zh-TW")
      : new Date().toLocaleString("zh-TW");

    timestampElement.textContent = `生成時間: ${timestamp}`;
    contentElement.appendChild(timestampElement);

    // 添加複製按鈕
    const copyButton = document.createElement("button");
    copyButton.textContent = "複製總結內容";
    copyButton.style.marginTop = "15px";
    copyButton.style.padding = "8px 15px";
    copyButton.style.backgroundColor = "#4CAF50";
    copyButton.style.color = "#fff";
    copyButton.style.border = "none";
    copyButton.style.borderRadius = "5px";
    copyButton.style.cursor = "pointer";

    copyButton.addEventListener("click", () => {
      const summaryText = this.currentSummaryData.summary;
      navigator.clipboard
        .writeText(summaryText)
        .then(() => {
          copyButton.textContent = "已複製！";
          setTimeout(() => {
            copyButton.textContent = "複製總結內容";
          }, 2000);
        })
        .catch((err) => {
          console.error("複製失敗:", err);
          copyButton.textContent = "複製失敗";
          setTimeout(() => {
            copyButton.textContent = "複製總結內容";
          }, 2000);
        });
    });

    contentElement.appendChild(copyButton);

    // 顯示對話框
    window.YTExtension.UI.Dialog.showDialog("影片總結", contentElement, [
      {
        text: "關閉",
        primary: true,
        onClick: () => {},
      },
    ]);
  },
};