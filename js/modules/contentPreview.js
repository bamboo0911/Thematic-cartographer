// js/modules/contentPreview.js - 極簡版
const ContentPreview = {
  // 初始化
  init() {
    // 獲取容器元素
    this.container = document.getElementById('content-text');
    
    // 監聽熟悉度更新事件 - 只在必要時更新
    listenForMessage('familiarity-updated', data => {
      if (data.documents && data.documents.length > 0) {
        this.container.textContent = data.documents[0].content;
      }
    });
    
    // 初始顯示靜態內容
    this.container.textContent = '點擊 "Confirm" 按鈕查看基於熟悉度的內容。';
    
    return this;
  }
};