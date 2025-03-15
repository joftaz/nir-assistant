
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { TopicCategory } from '@/types/models';
import { getModelResponse } from '@/utils/modelPrompt';
import { useToast } from '@/hooks/use-toast';
import { ConversationItem } from '@/components/ConversationHistory';

export function useTopicGroups() {
  const [topicGroups, setTopicGroups] = useState<TopicCategory[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const { toast } = useToast();

  const handleWordSelect = async (
    word: string, 
    conversation: ConversationItem[], 
    apiKey: string,
    setConversation: React.Dispatch<React.SetStateAction<ConversationItem[]>>,
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    const newMessage: ConversationItem = {
      id: uuidv4(),
      text: word,
      isUser: true,
      timestamp: new Date()
    };
    
    setConversation(prev => [...prev, newMessage]);
    
    setIsLoading(true);
    setIsStreaming(true);
    
    setTopicGroups(currentGroups => 
      currentGroups.map(group => ({
        ...group,
        isCollapsed: true,
        isOld: true
      }))
    );
    
    const effectiveApiKey = apiKey || import.meta.env.VITE_OPENAI_API_KEY || '';
    
    const conversationHistory = conversation.map(item => 
      `${item.isUser ? 'User' : 'Assistant'}: ${item.text}`
    ).join('\n');
    
    const prompt = `${conversationHistory}\nמשתמש: ${word}`;
    console.log(prompt);
    
    console.log("Starting streaming request...");
    const categoryReceived = new Set<string>();
    
    try {
      await getModelResponse(
        prompt, 
        !!effectiveApiKey, 
        effectiveApiKey, 
        (partialResponse) => {
          console.log("Received partial response:", partialResponse);
          
          if (!categoryReceived.has(partialResponse.category)) {
            categoryReceived.add(partialResponse.category);
            
            setTopicGroups(currentGroups => {
              const oldGroups = currentGroups.filter(group => group.isOld);
              const newGroups = currentGroups.filter(group => !group.isOld);
              
              return [
                ...newGroups,
                {...partialResponse, isCollapsed: false, isOld: false},
                ...oldGroups
              ];
            });
          }
        }
      );
    } catch (error) {
      console.error('Error fetching response:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בקבלת תשובה. אנא נסה שוב.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleSubmitTopic = async (
    topic: string, 
    conversation: ConversationItem[], 
    apiKey: string,
    setConversation: React.Dispatch<React.SetStateAction<ConversationItem[]>>,
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    const userMessage: ConversationItem = {
      id: uuidv4(),
      text: topic,
      isUser: true,
      timestamp: new Date()
    };
    
    setConversation(prev => [...prev, userMessage]);
    setIsLoading(true);
    setIsStreaming(true);
    
    setTopicGroups(currentGroups => 
      currentGroups.map(group => ({
        ...group,
        isCollapsed: true,
        isOld: true
      }))
    );
    
    try {
      const effectiveApiKey = apiKey || import.meta.env.VITE_OPENAI_API_KEY || '';
      
      const conversationHistory = conversation.map(item => 
        `${item.isUser ? 'User' : 'Assistant'}: ${item.text}`
      ).join('\n');
      
      const prompt = conversationHistory ? `${conversationHistory}\nמשתמש: ${topic}` : topic;
      
      console.log("Starting streaming request...");
      const categoryReceived = new Set<string>();
      
      await getModelResponse(
        prompt, 
        !!effectiveApiKey, 
        effectiveApiKey, 
        (partialResponse) => {
          console.log("Received partial response:", partialResponse);
          
          if (!categoryReceived.has(partialResponse.category)) {
            categoryReceived.add(partialResponse.category);
            
            setTopicGroups(currentGroups => {
              const oldGroups = currentGroups.filter(group => group.isOld);
              const newGroups = currentGroups.filter(group => !group.isOld);
              
              return [
                ...newGroups,
                {...partialResponse, isCollapsed: false, isOld: false},
                ...oldGroups
              ];
            });
          }
        }
      );
      
      console.log("Streaming request complete");
    } catch (error) {
      console.error('Error fetching response:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בקבלת תשובה. אנא נסה שוב או בדוק את מפתח ה-API.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  return {
    topicGroups,
    setTopicGroups,
    isStreaming,
    handleWordSelect,
    handleSubmitTopic
  };
}
