import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TopicInput from '@/components/TopicInput';
import TopicGroup from '@/components/TopicGroup';
import SentencesDisplay from '@/components/SentencesDisplay';
import ConversationHistory, { ConversationItem } from '@/components/ConversationHistory';
import ApiKeyInput from '@/components/ApiKeyInput';
import { getModelResponse, initializeSystemPrompt, getStagedWordsPrompt, defaultSystemJsonInstruction, replacePromptPlaceholders } from '@/utils/modelPrompt';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { saveHistory, getHistoryById } from '@/utils/conversationManager';
import { TopicCategory } from '@/types/models';
import { useSentenceGenerator } from '@/hooks/use-sentence-generator';
import { playSpeech } from '@/utils/speechService';
import WordActionDrawer from '@/components/WordActionDrawer';
import SentenceOptionsDrawer from '@/components/SentenceOptionsDrawer';
import Header from '@/components/Header';
import BottomInputArea from '@/components/BottomInputArea';


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
  
  const {
    sentences,
    oldSentences,
    isGeneratingSentences,
    isStreaming: sentenceIsStreaming,
    generateSentencesFromConversation,
    clearSentences
  } = useSentenceGenerator();
  
  const [showingSentences, setShowingSentences] = useState(false);
  const [isConversationMode, setIsConversationMode] = useState(false);
  const [isChildrenMode, setIsChildrenMode] = useState(false);

  // Add new state variables for the drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeWord, setActiveWord] = useState<string | null>(null);
  
  // Generate a unique user ID if not already set
  const userId = localStorage.getItem('userId') || uuidv4();
  localStorage.setItem('userId', userId);
  
  // Add state for sentence options drawer
  const [isSentenceOptionsDrawerOpen, setIsSentenceOptionsDrawerOpen] = useState(false);
  
  // Scroll to top after any conversation update
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [conversation]);

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

  // Handle word click to open the drawer
  const handleWordClick = (word: string, categotry: string) => {
    setSelectedWord(word);
    setSelectedCategory(categotry);
    setIsDrawerOpen(true);
  };

  // Handle adding a word directly from the drawer
  const handleAddWordDirectly = (word: string) => {
    const newMessage: ConversationItem = {
      id: uuidv4(),
      text: word,
      isUser: true,
      timestamp: new Date()
    };
    
    setConversation(prev => [...prev, newMessage]);
    
    toast({
      title: "נוספה מילה",
      description: `המילה "${word}" נוספה לשיחה בהצלחה`,
    });
    
  };
  
  // New function to refresh the suggested words/categories
  const handleRefreshSuggestedWords = () => {
    if (conversation.length === 0) return;
    
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
    
    const allUserWords = conversation
      .filter(item => item.isUser)
      .map(item => item.text);
    
    const prompt = `${conversationHistory}\n\nהערה למודל: המילים הבאות כבר נבחרו, אנא הצע מילים חדשות שקשורות לנושא אך שונות מאלו: ${allUserWords.join(', ')}`;
    
    console.log("Refreshing categories from conversation:", prompt);
    
    const categoryReceived = new Set<string>();
    
    getModelResponse(
      prompt, 
      !!apiKey, 
      apiKey, 
      (partialResponse) => {
        console.log("Received partial response for refresh:", partialResponse);
        
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
  
  // Handle speaking a word
  const handleSpeakWord = (word: string) => {
    if (isPlayingAudio) return;
    
    const apiKey = openAIKey || import.meta.env.VITE_OPENAI_API_KEY || '';
    if (!apiKey) {
      toast({
        title: "שגיאה",
        description: "חסר מפתח API להקראת טקסט",
        variant: "destructive",
      });
      return;
    }
    
    setIsPlayingAudio(true);
    setActiveWord(word);
    
    const audioPromises = playSpeech(word, apiKey);
    
    audioPromises.playing
      .then(() => {
        console.log("Word read completed:", word);
      })
      .catch((error) => {
        console.error('Error playing speech:', error);
        toast({
          title: "שגיאה",
          description: "אירעה שגיאה בהקראת המילה. אנא בדוק את מפתח ה-API.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsPlayingAudio(false);
        setActiveWord(null);
      });
  };

  const handleReset = () => {
    clearSentences();
    setShowingSentences(false);
    
    setConversation([]);
    setTopicGroups([]);
    setConversationId(uuidv4());
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
  
  const handleGenerateSentencesFromConversation = async (type: string = "") => {
    if (conversation.length === 0) {
      toast({
        title: "אין מילים בשיחה",
        description: "יש להוסיף מילים לשיחה לפני יצירת משפטים",
        variant: "destructive",
      });
      return;
    }
    
    setShowingSentences(true);
    setIsSentenceOptionsDrawerOpen(false);
    
    setTopicGroups(currentGroups => 
      currentGroups.map(group => ({
        ...group,
        isCollapsed: true,
        isOld: true
      }))
    );
    
    const apiKey = openAIKey || import.meta.env.VITE_OPENAI_API_KEY || '';
    await generateSentencesFromConversation(conversation, apiKey, type);
  };
  
  const handleSentenceSelect = (sentence: string) => {
    const newMessage: ConversationItem = {
      id: uuidv4(),
      text: sentence,
      isUser: true,
      timestamp: new Date()
    };
    
    setConversation(prev => [...prev, newMessage]);
    
    clearSentences();
    setShowingSentences(false);
    
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
    clearSentences(true);
    setShowingSentences(false);
  };

  const handleConversationModeToggle = () => {
    setIsConversationMode(!isConversationMode);
    if (!isConversationMode && isChildrenMode) {
      setIsChildrenMode(false);
    }
  };

  const handleChildrenModeToggle = () => {
    setIsChildrenMode(!isChildrenMode);
    if (!isChildrenMode && isConversationMode) {
      setIsConversationMode(false);
    }
  };

  const handlePlaySpeech = (text: string) => {
    if (isPlayingAudio) return { 
      loading: Promise.reject(new Error('Already playing')),
      playing: Promise.reject(new Error('Already playing'))
    };
    
    setIsPlayingAudio(true);
    
    const audioPromises = playSpeech(text, openAIKey);
    
    audioPromises.playing
      .then(() => {
        toast({
          title: "הקראה הושלמה",
          description: "הטקסט הוקרא בהצלחה",
        });
      })
      .catch((error) => {
        console.error('Error playing speech:', error);
        toast({
          title: "שגיאה",
          description: "אירעה שגיאה בהקראת הטקסט. אנא בדוק את מפתח ה-API.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsPlayingAudio(false);
      });
    
    return audioPromises;
  };

  // Handler to open the sentence options drawer
  const handleOpenSentenceOptionsDrawer = () => {
    setIsSentenceOptionsDrawerOpen(true);
  };
  
  const hasUserMessages = conversation.some(item => item.isUser);

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-2 sm:px-4 py-4 sm:py-6" style={{ backgroundColor: '#EDE8F4' }}>
      
      <Header
        onRefreshSuggestedWords={handleRefreshSuggestedWords}
        isLoading={isLoading}
        isStreaming={isStreaming}
        hasUserMessages={hasUserMessages}
        showingSentences={showingSentences}
      />
      
    
  
      {showingSentences && (
        <SentencesDisplay
          sentences={sentences}
          oldSentences={oldSentences}
          isLoading={isGeneratingSentences}
          isStreaming={sentenceIsStreaming}
          isPlayingAudio={isPlayingAudio}
          onSelectSentence={handleSentenceSelect}
          onCancel={handleCancelSentences}
          onGenerateMore={() => handleGenerateSentencesFromConversation("")}
          onPlaySpeech={handlePlaySpeech}
        />
      )}
      
      <div className="w-full max-w-3xl mx-auto mt-3">
        <div className="grid grid-cols-2 gap-3">
          {topicGroups.map((group, index) => (
            <TopicGroup
              key={`${group.category}-${index}`}
              category={group.category}
              words={group.words}
              onWordClick={handleWordClick}
              isCollapsed={group.isCollapsed}
              isOld={group.isOld}
              activeWord={activeWord}
            />
          ))}
        </div>
      </div>

      {/* Replace the old bottom section with the new BottomInputArea component */}
      <BottomInputArea
        conversation={conversation}
        onSubmitTopic={handleSubmitTopic}
        isLoading={isLoading}
        apiKey={openAIKey}
        isStreaming={isStreaming}
        showingSentences={showingSentences}
        onRemoveMessage={handleRemoveMessage}
        onOpenSentenceOptionsDrawer={handleOpenSentenceOptionsDrawer}
        isGeneratingSentences={isGeneratingSentences}
      />
      
      {/* Word Action Drawer */}
      <WordActionDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        word={selectedWord}
        category={selectedCategory}
        onAddWord={handleAddWordDirectly}
        onSpeakWord={handleSpeakWord}
      />
      
      {/* Sentence Options Drawer */}
      <SentenceOptionsDrawer 
        isOpen={isSentenceOptionsDrawerOpen}
        onClose={() => setIsSentenceOptionsDrawerOpen(false)}
        onGenerateSentences={handleGenerateSentencesFromConversation}
        isGenerating={isGeneratingSentences}
        isConversationMode={isConversationMode}
        isChildrenMode={isChildrenMode}
        onToggleConversationMode={handleConversationModeToggle}
        onToggleChildrenMode={handleChildrenModeToggle}
      />
    </div>
  );
};

export default Index;
