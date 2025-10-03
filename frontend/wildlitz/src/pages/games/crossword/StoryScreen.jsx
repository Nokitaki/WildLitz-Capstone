// src/pages/games/crossword/StoryScreen.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../../styles/games/crossword/StoryScreen.module.css';

/**
 * Enhanced Story Screen - Fixed version without infinite loops
 */
const StoryScreen = ({ 
  storySegment, 
  onContinue, 
  vocabularyWords = [], 
  currentEpisode,
  onToggleReadingCoach
}) => {
  // State for UI flow
  const [isReadyForDiscussion, setIsReadyForDiscussion] = useState(false);
  const [isReadyForPuzzle, setIsReadyForPuzzle] = useState(false);
  const [hasReadStory, setHasReadStory] = useState(false);
  
  // State for reading aloud
  const [isReading, setIsReading] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(null);
  const [sentences, setSentences] = useState([]);
  const [visitedSentences, setVisitedSentences] = useState([]);
  
  // References
  const storyTextRef = useRef(null);
  const sentenceRefs = useRef([]);
  
  // Check if speech synthesis is available
  const hasSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const speechSynth = hasSpeech ? window.speechSynthesis : null;
  
  // Process the story text to extract sentences
  useEffect(() => {
    if (storySegment && storySegment.text) {
      // Split text into sentences
      const sentenceRegex = /[^.!?]+[.!?]+/g;
      const extractedSentences = storySegment.text.match(sentenceRegex) || [storySegment.text];
      setSentences(extractedSentences.map(s => s.trim()));
      
      // Initialize refs for each sentence
      sentenceRefs.current = extractedSentences.map(() => React.createRef());
      
      // Reset state when story changes
      setVisitedSentences([]);
      setIsReadyForDiscussion(false);
      setIsReadyForPuzzle(false);
      setHasReadStory(false);
      setIsReading(false);
      setCurrentSentenceIndex(null);
    }
  }, [storySegment]);
  
  // Highlight vocabulary words in text
  const highlightVocabularyWords = (text) => {
    if (!vocabularyWords || vocabularyWords.length === 0) {
      return text;
    }
    
    let highlightedText = text;
    
    vocabularyWords.forEach(word => {
      const wordRegex = new RegExp(`\\b(${word})\\b`, 'gi');
      highlightedText = highlightedText.replace(
        wordRegex,
        '<span class="' + styles.highlightedWord + '">$1</span>'
      );
    });
    
    return highlightedText;
  };
  
  // Handle reading the full story aloud
  const handleReadAloud = () => {
    if (!hasSpeech || sentences.length === 0) return;
    
    setIsReading(true);
    setCurrentSentenceIndex(0);
    
    // Cancel any ongoing speech
    speechSynth.cancel();
    
    // Read sentences one by one
    readSentence(0, true);
  };
  
  // Read a specific sentence
  const readSentence = useCallback((index, continueReading = false) => {
    if (!hasSpeech || index >= sentences.length) {
      setIsReading(false);
      setCurrentSentenceIndex(null);
      setHasReadStory(true);
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(sentences[index]);
    
    // Find a good voice
    const voices = speechSynth.getVoices();
    const englishVoice = voices.find(v => 
      v.lang.includes('en') && v.name.includes('Female')
    ) || voices.find(v => v.lang.includes('en')) || voices[0];
    
    utterance.voice = englishVoice;
    utterance.rate = 0.85;
    utterance.pitch = 1.2;
    
    // Highlight the current sentence
    setCurrentSentenceIndex(index);
    
    // Add to visited sentences
    setVisitedSentences(prev => {
      if (prev.includes(index)) return prev;
      return [...prev, index];
    });
    
    // Scroll to the current sentence
    scrollToSentence(index);
    
    // When finished with this sentence
    utterance.onend = () => {
      if (continueReading) {
        setTimeout(() => {
          readSentence(index + 1, true);
        }, 500);
      } else {
        setCurrentSentenceIndex(null);
      }
    };
    
    speechSynth.speak(utterance);
  }, [sentences, hasSpeech, speechSynth]);
  
  // Stop reading aloud
  const handleStopReading = () => {
    if (hasSpeech) {
      speechSynth.cancel();
      setIsReading(false);
      setCurrentSentenceIndex(null);
      setHasReadStory(true);
    }
  };
  
  // Read an individual sentence
  const handleReadSingleSentence = (index) => {
    if (isReading) {
      handleStopReading();
    }
    readSentence(index, false);
  };
  
  // Scroll to a specific sentence
  const scrollToSentence = (index) => {
    if (sentenceRefs.current[index] && sentenceRefs.current[index].current) {
      sentenceRefs.current[index].current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center'
      });
    }
  };
  
  // Handle advancing through the story stages
  const handleContinue = () => {
    if (!isReadyForDiscussion) {
      setIsReadyForDiscussion(true);
    } else if (!isReadyForPuzzle) {
      setIsReadyForPuzzle(true);
    } else if (onContinue) {
      if (hasSpeech) {
        speechSynth.cancel();
      }
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
  
  // Determine the stage label text
  const getStageLabelText = () => {
    if (!isReadyForDiscussion) {
      return "Stage 1: Reading";
    } else if (!isReadyForPuzzle) {
      return "Stage 2: Discussion";
    } else {
      return "Stage 3: Puzzle Preparation";
    }
  };
  
  // Determine the continue button text
  const getContinueButtonText = () => {
    if (!isReadyForDiscussion) {
      return "Continue to Discussion";
    } else if (!isReadyForPuzzle) {
      return "Continue to Puzzle";
    } else {
      return "Start Crossword Puzzle";
    }
  };
  
  // Render sentences with highlights
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
              <div className={styles.sentenceNumber}>{index + 1}</div>
              <div 
                className={styles.sentenceContent}
                dangerouslySetInnerHTML={{ __html: highlightedSentence }}
              />
              <button 
                className={styles.sentenceSoundButton}
                onClick={() => handleReadSingleSentence(index)}
                disabled={!hasSpeech}
                title="Read this sentence"
              >
                🔊
              </button>
            </motion.div>
          );
        })}
      </div>
    );
  };
  
  if (!storySegment) {
    return <div>Loading story...</div>;
  }
  
  return (
    <div className={styles.storyContainer}>
      <div className={styles.storyCard}>
        {/* Header with episode info */}
        <div className={styles.storyHeader}>
          <h2 className={styles.episodeTitle}>Episode {currentEpisode}: {storySegment.title}</h2>
          <div className={styles.stageLabel}>{getStageLabelText()}</div>
        </div>
        
        {/* Main content area */}
        <div className={styles.storyContent}>
          {/* Reading pane */}
          <div className={styles.readingPane}>
            <div className={styles.readingControls}>
              <button 
                className={`${styles.readButton} ${isReading ? styles.disabled : ''}`}
                onClick={handleReadAloud}
                disabled={isReading}
              >
                <span className={styles.buttonIcon}>🔊</span> Read Aloud
              </button>
              
              {isReading && (
                <button 
                  className={styles.stopButton}
                  onClick={handleStopReading}
                >
                  <span className={styles.buttonIcon}>⏹️</span> Stop Reading
                </button>
              )}
              
              <button 
                className={styles.readingCoachButton}
                onClick={onToggleReadingCoach}
              >
                <span className={styles.buttonIcon}>🦉</span> Reading Helper
              </button>
            </div>
            
            <div className={styles.storyTextWrapper}>
              <div 
                ref={storyTextRef}
                className={`${styles.storyText} ${isReading ? styles.reading : ''}`}
              >
                {renderStoryText()}
              </div>
            </div>
          </div>
          
          {/* Discussion questions */}
          <AnimatePresence>
            {isReadyForDiscussion && (
              <motion.div
                className={styles.discussionPane}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h3 className={styles.discussionTitle}>Let's Talk About the Story</h3>
                <div className={styles.discussionQuestions}>
                  {storySegment.discussionQuestions && storySegment.discussionQuestions.map((question, index) => (
                    <div key={index} className={styles.questionCard}>
                      <div className={styles.questionNumber}>{index + 1}</div>
                      <p className={styles.questionText}>{question}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Puzzle preparation */}
          <AnimatePresence>
            {isReadyForPuzzle && (
              <motion.div
                className={styles.puzzlePrep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5 }}
              >
                <h3 className={styles.puzzlePrepTitle}>Get Ready for the Puzzle!</h3>
                <div className={styles.puzzleInstructions}>
                  <p>Now it's time to solve a crossword puzzle using words from the story.</p>
                  <p>Look for the <span className={styles.highlightedWordExample}>highlighted words</span> in the story.</p>
                  <p>Work together as a class to solve the puzzle!</p>
                </div>
                
                <div className={styles.puzzleTips}>
                  <h4 className={styles.tipsTitle}>Puzzle Tips:</h4>
                  <ul className={styles.tipsList}>
                    <li>Read each clue carefully</li>
                    <li>Look back at the story if you need help</li>
                    <li>Start with the words you know for sure</li>
                    <li>Use the Reading Helper if you need vocabulary help</li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Continue button */}
        <div className={styles.continueButtonContainer}>
          <button
            className={styles.continueButton}
            onClick={handleContinue}
            disabled={!hasReadStory && !isReading}
          >
            {getContinueButtonText()}
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

export default StoryScreen;