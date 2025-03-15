import React from 'react';
import { X } from 'lucide-react';

interface StagingAreaProps {
  stagedWords: string[];
  onRemoveWord: (word: string) => void;
  onWordSelect: (word: string) => void;
}

const StagingArea: React.FC<StagingAreaProps> = ({
  stagedWords,
  onRemoveWord,
  onWordSelect
}) => {
  if (stagedWords.length === 0) return null;

  return (
    <div className="w-full max-w-3xl mx-auto mt-2 mb-3 p-3 bg-muted/30 border border-muted rounded-lg">
      <div className="mb-2">
        <h3 className="text-sm font-medium text-muted-foreground" dir="rtl">
          מילים זמניות ({stagedWords.length})
        </h3>
      </div>
      
      <div className="flex flex-wrap gap-1.5 justify-end" dir="rtl">
        {stagedWords.map((word, index) => (
          <div
            key={index}
            className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-sm p-1.5 rounded-lg shadow-sm inline-block whitespace-normal relative group cursor-pointer"
            onClick={() => onWordSelect(word)}
          >
            <span className="inline-block">{word}</span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onRemoveWord(word);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 hover:bg-green-200 dark:hover:bg-green-800/50 rounded-full p-0.5 inline-flex"
              aria-label="Remove word"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StagingArea;
