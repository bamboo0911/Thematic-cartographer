// js/modules/familiarityControl.js - 極簡版
const FamiliarityControl = {
  // 當前熟悉度值
  currentFamiliarity: 50,
  
  // 初始化
  init() {
    // 獲取DOM元素
    this.slider = document.querySelector('input[type="range"]');
    this.confirmButton = document.getElementById('confirmFamiliarity');
    this.toggleButton = document.getElementById('toggleFamiliarityControl');
    this.content = document.getElementById('familiarityControlContent');
    
    // 設置初始值
    this.currentFamiliarity = parseInt(this.slider.value);
    
    // 設置事件監聽 - 極簡版
    this.setupEvents();
    
    return this;
  },
  
  // 設置事件監聽
  setupEvents() {
    // 使用超級節流的滑塊變更事件
    this.slider.addEventListener('change', e => {
      // 只在釋放滑塊時更新值，而不是在拖動過程中
      this.currentFamiliarity = parseInt(e.target.value);
    });
    
    // 確認按鈕點擊事件 - 簡化為只在點擊時獲取數據
    this.confirmButton.addEventListener('click', async () => {
      try {
        // 移除視覺更新，只保留數據處理
        const documents = await DataService.getDocumentsByFamiliarity(this.currentFamiliarity);
        sendMessage('familiarity-updated', {
          level: this.currentFamiliarity,
          documents: documents
        });
      } catch (error) {
        console.error('獲取文件失敗:', error);
      }
    });
    
    // 折疊按鈕點擊事件 - 極簡化
    this.toggleButton.addEventListener('click', () => {
      // 簡化為直接切換 display 樣式
      this.toggleFamiliarityControl(this.content.classList.contains('collapsed'));
    });
  },
  
  // 切換折疊狀態 - 優化版本
  toggleFamiliarityControl(collapse) {
    if (collapse) {
      this.content.style.display = 'none';
      this.toggleButton.dataset.collapsed = 'true';
    } else {
      this.content.style.display = 'block';
      this.toggleButton.dataset.collapsed = 'false';
    }
  }
};