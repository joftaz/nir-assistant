
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
    <div className="topic-group w-full" dir="rtl">
      <div className="topic-group-header" onClick={toggleExpanded}>
        <span>{category}</span>
        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="topic-group-content"
          >
            {words.map((word, index) => (
              <button
                key={index}
                className="word-chip text-right"
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
