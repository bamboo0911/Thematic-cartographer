// js/modules/charts.js - Updated with dual-variable bar chart
const Charts = {
  // 圖表實例
  topicChart: null,
  
  // 初始化
  init() {
    // 初始化圖表
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
    
    // 處理視窗大小變化
    window.addEventListener('resize', () => {
      if (this._resizeTimeout) {
        clearTimeout(this._resizeTimeout);
      }
      this._resizeTimeout = setTimeout(() => {
        if (TopicManager.topics) {
          this.updateTopicChart(TopicManager.topics);
        }
      }, 250);
    });
    
    return this;
  },
  
  // 初始化圖表
  initTopicChart() {
    const ctx = document.getElementById('topicDistributionChart').getContext('2d');
    
    // 初始化前調整容器樣式
    const chartContainer = document.getElementById('chart-container');
    if (chartContainer) {
      // 修改容器樣式以支持水平滾動並使高度與左側 Topic Containers 對齊
      chartContainer.style.overflowX = 'auto';
      chartContainer.style.overflowY = 'hidden';
      chartContainer.style.display = 'block'; // 改為 block 以正確處理滾動
      
      // 移除固定高度，讓它根據父容器的 flex 比例自動調整
      chartContainer.style.height = '100%'; 
      
      // 移除可能影響滾動的 flex 樣式
      chartContainer.classList.remove('flex', 'items-center', 'justify-center');
      
      // 監聽視窗變化，確保圖表隨著容器大小調整
      this._resizeObserver = new ResizeObserver(() => {
        if (this.topicChart) {
          this.topicChart.resize();
        }
      });
      this._resizeObserver.observe(chartContainer);
    }
    
    this.topicChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [
          {
            label: '原始',
            data: [],
            backgroundColor: 'rgba(211, 129, 150, 0.8)', // 使用 negative-light 顏色
            barPercentage: 0.35,
            categoryPercentage: 0.7,
            maxBarThickness: 12 // 限制條形最大厚度
          },
          {
            label: '當前',
            data: [],
            backgroundColor: 'rgba(96, 150, 211, 0.8)', // 使用 positive-light 顏色
            barPercentage: 0.35,
            categoryPercentage: 0.7,
            maxBarThickness: 12 // 限制條形最大厚度
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false, // 禁用所有動畫以提高性能
        plugins: {
          legend: {
            display: false // 使用自定義圖例
          },
          tooltip: {
            enabled: true,
            displayColors: true,
            titleFont: {
              size: 10
            },
            bodyFont: {
              size: 9
            },
            padding: 4,
            callbacks: {
              title: function(context) {
                return context[0].label; // 顯示主題名稱
              },
              label: function(context) {
                const label = context.dataset.label || '';
                return `${label}: ${context.formattedValue}`;
              }
            }
          }
        },
        scales: {
          y: { 
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)', // 淡化網格線
              drawBorder: false
            },
            ticks: {
              padding: 0,
              font: {
                size: 8 // 進一步減小 Y 軸字體
              },
              maxTicksLimit: 3, // 只顯示3個刻度值
              callback: function(value) {
                // 只顯示整數值
                if (Math.floor(value) === value) {
                  return value;
                }
              }
            }
          },
          x: { 
            grid: {
              display: false // 不顯示 X 軸網格線
            },
            ticks: {
              font: {
                size: 9 // 進一步減小 X 軸字體
              },
              maxRotation: 0, // 防止標籤旋轉
              autoSkip: true, // 自動跳過重疊的標籤
              autoSkipPadding: 15 // 標籤之間的最小間距
            }
          }
        },
        layout: {
          padding: 0 // 移除所有內邊距以最大化空間利用
        }
      }
    });
  },
  
  // 更新圖表
  updateTopicChart(topics) {
    if (!topics || topics.length === 0 || !this.topicChart) return;
    
    // 只顯示經過篩選的主題，減少數據點
    const filteredTopics = topics.filter(t => t.category);
    
    // 如果沒有篩選後的主題，重置圖表
    if (filteredTopics.length === 0) {
      this.topicChart.data.labels = [];
      this.topicChart.data.datasets[0].data = [];
      this.topicChart.data.datasets[1].data = [];
      this.topicChart.update();
      return;
    }
    
    // 準備圖表資料
    this.topicChart.data.labels = filteredTopics.map(topic => topic.title);
    
    // 原始權重（未修改）
    const originalWeights = filteredTopics.map(topic => topic.weight);
    
    // 當前權重（包含分類調整）
    const currentWeights = filteredTopics.map(topic => {
      let weight = topic.weight;
      if (topic.category === 'positive') weight *= 1.2;
      if (topic.category === 'negative') weight *= 0.8;
      return weight;
    });
    
    // 更新數據集
    this.topicChart.data.datasets[0].data = originalWeights;
    this.topicChart.data.datasets[1].data = currentWeights;
    
    // 調整圖表寬度以適應主題數量
    this.adjustChartWidth(filteredTopics.length);
    
    // 刷新圖表
    this.topicChart.update();
  },
  
  // 根據主題數量調整圖表寬度，確保每個主題有足夠空間且支持水平滾動
  adjustChartWidth(topicCount) {
    const chartContainer = document.getElementById('chart-container');
    const canvas = document.getElementById('topicDistributionChart');
    
    if (!chartContainer || !canvas) return;
    
    // 計算合適的圖表寬度: 每個主題至少需要 60px 的寬度
    const minWidthPerTopic = 60; // 減小每個主題佔用的空間
    const minTotalWidth = Math.max(topicCount * minWidthPerTopic, 200); // 設置最小寬度下限
    
    // 容器的目前寬度
    const containerWidth = chartContainer.clientWidth;
    
    // 如果主題數量較多，設置最小寬度以確保所有主題都可見（需要水平滾動）
    if (minTotalWidth > containerWidth) {
      canvas.parentNode.style.width = `${minTotalWidth}px`;
      canvas.style.width = `${minTotalWidth}px`;
    } else {
      // 如果主題數量較少，使用容器的完整寬度
      canvas.parentNode.style.width = '100%';
      canvas.style.width = '100%';
    }
  }
};