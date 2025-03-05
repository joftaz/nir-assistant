
import React, { useState, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  isLoading: boolean;
  apiKey: string;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscription,
  isLoading,
  apiKey,
  onStartRecording,
  onStopRecording
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    if (!apiKey) {
      toast({
        title: "חסר מפתח API",
        description: "יש להזין מפתח API של OpenAI כדי להשתמש בתכונה זו",
        variant: "destructive",
      });
      return;
    }

    audioChunksRef.current = [];
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        if (audioBlob.size > 0) {
          try {
            setIsTranscribing(true);
            
            // Import the transcription function
            const { transcribeAudio } = await import('@/utils/openaiService');
            
            // Transcribe the audio
            const transcription = await transcribeAudio(audioBlob, apiKey);
            
            if (transcription.trim()) {
              onTranscription(transcription);
            } else {
              toast({
                title: "לא זוהה טקסט",
                description: "לא הצלחנו לזהות את הטקסט, נסה שוב",
                variant: "destructive",
              });
            }
          } catch (error) {
            console.error('Transcription error:', error);
            toast({
              title: "שגיאה בתעתוק",
              description: "אירעה שגיאה בעת תעתוק ההקלטה. נסה שוב מאוחר יותר.",
              variant: "destructive",
            });
          } finally {
            setIsTranscribing(false);
          }
        }
        
        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      if (onStartRecording) onStartRecording();
      
      toast({
        title: "מקליט...",
        description: "לחץ על כפתור המיקרופון שוב כדי לסיים את ההקלטה",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "שגיאה בהקלטה",
        description: "לא ניתן לגשת למיקרופון. בדוק את הרשאות הדפדפן.",
        variant: "destructive",
      });
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (onStopRecording) onStopRecording();
      
      toast({
        title: "ההקלטה הסתיימה",
        description: "מעבד את ההקלטה...",
      });
    }
  };
  
  const toggleRecording = () => {
    if (isLoading || isTranscribing) return;
    
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  return (
    <Button
      onClick={toggleRecording}
      disabled={isLoading || isTranscribing || (!isRecording && !apiKey)}
      size="icon"
      variant={isRecording ? "destructive" : "ghost"}
      className={`rounded-full transition-all ${isRecording ? 'bg-red-500 hover:bg-red-600' : ''}`}
      title={isRecording ? "סיים הקלטה" : "התחל הקלטה"}
      aria-label={isRecording ? "סיים הקלטה" : "התחל הקלטה"}
    >
      {isTranscribing ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : isRecording ? (
        <MicOff className="h-5 w-5" />
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </Button>
  );
};

export default VoiceRecorder;
