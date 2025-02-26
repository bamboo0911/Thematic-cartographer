// js/utils/messages.js
const MessageSystem = {
    // 儲存訂閱者
    listeners: {},
    
    // 訂閱訊息
    listen(messageName, callback) {
      if (!this.listeners[messageName]) {
        this.listeners[messageName] = [];
      }
      this.listeners[messageName].push(callback);
      
      // 返回取消訂閱的函數
      return () => {
        this.listeners[messageName] = this.listeners[messageName].filter(cb => cb !== callback);
      };
    },
    
    // 發送訊息
    send(messageName, data) {
      if (this.listeners[messageName]) {
        this.listeners[messageName].forEach(callback => callback(data));
      }
    }
  };
  
  // 簡化的全域函數
  function listenForMessage(messageName, callback) {
    return MessageSystem.listen(messageName, callback);
  }
  
  function sendMessage(messageName, data) {
    MessageSystem.send(messageName, data);
  }