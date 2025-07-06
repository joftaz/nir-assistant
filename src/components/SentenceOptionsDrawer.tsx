import React from 'react';
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import SentenceTypeChooser from './SentenceTypeChooser';

interface SentenceOptionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateSentences: (type: string) => void;
  isGenerating: boolean;
  isConversationMode: boolean;
  isChildrenMode: boolean;
  onToggleConversationMode: () => void;
  onToggleChildrenMode: () => void;
}

const SentenceOptionsDrawer: React.FC<SentenceOptionsDrawerProps> = ({
  isOpen,
  onClose,
  onGenerateSentences,
  isGenerating,
  isConversationMode,
  isChildrenMode,
  onToggleConversationMode,
  onToggleChildrenMode
}) => {
  return (
    <Drawer open={isOpen} onOpenChange={open => {
      if (!open) onClose();
    }}>
      <DrawerContent className="p-4 h-[40vh]">
        <DrawerHeader className="text-center">
          <DrawerTitle className="text-xl font-bold">אפשרויות משפטים</DrawerTitle>
        </DrawerHeader>
        
        <div className="flex flex-col gap-3 items-center justify-center px-4 py-2 w-full">
          <Button
            variant="outline"
            className="w-full flex items-center gap-2 justify-center text-lg"
            onClick={() => onGenerateSentences("")}
            disabled={isGenerating}
          >
            <span>צור משפטים</span>
          </Button>
          <SentenceTypeChooser onGenerateSentences={onGenerateSentences} isGenerating={isGenerating} />
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default SentenceOptionsDrawer;