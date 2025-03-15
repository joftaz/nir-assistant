
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'react-router-dom';
import { ConversationItem } from '@/components/ConversationHistory';
import { TopicCategory } from '@/types/models';
import { saveHistory, getHistoryById } from '@/utils/conversationManager';

export function useConversation() {
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  const [conversationId, setConversationId] = useState<string>(uuidv4());
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Load conversation from history if history ID is in URL
  useEffect(() => {
    const historyId = searchParams.get('history');
    if (historyId) {
      const history = getHistoryById(historyId);
      if (history) {
        setConversationId(historyId);
        setConversation(history.messages);
        return {
          topicGroups: history.topicGroups,
          success: true
        };
      } else {
        toast({
          title: "שגיאה",
          description: "לא ניתן לטעון את השיחה המבוקשת",
          variant: "destructive",
        });
        return { success: false };
      }
    }
    return { success: false };
  }, [searchParams, toast]);

  // Save conversation to history when it changes
  useEffect(() => {
    if (conversation.length > 0) {
      const firstUserMessage = conversation.find(item => item.isUser);
      const title = firstUserMessage ? firstUserMessage.text : "שיחה חדשה";
      
      return (topicGroups: TopicCategory[]) => {
        saveHistory(conversationId, title, conversation, topicGroups);
      };
    }
  }, [conversation, conversationId]);

  const handleRemoveMessage = (id: string) => {
    setConversation(prevConversation => {
      const updatedConversation = prevConversation.filter(message => message.id !== id);
      return updatedConversation;
    });
    
    toast({
      title: "הודעה הוסרה",
      description: "ההודעה הוסרה בהצלחה מההיסטוריה",
    });
  };

  const resetConversation = () => {
    setConversation([]);
    setConversationId(uuidv4());
    toast({
      title: "השיחה אופסה",
      description: "השיחה אופסה בהצלחה",
    });
    return conversationId;
  };

  return {
    conversation,
    setConversation,
    conversationId,
    setConversationId,
    handleRemoveMessage,
    resetConversation
  };
}
