// js/modules/charts.js - 整合文檔數據的版本
const Charts = {
  // 圖表實例
  topicChart: null,
  
  // 當前選擇的文檔
  selectedDocument: null,
  
  // 初始化
  init() {
    console.log('Initializing Charts module');
    
    // 初始化圖表 - 針對要求優化
    this.initTopicChart();
    
    // 監聽相關事件
    listenForMessage('topics-loaded', topics => {
      console.log('Charts received topics-loaded event:', topics.length, 'topics');
      this.updateTopicChart(topics);
    });
    
    listenForMessage('topic-updated', (data) => {
      console.log('Charts received topic-updated event:', data);
      // 使用節流函數避免頻繁更新
      if (!this._throttledUpdate) {
        this._throttledUpdate = PerformanceUtils.throttle(() => {
          this.updateTopicChart(TopicManager.topics);
        }, 300);
      }
      this._throttledUpdate();
    });
    
    // 監聽文檔選擇事件
    listenForMessage('document-selected', document => {
      console.log('Charts received document-selected event:', document);
      this.selectedDocument = document;
      this.updateTopicChart(TopicManager.topics);
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
      chartContainer.style.height = '160px'; // 增加高度以利用更多空間
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
            label: '所選文檔',
            data: [],
            backgroundColor: 'rgba(96, 150, 211, 0.7)', // 藍色 - 選定文檔
            barThickness: 8, // 固定窄寬度
            order: 2 // 顯示在後方
          },
          {
            label: '原始權重',
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
          legend: { 
            display: true,
            position: 'top',
            labels: {
              font: {
                size: 10
              },
              boxWidth: 10
            }
          },
          tooltip: {
            callbacks: {
              title: function(context) {
                return context[0].label;
              },
              label: function(context) {
                const datasetLabel = context.dataset.label;
                const value = context.parsed.y.toFixed(3);
                return `${datasetLabel}: ${value}`;
              }
            }
          }
        },
        layout: {
          padding: {
            left: 0,
            right: 0,
            top: 20, // 增加頂部間距以容納圖例
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
        barPercentage: 0.9, // 條形圖在類別內的寬度百分比
        categoryPercentage: 0.8, // 類別寬度佔坐標軸的百分比
        maxBarThickness: 10 // 最大寬度限制
      }
    });
  },
  
  // 從 Document 中獲取主題權重
  getTopicWeightsFromDocument(document, topics) {
    console.log('Getting topic weights from document');
    
    if (!document) {
      console.warn('No document provided');
      return topics.map(() => 0);
    }
    
    // 檢查文檔對象中的主題鍵
    const topicKeys = Object.keys(document).filter(key => key.startsWith('Topic_'));
    console.log('Document contains topic keys:', topicKeys);
    
    return topics.map(topic => {
      const topicId = topic.id;
      // 直接從文檔對象中獲取主題權重
      const weight = document[topicId] || 0;
      console.log(`Topic ${topicId} weight:`, weight);
      return weight;
    });
  },
  
  // 更新圖表 - 同時顯示原始和所選文檔的權重
  updateTopicChart(topics) {
    if (!topics || topics.length === 0 || !this.topicChart) {
      console.warn('No topics data or chart not initialized');
      return;
    }
    
    // 只顯示經過篩選的主題
    const filteredTopics = topics.filter(t => t.category);
    console.log('Filtered topics with category:', filteredTopics.length);
    
    if (filteredTopics.length === 0) {
      console.warn('No categorized topics found');
      // 清空圖表
      this.topicChart.data.labels = [];
      this.topicChart.data.datasets[0].data = [];
      this.topicChart.data.datasets[1].data = [];
      this.topicChart.update('none');
      return;
    }
    
    // 準備標籤
    this.topicChart.data.labels = filteredTopics.map(topic => topic.title);
    
    // 原始權重 - 直接使用原始值
    const originalWeights = filteredTopics.map(topic => topic.weight);
    
    // 選定文檔的權重 - 如果有選擇文檔
    let selectedWeights = [];
    if (this.selectedDocument) {
      console.log('Extracting weights for selected document');
      // 直接使用原始權重，不進行標準化
      selectedWeights = this.getTopicWeightsFromDocument(this.selectedDocument, filteredTopics);
    } else {
      console.log('No document selected, using zero weights');
      // 如果沒有選定文檔，顯示零值
      selectedWeights = filteredTopics.map(() => 0);
    }
    
    console.log('Original weights:', originalWeights);
    console.log('Selected document weights:', selectedWeights);
    
    // 確定所有權重的最大值，用於設置 Y 軸刻度
    const maxValue = Math.max(
      ...originalWeights, 
      ...selectedWeights,
      0.001 // 避免所有值都是零的情況
    );
    
    // 調整 Y 軸最大值，給圖表頂部留一些空間
    this.topicChart.options.scales.y.max = maxValue * 1.1;
    
    // 更新數據集
    this.topicChart.data.datasets[0].data = selectedWeights;
    this.topicChart.data.datasets[1].data = originalWeights;
    
    // 更新圖表 - 使用無動畫模式以提高性能
    this.topicChart.update('none');
    console.log('Chart updated successfully with non-normalized values');
  }
};