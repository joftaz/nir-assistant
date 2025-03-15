import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TopicInput from '@/components/TopicInput';
import TopicGroup from '@/components/TopicGroup';
import ConversationHistory, { ConversationItem } from '@/components/ConversationHistory';
import ApiKeyInput from '@/components/ApiKeyInput';
import Settings from '@/components/Settings';
import { getModelResponse, initializeSystemPrompt } from '@/utils/modelPrompt';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, History as HistoryIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { saveHistory, getHistoryById } from '@/utils/conversationManager';
import { TopicCategory } from '@/types/models';

const Index: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  const [topicGroups, setTopicGroups] = useState<TopicCategory[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [openAIKey, setOpenAIKey] = useState<string>('');
  const [conversationId, setConversationId] = useState<string>(uuidv4());
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    const envApiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    if (envApiKey) {
      setOpenAIKey(envApiKey);
    }
    
    initializeSystemPrompt();
    
    const historyId = searchParams.get('history');
    if (historyId) {
      const history = getHistoryById(historyId);
      if (history) {
        setConversationId(historyId);
        setConversation(history.messages);
        setTopicGroups(history.topicGroups);
        toast({
          title: "השיחה נטענה",
          description: "השיחה הקודמת נטענה בהצלחה",
        });
      } else {
        toast({
          title: "שגיאה",
          description: "לא ניתן לטעון את השיחה המבוקשת",
          variant: "destructive",
        });
      }
    }
  }, [searchParams, toast]);
  
  useEffect(() => {
    if (conversation.length > 0) {
      const firstUserMessage = conversation.find(item => item.isUser);
      const title = firstUserMessage ? firstUserMessage.text : "שיחה חדשה";
      
      saveHistory(conversationId, title, conversation, topicGroups);
    }
  }, [conversation, topicGroups, conversationId]);

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

  const handleSubmitTopic = async (topic: string) => {
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
      const apiKey = openAIKey || import.meta.env.VITE_OPENAI_API_KEY || '';
      
      const conversationHistory = conversation.map(item => 
        `${item.isUser ? 'User' : 'Assistant'}: ${item.text}`
      ).join('\n');
      
      const prompt = conversationHistory ? `${conversationHistory}\nמשתמש: ${topic}` : topic;
      
      console.log("Starting streaming request...");
      const categoryReceived = new Set<string>();
      
      await getModelResponse(
        prompt, 
        !!apiKey, 
        apiKey, 
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

  const handleWordSelect = (word: string) => {
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
    
    const apiKey = openAIKey || import.meta.env.VITE_OPENAI_API_KEY || '';
    
    const conversationHistory = conversation.map(item => 
      `${item.isUser ? 'User' : 'Assistant'}: ${item.text}`
    ).join('\n');
    
    const prompt = `${conversationHistory}\nמשתמש: ${word}`;
    console.log(prompt);
    
    console.log("Starting streaming request...");
    const categoryReceived = new Set<string>();
    
    getModelResponse(
      prompt, 
      !!apiKey, 
      apiKey, 
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
    ).catch(error => {
      console.error('Error fetching response:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בקבלת תשובה. אנא נסה שוב.",
        variant: "destructive",
      });
    }).finally(() => {
      setIsLoading(false);
      setIsStreaming(false);
    });
  };

  const handleSaveApiKey = (apiKey: string) => {
    setOpenAIKey(apiKey);
  };

  const handleSystemPromptChange = (newPrompt: string) => {
    toast({
      title: "הודעת מערכת עודכנה",
      description: "השאילתות הבאות ישתמשו בהודעת המערכת החדשה",
    });
  };

  const handleReset = () => {
    setConversation([]);
    setTopicGroups([]);
    setConversationId(uuidv4());
    toast({
      title: "השיחה אופסה",
      description: "השיחה אופסה בהצלחה",
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-4 py-4 sm:py-6">
      <header className="w-full max-w-3xl mx-auto mb-2 text-center relative">
        <div className="absolute top-0 right-0">
          <Settings onSystemPromptChange={handleSystemPromptChange} />
        </div>
        <div className="absolute top-0 left-0 flex gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            title="רענן שיחה"
            aria-label="רענן שיחה"
            onClick={handleReset}
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

      <ConversationHistory 
        conversation={conversation} 
        onRemoveMessage={handleRemoveMessage}
      />

      <motion.div 
        className="w-full max-w-3xl mx-auto grid gap-2 sm:gap-3 mt-2 mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {isLoading && topicGroups.length === 0 ? (
          <div className="flex justify-center items-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
          </div>
        ) : (
          <>
            {topicGroups.map((group, index) => (
              <TopicGroup
                key={`${group.category}-${index}`}
                category={group.category}
                words={group.words}
                onWordSelect={handleWordSelect}
                isCollapsed={group.isCollapsed}
                isOld={group.isOld}
              />
            ))}
            {isStreaming && (
              <div className="flex justify-center items-center py-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary/70" />
              </div>
            )}
            {!isStreaming && topicGroups.length > 0 && topicGroups.some(group => !group.isCollapsed) && (
              <div className="text-center text-xs text-muted-foreground py-1">
                ⤴ קבוצות חדשות | קבוצות קודמות ⤵
              </div>
            )}
          </>
        )}
      </motion.div>

      <motion.div 
        className="w-full sticky bottom-2 px-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <TopicInput 
          onSubmit={handleSubmitTopic} 
          isLoading={isLoading} 
          apiKey={openAIKey}
        />
      </motion.div>
    </div>
  );
};

export default Index;
