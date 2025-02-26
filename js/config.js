// js/config.js
const Config = {
    // 開發模式標記（true: 使用模擬資料，false: 使用 API）
    isDevelopment: true,
    
    // API 基礎 URL
    apiBaseUrl: 'https://api.thematic-cartographer.com',
    
    // API 版本
    apiVersion: 'v1',
    
    // 取得完整 API URL
    getApiUrl(endpoint) {
      return `${this.apiBaseUrl}/${this.apiVersion}/${endpoint}`;
    }
  };