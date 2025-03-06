import OpenAI from "openai";
import { defaultSystemPrompt, defaultSystemJsonInstruction, getMockResponse } from "./modelPrompt";
import type { TopicCategory } from '../types/models';

// Initialize OpenAI - this will use the API key from OPENAI_API_KEY environment variable
// In a production environment, this should come from server-side
let openai: OpenAI | null = null;

export const initializeOpenAI = (apiKey: string) => {
  openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true // This is for client-side usage, in production use server-side
  });
  return openai;
};

export const getOpenAI = () => {
  if (!openai) {
    throw new Error("OpenAI client not initialized. Call initializeOpenAI first.");
  }
  return openai;
};

export interface CategoryResponse {
  category: string;
  words: string[];
}

export const generateResponse = async (input: string, systemPrompt: string): Promise<CategoryResponse[]> => {
  if (!openai) {
    throw new Error("OpenAI client not initialized. Call initializeOpenAI first.");
  }

  try {
    console.log("Generating response with OpenAI...");
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // or another model like "gpt-3.5-turbo"
      messages: [
        { role: "system", content: systemPrompt + "\n\n" + defaultSystemJsonInstruction },
        { role: "user", content: "מילים מהמטופל: " + input }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("No response content from OpenAI");
    }

    console.log("OpenAI response received, parsing...");
    const categories = parseOpenAIResponse(content);
    console.log(`Parsed ${categories.length} categories from response`);
    return categories;
  } catch (error) {
    console.error("Error generating response from OpenAI:", error);
    throw error;
  }
};

// Parse the OpenAI response into our expected format
const parseOpenAIResponse = (content: string): CategoryResponse[] => {
  try {
    // Try to parse JSON directly
    const jsonResponse = JSON.parse(content);
    
    // Handle the new format with a "categories" wrapper
    if (jsonResponse.categories && Array.isArray(jsonResponse.categories)) {
      console.log("Found categories array in wrapper object");
      // Transform any numbered category properties to the standard format
      return jsonResponse.categories.map(item => {
        // Check for numbered category properties (category1, category2, etc.)
        const categoryKey = Object.keys(item).find(key => key.match(/^category\d*$/));
        
        if (categoryKey && categoryKey !== "category" && Array.isArray(item.words)) {
          // Return a standardized object with the "category" property
          return {
            category: item[categoryKey],
            words: item.words
          };
        }
        
        // If it already has the standard "category" property, return as is
        return item;
      });
    }
    
    // For direct array response (old format)
    if (Array.isArray(jsonResponse)) {
      // Transform any numbered category properties to the standard format
      return jsonResponse.map(item => {
        // Check for numbered category properties (category1, category2, etc.)
        const categoryKey = Object.keys(item).find(key => key.match(/^category\d*$/));
        
        if (categoryKey && categoryKey !== "category" && Array.isArray(item.words)) {
          // Return a standardized object with the "category" property
          return {
            category: item[categoryKey],
            words: item.words
          };
        }
        
        // If it already has the standard "category" property, return as is
        return item;
      });
    }

    // For response_format: { type: "json_object" } 
    // This wraps our array in a JSON object with a property (often "response" or "results")
    // Try to find an array property
    for (const key in jsonResponse) {
      if (Array.isArray(jsonResponse[key])) {
        const arrayProperty = jsonResponse[key];
        // Transform any items with numbered category properties
        const transformedArray = arrayProperty.map(item => {
          // Check for numbered category properties
          const categoryKey = Object.keys(item).find(key => key.match(/^category\d*$/));
          
          if (categoryKey && categoryKey !== "category" && Array.isArray(item.words)) {
            // Return a standardized object
            return {
              category: item[categoryKey],
              words: item.words
            };
          }
          
          return item;
        });
        
        // Check if any item in the transformed array has category/words properties
        if (transformedArray.length > 0 && 
            (transformedArray[0].category || Object.keys(transformedArray[0]).some(k => k.match(/^category\d*$/)))) {
          console.log("Found categories array in property:", key);
          return transformedArray;
        }
      }
    }
    
    // Fallback to the text parsing logic for backward compatibility
    const lines = content.split('\n').filter(line => line.trim());
    const categories: CategoryResponse[] = [];
    let currentCategory = '';
    
    for (const line of lines) {
      // If line starts with ** or has **: it's likely a category title
      if (line.includes('**') || line.includes(':')) {
        const categoryMatch = line.match(/\*\*(.*?)\*\*|(.+?):/);
        if (categoryMatch) {
          currentCategory = (categoryMatch[1] || categoryMatch[2]).trim();
          const wordsLine = line.replace(/\*\*(.*?)\*\*:?|(.+?):/, '').trim();
          
          if (wordsLine) {
            // If there are words on the same line as the category
            const words = wordsLine.split(/,\s*/).map(word => word.trim()).filter(Boolean);
            categories.push({ category: currentCategory, words });
          } else {
            // If it's just the category, prepare for words on next line
            categories.push({ category: currentCategory, words: [] });
          }
        }
      } else if (currentCategory && categories.length > 0) {
        // This line should contain words for the current category
        const words = line.split(/,\s*/).map(word => word.trim()).filter(Boolean);
        // Add to the most recently added category
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

export const getOpenAIStreamingResponse = async (
  prompt: string,
  apiKey: string,
  onPartialResponse?: (group: TopicCategory) => void
): Promise<TopicCategory[]> => {
  const systemPrompt = localStorage.getItem('system_prompt') || defaultSystemPrompt;
  
  const results: TopicCategory[] = [];
  const processedCategories = new Set<string>();
  
  try {
    console.log("Initializing OpenAI with streaming API...");
    
    // Function to safely add a category and trigger callback
    const addCategory = (category: TopicCategory) => {
      if (!processedCategories.has(category.category)) {
        processedCategories.add(category.category);
        results.push(category);
        
        if (onPartialResponse) {
          console.log("Calling onPartialResponse with category:", category.category);
          onPartialResponse(category);
        }
        return true;
      }
      return false;
    };

    // Helper function to standardize category objects with numbered properties
    const standardizeCategory = (item: any): TopicCategory | null => {
      try {
        // Check for standard category property
        if (item.category && Array.isArray(item.words)) {
          return item as TopicCategory;
        }
        
        // Check for numbered category properties (category1, category2, etc.)
        const categoryKey = Object.keys(item).find(key => key.match(/^category\d*$/));
        if (categoryKey && Array.isArray(item.words)) {
          return {
            category: item[categoryKey],
            words: item.words
          };
        }
        
        return null;
      } catch (e) {
        console.error("Error standardizing category:", e);
        return null;
      }
    };
    
    // Construct the message with the system prompt + JSON instruction
    const fullSystemPrompt = `${systemPrompt}\n\n${defaultSystemJsonInstruction}`;
    
    // Make the API call with streaming
    console.log("Calling OpenAI API with streaming...");
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: 'system', content: fullSystemPrompt },
          { role: 'user', content: prompt }
        ],
        stream: true,  // Turn streaming back on
        temperature: 0.8,
        response_format: { type: "json_object" }  // Force JSON formatting
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      throw new Error(`Error calling OpenAI API: ${response.status} ${response.statusText}`);
    }

    // Process the stream
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Failed to get response reader');

    let fullResponse = '';
    let partialObject = '';
    let withinObject = false;
    let bracketCount = 0;
    let fullResponseParsed = false;
    
    console.log("Starting to read stream...");
    
    // Simple manual JSON parser for streaming
    const processStreamChunk = (chunk: string) => {
      for (let i = 0; i < chunk.length; i++) {
        const char = chunk[i];
        
        // Add character to both buffers
        fullResponse += char;
        
        // Track object boundaries
        if (char === '{') {
          if (bracketCount === 0) {
            withinObject = true;
            partialObject = '{';
          } else if (withinObject) {
            partialObject += char;
          }
          bracketCount++;
        } 
        else if (char === '}') {
          bracketCount--;
          if (withinObject) {
            partialObject += char;
          }
          
          // Complete object found
          if (bracketCount === 0 && withinObject) {
            withinObject = false;
            
            try {
              // Try to clean up the JSON before parsing
              let cleanedObject = partialObject;
              
              // Fix missing quotes around properties
              cleanedObject = cleanedObject.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
              
              // Ensure property values that should be strings have quotes
              cleanedObject = cleanedObject.replace(/:(\s*)([^"{}\[\],\s][^{}\[\],]*[^"{}\[\],\s])(\s*[,}])/g, ':"$2"$3');
              
              const obj = JSON.parse(cleanedObject);
              
              // Check for different patterns
              
              // 1. Direct category object
              if (obj.category && Array.isArray(obj.words)) {
                console.log("Found individual category in stream:", obj.category);
                addCategory(obj);
              }
              // 2. Numbered category properties
              else {
                const standardized = standardizeCategory(obj);
                if (standardized) {
                  console.log("Found standardized category in stream:", standardized.category);
                  addCategory(standardized);
                }
              }
              // 3. Categories wrapper
              if (obj.categories && Array.isArray(obj.categories)) {
                console.log("Found categories array in stream");
                for (const item of obj.categories) {
                  const standardized = standardizeCategory(item);
                  if (standardized) {
                    console.log("Adding category from wrapper:", standardized.category);
                    addCategory(standardized);
                  }
                }
              }
              
              partialObject = '';
            } catch (e) {
              console.log("Couldn't parse object yet:", partialObject);
              console.log("Parse error:", e.message);
            }
          }
        } 
        else if (withinObject) {
          partialObject += char;
        }
      }
      
      // For specific case, try to extract categories with regex while streaming
      // This is crucial for the format we're seeing in the logs
      const categoryMatches = fullResponse.match(/"(category\d*)"\s*:\s*"([^"]*)"/g);
      const wordsMatches = fullResponse.match(/"words"\s*:\s*\[((?:"[^"]*"(?:,\s*)?)+)\]/g);
      
      if (categoryMatches && wordsMatches && categoryMatches.length === wordsMatches.length) {
        for (let i = 0; i < categoryMatches.length; i++) {
          try {
            // Extract category name and property
            const matches = categoryMatches[i].match(/"(category\d*)"\s*:\s*"([^"]*)"/);
            if (!matches) continue;
            
            const propertyName = matches[1]; // e.g. "category1"
            const categoryName = matches[2]; // The actual category value
            
            // Extract words array
            const wordsArrayString = wordsMatches[i].match(/"words"\s*:\s*\[((?:"[^"]*"(?:,\s*)?)+)\]/)[1];
            const words = wordsArrayString.split(',')
              .map(w => w.trim().replace(/^"(.*)"$/, '$1'))
              .filter(w => w);
            
            if (categoryName && words.length > 0) {
              // console.log(`Found category "${categoryName}" with regex while streaming`);
              addCategory({
                category: categoryName,
                words: words
              });
            }
          } catch (e) {
            // Skip any parsing errors
          }
        }
      }
    };
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log("Stream reading complete");
        break;
      }
      
      // Convert the chunk to text
      const chunk = new TextDecoder().decode(value);
      
      // Process complete lines
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.trim() === '') continue;
        
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            console.log("Received [DONE] signal");
            continue;
          }
          
          try {
            const json = JSON.parse(data);
            const content = json.choices[0]?.delta?.content || '';
            
            if (!content) continue;
            
            // console.log("Processing chunk:", content);
            processStreamChunk(content);
            
          } catch (e) {
            console.error('Error parsing streaming response:', e);
            // Try to fix and retry if it looks like we have a JSON object
            try {
              if (data.includes('{') && data.includes('}')) {
                const fixedData = data.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
                const json = JSON.parse(fixedData);
                const content = json.choices[0]?.delta?.content || '';
                
                if (content) {
                  console.log('Recovered from JSON parsing error');
                  processStreamChunk(content);
                }
              }
            } catch (retryError) {
              // Failed to recover, continue with next chunk
            }
          }
        }
      }
    }
    
    // Process any remaining content - this is critical for handling the complete response
    // at the end of streaming when we have the full JSON object
    console.log("Processing final complete response");
    console.log("Full response:", fullResponse);
    
    if (fullResponse.trim().startsWith('{') && fullResponse.trim().endsWith('}')) {
      try {
        const finalObj = JSON.parse(fullResponse);
        
        // Handle the categories wrapper in the complete response
        if (finalObj.categories && Array.isArray(finalObj.categories)) {
          console.log("Found categories array in final response");
          for (const item of finalObj.categories) {
            const standardized = standardizeCategory(item);
            if (standardized) {
              console.log("Adding category from final response:", standardized.category);
              addCategory(standardized);
            }
          }
        } 
        // Handle direct category objects with standard or numbered properties
        else {
          // Find all keys that might be categories
          Object.keys(finalObj).forEach(key => {
            // If this looks like a potential category key
            if (key === "category" && typeof finalObj[key] === "string" && 
                finalObj.words && Array.isArray(finalObj.words)) {
              // This is a direct category object
              console.log("Found direct category in final response:", finalObj.category);
              addCategory(finalObj);
            } 
            // Check for numbered category properties
            else if (key.match(/^category\d*$/) && typeof finalObj[key] === "string" && 
                     finalObj.words && Array.isArray(finalObj.words)) {
              console.log("Found numbered category in final response:", finalObj[key]);
              addCategory({
                category: finalObj[key],
                words: finalObj.words
              });
            }
          });
          
          // Use regex to find all category-words pairs
          const categoryPattern = /"(category\d*)"\s*:\s*"([^"]*)"/g;
          const wordsPattern = /"words"\s*:\s*\[((?:"[^"]*"(?:,\s*)?)+)\]/g;
          
          const categories = [];
          let categoryMatch;
          while ((categoryMatch = categoryPattern.exec(fullResponse)) !== null) {
            categories.push({
              text: categoryMatch[0],
              property: categoryMatch[1], // The property name (category1, category2, etc.)
              category: categoryMatch[2], // The value
              index: categoryMatch.index
            });
          }
          
          const wordsArrays = [];
          let wordsMatch;
          while ((wordsMatch = wordsPattern.exec(fullResponse)) !== null) {
            const wordsStr = wordsMatch[1];
            const words = wordsStr.split(',').map(w => 
              w.trim().replace(/^"(.*)"$/, '$1')
            ).filter(w => w);
            
            wordsArrays.push({
              words: words,
              index: wordsMatch.index
            });
          }
          
          // Match categories with words arrays
          if (categories.length > 0 && wordsArrays.length > 0) {
            console.log(`Found ${categories.length} categories and ${wordsArrays.length} word arrays through regex`);
            
            for (const cat of categories) {
              // Find the closest words array after this category
              const closestWordsArray = wordsArrays
                .filter(w => w.index > cat.index)
                .sort((a, b) => a.index - b.index)[0];
              
              if (closestWordsArray) {
                console.log(`Matched category "${cat.category}" with words array`);
                addCategory({
                  category: cat.category,
                  words: closestWordsArray.words
                });
              }
            }
          }
        }
      } catch (e) {
        console.error("Error processing final response:", e);
      }
    }
    
    console.log("Streaming complete, total results:", results.length);
    return results;
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    // Fallback to mock
    console.log('Falling back to mock response');
    
    // Use mock data
    const mockData = await getMockResponse(prompt);
    
    if (onPartialResponse) {
      // Simulate callbacks for mock data
      for (const group of mockData) {
        await new Promise(resolve => setTimeout(resolve, 300)); // Delay for simulation
        onPartialResponse(group as TopicCategory);
      }
    }
    
    return mockData as TopicCategory[];
  }
};

// New function to transcribe audio using OpenAI
export const transcribeAudio = async (audioBlob: Blob, apiKey: string): Promise<string> => {
  if (!apiKey) {
    throw new Error("API key is required for transcription");
  }

  try {
    // Initialize OpenAI with the provided API key
    initializeOpenAI(apiKey);
    const openai = getOpenAI();

    // Create a FormData object to send the audio file
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'he'); // Hebrew language

    // Make the API call to OpenAI's transcription endpoint
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Transcription error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.text || '';

  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
};
