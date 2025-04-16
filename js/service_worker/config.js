/**
 * YouTube 下載插件 - 配置模組
 * 負責管理所有配置項，包括系統配置和用戶設置
 * 使用 ES6 模組格式
 */

// 配置文件格式
const DEFAULT_CONFIG = {
  VIDEO_SETTINGS: {
    quality: 'highest',  // 默認品質
    format: 'mp4'       // 默認格式
  },
  SERVICE_URLS: {
    download_and_summary: {
      online: '',        // 線上模式下載和總結 webhook URL
      local: ''          // 本地模式下載和總結 webhook URL
    },
    file_url: {
      online: '',        // 線上模式檔案 URL
      local: ''          // 本地模式檔案 URL
    },
    get_summary: {
      online: '',        // 線上模式摘要 webhook URL
      local: ''          // 本地模式摘要 webhook URL
    }
  },
  BEARER_TOKEN: '',      // Bearer 令牌
  IS_ONLINE_MODE: true   // 是否使用線上模式
};

// 默認使用者設定
const DEFAULT_USER_SETTINGS = {
  video: {
    quality: 'highest',     // 影片品質，默認使用配置文件中的設置
    format: 'mp4'           // 影片格式，默認使用配置文件中的設置
  },
  apiKey: '',             // OpenAI API Key，從用戶設置加載
  isOnlineMode: DEFAULT_CONFIG.IS_ONLINE_MODE,      // 是否使用線上模式，默認為 true
  download_and_summary_url: '',
  get_summary_url: '',
  file_url: ''
};

// 品質選項
const QUALITY_OPTIONS = [
  { id: 'highest', title: '最高品質' }, 
  { id: 'high', title: '高品質' }, 
  { id: 'medium', title: '中品質' }, 
  { id: 'low', title: '低品質' }
];

// 格式選項
const FORMAT_OPTIONS = [
  { id: 'mp4', title: 'MP4 (影片)' }, 
  { id: 'mp3', title: 'MP3 (只有音訊)' }
];

// 配置模組
class ConfigManager {
    #CONFIG;
    #QUALITY_OPTIONS;
    #FORMAT_OPTIONS;
    #userSettings;
    #initialized;

  constructor() {
    this.#CONFIG = { ...DEFAULT_CONFIG };
    this.#QUALITY_OPTIONS = QUALITY_OPTIONS;
    this.#FORMAT_OPTIONS = FORMAT_OPTIONS;
    this.#userSettings = { ...DEFAULT_USER_SETTINGS };
    this.#initialized = false;
  }

  // 初始化配置
  async initialize() {
    console.log('初始化配置模組...');
    
    if (this.#initialized) {
      return;
    }
    
    // 先從 chrome.storage.local 加載配置
    await this.loadConfigFromStorage();

    // 複寫配置
    await this.loadConfigFromFile();
    
    // 載入用戶設置
    await this.loadSettings();
    
    this.#initialized = true;
    console.log('配置模組初始化完成');
  }

  // 從 chrome.storage.local 加載配置
  async loadConfigFromStorage() {
    try {
      const result = await chrome.storage.local.get(['CONFIG']);
      if (result.CONFIG) {
        this.#CONFIG = result.CONFIG;
        console.log('從儲存空間載入系統配置成功');
        return;
      }
      return;
    } catch (error) {
      console.error('從儲存空間載入系統配置失敗:', error);
      return;
    }
  }

  // 將配置保存到 chrome.storage.local
  async saveConfigToStorage() {
    try {
      await chrome.storage.local.set({ CONFIG: this.#CONFIG });
      console.log('系統配置已保存到儲存空間');
      return;
    } catch (error) {
      console.error('保存系統配置到儲存空間失敗:', error);
      return;
    }
  }

  // 從配置文件加載配置
  async loadConfigFromFile() {
    try {
      const response = await fetch('/config/config.json');
      const data = await response.json();
      
      // 覆寫配置
      this.#CONFIG = { ...this.#CONFIG, ...data };

      // 覆寫用戶設置
      this.#userSettings.video = { ...data.VIDEO_SETTINGS };
      this.#userSettings.isOnlineMode = data.IS_ONLINE_MODE;

      console.log('配置檔案載入成功');
      
      // 保存到儲存空間
      await this.saveConfigToStorage();

      return;
    } catch (error) {
      console.error('載入配置檔案失敗:', error);
      return;
    }
  }

  // 更新服務 URL 根據當前模式
  updateServiceUrl() {
    // 更新下載和總結的服務 URL
    this.#userSettings.download_and_summary_url = this.#userSettings.isOnlineMode ? 
      this.#CONFIG.SERVICE_URLS.download_and_summary.online : this.#CONFIG.SERVICE_URLS.download_and_summary.local;

    // 更新下載的服務 URL
    this.#userSettings.file_url = this.#userSettings.isOnlineMode ? 
      this.#CONFIG.SERVICE_URLS.file_url.online : this.#CONFIG.SERVICE_URLS.file_url.local;
    
    // 更新摘要的服務 URL
    this.#userSettings.get_summary_url = this.#userSettings.isOnlineMode ? 
      this.#CONFIG.SERVICE_URLS.get_summary.online : this.#CONFIG.SERVICE_URLS.get_summary.local;
    
    return;
  }

  // 從 Chrome 儲存空間載入設定
  async loadSettings() {
    try {
      const items = await chrome.storage.local.get(['userSettings']);
      
      // 如果已有用戶設置，則使用它
      if (items.userSettings) {
        this.#userSettings = { ...this.#userSettings, ...items.userSettings };
        console.log('從儲存空間載入用戶設置成功');
      } else {
        // 否則使用系統配置中的默認值
        this.#userSettings.video = { ...this.#CONFIG.VIDEO_SETTINGS };
        this.#userSettings.isOnlineMode = this.#CONFIG.IS_ONLINE_MODE;
      }
      
      // 根據模式更新服務 URL
      this.updateServiceUrl();
      
      // 保存用戶設置到儲存空間
      await this.saveUserSettings(this.#userSettings);

      return;
    } catch (error) {
      console.error('載入設定失敗:', error);
      return;
    }
  }

  // 保存使用者設定到 Chrome 儲存空間
  async saveUserSettings(settings = {}) {
    try {
      // 保存完整的用戶設置
      await chrome.storage.local.set({ userSettings: settings });
      console.log('用戶設置已保存到儲存空間');
      
      return;
    } catch (error) {
      console.error('保存設定失敗:', error);
      return;
    }
  }

  // 獲取使用者設定
  getUserSettings() {
    return { ...this.#userSettings };
  }

  // 修改使用者設定
  async updateUserSettings(settings) {
    // 更新當前設定
    if (settings.apiKey !== undefined) {
      this.#userSettings.apiKey = settings.apiKey;
    }
    
    if (settings.isOnlineMode !== undefined) {
      this.#userSettings.isOnlineMode = settings.isOnlineMode === true;
      // 更新服務 URL
      this.updateServiceUrl();
    }
    
    if (settings.quality !== undefined) {
      this.#userSettings.video.quality = settings.quality;
    }
    
    if (settings.format !== undefined) {
      this.#userSettings.video.format = settings.format;
    }

    await this.saveUserSettings(this.#userSettings);
  }
  
  // 獲取系統配置
  getConfig() {
    return { ...this.#CONFIG };
  }

  // 獲取品質選項
  getQualityOptions() {
    return [...this.#QUALITY_OPTIONS];
  }

  // 獲取格式選項
  getFormatOptions() {
    return [...this.#FORMAT_OPTIONS];
  }
}

// 創建並導出配置管理器實例
const configManager = new ConfigManager();

export default configManager;
