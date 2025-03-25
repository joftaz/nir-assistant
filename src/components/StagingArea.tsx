
import React from 'react';
import { X, Plus, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

interface StagingAreaProps {
  stagedWords: string[];
  onRemoveWord: (word: string) => void;
  onWordSelect: (word: string) => void;
  onCancel: () => void;
  onAddAllWords: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

const StagingArea: React.FC<StagingAreaProps> = ({
  stagedWords,
  onRemoveWord,
  onWordSelect,
  onCancel,
  onAddAllWords,
  onRefresh,
  isLoading = false
}) => {
  if (stagedWords.length === 0) return null;

  return (
    <div className="w-full max-w-3xl mx-auto mt-2 mb-3 p-3 bg-muted/30 border border-muted rounded-lg">
      <div className="mb-2 flex justify-between items-center">
        <h3 className="text-sm font-medium text-muted-foreground" dir="rtl">
          מילים זמניות ({stagedWords.length}) <span className="text-xs font-normal">- לחיצה כדי להוסיף לשיחה</span>
        </h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1 text-xs"
            onClick={onRefresh}
            title="רענן מילים מוצעות"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>רענן</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1 text-xs"
            onClick={onAddAllWords}
            title="הוסף את כל המילים לשיחה"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>הוסף הכל</span>
          </Button>
          <button 
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted"
            aria-label="Cancel staging"
            title="בטל בחירה"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-1.5 justify-end" dir="rtl">
        {stagedWords.map((word, index) => (
          <div
            key={index}
            className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-sm p-1.5 rounded-lg shadow-sm inline-block whitespace-normal relative group cursor-pointer flex items-center"
            onClick={() => onWordSelect(word)}
          >
            <span className="inline-block">{word}</span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onRemoveWord(word);
              }}
              className="ml-0.5 bg-green-200 dark:bg-green-800/50 rounded-full p-0.5 inline-flex"
              aria-label="Remove word"
            >
              <X size={12} className="text-green-800 dark:text-green-200" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StagingArea;
