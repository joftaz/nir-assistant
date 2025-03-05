
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface TopicInputProps {
  onSubmit: (topic: string) => void;
  isLoading: boolean;
}

const TopicInput: React.FC<TopicInputProps> = ({ onSubmit, isLoading }) => {
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

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div className="input-container flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="נושא או מילת מפתח..."
          className="flex-1 bg-transparent outline-none text-base px-2 rtl:text-right"
          dir="rtl"
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          size="icon" 
          className={`rounded-full w-8 h-8 flex items-center justify-center transition-all
                     ${!topic.trim() || isLoading ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}`}
          disabled={!topic.trim() || isLoading}
        >
          <Send size={16} className="rotate-[45deg]" />
        </Button>
      </div>
    </form>
  );
};

export default TopicInput;
