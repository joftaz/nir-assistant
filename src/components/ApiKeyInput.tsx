
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface ApiKeyInputProps {
  onSave: (apiKey: string) => void;
  savedKey?: string;
}

const API_KEY_STORAGE_KEY = 'openai_api_key';

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onSave, savedKey }) => {
  const [apiKey, setApiKey] = useState(savedKey || '');
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Try to load from localStorage on mount
    const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (storedKey) {
      setApiKey(storedKey);
      onSave(storedKey);
    }
  }, [onSave]);

  const handleSave = () => {
    if (!apiKey.trim()) {
      toast({
        title: "שגיאה",
        description: "אנא הזן מפתח API תקף",
        variant: "destructive",
      });
      return;
    }

    // Save to localStorage
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    onSave(apiKey);
    setIsVisible(false);
    
    toast({
      title: "נשמר בהצלחה",
      description: "מפתח ה-API נשמר",
    });
  };

  return (
    <div className="w-full max-w-xs mx-auto mb-6">
      {isVisible ? (
        <div className="flex flex-col gap-2 p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-900">
          <div className="text-sm font-medium mb-1 text-right">OpenAI API Key</div>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="text-right"
            dir="ltr"
          />
          <div className="flex gap-2 justify-end mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsVisible(false)}
            >
              ביטול
            </Button>
            <Button 
              size="sm"
              onClick={handleSave}
            >
              שמור
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          className="text-xs px-3 py-1 h-auto opacity-80 hover:opacity-100"
          onClick={() => setIsVisible(true)}
        >
          {apiKey ? 'שנה מפתח API' : 'הגדר מפתח OpenAI API'}
        </Button>
      )}
    </div>
  );
};

export default ApiKeyInput;
