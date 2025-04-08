
import OpenAI from 'openai';

/**
 * Plays text using OpenAI's text-to-speech API
 * @param text The text to speak
 * @param apiKey OpenAI API key
 */
export const playSpeech = async (text: string, apiKey: string): Promise<void> => {
  if (!apiKey) {
    throw new Error('API key is required');
  }

  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true // Required for client-side usage
  });

  try {
    // Create speech audio
    const mp3 = await openai.audio.speech.create({
      model: "tts-1", // Using OpenAI's TTS model
      voice: "nova", // A neutral voice that works well in Hebrew
      input: text,
    });

    // Convert to array buffer and play
    const buffer = await mp3.arrayBuffer();
    const blob = new Blob([buffer], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    
    const audio = new Audio(url);
    
    return new Promise((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      
      audio.onerror = (error) => {
        URL.revokeObjectURL(url);
        reject(error);
      };
      
      audio.play().catch(reject);
    });
  } catch (error) {
    console.error('Error in text-to-speech:', error);
    throw error;
  }
};
