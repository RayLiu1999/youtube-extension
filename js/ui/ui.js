/**
 * YouTube 下載插件 - UI 相關函數
 */

// 確保全局命名空間存在
window.YTExtension = window.YTExtension || {};

// UI 相關函數
window.YTExtension.UI = {
  // 全局變數
  buttonContainer: null,
  buttonIsHidden: false,
  restoreButton: null,
  buttons: {}, // 存儲所有按鈕的對象
  Styles: {},
  Icons: {},
  Buttons: {},

  // 初始化
  initialize: async function () {
    console.log('開始初始化 UI 模組...');
    
    // 初始化樣式模組
    await window.YTExtension.UI.Styles.initialize();
    console.log('樣式模組初始化完成');

    // 初始化圖標模組 - 確保等待圖標載入完成
    await window.YTExtension.UI.Icons.initialize();
    console.log('圖標模組初始化完成');

    // 初始化按鈕管理模組
    await window.YTExtension.UI.Buttons.initialize();
    console.log('按鈕管理模組初始化完成');

    // 初始化對話框模組
    await window.YTExtension.UI.Dialog.initialize();
    console.log('對話框模組初始化完成');
    
    console.log('UI 模組初始化完成');
  },
};
