
import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SentencesDisplayProps {
  sentences: string[];
  onSentenceSelect: (sentence: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const SentencesDisplay: React.FC<SentencesDisplayProps> = ({
  sentences,
  onSentenceSelect,
  onCancel,
  isLoading
}) => {
  if (sentences.length === 0 && !isLoading) return null;

  return (
    <div className="w-full max-w-3xl mx-auto mt-2 mb-3 p-3 bg-muted/30 border border-muted rounded-lg">
      <div className="mb-2 flex justify-between items-center">
        <h3 className="text-sm font-medium text-muted-foreground" dir="rtl">
          משפטים מוצעים {sentences.length > 0 ? `(${sentences.length})` : ''} <span className="text-xs font-normal">- לחיצה כדי לבחור משפט</span>
        </h3>
        <button 
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted"
          aria-label="Cancel sentences"
          title="בטל הצעות"
        >
          <X size={16} />
        </button>
      </div>
      
      <div className="flex flex-col gap-2" dir="rtl">
        {isLoading ? (
          <div className="py-2 text-center text-sm text-muted-foreground">
            מייצר משפטים...
          </div>
        ) : (
          sentences.map((sentence, index) => (
            <button
              key={index}
              className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-sm p-2.5 rounded-lg shadow-sm text-right whitespace-normal relative group hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
              onClick={() => onSentenceSelect(sentence)}
            >
              <span className="inline-block">{sentence}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default SentencesDisplay;
