import React, { useRef, useEffect } from 'react';
import { X, Plus, Copy, Check, ChevronDown, ChevronUp, Volume2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface SentencesDisplayProps {
  sentences: string[];
  oldSentences?: string[];
  isLoading: boolean;
  isStreaming?: boolean;
  isPlayingAudio?: boolean;
  onSelectSentence: (sentence: string) => void;
  onCancel: () => void;
  onGenerateMore?: () => void;
  onPlaySpeech?: (text: string) => { loading: Promise<void>; playing: Promise<void> };
}

const SentencesDisplay: React.FC<SentencesDisplayProps> = ({
  sentences,
  oldSentences = [],
  isLoading,
  isStreaming = false,
  isPlayingAudio = false,
  onSelectSentence,
  onCancel,
  onGenerateMore,
  onPlaySpeech
}) => {
  if (sentences.length === 0 && oldSentences.length === 0 && !isLoading) return null;

  const containerRef = useRef<HTMLDivElement>(null);
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);
  const [oldSentencesExpanded, setOldSentencesExpanded] = React.useState(false);
  const [loadingSentenceIndex, setLoadingSentenceIndex] = React.useState<number | null>(null);
  const [activeSentenceIndex, setActiveSentenceIndex] = React.useState<number | null>(null);
  
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

  const handlePlaySpeech = async (sentence: string, index: number) => {
    if (loadingSentenceIndex !== null || activeSentenceIndex !== null || !onPlaySpeech) return;
    
    // Set loading state first
    setLoadingSentenceIndex(index);
    
    try {
      // Call speech service which now returns separate promises
      const audioPromises = onPlaySpeech(sentence);
      
      // Wait for audio to load
      await audioPromises.loading;
      
      // When loaded, switch to active state
      setLoadingSentenceIndex(null);
      setActiveSentenceIndex(index);
      
      // Wait for audio to finish playing
      await audioPromises.playing;
    } catch (error) {
      console.error('Error playing speech:', error);
    } finally {
      // Audio finished playing or encountered an error
      setLoadingSentenceIndex(null);
      setActiveSentenceIndex(null);
    }
  };

  const toggleOldSentences = () => {
    setOldSentencesExpanded(!oldSentencesExpanded);
  };

  const showingLoadingState = isLoading && sentences.length === 0 && oldSentences.length === 0;
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
           `(${sentences.length}${oldSentences.length > 0 ? ` + ${oldSentences.length} קודמים` : ''})`}
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
        <div className="flex flex-col">
          {/* Sentences scrollable container */}
          <div className="flex flex-col gap-0 max-h-[300px] overflow-y-auto" dir="rtl" ref={containerRef}>
            <AnimatePresence>
              {sentences.map((sentence, index) => (
                <motion.div
                  key={`sentence-${index}-${sentence.substring(0, 10)}`}
                  className="flex items-start gap-2 relative group"
                  initial={{ opacity: 0, y: 10, height: 0, padding: 0, margin: 0, overflow: 'hidden' }}
                  animate={{ opacity: 1, y: 0, height: 'auto', padding: '0.25rem 0', marginBottom: '0', overflow: 'visible' }}
                  exit={{ opacity: 0, height: 0, padding: 0, margin: 0, overflow: 'hidden' }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex gap-1">
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
                    {onPlaySpeech && (
                      <button
                        onClick={() => handlePlaySpeech(sentence, index)}
                        disabled={loadingSentenceIndex !== null || activeSentenceIndex !== null}
                        className={`flex-shrink-0 p-1.5 transition-colors rounded-full hover:bg-muted ${
                          loadingSentenceIndex === index 
                            ? "text-primary" 
                            : activeSentenceIndex === index 
                              ? "text-green-500" 
                              : "text-muted-foreground hover:text-foreground"
                        }`}
                        aria-label="הקרא משפט"
                        title="הקרא משפט"
                      >
                        {loadingSentenceIndex === index ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Volume2 size={16} />
                        )}
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => onSelectSentence(sentence)}
                    className="flex-grow p-2 text-right text-sm bg-muted/30 hover:bg-primary/10 rounded-md transition-colors border border-border/50 hover:border-primary/30 w-full"
                  >
                    {sentence}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isStreaming && (
              <motion.div 
                className="h-10 animate-pulse bg-muted/30 rounded-md w-full mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}

            {/* Old sentences section with collapsible behavior */}
            {oldSentences.length > 0 && (
              <div className="mt-2 mb-1">
                <button
                  onClick={toggleOldSentences}
                  className="flex justify-between items-center w-full p-2 bg-muted/40 hover:bg-muted/60 rounded-md transition-colors text-sm font-medium"
                >
                  <span className="flex items-center gap-1">
                    {oldSentencesExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    משפטים קודמים ({oldSentences.length})
                  </span>
                </button>
                <AnimatePresence>
                  {oldSentencesExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-1 flex flex-col gap-0"
                    >
                      {oldSentences.map((sentence, index) => (
                        <motion.div
                          key={`old-sentence-${index}-${sentence.substring(0, 10)}`}
                          className="flex items-start gap-2 relative group"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                        >
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleCopy(sentence, index + 1000)} // Using offset to differentiate from new sentences
                              className="flex-shrink-0 p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
                              aria-label="העתק משפט"
                              title="העתק משפט"
                            >
                              {copiedIndex === index + 1000 ? (
                                <Check size={16} className="text-green-500" />
                              ) : (
                                <Copy size={16} />
                              )}
                            </button>
                            {onPlaySpeech && (
                              <button
                                onClick={() => handlePlaySpeech(sentence, index + 1000)}
                                disabled={loadingSentenceIndex !== null || activeSentenceIndex !== null}
                                className={`flex-shrink-0 p-1.5 transition-colors rounded-full hover:bg-muted ${
                                  loadingSentenceIndex === index + 1000 
                                    ? "text-primary" 
                                    : activeSentenceIndex === index + 1000 
                                      ? "text-green-500" 
                                      : "text-muted-foreground hover:text-foreground"
                                }`}
                                aria-label="הקרא משפט"
                                title="הקרא משפט"
                              >
                                {loadingSentenceIndex === index + 1000 ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <Volume2 size={16} />
                                )}
                              </button>
                            )}
                          </div>
                          <button
                            onClick={() => onSelectSentence(sentence)}
                            className="flex-grow p-2 text-right text-sm bg-muted/20 hover:bg-primary/10 rounded-md transition-colors border border-border/30 hover:border-primary/30 w-full text-muted-foreground"
                          >
                            {sentence}
                          </button>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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
