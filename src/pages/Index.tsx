import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TopicInput from '@/components/TopicInput';
import TopicGroup from '@/components/TopicGroup';
import StagingArea from '@/components/StagingArea';
import ConversationHistory, { ConversationItem } from '@/components/ConversationHistory';
import ApiKeyInput from '@/components/ApiKeyInput';
import Settings from '@/components/Settings';
import SentencesDisplay from '@/components/SentencesDisplay';
import { getModelResponse, initializeSystemPrompt } from '@/utils/modelPrompt';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, History as HistoryIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { saveHistory, getHistoryById } from '@/utils/conversationManager';
import { TopicCategory } from '@/types/models';
import { useStagingArea } from '@/hooks/use-staging-area';

const Index: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  const [topicGroups, setTopicGroups] = useState<TopicCategory[]>([]);
  const [stagingTopicGroups, setStagingTopicGroups] = useState<TopicCategory[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [openAIKey, setOpenAIKey] = useState<string>('');
  const [conversationId, setConversationId] = useState<string>(uuidv4());
  const [isStaging, setIsStaging] = useState(false);
  
  // Add new state for sentences
  const [sentences, setSentences] = useState<string[]>([]);
  const [isSentenceMode, setIsSentenceMode] = useState(false);
  const [sentenceSourceWords, setSentenceSourceWords] = useState<string[]>([]);
  
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
    // If we're in sentence mode, cancel it when submitting a new topic
    if (isSentenceMode) {
      setIsSentenceMode(false);
      setSentences([]);
    }
    
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
      
      // Get all user words from the conversation to avoid repeating them
      const updatedConversation = [...conversation, userMessage];
      const allUserWords = updatedConversation
        .filter(item => item.isUser)
        .map(item => item.text);
      
      // Create a prompt that includes the topic and instructs the model not to repeat words already used
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
            
            // Filter out any words that are already in the conversation
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
    // If we're in sentence mode, cancel it when selecting a word
    if (isSentenceMode) {
      setIsSentenceMode(false);
      setSentences([]);
    }
    
    // Always add the word to staging area
    addWordToStaging(word);
    
    // If not already in staging mode, set it
    if (!isStaging) {
      setIsStaging(true);
    }
    
    // Clear existing staging topic groups to ensure fresh categories
    setStagingTopicGroups([]);
    
    setIsLoading(true);
    setIsStreaming(true);
    
    const apiKey = openAIKey || import.meta.env.VITE_OPENAI_API_KEY || '';
    
    // Create conversation history including all staged words
    const conversationHistory = conversation.map(item => 
      `${item.isUser ? 'User' : 'Assistant'}: ${item.text}`
    ).join('\n');
    
    // Include all staged words in the prompt
    const allStagedWords = [...stagedWords, word];
    
    // Create a prompt that includes the staged words and instructs the model not to repeat them
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
          
          // Filter out any words that are already in the staging area
          const filteredWords = partialResponse.words.filter(
            suggestedWord => !allStagedWords.includes(suggestedWord)
          );
          
          setStagingTopicGroups(currentGroups => {
            // Don't preserve old groups, always show fresh categories
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

  // New function to handle creating sentences from words
  const handleCreateSentences = async (words: string[]) => {
    // Don't allow sentence creation if already in sentence mode
    if (isSentenceMode) return;
    
    setIsSentenceMode(true);
    setSentenceSourceWords(words);
    setIsLoading(true);
    
    const apiKey = openAIKey || import.meta.env.VITE_OPENAI_API_KEY || '';
    
    try {
      // Create a specific prompt for generating sentences
      const sentencePrompt = `יצירת משפטים עם המילים הבאות: ${words.join(', ')}. 
      אנא צור 5 משפטים מגוונים וקצרים (3-5 מילים) בעברית שמשלבים את המילים האלה בדרכים שונות. 
      כל משפט צריך להיות קצר, ברור ומועיל למטופל שמתקשה בדיבור. סגנון המשפטים צריך להיות יומיומי.`;
      
      // Call OpenAI to generate sentences
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: 'system', content: 'אתה עוזר ליצירת משפטים פשוטים וברורים בעברית. המשפטים צריכים להיות קצרים, פשוטים ושימושיים למטופל שמתקשה בדיבור.' },
            { role: 'user', content: sentencePrompt }
          ],
          temperature: 0.7,
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      
      // Parse sentences from the response
      // Usually the model will return numbered sentences
      const sentenceLines = content.split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^\d+[\.\)\-]\s*/, '').trim())
        .filter(sentence => sentence.length > 0);
      
      setSentences(sentenceLines);
      
    } catch (error) {
      console.error('Error generating sentences:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה ביצירת המשפטים. אנא נסה שוב.",
        variant: "destructive",
      });
      setIsSentenceMode(false);
    } finally {
      setIsLoading(false);
    }
  };

  // New function to handle sentence selection
  const handleSentenceSelect = (sentence: string) => {
    // Add the selected sentence as a user message
    const newMessage: ConversationItem = {
      id: uuidv4(),
      text: sentence,
      isUser: true,
      timestamp: new Date()
    };
    
    setConversation(prev => [...prev, newMessage]);
    
    // Clear sentence mode
    setIsSentenceMode(false);
    setSentences([]);
    
    toast({
      title: "נוסף משפט",
      description: `המשפט "${sentence}" נוסף לשיחה בהצלחה`,
    });
  };

  // Function to cancel sentence mode
  const handleCancelSentences = () => {
    setIsSentenceMode(false);
    setSentences([]);
  };

  const handleStagingWordSelect = (word: string) => {
    // Add the selected word to the conversation
    const newMessage: ConversationItem = {
      id: uuidv4(),
      text: word,
      isUser: true,
      timestamp: new Date()
    };
    
    setConversation(prev => [...prev, newMessage]);
    
    // Clear the staging area
    setIsStaging(false);
    clearStagingArea();
    setStagingTopicGroups([]);
    
    // Show toast notification
    toast({
      title: "נוספה מילה",
      description: `המילה "${word}" נוספה לשיחה בהצלחה`,
    });
    
    // Regenerate categories based on the updated conversation
    setIsLoading(true);
    setIsStreaming(true);
    
    // Mark existing topic groups as old
    setTopicGroups(currentGroups => 
      currentGroups.map(group => ({
        ...group,
        isCollapsed: true,
        isOld: true
      }))
    );
    
    const apiKey = openAIKey || import.meta.env.VITE_OPENAI_API_KEY || '';
    
    // Create updated conversation history including the newly added word
    const updatedConversation = [...conversation, newMessage];
    const conversationHistory = updatedConversation.map(item => 
      `${item.isUser ? 'User' : 'Assistant'}: ${item.text}`
    ).join('\n');
    
    // Get all user words from the conversation to avoid repeating them
    const allUserWords = updatedConversation
      .filter(item => item.isUser)
      .map(item => item.text);
    
    // Create a prompt that instructs the model not to repeat words already used
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
          
          // Filter out any words that are already in the conversation
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
    setConversation([]);
    setTopicGroups([]);
    setConversationId(uuidv4());
    setIsStaging(false);
    clearStagingArea();
    setStagingTopicGroups([]);
    setIsSentenceMode(false);
    setSentences([]);
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

  const activeTopicGroups = isStaging ? stagingTopicGroups : topicGroups;

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

      {isSentenceMode && (
        <SentencesDisplay 
          sentences={sentences} 
          onSentenceSelect={handleSentenceSelect}
          onCancel={handleCancelSentences}
        />
      )}

      {isStaging && (
        <StagingArea
          stagedWords={stagedWords}
          onRemoveWord={removeWordFromStaging}
          onWordSelect={handleStagingWordSelect}
          onCancel={handleStagingCancel}
        />
      )}

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
                  onCreateSentences={!isStaging && !isSentenceMode ? handleCreateSentences : undefined}
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

      <motion.div 
        className="w-full sticky bottom-2 px-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <TopicInput 
          onSubmit={handleSubmitTopic} 
          isLoading={isLoading || isStaging || isSentenceMode} 
          apiKey={openAIKey}
        />
      </motion.div>
    </div>
  );
};

export default Index;
