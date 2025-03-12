// js/modules/charts.js - 極簡版
const Charts = {
  // 圖表實例
  topicChart: null,
  scatterPlot: null,
  
  // 初始化
  init() {
    // 初始化圖表 - 使用最小配置
    this.initTopicChart();
    // 完全移除散點圖，它不是核心功能
    // this.initScatterPlot();
    
    // 監聽相關事件
    listenForMessage('topics-loaded', topics => {
      this.updateTopicChart(topics);
    });
    
    listenForMessage('topic-updated', () => {
      // 使用節流函數避免頻繁更新
      if (!this._throttledUpdate) {
        this._throttledUpdate = PerformanceUtils.throttle(() => {
          this.updateTopicChart(TopicManager.topics);
        }, 300);
      }
      this._throttledUpdate();
    });
    
    return this;
  },
  
  // 初始化圖表
  initTopicChart() {
    const ctx = document.getElementById('topicDistributionChart').getContext('2d');
    
    this.topicChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Weight',
            data: [],
            backgroundColor: 'rgba(1, 152, 99, 0.6)'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false, // 禁用所有動畫
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true },
          x: { display: true }
        }
      }
    });
  },
  
  // 極簡化的圖表更新函數
  updateTopicChart(topics) {
    if (!topics || topics.length === 0 || !this.topicChart) return;
    
    // 只顯示經過篩選的主題，減少數據點
    const filteredTopics = topics.filter(t => t.category);
    
    // 準備簡化的圖表資料
    this.topicChart.data.labels = filteredTopics.map(topic => topic.title);
    
    // 只有一個數據集，減少計算量
    const weights = filteredTopics.map(topic => {
      // 簡化權重計算邏輯
      let weight = topic.weight;
      if (topic.category === 'positive') weight *= 1.2;
      if (topic.category === 'negative') weight *= 0.8;
      return weight;
    });
    
    this.topicChart.data.datasets[0].data = weights;
    
    // 刷新圖表
    this.topicChart.update();
  }
};