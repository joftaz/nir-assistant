
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
        className={`topic-group-header py-1.5 px-2 flex justify-between items-center cursor-pointer ${
          isOld ? 'hover:bg-muted/60 text-muted-foreground' : 'hover:bg-muted/50'
        } transition-colors`}
        onClick={toggleExpanded}
      >
        <div className="flex items-center gap-1.5">
          <h3 className="font-medium text-base">{category}</h3>
          {isOld && (
            <span className="text-xs px-1 py-0.5 bg-muted-foreground/20 rounded text-muted-foreground">
              קודם
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
            className="p-1.5 pt-0 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5"
          >
            {words.map((word, index) => (
              <button
                key={index}
                className={`word-chip text-right text-xs ${
                  isOld 
                    ? 'bg-muted/70 hover:bg-primary/15' 
                    : 'bg-muted/50 hover:bg-primary/10'
                } py-1 px-1.5 rounded-md transition-colors inline-flex`}
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
