// js/modules/charts.js - 調整版
const Charts = {
  // 圖表實例
  topicChart: null,
  
  // 初始化
  init() {
    // 初始化圖表 - 針對要求優化
    this.initTopicChart();
    
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
    
    // 調整圖表容器樣式以最大化利用空間
    const chartContainer = document.getElementById('chart-container');
    if (chartContainer) {
      // 移除邊框並設定適當高度
      chartContainer.style.border = 'none';
      chartContainer.style.height = '140px'; // 增加高度以利用更多空間
      chartContainer.style.background = 'transparent';
      chartContainer.style.padding = '0';
      chartContainer.classList.remove('border');
      
      // 確保父容器也最大化利用空間
      const cardBody = chartContainer.closest('.card-body');
      if (cardBody) {
        cardBody.style.padding = '0.25rem'; // 減少卡片內部間距
      }
    }
    
    this.topicChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [
          {
            label: '當前',
            data: [],
            backgroundColor: 'rgba(161, 130, 73, 0.7)', // 褐色 - 當前資料
            barThickness: 8, // 固定窄寬度
            order: 2 // 顯示在後方
          },
          {
            label: '原始',
            data: [],
            backgroundColor: 'rgba(1, 152, 99, 0.7)', // 綠色 - 原始資料
            barThickness: 8, // 固定窄寬度
            order: 1 // 顯示在前方
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
        layout: {
          padding: {
            left: 0,
            right: 0,
            top: 3,
            bottom: 3
          }
        },
        scales: {
          y: { 
            beginAtZero: true,
            min: 0,
            max: 1, // 設置固定比例尺 0-1
            grid: {
              drawBorder: false,
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: {
                size: 10 // 更小的字體
              }
            }
          },
          x: { 
            display: true,
            grid: {
              display: false // 移除垂直網格線
            },
            ticks: {
              autoSkip: true,
              maxRotation: 0, // 水平呈現
              minRotation: 0, // 水平呈現
              font: {
                size: 10 // 更小的字體
              }
            }
          }
        },
        layout: {
          padding: {
            top: 5,
            bottom: 10
          }
        },
        barPercentage: 0.9, // 條形圖在類別內的寬度百分比
        categoryPercentage: 0.8, // 類別寬度佔坐標軸的百分比
        maxBarThickness: 10 // 最大寬度限制
      }
    });
  },
  
  // 更新圖表 - 同時顯示原始和當前權重
  updateTopicChart(topics) {
    if (!topics || topics.length === 0 || !this.topicChart) return;
    
    // 只顯示經過篩選的主題
    const filteredTopics = topics.filter(t => t.category);
    
    // 準備標籤
    this.topicChart.data.labels = filteredTopics.map(topic => topic.title);
    
    // 找出最大權重值用於歸一化
    const maxWeight = Math.max(...filteredTopics.map(topic => topic.weight));
    
    // 原始權重 - 歸一化到 0-1 範圍
    const originalWeights = filteredTopics.map(topic => 
      maxWeight > 0 ? topic.weight / maxWeight : 0
    );
    
    // 當前權重 (套用類別乘數) - 歸一化到 0-1 範圍
    const currentWeights = filteredTopics.map(topic => {
      let weight = topic.weight;
      if (topic.category === 'positive') weight *= 1.2;
      if (topic.category === 'negative') weight *= 0.8;
      return maxWeight > 0 ? weight / maxWeight : 0;
    });
    
    // 更新兩個數據集
    this.topicChart.data.datasets[0].data = currentWeights;
    this.topicChart.data.datasets[1].data = originalWeights;
    
    // 更新圖表 - 使用無動畫模式以提高性能
    this.topicChart.update('none');
  }
};