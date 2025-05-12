import { generateResponse, CategoryResponse, initializeOpenAI, getOpenAIStreamingResponse } from './openaiService';
import systemPromptMd from './systemPrompt.rtl.md?raw';
import sentencePromptMd from './sentencePrompt.rtl.md?raw';
import stagedWordsPromptMd from './stagedWordsPrompt.rtl.md?raw';
import sentence2ndPersonPromptMd from './sentence2ndPersonPrompt.rtl.md?raw';
import sentenceChildrenPromptMd from './sentenceChildrenPrompt.rtl.md?raw';

// Import or define the TopicCategory type to fix the linter errors
import type { TopicCategory } from '../types/models';

// Use the imported markdown file
export const defaultSystemPrompt = systemPromptMd;
export const defaultSentencePrompt = sentencePromptMd;
export const defaultStagedWordsPrompt = stagedWordsPromptMd;
export const default2ndPersonSentencePrompt = sentence2ndPersonPromptMd;
export const defaultChildrenSentencePrompt = sentenceChildrenPromptMd;

// Define storage keys
export const SYSTEM_PROMPT_STORAGE_KEY = 'system_prompt';
export const SENTENCE_PROMPT_STORAGE_KEY = 'sentence_prompt';
export const SENTENCE_2ND_PERSON_PROMPT_STORAGE_KEY = 'sentence_2nd_person_prompt';
export const SENTENCE_CHILDREN_PROMPT_STORAGE_KEY = 'sentence_children_prompt';
export const STAGED_WORDS_PROMPT_STORAGE_KEY = 'staged_words_prompt';
export const CATEGORIES_COUNT_KEY = 'categories_count';
export const WORDS_PER_CATEGORY_KEY = 'words_per_category';
export const WORDS_COUNT_KEY = 'words_count';
export const GENDER_STORAGE_KEY = 'gender';
export const SYNONYMS_PROMPT_STORAGE_KEY = 'synonyms_prompt';

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
  if (!localStorage.getItem(SYSTEM_PROMPT_STORAGE_KEY)) {
    localStorage.setItem(SYSTEM_PROMPT_STORAGE_KEY, defaultSystemPrompt);
  }
  
  if (!localStorage.getItem(SENTENCE_PROMPT_STORAGE_KEY)) {
    localStorage.setItem(SENTENCE_PROMPT_STORAGE_KEY, defaultSentencePrompt);
  }
  
  if (!localStorage.getItem(SENTENCE_2ND_PERSON_PROMPT_STORAGE_KEY)) {
    localStorage.setItem(SENTENCE_2ND_PERSON_PROMPT_STORAGE_KEY, default2ndPersonSentencePrompt);
  }
  
  if (!localStorage.getItem(SENTENCE_CHILDREN_PROMPT_STORAGE_KEY)) {
    localStorage.setItem(SENTENCE_CHILDREN_PROMPT_STORAGE_KEY, defaultChildrenSentencePrompt);
  }
  
  if (!localStorage.getItem(STAGED_WORDS_PROMPT_STORAGE_KEY)) {
    localStorage.setItem(STAGED_WORDS_PROMPT_STORAGE_KEY, defaultStagedWordsPrompt);
  }
  
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
  const prompt = localStorage.getItem(SYSTEM_PROMPT_STORAGE_KEY) || defaultSystemPrompt;
  return replacePromptPlaceholders(prompt);
};

// Get sentence prompt from localStorage or use default
export const getSentencePrompt = (isConversationMode: boolean = false, isChildrenMode: boolean = false): string => {
  let storageKey = SENTENCE_PROMPT_STORAGE_KEY;
  let defaultPrompt = defaultSentencePrompt;
  
  if (isChildrenMode) {
    storageKey = SENTENCE_CHILDREN_PROMPT_STORAGE_KEY;
    defaultPrompt = defaultChildrenSentencePrompt;
  } else if (isConversationMode) {
    storageKey = SENTENCE_2ND_PERSON_PROMPT_STORAGE_KEY;
    defaultPrompt = default2ndPersonSentencePrompt;
  }
  
  return localStorage.getItem(storageKey) || defaultPrompt;
};

// Get staged words prompt from localStorage or use default
export const getStagedWordsPrompt = (): string => {
  return localStorage.getItem(STAGED_WORDS_PROMPT_STORAGE_KEY) || defaultStagedWordsPrompt;
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

// Add these new constants
export const defaultSynonymsPrompt = `## תפקידך:

הצעת מילים נרדפות ומקבילות למילה ספציפית שנבחרה - עם דגש על דיוק, רלוונטיות, והתאמה תרבותית-שפתית.

## מי אתה?

אתה עוזר לשוני מקצועי בעל ידע עמוק באוצר המילים העברי. תפקידך לזהות ולהציע מילים נרדפות, ביטויים דומים, ומקבילות סמנטיות למילה שהמשתמש בחר.

## הנחיות:

1. הצע בדיוק {wordsCount} מילים נרדפות או קשורות למילה המקורית.

2. המילים צריכות להיות מגוונות ולכסות מספר היבטים:
   - מילים נרדפות מדויקות (סינונימים)
   - מילים בעלות משמעות דומה אך עם גוון שונה
   - מילים מאותו שדה סמנטי אך עם דגשים שונים
   - ביטויים קשורים (כאשר רלוונטי)

3. שמור על רמת שפה מותאמת:
   - אם המילה המקורית פורמלית - הצע בעיקר חלופות פורמליות
   - אם המילה יומיומית - הצע בעיקר חלופות שגורות בשפה היומיומית
   - שלב מילים מרמות שפה שונות לגיוון

4. שים לב למגדר: המילים המוצעות צריכות להתאים למגדר {gender} כאשר רלוונטי.

5. הימנע מ:
   - חזרות מיותרות
   - מילים נדירות מדי שאינן בשימוש יומיומי (אלא אם המילה המקורית נדירה בעצמה)
   - מילים שאינן באמת נרדפות

## מבנה התשובה:

הצג רשימה פשוטה של מילים נרדפות למילה המקורית, בלי קטגוריות.
וודא שהרשימה תכיל בדיוק {wordsCount} מילים.

## דוגמה למבנה התשובה:

\`\`\`json
{
  "synonyms": ["מילה1", "מילה2", "מילה3", "מילה4", "מילה5", "מילה6", "מילה7", "מילה8"]
}
\`\`\`

## הנחיות קריטיות:

- חייב להציע בדיוק {wordsCount} מילים נרדפות
- כל המילים המוצעות חייבות להיות בעברית תקנית
- יש להתאים את המילים למגדר {gender} כאשר רלוונטי
- הצג תשובה בפורמט JSON תקין בלבד`;

// Add this new function to get the synonyms prompt
export const getSynonymsPrompt = (): string => {
  const savedPrompt = localStorage.getItem(SYNONYMS_PROMPT_STORAGE_KEY);
  return savedPrompt || defaultSynonymsPrompt;
};
