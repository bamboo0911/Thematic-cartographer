// js/utils/domUtils.js
const DomUtils = {
    // 創建元素並設置屬性
    createElement(tag, attributes = {}, text = '') {
      const element = document.createElement(tag);
      
      // 設置屬性
      Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
          element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
          Object.assign(element.style, value);
        } else {
          element.setAttribute(key, value);
        }
      });
      
      // 設置文字內容
      if (text) {
        element.textContent = text;
      }
      
      return element;
    },
    
    // 清空元素內容
    clearElement(element) {
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }
    },
    
    // 顯示/隱藏元素
    toggleElementVisibility(element, isVisible) {
      if (isVisible) {
        element.classList.remove('hidden');
      } else {
        element.classList.add('hidden');
      }
    },
    
    // 設置元素內容
    setTextContent(selector, text) {
      const element = document.querySelector(selector);
      if (element) {
        element.textContent = text;
      }
    }
  };