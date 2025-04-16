/**
 * YouTube 下載插件 - 按鈕管理模組
 */

// 確保全局命名空間存在
window.YTExtension = window.YTExtension || {};
window.YTExtension.UI = window.YTExtension.UI || {};

// 按鈕管理模組
window.YTExtension.UI.Buttons = {
  // 全局變數
  buttonContainer: null,
  buttonIsHidden: false,
  buttons: {}, // 存儲所有按鈕的對象
  buttonTypes: {},
  buttonIds: {}, // 存儲按鈕ID的映射，方便引用
    // 初始化
  initialize: async function() {
    // 清除所有現有按鈕
    this.removeAllButtons();
    
    // 創建按鈕容器
    this.createButtonContainer();
    
    // 按鈕狀態
    const settings = await chrome.storage.local.get("youtube_button_hidden");
    this.buttonIsHidden = settings.youtube_button_hidden === true;
    
    // 初始化按鈕類型註冊表
    this.buttonTypes = {
      restore: {
        id: 'youtube-restore-button',
        module: 'UI.Buttons',
        createMethod: 'createRestoreButton',
        autoCreate: false,
        isFeatureButton: false
      },
      download: {
        id: 'youtube-download-button',
        module: 'Download',
        createMethod: 'createDownloadButton',
        isFeatureButton: true,  // 標記為功能按鈕
        autoCreate: true
      },
      summary: {
        id: 'youtube-summary-button',
        module: 'Summary',
        createMethod: 'createSummarizeVideoButton',
        isFeatureButton: true,  // 標記為功能按鈕
        autoCreate: true
      },
      check_summary: {
        id: 'youtube-check-summary-button',
        module: 'Summary',
        createMethod: 'createCheckSummaryButton',
        isFeatureButton: true,  // 標記為功能按鈕
        autoCreate: true
      },
      // audioCapture: {
      //   id: 'youtube-audio-capture-button',
      //   module: 'AudioCapture',
      //   createMethod: 'createUI'
      // }
    };
    
    // 初始化按鈕ID映射
    for (const [type, config] of Object.entries(this.buttonTypes)) {
      this.buttonIds[type] = config.id;
    }

    // 根據按鈕狀態決定顯示哪些按鈕
    if (this.buttonIsHidden) {
      // 如果按鈕已被隱藏，則只顯示還原按鈕
      await this.createRestoreButton();
    } else {
      // 如果按鈕未被隱藏，則創建自動創建的按鈕
      await this.createAllButtons();
    }

    // 初始化全螢幕觀察者
    this.initFullscreenObserver();
    
    console.log('按鈕管理模組初始化完成');
    return true;
  },
  
  // 創建按鈕容器
  createButtonContainer: function () {
    // 移除現有的按鈕容器（如果存在）
    const existingContainer = document.getElementById('youtube-button-container');
    if (existingContainer) {
      existingContainer.remove();
    }
    
    const container = document.createElement("div");
    container.id = 'youtube-button-container';
    container.className = "yt-extension-button-container";

    // 添加到頁面
    document.body.appendChild(container);
    this.buttonContainer = container;
  },

  // 獲取按鈕ID
  getButtonId: function(type) {
    return this.buttonIds[type] || null;
  },
  
  // 獲取按鈕元素
  getButton: function(type) {
    return this.buttons[type] || null;
  },
  
  
  // 創建按鈕的通用方法
  createButton: function (buttonType, options) {
    const {
      iconName, // SVG 圖標
      text, // 按鈕文字
      customHTML, // 自定義 HTML
      onClick, // 左鍵點擊事件處理函數
      onRightClick, // 右鍵點擊事件處理函數
      onMiddleClick, // 中鍵點擊事件處理函數
      customStyles, // 自定義樣式
    } = options;

    // 獲取按鈕 ID
    const id = this.getButtonId(buttonType);
    if (!id) {
      console.error(`未找到按鈕類型: ${buttonType}`);
      return null;
    }

    // 創建按鈕
    const button = document.createElement("button");
    button.id = id;
    button.className = "yt-extension-button";

    // 設置內容
    button.innerHTML = /*html*/ `
        ${iconName ? window.YTExtension.UI.Icons.getIconSync(iconName) : ''}
        <span>${text}</span>
        ${customHTML || ''}
      `;

    // 應用基本樣式
    this.applyButtonStyles(button, customStyles);

    // 添加左鍵點擊事件
    if (onClick) {
      button.addEventListener("click", onClick);
    }
    
    // 添加右鍵點擊事件
    if (onRightClick) {
      button.addEventListener("contextmenu", (event) => {
        event.preventDefault(); // 防止預設右鍵選單
        onRightClick(event);
      });
    }
    
    // 添加中鍵點擊事件
    if (onMiddleClick) {
      button.addEventListener("auxclick", (event) => {
        if (event.button === 1) { // 中鍵點擊
          event.preventDefault();
          onMiddleClick(event);
        }
      });
    } else {
      button.addEventListener("auxclick", (event) => {
        event.preventDefault();
        console.log("中鍵點擊觸發，隱藏按鈕");
        this.hideAllButtons();
      });
    }

    // 添加到容器
    this.buttonContainer.appendChild(button);

    // 保存按鈕引用
    this.buttons[buttonType] = button;

    return button;
  },

  // 應用按鈕樣式
  applyButtonStyles: function (button, customStyles) {
    if (customStyles) {
      Object.assign(button.style, customStyles);
    }
  },

  // 更新按鈕
  updateButton: function (buttonType, options) {
    const {
      iconName, // SVG 圖標
      text, // 按鈕文字
      customHTML, // 自定義 HTML
      onClick, // 左鍵點擊事件處理函數
      onRightClick, // 右鍵點擊事件處理函數
      onMiddleClick, // 中鍵點擊事件處理函數
      customStyles, // 自定義樣式
    } = options;

    // 獲取按鈕
    const button = this.getButton(buttonType);
    if (!button) {
      console.error(`未找到按鈕: ${buttonType}`);
      return null;
    }

    // 應用基本樣式
    this.applyButtonStyles(button, customStyles);
    
    // 設置內容
    button.innerHTML = /*html*/ `
        ${iconName ? window.YTExtension.UI.Icons.getIconSync(iconName) : ''}
        <span>${text}</span>
        ${customHTML || ''}
      `;

    // 添加左鍵點擊事件
    if (onClick) {
      button.addEventListener("click", onClick);
    }
    
    // 添加右鍵點擊事件
    if (onRightClick) {
      button.addEventListener("contextmenu", (event) => {
        event.preventDefault(); // 防止預設右鍵選單
        onRightClick(event);
      });
    }
    
    // 添加中鍵點擊事件
    if (onMiddleClick) {
      button.addEventListener("auxclick", (event) => {
        if (event.button === 1) { // 中鍵點擊
          event.preventDefault();
          onMiddleClick(event);
        }
      });
    } else {
      button.addEventListener("auxclick", (event) => {
        event.preventDefault();
        console.log("中鍵點擊觸發，隱藏按鈕");
        this.hideAllButtons();
      });
    }

    // 保存按鈕引用
    this.buttons[buttonType] = button;

    return button;
  },

  // 移除按鈕
  removeButton: function (buttonType) {
    const button = this.getButton(buttonType);
    if (button && button.parentNode) {
      button.parentNode.removeChild(button);
      delete this.buttons[buttonType];
    }
  },

  // 設定按鈕狀態
  setButtonHiddenState: async function (state) {
    // 更新按鈕狀態
    this.buttonIsHidden = state;

    // 保存到本地
    await chrome.storage.local.set({ youtube_button_hidden: state });
  },

  // 隱藏按鈕
  hideAllButtons: async function () {
    // 設置隱藏狀態
    await this.setButtonHiddenState(true);

    // 移除所有功能按鈕
    Object.keys(this.buttonTypes).forEach(type => {
      const buttonConfig = this.buttonTypes[type];
      
      // 只移除功能按鈕
      if (buttonConfig && buttonConfig.isFeatureButton) {
        this.removeButton(type);
      }
    });

    // 顯示還原按鈕
    this.createRestoreButton();

    console.log("功能按鈕已移除，還原按鈕已顯示");
  },

  // 顯示所有按鈕
  showAllButtons: async function() {
    // 設置顯示狀態
    await this.setButtonHiddenState(false);

    // 移除還原按鈕
    const restoreButton = this.getButton('restore');
    if (restoreButton) {
      restoreButton.remove();
      delete this.buttons['restore'];
    }

    // 重新創建所有自動創建的按鈕
    await this.createAllButtons();
    
    console.log("功能按鈕已重新創建");
  },
  
  // 創建按鈕的統一方法
  createButtonByType: async function(type) {
    // 檢查按鈕類型是否存在
    const buttonType = this.buttonTypes[type];
    if (!buttonType) {
      console.error(`未註冊的按鈕類型: ${type}`);
      return null;
    }

    // 只處理自動創建的按鈕
    if (!buttonType.autoCreate) {
      return null;
    }
    
    // 如果按鈕已存在，先移除它
    if (this.getButton(type)) {
      this.removeButton(type);
    }

    // 使用各模組的方法創建按鈕
    // 切割.區分不同模組
    let moduleInstance;
    if (buttonType.module.includes('.')) {
      let modules = buttonType.module.split('.');
      let current = window.YTExtension;
      for (let i = 0; i < modules.length; i++) {
        current[modules[i]] = current[modules[i]] || {};
        current = current[modules[i]];
      }
      moduleInstance = current;
    } else {
      moduleInstance = window.YTExtension[buttonType.module];
    }
    
    // 將按鈕類型傳遞給模組的創建方法，這樣模組可以使用它來引用按鈕
    const button = await moduleInstance[buttonType.createMethod](type);
    
    // 確保模組可以訪問自己的按鈕
    if (moduleInstance) {
      moduleInstance.buttonType = type;
    }
    
    console.log(`已創建 ${type} 按鈕`);
    return button;
  },
  
  // 創建所有註冊的按鈕
  createAllButtons: async function() {
    // 創建所有註冊的按鈕
    for (const type of Object.keys(this.buttonTypes)) {
      await this.createButtonByType(type);
    }
    
    console.log('已創建所有按鈕');
  },

  createRestoreButton: async function() {
    const id = this.getButtonId('restore');
    // 移除現有的還原按鈕（如果存在）
    const existingRestoreButton = document.getElementById(id);
    if (existingRestoreButton) {
      existingRestoreButton.remove();
    }
    
    // 創建小按鈕來還原按鈕
    const restoreButton = document.createElement('div');
    restoreButton.id = id;
    restoreButton.innerHTML = await window.YTExtension.UI.Icons.getIcon('restore');
    
    // 添加懸停效果
    restoreButton.addEventListener('mouseenter', () => {
      restoreButton.style.opacity = '1';
      restoreButton.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
      restoreButton.style.transform = 'scale(1.1)';
    });
    
    restoreButton.addEventListener('mouseleave', () => {
      restoreButton.style.opacity = '0.7';
      restoreButton.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
      restoreButton.style.transform = 'scale(1)';
    });
    
    // 添加點擊事件來還原按鈕
    restoreButton.addEventListener('click', async () => {
      // 隱藏還原按鈕
      restoreButton.remove();
      
      // 顯示所有按鈕
      await this.showAllButtons();
    });
    
    // 添加到頁面
    console.log('已創建還原按鈕');
    document.body.appendChild(restoreButton);

    this.buttons['restore'] = restoreButton;
    
    return restoreButton;
  },

  // 移除所有按鈕
  removeAllButtons: function () {
    // 移除所有按鈕
    Object.keys(this.buttonTypes).forEach(type => {
      this.removeButton(type);
    });
    
    // 清空按鈕容器
    if (this.buttonContainer) {
      this.buttonContainer.innerHTML = '';
    }
  },
  
  // 監視全螢幕狀態變化
  initFullscreenObserver: function () {
    document.addEventListener(
      "fullscreenchange",
      this.handleFullscreenChange.bind(this)
    );
    document.addEventListener(
      "webkitfullscreenchange",
      this.handleFullscreenChange.bind(this)
    );
    document.addEventListener(
      "mozfullscreenchange",
      this.handleFullscreenChange.bind(this)
    );
    document.addEventListener(
      "MSFullscreenChange",
      this.handleFullscreenChange.bind(this)
    );
  },
  
  // 處理全螢幕狀態變化
  handleFullscreenChange: function () {
    const isFullscreen =
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement;

    // 如果進入全螢幕模式，隱藏按鈕
    if (isFullscreen) {
      // 隱藏所有按鈕
      Object.keys(this.buttonTypes).forEach(type => {
        const button = this.getButton(type);
        if (button) {
          button.style.display = "none";
        }
      });
    }
    // 如果退出全螢幕模式，顯示按鈕
    else {
      // 顯示所有按鈕
      Object.keys(this.buttonTypes).forEach(type => {
        const button = this.getButton(type);
        if (button) {
          button.style.display = "flex";
        }
      });
    }
  }
};
