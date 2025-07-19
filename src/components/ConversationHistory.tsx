import React from 'react';
import { Trash2 } from 'lucide-react';

export interface ConversationItem {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ConversationHistoryProps {
  conversation: ConversationItem[];
  onRemoveMessage?: (id: string) => void;
}

const CloseIcon = () => (
    <svg width="9" height="9" viewBox="12 13 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16.546 18.2188L12.9537 21.8111C12.8472 21.9174 12.7292 21.9674 12.5997 21.9611C12.4702 21.9546 12.3523 21.8982 12.246 21.7918C12.1396 21.6855 12.0865 21.5643 12.0865 21.4283C12.0865 21.2925 12.1396 21.1713 12.246 21.0648L15.819 17.4918L12.2267 13.9246C12.1204 13.8181 12.0704 13.6969 12.0767 13.5611C12.0832 13.4253 12.1396 13.3041 12.246 13.1976C12.3523 13.0913 12.4735 13.0381 12.6095 13.0381C12.7453 13.0381 12.8665 13.0913 12.973 13.1976L16.546 16.7898L20.1132 13.1976C20.2197 13.0913 20.3377 13.0381 20.4672 13.0381C20.5967 13.0381 20.7146 13.0913 20.821 13.1976C20.9313 13.3079 20.9865 13.43 20.9865 13.5638C20.9865 13.6978 20.9313 13.8181 20.821 13.9246L17.248 17.4918L20.8402 21.0841C20.9465 21.1906 20.9997 21.3086 20.9997 21.4381C20.9997 21.5676 20.9465 21.6855 20.8402 21.7918C20.7299 21.9022 20.6078 21.9573 20.474 21.9573C20.34 21.9573 20.2197 21.9022 20.1132 21.7918L16.546 18.2188Z" fill="white"/>
    </svg>
);

const ConversationHistory: React.FC<ConversationHistoryProps> = ({ 
  conversation, 
  onRemoveMessage 
}) => {
  const userMessages = conversation.filter(item => item.isUser);

  const handleRemove = (id: string) => {
    if (onRemoveMessage) {
      onRemoveMessage(id);
    }
  };

  const handleClearAll = () => {
    if (onRemoveMessage) {
      userMessages.forEach(item => onRemoveMessage(item.id));
    }
  };

  if (userMessages.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-3xl mx-auto py-1 flex flex-row items-start gap-2 px-2 my-2" dir="rtl">
      <div className="flex flex-row-reverse flex-wrap gap-2 justify-end flex-1">
        {userMessages.map((item) => (
          <div
            key={item.id}
            className="bg-[#9084CB] text-white text-base font-['Heebo'] font-normal tracking-[0.01em] rounded-lg shadow-sm inline-flex items-center justify-center whitespace-normal relative group h-[35px] px-3 gap-1"
          >
            <span className="inline-block">{item.text}</span>
            {onRemoveMessage && (
              <button
                data-track-click="Remove word clicked"
                data-analytics-button-name="Remove word"
                data-analytics-removed-word={item.text}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(item.id);
                }}
                className="inline-flex items-center justify-center p-0"
                style={{ minWidth: '12px'}}
                aria-label="Remove message"
              >
                <CloseIcon />
              </button>
            )}
          </div>
        ))}
      </div>
      {onRemoveMessage && userMessages.length > 0 && (
        <div className="flex-shrink-0">
          <button
            onClick={handleClearAll}
            className="flex justify-center items-center h-[34px] w-[44px] border border-[#2D2D2D] rounded-2xl p-2"
            aria-label="Remove all messages"
          >
            <Trash2 size={16} className="text-[#2D2D2D]" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ConversationHistory;
