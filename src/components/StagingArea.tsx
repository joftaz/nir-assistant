
import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

interface StagingAreaProps {
  stagedWords: string[];
  onRemoveWord: (word: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const StagingArea: React.FC<StagingAreaProps> = ({
  stagedWords,
  onRemoveWord,
  onConfirm,
  onCancel
}) => {
  if (stagedWords.length === 0) return null;

  return (
    <div className="w-full max-w-3xl mx-auto mt-2 mb-3 p-3 bg-muted/30 border border-muted rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-muted-foreground" dir="rtl">
          מילים זמניות ({stagedWords.length})
        </h3>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-xs"
            onClick={onCancel}
          >
            <X size={14} className="mr-1" />
            בטל
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="h-7 px-2 text-xs"
            onClick={onConfirm}
            disabled={stagedWords.length === 0}
          >
            <Check size={14} className="mr-1" />
            אשר
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-1.5 justify-end" dir="rtl">
        {stagedWords.map((word, index) => (
          <div
            key={index}
            className="bg-primary/90 text-primary-foreground text-sm p-1.5 rounded-lg shadow-sm inline-block whitespace-normal relative group"
          >
            <span className="inline-block">{word}</span>
            <button 
              onClick={() => onRemoveWord(word)}
              className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 hover:bg-primary-foreground/20 rounded-full p-0.5 inline-flex"
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
