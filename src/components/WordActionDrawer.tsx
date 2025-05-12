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
  const { toast } = useToast();
  
  // Clear synonyms when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setShowingSynonyms(false);
      setSynonyms([]);
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
        return;
      }
      
      // Get the synonyms prompt
      const synonymsPrompt = getSynonymsPrompt();
      const fullPrompt = replacePromptPlaceholders(synonymsPrompt);
      
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
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        throw new Error(`Error calling OpenAI API: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error("No response content");
      }

      try {
        const parsedContent = JSON.parse(content);
        if (parsedContent.synonyms && Array.isArray(parsedContent.synonyms)) {
          setSynonyms(parsedContent.synonyms);
        } else {
          // Fallback just in case API returns the old format
          // or some other unexpected format
          const allWords: string[] = [];
          
          if (parsedContent.categories && Array.isArray(parsedContent.categories)) {
            parsedContent.categories.forEach((category: any) => {
              if (category.words && Array.isArray(category.words)) {
                allWords.push(...category.words);
              }
            });
          }
          
          setSynonyms(allWords.length > 0 ? allWords : ["לא נמצאו מילים נרדפות"]);
        }
      } catch (error) {
        console.error('Error parsing OpenAI response:', error);
        throw new Error("Invalid response format");
      }
      
    } catch (error) {
      console.error('Error fetching synonyms:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בחיפוש מילים נרדפות",
        variant: "destructive",
      });
      // Show something even if there's an error
      setSynonyms(["לא נמצאו מילים נרדפות"]);
    } finally {
      setIsLoading(false);
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
              
              <div className="text-center mb-3">מילים נרדפות ל-"{word}"</div>
              
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mb-2" />
                  <p className="text-center text-muted-foreground">מחפש מילים נרדפות...</p>
                </div>
              ) : synonyms.length > 0 ? (
                <motion.div 
                  className="grid grid-cols-2 gap-2 w-full"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: {
                      transition: {
                        staggerChildren: 0.05
                      }
                    },
                    hidden: {}
                  }}
                >
                  {synonyms.map((synonym, index) => (
                    <motion.div
                      key={index}
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        visible: { opacity: 1, y: 0 }
                      }}
                    >
                      <Button 
                        variant="outline" 
                        className="w-full justify-start py-3 px-4 text-right"
                        onClick={() => handleSelectSynonym(synonym)}
                      >
                        {synonym}
                      </Button>
                    </motion.div>
                  ))}
                </motion.div>
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
