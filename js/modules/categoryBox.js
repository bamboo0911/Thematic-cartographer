// js/modules/categoryBox.js - Enhanced version
const CategoryBox = {
  // 分類容器
  containers: {},
  
  // 初始化
  init() {
    // 獲取分類容器
    this.containers = {
      anchor: document.getElementById('maintain'),
      positive: document.getElementById('strengthen'), 
      negative: document.getElementById('weaken')
    };
    
    // 設置拖放區域 - 優化版
    this.setupEnhancedDropZones();
    
    // 監聽主題更新事件
    listenForMessage('topics-loaded', this.renderTopicsEnhanced.bind(this));
    listenForMessage('topic-updated', (data) => {
      // 處理主題類別變更
      this.handleTopicCategoryChange(data);
    });
    
    return this;
  },
  
  // 設置優化的拖放區域
  setupEnhancedDropZones() {
    Object.entries(this.containers).forEach(([category, container]) => {
      // 使用DragDrop工具設置拖放區域
      DragDrop.initDropZone(container, (data) => {
        // 當主題被拖入時更新類別
        TopicManager.updateTopicCategory(data.id, category);
      });
      
      // 設置滑鼠懸停顯示內容
      container.addEventListener('mouseenter', () => {
        const contentEl = container.querySelector('.category-content');
        if (contentEl) {
          contentEl.style.display = 'block';
        }
      });
      
      container.addEventListener('mouseleave', () => {
        const contentEl = container.querySelector('.category-content');
        if (contentEl) {
          contentEl.style.display = 'none';
        }
      });
    });
  },
  
  // 處理主題類別變更
  handleTopicCategoryChange(data) {
    // 更新舊類別和新類別的顯示
    if (data.oldCategory && this.containers[data.oldCategory]) {
      this.updateCategoryDisplay(data.oldCategory);
    }
    
    if (data.newCategory && this.containers[data.newCategory]) {
      this.updateCategoryDisplay(data.newCategory);
    }
    
    // 如果沒有類別（被重置），則更新所有容器
    if (!data.oldCategory && !data.newCategory) {
      this.renderTopicsEnhanced();
    }
  },
  
  // 更新特定類別的顯示
  updateCategoryDisplay(category) {
    const container = this.containers[category];
    if (!container) return;
    
    // 獲取該類別的主題
    const topics = TopicManager.getTopicsByCategory(category);
    
    // 獲取主題容器並清空
    const contentEl = container.querySelector('.category-content');
    if (contentEl) {
      DomUtils.clearElement(contentEl);
      
      // 添加主題標籤 - 使用更簡潔的樣式
      if (topics.length > 0) {
        const fragment = document.createDocumentFragment();
        topics.forEach(topic => {
          const topicTag = document.createElement('span');
          topicTag.className = 'topic-tag';
          topicTag.textContent = topic.title;
          
          // 添加移除功能 - 點擊標籤移除分類
          topicTag.addEventListener('click', (e) => {
            e.stopPropagation();
            TopicManager.updateTopicCategory(topic.id, null);
          });
          
          fragment.appendChild(topicTag);
        });
        contentEl.appendChild(fragment);
      }
    }
    
    // 更新計數器
    const counter = container.querySelector('.topic-count');
    if (counter) {
      counter.textContent = topics.length;
    }
  },
  
  // 渲染各類別中的主題 - 優化版
  renderTopicsEnhanced() {
    Object.entries(this.containers).forEach(([category, container]) => {
      this.updateCategoryDisplay(category);
    });
  }
};