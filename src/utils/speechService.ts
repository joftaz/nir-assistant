import OpenAI from 'openai';

const instructions = `Voice Affect: Calm, composed, and reassuring; project quiet authority and confidence. 
Tone: Sincere, empathetic, and gently authoritative—express genuine apology while conveying competence. 
Pacing: Steady and moderate; unhurried enough to communicate care, yet efficient enough to demonstrate professionalism.`;
/**
 * Plays text using OpenAI's text-to-speech API
 * @param text The text to speak
 * @param apiKey OpenAI API key
 * @returns An object with loading and playing promises to track the audio lifecycle
 */
export const playSpeech = (text: string, apiKey: string): { 
  loading: Promise<void>;
  playing: Promise<void>;
} => {
  if (!apiKey) {
    throw new Error('API key is required');
  }

  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true // Required for client-side usage
  });

  // Create a controller we can use to track states
  let audioReadyResolve: () => void;
  let audioEndedResolve: () => void;
  let audioErrorReject: (error: any) => void;
  
  // Create promises that will resolve when audio is loaded and when playback completes
  const loadingPromise = new Promise<void>((resolve, reject) => {
    audioReadyResolve = resolve;
    audioErrorReject = reject;
  });
  
  const playingPromise = new Promise<void>((resolve, reject) => {
    audioEndedResolve = resolve;
    // We've already set audioErrorReject above
  });
  
  // Start the API request
  openai.audio.speech.create({
    model: 'gpt-4o-mini-tts',
    voice: 'ballad',
    input: text,
    instructions,
  }).then(mp3 => {
    // Once we get the response, convert to array buffer
    return mp3.arrayBuffer();
  }).then(buffer => {
    // Create an audio element from the buffer
    const blob = new Blob([buffer], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    
    // When audio is loaded and can play, resolve the loading promise
    audio.oncanplaythrough = () => {
      audioReadyResolve();
    };
    
    // When audio finishes playing, resolve the playing promise
    audio.onended = () => {
      URL.revokeObjectURL(url);
      audioEndedResolve();
    };
    
    // Handle errors that might occur during loading or playback
    audio.onerror = (error) => {
      URL.revokeObjectURL(url);
      audioErrorReject(error);
    };
    
    // Start playing the audio
    return audio.play();
  }).catch(error => {
    console.error('Error in text-to-speech:', error);
    audioErrorReject(error);
  });
  
  return {
    loading: loadingPromise,
    playing: playingPromise
  };
};
