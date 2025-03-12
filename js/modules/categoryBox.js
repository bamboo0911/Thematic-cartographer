// js/modules/categoryBox.js - 緊湊型籃子
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
    
    // 設置拖放區域 - 簡化版
    this.setupSimpleDropZones();
    
    // 監聽主題更新事件
    listenForMessage('topics-loaded', this.renderTopicsSimple.bind(this));
    listenForMessage('topic-updated', () => this.renderTopicsSimple());
    
    return this;
  },
  
  // 設置簡單拖放區域
  setupSimpleDropZones() {
    Object.entries(this.containers).forEach(([category, container]) => {
      // 監聽原生拖放事件，避免複雜的處理邏輯
      container.addEventListener('dragover', e => e.preventDefault());
      container.addEventListener('drop', e => {
        e.preventDefault();
        try {
          const data = JSON.parse(e.dataTransfer.getData('text/plain'));
          TopicManager.updateTopicCategory(data.id, category);
        } catch (error) {
          console.error('解析拖放資料失敗:', error);
        }
      });
    });
  },
  
  // 渲染各類別中的主題 - 簡化版
  renderTopicsSimple() {
    Object.entries(this.containers).forEach(([category, container]) => {
      // 獲取該類別的主題
      const topics = TopicManager.getTopicsByCategory(category);
      
      // 獲取主題容器並清空
      const contentEl = container.querySelector('.category-content');
      while (contentEl.firstChild) {
        contentEl.removeChild(contentEl.firstChild);
      }
      
      // 添加主題標籤 - 使用更簡潔的樣式
      if (topics.length > 0) {
        const fragment = document.createDocumentFragment();
        topics.forEach(topic => {
          const topicTag = document.createElement('span');
          topicTag.className = 'topic-tag';
          topicTag.textContent = topic.title;
          fragment.appendChild(topicTag);
        });
        contentEl.appendChild(fragment);
      }
      
      // 更新計數器
      const counter = container.querySelector('.topic-count');
      counter.textContent = topics.length;
    });
  }
};