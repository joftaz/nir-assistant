
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { generateSentences } from '@/utils/openaiService';
import { ConversationItem } from '@/components/ConversationHistory';

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
  
  const generateSentencesFromConversation = async (conversation: ConversationItem[], apiKey: string) => {
    if (conversation.length === 0) {
      toast({
        title: "אין מילים בשיחה",
        description: "יש להוסיף מילים לשיחה לפני יצירת משפטים",
        variant: "destructive",
      });
      return;
    }
    
    setIsGeneratingSentences(true);
    setSentences([]);
    
    try {
      // Extract all user words from the conversation
      const userWords = conversation
        .filter(item => item.isUser)
        .map(item => item.text)
        .join(' ');
      
      const generatedSentences = await generateSentences(userWords, apiKey);
      setSentences(generatedSentences);
    } catch (error) {
      console.error('Error generating sentences from conversation:', error);
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
    generateSentencesFromConversation,
    clearSentences
  };
}
