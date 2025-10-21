// src/pages/games/crossword/StoryScreen.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../../styles/games/crossword/StoryScreen.module.css';
import { Volume2 } from 'lucide-react';

/**
 * Enhanced Story Screen with individual sentence speakers
 */
const StoryScreen = ({ 
  storySegment, 
  onContinue, 
  vocabularyWords = [], 
  currentEpisode,
  onToggleReadingCoach
}) => {
  // State for reading
  const [hasReadStory, setHasReadStory] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(null);
  const [readingSingleSentence, setReadingSingleSentence] = useState(false);
  const [sentences, setSentences] = useState([]);
  const [visitedSentences, setVisitedSentences] = useState([]);
  const [filteredVocabWords, setFilteredVocabWords] = useState([]);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  
  // References
  const storyTextRef = useRef(null);
  const sentenceRefs = useRef([]);
  
  // Check if speech synthesis is available
  const hasSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const speechSynth = hasSpeech ? window.speechSynthesis : null;
  
  // Load voices (they load asynchronously in Chrome)
  useEffect(() => {
    if (hasSpeech) {
      const loadVoices = () => {
        const voices = speechSynth.getVoices();
        if (voices.length > 0) {
          setVoicesLoaded(true);
          console.log('Available voices:', voices.map(v => v.name));
        }
      };
      
      loadVoices();
      
      if (speechSynth.onvoiceschanged !== undefined) {
        speechSynth.onvoiceschanged = loadVoices;
      }
      
      return () => {
        if (speechSynth.onvoiceschanged !== undefined) {
          speechSynth.onvoiceschanged = null;
        }
      };
    }
  }, [hasSpeech, speechSynth]);
  
  // Process the story text to extract sentences and filter vocabulary
  useEffect(() => {
    if (storySegment && storySegment.text) {
      // Split text into sentences
      const sentenceRegex = /[^.!?]+[.!?]+/g;
      const extractedSentences = storySegment.text.match(sentenceRegex) || [];
      setSentences(extractedSentences.map(s => s.trim()));
      
      // Initialize sentence refs
      sentenceRefs.current = extractedSentences.map(() => React.createRef());
      
      // Filter vocabulary words to only include those that appear in the story
      if (vocabularyWords && vocabularyWords.length > 0) {
        const storyTextLower = storySegment.text.toLowerCase();
        const wordsInStory = vocabularyWords.filter(word => {
          const wordLower = word.toLowerCase();
          const regex = new RegExp(`\\b${wordLower}\\b`, 'i');
          return regex.test(storyTextLower);
        });
        
        // Remove duplicates (case-insensitive)
        const uniqueWords = [];
        const seenWords = new Set();
        wordsInStory.forEach(word => {
          const wordLower = word.toLowerCase();
          if (!seenWords.has(wordLower)) {
            seenWords.add(wordLower);
            uniqueWords.push(word);
          }
        });
        
        setFilteredVocabWords(uniqueWords);
      } else {
        setFilteredVocabWords([]);
      }
    }
  }, [storySegment, vocabularyWords]);
  
  // Highlight vocabulary words in text
  const highlightVocabularyWords = useCallback((text) => {
    if (!filteredVocabWords || filteredVocabWords.length === 0) {
      return <span>{text}</span>;
    }
    
    const wordsPattern = filteredVocabWords
      .map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');
    
    if (!wordsPattern) {
      return <span>{text}</span>;
    }
    
    const regex = new RegExp(`\\b(${wordsPattern})\\b`, 'gi');
    const parts = [];
    let lastIndex = 0;
    let match;
    
    regex.lastIndex = 0;
    
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          text: text.substring(lastIndex, match.index),
          isHighlight: false
        });
      }
      
      parts.push({
        text: match[0],
        isHighlight: true
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < text.length) {
      parts.push({
        text: text.substring(lastIndex),
        isHighlight: false
      });
    }
    
    if (parts.length === 0) {
      return <span>{text}</span>;
    }
    
    return (
      <span>
        {parts.map((part, index) => 
          part.isHighlight ? (
            <span key={index} className={styles.highlightedWord}>
              {part.text}
            </span>
          ) : (
            <span key={index}>{part.text}</span>
          )
        )}
      </span>
    );
  }, [filteredVocabWords]);
  
  // Get the best British UK voice for reading
  const getReadingVoice = useCallback(() => {
    if (!hasSpeech) return null;
    
    const voices = speechSynth.getVoices();
    
    // Priority list for British female voices
    const preferredVoices = [
      'Google UK English Female',
      'Microsoft Hazel - English (Great Britain)',
      'Karen',
      'Samantha',
      'Google US English Female',
      'Microsoft Zira - English (United States)'
    ];
    
    // Try to find preferred voice
    for (const voiceName of preferredVoices) {
      const voice = voices.find(v => v.name.includes(voiceName));
      if (voice) return voice;
    }
    
    // Fallback: any female English voice
    const femaleEnglish = voices.find(v => 
      v.lang.startsWith('en') && (
        v.name.toLowerCase().includes('female') ||
        v.name.toLowerCase().includes('woman') ||
        v.name.includes('Zira') ||
        v.name.includes('Hazel') ||
        v.name.includes('Karen') ||
        v.name.includes('Samantha')
      )
    );
    
    if (femaleEnglish) return femaleEnglish;
    
    // Last resort: any English voice
    return voices.find(v => v.lang.startsWith('en')) || voices[0];
  }, [hasSpeech, speechSynth]);

  // Read a single sentence when speaker button is clicked
  const readSingleSentence = useCallback((index) => {
    if (!hasSpeech || !sentences || index < 0 || index >= sentences.length) return;
    
    // Cancel any ongoing speech
    speechSynth.cancel();
    
    // Set state
    setReadingSingleSentence(true);
    setCurrentSentenceIndex(index);
    setIsReading(false); // Not reading full story
    
    // Add to visited sentences
    setVisitedSentences(prev => {
      if (!prev.includes(index)) {
        return [...prev, index];
      }
      return prev;
    });
    
    // Scroll to the sentence
    scrollToSentence(index);
    
    // Create utterance for the specific sentence
    const utterance = new SpeechSynthesisUtterance(sentences[index]);
    
    // Set the British UK voice
    const voice = getReadingVoice();
    if (voice) {
      utterance.voice = voice;
      console.log('Using voice for sentence:', voice.name);
    }
    
    utterance.rate = 0.85; // Slightly slower, more natural
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onend = () => {
      setReadingSingleSentence(false);
      setCurrentSentenceIndex(null);
    };
    
    utterance.onerror = () => {
      console.error('Speech synthesis error for single sentence');
      setReadingSingleSentence(false);
      setCurrentSentenceIndex(null);
    };
    
    speechSynth.speak(utterance);
  }, [hasSpeech, speechSynth, sentences, getReadingVoice]);

  // Read story aloud with sentence tracking (full story)
  const readStoryAloud = useCallback(() => {
    if (!hasSpeech || !sentences || sentences.length === 0) return;
    
    speechSynth.cancel();
    setIsReading(true);
    setReadingSingleSentence(false);
    setCurrentSentenceIndex(0);
    setVisitedSentences([0]);
    
    let currentIndex = 0;
    
    const readNextSentence = () => {
      if (currentIndex >= sentences.length) {
        setIsReading(false);
        setCurrentSentenceIndex(null);
        setHasReadStory(true);
        return;
      }
      
      const utterance = new SpeechSynthesisUtterance(sentences[currentIndex]);
      
      // Set the British UK voice
      const voice = getReadingVoice();
      if (voice) {
        utterance.voice = voice;
        console.log('Using voice:', voice.name);
      }
      
      utterance.rate = 0.85;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onstart = () => {
        setCurrentSentenceIndex(currentIndex);
        setVisitedSentences(prev => {
          if (!prev.includes(currentIndex)) {
            return [...prev, currentIndex];
          }
          return prev;
        });
        scrollToSentence(currentIndex);
      };
      
      utterance.onend = () => {
        currentIndex++;
        if (currentIndex < sentences.length) {
          setTimeout(readNextSentence, 300);
        } else {
          setIsReading(false);
          setCurrentSentenceIndex(null);
          setHasReadStory(true);
        }
      };
      
      utterance.onerror = () => {
        console.error('Speech synthesis error');
        setIsReading(false);
        setCurrentSentenceIndex(null);
      };
      
      speechSynth.speak(utterance);
    };
    
    readNextSentence();
  }, [hasSpeech, speechSynth, sentences, getReadingVoice]);
  
  // Stop reading
  const stopReading = useCallback(() => {
    if (hasSpeech && speechSynth) {
      speechSynth.cancel();
      setIsReading(false);
      setReadingSingleSentence(false);
      setCurrentSentenceIndex(null);
    }
  }, [hasSpeech, speechSynth]);
  
  // Scroll to current sentence
  const scrollToSentence = (index) => {
    if (sentenceRefs.current[index] && sentenceRefs.current[index].current) {
      sentenceRefs.current[index].current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  };
  
  // Handle continue to puzzle
  const handleContinueToPuzzle = () => {
    if (hasSpeech) {
      speechSynth.cancel();
    }
    if (onContinue) {
      onContinue();
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hasSpeech) {
        speechSynth.cancel();
      }
    };
  }, [hasSpeech, speechSynth]);
  
  // Render sentences with highlights and speaker buttons
  const renderStoryText = () => {
    return (
      <div className={styles.sentencesContainer}>
        {sentences.map((sentence, index) => {
          const isCurrentSentence = currentSentenceIndex === index;
          const highlightedSentence = highlightVocabularyWords(sentence);
          
          return (
            <motion.div
              key={index}
              ref={sentenceRefs.current[index]}
              id={`sentence-${index}`}
              className={`${styles.sentence} ${isCurrentSentence ? styles.currentSentence : ''} ${visitedSentences.includes(index) ? styles.visitedSentence : ''}`}
              initial={{ opacity: 0.9 }}
              animate={{ 
                opacity: isCurrentSentence ? 1 : 0.9,
                backgroundColor: isCurrentSentence ? 'rgba(156, 39, 176, 0.1)' : 'rgba(255, 255, 255, 0)',
                scale: isCurrentSentence ? 1.02 : 1
              }}
              transition={{ duration: 0.3 }}
            >
              <div className={styles.sentenceNumberContainer}>
                <span className={styles.sentenceNumber}>{index + 1}</span>
                {hasSpeech && (
                  <button
                    className={`${styles.sentenceSpeakerButton} ${isCurrentSentence && readingSingleSentence ? styles.speakerActive : ''}`}
                    onClick={() => readSingleSentence(index)}
                    title="Play this sentence"
                    disabled={isReading}
                  >
                    <Volume2 size={16} />
                  </button>
                )}
              </div>
              {highlightedSentence}
            </motion.div>
          );
        })}
      </div>
    );
  };
  
  return (
  <div className={styles.storyScreenContainer}>
    {/* TOP RIGHT CONTROLS - FIXED POSITION */}
    <div className={styles.controls}>
      {hasSpeech && (
        <div className={styles.readAloudControls}>
          {!isReading ? (
            <button 
              className={styles.readAloudButton}
              onClick={readStoryAloud}
              title="Listen to the story"
            >
              🔊 Read Aloud
            </button>
          ) : (
            <button 
              className={styles.stopReadingButton}
              onClick={stopReading}
              title="Stop reading"
            >
              ⏹️ Stop Reading
            </button>
          )}
        </div>
      )}
      
      {onToggleReadingCoach && (
        <button
          className={styles.readingHelperButton}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔥 Reading Helper clicked!');
            onToggleReadingCoach();
          }}
          title="Get help with reading"
        >
          📖 Reading Helper
        </button>
      )}
    </div>

    {/* Header - Episode Info Only */}
    <div className={styles.header}>
      <div className={styles.episodeInfo}>
        <h1 className={styles.episodeTitle}>
          Episode {currentEpisode}: {storySegment.title}
        </h1>
        <div className={styles.stageLabel}>
          Reading the Story
        </div>
      </div>
    </div>
    
    {/* Main content area */}
    <div className={styles.mainContent}>
      <div className={styles.contentWrapper}>
        {/* Story panel */}
        <div className={styles.storyPanel}>
          <div className={styles.storyScroll}>
            <div
              ref={storyTextRef}
              className={`${styles.storyText} ${isReading ? styles.reading : ''}`}
            >
              {renderStoryText()}
            </div>
          </div>
        </div>
        
        {/* Vocabulary words sidebar */}
        <div className={styles.vocabularySidebar}>
          <h3 className={styles.vocabularyTitle}>Words to Watch For</h3>
          <div className={styles.vocabularyList}>
            {filteredVocabWords && filteredVocabWords.length > 0 ? (
              filteredVocabWords.map((word, index) => (
                <motion.div
                  key={index}
                  className={styles.vocabularyWord}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  style={{
                    backgroundColor: `hsl(${(index * 40) % 360}, 70%, 60%)`
                  }}
                >
                  {word}
                </motion.div>
              ))
            ) : (
              <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                No vocabulary words in this story
              </p>
            )}
          </div>
          {filteredVocabWords && filteredVocabWords.length > 0 && (
            <div className={styles.vocabularyHint}>
              <p>💡 These words will appear in the crossword puzzle!</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Continue button */}
      <div className={styles.continueButtonContainer}>
        <button
          className={styles.continueButton}
          onClick={handleContinueToPuzzle}
          disabled={!hasReadStory && !isReading}
        >
          Continue to Puzzle
        </button>
        
        {!hasReadStory && !isReading && (
          <div className={styles.continueDisabledMessage}>
            Please read the story first
          </div>
        )}
      </div>
    </div>
  </div>
);
  
};

// Helper functions for vocabulary word colors
const getVocabColor = (index) => {
  const colors = ['#ff6b6b', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];
  return colors[index % colors.length];
};

const getVocabColorDark = (index) => {
  const colors = ['#ef4444', '#f97316', '#059669', '#2563eb', '#7c3aed'];
  return colors[index % colors.length];
};

export default StoryScreen;