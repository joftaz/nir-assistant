
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { generateSentences } from '@/utils/openaiService';

export function useSentenceGenerator() {
  const [sentences, setSentences] = useState<string[]>([]);
  const [isGeneratingSentences, setIsGeneratingSentences] = useState(false);
  const { toast } = useToast();
  
  const generateSentencesFromWords = async (words: string[], apiKey: string) => {
    if (words.length === 0) {
      toast({
        title: "אין מילים נבחרות",
        description: "יש לבחור מילים לפני יצירת משפטים",
        variant: "destructive",
      });
      return;
    }
    
    setIsGeneratingSentences(true);
    setSentences([]);
    
    try {
      const generatedSentences = await generateSentences(words.join(' '), apiKey);
      setSentences(generatedSentences);
    } catch (error) {
      console.error('Error generating sentences:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעת יצירת המשפטים. אנא נסה שוב.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSentences(false);
    }
  };
  
  const clearSentences = () => {
    setSentences([]);
  };
  
  return {
    sentences,
    isGeneratingSentences,
    generateSentencesFromWords,
    clearSentences
  };
}
