import OpenAI from "openai";
import { defaultSystemPrompt, defaultSystemJsonInstruction } from "./modelPrompt";
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
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // or another model like "gpt-3.5-turbo"
      messages: [
        { role: "system", content: systemPrompt + "\n\n" + defaultSystemJsonInstruction },
        { role: "user", content: "מילים מהבחור שלי: " + input }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("No response content from OpenAI");
    }

    return parseOpenAIResponse(content);
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
    
    // Check if the response has a categories property (for structured JSON response)
    if (jsonResponse.categories && Array.isArray(jsonResponse.categories)) {
      return jsonResponse.categories;
    }
    
    // For direct array response
    if (Array.isArray(jsonResponse)) {
      return jsonResponse;
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
    console.log("Initializing OpenAI with streaming...");
    
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
        model: "gpt-3.5-turbo",
        messages: [
          { role: 'system', content: fullSystemPrompt },
          { role: 'user', content: prompt }
        ],
        stream: true,
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
              if (obj.category && Array.isArray(obj.words)) {
                console.log("Found object in stream:", obj.category);
                addCategory(obj);
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
      
      // Also try regex-based extraction periodically
      tryExtractObjects(fullResponse);
    };
    
    // Additional method to extract objects with regex
    const tryExtractObjects = (text: string) => {
      // Use a more lenient regex pattern to handle missing quotes
      const objRegex = /{[^{]*["']?category["']?\s*:\s*["'][^"']*["'][^{]*["']?words["']?\s*:\s*\[[^\]]*\][^{}]*}/g;
      const matches = text.match(objRegex);
      
      if (matches) {
        for (const match of matches) {
          try {
            // Clean up the JSON string before parsing
            let cleanMatch = match;
            
            // Fix missing quotes around properties
            cleanMatch = cleanMatch.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
            
            // Ensure proper string quotes
            cleanMatch = cleanMatch.replace(/:(\s*)([^"{}\[\],\s][^{}\[\],]*[^"{}\[\],\s])(\s*[,}])/g, ':"$2"$3');
            
            // Log the cleaned JSON for debugging
            if (cleanMatch !== match) {
              console.log("Fixed JSON:", cleanMatch);
            }
            
            const obj = JSON.parse(cleanMatch);
            if (obj.category && Array.isArray(obj.words)) {
              addCategory(obj);
            }
          } catch (e) {
            // Not valid JSON yet, log more details about the parsing error
            console.log("Failed to parse potential JSON object:", match);
            console.log("Parse error:", e.message);
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
    
    // Process any remaining content
    tryExtractObjects(fullResponse);
    
    // If we still have no results, create a fallback category
    if (results.length === 0 && fullResponse.trim()) {
      const words = fullResponse.split(/[,\s]+/).filter(word => word.trim().length > 0);
      if (words.length > 0) {
        const fallbackCategory = {
          category: "מילים קשורות",
          words: words.slice(0, 10)
        };
        addCategory(fallbackCategory);
      }
    }
    
    console.log("Streaming complete, total results:", results.length);
    return results;
  } catch (error) {
    console.error('Error in OpenAI streaming call:', error);
    throw error;
  }
};
