
import React from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SentencesDisplayProps {
  sentences: string[];
  onSentenceSelect: (sentence: string) => void;
  onCancel: () => void;
}

const SentencesDisplay: React.FC<SentencesDisplayProps> = ({
  sentences,
  onSentenceSelect,
  onCancel
}) => {
  if (sentences.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-3xl mx-auto border border-primary/20 bg-muted/10 rounded-lg p-3 mb-3 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-sm">בחר משפט:</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-full"
          onClick={onCancel}
        >
          <X size={16} />
        </Button>
      </div>
      <div className="grid gap-2" dir="rtl">
        {sentences.map((sentence, index) => (
          <button
            key={index}
            className="text-right p-2 bg-card hover:bg-primary/10 border border-border rounded-md transition-colors flex justify-between items-center"
            onClick={() => onSentenceSelect(sentence)}
          >
            <span className="text-sm">{sentence}</span>
            <Check size={16} className="text-muted-foreground ml-2 opacity-50" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default SentencesDisplay;
