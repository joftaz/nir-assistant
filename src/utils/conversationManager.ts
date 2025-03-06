
import { ConversationItem } from "@/components/ConversationHistory";
import { TopicCategory } from "@/types/models";

export interface ConversationHistory {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: ConversationItem[];
  topicGroups: TopicCategory[];
}

// Storage key for histories
const HISTORIES_STORAGE_KEY = "conversation_histories";
const SAVE_HISTORY_ENABLED_KEY = "save_history_enabled";

// Check if history saving is enabled
export const isHistorySavingEnabled = (): boolean => {
  const savedValue = localStorage.getItem(SAVE_HISTORY_ENABLED_KEY);
  return savedValue === null ? true : savedValue === "true";
};

// Set whether history saving is enabled
export const setHistorySavingEnabled = (enabled: boolean): void => {
  localStorage.setItem(SAVE_HISTORY_ENABLED_KEY, String(enabled));
};

// Get all saved conversation histories
export const getAllHistories = (): ConversationHistory[] => {
  try {
    const historiesJson = localStorage.getItem(HISTORIES_STORAGE_KEY);
    if (!historiesJson) return [];
    
    const histories = JSON.parse(historiesJson) as ConversationHistory[];
    return histories.map(history => ({
      ...history,
      createdAt: new Date(history.createdAt),
      updatedAt: new Date(history.updatedAt)
    }));
  } catch (error) {
    console.error("Failed to load conversation histories:", error);
    return [];
  }
};

// Save a new or update an existing conversation history
export const saveHistory = (
  id: string, 
  title: string,
  messages: ConversationItem[],
  topicGroups: TopicCategory[]
): void => {
  if (!isHistorySavingEnabled()) return;
  
  try {
    const histories = getAllHistories();
    const now = new Date();
    
    const existingIndex = histories.findIndex(h => h.id === id);
    
    if (existingIndex >= 0) {
      // Update existing history
      histories[existingIndex] = {
        ...histories[existingIndex],
        title,
        updatedAt: now,
        messages,
        topicGroups
      };
    } else {
      // Create new history
      histories.push({
        id,
        title,
        createdAt: now,
        updatedAt: now,
        messages,
        topicGroups
      });
    }
    
    localStorage.setItem(HISTORIES_STORAGE_KEY, JSON.stringify(histories));
  } catch (error) {
    console.error("Failed to save conversation history:", error);
  }
};

// Get a specific history by ID
export const getHistoryById = (id: string): ConversationHistory | null => {
  const histories = getAllHistories();
  const history = histories.find(h => h.id === id);
  return history || null;
};

// Delete a specific history by ID
export const deleteHistory = (id: string): void => {
  try {
    const histories = getAllHistories();
    const filteredHistories = histories.filter(h => h.id !== id);
    localStorage.setItem(HISTORIES_STORAGE_KEY, JSON.stringify(filteredHistories));
  } catch (error) {
    console.error("Failed to delete conversation history:", error);
  }
};

// Delete all histories
export const deleteAllHistories = (): void => {
  try {
    localStorage.removeItem(HISTORIES_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to delete all conversation histories:", error);
  }
};
