import React, { useState, useEffect, useRef } from 'react';
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
import { getModelResponse, initializeSystemPrompt, getStagedWordsPrompt, defaultSystemJsonInstruction, replacePromptPlaceholders } from '@/utils/modelPrompt';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, History as HistoryIcon, MessageSquare, Plus, Speech, Baby, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { saveHistory, getHistoryById } from '@/utils/conversationManager';
import { TopicCategory } from '@/types/models';
import { useStagingArea } from '@/hooks/use-staging-area';
import { useSentenceGenerator } from '@/hooks/use-sentence-generator';
import { playSpeech } from '@/utils/speechService';
import WordActionDrawer from '@/components/WordActionDrawer';
import SentenceOptionsDrawer from '@/components/SentenceOptionsDrawer';

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
    oldSentences,
    isGeneratingSentences,
    isStreaming: sentenceIsStreaming,
    generateSentencesFromWords,
    generateSentencesFromConversation,
    clearSentences
  } = useSentenceGenerator();
  
  const [showingSentences, setShowingSentences] = useState(false);
  const [autoGenerateStagingWords, setAutoGenerateStagingWords] = useState(false);
  const [hasRefreshedStaging, setHasRefreshedStaging] = useState(false);
  const [isConversationMode, setIsConversationMode] = useState(false);
  const [isChildrenMode, setIsChildrenMode] = useState(false);

  // Add new state variables for the drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeWord, setActiveWord] = useState<string | null>(null);
  
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
  const handleWordClick = (word: string) => {
    setSelectedWord(word);
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
    
    // Note: Not refreshing categories automatically after adding a word.
    // User will need to use the refresh button if they want new suggestions.
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

  const handleWordSelect = (word: string) => {
    addWordToStaging(word);
    
    if (!isStaging) {
      setIsStaging(true);
      setHasRefreshedStaging(false);
    }
  };

  const generateStagingWords = (words: string[]) => {
    if (words.length === 0) return;
    
    setIsLoading(true);
    setIsStreaming(true);
    
    setStagingTopicGroups([]);
    
    const apiKey = openAIKey || import.meta.env.VITE_OPENAI_API_KEY || '';
    
    const conversationHistory = conversation.map(item => 
      `${item.isUser ? 'User' : 'Assistant'}: ${item.text}`
    ).join('\n');
    
    const stagedWordsPrompt = getStagedWordsPrompt();
    const systemPrompt = `${stagedWordsPrompt}\n\n## שיחה:\n ${words.join(', ')}\n\n${conversationHistory}\n\n### מילים רלוונטיות ליצירת מילים נוספות:\n ${words.join(',')}`;
    
    const prompt = `${replacePromptPlaceholders(systemPrompt)}\n\n${defaultSystemJsonInstruction}`;
    
    console.log("Starting streaming request for staging words...");
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
            suggestedWord => !words.includes(suggestedWord)
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
  
  const handleAddAllWords = () => {
    if (stagedWords.length === 0) return;
    
    stagedWords.forEach(word => {
      const newMessage: ConversationItem = {
        id: uuidv4(),
        text: word,
        isUser: true,
        timestamp: new Date()
      };
      setConversation(prev => [...prev, newMessage]);
    });
    
    setIsStaging(false);
    clearStagingArea();
    setStagingTopicGroups([]);
    
    toast({
      title: "נוספו מילים",
      description: `המילים נוספו לשיחה בהצלחה: ${stagedWords.join(' ')}`,
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
    
    const updatedConversation = [...conversation, ...stagedWords.map(word => ({
      id: uuidv4(),
      text: word,
      isUser: true,
      timestamp: new Date()
    }))];
    const conversationHistory = updatedConversation.map(item => 
      `${item.isUser ? 'User' : 'Assistant'}: ${item.text}`
    ).join('\n');
    
    const allUserWords = updatedConversation
      .filter(item => item.isUser)
      .map(item => item.text);
    
    const prompt = `${conversationHistory}\n\nהערה למודל: המילים הבאות כבר נבחרו, אנא הצע מילים חדשות שקשורות לנושא אך שונות מאלו: ${allUserWords.join(', ')}`;
    
    console.log("Regenerating categories after adding all words:", prompt);
    
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
  
  const handleStagingCancel = () => {
    setIsStaging(false);
    clearStagingArea();
    setStagingTopicGroups([]);
    setHasRefreshedStaging(false);
    
    toast({
      title: "בוטלה בחירה",
      description: "המילים הזמניות נמחקו",
    });
  };

  const handleRefreshStagingWords = () => {
    if (stagedWords.length === 0) return;
    
    setStagingTopicGroups([]);
    setHasRefreshedStaging(true);
    generateStagingWords(stagedWords);
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
    setIsSentenceOptionsDrawerOpen(false);
    
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
    await generateSentencesFromConversation(conversation, apiKey, isConversationMode, isChildrenMode);
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

  const activeTopicGroups = isStaging && hasRefreshedStaging ? stagingTopicGroups : topicGroups;
  
  const hasUserMessages = conversation.some(item => item.isUser);

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-2 sm:px-4 py-4 sm:py-6">
      <header className="w-full max-w-3xl mx-auto mb-2 text-center relative">
        <div className="absolute top-0 right-0">
          <Settings onSystemPromptChange={handleSystemPromptChange} />
        </div>
        <div className="absolute top-0 left-0 flex gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            title="מחק שיחה"
            aria-label="מחק שיחה"
            onClick={handleReset}
          >
            <Trash2 className="h-5 w-5" />
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


      
      {showingSentences && (
        <SentencesDisplay
          sentences={sentences}
          oldSentences={oldSentences}
          isLoading={isGeneratingSentences}
          isStreaming={sentenceIsStreaming}
          isPlayingAudio={isPlayingAudio}
          onSelectSentence={handleSentenceSelect}
          onCancel={handleCancelSentences}
          onGenerateMore={handleGenerateSentencesFromConversation}
          onPlaySpeech={handlePlaySpeech}
        />
      )}
      
      <div className="w-full max-w-3xl mx-auto mt-3">
        <div className="grid grid-cols-2 gap-3">
          {activeTopicGroups.map((group, index) => (
            <TopicGroup
              key={`${group.category}-${index}`}
              category={group.category}
              words={group.words}
              onWordSelect={handleWordSelect}
              onWordClick={handleWordClick}
              isCollapsed={group.isCollapsed}
              isOld={group.isOld}
              isStaging={group.isStaging}
              hasRefreshedStaging={hasRefreshedStaging}
              activeWord={activeWord}
            />
          ))}
        </div>
      </div>

      {/* Moved TopicInput to the bottom with styling for fixed position */}
      <div className="w-full max-w-3xl mx-auto fixed bottom-0 left-0 right-0 px-2 sm:px-4 pb-6 pt-2 bg-background">
        {/* Refresh button moved above selected words */}
        {!isStaging && hasUserMessages && !showingSentences && (
          <div className="flex justify-center mb-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-sm"
              onClick={handleRefreshSuggestedWords}
              disabled={!hasUserMessages || isStreaming || isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              רענן מילים מוצעות
            </Button>
          </div>
        )}
        
        {/* Moved StagingArea to be above the sentence controls */}
        {isStaging && (
          <div className="mb-2">
            <StagingArea
              stagedWords={stagedWords}
              onRemoveWord={removeWordFromStaging}
              onWordSelect={handleStagingWordSelect}
              onCancel={handleStagingCancel}
              onAddAllWords={handleAddAllWords}
              onRefresh={handleRefreshStagingWords}
              isLoading={isLoading}
            />
          </div>
        )}

        <ConversationHistory 
          conversation={conversation} 
          onRemoveMessage={handleRemoveMessage}
        />
          
        {!isStaging && hasUserMessages && !showingSentences && (
          <div className="w-full mobile-sentence-controls mb-2">
            <Button
              variant="outline"
              onClick={handleOpenSentenceOptionsDrawer}
              disabled={isGeneratingSentences || conversation.length === 0}
              className="gap-2 rtl:flex-row-reverse"
            >
              <MessageSquare className="h-4 w-4" />
              <span>יצירת משפטים</span>
            </Button>
          </div>
        )}
        <TopicInput 
          onSubmit={handleSubmitTopic} 
          isLoading={isLoading}
          apiKey={openAIKey}
          placeholder="הקלד נושא או מילה..."
          isStreaming={isStreaming}
        />
      </div>

      {/* <ApiKeyInput 
        onSaveApiKey={handleSaveApiKey} 
        apiKey={openAIKey}
        className="mt-6"
      /> */}
      
      {/* Word Action Drawer */}
      <WordActionDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        word={selectedWord}
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
