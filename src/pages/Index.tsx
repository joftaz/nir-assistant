
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion } from 'framer-motion';
import TopicInput from '@/components/TopicInput';
import TopicGroup from '@/components/TopicGroup';
import ConversationHistory, { ConversationItem } from '@/components/ConversationHistory';
import ApiKeyInput from '@/components/ApiKeyInput';
import Settings from '@/components/Settings';
import { getModelResponse } from '@/utils/modelPrompt';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface TopicCategory {
  category: string;
  words: string[];
}

const Index: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  const [topicGroups, setTopicGroups] = useState<TopicCategory[]>([]);
  const [openAIKey, setOpenAIKey] = useState<string>('');
  const { toast } = useToast();
  
  useEffect(() => {
    // Try to get API key from environment variable
    const envApiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    if (envApiKey) {
      setOpenAIKey(envApiKey);
    }
  }, []);

  const handleSubmitTopic = async (topic: string) => {
    // Add user input to conversation
    const userMessage: ConversationItem = {
      id: uuidv4(),
      text: topic,
      isUser: true,
      timestamp: new Date()
    };
    
    setConversation(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // Call OpenAI if we have a key, otherwise use mock
      const apiKey = openAIKey || import.meta.env.VITE_OPENAI_API_KEY || '';
      const response = await getModelResponse(topic, !!apiKey, apiKey);
      setTopicGroups(response);
    } catch (error) {
      console.error('Error fetching response:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בקבלת תשובה. אנא נסה שוב או בדוק את מפתח ה-API.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWordSelect = (word: string) => {
    // Add selected word to conversation
    const newMessage: ConversationItem = {
      id: uuidv4(),
      text: word,
      isUser: true,
      timestamp: new Date()
    };
    
    setConversation(prev => [...prev, newMessage]);
    
    // Call OpenAI with the selected word
    setIsLoading(true);
    const apiKey = openAIKey || import.meta.env.VITE_OPENAI_API_KEY || '';
    getModelResponse(word, !!apiKey, apiKey)
      .then(response => {
        setTopicGroups(response);
      })
      .catch(error => {
        console.error('Error fetching response:', error);
        toast({
          title: "שגיאה",
          description: "אירעה שגיאה בקבלת תשובה. אנא נסה שוב.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleSaveApiKey = (apiKey: string) => {
    setOpenAIKey(apiKey);
  };

  const handleSystemPromptChange = (newPrompt: string) => {
    // The system prompt is saved in localStorage by the Settings component
    // We don't need to do anything here except maybe refresh data if needed
    toast({
      title: "הודעת מערכת עודכנה",
      description: "השאילתות הבאות ישתמשו בהודעת המערכת החדשה",
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-4 py-8 sm:py-12">
      <header className="w-full max-w-3xl mx-auto mb-8 text-center relative">
        <Settings onSystemPromptChange={handleSystemPromptChange} />
        <motion.h1 
          className="text-2xl sm:text-3xl font-semibold mb-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          סיוע בשליפת מילים
        </motion.h1>
        <motion.p 
          className="text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          הקלד נושא או לחץ על מילים מוצעות להמשך השיחה
        </motion.p>
      </header>

      {/* <ApiKeyInput onSave={handleSaveApiKey} savedKey={openAIKey} /> */}

      <ConversationHistory conversation={conversation} />

      <motion.div 
        className="w-full max-w-3xl mx-auto grid gap-4 sm:gap-6 mt-4 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
          </div>
        ) : (
          topicGroups.map((group, index) => (
            <TopicGroup
              key={`${group.category}-${index}`}
              category={group.category}
              words={group.words}
              onWordSelect={handleWordSelect}
            />
          ))
        )}
      </motion.div>

      <motion.div 
        className="w-full sticky bottom-6 px-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <TopicInput onSubmit={handleSubmitTopic} isLoading={isLoading} />
      </motion.div>
    </div>
  );
};

export default Index;
