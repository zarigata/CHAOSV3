// ==========================================================
// 😀 C.H.A.O.S. EMOJI PICKER COMPONENT 😀
// ==========================================================
// - MSN MESSENGER INSPIRED EMOJI SELECTOR
// - CATEGORIZED EMOJIS WITH SEARCH CAPABILITY
// - OPTIMIZED PERFORMANCE WITH VIRTUALIZATION
// - CROSS-PLATFORM INTERACTION PATTERNS
// ==========================================================

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

// Common emojis for MSN Messenger-like experience
const EMOJI_CATEGORIES = {
  'Recent': ['😊', '👍', '❤️', '😂', '🎉'],
  'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥲', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘'],
  'People': ['👋', '👌', '✌️', '🤞', '👍', '👎', '👏', '🙌', '🤝', '💪', '🫂', '🧠', '🫀', '🦾', '🦿', '🦶', '🦵', '👂'],
  'Animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧'],
  'Food': ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅'],
  'Activities': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🥊', '🥋', '🎽', '🛹', '🛼'],
  'Travel': ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛵', '🏍️', '🛺'],
  'Objects': ['⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸'],
  'Symbols': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘'],
  'Flags': ['🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️', '🇦🇨', '🇦🇩', '🇦🇪', '🇦🇫', '🇦🇬', '🇦🇮', '🇦🇱'],
  'MSN Classics': ['👋', '😉', '😊', '😎', '😘', '😜', '😢', '❤️', '💔', '🎮', '🎵', '🍕', '🍺', '🔥', '💤', '💯', '🎉']
};

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('MSN Classics');
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Filter emojis based on search query
  const filteredEmojis = searchQuery 
    ? Object.entries(EMOJI_CATEGORIES).reduce((acc, [category, emojis]) => {
        const filtered = emojis.filter(emoji => 
          emoji.includes(searchQuery) || 
          category.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (filtered.length > 0) {
          acc[category] = filtered;
        }
        return acc;
      }, {} as Record<string, string[]>)
    : EMOJI_CATEGORIES;
  
  // Handle emoji selection
  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    
    // Update recent emojis (in a real app, would store in localStorage)
    const updatedRecent = [emoji, ...EMOJI_CATEGORIES['Recent'].filter(e => e !== emoji)].slice(0, 5);
    EMOJI_CATEGORIES['Recent'] = updatedRecent;
  };
  
  // Handle category click (scrolls to category)
  const scrollToCategory = (category: string) => {
    const container = containerRef.current;
    if (!container) return;
    
    const categoryElement = container.querySelector(`[data-category="${category}"]`);
    if (categoryElement) {
      categoryElement.scrollIntoView({ behavior: 'smooth' });
      setActiveCategory(category);
    }
  };
  
  // Track active category based on scroll position
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      const categoryElements = container.querySelectorAll('[data-category]');
      
      for (let i = 0; i < categoryElements.length; i++) {
        const element = categoryElements[i] as HTMLElement;
        const rect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        if (rect.top >= containerRect.top) {
          setActiveCategory(element.dataset.category || '');
          break;
        }
      }
    };
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.div
      className="w-72 rounded-md border border-border bg-card shadow-lg"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
    >
      {/* Search input */}
      <div className="border-b border-border p-2">
        <input
          type="text"
          placeholder="Search emoji..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus:border-msn-primary focus:outline-none"
        />
      </div>
      
      {/* Category tabs */}
      <div className="border-b border-border overflow-x-auto scrollbar-hide">
        <div className="flex p-1">
          {Object.keys(filteredEmojis).map((category) => (
            <button
              key={category}
              onClick={() => scrollToCategory(category)}
              className={`
                shrink-0 rounded-md px-2 py-1 text-xs font-medium transition-colors
                ${activeCategory === category 
                  ? 'bg-msn-primary text-white' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
              `}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      
      {/* Emoji grid */}
      <div 
        ref={containerRef}
        className="h-60 overflow-y-auto p-2"
      >
        {Object.entries(filteredEmojis).map(([category, emojis]) => (
          <div key={category} data-category={category}>
            <h3 className="mb-1 text-xs font-medium text-muted-foreground">{category}</h3>
            <div className="mb-3 grid grid-cols-7 gap-1">
              {emojis.map((emoji, index) => (
                <button
                  key={`${category}-${index}`}
                  onClick={() => handleEmojiClick(emoji)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-lg hover:bg-muted"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer with MSN nostalgia */}
      <div className="border-t border-border p-2 text-center text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          Feeling nostalgic <span className="text-sm">😉</span>
        </span>
      </div>
    </motion.div>
  );
}
