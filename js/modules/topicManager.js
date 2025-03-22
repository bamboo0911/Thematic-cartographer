// js/modules/topicManager.js - Updated with improved drag and drop support
const TopicManager = {
  // 儲存主題列表
  topics: [],
  
  // 初始化
  async init() {
    // 從資料服務獲取主題
    this.topics = await DataService.getTopics();
    
    // 渲染主題列表
    this.renderTopics();
    
    // 通知其他模組主題已載入
    sendMessage('topics-loaded', this.topics);
    
    return this;
  },

  // 計算相關度階梯等級 (1-5)
  getRelevanceLevel(relevanceValue) {
    return Math.min(Math.ceil(relevanceValue * 5), 5);
  },

  // 渲染主題列表 - 使用階梯式顏色
  renderTopics() {
    const container = document.querySelector('#topics-list-container > div');
    DomUtils.clearElement(container);
    
    const fragment = document.createDocumentFragment();
    
    // 只渲染沒有被分類的主題
    const unassignedTopics = this.topics.filter(topic => !topic.category);
    
    unassignedTopics.forEach(topic => {
      // 計算相關度等級 (1-5)
      const relevanceLevelA = this.getRelevanceLevel(topic.relevanceA);
      const relevanceLevelB = this.getRelevanceLevel(topic.relevanceB);
      
      // 創建主題項
      const topicItem = DomUtils.createElement('div', {
        className: 'grid grid-cols-4 items-center h-8 rounded-md bg-white/60 transition-all duration-200 cursor-pointer topic-item',
        'data-expanded': 'false',
        'data-topic-id': topic.id
      });
      
      // 相關度 A 色塊 - 使用階梯式顏色
      const leftColor = DomUtils.createElement('div', {
        className: 'col-span-1 h-full flex items-center justify-center transition-all duration-200 topic-color-left'
      });
      
      const leftColorInner = DomUtils.createElement('div', {
        className: `w-4/5 h-4 rounded-sm transition-all duration-200 topic-relevance-indicator relevance-a-${relevanceLevelA}`
      });
      leftColor.appendChild(leftColorInner);
      
      // 主題標題
      const titleDiv = DomUtils.createElement('div', {
        className: 'col-span-2 px-2 truncate font-medium transition-all duration-200 topic-title'
      }, topic.title);
      
      // 相關度 B 色塊 - 使用階梯式顏色
      const rightColor = DomUtils.createElement('div', {
        className: 'col-span-1 h-full flex items-center justify-center transition-all duration-200 topic-color-right'
      });
      
      const rightColorInner = DomUtils.createElement('div', {
        className: `w-4/5 h-4 rounded-sm transition-all duration-200 topic-relevance-indicator relevance-b-${relevanceLevelB}`
      });
      rightColor.appendChild(rightColorInner);
      
      // 組合元素
      topicItem.appendChild(leftColor);
      topicItem.appendChild(titleDiv);
      topicItem.appendChild(rightColor);
      
      // 設置拖放功能
      DragDrop.initDraggable(topicItem, {
        id: topic.id,
        title: topic.title
      });
      
      // 加入到文檔碎片
      fragment.appendChild(topicItem);
    });
    
    // 一次性添加所有元素
    container.appendChild(fragment);
    
    // 設置懸停效果
    this.setupHoverEffects();
    
    // 確保適當的高度管理
    this.ensureFixedHeight();
  },
  
  // 設置主題項的懸停效果
  setupHoverEffects() {
    const topicItems = document.querySelectorAll('.topic-item');
    topicItems.forEach(item => {
      item.addEventListener('mouseenter', () => {
        item.classList.add('hover:shadow-md');
      });
      
      item.addEventListener('mouseleave', () => {
        item.classList.remove('hover:shadow-md');
      });
    });
  },
  
  // 確保固定高度
  ensureFixedHeight() {
    // 獲取容器及其父元素
    const container = document.querySelector('#topics-list-container');
    if (!container) return;
    
    const parentCard = container.closest('section.card');
    if (!parentCard) return;
    
    // 根據父卡片計算理想高度
    const headerHeight = parentCard.querySelector('.card-header')?.offsetHeight || 0;
    const controlsHeight = parentCard.querySelector('.p-sm')?.offsetHeight || 0;
    const padding = 24; // 考慮內邊距和外邊距
    
    // 計算主題列表的可用高度
    const availableHeight = parentCard.offsetHeight - headerHeight - controlsHeight - padding;
    
    // 設置最大高度限制
    const maxHeight = Math.min(availableHeight, 400); // 限制最大高度為400px
    
    // 應用高度限制
    container.style.maxHeight = `${maxHeight}px`;
    
    // 確保父級佈局保持不變
    parentCard.style.minHeight = '0';
    
    // 確保保持可滾動性
    if (container.scrollHeight > container.clientHeight) {
      container.classList.add('has-overflow');
    } else {
      container.classList.remove('has-overflow');
    }
  },
  
  // 更新主題分類
  async updateTopicCategory(topicId, category) {
    try {
      // 檢查主題目前的分類
      const topic = this.topics.find(t => t.id === topicId);
      const oldCategory = topic ? topic.category : null;
      
      // 如果是從一個分類移到另一個分類，先移除舊分類
      if (oldCategory && oldCategory !== category) {
        // 先從舊分類中移除
        await DataService.updateTopicCategory(topicId, null);
      }
      
      // 更新到新分類
      await DataService.updateTopicCategory(topicId, category);
      
      // 更新本地數據
      if (topic) {
        topic.category = category;
        
        // 通知其他模組
        sendMessage('topic-updated', { topic, oldCategory, newCategory: category });
        
        // 重新渲染主題列表（只顯示未分類的主題）
        this.renderTopics();
      }
    } catch (error) {
      console.error('更新主題分類失敗:', error);
    }
  },
  
  // 獲取特定分類的主題
  getTopicsByCategory(category) {
    return this.topics.filter(t => t.category === category);
  }
};