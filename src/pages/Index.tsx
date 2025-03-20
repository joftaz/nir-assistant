import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TopicInput from '@/components/TopicInput';
import TopicGroup from '@/components/TopicGroup';
import StagingArea from '@/components/StagingArea';
import SentencesDisplay from '@/components/SentencesDisplay';
import ConversationHistory, { ConversationItem } from '@/components/ConversationHistory';
import ApiKeyInput from '@/components/ApiKeyInput';
import Settings from '@/components/Settings';
import { getModelResponse, initializeSystemPrompt } from '@/utils/modelPrompt';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, History as HistoryIcon, MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { saveHistory, getHistoryById } from '@/utils/conversationManager';
import { TopicCategory } from '@/types/models';
import { useStagingArea } from '@/hooks/use-staging-area';
import { useSentenceGenerator } from '@/hooks/use-sentence-generator';

const Index: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  const [topicGroups, setTopicGroups] = useState<TopicCategory[]>([]);
  const [stagingTopicGroups, setStagingTopicGroups] = useState<TopicCategory[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [openAIKey, setOpenAIKey] = useState<string>('');
  const [conversationId, setConversationId] = useState<string>(uuidv4());
  const [isStaging, setIsStaging] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const {
    stagedWords,
    addWordToStaging,
    removeWordFromStaging,
    clearStagingArea,
    createMessageFromStaged
  } = useStagingArea();
  
  const {
    sentences,
    isGeneratingSentences,
    generateSentencesFromWords,
    generateSentencesFromConversation,
    clearSentences
  } = useSentenceGenerator();
  
  const [showingSentences, setShowingSentences] = useState(false);
  
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
      
      const updatedConversation = [...conversation, userMessage];
      const allUserWords = updatedConversation
        .filter(item => item.isUser)
        .map(item => item.text);
      
      const prompt = conversationHistory 
        ? `${conversationHistory}\nמשתמש: ${topic}\n\nהערה למודל: המילים הבאות כבר נבחרו, אנא הצע מילים חדשות שקשורות לנושא אך שונות מאלו: ${allUserWords.join(', ')}`
        : `משתמש: ${topic}`;
      
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
            
            const filteredWords = partialResponse.words.filter(
              suggestedWord => !allUserWords.includes(suggestedWord)
            );
            
            setTopicGroups(currentGroups => {
              const oldGroups = currentGroups.filter(group => group.isOld);
              const newGroups = currentGroups.filter(group => !group.isOld);
              
              return [
                ...newGroups,
                {
                  ...partialResponse, 
                  words: filteredWords,
                  isCollapsed: false, 
                  isOld: false
                },
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
    addWordToStaging(word);
    
    if (!isStaging) {
      setIsStaging(true);
    }
    
    setStagingTopicGroups([]);
    
    setIsLoading(true);
    setIsStreaming(true);
    
    const apiKey = openAIKey || import.meta.env.VITE_OPENAI_API_KEY || '';
    
    const conversationHistory = conversation.map(item => 
      `${item.isUser ? 'User' : 'Assistant'}: ${item.text}`
    ).join('\n');
    
    const allStagedWords = [...stagedWords, word];
    
    const prompt = `${conversationHistory}\nמשתמש: ${allStagedWords.join(' ')}\n\nהערה למודל: המילים הבאות כבר נבחרו, אנא הצע מילים חדשות שקשורות לנושא אך שונות מאלו: ${allStagedWords.join(', ')}`;
    
    console.log(prompt);
    
    console.log("Starting streaming request for staging...");
    const categoryReceived = new Set<string>();
    
    getModelResponse(
      prompt, 
      !!apiKey, 
      apiKey, 
      (partialResponse) => {
        console.log("Received partial response for staging:", partialResponse);
        
        if (!categoryReceived.has(partialResponse.category)) {
          categoryReceived.add(partialResponse.category);
          
          const filteredWords = partialResponse.words.filter(
            suggestedWord => !allStagedWords.includes(suggestedWord)
          );
          
          setStagingTopicGroups(currentGroups => {
            return [
              ...currentGroups.filter(group => !group.isOld),
              {
                ...partialResponse, 
                words: filteredWords,
                isCollapsed: false, 
                isOld: false, 
                isStaging: true
              }
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

  const handleStagingWordSelect = (word: string) => {
    const newMessage: ConversationItem = {
      id: uuidv4(),
      text: word,
      isUser: true,
      timestamp: new Date()
    };
    
    setConversation(prev => [...prev, newMessage]);
    
    setIsStaging(false);
    clearStagingArea();
    setStagingTopicGroups([]);
    
    toast({
      title: "נוספה מילה",
      description: `המילה "${word}" נוספה לשיחה בהצלחה`,
    });
    
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
    
    const updatedConversation = [...conversation, newMessage];
    const conversationHistory = updatedConversation.map(item => 
      `${item.isUser ? 'User' : 'Assistant'}: ${item.text}`
    ).join('\n');
    
    const allUserWords = updatedConversation
      .filter(item => item.isUser)
      .map(item => item.text);
    
    const prompt = `${conversationHistory}\n\nהערה למודל: המילים הבאות כבר נבחרו, אנא הצע מילים חדשות שקשורות לנושא אך שונות מאלו: ${allUserWords.join(', ')}`;
    
    console.log("Regenerating categories after staging word selection:", prompt);
    
    const categoryReceived = new Set<string>();
    
    getModelResponse(
      prompt, 
      !!apiKey, 
      apiKey, 
      (partialResponse) => {
        console.log("Received partial response for regeneration:", partialResponse);
        
        if (!categoryReceived.has(partialResponse.category)) {
          categoryReceived.add(partialResponse.category);
          
          const filteredWords = partialResponse.words.filter(
            suggestedWord => !allUserWords.includes(suggestedWord)
          );
          
          setTopicGroups(currentGroups => {
            const oldGroups = currentGroups.filter(group => group.isOld);
            const newGroups = currentGroups.filter(group => !group.isOld);
            
            return [
              ...newGroups,
              {
                ...partialResponse, 
                words: filteredWords,
                isCollapsed: false, 
                isOld: false
              },
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

  const handleStagingConfirm = () => {
    if (stagedWords.length === 0) return;
    
    const newMessage = createMessageFromStaged();
    setConversation(prev => [...prev, newMessage]);
    
    setIsStaging(false);
    clearStagingArea();
    setStagingTopicGroups([]);
    
    toast({
      title: "נוספו מילים",
      description: `המילים נוספו לשיחה בהצלחה: ${stagedWords.join(' ')}`,
    });
  };
  
  const handleStagingCancel = () => {
    setIsStaging(false);
    clearStagingArea();
    setStagingTopicGroups([]);
    
    toast({
      title: "בוטלה בחירה",
      description: "המילים הזמניות נמחקו",
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
    clearSentences();
    setShowingSentences(false);
    
    setConversation([]);
    setTopicGroups([]);
    setConversationId(uuidv4());
    setIsStaging(false);
    clearStagingArea();
    setStagingTopicGroups([]);
    toast({
      title: "השיחה אופסה",
      description: "השיחה אופסה בהצלחה",
    });
  };

  const handleRemoveMessage = (id: string) => {
    const messageToRemove = conversation.find(item => item.id === id);
    
    if (messageToRemove && messageToRemove.isUser) {
      setConversation(prev => prev.filter(item => item.id !== id));
      
      toast({
        title: "הודעה הוסרה",
        description: "ההודעה הוסרה בהצלחה",
      });
    }
  };
  
  const handleGenerateSentences = async () => {
    if (stagedWords.length === 0) {
      toast({
        title: "אין מילים נבחרות",
        description: "יש לבחור מילים לפני יצירת משפטים",
        variant: "destructive",
      });
      return;
    }
    
    setShowingSentences(true);
    
    const apiKey = openAIKey || import.meta.env.VITE_OPENAI_API_KEY || '';
    await generateSentencesFromWords(stagedWords, apiKey);
  };
  
  const handleGenerateSentencesFromConversation = async () => {
    if (conversation.length === 0) {
      toast({
        title: "אין מילים בשיחה",
        description: "יש להוסיף מילים לשיחה לפני יצירת משפטים",
        variant: "destructive",
      });
      return;
    }
    
    setShowingSentences(true);
    
    setTopicGroups(currentGroups => 
      currentGroups.map(group => ({
        ...group,
        isCollapsed: true,
        isOld: true
      }))
    );
    
    if (isStaging) {
      setIsStaging(false);
      clearStagingArea();
      setStagingTopicGroups([]);
    }
    
    const apiKey = openAIKey || import.meta.env.VITE_OPENAI_API_KEY || '';
    await generateSentencesFromConversation(conversation, apiKey);
  };
  
  const handleSentenceSelect = (sentence: string) => {
    const newMessage: ConversationItem = {
      id: uuidv4(),
      text: sentence,
      isUser: true,
      timestamp: new Date()
    };
    
    setConversation(prev => [...prev, newMessage]);
    
    setIsStaging(false);
    clearStagingArea();
    clearSentences();
    setShowingSentences(false);
    setStagingTopicGroups([]);
    
    toast({
      title: "נוסף משפט",
      description: `המשפט נוסף לשיחה בהצלחה`,
    });
    
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
    
    const updatedConversation = [...conversation, newMessage];
    const conversationHistory = updatedConversation.map(item => 
      `${item.isUser ? 'User' : 'Assistant'}: ${item.text}`
    ).join('\n');
    
    const allUserWords = updatedConversation
      .filter(item => item.isUser)
      .map(item => item.text);
    
    const prompt = `${conversationHistory}\n\nהערה למודל: המילים הבאות כבר נבחרו, אנא הצע מילים חדשות שקשורות לנושא אך שונות מאלו: ${allUserWords.join(', ')}`;
    
    console.log("Regenerating categories after sentence selection:", prompt);
    
    const categoryReceived = new Set<string>();
    
    getModelResponse(
      prompt, 
      !!apiKey, 
      apiKey, 
      (partialResponse) => {
        console.log("Received partial response for regeneration:", partialResponse);
        
        if (!categoryReceived.has(partialResponse.category)) {
          categoryReceived.add(partialResponse.category);
          
          const filteredWords = partialResponse.words.filter(
            suggestedWord => !allUserWords.includes(suggestedWord)
          );
          
          setTopicGroups(currentGroups => {
            const oldGroups = currentGroups.filter(group => group.isOld);
            const newGroups = currentGroups.filter(group => !group.isOld);
            
            return [
              ...newGroups,
              {
                ...partialResponse, 
                words: filteredWords,
                isCollapsed: false, 
                isOld: false
              },
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
  
  const handleCancelSentences = () => {
    clearSentences();
    setShowingSentences(false);
  };

  const activeTopicGroups = isStaging ? stagingTopicGroups : topicGroups;
  
  const hasUserMessages = conversation.some(item => item.isUser);

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

      {isStaging && (
        <StagingArea
          stagedWords={stagedWords}
          onRemoveWord={removeWordFromStaging}
          onWordSelect={handleStagingWordSelect}
          onCancel={handleStagingCancel}
        />
      )}
      
      {showingSentences && (
        <SentencesDisplay
          sentences={sentences}
          isLoading={isGeneratingSentences}
          onSelectSentence={handleSentenceSelect}
          onCancel={handleCancelSentences}
          onGenerateMore={handleGenerateSentencesFromConversation}
        />
      )}
      
      {!isStaging &&hasUserMessages && !showingSentences && (
        <div className="w-full max-w-3xl mx-auto flex justify-center mt-2 mb-2">
          <Button
            variant="outline"
            onClick={handleGenerateSentencesFromConversation}
            disabled={isGeneratingSentences || conversation.length === 0}
            className="gap-2 rtl:flex-row-reverse"
          >
            {isGeneratingSentences ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageSquare className="h-4 w-4" />
            )}
            <span>יצירת משפטים מהשיחה</span>
          </Button>
        </div>
      )}
      
      {false && isStaging && !showingSentences && (
        <div className="w-full max-w-3xl mx-auto flex justify-center mt-2">
          <Button
            variant="secondary"
            onClick={handleGenerateSentences}
            disabled={isGeneratingSentences || stagedWords.length === 0}
            className="gap-2 rtl:flex-row-reverse"
          >
            {isGeneratingSentences ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageSquare className="h-4 w-4" />
            )}
            <span>יצירת משפטים מהמילים הנבחרות</span>
          </Button>
        </div>
      )}

      {!showingSentences && (
        <motion.div 
          className="w-full max-w-3xl mx-auto grid gap-2 sm:gap-3 mt-2 mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {isLoading && activeTopicGroups.length === 0 ? (
            <div className="flex justify-center items-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full">
                {activeTopicGroups.map((group, index) => (
                  <TopicGroup
                    key={`${group.category}-${index}-${isStaging ? 'staging' : 'main'}`}
                    category={group.category}
                    words={group.words}
                    onWordSelect={handleWordSelect}
                    isCollapsed={group.isCollapsed}
                    isOld={group.isOld}
                    isStaging={isStaging}
                  />
                ))}
              </div>
              {isStreaming && (
                <div className="flex justify-center items-center py-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary/70" />
                </div>
              )}
              {!isStreaming && activeTopicGroups.length > 0 && activeTopicGroups.some(group => !group.isCollapsed) && (
                <div className="text-center text-xs text-muted-foreground py-1">
                  ⤴ קבוצות חדשות | קבוצות קודמות ⤵
                </div>
              )}
            </>
          )}
        </motion.div>
      )}

      <motion.div 
        className="w-full sticky bottom-2 px-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <TopicInput 
          onSubmit={handleSubmitTopic} 
          isLoading={isLoading || isStaging || showingSentences} 
          apiKey={openAIKey}
        />
      </motion.div>
    </div>
  );
};

export default Index;
