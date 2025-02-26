// js/modules/familiarityControl.js
const FamiliarityControl = {
    // 當前熟悉度值
    currentFamiliarity: 50,
    isFirstClick: true,
    
    // 初始化
    init() {
      // 獲取DOM元素
      this.slider = document.querySelector('input[type="range"]');
      this.confirmButton = document.getElementById('confirmFamiliarity');
      this.toggleButton = document.getElementById('toggleFamiliarityControl');
      this.content = document.getElementById('familiarityControlContent');
      
      // 設置初始值
      this.currentFamiliarity = parseInt(this.slider.value);
      
      // 更新滑塊視覺效果
      this.updateSliderVisual();
      
      // 設置事件監聽
      this.setupEvents();
      
      return this;
    },
    
    // 設置事件監聽
    setupEvents() {
      // 滑塊變更事件
      this.slider.addEventListener('input', e => {
        this.currentFamiliarity = parseInt(e.target.value);
        this.updateSliderVisual();
      });
      
      // 確認按鈕點擊事件
      this.confirmButton.addEventListener('click', async () => {
        if (this.isFirstClick) {
          this.confirmButton.textContent = 'Update';
          this.isFirstClick = false;
        }
        
        // 獲取並顯示文件
        try {
          const documents = await DataService.getDocumentsByFamiliarity(this.currentFamiliarity);
          sendMessage('familiarity-updated', {
            level: this.currentFamiliarity,
            documents: documents
          });
        } catch (error) {
          console.error('獲取文件失敗:', error);
        }
      });
      
      // 折疊按鈕點擊事件
      this.toggleButton.addEventListener('click', () => {
        const isCollapsed = this.toggleButton.dataset.collapsed === 'true';
        this.toggleFamiliarityControl(!isCollapsed);
      });
    },
    
    // 更新滑塊視覺效果
    updateSliderVisual() {
      const percentage = (this.currentFamiliarity - this.slider.min) / 
                        (this.slider.max - this.slider.min) * 100;
      
      this.slider.style.background = 
        `linear-gradient(to right, var(--range-color) 0%, var(--range-color) ${percentage}%, #F4EFE6 ${percentage}%, #F4EFE6 100%)`;
    },
    
    // 切換折疊狀態
    toggleFamiliarityControl(collapse) {
      if (collapse) {
        this.content.style.maxHeight = '0';
        this.content.style.opacity = '0';
        this.content.style.marginTop = '0';
        this.content.classList.add('collapsed');
        this.toggleButton.dataset.collapsed = 'true';
      } else {
        this.content.style.maxHeight = this.content.scrollHeight + 'px';
        this.content.style.opacity = '1';
        this.content.style.marginTop = '1rem';
        this.content.classList.remove('collapsed');
        this.toggleButton.dataset.collapsed = 'false';
      }
    }
  };