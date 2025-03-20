import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TopicGroupProps {
  category: string;
  words: string[];
  onWordSelect: (word: string) => void;
  isCollapsed?: boolean;
  isOld?: boolean;
  isStaging?: boolean;
}

const TopicGroup: React.FC<TopicGroupProps> = ({ 
  category, 
  words, 
  onWordSelect, 
  isCollapsed = false, 
  isOld = false,
  isStaging = false
}) => {
  const [isExpanded, setIsExpanded] = useState(!isCollapsed);
  
  useEffect(() => {
    setIsExpanded(!isCollapsed);
  }, [isCollapsed]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Calculate text size based on the number of words
  const getWordTextSize = () => {
    const wordCount = words.length;
    if (wordCount <= 2) return 'text-lg';
    if (wordCount <= 4) return 'text-base';
    if (wordCount <= 10) return 'text-sm';
    if (wordCount <= 15) return 'text-sm';
    return 'text-xs';
  };

  const getCategoryTextSize = () => {
    const wordCount = words.length;
    if (wordCount <= 4) return 'text-lg';
    if (wordCount <= 10) return 'text-base';
    return 'text-sm';
  };

  const wordTextSize = getWordTextSize();

  return (
    <div 
      className={`topic-group w-full border ${
        isOld ? 'border-muted-foreground/30 bg-muted/25' : 'border-border bg-card'
      } rounded-lg overflow-hidden shadow-sm`} 
      dir="rtl"
    >
      <div 
        className={`topic-group-header py-1.5 px-2 flex justify-between items-center cursor-pointer ${
          isOld ? 'hover:bg-muted/60 text-muted-foreground' : 'hover:bg-muted/50'
        } transition-colors`}
        onClick={toggleExpanded}
      >
        <div className="flex items-center gap-1.5">
          <h3 className={`font-medium ${getCategoryTextSize()}`}>{category}</h3>
          {isOld && (
            <span className="text-xs px-1 py-0.5 bg-muted-foreground/20 rounded text-muted-foreground">
              קודם
            </span>
          )}
          {isStaging && (
            <span className="text-xs px-1 py-0.5 bg-primary/20 rounded text-primary">
              זמני
            </span>
          )}
        </div>
        <button className="p-1 rounded-full hover:bg-muted transition-colors">
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="p-1.5 pt-0 flex flex-wrap gap-1.5 justify-start"
            dir="rtl"
          >
            {words.map((word, index) => (
              <button
                key={index}
                className={`word-chip ${wordTextSize} ${
                  isOld 
                    ? 'bg-muted/70 hover:bg-primary/15' 
                    : isStaging
                      ? 'bg-primary/10 hover:bg-primary/20'
                      : 'bg-muted/50 hover:bg-primary/10'
                } py-1 px-1.5 rounded-md transition-colors ${isStaging ? 'staging-word' : ''}`}
                onClick={() => onWordSelect(word)}
                dir="rtl"
              >
                {word}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TopicGroup;
