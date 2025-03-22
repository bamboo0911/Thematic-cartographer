// js/modules/categoryBox.js - Updated version for vertical topic display
const CategoryBox = {
  // Category containers
  containers: {},
  
  // Initialize
  init() {
    // Get category containers
    this.containers = {
      anchor: document.getElementById('maintain'),
      positive: document.getElementById('strengthen'), 
      negative: document.getElementById('weaken')
    };
    
    // Set up enhanced drop zones
    this.setupEnhancedDropZones();
    
    // Listen for topic update events
    listenForMessage('topics-loaded', this.renderTopicsEnhanced.bind(this));
    listenForMessage('topic-updated', (data) => {
      // Handle topic category changes
      this.handleTopicCategoryChange(data);
    });
    
    // Initial render of categories
    this.renderTopicsEnhanced();
    
    return this;
  },
  
  // Set up enhanced drop zones
  setupEnhancedDropZones() {
    Object.entries(this.containers).forEach(([category, container]) => {
      // Use DragDrop utility to set up drop zones
      DragDrop.initDropZone(container, (data) => {
        // Update topic category when dropped
        TopicManager.updateTopicCategory(data.id, category);
      });
      
      // Make sure content sections are always visible
      const contentEl = container.querySelector('.category-content');
      if (contentEl) {
        contentEl.style.display = 'block';
      }
    });
  },
  
  // Handle topic category changes
  handleTopicCategoryChange(data) {
    // Update old and new category displays
    if (data.oldCategory && this.containers[data.oldCategory]) {
      this.updateCategoryDisplay(data.oldCategory);
    }
    
    if (data.newCategory && this.containers[data.newCategory]) {
      this.updateCategoryDisplay(data.newCategory);
    }
    
    // If no category (reset), update all containers
    if (!data.oldCategory && !data.newCategory) {
      this.renderTopicsEnhanced();
    }
  },
  
  // Update specific category display
  updateCategoryDisplay(category) {
    const container = this.containers[category];
    if (!container) return;
    
    // Get topics for this category
    const topics = TopicManager.getTopicsByCategory(category);
    
    // Get and clear the content element
    const contentEl = container.querySelector('.category-content');
    if (contentEl) {
      DomUtils.clearElement(contentEl);
      
      // Add topic tags with vertical layout
      if (topics.length > 0) {
        const fragment = document.createDocumentFragment();
        topics.forEach(topic => {
          const topicTag = document.createElement('div'); // Use div for block display
          topicTag.className = 'topic-tag';
          topicTag.textContent = topic.title;
          
          // Add remove functionality - click tag to remove classification
          topicTag.addEventListener('click', (e) => {
            e.stopPropagation();
            TopicManager.updateTopicCategory(topic.id, null);
          });
          
          fragment.appendChild(topicTag);
        });
        contentEl.appendChild(fragment);
      }
    }
    
    // Update counter
    const counter = container.querySelector('.topic-count');
    if (counter) {
      counter.textContent = topics.length;
    }
  },
  
  // Render topics in all categories - enhanced version
  renderTopicsEnhanced() {
    Object.entries(this.containers).forEach(([category, container]) => {
      this.updateCategoryDisplay(category);
    });
  }
};