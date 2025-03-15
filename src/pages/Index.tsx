
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import TopicInput from '@/components/TopicInput';
import ConversationHistory from '@/components/ConversationHistory';
import { initializeSystemPrompt } from '@/utils/modelPrompt';
import { useToast } from '@/hooks/use-toast';
import { useConversation } from '@/hooks/use-conversation';
import { useTopicGroups } from '@/hooks/use-topic-groups';
import { useApiKey } from '@/hooks/use-api-key';
import PageHeader from '@/components/PageHeader';
import TopicGroupsList from '@/components/TopicGroupsList';

const Index: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const { 
    conversation, 
    setConversation, 
    handleRemoveMessage, 
    resetConversation 
  } = useConversation();
  
  const {
    topicGroups,
    setTopicGroups,
    isStreaming,
    handleWordSelect: processWordSelection,
    handleSubmitTopic: processTopicSubmission
  } = useTopicGroups();
  
  const { openAIKey, handleSaveApiKey } = useApiKey();
  
  useEffect(() => {
    initializeSystemPrompt();
  }, []);
  
  const handleSubmitTopic = async (topic: string) => {
    await processTopicSubmission(topic, conversation, openAIKey, setConversation, setIsLoading);
  };

  const handleWordSelect = async (word: string) => {
    await processWordSelection(word, conversation, openAIKey, setConversation, setIsLoading);
  };

  const handleSystemPromptChange = (newPrompt: string) => {
    toast({
      title: "הודעת מערכת עודכנה",
      description: "השאילתות הבאות ישתמשו בהודעת המערכת החדשה",
    });
  };

  const handleReset = () => {
    resetConversation();
    setTopicGroups([]);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-4 py-4 sm:py-6">
      <PageHeader 
        onReset={handleReset}
        onSystemPromptChange={handleSystemPromptChange}
      />

      <ConversationHistory 
        conversation={conversation} 
        onRemoveMessage={handleRemoveMessage}
      />

      <TopicGroupsList
        isLoading={isLoading}
        topicGroups={topicGroups}
        isStreaming={isStreaming}
        onWordSelect={handleWordSelect}
      />

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
