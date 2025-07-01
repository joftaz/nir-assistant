import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Mock response data (same as in modelPrompt.ts)
const getMockResponse = (input: string): Array<{category: string; words: string[]}> => {
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
  
  return mockResponses[input.toLowerCase()] || mockResponses["default"];
};

// Parse OpenAI response (same logic as in openaiService.ts)
const parseOpenAIResponse = (content: string): Array<{category: string; words: string[]}> => {
  try {
    // Try to parse JSON directly
    const jsonResponse = JSON.parse(content);
    
    // Handle the new format with a "categories" wrapper
    if (jsonResponse.categories && Array.isArray(jsonResponse.categories)) {
      console.log("Found categories array in wrapper object");
      return jsonResponse.categories.map(item => {
        const categoryKey = Object.keys(item).find(key => key.match(/^category\d*$/));
        
        if (categoryKey && categoryKey !== "category" && Array.isArray(item.words)) {
          return {
            category: item[categoryKey],
            words: item.words
          };
        }
        
        return item;
      });
    }
    
    // For direct array response (old format)
    if (Array.isArray(jsonResponse)) {
      return jsonResponse.map(item => {
        const categoryKey = Object.keys(item).find(key => key.match(/^category\d*$/));
        
        if (categoryKey && categoryKey !== "category" && Array.isArray(item.words)) {
          return {
            category: item[categoryKey],
            words: item.words
          };
        }
        
        return item;
      });
    }

    // For response_format: { type: "json_object" }
    for (const key in jsonResponse) {
      if (Array.isArray(jsonResponse[key])) {
        const arrayProperty = jsonResponse[key];
        const transformedArray = arrayProperty.map(item => {
          const categoryKey = Object.keys(item).find(key => key.match(/^category\d*$/));
          
          if (categoryKey && categoryKey !== "category" && Array.isArray(item.words)) {
            return {
              category: item[categoryKey],
              words: item.words
            };
          }
          
          return item;
        });
        
        if (transformedArray.length > 0 && 
            (transformedArray[0].category || Object.keys(transformedArray[0]).some(k => k.match(/^category\d*$/)))) {
          console.log("Found categories array in property:", key);
          return transformedArray;
        }
      }
    }
    
    // Fallback to text parsing
    const lines = content.split('\n').filter(line => line.trim());
    const categories: Array<{category: string; words: string[]}> = [];
    let currentCategory = '';
    
    for (const line of lines) {
      if (line.includes('**') || line.includes(':')) {
        const categoryMatch = line.match(/\*\*(.*?)\*\*|(.+?):/);
        if (categoryMatch) {
          currentCategory = (categoryMatch[1] || categoryMatch[2]).trim();
          const wordsLine = line.replace(/\*\*(.*?)\*\*:?|(.+?):/, '').trim();
          
          if (wordsLine) {
            const words = wordsLine.split(/,\s*/).map(word => word.trim()).filter(Boolean);
            categories.push({ category: currentCategory, words });
          } else {
            categories.push({ category: currentCategory, words: [] });
          }
        }
      } else if (currentCategory && categories.length > 0) {
        const words = line.split(/,\s*/).map(word => word.trim()).filter(Boolean);
        const lastCategory = categories[categories.length - 1];
        lastCategory.words = [...lastCategory.words, ...words];
      }
    }
    
    return categories;
  } catch (error) {
    console.error("Error parsing OpenAI response:", error);
    return [];
  }
};

const defaultSystemJsonInstruction = `
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  
  try {
    const { prompt, useOpenAI = true, systemPrompt = "", isStreaming = false } = await req.json();
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    console.log('Received request:', { useOpenAI, isStreaming, hasApiKey: !!OPENAI_API_KEY });
    
    // If not using OpenAI or no API key, return mock data
    if (!useOpenAI || !OPENAI_API_KEY) {
      console.log('Using mock response');
      const mockData = getMockResponse(prompt);
      
      if (isStreaming) {
        // Simulate streaming for mock data
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            // Send each category as a separate chunk
            mockData.forEach((category, index) => {
              setTimeout(() => {
                const chunk = `data: ${JSON.stringify({
                  type: 'category',
                  data: category
                })}\n\n`;
                controller.enqueue(encoder.encode(chunk));
                
                // Send done signal after last category
                if (index === mockData.length - 1) {
                  setTimeout(() => {
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
                  }, 300);
                }
              }, index * 300);
            });
          }
        });
        
        return new Response(stream, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          }
        });
      } else {
        return new Response(JSON.stringify({
          categories: mockData
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    }
    
    console.log('Making request to OpenAI with prompt:', prompt.substring(0, 100) + '...');
    
    // Construct full system prompt
    const fullSystemPrompt = `${systemPrompt}\n\n${defaultSystemJsonInstruction}`;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: fullSystemPrompt
          },
          {
            role: 'user',
            content: "מילים מהמטופל: " + prompt
          }
        ],
        temperature: 0.7,
        stream: isStreaming,
        response_format: { type: "json_object" }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      
      // Fallback to mock data on OpenAI error
      console.log('Falling back to mock response due to OpenAI error');
      const mockData = getMockResponse(prompt);
      
      return new Response(JSON.stringify({
        categories: mockData
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    if (isStreaming) {
      // For streaming responses, process the stream and convert to our format
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body?.getReader();
          if (!reader) {
            controller.close();
            return;
          }
          
          let fullResponse = '';
          const processedCategories = new Set<string>();
          
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const chunk = new TextDecoder().decode(value);
              const lines = chunk.split('\n');
              
              for (const line of lines) {
                if (line.trim() === '') continue;
                
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  
                  if (data === '[DONE]') {
                    // Process final response
                    if (fullResponse.trim()) {
                      console.log('Processing final response:', fullResponse);
                      const categories = parseOpenAIResponse(fullResponse);
                      
                      // Send any categories we haven't sent yet
                      for (const category of categories) {
                        if (!processedCategories.has(category.category)) {
                          processedCategories.add(category.category);
                          const chunk = `data: ${JSON.stringify({
                            type: 'category',
                            data: category
                          })}\n\n`;
                          controller.enqueue(encoder.encode(chunk));
                        }
                      }
                    }
                    
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
                    return;
                  }
                  
                  try {
                    const json = JSON.parse(data);
                    const content = json.choices[0]?.delta?.content || '';
                    
                    if (content) {
                      fullResponse += content;
                      
                      // Try to extract complete categories as they come in
                      const categoryMatches = fullResponse.match(/"(category\d*)"\s*:\s*"([^"]*)"/g);
                      const wordsMatches = fullResponse.match(/"words"\s*:\s*\[((?:"[^"]*"(?:,\s*)?)+)\]/g);
                      
                      if (categoryMatches && wordsMatches && categoryMatches.length === wordsMatches.length) {
                        for (let i = 0; i < categoryMatches.length; i++) {
                          try {
                            const matches = categoryMatches[i].match(/"(category\d*)"\s*:\s*"([^"]*)"/);
                            if (!matches) continue;
                            
                            const categoryName = matches[2];
                            
                            if (processedCategories.has(categoryName)) continue;
                            
                                                         const wordsMatch = wordsMatches[i].match(/"words"\s*:\s*\[((?:"[^"]*"(?:,\s*)?)+)\]/);
                             if (!wordsMatch) continue;
                             const wordsArrayString = wordsMatch[1];
                            const words = wordsArrayString.split(',')
                              .map(w => w.trim().replace(/^"(.*)"$/, '$1'))
                              .filter(w => w);
                            
                            if (categoryName && words.length > 0) {
                              processedCategories.add(categoryName);
                              const category = {
                                category: categoryName,
                                words: words
                              };
                              
                              console.log("Sending category via stream:", categoryName);
                              const chunk = `data: ${JSON.stringify({
                                type: 'category',
                                data: category
                              })}\n\n`;
                              controller.enqueue(encoder.encode(chunk));
                            }
                          } catch (e) {
                            // Skip parsing errors
                          }
                        }
                      }
                    }
                  } catch (e) {
                    // Ignore parse errors in streaming
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error processing stream:', error);
            
            // Fallback to mock data on streaming error
            const mockData = getMockResponse(prompt);
            for (const category of mockData) {
              const chunk = `data: ${JSON.stringify({
                type: 'category',
                data: category
              })}\n\n`;
              controller.enqueue(encoder.encode(chunk));
            }
            
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          }
        }
      });
      
      return new Response(stream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    } else {
      // Non-streaming response
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      console.log('OpenAI response:', content);
      
      if (!content) {
        // Fallback to mock data if no content
        const mockData = getMockResponse(prompt);
        return new Response(JSON.stringify({
          categories: mockData
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      
      const categories = parseOpenAIResponse(content);
      
      return new Response(JSON.stringify({
        categories: categories
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('Error in ai-model-response function:', error);
    
    // Always fallback to mock data on any error
    console.log('Falling back to mock response due to error');
    const mockData = getMockResponse('default');
    
    return new Response(JSON.stringify({
      categories: mockData
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
