import { generateResponse, CategoryResponse, initializeOpenAI, getOpenAIStreamingResponse } from './openaiService';
import systemPromptMd from './systemPrompt.rtl.md?raw';
import sentencePromptMd from './sentencePrompt.rtl.md?raw';

// Import or define the TopicCategory type to fix the linter errors
import type { TopicCategory } from '../types/models';

// Use the imported markdown file
export const defaultSystemPrompt = systemPromptMd;
export const defaultSentencePrompt = sentencePromptMd;

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
  if (!localStorage.getItem('system_prompt')) {
    localStorage.setItem('system_prompt', defaultSystemPrompt);
  }
  
  if (!localStorage.getItem('categories_count')) {
    localStorage.setItem('categories_count', '4');
  }
  
  if (!localStorage.getItem('words_per_category')) {
    localStorage.setItem('words_per_category', '10');
  }
};

// Get system prompt from localStorage or use default
export const getSystemPrompt = (): string => {
  const prompt = localStorage.getItem('system_prompt') || defaultSystemPrompt;
  return replacePromptPlaceholders(prompt);
};

// Get sentence prompt
export const getSentencePrompt = (): string => {
  return defaultSentencePrompt;
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

// New function that determines whether to use mock or real OpenAI responses
export const getModelResponse = async (
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
  const categoriesCount = localStorage.getItem('categories_count') || '4';
  const wordsPerCategory = localStorage.getItem('words_per_category') || '10';
  
  return prompt
    .replace(/{categoriesCount}/g, categoriesCount)
    .replace(/{wordsPerCategory}/g, wordsPerCategory);
};
