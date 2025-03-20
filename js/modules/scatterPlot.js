// js/modules/scatterPlot.js - Updated with gray dots
const ScatterPlot = {
    // Chart instance
    chart: null,
    
    // Current data
    data: [],
    
    // Current A value (0-1)
    currentA: 0.5,
    
    // Chart colors - Updated to use gray
    colors: {
      pointColor: 'rgba(128, 128, 128, 0.7)',       // Gray color for dots
      pointBorderColor: 'rgba(100, 100, 100, 1)',   // Darker gray for borders
      gridColor: 'rgba(28, 22, 12, 0.1)',           // Primary lighter
      axisColor: 'rgba(28, 22, 12, 0.8)'            // Primary light
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
      
      // Generate initial sample data
      this.generateDemoData();
      
      // Listen for related events
      listenForMessage('topics-loaded', function(topics) {
        this.onTopicsLoaded(topics);
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
        this.verticalSlider.addEventListener('input', function(e) {
          // Convert to 0-1 range (reversed, since 100 is at top)
          this.currentA = parseInt(e.target.value) / 100;
          
          // Filter data based on new A value
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
            backgroundColor: this.colors.pointColor,
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
              max: 1,
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
              max: 1,
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
    
    // Generate demo data
    generateDemoData: function() {
      // Generate N random data points with A, X, Y dimensions
      const sampleSize = 50;
      const rawData = [];
      
      for (let i = 0; i < sampleSize; i++) {
        rawData.push({
          id: `point-${i + 1}`,
          a: Math.random(),
          x: Math.random(),
          y: Math.random(),
          selected: false,
          details: `This is data point ${i + 1} with sample information.`
        });
      }
      
      this.data = rawData;
      
      // Initial filtering based on current A
      this.filterDataByA();
    },
    
    // Filter data based on A value and update chart
    filterDataByA: function() {
      // Define the A-value tolerance (how close points need to be to the current A value)
      const tolerance = 0.2; // Adjust as needed for data density
      
      // Filter points based on proximity to current A
      const visiblePoints = this.data.filter(function(point) {
        return Math.abs(point.a - this.currentA) <= tolerance;
      }.bind(this));
      
      // Sort by distance from current A for proper layering (closer points on top)
      visiblePoints.sort(function(a, b) {
        return Math.abs(a.a - this.currentA) - Math.abs(b.a - this.currentA);
      }.bind(this));
      
      // Map to the format expected by Chart.js
      const chartData = visiblePoints.map(function(point) {
        return {
          x: point.x,
          y: point.y,
          id: point.id,
          a: point.a,
          details: point.details,
          // Vary opacity based on proximity to current A
          opacity: 1 - (Math.abs(point.a - this.currentA) / tolerance)
        };
      }.bind(this));
      
      // Update the chart
      this.updateChartData(chartData);
      
      // Hide any visible popup when filtering changes
      this.hidePointInfoPopup();
    },
    
    // Update the chart with new data
    updateChartData: function(chartData) {
      if (!this.chart) return;
      
      // Update the existing dataset
      this.chart.data.datasets[0].data = chartData;
      
      // Use a single color for all points (no different color for selection)
      this.chart.data.datasets[0].backgroundColor = this.colors.pointColor;
      this.chart.data.datasets[0].borderColor = this.colors.pointBorderColor;
      
      // Update the chart
      this.chart.update();
    },
    
    // Helper function to adjust color opacity
    adjustColorOpacity: function(color, opacity) {
      if (color.startsWith('rgba')) {
        // Replace the last parameter in rgba
        return color.replace(/[\d\.]+\)$/, `${opacity})`);
      }
      // Default fallback
      return color;
    },
    
    // Handle chart click
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
        
        // Find the actual data point in our data array
        const selectedPoint = this.data.find(function(p) {
          return p.id === dataPoint.id;
        });
        
        if (selectedPoint) {
          // No need to toggle selection state for coloring - we're using one color
          
          // Show point info popup
          this.showPointInfoPopup(selectedPoint, event.native);
        }
      } else {
        // Hide popup when clicking empty space
        this.hidePointInfoPopup();
      }
    },
    
    // Show point info popup
    showPointInfoPopup: function(point, event) {
      if (!this.pointInfoPopup) return;
      
      // Format details for the popup with better styling
      let popupContent = `
        <div class="point-title">${point.id}</div>
        <div class="point-detail">
          <span class="point-detail-label">A:</span>
          <span class="point-detail-value">${point.a.toFixed(2)}</span>
        </div>
        <div class="point-detail">
          <span class="point-detail-label">X:</span>
          <span class="point-detail-value">${point.x.toFixed(2)}</span>
        </div>
        <div class="point-detail">
          <span class="point-detail-label">Y:</span>
          <span class="point-detail-value">${point.y.toFixed(2)}</span>
        </div>
      `;
      
      if (point.details) {
        popupContent += `
          <div class="point-separator"></div>
          <div class="point-detail">${point.details}</div>
        `;
      }
      
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
      const popupHeight = 150; // Approximate height
      
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
      
      // Make popup visible
      this.pointInfoPopup.style.display = 'block';
      
      console.log('Showing popup at:', left, top);
    },
    
    // Hide point info popup
    hidePointInfoPopup: function() {
      if (this.pointInfoPopup) {
        this.pointInfoPopup.style.display = 'none';
      }
    },
    
    // When topics are loaded, potentially use them to generate more meaningful data
    onTopicsLoaded: function(topics) {
      if (!topics || topics.length === 0) return;
      
      // This is where you could map your N-dimensional data to topics
      // For now, we'll just update our demo data with topic names
      this.data = this.data.map(function(point, index) {
        const topicIndex = index % topics.length;
        return {
          ...point,
          details: `Topic: ${topics[topicIndex].title}\n` +
                   `Values: A=${point.a.toFixed(2)}, X=${point.x.toFixed(2)}, Y=${point.y.toFixed(2)}\n` +
                   `Relevance: ${topics[topicIndex].relevanceA.toFixed(2)} / ${topics[topicIndex].relevanceB.toFixed(2)}`
        };
      });
      
      // Update visualization
      this.filterDataByA();
    },
    
    // Update chart when data or topics change
    updateChart: function() {
      this.filterDataByA();
    }
};