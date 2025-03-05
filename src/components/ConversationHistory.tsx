
import React, { useRef, useEffect } from 'react';

export interface ConversationItem {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ConversationHistoryProps {
  conversation: ConversationItem[];
}

const ConversationHistory: React.FC<ConversationHistoryProps> = ({ conversation }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Scroll to the bottom when conversation updates
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  if (conversation.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-3xl mx-auto my-6 flex flex-col gap-3 px-2">
      {conversation.map((item) => (
        <div
          key={item.id}
          className={`conversation-bubble p-3 rounded-lg shadow-sm ${
            item.isUser 
              ? 'bg-primary text-primary-foreground self-end rounded-tl-xl rounded-bl-xl rounded-br-xl' 
              : 'bg-muted text-muted-foreground self-start rounded-tr-xl rounded-br-xl rounded-bl-xl'
          }`}
          dir="auto"
        >
          {item.text}
        </div>
      ))}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default ConversationHistory;
