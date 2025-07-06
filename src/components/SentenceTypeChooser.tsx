import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

interface SentenceTypeChooserProps {
  onGenerateSentences: (type: string) => void;
  isGenerating: boolean;
}

const sentenceTypes = [
  { key: 'explanation', label: 'הסבר', value: 'Assertives' },
  { key: 'request', label: 'בקשה', value: 'Directives' },
  { key: 'sharing', label: 'שיתוף', value: 'Expressives' },
  { key: 'planning', label: 'תכנון', value: 'Commissives' },
];

const SentenceTypeChooser: React.FC<SentenceTypeChooserProps> = ({ onGenerateSentences, isGenerating }) => {
  const [showTypes, setShowTypes] = useState(false);

  return (
    <div className="flex flex-col gap-3 items-center justify-center px-4 py-2 w-full">
      {!showTypes ? (
        <Button
          data-track-click="Generate sentences type selection clicked"
          data-analytics-button-name="Select sentences type"
          variant="outline"
          className="w-full flex items-center gap-2 justify-center text-lg"
          onClick={() => setShowTypes(true)}
          disabled={isGenerating}
        >
          <MessageSquare className="h-5 w-5" />
          <span>בחר סוג משפט</span>
        </Button>
      ) : (
        <div className="flex flex-row gap-2 w-full">
          {sentenceTypes.map(type => (
            <Button
              data-track-click="Generate sentences type clicked"
              data-analytics-button-name="Generate sentences type"
              data-analitycs-sentence-type={type.value}
              key={type.key}
              variant="outline"
              className="flex-1 rounded-lg text-lg py-4"
              onClick={() => onGenerateSentences(type.value)}
              disabled={isGenerating}
            >
              {type.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SentenceTypeChooser;
