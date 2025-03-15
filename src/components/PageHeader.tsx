
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { RefreshCw, History as HistoryIcon } from 'lucide-react';
import Settings from '@/components/Settings';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  onReset: () => void;
  onSystemPromptChange: (newPrompt: string) => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({ onReset, onSystemPromptChange }) => {
  const navigate = useNavigate();

  return (
    <header className="w-full max-w-3xl mx-auto mb-2 text-center relative">
      <div className="absolute top-0 right-0">
        <Settings onSystemPromptChange={onSystemPromptChange} />
      </div>
      <div className="absolute top-0 left-0 flex gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full"
          title="רענן שיחה"
          aria-label="רענן שיחה"
          onClick={onReset}
        >
          <RefreshCw className="h-5 w-5" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full"
          title="היסטוריית שיחות"
          aria-label="היסטוריית שיחות"
          onClick={() => navigate('/history')}
        >
          <HistoryIcon className="h-5 w-5" />
        </Button>
      </div>
      <motion.h1 
        className="text-xl sm:text-2xl font-semibold mb-1"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        סיוע בשליפת מילים
      </motion.h1>
      <motion.p 
        className="text-muted-foreground text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        הקלד נושא או לחץ על מילים מוצעות להמשך השיחה
      </motion.p>
    </header>
  );
};

export default PageHeader;
