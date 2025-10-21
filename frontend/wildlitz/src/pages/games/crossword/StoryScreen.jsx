// src/pages/games/crossword/StoryScreen.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import styles from '../../../styles/games/crossword/StoryScreen.module.css';

/**
 * Enhanced Story Screen with Auto-Scroll and Individual Sentence Speakers
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
  
  // ============================================
  // IMPROVED AUTO-SCROLL - Only when reading aloud
  // ============================================
  useEffect(() => {
    // 🔥 ONLY auto-scroll when actively reading aloud
    if (isReading && currentSentenceIndex !== null && sentences.length > 0) {
      // Small delay to ensure DOM is updated
      const scrollTimer = setTimeout(() => {
        const sentenceRef = sentenceRefs.current[currentSentenceIndex];
        
        if (sentenceRef && sentenceRef.current) {
          const sentenceElement = sentenceRef.current;
          
          // Method 1: Direct scrollIntoView (most reliable)
          try {
            sentenceElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest'
            });
            console.log(`✅ Auto-scrolled to sentence ${currentSentenceIndex + 1}`);
          } catch (error) {
            console.error('ScrollIntoView failed:', error);
          }
          
          // Method 2: Backup scroll using parent container
          setTimeout(() => {
            const storyScrollContainer = storyTextRef.current?.parentElement;
            
            if (storyScrollContainer && sentenceElement) {
              try {
                const containerRect = storyScrollContainer.getBoundingClientRect();
                const sentenceRect = sentenceElement.getBoundingClientRect();
                
                // Calculate if sentence is out of view
                const isAboveView = sentenceRect.top < containerRect.top;
                const isBelowView = sentenceRect.bottom > containerRect.bottom;
                
                if (isAboveView || isBelowView) {
                  // Calculate scroll position to center the sentence
                  const scrollOffset = sentenceElement.offsetTop - (storyScrollContainer.clientHeight / 2) + (sentenceElement.clientHeight / 2);
                  
                  storyScrollContainer.scrollTo({
                    top: Math.max(0, scrollOffset),
                    behavior: 'smooth'
                  });
                  console.log(`🔄 Backup scroll to sentence ${currentSentenceIndex + 1}`);
                }
              } catch (error) {
                console.error('Backup scroll failed:', error);
              }
            }
          }, 200);
        }
      }, 150); // Delay to ensure animation/state updates complete
      
      return () => clearTimeout(scrollTimer);
    }
    // If NOT reading, do nothing - allow manual scrolling
  }, [isReading, currentSentenceIndex, sentences.length]);
  
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
            <span key={index} className={styles.vocabHighlight}>
              {part.text}
            </span>
          ) : (
            <span key={index}>{part.text}</span>
          )
        )}
      </span>
    );
  }, [filteredVocabWords]);
  
  // Get preferred voice - UK BRITISH
  const getReadingVoice = useCallback(() => {
    if (!hasSpeech || !speechSynth) return null;
    
    const voices = speechSynth.getVoices();
    
    // Try to find UK British voices first
    const ukVoice = voices.find(voice => 
      voice.lang === 'en-GB' || 
      voice.name.includes('UK') || 
      voice.name.includes('British') ||
      voice.name.includes('Daniel') || // Common UK voice name
      voice.name.includes('Kate')      // Common UK voice name
    );
    
    if (ukVoice) {
      console.log('🇬🇧 Using UK British voice:', ukVoice.name);
      return ukVoice;
    }
    
    // Fallback to any English voice
    const fallbackVoice = voices.find(voice => voice.lang.startsWith('en'));
    console.log('Using fallback voice:', fallbackVoice?.name);
    return fallbackVoice;
  }, [hasSpeech, speechSynth]);
  
  // Read single sentence
  const readSingleSentence = useCallback((index) => {
    if (!hasSpeech || !speechSynth || readingSingleSentence || isReading) return;
    
    setReadingSingleSentence(true);
    setCurrentSentenceIndex(index);
    
    // Mark as visited
    setVisitedSentences(prev => {
      if (!prev.includes(index)) {
        return [...prev, index];
      }
      return prev;
    });
    
    const utterance = new SpeechSynthesisUtterance(sentences[index]);
    
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 1.0;
    
    const voice = getReadingVoice();
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.onend = () => {
      setReadingSingleSentence(false);
      setCurrentSentenceIndex(null);
    };
    
    utterance.onerror = () => {
      setReadingSingleSentence(false);
      setCurrentSentenceIndex(null);
    };
    
    speechSynth.speak(utterance);
  }, [hasSpeech, speechSynth, sentences, readingSingleSentence, isReading, getReadingVoice]);
  
  // Read story aloud with improved auto-scroll
  const readStoryAloud = useCallback(() => {
    if (!hasSpeech || !speechSynth || sentences.length === 0) return;
    
    // Cancel any ongoing speech
    speechSynth.cancel();
    
    // Scroll to top FIRST before starting
    const storyScrollContainer = storyTextRef.current?.parentElement;
    if (storyScrollContainer) {
      storyScrollContainer.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      console.log('📜 Scrolled to top');
    }
    
    setIsReading(true);
    setHasReadStory(true);
    let currentIndex = 0;
    
    const readNextSentence = () => {
      if (currentIndex >= sentences.length) {
        setIsReading(false);
        setCurrentSentenceIndex(null);
        console.log('✅ Finished reading all sentences');
        return;
      }
      
      console.log(`📖 Reading sentence ${currentIndex + 1}/${sentences.length}`);
      
      // Set current sentence FIRST (triggers scroll)
      setCurrentSentenceIndex(currentIndex);
      
      // Mark as visited
      setVisitedSentences(prev => {
        if (!prev.includes(currentIndex)) {
          return [...prev, currentIndex];
        }
        return prev;
      });
      
      // Small delay before speaking to ensure scroll completes
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(sentences[currentIndex]);
        
        utterance.rate = 0.85; // Slightly slower for better comprehension
        utterance.pitch = 1.1;
        utterance.volume = 1.0;
        
        const voice = getReadingVoice();
        if (voice) {
          utterance.voice = voice;
          console.log(`🎙️ Using voice: ${voice.name}`);
        }
        
        utterance.onend = () => {
          console.log(`✓ Finished sentence ${currentIndex + 1}`);
          currentIndex++;
          // Pause between sentences for better comprehension
          setTimeout(() => {
            readNextSentence();
          }, 800); // Longer pause between sentences
        };
        
        utterance.onerror = (error) => {
          console.error('Speech error:', error);
          setIsReading(false);
          setCurrentSentenceIndex(null);
        };
        
        // Speak the sentence
        speechSynth.speak(utterance);
      }, 300); // Wait for scroll to complete
    };
    
    // Start reading after initial scroll completes
    setTimeout(() => {
      readNextSentence();
    }, 500);
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
          const isVisited = visitedSentences.includes(index);
          const highlightedSentence = highlightVocabularyWords(sentence);
          
          // Make sure the ref is created if it doesn't exist
          if (!sentenceRefs.current[index]) {
            sentenceRefs.current[index] = React.createRef();
          }
          
          return (
            <motion.div
              key={index}
              ref={sentenceRefs.current[index]}
              id={`sentence-${index}`}
              className={`${styles.sentence} ${
                isCurrentSentence ? styles.currentSentence : ''
              } ${isVisited ? styles.visitedSentence : ''}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: 1,
                x: 0,
                scale: isCurrentSentence ? 1.08 : 1
              }}
              transition={{ duration: 0.3 }}
            >
              <div className={styles.sentenceNumberContainer}>
                <span className={styles.sentenceNumber}>{index + 1}</span>
                {hasSpeech && (
                  <button
                    className={`${styles.sentenceSpeakerButton} ${
                      isCurrentSentence && readingSingleSentence ? styles.speakerActive : ''
                    }`}
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
        
        {/* Continue button - Always enabled */}
        <div className={styles.continueButtonContainer}>
          <button
            className={styles.continueButton}
            onClick={handleContinueToPuzzle}
          >
            Continue to Puzzle
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoryScreen;