import React, { useState, useEffect } from 'react';
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Volume2, Plus, Search, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { getSynonymsPrompt, replacePromptPlaceholders } from '@/utils/modelPrompt';
import { useToast } from '@/hooks/use-toast';

interface WordActionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  word: string | null;
  onAddWord: (word: string) => void;
  onSpeakWord: (word: string) => void;
}

const WordActionDrawer: React.FC<WordActionDrawerProps> = ({
  isOpen,
  onClose,
  word,
  onAddWord,
  onSpeakWord
}) => {
  const [showingSynonyms, setShowingSynonyms] = useState(false);
  const [synonyms, setSynonyms] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const { toast } = useToast();
  
  // Clear synonyms when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setShowingSynonyms(false);
      setSynonyms([]);
      setIsStreaming(false);
    }
  }, [isOpen]);
  
  if (!word) return null;

  const handleAddWord = () => {
    onAddWord(word);
    onClose();
  };

  const handleSpeakWord = () => {
    onSpeakWord(word);
  };

  const handleFindSynonyms = async () => {
    setIsLoading(true);
    setIsStreaming(true);
    setShowingSynonyms(true);
    setSynonyms([]);
    
    try {
      // Get the API key from env or localStorage
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY || localStorage.getItem('openai_api_key') || '';
      
      if (!apiKey) {
        toast({
          title: "שגיאה",
          description: "חסר מפתח API לחיפוש מילים נרדפות",
          variant: "destructive",
        });
        setIsLoading(false);
        setIsStreaming(false);
        return;
      }
      
      // Get the synonyms prompt
      const synonymsPrompt = getSynonymsPrompt();
      const fullPrompt = replacePromptPlaceholders(synonymsPrompt);
      
      // Make the API call with streaming
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: 'system', content: fullPrompt },
            { role: 'user', content: `אנא מצא מילים נרדפות למילה: "${word}"` }
          ],
          temperature: 0.7,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`Error calling OpenAI API: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Failed to get response reader');

      let accumulatedData = '';
      const decoder = new TextDecoder();
      
      // Function to extract words from partial JSON
      const extractSynonymsFromText = (text: string): string[] => {
        try {
          // Look for patterns like "synonyms": ["word1", "word2", ...]
          const synonymsMatch = text.match(/"synonyms"\s*:\s*\[(.*?)(?:\]|$)/s);
          if (synonymsMatch && synonymsMatch[1]) {
            // Extract individual words from the array
            const wordsMatches = synonymsMatch[1].match(/"([^"]*)"/g);
            if (wordsMatches) {
              return wordsMatches.map(word => word.replace(/"/g, ''));
            }
          }
          return [];
        } catch (e) {
          console.error("Error extracting synonyms:", e);
          return [];
        }
      };

      // Process the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode the chunk
        const chunk = decoder.decode(value);
        
        // Process complete lines from the SSE format
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.trim() === '') continue;
          
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              console.log("Stream complete");
              continue;
            }
            
            try {
              const json = JSON.parse(data);
              const content = json.choices[0]?.delta?.content || '';
              
              if (content) {
                accumulatedData += content;
                console.log("Accumulated:", accumulatedData);
                
                // Try to extract synonyms
                const currentSynonyms = extractSynonymsFromText(accumulatedData);
                if (currentSynonyms.length > 0) {
                  console.log("Found synonyms:", currentSynonyms);
                  setSynonyms(currentSynonyms);
                }
              }
            } catch (e) {
              // Ignore JSON parse errors in streaming - they're expected
              console.log("Parse error in streaming (expected):", e.message);
            }
          }
        }
      }
      
      // Process the complete response
      try {
        // Try to find complete JSON in the accumulated data
        const jsonMatch = accumulatedData.match(/\{.*\}/s);
        if (jsonMatch) {
          const parsedJson = JSON.parse(jsonMatch[0]);
          if (parsedJson.synonyms && Array.isArray(parsedJson.synonyms)) {
            console.log("Final synonyms:", parsedJson.synonyms);
            setSynonyms(parsedJson.synonyms);
          }
        }
      } catch (e) {
        console.error('Error parsing final response:', e);
        
        // If we already have some synonyms from streaming, keep them
        if (synonyms.length === 0) {
          // Try one more extraction from the accumulated text
          const extractedSynonyms = extractSynonymsFromText(accumulatedData);
          if (extractedSynonyms.length > 0) {
            setSynonyms(extractedSynonyms);
          } else {
            throw new Error("Failed to parse response");
          }
        }
      }
      
    } catch (error) {
      console.error('Error fetching synonyms:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בחיפוש מילים נרדפות",
        variant: "destructive",
      });
      // Show something even if there's an error
      if (synonyms.length === 0) {
        setSynonyms(["לא נמצאו מילים נרדפות"]);
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleSelectSynonym = (synonym: string) => {
    onAddWord(synonym);
    setShowingSynonyms(false);
    onClose();
  };

  const handleBack = () => {
    setShowingSynonyms(false);
    setSynonyms([]);
  };

  const drawerHeight = showingSynonyms ? "h-[70vh]" : "h-[30vh]";

  return (
    <Drawer open={isOpen} onOpenChange={open => {
      if (!open) {
        setShowingSynonyms(false);
        setSynonyms([]);
        onClose();
      }
    }}>
      <DrawerContent className={`transition-all duration-300 ease-in-out ${drawerHeight} p-4`}>
        <DrawerHeader className="text-center">
          <DrawerTitle className="text-xl font-bold">{word}</DrawerTitle>
        </DrawerHeader>
        
        <AnimatePresence mode="wait">
          {showingSynonyms ? (
            <motion.div 
              key="synonyms"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-3 items-center px-4 py-2"
            >
              <Button 
                variant="ghost" 
                className="self-start mb-2"
                onClick={handleBack}
              >
                <ArrowLeft className="h-5 w-5 ml-2" />
                <span>חזרה</span>
              </Button>
              
              <div className="text-center mb-3">
                מילים נרדפות ל-"{word}"
                {isStreaming && <span className="ml-2">...</span>}
              </div>
              
              {isLoading && synonyms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mb-2" />
                  <p className="text-center text-muted-foreground">מחפש מילים נרדפות...</p>
                </div>
              ) : synonyms.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 w-full">
                  <AnimatePresence>
                    {synonyms.map((synonym, index) => (
                      <motion.div
                        key={`${synonym}-${index}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ 
                          delay: Math.min(0.05 * index, 1),
                          duration: 0.2
                        }}
                        className="shadow-sm"
                      >
                        <Button 
                          variant="outline" 
                          className="w-full justify-start py-3 px-4 text-right bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-900"
                          onClick={() => handleSelectSynonym(synonym)}
                        >
                          {synonym}
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {isStreaming && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="col-span-2 flex justify-center mt-4"
                    >
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </motion.div>
                  )}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">לא נמצאו מילים נרדפות</p>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-3 items-center justify-center px-4 py-2"
            >
              <Button 
                variant="outline" 
                className="w-full flex items-center gap-2 justify-center text-lg"
                onClick={handleSpeakWord}
              >
                <Volume2 className="h-5 w-5" />
                <span>הקרא מילה</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full flex items-center gap-2 justify-center text-lg"
                onClick={handleAddWord}
              >
                <Plus className="h-5 w-5" />
                <span>הוסף למילים הנבחרות</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full flex items-center gap-2 justify-center text-lg"
                onClick={handleFindSynonyms}
              >
                <Search className="h-5 w-5" />
                <span>חפש מילים נרדפות</span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DrawerContent>
    </Drawer>
  );
};

export default WordActionDrawer;
