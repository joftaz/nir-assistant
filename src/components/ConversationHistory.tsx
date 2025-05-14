import React, { useRef, useEffect } from 'react';
import { X } from 'lucide-react';

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

const ConversationHistory: React.FC<ConversationHistoryProps> = ({ 
  conversation, 
  onRemoveMessage 
}) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Scroll to the bottom when conversation updates
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  // Group consecutive user messages together
  const groupedConversation: Array<{
    isGroup: boolean;
    items: ConversationItem[];
  }> = [];

  let currentGroup: ConversationItem[] = [];
  let lastIsUser = false;

  // Process conversation items to group consecutive user messages
  conversation.forEach((item) => {
    // If this is a user message and the last item was also a user message
    if (item.isUser && lastIsUser) {
      // Add to the current group
      currentGroup.push(item);
    } else {
      // If we had a group going, save it
      if (currentGroup.length > 0) {
        groupedConversation.push({
          isGroup: true,
          items: [...currentGroup]
        });
        currentGroup = [];
      }
      
      // Start a new group or add as individual message
      if (item.isUser) {
        currentGroup.push(item);
      } else {
        groupedConversation.push({
          isGroup: false,
          items: [item]
        });
      }
    }
    
    lastIsUser = item.isUser;
  });

  // Add any remaining group
  if (currentGroup.length > 0) {
    groupedConversation.push({
      isGroup: true,
      items: [...currentGroup]
    });
  }

  const handleRemove = (id: string) => {
    if (onRemoveMessage) {
      onRemoveMessage(id);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-1 flex flex-col gap-1 px-2 max-h-[25vh] overflow-y-auto" dir="rtl">
      {groupedConversation.map((group, groupIndex) => (
        group.isGroup ? (
          // Render grouped user messages
          <div
            key={`group-${groupIndex}`}
            className="conversation-group flex flex-wrap gap-1 justify-start"
            dir="rtl"
          >
            {group.items.map((item) => (
              <div
                key={item.id}
                className="bg-primary text-primary-foreground text-sm p-1.5 rounded-lg shadow-sm inline-block whitespace-normal relative group rtl"
                dir="rtl"
              >
                <span className="inline-block">{item.text}</span>
                {onRemoveMessage && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(item.id);
                    }}
                    className="mr-0.5 hover:bg-primary-foreground/20 rounded-full p-0.5 inline-flex"
                    aria-label="Remove message"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          // Render non-grouped (AI) messages
          <div
            key={group.items[0].id}
            className="conversation-bubble p-1.5 text-xs rounded-lg shadow-sm bg-muted text-muted-foreground self-start rounded-tr-xl rounded-br-xl rounded-bl-xl inline-block whitespace-normal rtl"
            dir="rtl"
          >
            <span className="inline-block">{group.items[0].text}</span>
          </div>
        )
      ))}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default ConversationHistory;
