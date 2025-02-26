// js/modules/contentPreview.js
const ContentPreview = {
    // 初始化
    init() {
      // 獲取容器元素
      this.container = document.getElementById('content-text');
      
      // 監聽熟悉度更新事件
      listenForMessage('familiarity-updated', data => {
        this.updateContent(data.documents);
      });
      
      // 初始載入預設內容
      this.loadDefaultContent();
      
      return this;
    },
    
    // 載入預設內容
    async loadDefaultContent() {
      try {
        const documents = await DataService.getDocumentsByFamiliarity(50);
        if (documents && documents.length > 0) {
          this.updateContent(documents);
        }
      } catch (error) {
        console.error('載入預設內容失敗:', error);
      }
    },
    
    // 更新內容
    updateContent(documents) {
      if (documents && documents.length > 0) {
        this.container.textContent = documents[0].content;
      } else {
        this.container.textContent = '沒有符合當前熟悉度的文件。';
      }
    }
  };