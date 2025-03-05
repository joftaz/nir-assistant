
import OpenAI from "openai";
import { systemPrompt } from "./modelPrompt";

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

export const generateResponse = async (input: string): Promise<CategoryResponse[]> => {
  if (!openai) {
    throw new Error("OpenAI client not initialized. Call initializeOpenAI first.");
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // or another model like "gpt-3.5-turbo"
      messages: [
        { role: "system", content: systemPrompt + "\n\nIMPORTANT: Please respond with a JSON structure that follows this format: [{\"category\": \"Category Name\", \"words\": [\"word1\", \"word2\", \"word3\", ...]}]" },
        { role: "user", content: input }
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
