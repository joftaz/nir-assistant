
import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

interface SentencesDisplayProps {
  sentences: string[];
  isLoading: boolean;
  onSelectSentence: (sentence: string) => void;
  onCancel: () => void;
}

const SentencesDisplay: React.FC<SentencesDisplayProps> = ({
  sentences,
  isLoading,
  onSelectSentence,
  onCancel
}) => {
  if (sentences.length === 0 && !isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-3xl mx-auto mt-2 mb-3 p-3 bg-card border border-border rounded-lg shadow-md"
    >
      <div className="mb-2 flex justify-between items-center">
        <h3 className="text-sm font-medium" dir="rtl">
          משפטים מוצעים {isLoading ? '(טוען...)' : `(${sentences.length})`}
        </h3>
        <button 
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted"
          aria-label="סגור משפטים"
          title="סגור משפטים"
        >
          <X size={16} />
        </button>
      </div>
      
      {isLoading ? (
        <div className="py-8 flex justify-center">
          <div className="animate-pulse flex flex-col gap-3 w-full">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-muted/50 rounded-md w-full"></div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2" dir="rtl">
          {sentences.map((sentence, index) => (
            <button
              key={index}
              onClick={() => onSelectSentence(sentence)}
              className="p-3 text-right text-sm bg-muted/30 hover:bg-primary/10 rounded-md transition-colors border border-border/50 hover:border-primary/30"
            >
              {sentence}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default SentencesDisplay;
