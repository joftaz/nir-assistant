import { generateResponse, CategoryResponse, initializeOpenAI, getOpenAIStreamingResponse } from './openaiService';
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/integrations/supabase/client';
import systemPromptMd from './systemPrompt.rtl.md?raw';
import sentencePromptMd from './sentencePrompt.rtl.md?raw';
import stagedWordsPromptMd from './stagedWordsPrompt.rtl.md?raw';
import sentence2ndPersonPromptMd from './sentence2ndPersonPrompt.rtl.md?raw';
import sentenceChildrenPromptMd from './sentenceChildrenPrompt.rtl.md?raw';
import synonymsPromptMd from './synonymsPrompt.rtl.md?raw';

// Import or define the TopicCategory type to fix the linter errors
import type { TopicCategory } from '../types/models';

// Use the imported markdown file
export const defaultSystemPrompt = systemPromptMd;
export const defaultSentencePrompt = sentencePromptMd;
export const defaultStagedWordsPrompt = stagedWordsPromptMd;
export const default2ndPersonSentencePrompt = sentence2ndPersonPromptMd;
export const defaultChildrenSentencePrompt = sentenceChildrenPromptMd;
export const defaultSynonymsPrompt = synonymsPromptMd;

// Define storage keys
export const CATEGORIES_COUNT_KEY = 'categories_count';
export const WORDS_PER_CATEGORY_KEY = 'words_per_category';
export const WORDS_COUNT_KEY = 'words_count';
export const GENDER_STORAGE_KEY = 'gender';

export const defaultSystemJsonInstruction = `
===== System Instructions =====
IMPORTANT:
0. Return a list of categories with words. Every item in the list is dict with two keys: "category" and "words".
1. Make sure the structure is valid with double quotes ("") around all property names and string values.
2. The "category" property must be surrounded by double quotes.
3. The "words" property must be surrounded by double quotes.
4. Each word in the words array must be surrounded by double quotes.
5. Ensure the JSON formatting is correct, including commas between items and structural validity.
6. Do not include control characters or unencoded special characters within strings.
7. IF YOU WILL RESPOND WITH ONLY A SINGLE CATEGORY, I WILL BE VERY ANGRY and VERY DISAPPOINTED. THE SUCCESS OF THIS INJURED MAN IS DEPENDS ON IT.
Please return only a valid JSON structure.
IMPORTANT: Please return the answer in JSON format only according to the following structure:
example:
{"categories":
[
  {
    "category1": "שם הקטגוריה",
    "words": ["מילה1", "מילה2", "מילה3", "מילה4", "מילה5", "מילה6", "מילה7", "מילה8", "מילה9", "מילה10"]
  },
  {
    "category2": "שם קטגוריה אחרת",
    "words": ["מילה1", "מילה2", "מילה3", "מילה4", "מילה5", "מילה6", "מילה7", "מילה8"]
  },
  {
    "category3": "שם קטגוריה שלישי",
    "words": ["מילה1", "מילה2", "מילה3", "מילה4", "מילה5", "מילה6", "מילה7", "מילה8"]
  }
]
}
`;

// Initialize system prompt and settings in localStorage if not present
export const initializeSystemPrompt = (): void => {

  if (!localStorage.getItem(CATEGORIES_COUNT_KEY)) {
    localStorage.setItem(CATEGORIES_COUNT_KEY, '4');
  }
  
  if (!localStorage.getItem(WORDS_PER_CATEGORY_KEY)) {
    localStorage.setItem(WORDS_PER_CATEGORY_KEY, '10');
  }
  
  if (!localStorage.getItem(WORDS_COUNT_KEY)) {
    localStorage.setItem(WORDS_COUNT_KEY, '10');
  }
  
  if (!localStorage.getItem(GENDER_STORAGE_KEY)) {
    localStorage.setItem(GENDER_STORAGE_KEY, 'זכר');
  }
};

// Get system prompt from localStorage or use default
export const getSystemPrompt = (): string => {
  const prompt = defaultSystemPrompt;
  return replacePromptPlaceholders(prompt);
};

// Get sentence prompt from localStorage or use default
export const getSentencePrompt = (isConversationMode: boolean = false, isChildrenMode: boolean = false): string => {
  let defaultPrompt = defaultSentencePrompt;

  if (isChildrenMode) {
    defaultPrompt = defaultChildrenSentencePrompt;
  } else if (isConversationMode) {
    defaultPrompt = default2ndPersonSentencePrompt;
  }

  return defaultPrompt;
};

// Get staged words prompt from localStorage or use default
export const getStagedWordsPrompt = (): string => {
  return defaultStagedWordsPrompt;
};

// This is kept for fallback or testing purposes
export const getMockResponse = (input: string): Promise<Array<{category: string; words: string[]}>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // These are mock responses - in production this would be from an actual API call
      const mockResponses: Record<string, Array<{category: string; words: string[]}>> = {
        "default": [
          {
            category: "רגשות",
            words: ["שמחה", "עצב", "כעס", "פחד", "אהבה", "תסכול", "הקלה", "געגוע", "תקווה", "דאגה"]
          },
          {
            category: "פעולות",
            words: ["ללכת", "לדבר", "לנוח", "לחשוב", "להרגיש", "לאכול", "לישון", "לראות", "לשמוע", "לגעת"]
          },
          {
            category: "משפחה",
            words: ["אישה", "ילדים", "אבא", "אמא", "אח", "אחות", "סבא", "סבתא", "דוד", "דודה"]
          }
        ],
        // Example with few words per category for testing the new sizing
        "מינימום": [
          {
            category: "רגשות",
            words: ["שמחה", "עצב"]
          },
          {
            category: "פעולות",
            words: ["ללכת", "לדבר", "לנוח"]
          },
          {
            category: "משפחה",
            words: ["אבא", "אמא"]
          }
        ],
        "ספורט": [
          {
            category: "ענפי ספורט",
            words: ["כדורגל", "כדורסל", "שחייה", "טניס", "ריצה", "אופניים", "יוגה", "הליכה", "גולף", "אתלטיקה"]
          },
          {
            category: "ציוד ספורט",
            words: ["כדור", "נעליים", "בגדים", "מחבט", "משקולות", "מזרן", "שעון", "בקבוק", "כפפות", "קסדה"]
          },
          {
            category: "תחושות",
            words: ["התלהבות", "מאמץ", "הזעה", "עייפות", "סיפוק", "כוח", "גמישות", "מהירות", "דופק", "נשימה"]
          }
        ],
        "אוכל": [
          {
            category: "סוגי מזון",
            words: ["פירות", "ירקות", "בשר", "דגים", "מאפים", "חלב", "גבינות", "דגנים", "קטניות", "ממתקים"]
          },
          {
            category: "טעמים",
            words: ["מתוק", "חמוץ", "מלוח", "מר", "חריף", "עשיר", "רענן", "מעודן", "עמוק", "קל"]
          },
          {
            category: "ארוחות",
            words: ["בוקר", "צהריים", "ערב", "חטיף", "מנה", "תוספת", "עיקרית", "קינוח", "מרק", "סלט"]
          }
        ],
        "משפחה": [
          {
            category: "בני משפחה",
            words: ["אישה", "בעל", "ילד", "ילדה", "אבא", "אמא", "סבא", "סבתא", "אח", "אחות"]
          },
          {
            category: "פעילויות משפחתיות",
            words: ["טיול", "משחק", "שיחה", "ארוחה", "מפגש", "חגיגה", "לימוד", "צפייה", "קריאה", "בילוי"]
          },
          {
            category: "רגשות משפחתיים",
            words: ["אהבה", "דאגה", "גאווה", "הערכה", "תמיכה", "הגנה", "געגוע", "שמחה", "חום", "ביטחון"]
          },
          {
            category: "זכרונות",
            words: ["ילדות", "חתונה", "לידה", "חגים", "מסורת", "טקסים", "אלבום", "סיפורים", "ירושה", "מורשת"]
          }
        ]
      };
      
      // Get matching response or default
      const mockData = mockResponses[input.toLowerCase()] || mockResponses["default"];
      resolve(mockData);
    }, 1000);
  });
};

// New function to call the Supabase edge function
export const getModelResponseFromSupabase = async (
  prompt: string, 
  useOpenAI: boolean = true, 
  apiKey: string = '',
  onPartialResponse?: (group: TopicCategory) => void
): Promise<TopicCategory[]> => {
  try {
    const systemPrompt = getSystemPrompt();
    
    console.log('Calling Supabase edge function:', { useOpenAI, hasApiKey: !!apiKey, isStreaming: !!onPartialResponse });
    console.log("Yonia: systemPrompt is: ", systemPrompt, "prompt is: ", prompt);

    // For streaming requests, use direct fetch to the edge function URL
    if (onPartialResponse) {
      console.log('Using streaming fetch to Supabase edge function');
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-model-response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          prompt,
          useOpenAI,
          systemPrompt,
          isStreaming: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No readable stream available');
      }

      const results: TopicCategory[] = [];
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Convert chunk to text and add to buffer
          const chunk = new TextDecoder().decode(value);
          buffer += chunk;

          // Process complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.trim() === '') continue;
            
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                console.log('Streaming complete');
                return results;
              }
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'category' && parsed.data) {
                  console.log('Received category via stream:', parsed.data.category);
                  onPartialResponse(parsed.data);
                  results.push(parsed.data);
                }
              } catch (e) {
                console.error('Error parsing streaming data:', e);
              }
            }
          }
        }
      } catch (streamError) {
        console.error('Error processing stream:', streamError);
        throw streamError;
      }

      return results;
    } else {
      // For non-streaming requests, use the regular Supabase client
      console.log('Using non-streaming Supabase client invoke');
      
      const { data, error } = await supabase.functions.invoke('ai-model-response', {
        body: {
          prompt,
          useOpenAI,
          systemPrompt,
          isStreaming: false
        }
      });
      
      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }
      
      console.log('Processing non-streaming response from Supabase');
      return data?.categories || [];
    }
  } catch (error) {
    console.error('Error calling Supabase edge function:', error);
    
    // Fallback to mock data
    console.log('Falling back to mock response');
    const mockData = await getMockResponse(prompt);
    
    if (onPartialResponse) {
      // Simulate streaming for mock data
      const results: TopicCategory[] = [];
      for (const group of mockData) {
        await new Promise(resolve => setTimeout(resolve, 300));
        onPartialResponse(group as TopicCategory);
        results.push(group as TopicCategory);
      }
      return results;
    }
    
    return mockData as TopicCategory[];
  }
};

// Replace the current getModelResponse function
export const getModelResponse = async (
  prompt: string, 
  useOpenAI: boolean = true, 
  apiKey: string = '',
  onPartialResponse?: (group: TopicCategory) => void
): Promise<TopicCategory[]> => {
  // Use the Supabase edge function instead of direct OpenAI calls
  return await getModelResponseFromSupabase(prompt, useOpenAI, apiKey, onPartialResponse);
};

// Keep the old implementation as a fallback (renamed)
export const getModelResponseDirect = async (
  prompt: string, 
  useOpenAI: boolean = true, 
  apiKey: string = '',
  onPartialResponse?: (group: TopicCategory) => void
): Promise<TopicCategory[]> => {
  if (useOpenAI && apiKey) {
    try {
      // Use OpenAI streaming response
      if (onPartialResponse) {
        return await getOpenAIStreamingResponse(prompt, apiKey, onPartialResponse);
      } else {
        // Call the original OpenAI service if no streaming callback
        return await generateResponse(prompt, apiKey);
      }
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      // Fallback to mock
      console.log('Falling back to mock response');
    }
  }
  
  // Use mock data for testing or when OpenAI is not available
  const mockData = await getMockResponse(prompt);
  
  if (onPartialResponse) {
    // Simulate streaming for mock data
    const results: TopicCategory[] = [];
    // Convert Promise to actual data before iteration
    for (const group of await mockData) {
      await new Promise(resolve => setTimeout(resolve, 300)); // Delay for simulation
      onPartialResponse(group as TopicCategory);
      results.push(group as TopicCategory);
    }
    return results;
  }
  
  return mockData as TopicCategory[];
};

export const replacePromptPlaceholders = (prompt: string): string => {
  const categoriesCount = localStorage.getItem(CATEGORIES_COUNT_KEY) || '4';
  const wordsPerCategory = localStorage.getItem(WORDS_PER_CATEGORY_KEY) || '10';
  const wordsCount = localStorage.getItem(WORDS_COUNT_KEY) || '10';
  const gender = localStorage.getItem(GENDER_STORAGE_KEY) || 'זכר';
  
  return prompt
    .replace(/{categoriesCount}/g, categoriesCount)
    .replace(/{wordsPerCategory}/g, wordsPerCategory)
    .replace(/{wordsCount}/g, wordsCount)
    .replace(/{gender}/g, gender);
};

// Add this new function to get the synonyms prompt
export const getSynonymsPrompt = (): string => {  
  return defaultSynonymsPrompt;
};
