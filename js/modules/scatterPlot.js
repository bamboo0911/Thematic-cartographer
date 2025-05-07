// js/modules/scatterPlot.js - 優化版本
const ScatterPlot = {
  // Chart instance
  chart: null,
  
  // Current data
  data: [],
  
  // Raw data (before transformation)
  rawData: [],
  
  // Current A value (0-1)
  currentA: 0.9, // 提高初始閾值，因為數據分析顯示大多數 Keep_Sim_WHM 值較高
  
  // Chart colors - 基於熟悉度的顏色梯度
  colors: {
    // 熟悉度顏色梯度 - 從深色到淺色
    familiarity: [
      'rgba(1, 120, 80, 0.9)',    // 最高熟悉度
      'rgba(1, 130, 85, 0.85)',
      'rgba(1, 140, 90, 0.8)',
      'rgba(1, 150, 95, 0.75)',
      'rgba(1, 160, 100, 0.7)'    // 最低熟悉度
    ],
    originalPointColor: 'rgba(1, 152, 99, 0.8)',   // 原始文檔顏色
    originalBorderColor: 'rgba(0, 120, 80, 1)',
    pointBorderColor: 'rgba(100, 100, 100, 1)',
    gridColor: 'rgba(28, 22, 12, 0.1)',
    axisColor: 'rgba(28, 22, 12, 0.8)'
  },
  
  // Initialize the module
  init: function() {
    console.log('Initializing ScatterPlot module');
    
    // Get DOM elements
    this.scatterContainer = document.getElementById('scatter-plot-container');
    this.scatterCanvas = document.getElementById('dataScatterPlot');
    this.verticalSlider = document.getElementById('vertical-slider');
    this.pointInfoPopup = document.getElementById('point-info-popup');
    
    // Log elements found for debugging
    console.log('Found scatter container:', !!this.scatterContainer);
    console.log('Found scatter canvas:', !!this.scatterCanvas);
    console.log('Found vertical slider:', !!this.verticalSlider);
    
    if (!this.scatterCanvas || !this.verticalSlider) {
      console.error('Required DOM elements for ScatterPlot not found');
      return this;
    }
    
    // Initialize the chart
    this.initChart();
    
    // Set up event listeners
    this.setupEvents();
    
    // Load document data
    this.loadDocumentData();
    
    // Listen for related events
    listenForMessage('topics-loaded', function(topics) {
      // When topics are loaded, we may want to update the plot with topic information
      if (this.data && this.data.length > 0) {
        this.updateChart();
      }
    }.bind(this));
    
    listenForMessage('topic-updated', function() {
      // Using throttle to avoid frequent updates
      if (!this._throttledUpdate) {
        this._throttledUpdate = PerformanceUtils.throttle(function() {
          this.updateChart();
        }.bind(this), 300);
      }
      this._throttledUpdate();
    }.bind(this));
    
    // Handle clicks outside the popup to close it
    document.addEventListener('click', function(e) {
      if (this.pointInfoPopup && !this.pointInfoPopup.contains(e.target) && 
          e.target !== this.scatterCanvas) {
        this.hidePointInfoPopup();
      }
    }.bind(this));
    
    return this;
  },
  
  // Set up event listeners
  setupEvents: function() {
    // Vertical slider input handling
    if (this.verticalSlider) {
      // 設置初始值
      this.verticalSlider.value = this.currentA * 100;
      
      this.verticalSlider.addEventListener('input', function(e) {
        // Convert to 0-1 range (reversed, since 100 is at top)
        this.currentA = parseInt(e.target.value) / 100;
        
        // Filter data based on new A value threshold
        this.filterDataByA();
      }.bind(this));
    }
  },
  
  // Initialize the chart
  initChart: function() {
    if (!this.scatterCanvas) {
      console.error('Scatter canvas element not found');
      return;
    }
    
    console.log('Initializing scatter plot chart');
    const ctx = this.scatterCanvas.getContext('2d');
    
    // Create the chart with styling that matches your UI
    this.chart = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Data Points',
          data: [],
          backgroundColor: this.colors.familiarity[2], // 使用中等熟悉度顏色作為默認
          borderColor: this.colors.pointBorderColor,
          borderWidth: 1,
          pointRadius: 4.5,
          pointHoverRadius: 6.5,
          pointStyle: 'circle'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 200 // Quick but subtle animation
        },
        plugins: {
          tooltip: {
            enabled: false // Disable default tooltip, we're using custom popup
          },
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
            min: 0,
            max: 0.8, // 調整最大值，使點分布更均勻
            grid: {
              color: 'rgba(28, 22, 12, 0.05)',
              drawBorder: false,
              lineWidth: 0.5
            },
            ticks: {
              display: false // We're using custom labels outside the canvas
            }
          },
          y: {
            min: 0,
            max: 0.8, // 調整最大值，使點分布更均勻
            grid: {
              color: 'rgba(28, 22, 12, 0.05)',
              drawBorder: false,
              lineWidth: 0.5
            },
            ticks: {
              display: false // We're using custom labels outside the canvas
            }
          }
        },
        onClick: function(e) {
          this.handleChartClick(e);
        }.bind(this)
      }
    });
  },
  
  // 非線性轉換函數，用於擴展小值的差異
  transformValue: function(value) {
    if (value === 0) return 0;
    // 使用平方根轉換，使小值差異更明顯
    return Math.sqrt(value);
  },
  
  // 添加微小的隨機抖動，避免點完全重疊
  addJitter: function(value) {
    // 如果值為0，添加更大的抖動
    if (value === 0) {
      return Math.random() * 0.05; // 最多0.05的抖動
    }
    
    // 如果值很小，添加中等抖動
    if (value < 0.1) {
      return value + (Math.random() - 0.5) * 0.03;
    }
    
    // 一般值添加很小的抖動
    return value + (Math.random() - 0.5) * 0.01;
  },
  
  // 根據熟悉度值獲取顏色索引
  getFamiliarityColorIndex: function(value) {
    // 將熟悉度值映射到顏色索引 (0-4)
    // 值越高，顏色索引越小，顏色越深
    if (value >= 0.98) return 0;
    if (value >= 0.96) return 1;
    if (value >= 0.94) return 2;
    if (value >= 0.92) return 3;
    return 4;
  },
  
  // Load document data
  // 在 ScatterPlot.js 中更新 loadDocumentData 方法
  async loadDocumentData() {
    try {
      console.log('Loading document data from DataService');
      const documents = await DataService.getDocuments();
      
      if (!documents || documents.length === 0) {
        console.error('No document data retrieved');
        return;
      }
      
      console.log('Successfully loaded document data:', documents.length, 'documents');
      
      // 保存原始數據
      this.rawData = documents;
      
      // 分析數據分布
      this.analyzeDataDistribution(documents);
      
      // Map document data to scatter plot format with data transformations
      this.data = documents.map(doc => {
        // 應用非線性轉換和抖動
        const transformedX = this.transformValue(doc.defamInc);
        const transformedY = this.transformValue(doc.defamDec);
        const jitteredX = this.addJitter(transformedX);
        const jitteredY = this.addJitter(transformedY);
        
        return {
          id: doc.id,
          a: doc.keepSim,         // 熟悉度 (Vertical Slider threshold)
          x: jitteredX,           // 轉換並加入抖動的 X 值
          y: jitteredY,           // 轉換並加入抖動的 Y 值
          rawX: doc.defamInc,     // 原始 X 值 (用於顯示)
          rawY: doc.defamDec,     // 原始 Y 值 (用於顯示)
          selected: false,
          type: doc.type,
          // Detailed information for popup
          details: {
            type: doc.type,
            persona: doc.persona,
            gameType: doc.gameType,
            similarity: doc.similarity,
            distance: doc.distance,
            // Add text summary (first 150 characters)
            textSummary: doc.text.substring(0, 150) + (doc.text.length > 150 ? '...' : '')
          },
          // 直接保存原始文檔對象引用，確保包含主題權重
          originalDoc: doc
        };
      });
      
      // Initial filtering based on current A threshold
      this.filterDataByA();
      
      // Notify other modules that document data is available in scatter plot
      sendMessage('scatter-plot-data-loaded', this.data);
      
    } catch (error) {
      console.error('Failed to load document data:', error);
    }
  },
  
  // 分析數據分布情況
  analyzeDataDistribution: function(documents) {
    // 提取關鍵值
    const keepSimValues = documents.map(doc => doc.keepSim);
    const defamIncValues = documents.map(doc => doc.defamInc);
    const defamDecValues = documents.map(doc => doc.defamDec);
    
    // 計算基本統計
    const keepSimStats = this.calculateStats(keepSimValues);
    const defamIncStats = this.calculateStats(defamIncValues);
    const defamDecStats = this.calculateStats(defamDecValues);
    
    // 輸出統計信息
    console.log('Data Statistics:');
    console.log('Keep_Sim_WHM (A):', keepSimStats);
    console.log('Defam_Inc_Defam_WHM (X):', defamIncStats);
    console.log('Defam_Dec_Defam_WHM (Y):', defamDecStats);
    
    // 計算接近原點的點數量
    const nearOriginPoints = documents.filter(doc => 
      doc.defamInc < 0.05 && doc.defamDec < 0.05
    ).length;
    
    console.log(`Points near origin: ${nearOriginPoints} (${Math.round(nearOriginPoints/documents.length*100)}%)`);
    
    // 基於數據分布調整設置
    if (keepSimStats.min > 0.9) {
      // 如果熟悉度最小值很高，提高閾值起點
      this.currentA = keepSimStats.min;
      console.log(`Adjusting threshold to ${this.currentA} based on data distribution`);
    }
    
    // 更新圖表範圍
    if (this.chart && this.chart.options && this.chart.options.scales) {
      // 計算合適的X軸和Y軸範圍
      const xMax = Math.max(0.2, Math.ceil(defamIncStats.max * 1.2 * 10) / 10);
      const yMax = Math.max(0.2, Math.ceil(defamDecStats.max * 1.2 * 10) / 10);
      
      this.chart.options.scales.x.max = xMax;
      this.chart.options.scales.y.max = yMax;
    }
  },
  
  // 計算統計值
  calculateStats: function(values) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    
    const zeroCount = values.filter(v => v === 0).length;
    const zeroPercent = (zeroCount / values.length) * 100;
    
    const nearZeroCount = values.filter(v => v < 0.01).length;
    const nearZeroPercent = (nearZeroCount / values.length) * 100;
    
    return {
      min,
      max,
      mean,
      zeroCount,
      zeroPercent,
      nearZeroCount,
      nearZeroPercent
    };
  },
  
  // Filter data based on A value threshold and update chart
  filterDataByA: function() {
    // Only show points with a (familiarity) >= threshold
    const visiblePoints = this.data.filter(function(point) {
      return point.a >= this.currentA;
    }.bind(this));
    
    // Sort by familiarity (a) for layering - higher familiarity on top
    visiblePoints.sort(function(a, b) {
      return b.a - a.a;
    });
    
    // Map to the format expected by Chart.js with special handling for point types
    const chartData = visiblePoints.map(function(point) {
      // Calculate opacity based on distance from threshold for a subtle fade-in effect
      const opacityValue = Math.min(1, (point.a - this.currentA) * 5 + 0.5);
      
      return {
        x: point.x,
        y: point.y,
        id: point.id,
        a: point.a,
        rawX: point.rawX,
        rawY: point.rawY,
        type: point.type,
        opacity: opacityValue
      };
    }.bind(this));
    
    // Update the chart
    this.updateChartData(chartData);
    
    // Hide any visible popup when filtering changes
    this.hidePointInfoPopup();
    
    // Log the number of visible points
    console.log(`Showing ${chartData.length} points with familiarity >= ${this.currentA.toFixed(2)}`);
  },
  
  // Update the chart with new data
  updateChartData: function(chartData) {
    if (!this.chart) return;
    
    // Update the existing dataset
    this.chart.data.datasets[0].data = chartData;
    
    // 使用自定義點顏色基於熟悉度值
    this.chart.data.datasets[0].backgroundColor = function(context) {
      if (!context.raw) return this.colors.familiarity[2]; // 默認中等顏色
      
      // 原始文檔使用固定的顏色
      if (context.raw.type === 'original') {
        return this.colors.originalPointColor;
      }
      
      // 根據熟悉度設置顏色
      const colorIndex = this.getFamiliarityColorIndex(context.raw.a);
      const baseColor = this.colors.familiarity[colorIndex];
      
      // 添加透明度
      return baseColor.replace(/[\d\.]+\)$/, (context.raw.opacity || 0.7) + ')');
    }.bind(this);
    
    // Border color
    this.chart.data.datasets[0].borderColor = function(context) {
      if (!context.raw) return this.colors.pointBorderColor;
      
      if (context.raw.type === 'original') {
        return this.colors.originalBorderColor;
      }
      
      return this.colors.pointBorderColor;
    }.bind(this);
    
    // 基於熟悉度調整點大小
    this.chart.data.datasets[0].pointRadius = function(context) {
      if (!context.raw) return 4.5;
      
      // 基於熟悉度值調整大小
      const familiarityFactor = context.raw.a;
      const baseSize = 4;
      const maxSize = 12;
      
      // 熟悉度越高，點越大
      const size = baseSize + (familiarityFactor * 8);
      
      return Math.min(maxSize, size);
    }.bind(this);
    
    // 更新圖表
    this.chart.update();
  },
  
  // Handle chart click
  // 在 ScatterPlot.js 中更新 handleChartClick 方法
  handleChartClick: function(event) {
    if (!this.chart) return;
    
    const points = this.chart.getElementsAtEventForMode(
      event.native, 
      'nearest', 
      { intersect: true }, 
      false
    );
    
    if (points.length > 0) {
      const firstPoint = points[0];
      const dataPoint = this.chart.data.datasets[0].data[firstPoint.index];
      
      // 找到實際數據點
      const selectedPoint = this.data.find(function(p) {
        return p.id === dataPoint.id;
      });
      
      if (selectedPoint) {
        // 顯示點信息彈出窗口
        this.showPointInfoPopup(selectedPoint, event.native);
        
        // 發送文檔選中的消息，用於更新圖表和其他模組
        console.log('Document selected, sending message:', selectedPoint.originalDoc);
        sendMessage('document-selected', selectedPoint.originalDoc);
      }
    } else {
      // 隱藏彈出窗口
      this.hidePointInfoPopup();
    }
  },
  
  // Show point info popup
  showPointInfoPopup: function(point, event) {
    if (!this.pointInfoPopup) return;
    
    const details = point.details;
    
    // Enhanced popup with better formatting for document data
    let popupContent = `
      <div class="point-title">${details.type === 'original' ? 'Original Document' : 'Comparison Document'}</div>
      <div class="point-detail">
        <span class="point-detail-label">Familiarity:</span>
        <span class="point-detail-value">${point.a.toFixed(3)}</span>
      </div>
      <div class="point-detail">
        <span class="point-detail-label">Pos. Estrange:</span>
        <span class="point-detail-value">${point.rawX.toFixed(3)}</span>
      </div>
      <div class="point-detail">
        <span class="point-detail-label">Neg. Estrange:</span>
        <span class="point-detail-value">${point.rawY.toFixed(3)}</span>
      </div>
    `;
    
    // Add similarity and distance if available
    if (details.similarity !== undefined && details.distance !== undefined) {
      popupContent += `
        <div class="point-detail">
          <span class="point-detail-label">Similarity:</span>
          <span class="point-detail-value">${parseFloat(details.similarity).toFixed(3)}</span>
        </div>
        <div class="point-detail">
          <span class="point-detail-label">Distance:</span>
          <span class="point-detail-value">${parseFloat(details.distance).toFixed(3)}</span>
        </div>
      `;
    }
    
    // Add persona information
    popupContent += `
      <div class="point-separator"></div>
      <div class="point-detail">
        <span class="point-detail-label">Persona:</span>
      </div>
      <div class="point-detail text-xs">${details.persona}</div>
    `;
    
    // Add text summary if available
    if (details.textSummary) {
      popupContent += `
        <div class="point-separator"></div>
        <div class="point-detail">
          <span class="point-detail-label">Text Preview:</span>
        </div>
        <div class="point-detail text-xs italic">${details.textSummary}</div>
      `;
    }
    
    // Add a hint that you can click for more details
    popupContent += `
      <div class="point-separator"></div>
      <div class="point-detail text-xs text-center text-primary-light">Click to view full document</div>
    `;
    
    // Update popup content
    this.pointInfoPopup.innerHTML = popupContent;
    
    // Calculate position - using simpler approach for more reliability
    const rect = this.scatterContainer.getBoundingClientRect();
    
    // Get point position from Chart.js
    const xPixel = this.chart.scales.x.getPixelForValue(point.x);
    const yPixel = this.chart.scales.y.getPixelForValue(point.y);
    
    // Position popup near the point but not covering it
    let left = xPixel + 10;
    let top = yPixel - 10;
    
    // Make sure popup doesn't overflow the container
    const popupWidth = 200; // Max width defined in CSS
    const popupHeight = 200; // Approximate height with added content
    
    if (left + popupWidth > rect.width) {
      left = xPixel - popupWidth - 10;
    }
    
    if (top < 0) {
      top = 10;
    } else if (top + popupHeight > rect.height) {
      top = rect.height - popupHeight - 10;
    }
    
    if (left < 0) left = 10;
    
    // Set position
    this.pointInfoPopup.style.left = `${left}px`;
    this.pointInfoPopup.style.top = `${top}px`;
    
    // Make popup visible with subtle fade-in
    this.pointInfoPopup.style.display = 'block';
    this.pointInfoPopup.style.opacity = '0';
    setTimeout(() => {
      this.pointInfoPopup.style.opacity = '1';
    }, 10);
  },
  
  // Hide point info popup
  hidePointInfoPopup: function() {
    if (this.pointInfoPopup) {
      this.pointInfoPopup.style.opacity = '0';
      setTimeout(() => {
        this.pointInfoPopup.style.display = 'none';
      }, 200);
    }
  },
  
  // When topics are loaded, potentially use them to enhance document data
  onTopicsLoaded: function(topics) {
    if (!topics || topics.length === 0 || !this.data || this.data.length === 0) return;
    
    // This is where we can enhance our visualization with topic information
    console.log('Topics loaded, enhancing scatter plot with topic information');
    this.updateChart();
  },
  
  // Update chart when data or topics change
  updateChart: function() {
    this.filterDataByA();
  }
};