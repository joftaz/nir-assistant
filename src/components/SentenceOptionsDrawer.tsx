import React from 'react';
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { MessageSquare, Speech, Baby } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface SentenceOptionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateSentences: () => void;
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
        
        <div className="flex flex-col gap-3 items-center justify-center px-4 py-2">
          <Button
            data-track-click="Generate sentences clicked"
            data-analytics-button-name="Generate sentences"
            variant="outline" 
            className="w-full flex items-center gap-2 justify-center text-lg"
            onClick={onGenerateSentences}
            disabled={isGenerating}
          >
            <MessageSquare className="h-5 w-5" />
            <span>צור משפטים</span>
          </Button>

          <Button 
            data-track-click="Conversation mode clicked"
            data-analytics-button-name="Toggle conversation mode"
            data-analytics-conversation-mode={isConversationMode ? "true" : "false"}
            data-analytics-children-mode={isChildrenMode ? "true" : "false"}
            variant={isConversationMode ? "default" : "outline"}
            className={`w-full flex items-center gap-2 justify-center text-lg ${isConversationMode ? "bg-primary text-primary-foreground" : ""}`}
            onClick={onToggleConversationMode}
          >
            <Speech className="h-5 w-5" />
            <span>מצב שיחה</span>
          </Button>
                        
          <Button
            data-track-click="Children mode clicked"
            data-analytics-button-name="Toggle children mode"
            data-analytics-conversation-mode={isConversationMode ? "true" : "false"}
            data-analytics-children-mode={isChildrenMode ? "true" : "false"}
            variant={isChildrenMode ? "default" : "outline"}
            className={`w-full flex items-center gap-2 justify-center text-lg ${isChildrenMode ? "bg-primary text-primary-foreground" : ""}`}
            onClick={onToggleChildrenMode}
          >
            <Baby className="h-5 w-5" />
            <span>מצב ילדים</span>
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default SentenceOptionsDrawer; 