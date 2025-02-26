// js/modules/charts.js
const Charts = {
    // 圖表實例
    topicChart: null,
    scatterPlot: null,
    
    // 初始化
    init() {
      // 初始化圖表
      this.initTopicChart();
      this.initScatterPlot();
      
      // 監聽相關事件
      listenForMessage('topics-loaded', topics => {
        this.updateTopicChart(topics);
      });
      
      listenForMessage('topic-updated', () => {
        this.updateTopicChart(TopicManager.topics);
      });
      
      listenForMessage('familiarity-updated', data => {
        this.updateScatterPlot(data.documents);
      });
      
      return this;
    },
    
    // 初始化主題分佈圖
    initTopicChart() {
      const ctx = document.getElementById('topicDistributionChart').getContext('2d');
      
      this.topicChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: [],
          datasets: [
            {
              label: 'Original',
              data: [],
              backgroundColor: 'rgba(161, 130, 73, 0.6)',
              borderColor: 'rgba(161, 130, 73, 1)',
              borderWidth: 1
            },
            {
              label: 'Current',
              data: [],
              backgroundColor: 'rgba(1, 152, 99, 0.6)',
              borderColor: 'rgba(1, 152, 99, 1)',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Weight (權重)'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Topic',
                position: 'top'
              }
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  return context.dataset.label + ': ' + context.parsed.y;
                }
              }
            },
            legend: {
              display: false
            }
          }
        }
      });
    },
    
    // 初始化散點圖
    initScatterPlot() {
      const ctx = document.getElementById('scatterPlot').getContext('2d');
      
      this.scatterPlot = new Chart(ctx, {
        type: 'scatter',
        data: {
          datasets: [{
            label: 'Documents',
            data: [],
            backgroundColor: 'rgba(28, 22, 12, 0.6)'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              min: 0,
              max: 100,
              title: {
                display: false
              }
            },
            y: {
              min: 0,
              max: 100,
              title: {
                display: false
              }
            }
          },
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });
    },
    
    // 更新主題分佈圖
    updateTopicChart(topics) {
      // 準備圖表資料
      const labels = topics.map(topic => topic.title);
      const originalData = topics.map(topic => topic.weight);
      
      // 計算當前權重（可能根據分類進行調整）
      const currentData = topics.map(topic => {
        let weight = topic.weight;
        
        // 根據分類調整權重
        if (topic.category === 'positive') {
          weight *= 1.2; // 增加權重
        } else if (topic.category === 'negative') {
          weight *= 0.8; // 減少權重
        }
        
        return Math.min(100, weight);
      });
      
      // 更新圖表資料
      this.topicChart.data.labels = labels;
      this.topicChart.data.datasets[0].data = originalData;
      this.topicChart.data.datasets[1].data = currentData;
      
      // 刷新圖表
      this.topicChart.update();
    },
    
    // 更新散點圖
    updateScatterPlot(documents) {
      if (!documents || documents.length === 0) {
        this.scatterPlot.data.datasets[0].data = [];
        this.scatterPlot.update();
        return;
      }
      
      // 準備散點資料
      const scatterData = documents.map(doc => ({
        x: Math.random() * 100, // 這裡使用隨機值，實際應該使用主題相似度
        y: doc.familiarity
      }));
      
      // 更新散點圖資料
      this.scatterPlot.data.datasets[0].data = scatterData;
      
      // 刷新圖表
      this.scatterPlot.update();
    }
  };