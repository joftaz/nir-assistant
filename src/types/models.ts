
export interface TopicCategory {
  category: string;
  words: string[];
  isCollapsed?: boolean;
  isOld?: boolean;
  isStaging?: boolean;
  hasRefreshedStaging?: boolean;
}
