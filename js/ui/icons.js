/**
 * YouTube 下載插件 - 圖標模組
 */

// 確保全局命名空間存在
window.YTExtension = window.YTExtension || {};
window.YTExtension.UI = window.YTExtension.UI || {};

// 圖標模組
window.YTExtension.UI.Icons = {
  // 緩存已載入的圖標
  cachedIcons: {},
  
  // 初始化
  initialize: async function() {
    // 預載入常用圖標
    await this.preloadIcons(['download', 'summary', 'audio-capture', 'restore', 'loading', 'success', 'error']);
    console.log('圖標預載入完成');
  },
  
  // 預載入圖標
  preloadIcons: async function(iconNames) {
    // 使用 Promise.all 同時載入所有圖標
    await Promise.all(iconNames.map(name => this.loadIcon(name)));
  },
  
  // 載入圖標
  loadIcon: async function(iconName) {
    // 如果已經緩存，直接返回
    if (this.cachedIcons[iconName]) {
      return this.cachedIcons[iconName];
    }
    
    try {
      // 構建圖標 URL
      const iconUrl = chrome.runtime.getURL(`assets/icons/${iconName}.svg`);
      
      // 獲取圖標內容
      const response = await fetch(iconUrl);
      if (!response.ok) {
        throw new Error(`無法載入圖標: ${iconName}`);
      }
      
      // 讀取 SVG 內容
      const svgContent = await response.text();
      
      // 緩存圖標
      this.cachedIcons[iconName] = svgContent;
      
      return svgContent;
    } catch (error) {
      console.error(`載入圖標時出錯: ${iconName}`, error);
      return '';
    }
  },
  
  // 獲取圖標
  getIcon: async function(iconName) {
    return await this.loadIcon(iconName);
  },
  
  // 同步獲取圖標（如果已預載入）
  getIconSync: function(iconName) {
    // 如果圖標不存在，則嘗試立即載入
    if (!this.cachedIcons[iconName]) {
      console.warn(`圖標 ${iconName} 尚未載入，嘗試立即載入`);
      // 使用預設圖標作為備用
      this.loadIcon(iconName);
      // 如果是下載圖標，使用內建的備用圖標
      if (iconName === 'download') {
        return '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>';
      }
    }
    return this.cachedIcons[iconName] || '';
  }
};
