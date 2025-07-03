import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { generateSentences } from '@/utils/openaiService';
import { ConversationItem } from '@/components/ConversationHistory';

export function useSentenceGenerator() {
  const [sentences, setSentences] = useState<string[]>([]);
  const [oldSentences, setOldSentences] = useState<string[]>([]);
  const [isGeneratingSentences, setIsGeneratingSentences] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const { toast } = useToast();
  
  // Helper function to add a sentence while preventing duplicates
  const addSentence = (partialSentence: string) => {
    setSentences(prev => {
      // Check if sentence already exists (case insensitive comparison)
      const isDuplicate = prev.some(s => 
        s.toLowerCase().trim() === partialSentence.toLowerCase().trim()
      );
      
      if (isDuplicate) return prev;
      
      // Add the new sentence
      console.log("Adding new sentence to UI:", partialSentence);
      return [...prev, partialSentence];
    });
  };
  
  const generateSentencesFromWords = async (words: string[], apiKey: string, isConversationMode: boolean = false, isChildrenMode: boolean = false, type: string = "") => {
    if (words.length === 0) {
      toast({
        title: "אין מילים נבחרות",
        description: "יש לבחור מילים לפני יצירת משפטים",
        variant: "destructive",
      });
      return;
    }
    
    // Move current sentences to old sentences
    setOldSentences(prev => [...prev, ...sentences]);
    
    setIsGeneratingSentences(true);
    setIsStreaming(true);
    setSentences([]);
    
    try {
      // Use the streaming version with callback
      const generatedSentences = await generateSentences(
        words.join(' '), 
        apiKey,
        (partialSentence) => {
          addSentence(partialSentence);
        },
        isConversationMode,
        isChildrenMode,
        type
      );
      
      // Ensure all sentences from the final list are included
      setTimeout(() => {
        generatedSentences.forEach(sentence => {
          addSentence(sentence);
        });
      }, 100);
      
    } catch (error) {
      console.error('Error generating sentences:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעת יצירת המשפטים. אנא נסה שוב.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setIsGeneratingSentences(false);
        setIsStreaming(false);
      }, 300); // Small delay to ensure UI updates are complete
    }
  };
  
  const generateSentencesFromConversation = async (conversation: ConversationItem[], apiKey: string, isConversationMode: boolean = false, isChildrenMode: boolean = false, type: string = "") => {
    if (conversation.length === 0) {
      toast({
        title: "אין מילים בשיחה",
        description: "יש להוסיף מילים לשיחה לפני יצירת משפטים",
        variant: "destructive",
      });
      return;
    }
    
    // Move current sentences to old sentences
    setOldSentences(prev => [...prev, ...sentences]);
    
    setIsGeneratingSentences(true);
    setIsStreaming(true);
    setSentences([]);
    
    try {
      // Extract all user words from the conversation
      const userWords = conversation
        .filter(item => item.isUser)
        .map(item => item.text)
        .join(' ');
      
      // Use the streaming version with callback
      const generatedSentences = await generateSentences(
        userWords, 
        apiKey,
        (partialSentence) => {
          addSentence(partialSentence);
        },
        isConversationMode,
        isChildrenMode,
        type
      );
      
      // Ensure all sentences from the final list are included
      setTimeout(() => {
        generatedSentences.forEach(sentence => {
          addSentence(sentence);
        });
      }, 100);
      
    } catch (error) {
      console.error('Error generating sentences from conversation:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעת יצירת המשפטים. אנא נסה שוב.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setIsGeneratingSentences(false);
        setIsStreaming(false);
      }, 300); // Small delay to ensure UI updates are complete
    }
  };
  
  const clearSentences = (keepHistory = false) => {
    if (keepHistory) {
      setOldSentences(prev => [...prev, ...sentences]);
    } else {
      setOldSentences([]);
    }
    setSentences([]);
  };
  
  return {
    sentences,
    oldSentences,
    isGeneratingSentences,
    isStreaming,
    generateSentencesFromWords,
    generateSentencesFromConversation,
    clearSentences
  };
}
