import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TopicGroupProps {
  category: string;
  words: string[];
  onWordSelect: (word: string) => void;
  isCollapsed?: boolean;
  isOld?: boolean;
}

const TopicGroup: React.FC<TopicGroupProps> = ({ category, words, onWordSelect, isCollapsed = false, isOld = false }) => {
  const [isExpanded, setIsExpanded] = useState(!isCollapsed);
  
  useEffect(() => {
    setIsExpanded(!isCollapsed);
  }, [isCollapsed]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div 
      className={`topic-group w-full border ${
        isOld ? 'border-muted-foreground/30 bg-muted/25' : 'border-border bg-card'
      } rounded-lg overflow-hidden shadow-sm`} 
      dir="rtl"
    >
      <div 
        className={`topic-group-header p-3 flex justify-between items-center cursor-pointer ${
          isOld ? 'hover:bg-muted/60 text-muted-foreground' : 'hover:bg-muted/50'
        } transition-colors`}
        onClick={toggleExpanded}
      >
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-lg">{category}</h3>
          {isOld && (
            <span className="text-xs px-1.5 py-0.5 bg-muted-foreground/20 rounded text-muted-foreground">
              קודם
            </span>
          )}
        </div>
        <button className="p-1 rounded-full hover:bg-muted transition-colors">
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="p-3 pt-0 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2"
          >
            {words.map((word, index) => (
              <button
                key={index}
                className={`word-chip text-right ${
                  isOld 
                    ? 'bg-muted/70 hover:bg-primary/15' 
                    : 'bg-muted/50 hover:bg-primary/10'
                } p-2 rounded-md transition-colors text-sm`}
                onClick={() => onWordSelect(word)}
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
