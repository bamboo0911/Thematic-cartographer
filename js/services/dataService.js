// js/services/dataService.js - 重構版
const DataService = {
  // 簡單的記憶體緩存
  cache: {
    topics: null,
    documents: {}
  },
  
  // 統一的主題資料轉換函數
  transformTopicWeightsData(topicWeightsData) {
    // 建立一致的資料結構
    return Object.entries(topicWeightsData).map(([id, data]) => {
      // 從描述中移除前後的引號
      const cleanDescription = data.description.replace(/^"|"$/g, '');
      
      return {
        id: id,
        title: cleanDescription,
        // 直接使用原始值，不做額外轉換
        relevanceA: data.original_weight,
        relevanceB: data.average_weight,
        category: null,
        // 權重保持原始數值，避免資料格式轉換問題
        weight: data.original_weight
      };
    });
  },
  
  // 取得主題列表 - 改進版
  async getTopics() {
    // 檢查緩存
    if (this.cache.topics) {
      return this.cache.topics;
    }
    
    if (Config.isDevelopment) {
      try {
        // 使用 fetch 從 topic_weights.json 讀取資料
        const response = await fetch('./js/services/topic.json');
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const topicWeightsData = await response.json();
        
        // 使用統一的轉換函數
        this.cache.topics = this.transformTopicWeightsData(topicWeightsData);
        return this.cache.topics;
      } catch (error) {
        console.error('讀取 topic_weights.json 失敗:', error);
        // 使用模擬資料
        this.cache.topics = mockData.topics;
        return this.cache.topics;
      }
    }
    
    try {
      const response = await fetch(Config.getApiUrl('topics'));
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      this.cache.topics = await response.json();
      return this.cache.topics;
    } catch (error) {
      console.error('無法取得主題:', error);
      throw error; // 向上傳遞錯誤，讓呼叫者有機會處理
    }
  },
  
  // 更新主題分類 - 合併版
  async updateTopicCategory(topicId, newCategory, oldCategory = null) {
    if (Config.isDevelopment) {
      // 模擬更新 - 一次性處理
      const topic = this.cache.topics?.find(t => t.id === topicId);
      if (topic) {
        topic.category = newCategory;
      }
      return topic;
    }
    
    try {
      // 單一 API 呼叫處理分類變更，避免競態條件
      const response = await fetch(Config.getApiUrl(`topics/${topicId}/category`), {
        method: 'PUT', // 使用 PUT 表示替換整個資源
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          category: newCategory,
          oldCategory // 提供舊分類資訊以便伺服器處理
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const updatedTopic = await response.json();
      
      // 更新緩存
      if (this.cache.topics) {
        const cachedTopic = this.cache.topics.find(t => t.id === topicId);
        if (cachedTopic) {
          cachedTopic.category = newCategory;
        }
      }
      
      return updatedTopic;
    } catch (error) {
      console.error('更新主題分類失敗:', error);
      throw error; // 向上傳遞錯誤
    }
  },
  
  // 獲取指定熟悉度的文件
  async getDocumentsByFamiliarity(familiarity) {
    // 對熟悉度值進行分段，以減少緩存鍵的數量
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
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const documents = await response.json();
      
      // 保存到緩存
      this.cache.documents[cacheKey] = documents;
      return documents;
    } catch (error) {
      console.error('獲取文件失敗:', error);
      throw error; // 向上傳遞錯誤
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