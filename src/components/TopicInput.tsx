
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import VoiceRecorder from './VoiceRecorder';
import { Input } from '@/components/ui/input';

interface TopicInputProps {
  onSubmit: (topic: string) => void;
  isLoading: boolean;
  apiKey?: string;
}

const TopicInput: React.FC<TopicInputProps> = ({ onSubmit, isLoading, apiKey = '' }) => {
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
    }
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
      onSubmit(text);
      // Clear after submission
      setTimeout(() => setTopic(''), 100);
    }
  };

  return (
    <form onSubmit={(e) => e.preventDefault()} className="w-full max-w-3xl mx-auto">
      <div className="flex items-center gap-1 bg-background/80 backdrop-blur-sm border rounded-full px-3 py-1 shadow-sm">
        <VoiceRecorder 
          onTranscription={handleTranscription} 
          isLoading={isLoading} 
          apiKey={apiKey}
        />
        
        <Input
          ref={inputRef}
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="נושא או מילת מפתח..."
          className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 text-base rtl:text-right"
          dir="rtl"
          disabled={isLoading}
        />
        
        <Button 
          type="button" 
          size="icon" 
          className={`rounded-full w-7 h-7 flex items-center justify-center transition-all
                     ${!topic.trim() || isLoading ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}`}
          disabled={!topic.trim() || isLoading}
          onClick={handleSubmit}
        >
          <Send size={14} className="rotate-[45deg]" />
        </Button>
      </div>
    </form>
  );
};

export default TopicInput;
