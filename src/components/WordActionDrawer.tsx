import React, { useState } from 'react';
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Volume2, Plus, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface WordActionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  word: string | null;
  onAddWord: (word: string) => void;
  onSpeakWord: (word: string) => void;
  onFindSynonyms: (word: string) => void;
}

const WordActionDrawer: React.FC<WordActionDrawerProps> = ({
  isOpen,
  onClose,
  word,
  onAddWord,
  onSpeakWord
  
}) => {
  const [showingSynonyms, setShowingSynonyms] = useState(false);
  // Dummy synonyms list for demonstration
  const dummySynonyms = word ? [
    `דומה ל${word}`,
    `מקביל ל${word}`,
    `זהה ל${word}`,
    `שווה ערך ל${word}`,
    `באותו סגנון כמו ${word}`,
    `סוג של ${word}`,
    `משמעות דומה ל${word}`,
    `חלופה ל${word}`,
    `מקביל במשמעות ל${word}`,
    `תחליף ל${word}`
  ] : [];

  if (!word) return null;

  const handleAddWord = () => {
    onAddWord(word);
    onClose();
  };

  const handleSpeakWord = () => {
    onSpeakWord(word);
  };

  const handleFindSynonyms = () => {
    setShowingSynonyms(true);
  };

  const handleSelectSynonym = (synonym: string) => {
    onAddWord(synonym);
    setShowingSynonyms(false);
    onClose();
  };

  const handleBack = () => {
    setShowingSynonyms(false);
  };

  const drawerHeight = showingSynonyms ? "h-[70vh]" : "h-[30vh]";

  return (
    <Drawer open={isOpen} onOpenChange={open => {
      if (!open) {
        setShowingSynonyms(false);
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
                {dummySynonyms.map((synonym, index) => (
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
