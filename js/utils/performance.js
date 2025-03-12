// js/utils/performance.js
const PerformanceUtils = {
    // 防抖函數 - 延遲執行，適合最終結果類操作
    debounce(func, wait = 300) {
      let timeout;
      return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
      };
    },
    
    // 節流函數 - 限制執行頻率，適合持續觸發類操作
    throttle(func, limit = 100) {
      let inThrottle;
      return function(...args) {
        const context = this;
        if (!inThrottle) {
          func.apply(context, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    }
  };