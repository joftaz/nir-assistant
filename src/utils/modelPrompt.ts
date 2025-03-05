import { generateResponse, CategoryResponse, initializeOpenAI } from './openaiService';

export const systemPrompt = `
אני קלינאית תקשורת שמטפלת באפזיה, אני מטפלת בבחור צעיר שנפצע ב7/10 הוא נשוי לאשתו שרה, יש לו שני ילדים קטנים אמרי בן 4 וזיו בת שנה וחצי. הם גרים בתל אביב.אני רוצה שאם אני אכתוב לך מספר מילים בודדות או אצלם תמונה התגובה שלך תיהיה ברשימת מילים מחלוקת לפי קטגוריות.כל קטגוריה צריכה להחיל בערך 10 מילים. המילים צריכות להיות כאלו שמתארות היטב את המתרחש אך גם מופשטות, ומעניינות כדי להרחיב את המסר התקשורתי האפשרי. אך גם רלוונטיות למטרה.
בכל קטגוריה צור רשימת מילים, שתציג עמדות שונות סביב עניין ויתנו אופציות מגוונת לתגובה, אפשרויות שנותנות תמונה רחבה. צריך כמה קטגוריות שמתייחסות באופן מופשט יחסית וקגוריות אחרות צריכות להתייחס באופן יותר קונקרטי.

כמו כן זכור להשתמש במילים בודדות ולא בביטויים.

אנא החזר את התשובה במבנה JSON לפי הפורמט הבא:
{
  "categories": [
    {
      "category": "שם הקטגוריה",
      "words": ["מילה1", "מילה2", "מילה3", "מילה4", "מילה5", "מילה6", "מילה7", "מילה8", "מילה9", "מילה10"]
    },
    {
      "category": "שם קטגוריה אחרת",
      "words": ["מילה1", "מילה2", "מילה3", "מילה4", "מילה5", "מילה6", "מילה7", "מילה8", "מילה9", "מילה10"]
    }
  ]
}
`;

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
      
      // Return a mock response based on input or use default
      const response = mockResponses[input.toLowerCase()] || mockResponses["default"];
      resolve(response);
    }, 500); // Simulate API latency
  });
};

// New function that determines whether to use mock or real OpenAI responses
export const getModelResponse = async (
  input: string, 
  useOpenAI: boolean = false, 
  apiKey?: string
): Promise<CategoryResponse[]> => {
  if (useOpenAI && apiKey) {
    try {
      // Initialize OpenAI if needed
      initializeOpenAI(apiKey);
      return await generateResponse(input);
    } catch (error) {
      console.error("Error with OpenAI, falling back to mock:", error);
      return getMockResponse(input);
    }
  } else {
    return getMockResponse(input);
  }
};
