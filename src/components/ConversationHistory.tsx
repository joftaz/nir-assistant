
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
          className={`conversation-bubble ${item.isUser ? 'user' : ''}`}
          dir="rtl"
        >
          {item.text}
        </div>
      ))}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default ConversationHistory;
