
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ConversationItem } from '@/components/ConversationHistory';

export function useStagingArea() {
  const [stagedWords, setStagedWords] = useState<string[]>([]);
  
  const addWordToStaging = (word: string) => {
    setStagedWords(prev => [...prev, word]);
  };
  
  const removeWordFromStaging = (wordToRemove: string) => {
    setStagedWords(prev => prev.filter(word => word !== wordToRemove));
  };
  
  const clearStagingArea = () => {
    setStagedWords([]);
  };
  
  const createMessageFromStaged = (): ConversationItem => {
    return {
      id: uuidv4(),
      text: stagedWords.join(' '),
      isUser: true,
      timestamp: new Date()
    };
  };
  
  return {
    stagedWords,
    addWordToStaging,
    removeWordFromStaging,
    clearStagingArea,
    createMessageFromStaged,
  };
}
