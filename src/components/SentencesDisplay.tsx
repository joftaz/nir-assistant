
import React, { useRef, useEffect } from 'react';
import { X, Plus, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface SentencesDisplayProps {
  sentences: string[];
  isLoading: boolean;
  isStreaming?: boolean;
  onSelectSentence: (sentence: string) => void;
  onCancel: () => void;
  onGenerateMore?: () => void;
}

const SentencesDisplay: React.FC<SentencesDisplayProps> = ({
  sentences,
  isLoading,
  isStreaming = false,
  onSelectSentence,
  onCancel,
  onGenerateMore
}) => {
  if (sentences.length === 0 && !isLoading) return null;

  const containerRef = useRef<HTMLDivElement>(null);
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);
  
  // Auto-scroll to the bottom when new sentences appear
  useEffect(() => {
    if (containerRef.current && sentences.length > 0) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [sentences]);

  const handleCopy = (sentence: string, index: number) => {
    navigator.clipboard.writeText(sentence)
      .then(() => {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
      });
  };

  const showingLoadingState = isLoading && sentences.length === 0;
  const showingStreamingState = isStreaming && sentences.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-3xl mx-auto mt-2 mb-3 p-3 bg-card border border-border rounded-lg shadow-md"
    >
      <div className="mb-2 flex justify-between items-center">
        <h3 className="text-sm font-medium" dir="rtl">
          משפטים מוצעים 
          {showingLoadingState ? ' (טוען...)' : 
           showingStreamingState ? ' (ממשיך לייצר...)' : 
           `(${sentences.length})`}
        </h3>
        <button 
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted"
          aria-label="סגור משפטים"
          title="סגור משפטים"
        >
          <X size={16} />
        </button>
      </div>
      
      {showingLoadingState ? (
        <div className="py-8 flex justify-center">
          <div className="animate-pulse flex flex-col gap-3 w-full">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-muted/50 rounded-md w-full"></div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Sentences scrollable container */}
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto" dir="rtl" ref={containerRef}>
            <AnimatePresence>
              {sentences.map((sentence, index) => (
                <motion.div
                  key={`sentence-${index}-${sentence.substring(0, 10)}`}
                  className="flex items-start gap-2 relative group"
                  initial={{ opacity: 0, y: 10, height: 0, padding: 0, margin: 0, overflow: 'hidden' }}
                  animate={{ opacity: 1, y: 0, height: 'auto', padding: '0.75rem 0', marginBottom: '0.5rem', overflow: 'visible' }}
                  exit={{ opacity: 0, height: 0, padding: 0, margin: 0, overflow: 'hidden' }}
                  transition={{ duration: 0.3 }}
                >
                  <button
                    onClick={() => handleCopy(sentence, index)}
                    className="flex-shrink-0 p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
                    aria-label="העתק משפט"
                    title="העתק משפט"
                  >
                    {copiedIndex === index ? (
                      <Check size={16} className="text-green-500" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                  <button
                    onClick={() => onSelectSentence(sentence)}
                    className="flex-grow p-3 text-right text-sm bg-muted/30 hover:bg-primary/10 rounded-md transition-colors border border-border/50 hover:border-primary/30 w-full"
                  >
                    {sentence}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isStreaming && (
              <motion.div 
                className="h-10 animate-pulse bg-muted/30 rounded-md w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </div>
          
          {/* Generate more button - now outside the scrollable container */}
          {!isLoading && !isStreaming && onGenerateMore && (
            <div className="mt-3 flex justify-center border-t border-border pt-3">
              <Button 
                variant="outline" 
                className="gap-2 self-center"
                onClick={onGenerateMore}
              >
                <Plus size={16} />
                <span>יצירת משפטים נוספים</span>
              </Button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default SentencesDisplay;
