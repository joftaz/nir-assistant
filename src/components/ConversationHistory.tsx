
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

  return (
    <div className="w-full max-w-3xl mx-auto my-6 flex flex-col gap-3 px-2 max-h-[50vh] overflow-y-auto">
      {groupedConversation.map((group, groupIndex) => (
        group.isGroup ? (
          // Render grouped user messages
          <div
            key={`group-${groupIndex}`}
            className="conversation-group self-end flex flex-wrap gap-2 justify-end max-w-[90%]"
            dir="auto"
          >
            {group.items.map((item) => (
              <div
                key={item.id}
                className="bg-primary text-primary-foreground p-2 rounded-lg shadow-sm"
              >
                {item.text}
              </div>
            ))}
          </div>
        ) : (
          // Render non-grouped (AI) messages
          <div
            key={group.items[0].id}
            className="conversation-bubble p-3 rounded-lg shadow-sm bg-muted text-muted-foreground self-start rounded-tr-xl rounded-br-xl rounded-bl-xl"
            dir="auto"
          >
            {group.items[0].text}
          </div>
        )
      ))}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default ConversationHistory;
