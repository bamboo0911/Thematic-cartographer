// js/modules/categoryBox.js
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
      
      // 設置拖放區域
      this.setupDropZones();
      
      // 監聽主題更新事件
      listenForMessage('topics-loaded', this.renderTopics.bind(this));
      listenForMessage('topic-updated', () => this.renderTopics());
      
      return this;
    },
    
    // 設置拖放區域
    setupDropZones() {
      Object.entries(this.containers).forEach(([category, container]) => {
        // 初始化為拖放區域
        DragDrop.initDropZone(container, (data) => {
          // 當有主題被拖放到此區域時
          TopicManager.updateTopicCategory(data.id, category);
        });
      });
    },
    
    // 渲染各類別中的主題
    renderTopics() {
      Object.entries(this.containers).forEach(([category, container]) => {
        // 獲取該類別的主題
        const topics = TopicManager.getTopicsByCategory(category);
        
        // 獲取主題容器並清空
        const topicsContainer = container.querySelector('.topics-container > div');
        DomUtils.clearElement(topicsContainer);
        
        // 添加主題標籤
        topics.forEach(topic => {
          // 創建主題標籤
          const topicTag = DomUtils.createElement('span', {
            className: 'inline-block px-3 py-1.5 rounded-full text-sm font-medium text-white whitespace-nowrap mr-2'
          }, topic.title);
          
          // 設置標籤顏色
          switch(category) {
            case 'anchor':
              topicTag.style.backgroundColor = 'rgba(28, 22, 12, 0.8)';
              break;
            case 'positive':
              topicTag.style.backgroundColor = 'rgba(1, 152, 99, 0.8)';
              break;
            case 'negative':
              topicTag.style.backgroundColor = 'rgba(161, 130, 73, 0.8)';
              break;
          }
          
          // 添加到容器
          topicsContainer.appendChild(topicTag);
        });
        
        // 更新計數器
        const counter = container.querySelector('.topic-count');
        counter.textContent = topics.length;
      });
    }
  };