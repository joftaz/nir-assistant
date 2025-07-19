import React from 'react';
import { RefreshCw, MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TopicInput from '@/components/TopicInput';
import ConversationHistory, { ConversationItem } from '@/components/ConversationHistory';

interface BottomInputAreaProps {
  conversation: ConversationItem[];
  onSubmitTopic: (topic: string) => void;
  isLoading: boolean;
  apiKey: string;
  isStreaming: boolean;
  showingSentences: boolean;
  onRemoveMessage: (id: string) => void;
  onOpenSentenceOptionsDrawer: () => void;
  isGeneratingSentences: boolean;
}

const BottomInputArea: React.FC<BottomInputAreaProps> = ({
  conversation,
  onSubmitTopic,
  isLoading,
  apiKey,
  isStreaming,
  showingSentences,
  onRemoveMessage,
  onOpenSentenceOptionsDrawer,
  isGeneratingSentences
}) => {
  const hasUserMessages = conversation.some(item => item.isUser);

  return (
    <div className="w-full mx-auto fixed bottom-0 left-0 right-0 px-0 pb-6 pt-2" style={{ backgroundColor: '#F7F7F7', boxShadow: '0 0 30px rgba(0, 0, 0, 0.25)' }}>
      <div className="w-full max-w-3xl mx-auto px-2 sm:px-4">
        <ConversationHistory 
          conversation={conversation} 
          onRemoveMessage={onRemoveMessage}
        />
          
        {/* New bottom input layout matching the design */}
        <div className="flex flex-row items-center gap-2 w-full max-w-[358px]">
          {/* Create Sentence Button */}
          {hasUserMessages && !showingSentences && (
            <Button
              data-track-click="Create Sentences clicked"
              data-analytics-button-name="Create Sentences"
              onClick={onOpenSentenceOptionsDrawer}
              disabled={isGeneratingSentences || conversation.length === 0}
              className="flex-none bg-[#2D2D2D] hover:bg-[#2D2D2D]/90 text-white rounded-full h-[47px] w-[128px] gap-2 font-['Heebo'] font-normal text-[17px] leading-[25px]"
            >
              <Plus className="h-[15px] w-[15px]" />
              <span>צור משפט</span>
            </Button>
          )}
          
          {/* Topic Input - now styled to match the design */}
          <div className="flex-1">
            <TopicInput 
              onSubmit={onSubmitTopic} 
              isLoading={isLoading}
              apiKey={apiKey}
              placeholder="הקלד נושא או מילה..."
              isStreaming={isStreaming}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomInputArea; 