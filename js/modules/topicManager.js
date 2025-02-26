// js/modules/topicManager.js
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
    
    // 渲染主題列表
    renderTopics() {
      const container = document.querySelector('#topics-list-container > div');
      DomUtils.clearElement(container);
      
      this.topics.forEach(topic => {
        // 創建主題項
        const topicItem = DomUtils.createElement('div', {
          className: 'grid grid-cols-4 items-center h-8 rounded-md bg-white/60 transition-all duration-200 cursor-pointer topic-item',
          'data-expanded': 'false',
          'data-topic-id': topic.id
        });
        
        // 相關度 A 色塊
        const leftColor = DomUtils.createElement('div', {
          className: 'col-span-1 h-full flex items-center justify-center transition-all duration-200 topic-color-left'
        });
        
        const leftColorInner = DomUtils.createElement('div', {
          className: 'w-4/5 h-4 rounded-sm transition-all duration-200',
          style: {
            backgroundColor: `rgba(1,152,99,${topic.relevanceA})`
          }
        });
        leftColor.appendChild(leftColorInner);
        
        // 主題標題
        const titleDiv = DomUtils.createElement('div', {
          className: 'col-span-2 px-2 truncate font-medium transition-all duration-200 topic-title'
        }, topic.title);
        
        // 相關度 B 色塊
        const rightColor = DomUtils.createElement('div', {
          className: 'col-span-1 h-full flex items-center justify-center transition-all duration-200 topic-color-right'
        });
        
        const rightColorInner = DomUtils.createElement('div', {
          className: 'w-4/5 h-4 rounded-sm transition-all duration-200',
          style: {
            backgroundColor: `rgba(161,130,73,${topic.relevanceB})`
          }
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
        
        // 加入到容器
        container.appendChild(topicItem);
      });
      
      // 設置懸停效果
      this.setupHoverEffects();
    },
    
    // 設置懸停效果
    setupHoverEffects() {
      document.querySelectorAll('.topic-item').forEach(item => {
        let hoverTimer;
        
        // 鼠標進入時
        item.addEventListener('mouseenter', () => {
          if (item.getAttribute('data-expanded') === 'true') {
            return;
          }
          
          // 設置定時器，延遲展開
          hoverTimer = setTimeout(() => {
            this.expandTopicItem(item);
          }, 500);
        });
        
        // 鼠標離開時
        item.addEventListener('mouseleave', () => {
          clearTimeout(hoverTimer);
          this.resetTopicItem(item);
        });
      });
    },
    
    // 展開主題項
    expandTopicItem(item) {
      item.setAttribute('data-expanded', 'true');
      item.classList.add('bg-white');
      item.classList.remove('bg-white/60');
      
      const leftColor = item.querySelector('.topic-color-left');
      const rightColor = item.querySelector('.topic-color-right');
      const title = item.querySelector('.topic-title');
      
      leftColor.style.opacity = '0';
      leftColor.style.width = '0';
      leftColor.style.overflow = 'hidden';
      
      rightColor.style.opacity = '0';
      rightColor.style.width = '0';
      rightColor.style.overflow = 'hidden';
      
      title.classList.remove('col-span-2', 'truncate');
      title.classList.add('col-span-4', 'px-4', 'font-semibold');
      title.style.whiteSpace = 'normal';
    },
    
    // 重置主題項
    resetTopicItem(item) {
      item.setAttribute('data-expanded', 'false');
      item.classList.remove('bg-white');
      item.classList.add('bg-white/60');
      
      const leftColor = item.querySelector('.topic-color-left');
      const rightColor = item.querySelector('.topic-color-right');
      const title = item.querySelector('.topic-title');
      
      leftColor.style.opacity = '1';
      leftColor.style.width = '';
      leftColor.style.overflow = '';
      
      rightColor.style.opacity = '1';
      rightColor.style.width = '';
      rightColor.style.overflow = '';
      
      title.classList.add('col-span-2', 'truncate');
      title.classList.remove('col-span-4', 'px-4', 'font-semibold');
      title.style.whiteSpace = 'nowrap';
    },
    
    // 更新主題分類
    async updateTopicCategory(topicId, category) {
      try {
        await DataService.updateTopicCategory(topicId, category);
        
        // 更新本地數據
        const topic = this.topics.find(t => t.id === topicId);
        if (topic) {
          topic.category = category;
          
          // 通知其他模組
          sendMessage('topic-updated', { topic, category });
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