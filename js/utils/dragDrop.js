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
      element.addEventListener('dragover', e => {
        e.preventDefault();
        element.classList.add('bg-[#F4EFE6]/80');
      });
      
      element.addEventListener('dragleave', () => {
        element.classList.remove('bg-[#F4EFE6]/80');
      });
      
      element.addEventListener('drop', e => {
        e.preventDefault();
        element.classList.remove('bg-[#F4EFE6]/80');
        
        try {
          const data = JSON.parse(e.dataTransfer.getData('text/plain'));
          onDrop(data, element);
        } catch (error) {
          console.error('解析拖放資料失敗:', error);
        }
      });
      
      return element;
    }
  };