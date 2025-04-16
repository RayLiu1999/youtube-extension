/**
 * YouTube 下載插件 - 下載功能模組
 */

// 確保全局命名空間存在
window.YTExtension = window.YTExtension || {};

// 下載功能模組
window.YTExtension.Download = {
  // 當前設置
  currentSettings: {
    quality: "highest",
    format: "mp4",
  },
  buttonType: 'download',

  // 獲取按鈕設定 HTML
  getButtonSettingHtml: async function() {
    await this.getSettings();
    return /*html*/ `
    <span style="font-size: 11px; opacity: 0.8; margin-left: 8px; font-weight: normal; background: rgba(0,0,0,0.2); padding: 2px 5px; border-radius: 3px;">
    ${this.createSettingsLabel(this.currentSettings)}
    </span>`;
  },

  // 獲取當前設置
  getSettings: async function () {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ action: "getSettings" }, (response) => {
          // 檢查 runtime.lastError 以處理可能的錯誤
          if (chrome.runtime.lastError) {
            console.warn("獲取設置時發生錯誤:", chrome.runtime.lastError.message);
            console.log("使用默認設置");
            resolve(this.currentSettings); // 使用當前默認設置
            return;
          }
          
          if (response && response.success && response.settings) {
            this.currentSettings = response.settings;
            console.log("獲取當前設置:", this.currentSettings);
          }
          resolve(this.currentSettings);
        });
      } catch (error) {
        console.error("獲取設置時發生異常:", error);
        console.log("使用默認設置");
        resolve(this.currentSettings); // 出現異常時使用默認設置
      }
    });
  },

  // 獲取按鈕元素
  getButton: function (buttonType) {
    return window.YTExtension.UI.Buttons.getButton(buttonType);
  },

  // 創建下載按鈕
  createDownloadButton: async function (buttonType) {
    // 先獲取最新設置
    await this.getSettings();

    // 使用 UI 模組創建按鈕
    window.YTExtension.UI.Buttons.createButton(buttonType, {
      iconName: "download",
      text: "下載影片",
      customHTML: await this.getButtonSettingHtml(),
      customStyles: {
        backgroundColor: "#ff0000",
      },
      onClick: () => {
        // 在點擊按鈕時獲取最新的影片 URL 和標題
        const currentVideoUrl = window.location.href;
        const currentVideoTitle = window.YTExtension.Utils.getCurrentVideoTitle();
        
        window.YTExtension.UI.Dialog.showDialog(
          "確認下載影片",
          /*html*/
          `<p>您確定要下載這個影片嗎？</p>
             <p><strong>標題:</strong> ${currentVideoTitle}</p>
             <p><strong>URL:</strong> ${currentVideoUrl}</p>
             <p>這個過程可能需要一些時間，具體取決於影片長度。</p>`,
          [
            {
              text: "取消",
              primary: false,
              onClick: () => {
                console.log("用戶取消下載");
              },
            },
            {
              text: "確定",
              primary: true,
              onClick: () => {
                console.log("用戶確認下載");
                this.triggerDownload(currentVideoUrl, currentVideoTitle);
              },
            },
          ]
        );
      }
    });
  },

  // 創建設置標籤
  createSettingsLabel: function (settings) {
    const formatNames = {
      mp4: "MP4",
      mp3: "MP3",
    };

    const qualityNames = {
      highest: "最高",
      high: "高",
      medium: "中",
      low: "低",
    };

    const formatText = formatNames[settings.format] || settings.format;
    const qualityText = qualityNames[settings.quality] || settings.quality;

    return `${qualityText}品質 | ${formatText}`;
  },

  // 獲取圖標
  getIcon: function (iconName) {
    return window.YTExtension.UI.Icons.getIconSync(iconName);
  },

  // 確保動畫樣式已添加
  ensureAnimationStyles: function () {
    if (!document.getElementById("download-button-styles")) {
      const styleEl = document.createElement("style");
      styleEl.id = "download-button-styles";
      styleEl.textContent = /*css*/ `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(styleEl);
    }
  },

  // 觸發下載
  triggerDownload: function (videoUrl, videoTitle) {
    // 獲取按鈕元素
    const button = this.getButton(this.buttonType);

    // 確保動畫樣式已添加
    this.ensureAnimationStyles();

    // 更新按鈕為處理中狀態
    window.YTExtension.UI.Buttons.updateButton(this.buttonType, {
      iconName: "loading",
      text: "處理中...",
      customHTML: "",
    });

    // 禁用按鈕
    button.disabled = true;

    // 添加旋轉動畫
    const loadingIcon = button.querySelector(".loading-icon");
    if (loadingIcon) {
      loadingIcon.style.animation = "spin 2s linear infinite";
    }

    // 發送下載請求到 background.js
    chrome.runtime.sendMessage(
      {
        action: "triggerVideoDownload",
        videoUrl: videoUrl,
        quality: this.currentSettings.quality,
        format: this.currentSettings.format,
        title: videoTitle,
      },
      (response) => {
        console.log("下載請求響應:", response);

        // 處理響應
        if (response && response.success) {
          // 更新按鈕為成功狀態
          window.YTExtension.UI.Buttons.updateButton(this.buttonType, {
            iconName: "success",
            text: "成功！",
            customHTML: "",
            customStyles: {
              backgroundColor: "#4CAF50"
            }
          });

          // 顯示成功訊息
          window.YTExtension.UI.Dialog.showDialog(
            "下載狀態",
            /*html*/
            `<p>下載請求已成功發送！</p>
           <p>狀態訊息: ${response.message}</p>`,
            [
              {
                text: "確定",
                primary: true,
                onClick: () => {},
              },
            ]
          );
        } else {
          // 更新按鈕為失敗狀態
          window.YTExtension.UI.Buttons.updateButton(this.buttonType, {
            iconName: "error",
            text: "失敗",
            customHTML: "",
            customStyles: {
              backgroundColor: "#f44336"
            }
          });

          // 顯示錯誤訊息
          window.YTExtension.UI.Dialog.showDialog(
            "下載失敗",
            /*html*/
            `<p>下載請求失敗！</p>
           <p>錯誤信息: ${
             response ? response.error || "未知錯誤" : "未知錯誤"
           }</p>`,
            [
              {
                text: "確定",
                primary: true,
                onClick: () => {},
              },
            ]
          );
        }

        // 3 秒後恢復按鈕
        setTimeout(async () => {
          // 恢復原始按鈕狀態
          window.YTExtension.UI.Buttons.updateButton(this.buttonType, {
            iconName: "download",
            text: "下載影片",
            customHTML: await this.getButtonSettingHtml(),
            customStyles: {
              backgroundColor: "#ff0000"
            }
          });
          
          // 啟用按鈕
          button.disabled = false;
        }, 3000);
      }
    );
  },

  // 更新下載按鈕設定
  updateDownloadButtonSettings: async function () {
    await this.getSettings();
    window.YTExtension.UI.Buttons.updateButton(this.buttonType, {
      iconName: "download",
      text: "下載影片",
      customHTML: await this.getButtonSettingHtml(),
    });
  },
};
