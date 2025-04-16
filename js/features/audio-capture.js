/**
 * YouTube 下載插件 - 音頻捕獲模組
 * 使用 Web Audio API 從 YouTube 影片中捕獲音頻
 */

// 確保全局命名空間存在
window.YTExtension = window.YTExtension || {};

// 音頻捕獲模組
window.YTExtension.AudioCapture = {
  // 音頻相關變數
  audioContext: null,
  mediaStreamSource: null,
  mediaStreamDestination: null,
  audioAnalyser: null,
  audioRecorder: null,
  isRecording: false,
  recordedChunks: [],
  controlPanel: null,
  statusText: null,
  
  // 初始化音頻捕獲系統
  init: function() {
    try {
      // 創建音頻上下文
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('音頻上下文已創建，採樣率:', this.audioContext.sampleRate);
      
      // 獲取 YouTube 影片元素
      const videoElement = document.querySelector('video');
      
      if (!videoElement) {
        console.error('找不到影片元素');
        return false;
      }
      
      // 創建媒體元素源
      const source = this.audioContext.createMediaElementSource(videoElement);
      
      // 創建分析器
      this.audioAnalyser = this.audioContext.createAnalyser();
      this.audioAnalyser.fftSize = 2048;
      
      // 創建目標節點
      this.mediaStreamDestination = this.audioContext.createMediaStreamDestination();
      
      // 連接節點: 源 -> 分析器 -> 目標 -> 揚聲器
      source.connect(this.audioAnalyser);
      this.audioAnalyser.connect(this.mediaStreamDestination);
      this.audioAnalyser.connect(this.audioContext.destination); // 確保聲音仍然可以播放
      
      console.log('音頻捕獲系統已初始化');
      
      // 更新 UI 狀態
      if (this.statusText) {
        this.statusText.textContent = '已初始化';
      }
      
      return true;
    } catch (error) {
      console.error('初始化音頻捕獲系統時出錯:', error);
      
      // 顯示錯誤訊息
      if (this.statusText) {
        this.statusText.textContent = '初始化失敗: ' + error.message;
      }
      
      return false;
    }
  },
  
  // 開始錄製音頻
  startRecording: function() {
    if (this.isRecording) {
      console.warn('已經在錄製中');
      return false;
    }
    
    // 如果尚未初始化，先初始化
    if (!this.audioContext) {
      const initSuccess = this.init();
      if (!initSuccess) return false;
    }
    
    try {
      // 重置已錄製的數據
      this.recordedChunks = [];
      
      // 創建 MediaRecorder
      this.audioRecorder = new MediaRecorder(this.mediaStreamDestination.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      // 處理數據可用事件
      this.audioRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
          console.log('捕獲音頻數據片段，大小:', event.data.size);
          
          // 處理音頻片段
          this.processAudioChunk(event.data);
        }
      };
      
      // 處理錄製停止事件
      this.audioRecorder.onstop = () => {
        console.log('錄製已停止，總共捕獲', this.recordedChunks.length, '個音頻片段');
        
        // 創建完整的音頻 Blob
        const audioBlob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        
        // 創建音頻 URL 供預覽
        const audioUrl = URL.createObjectURL(audioBlob);
        console.log('音頻 URL:', audioUrl);
        
        // 顯示下載鏈接
        this.showAudioDownloadLink(audioUrl);
        
        this.isRecording = false;
        
        // 更新 UI 狀態
        if (this.statusText) {
          this.statusText.textContent = '已停止錄製';
        }
      };
      
      // 開始錄製，每 1 秒獲取一次數據
      this.audioRecorder.start(1000);
      this.isRecording = true;
      
      console.log('開始錄製音頻');
      
      // 更新 UI 狀態
      if (this.statusText) {
        this.statusText.textContent = '錄製中...';
      }
      
      return true;
    } catch (error) {
      console.error('開始錄製時出錯:', error);
      
      // 更新 UI 狀態
      if (this.statusText) {
        this.statusText.textContent = '錄製失敗: ' + error.message;
      }
      
      return false;
    }
  },
  
  // 停止錄製音頻
  stopRecording: function() {
    if (!this.isRecording || !this.audioRecorder) {
      console.warn('沒有進行中的錄製');
      return false;
    }
    
    try {
      this.audioRecorder.stop();
      console.log('錄製已停止');
      
      return true;
    } catch (error) {
      console.error('停止錄製時出錯:', error);
      return false;
    }
  },
  
  // 處理音頻片段
  processAudioChunk: function(audioChunk) {
    // 轉換為 Base64 進行處理
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result;
      console.log('音頻數據已轉換為 Base64，前 50 個字符:', base64data.substr(0, 50) + '...');
      
      // 在這裡可以發送 base64data 到後端進行處理
      // 例如：發送到 WebSocket 服務器
      /*
      if (window.YTExtension.WebSocket && window.YTExtension.WebSocket.isConnected()) {
        window.YTExtension.WebSocket.send({
          type: 'audio_data',
          data: base64data,
          timestamp: Date.now(),
          videoId: window.YTExtension.Utils.getCurrentVideoId()
        });
      }
      */
    };
    reader.readAsDataURL(audioChunk);
  },
  
  // 顯示音頻下載鏈接
  showAudioDownloadLink: function(audioUrl) {
    // 創建一個臨時的下載鏈接
    const downloadLink = document.createElement('a');
    downloadLink.href = audioUrl;
    downloadLink.download = 'youtube-audio-' + new Date().toISOString() + '.webm';
    downloadLink.innerHTML = '下載錄製的音頻';
    downloadLink.style.position = 'fixed';
    downloadLink.style.top = '10px';
    downloadLink.style.right = '10px';
    downloadLink.style.zIndex = '9999';
    downloadLink.style.padding = '10px';
    downloadLink.style.backgroundColor = '#f00';
    downloadLink.style.color = '#fff';
    downloadLink.style.borderRadius = '5px';
    downloadLink.style.textDecoration = 'none';
    
    document.body.appendChild(downloadLink);
    
    // 10 秒後自動移除
    setTimeout(() => {
      if (downloadLink.parentNode) {
        downloadLink.parentNode.removeChild(downloadLink);
      }
    }, 10000);
  },
  
  // 創建 UI 控制面板
  createUI: function() {
    // 檢查是否已經創建
    if (this.controlPanel) return;
    
    // 創建控制面板
    this.controlPanel = document.createElement('div');
    this.controlPanel.className = 'yt-extension-audio-controls';
    
    // 添加標題
    const title = document.createElement('div');
    title.textContent = '音頻捕獲';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '10px';
    title.style.textAlign = 'center';
    this.controlPanel.appendChild(title);
    
    // 創建按鈕容器
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '5px';
    this.controlPanel.appendChild(buttonContainer);
    
    // 初始化按鈕
    const initButton = document.createElement('button');
    initButton.textContent = '初始化';
    initButton.onclick = () => {
      if (this.init()) {
        initButton.disabled = true;
        startButton.disabled = false;
      }
    };
    buttonContainer.appendChild(initButton);
    
    // 開始按鈕
    const startButton = document.createElement('button');
    startButton.textContent = '開始錄製';
    startButton.disabled = !this.audioContext;
    startButton.onclick = () => {
      if (this.startRecording()) {
        startButton.disabled = true;
        stopButton.disabled = false;
      }
    };
    buttonContainer.appendChild(startButton);
    
    // 停止按鈕
    const stopButton = document.createElement('button');
    stopButton.textContent = '停止錄製';
    stopButton.disabled = !this.isRecording;
    stopButton.onclick = () => {
      if (this.stopRecording()) {
        stopButton.disabled = true;
        startButton.disabled = false;
      }
    };
    buttonContainer.appendChild(stopButton);
    
    // 狀態文本
    this.statusText = document.createElement('div');
    this.statusText.textContent = '未初始化';
    this.statusText.style.marginTop = '5px';
    this.statusText.style.textAlign = 'center';
    this.statusText.style.fontSize = '12px';
    this.controlPanel.appendChild(this.statusText);
    
    // 添加到頁面
    document.body.appendChild(this.controlPanel);
    
    // 添加鍵盤快捷鍵
    document.addEventListener('keydown', (event) => {
      // Alt+I: 初始化
      if (event.altKey && (event.key === 'i' || event.key === 'I')) {
        this.init();
      }
      // Alt+R: 開始/停止錄製
      else if (event.altKey && (event.key === 'r' || event.key === 'R')) {
        if (!this.isRecording) {
          this.startRecording();
        } else {
          this.stopRecording();
        }
      }
    });
  },
  
  // 顯示 UI
  showUI: function() {
    if (this.controlPanel) {
      this.controlPanel.style.display = 'block';
    } else {
      this.createUI();
    }
  },
  
  // 隱藏 UI
  hideUI: function() {
    if (this.controlPanel) {
      this.controlPanel.style.display = 'none';
    }
  }
};
