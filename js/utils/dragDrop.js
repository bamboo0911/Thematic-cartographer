// js/utils/dragDrop.js
const DragDrop = {
    // 初始化拖拽項
    initDraggable(element, data) {
      element.setAttribute('draggable', 'true');
      
      element.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', JSON.stringify(data));
        element.classList.add('opacity-50');
      });
      
      element.addEventListener('dragend', () => {
        element.classList.remove('opacity-50');
      });
      
      return element;
    },
    
    // 初始化放置區
    initDropZone(element, onDrop) {
      // 添加拖拽進入事件
      element.addEventListener('dragenter', e => {
        e.preventDefault();
        // 如果是緊湊型分類容器，自動展開
        if (element.classList.contains('compact-category')) {
          element.style.height = 'auto';
          element.style.minHeight = '80px'; // 適當的最小高度
          
          // 顯示內容區域
          const content = element.querySelector('.category-content');
          if (content) {
            content.style.display = 'block';
          }
        }
      });
      
      element.addEventListener('dragover', e => {
        e.preventDefault();
        element.classList.add('drag-over');
      });
      
      element.addEventListener('dragleave', () => {
        element.classList.remove('drag-over');
        
        // 如果是緊湊型分類容器，且不再處於滯留狀態，則收起
        if (element.classList.contains('compact-category') && !element.matches(':hover')) {
          element.style.height = '24px';
          
          // 隱藏內容區域
          const content = element.querySelector('.category-content');
          if (content) {
            content.style.display = 'none';
          }
        }
      });
      
      element.addEventListener('drop', e => {
        e.preventDefault();
        element.classList.remove('drag-over');
        
        try {
          const data = JSON.parse(e.dataTransfer.getData('text/plain'));
          onDrop(data, element);
        } catch (error) {
          console.error('解析拖放資料失敗:', error);
        }
        
        // 稍後恢復緊湊狀態
        setTimeout(() => {
          if (element.classList.contains('compact-category') && !element.matches(':hover')) {
            element.style.height = '24px';
            
            // 隱藏內容區域
            const content = element.querySelector('.category-content');
            if (content) {
              content.style.display = 'none';
            }
          }
        }, 500);
      });
      
      return element;
    }
  };