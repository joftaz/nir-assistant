
import React from 'react';
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Volume2, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  onSpeakWord,
  onFindSynonyms
}) => {
  if (!word) return null;

  const handleAddWord = () => {
    onAddWord(word);
    onClose();
  };

  const handleSpeakWord = () => {
    onSpeakWord(word);
  };

  const handleFindSynonyms = () => {
    onFindSynonyms(word);
    onClose();
  };

  return (
    <Drawer open={isOpen} onOpenChange={open => !open && onClose()}>
      <DrawerContent className="h-[30vh] p-4">
        <DrawerHeader className="text-center">
          <DrawerTitle className="text-xl font-bold">{word}</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-3 items-center justify-center px-4 py-2">
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
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default WordActionDrawer;
