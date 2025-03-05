import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Settings as SettingsIcon } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { defaultSystemPrompt } from '@/utils/modelPrompt';

const SYSTEM_PROMPT_STORAGE_KEY = 'system_prompt';

interface SettingsProps {
  onSystemPromptChange: (newPrompt: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ onSystemPromptChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Load saved system prompt from localStorage or use default
    const savedPrompt = localStorage.getItem(SYSTEM_PROMPT_STORAGE_KEY);
    if (savedPrompt) {
      setSystemPrompt(savedPrompt);
    } else {
      setSystemPrompt(defaultSystemPrompt);
    }
  }, []);

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem(SYSTEM_PROMPT_STORAGE_KEY, systemPrompt);
    onSystemPromptChange(systemPrompt);
    setIsOpen(false);
    
    toast({
      title: "נשמר בהצלחה",
      description: "הודעת המערכת נשמרה",
    });
  };

  const handleResetToDefault = () => {
    setSystemPrompt(defaultSystemPrompt);
    toast({
      title: "איפוס בוצע",
      description: "הודעת המערכת אופסה לברירת המחדל",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full"
          title="הגדרות"
          aria-label="הגדרות"
        >
          <SettingsIcon className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>הגדרות</DialogTitle>
          <DialogDescription>
            שנה את הודעת המערכת שנשלחת ל-AI
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={15}
            className="font-mono text-sm rtl text-right"
            dir="rtl"
          />
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="outline"
            onClick={handleResetToDefault}
          >
            שחזר ברירת מחדל
          </Button>
          <Button onClick={handleSave}>שמור</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Settings;
