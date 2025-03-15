
import { useState, useEffect } from 'react';

export function useApiKey() {
  const [openAIKey, setOpenAIKey] = useState<string>('');
  
  useEffect(() => {
    const envApiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    if (envApiKey) {
      setOpenAIKey(envApiKey);
    }
  }, []);

  const handleSaveApiKey = (apiKey: string) => {
    setOpenAIKey(apiKey);
  };

  return {
    openAIKey,
    handleSaveApiKey
  };
}
