import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import VoiceRecorder from './VoiceRecorder';
import { Input } from '@/components/ui/input';
import { trackEvent } from '@/lib/analytics';

interface TopicInputProps {
  onSubmit: (topic: string) => void;
  isLoading: boolean;
  apiKey?: string;
  placeholder?: string;
  isStreaming?: boolean;
}

const TopicInput: React.FC<TopicInputProps> = ({ 
  onSubmit, 
  isLoading, 
  apiKey = '',
  placeholder = 'הקלד נושא או מילה...',
  isStreaming
}) => {
  const [topic, setTopic] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the input on component mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() && !isLoading) {
      onSubmit(topic.trim());
      setTopic('');
      setTimeout(() => setTopic(''), 0); // Delay clearing for the mixpanel tracking
    }
      setTopic("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (topic.trim() && !isLoading) {
        onSubmit(topic.trim());
        setTopic('');
      }
    }
  };

  const handleTranscription = (text: string) => {
    setTopic(text);
    // Auto-submit if there's a transcription
    if (text && !isLoading) {
      trackEvent('Text transcripted', {"word":text})
      onSubmit(text);
      // Clear after submission
      setTimeout(() => setTopic(''), 100);
    }
  };

  return (
    <div className="w-full flex items-center gap-1">
      {/* Input container with white background and border matching the design */}
      <div className="flex-1 bg-white border border-[#D9D9D9] rounded-full h-[47px] px-4 flex items-center">
        {/* Input field */}
        <Input
          ref={inputRef}
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0 text-[15px] leading-[22px] font-['Heebo'] font-normal rtl:text-right text-[#6C6C6C] placeholder:text-[#6C6C6C] w-full"
          dir="rtl"
          disabled={isLoading}
        />
      </div>
      
      {/* Voice recorder when input is empty, send button when there's text - outside the input box */}
      <div className="relative w-[15.82px] h-[23.07px] flex items-center justify-center flex-none">
        <div className={`absolute inset-0 transition-all duration-300 ease-in-out ${
          topic.trim() ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
        }`}>
          <VoiceRecorder 
            onTranscription={handleTranscription} 
            isLoading={isLoading} 
            apiKey={apiKey}
          />
        </div>
        <div className={`absolute inset-0 transition-all duration-300 ease-in-out ${
          topic.trim() ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        }`}>
          <Button 
            type="button" 
            data-track-click="Send word clicked"
            data-analytics-button-name="Send word"
            data-analitycs-word={topic.trim() || '""'}
            size="icon" 
            variant="ghost"
            className={`rounded-full transition-all w-[15.82px] h-[23.07px] p-0
                       ${isLoading ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}`}
            disabled={isLoading}
            onClick={handleSubmit}
          >
            <Send className="!h-4 !w-4 rotate-[45deg] text-[#6C6C6C]" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TopicInput;
