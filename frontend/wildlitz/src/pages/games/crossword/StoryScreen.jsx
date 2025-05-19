// StoryScreen with individual sound buttons for each sentence
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../../styles/games/crossword/StoryScreen.module.css';

/**
 * Enhanced Story Screen with individual sound buttons for each sentence
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
      
      // Reset visited sentences
      setVisitedSentences([]);
    }
  }, [storySegment]);
  
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
  const readSentence = (index, continueReading = false) => {
    if (index >= sentences.length) {
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
    utterance.rate = 0.85; // Slightly slower for kids
    utterance.pitch = 1.2; // Slightly higher pitch for engaging tone
    
    // Highlight the current sentence
    setCurrentSentenceIndex(index);
    
    // Add to visited sentences if not already visited
    if (!visitedSentences.includes(index)) {
      setVisitedSentences(prev => [...prev, index]);
    }
    
    // Scroll to the current sentence
    scrollToSentence(index);
    
    // When finished with this sentence
    utterance.onend = () => {
      // If we should continue reading the next sentence
      if (continueReading) {
        // Small delay before next sentence
        setTimeout(() => {
          readSentence(index + 1, true);
        }, 500);
      } else {
        // Just finish this single sentence
        setCurrentSentenceIndex(null);
        if (!isReading) {
          speechSynth.cancel();
        }
      }
    };
    
    speechSynth.speak(utterance);
  };
  
  // Stop reading aloud
  const handleStopReading = () => {
    if (hasSpeech) {
      speechSynth.cancel();
      setIsReading(false);
      setCurrentSentenceIndex(null);
    }
  };
  
  // Read an individual sentence (for preview buttons)
  const handleReadSingleSentence = (index) => {
    // If already reading, stop
    if (isReading) {
      handleStopReading();
    }
    
    // Read just this one sentence
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
  
  // Function to highlight vocabulary words in a sentence
  const highlightVocabWords = (sentence) => {
    if (!wordsToPuzzle || wordsToPuzzle.length === 0) return sentence;
    
    // Create a deep copy of the sentence to work with
    let processedSentence = sentence;
    
    // Get rainbow colors for words
    const colors = ['#FF5252', '#FF9E80', '#FFCA28', '#66BB6A', '#42A5F5', '#7E57C2'];
    
    // Replace vocabulary words with highlighted spans
    wordsToPuzzle.forEach((word, index) => {
      const wordRegex = new RegExp(`\\b${word}\\b`, 'gi');
      if (wordRegex.test(processedSentence)) {
        const color = colors[index % colors.length];
        processedSentence = processedSentence.replace(wordRegex, match => 
          `<span class="${styles.vocabWord}" style="background-color: ${color}; color: white;">${match}</span>`
        );
      }
    });
    
    return processedSentence;
  };
  
  // Render the story text with each sentence on its own line
  const renderSentenceByLine = () => {
    if (!sentences || sentences.length === 0) return null;
    
    return (
      <div className={styles.sentenceLines}>
        {sentences.map((sentence, index) => {
          // Check if this is the current sentence being read
          const isCurrentSentence = index === currentSentenceIndex;
          
          // Highlight vocabulary words in this sentence
          const highlightedSentence = highlightVocabWords(sentence);
          
          return (
            <motion.div
              ref={sentenceRefs.current[index]}
              key={index}
              id={`sentence-${index}`}
              className={`${styles.sentenceLine} ${isCurrentSentence ? styles.currentSentence : ''} ${visitedSentences.includes(index) ? styles.visitedSentence : ''}`}
              initial={{ opacity: 0.9 }}
              animate={{ 
                opacity: isCurrentSentence ? 1 : 0.9,
                backgroundColor: isCurrentSentence ? 'rgba(156, 39, 176, 0.1)' : 'transparent',
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
              {/* Story text with line-by-line sentences */}
              <div 
                ref={storyTextRef}
                className={`${styles.storyText} ${isReading ? styles.readingMode : ''}`}
              >
                {renderSentenceByLine()}
              </div>
              
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
                {wordsToPuzzle.map((word, index) => {
                  // Get a rainbow color for each word
                  const colors = ['#FF5252', '#FF9E80', '#FFCA28', '#66BB6A', '#42A5F5', '#7E57C2'];
                  const color = colors[index % colors.length];
                  
                  return (
                    <div 
                      key={index} 
                      className={styles.vocabularyWord}
                      style={{ backgroundColor: color }}
                    >
                      {word.toLowerCase()}
                    </div>
                  );
                })}
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