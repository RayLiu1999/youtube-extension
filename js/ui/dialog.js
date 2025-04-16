/**
 * YouTube 下載插件 - 對話框模組
 */

// 確保全局命名空間存在
window.YTExtension = window.YTExtension || {};
window.YTExtension.UI = window.YTExtension.UI || {};

// 對話框模組
window.YTExtension.UI.Dialog = {
  // 關閉所有對話框
  closeAllDialogs: function() {
    // 移除所有背景遮罩
    const backdrops = document.querySelectorAll(".yt-extension-dialog-backdrop");
    backdrops.forEach(backdrop => {
      if (backdrop && backdrop.parentNode) {
        backdrop.parentNode.removeChild(backdrop);
      }
    });

    // 移除所有對話框
    const dialogs = document.querySelectorAll(".yt-extension-dialog");
    dialogs.forEach(dialog => {
      if (dialog && dialog.parentNode) {
        dialog.parentNode.removeChild(dialog);
      }
    });
    
    console.log('已關閉所有對話框');
  },
  
  initialize: async function () {
    // 關閉所有對話框
    this.closeAllDialogs();
  },

  // 顯示對話框
  showDialog: function (title, content, buttons) {
    // 創建背景遮罩
    const backdrop = document.createElement("div");
    backdrop.className = "yt-extension-dialog-backdrop";
    document.body.appendChild(backdrop);

    // 創建對話框
    const dialog = document.createElement("div");
    dialog.className = "yt-extension-dialog";

    // 添加標題
    const titleElement = document.createElement("h2");
    titleElement.textContent = title;
    titleElement.style.margin = "0 0 20px 0"; // 增加底部邊距
    titleElement.style.borderBottom = "2px solid #eee"; // 增加分隔線粗度
    titleElement.style.paddingBottom = "15px"; // 增加底部邊距
    titleElement.style.fontSize = "24px"; // 增加標題字體大小
    titleElement.style.fontWeight = "bold"; // 加粗標題
    dialog.appendChild(titleElement);

    // 添加內容
    const contentElement = document.createElement("div");
    contentElement.style.fontSize = "16px"; // 增加內容字體大小
    contentElement.style.lineHeight = "1.6"; // 增加行高
    contentElement.style.color = "#333"; // 增加字體顏色對比度

    if (typeof content === "string") {
      contentElement.innerHTML = content;
    } else {
      contentElement.appendChild(content);
    }

    // 增大內容中的段落文字
    const paragraphs = contentElement.querySelectorAll("p");
    paragraphs.forEach((p) => {
      p.style.fontSize = "16px";
      p.style.margin = "12px 0";
      p.style.lineHeight = "1.6";
    });

    dialog.appendChild(contentElement);

    // 添加按鈕容器
    const buttonContainer = document.createElement("div");
    buttonContainer.style.marginTop = "25px"; // 增加頂部邊距
    buttonContainer.style.textAlign = "right";
    buttonContainer.style.display = "flex";
    buttonContainer.style.justifyContent = "flex-end";
    buttonContainer.style.gap = "15px"; // 增加按鈕間距

    // 添加按鈕
    if (buttons && buttons.length) {
      buttons.forEach((button) => {
        const buttonElement = document.createElement("button");
        buttonElement.textContent = button.text;
        buttonElement.style.padding = "10px 20px"; // 增加按鈕內邊距
        buttonElement.style.border = "none";
        buttonElement.style.borderRadius = "5px";
        buttonElement.style.cursor = "pointer";
        buttonElement.style.fontSize = "16px"; // 增加按鈕字體大小
        buttonElement.style.fontWeight = "bold"; // 加粗按鈕文字

        if (button.primary) {
          buttonElement.style.backgroundColor = "#ff0000";
          buttonElement.style.color = "#fff";
        } else {
          buttonElement.style.backgroundColor = "#eee";
          buttonElement.style.color = "#333";
        }

        // 添加懸停效果
        buttonElement.addEventListener("mouseover", () => {
          if (button.primary) {
            buttonElement.style.backgroundColor = "#cc0000";
          } else {
            buttonElement.style.backgroundColor = "#ddd";
          }
        });

        buttonElement.addEventListener("mouseout", () => {
          if (button.primary) {
            buttonElement.style.backgroundColor = "#ff0000";
          } else {
            buttonElement.style.backgroundColor = "#eee";
          }
        });

        buttonElement.addEventListener("click", () => {
          // 關閉對話框
          document.body.removeChild(backdrop);
          document.body.removeChild(dialog);

          // 執行回調
          if (button.onClick) {
            button.onClick();
          }
        });

        buttonContainer.appendChild(buttonElement);
      });
    }

    dialog.appendChild(buttonContainer);
    document.body.appendChild(dialog);

    // 點擊背景關閉對話框
    backdrop.addEventListener("click", () => {
      document.body.removeChild(backdrop);
      document.body.removeChild(dialog);
    });

    // 添加 Enter 鍵確認功能
    const handleKeyDown = (event) => {
      // 如果按下 Enter 鍵
      if (event.key === "Enter") {
        // 找到主要按鈕（如果存在）
        const primaryButton = buttons.find((btn) => btn.primary);
        if (primaryButton) {
          // 關閉對話框
          document.body.removeChild(backdrop);
          document.body.removeChild(dialog);

          // 移除事件監聽器
          document.removeEventListener("keydown", handleKeyDown);

          // 執行主要按鈕的回調
          if (primaryButton.onClick) {
            primaryButton.onClick();
          }
        }
      }
    };

    // 添加鍵盤事件監聽器
    document.addEventListener("keydown", handleKeyDown);

    return dialog;
  }
};
