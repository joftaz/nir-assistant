
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TopicGroupProps {
  category: string;
  words: string[];
  onWordSelect: (word: string) => void;
}

const TopicGroup: React.FC<TopicGroupProps> = ({ category, words, onWordSelect }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="topic-group w-full border border-border rounded-lg overflow-hidden bg-card shadow-sm" dir="rtl">
      <div 
        className="topic-group-header p-3 flex justify-between items-center cursor-pointer hover:bg-muted/50 transition-colors" 
        onClick={toggleExpanded}
      >
        <h3 className="font-medium text-lg">{category}</h3>
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
                className="word-chip text-right bg-muted/50 hover:bg-primary/10 p-2 rounded-md transition-colors text-sm"
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
