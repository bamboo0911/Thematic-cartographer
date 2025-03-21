// js/services/mockData.js
const mockData = {
    // 模擬主題數據
    topics: [
      {
        id: '1',
        title: 'Researching complex magical knowledge in cities',
        relevanceA: 0.8,
        relevanceB: 0.6,
        category: null,
        weight: 35
      },
      {
        id: '2', 
        title: 'Successful trade in a bustling market',
        relevanceA: 0.6,
        relevanceB: 0.9,
        category: null,
        weight: 40
      },
      {
        id: '3',
        title: 'Seeking Balance and Wisdom in Nature',
        relevanceA: 0.7,
        relevanceB: 0.7,
        category: null,
        weight: 30
      },
      {
        id: '4',
        title: 'Exploring and sharing ancient historical secrets',
        relevanceA: 0.9,
        relevanceB: 0.5,
        category: null,
        weight: 45
      },
      {
        id: '5',
        title: 'Seeking guidance to improve skills and combat challenges',
        relevanceA: 0.5,
        relevanceB: 0.8,
        category: null,
        weight: 25
      },
      {
        id: '6',
        title: 'Innovative Engineering and Crafting Skills',
        relevanceA: 0.7,
        relevanceB: 0.6,
        category: null,
        weight: 35
      },
      {
        id: '7',
        title: 'Exploring Ancient Mysteries and Universal Wisdom',
        relevanceA: 0.8,
        relevanceB: 0.4,
        category: null,
        weight: 30
      },
      {
        id: '8',
        title: 'City-based RPG gameplay and interactions',
        relevanceA: 0.6,
        relevanceB: 0.7,
        category: null,
        weight: 40
      },
      {
        id: '9',
        title: 'Mystical Art and Beauty in Night',
        relevanceA: 0.7,
        relevanceB: 0.5,
        category: null,
        weight: 25
      },
      {
        id: '10',
        title: 'Describing Individual\'s Physical Traits & Interactions',
        relevanceA: 0.5,
        relevanceB: 0.6,
        category: null,
        weight: 20
      },
      {
        id: '11',
        title: 'Sharing unique, warm experiences and traditional recipes',
        relevanceA: 0.4,
        relevanceB: 0.8,
        category: null,
        weight: 30
      },
      {
        id: '12',
        title: 'Exclusive Fashion Design and Creation',
        relevanceA: 0.6,
        relevanceB: 0.7,
        category: null,
        weight: 35
      }
    ],
    
    // 模擬文件數據
    documents: [
      {
        id: 'd1',
        title: '文件標題',
        content: `As the first light of dawn broke over the horizon, Elara stood atop the hill, gazing out at the sprawling expanse before her. The valley below was shrouded in a gentle mist, with patches of emerald green dotting the landscape. Birds began their morning chorus, their melodies intertwining with the soft rustle of leaves in the breeze. Elara took a deep breath, savoring the crisp, fresh air that filled her lungs, invigorating her spirit.
  
  Memories flooded her mind, each one a vivid tapestry of moments both joyous and sorrowful. She remembered the laughter shared with friends under the canopy of ancient trees, the warmth of the sun on her face during countless summer days, and the silent tears shed in the solitude of moonlit nights. Each memory was a testament to the resilience of the human spirit, a reminder of the enduring bonds that held her together.
  
  Today was different. Today marked the culmination of years of planning and perseverance. The journey ahead was fraught with uncertainty, but Elara felt a sense of calm determination settle over her. She knew that the path she had chosen was the right one, guided by a vision that burned brightly within her heart. The challenges that lay ahead were merely stepping stones, opportunities to grow and learn.
  
  As the sun continued its ascent, casting golden hues across the sky, Elara turned to face the world with unwavering resolve. She was ready to embrace whatever fate had in store, confident in her ability to navigate the complexities of life. With one final glance at the breathtaking vista, she descended the hill, each step bringing her closer to her destiny.`,
        familiarity: 50,
        topicDistribution: [
          { topicId: '1', weight: 30 },
          { topicId: '2', weight: 45 },
          { topicId: '3', weight: 15 }
        ]
      }
    ]
  };
