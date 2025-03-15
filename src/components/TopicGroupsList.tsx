
import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import TopicGroup from '@/components/TopicGroup';
import { TopicCategory } from '@/types/models';

interface TopicGroupsListProps {
  isLoading: boolean;
  topicGroups: TopicCategory[];
  isStreaming: boolean;
  onWordSelect: (word: string) => void;
}

const TopicGroupsList: React.FC<TopicGroupsListProps> = ({ 
  isLoading, 
  topicGroups, 
  isStreaming, 
  onWordSelect 
}) => {
  return (
    <motion.div 
      className="w-full max-w-3xl mx-auto grid gap-2 sm:gap-3 mt-2 mb-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      {isLoading && topicGroups.length === 0 ? (
        <div className="flex justify-center items-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
        </div>
      ) : (
        <>
          {topicGroups.map((group, index) => (
            <TopicGroup
              key={`${group.category}-${index}`}
              category={group.category}
              words={group.words}
              onWordSelect={onWordSelect}
              isCollapsed={group.isCollapsed}
              isOld={group.isOld}
            />
          ))}
          {isStreaming && (
            <div className="flex justify-center items-center py-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary/70" />
            </div>
          )}
          {!isStreaming && topicGroups.length > 0 && topicGroups.some(group => !group.isCollapsed) && (
            <div className="text-center text-xs text-muted-foreground py-1">
              ⤴ קבוצות חדשות | קבוצות קודמות ⤵
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default TopicGroupsList;
