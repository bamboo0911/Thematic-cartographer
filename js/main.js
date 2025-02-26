// js/main.js
// 等待 DOM 加載完成
document.addEventListener('DOMContentLoaded', async function() {
    try {
      // 初始化順序很重要
      // 1. 先初始化主題管理器 (因為其他模組可能依賴它)
      await TopicManager.init();
      
      // 2. 初始化其他模組
      CategoryBox.init();
      FamiliarityControl.init();
      ContentPreview.init();
      Charts.init();
      
      console.log('應用程式初始化成功');
    } catch (error) {
      console.error('應用程式初始化失敗:', error);
    }
  });