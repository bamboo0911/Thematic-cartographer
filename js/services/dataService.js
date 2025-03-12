// js/services/dataService.js 優化版
const DataService = {
  // 簡單的記憶體緩存
  cache: {
    topics: null,
    documents: {}
  },
  
  // 取得主題列表
  async getTopics() {
    // 檢查緩存
    if (this.cache.topics) {
      return this.cache.topics;
    }
    
    if (Config.isDevelopment) {
      this.cache.topics = mockData.topics;
      return this.cache.topics;
    }
    
    try {
      const response = await fetch(Config.getApiUrl('topics'));
      this.cache.topics = await response.json();
      return this.cache.topics;
    } catch (error) {
      console.error('無法取得主題:', error);
      return [];
    }
  },
  
  // 更新主題分類
  async updateTopicCategory(topicId, category) {
    if (Config.isDevelopment) {
      // 模擬更新
      const topic = mockData.topics.find(t => t.id === topicId);
      if (topic) {
        topic.category = category;
        
        // 更新緩存
        if (this.cache.topics) {
          const cachedTopic = this.cache.topics.find(t => t.id === topicId);
          if (cachedTopic) {
            cachedTopic.category = category;
          }
        }
      }
      return topic;
    }
    
    try {
      const response = await fetch(Config.getApiUrl(`topics/${topicId}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ category })
      });
      const updatedTopic = await response.json();
      
      // 更新緩存
      if (this.cache.topics) {
        const cachedTopic = this.cache.topics.find(t => t.id === topicId);
        if (cachedTopic) {
          cachedTopic.category = category;
        }
      }
      
      return updatedTopic;
    } catch (error) {
      console.error('更新主題分類失敗:', error);
      throw error;
    }
  },
  
  // 獲取指定熟悉度的文件，添加本地緩存
  async getDocumentsByFamiliarity(familiarity) {
    // 對熟悉度值進行分段，以減少緩存鍵的數量
    // 例如，將 0-100 的範圍分成 10 個區間
    const cacheKey = Math.floor(familiarity / 10) * 10;
    
    // 檢查緩存
    if (this.cache.documents[cacheKey]) {
      return this.cache.documents[cacheKey];
    }
    
    if (Config.isDevelopment) {
      // 模擬根據熟悉度篩選文件
      const documents = mockData.documents.filter(doc => 
        Math.abs(doc.familiarity - familiarity) <= 30
      );
      
      // 保存到緩存
      this.cache.documents[cacheKey] = documents;
      return documents;
    }
    
    try {
      const response = await fetch(Config.getApiUrl(`documents?familiarity=${familiarity}`));
      const documents = await response.json();
      
      // 保存到緩存
      this.cache.documents[cacheKey] = documents;
      return documents;
    } catch (error) {
      console.error('獲取文件失敗:', error);
      return [];
    }
  },
  
  // 清除特定緩存項
  clearCache(key) {
    if (key === 'topics') {
      this.cache.topics = null;
    } else if (key === 'documents') {
      this.cache.documents = {};
    } else if (this.cache.documents[key]) {
      delete this.cache.documents[key];
    }
  },
  
  // 清除所有緩存
  clearAllCache() {
    this.cache = {
      topics: null,
      documents: {}
    };
  }
};