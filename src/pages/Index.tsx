
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion } from 'framer-motion';
import TopicInput from '@/components/TopicInput';
import TopicGroup from '@/components/TopicGroup';
import ConversationHistory, { ConversationItem } from '@/components/ConversationHistory';
import { getMockResponse } from '@/utils/modelPrompt';
import { Loader2 } from 'lucide-react';

interface TopicCategory {
  category: string;
  words: string[];
}

const Index: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  const [topicGroups, setTopicGroups] = useState<TopicCategory[]>([]);

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
      // In production, this would call a real API with the system prompt
      const response = await getMockResponse(topic);
      
      setTopicGroups(response);
    } catch (error) {
      console.error('Error fetching response:', error);
      // Handle error - perhaps show a toast notification
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
    
    // In a real app, this would trigger a new API call with the updated context
    // For now, we'll just simulate some changes to the topic groups
    setIsLoading(true);
    setTimeout(() => {
      getMockResponse(word).then(response => {
        setTopicGroups(response);
        setIsLoading(false);
      });
    }, 500);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-4 py-8 sm:py-12">
      <header className="w-full max-w-3xl mx-auto mb-8 text-center">
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
