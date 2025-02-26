// js/services/dataService.js
const DataService = {
    // 取得主題列表
    async getTopics() {
      if (Config.isDevelopment) {
        return mockData.topics;
      }
      
      try {
        const response = await fetch(Config.getApiUrl('topics'));
        return await response.json();
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
        return await response.json();
      } catch (error) {
        console.error('更新主題分類失敗:', error);
        throw error;
      }
    },
    
    // 獲取指定熟悉度的文件
    async getDocumentsByFamiliarity(familiarity) {
      if (Config.isDevelopment) {
        // 模擬根據熟悉度篩選文件
        return mockData.documents.filter(doc => 
          Math.abs(doc.familiarity - familiarity) <= 30
        );
      }
      
      try {
        const response = await fetch(Config.getApiUrl(`documents?familiarity=${familiarity}`));
        return await response.json();
      } catch (error) {
        console.error('獲取文件失敗:', error);
        return [];
      }
    }
  };