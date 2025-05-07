// js/services/dataService.js - 完整版本
const DataService = {
  // 簡單的記憶體緩存
  cache: {
    topics: null,
    documents: {},
    documentData: null // 新增文檔數據緩存
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
  
  // 轉換文檔數據的函數
  transformDocumentData(docData) {
    if (!Array.isArray(docData)) {
      console.error('文檔數據不是數組格式');
      return [];
    }
    
    return docData.map(doc => {
      console.log('Processing document:', doc.Document_Type);
      
      // 1. 創建基本文檔對象
      const transformedDoc = {
        id: `doc-${doc.Document_Type}-${Math.random().toString(36).substr(2, 9)}`, // 生成唯一ID
        type: doc.Document_Type,
        persona: doc.input_persona,
        gameType: doc.game_type,
        text: doc.synthesized_text,
        // 熟悉度-陌生化相關值
        keepSim: doc.Keep_Sim_WHM,
        defamInc: doc.Defam_Inc_Defam_WHM,
        defamDec: doc.Defam_Dec_Defam_WHM,
        // 相似度和距離
        similarity: doc.similarity_to_original,
        distance: doc.distance_to_original
      };
      
      // 2. 提取主題權重並直接添加到主對象
      Object.keys(doc).forEach(key => {
        if (key.startsWith('Topic_')) {
          // 直接將主題權重添加到文檔對象中
          transformedDoc[key] = parseFloat(doc[key] || 0);
        }
      });
      
      // 3. 記錄提取的主題權重 (僅用於調試)
      const topicKeys = Object.keys(transformedDoc).filter(key => key.startsWith('Topic_'));
      console.log('Extracted topic keys:', topicKeys.length);
      
      return transformedDoc;
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
        // 使用空數組
        this.cache.topics = [];
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
  
  // 獲取文檔數據的方法
  async getDocuments() {
    // 檢查緩存
    if (this.cache.documentData) {
      return this.cache.documentData;
    }
    
    if (Config.isDevelopment) {
      try {
        // 從 JSON 文件獲取數據
        const response = await fetch('./js/services/analysis_results.json');
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const documentData = await response.json();
        
        // 使用轉換函數處理數據
        this.cache.documentData = this.transformDocumentData(documentData);
        return this.cache.documentData;
      } catch (error) {
        console.error('讀取文檔數據文件失敗:', error);
        // 返回空數組
        this.cache.documentData = [];
        return this.cache.documentData;
      }
    }
    
    // 生產環境從 API 獲取
    try {
      const response = await fetch(Config.getApiUrl('documents'));
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      this.cache.documentData = this.transformDocumentData(data);
      return this.cache.documentData;
    } catch (error) {
      console.error('無法獲取文檔數據:', error);
      throw error;
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
    
    // 如果已經載入了所有文檔，就從中篩選出對應熟悉度的文檔
    if (this.cache.documentData) {
      const filteredDocs = this.cache.documentData.filter(doc => 
        doc.keepSim >= familiarity
      );
      
      // 保存到緩存
      this.cache.documents[cacheKey] = filteredDocs;
      return filteredDocs;
    }
    
    // 如果沒有載入所有文檔，嘗試從 API 或文件獲取
    if (Config.isDevelopment) {
      try {
        // 先獲取所有文檔
        const allDocs = await this.getDocuments();
        
        // 然後篩選
        const filteredDocs = allDocs.filter(doc => 
          doc.keepSim >= familiarity
        );
        
        // 保存到緩存
        this.cache.documents[cacheKey] = filteredDocs;
        return filteredDocs;
      } catch (error) {
        console.error('獲取文檔失敗:', error);
        return [];
      }
    }
    
    // 生產環境直接從 API 獲取篩選後的文檔
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
  
  // 根據主題分類獲取文檔
  async getDocumentsByTopicCategory(category) {
    if (!this.cache.documentData) {
      // 如果文檔數據尚未載入，先載入
      await this.getDocuments();
    }
    
    if (!this.cache.documentData || this.cache.documentData.length === 0) {
      return [];
    }
    
    // 獲取屬於指定類別的主題
    const topics = await this.getTopics();
    const categoryTopics = topics.filter(t => t.category === category);
    
    if (categoryTopics.length === 0) {
      return [];
    }
    
    // 查找包含這些主題的文檔
    return this.cache.documentData.filter(doc => {
      // 檢查文檔是否包含這些主題中的任何一個
      return categoryTopics.some(topic => {
        const topicKey = topic.id;
        return doc[topicKey] && doc[topicKey] > 0;
      });
    });
  },
  
  // 清除特定緩存項
  clearCache(key) {
    if (key === 'topics') {
      this.cache.topics = null;
    } else if (key === 'documents') {
      this.cache.documents = {};
    } else if (key === 'documentData') {
      this.cache.documentData = null;
    } else if (this.cache.documents[key]) {
      delete this.cache.documents[key];
    }
  },
  
  // 清除所有緩存
  clearAllCache() {
    this.cache = {
      topics: null,
      documents: {},
      documentData: null
    };
  }
};