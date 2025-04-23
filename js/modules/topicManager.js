// js/modules/topicManager.js - 處理空數據情況
const TopicManager = {
  // 儲存主題列表
  topics: [],
  
  // 跟踪已渲染的主題元素
  topicElements: new Map(),
  
  // 初始化
  async init() {
    try {
      // 從資料服務獲取主題
      this.topics = await DataService.getTopics();
      
      // 即使沒有數據也繼續執行
      if (!this.topics || this.topics.length === 0) {
        console.warn('未獲取到任何主題數據，將顯示空列表');
        this.topics = [];
      }
      
      // 渲染主題列表
      this.renderTopics();
      
      // 通知其他模組主題已載入
      sendMessage('topics-loaded', this.topics);
      
      return this;
    } catch (error) {
      console.error('初始化主題管理器失敗:', error);
      // 初始化空主題列表
      this.topics = [];
      this.renderTopics();
      
      // 通知其他模組初始化失敗但已處理
      sendMessage('topics-load-error', error);
      
      return this;
    }
  },

  // 計算相關度階梯等級 (1-5)
  getRelevanceLevel(relevanceValue) {
    // 確保值有效
    if (relevanceValue === undefined || relevanceValue === null || isNaN(relevanceValue)) {
      return 1; // 預設最低等級
    }
    
    // 標準化到 0-1 範圍
    const normalizedValue = Math.max(0, Math.min(1, relevanceValue));
    
    // 計算等級 (1-5)
    return Math.min(Math.ceil(normalizedValue * 5), 5);
  },

  // 渲染單個主題項目
  renderTopicItem(topic) {
    // 計算相關度等級 (1-5)
    const relevanceLevelA = this.getRelevanceLevel(topic.relevanceA);
    const relevanceLevelB = this.getRelevanceLevel(topic.relevanceB);
    
    // 檢查是否已有此元素
    if (this.topicElements.has(topic.id)) {
      // 更新現有元素
      const topicItem = this.topicElements.get(topic.id);
      
      // 更新相關度 A 顯示
      const leftColorInner = topicItem.querySelector('.topic-color-left .topic-relevance-indicator');
      if (leftColorInner) {
        leftColorInner.className = `w-4/5 h-4 rounded-sm transition-all duration-200 topic-relevance-indicator relevance-a-${relevanceLevelA}`;
      }
      
      // 更新相關度 B 顯示
      const rightColorInner = topicItem.querySelector('.topic-color-right .topic-relevance-indicator');
      if (rightColorInner) {
        rightColorInner.className = `w-4/5 h-4 rounded-sm transition-all duration-200 topic-relevance-indicator relevance-b-${relevanceLevelB}`;
      }
      
      // 更新標題
      const titleEl = topicItem.querySelector('.topic-title');
      if (titleEl) {
        titleEl.textContent = topic.title;
      }
      
      return topicItem;
    }
    
    // 創建新的主題項
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
    
    // 儲存元素引用
    this.topicElements.set(topic.id, topicItem);
    
    return topicItem;
  },

  // 渲染主題列表
  renderTopics() {
    const container = document.querySelector('#topics-list-container > div');
    if (!container) {
      console.error('找不到主題列表容器');
      return;
    }
    
    // 清空容器
    DomUtils.clearElement(container);
    
    // 檢查是否有主題可顯示
    const unassignedTopics = this.topics.filter(topic => !topic.category);
    
    if (unassignedTopics.length === 0) {
      // 顯示無數據提示
      const emptyMessage = DomUtils.createElement('div', {
        className: 'text-center text-gray-500 py-4 italic'
      }, '無可用主題數據');
      container.appendChild(emptyMessage);
      return;
    }
    
    // 創建文檔片段
    const fragment = document.createDocumentFragment();
    
    // 建立當前未分類主題 ID 集合
    const currentIds = new Set(unassignedTopics.map(t => t.id));
    
    // 移除已不再顯示的主題元素追蹤
    for (const [id, _] of this.topicElements.entries()) {
      if (!currentIds.has(id)) {
        this.topicElements.delete(id);
      }
    }
    
    // 渲染每個主題並添加到片段
    unassignedTopics.forEach(topic => {
      const topicItem = this.renderTopicItem(topic);
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
      // 設置新的事件監聽器
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
      if (!topic) {
        console.error('找不到主題:', topicId);
        return;
      }
      
      const oldCategory = topic.category;
      
      // 如果分類沒變，不執行更新
      if (oldCategory === category) return;
      
      // 更新分類
      await DataService.updateTopicCategory(topicId, category, oldCategory);
      
      // 更新本地數據
      topic.category = category;
      
      // 通知其他模組
      sendMessage('topic-updated', { topic, oldCategory, newCategory: category });
      
      // 重新渲染主題列表
      this.renderTopics();
    } catch (error) {
      console.error('更新主題分類失敗:', error);
      // 通知錯誤
      sendMessage('topic-update-error', { topicId, error });
    }
  },
  
  // 獲取特定分類的主題
  getTopicsByCategory(category) {
    return this.topics.filter(t => t.category === category);
  }
};