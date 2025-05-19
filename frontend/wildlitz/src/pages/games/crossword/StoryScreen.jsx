// src/pages/games/crossword/StoryScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../../styles/games/crossword/StoryScreen.module.css';

/**
 * Story Screen component for displaying story passages before crossword puzzles
 */
const StoryScreen = ({ 
  storySegment, 
  onContinue, 
  wordsToPuzzle = [], 
  currentEpisode,
  onToggleReadingCoach
}) => {
  // State for UI flow
  const [isReadyForDiscussion, setIsReadyForDiscussion] = useState(false);
  const [isReadyForPuzzle, setIsReadyForPuzzle] = useState(false);
  const [hasReadStory, setHasReadStory] = useState(false);
  
  // State for reading aloud
  const [isReading, setIsReading] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [sentences, setSentences] = useState([]);
  const [highlightedText, setHighlightedText] = useState('');
  
  // References
  const storyTextRef = useRef(null);
  
  // Check if speech synthesis is available
  const hasSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const speechSynth = hasSpeech ? window.speechSynthesis : null;
  
  // Process the story text to highlight vocabulary words
  useEffect(() => {
    if (storySegment && storySegment.text && wordsToPuzzle.length > 0) {
      let text = storySegment.text;
      
      // Create a regex pattern for all words to highlight
      const wordsPattern = wordsToPuzzle
        .map(word => `\\b${word}\\b`)
        .join('|');
      
      const regex = new RegExp(wordsPattern, 'gi');
      const highlightedText = text.replace(regex, match => 
        `<span class="${styles.highlightedWord}">${match}</span>`
      );
      
      setHighlightedText(highlightedText);
      
      // Split text into sentences for reading aloud
      const sentenceRegex = /[^.!?]+[.!?]+/g;
      const extractedSentences = text.match(sentenceRegex) || [text];
      setSentences(extractedSentences.map(s => s.trim()));
    }
  }, [storySegment, wordsToPuzzle]);
  
  // Handle read aloud functionality
  const handleReadAloud = () => {
    if (!hasSpeech || sentences.length === 0) return;
    
    setIsReading(true);
    setCurrentSentenceIndex(0);
    
    // Cancel any ongoing speech
    speechSynth.cancel();
    
    // Read sentences one by one
    readNextSentence(0);
  };
  
  // Read the next sentence
  const readNextSentence = (index) => {
    if (index >= sentences.length) {
      setIsReading(false);
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
    utterance.rate = 0.9; // Slightly slower for kids
    utterance.pitch = 1.1; // Slightly higher pitch
    
    // Highlight the current sentence
    setCurrentSentenceIndex(index);
    
    // When finished with this sentence, read the next one
    utterance.onend = () => {
      // Small delay before next sentence
      setTimeout(() => {
        readNextSentence(index + 1);
      }, 500);
    };
    
    speechSynth.speak(utterance);
  };
  
  // Stop reading aloud
  const handleStopReading = () => {
    if (hasSpeech) {
      speechSynth.cancel();
      setIsReading(false);
    }
  };
  
  // Handle advancing through the story stages
  const handleContinue = () => {
    if (!isReadyForDiscussion) {
      setIsReadyForDiscussion(true);
    } else if (!isReadyForPuzzle) {
      setIsReadyForPuzzle(true);
    } else if (onContinue) {
      // Stop any ongoing reading
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
  }, []);
  
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
  
  // Render the component
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
          {/* Reading pane - always visible */}
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
                className={`${styles.storyText} ${isReading ? styles.readingMode : ''}`}
                dangerouslySetInnerHTML={{ __html: highlightedText }}
              ></div>
              
              {isReading && (
                <div className={styles.readingProgress}>
                  <div className={styles.progressLabel}>
                    Reading sentence {currentSentenceIndex + 1} of {sentences.length}
                  </div>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill}
                      style={{ width: `${((currentSentenceIndex + 1) / sentences.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
            
            <div className={styles.vocabularySection}>
              <h3 className={styles.vocabularyTitle}>Vocabulary Words:</h3>
              <div className={styles.vocabularyWords}>
                {wordsToPuzzle.map((word, index) => (
                  <div key={index} className={styles.vocabularyWord}>
                    {word.toLowerCase()}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Discussion pane - visible after reading */}
          <AnimatePresence>
            {isReadyForDiscussion && (
              <motion.div 
                className={styles.discussionPane}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className={styles.discussionTitle}>Discussion Questions:</h3>
                <ul className={styles.discussionQuestions}>
                  {storySegment.discussionQuestions.map((question, index) => (
                    <li key={index} className={styles.discussionQuestion}>
                      <div className={styles.questionNumber}>{index + 1}</div>
                      <div className={styles.questionText}>{question}</div>
                    </li>
                  ))}
                </ul>
                
                <div className={styles.teacherNote}>
                  <div className={styles.teacherIcon}>👩‍🏫</div>
                  <div className={styles.noteText}>
                    <strong>Teacher Note:</strong> Discuss these questions as a class before moving on to the crossword puzzle.
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Puzzle preparation pane - visible after discussion */}
          <AnimatePresence>
            {isReadyForPuzzle && (
              <motion.div 
                className={styles.puzzlePreparationPane}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className={styles.preparationTitle}>Get Ready for the Crossword!</h3>
                <div className={styles.preparationInstructions}>
                  <p>Now that you've read the story and discussed it, you're ready to solve the crossword puzzle!</p>
                  <p>The crossword will include words from the story that you just read. Look for the <span className={styles.highlightedWordExample}>highlighted words</span> in the story.</p>
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
          <motion.button
            className={styles.continueButton}
            onClick={handleContinue}
            disabled={!hasReadStory && !isReading}
            whileHover={{ scale: hasReadStory || isReading ? 1.05 : 1 }}
            whileTap={{ scale: hasReadStory || isReading ? 0.95 : 1 }}
          >
            {getContinueButtonText()}
          </motion.button>
          
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