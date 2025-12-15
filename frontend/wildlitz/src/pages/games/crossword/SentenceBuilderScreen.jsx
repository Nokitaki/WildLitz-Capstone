
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from '../../../styles/games/crossword/SentenceBuilderScreen.module.css';
import BackToHomeButton from '../crossword/BackToHomeButton';

const SentenceBuilderScreen = ({ words, onReturnToSummary, onReturnToMenu }) => {
 
  const [activeWord, setActiveWord] = useState(words.length > 0 ? words[0].word : '');
  
  const [sentence, setSentence] = useState('');
  
  const [feedback, setFeedback] = useState(null);
  
  const [completedSentences, setCompletedSentences] = useState(0);
  
  const totalSentences = 3;
  
  const [isPlaying, setIsPlaying] = useState(false);
  
  
  const sentenceInputRef = useRef(null);
  
 
  const getActiveWordDetails = () => {
    const wordObj = words.find(w => w.word.toLowerCase() === activeWord.toLowerCase());
    return wordObj || { 
      word: activeWord,
      definition: "No definition available",
      example: "No example available"
    };
  };
  
 
  const handleWordSelect = (word) => {
    setActiveWord(word);
    setSentence('');
    setFeedback(null);
    
    
    setTimeout(() => {
      if (sentenceInputRef.current) {
        sentenceInputRef.current.focus();
      }
    }, 100);
  };
  
  
  const handleSentenceChange = (e) => {
    setSentence(e.target.value);
  };
  

  const handleCheckSentence = () => {
    if (!sentence.trim()) return;
    
   
    const containsWord = sentence.toLowerCase().includes(activeWord.toLowerCase());
    const startsWithCapital = /^[A-Z]/.test(sentence);
    const endsWithPunctuation = /[.!?]$/.test(sentence);
    
    if (containsWord && startsWithCapital && endsWithPunctuation) {
     
      setFeedback({
        isCorrect: true,
        message: "Great job! Your sentence correctly uses the word."
      });
      
     
      setCompletedSentences(prev => prev + 1);
      
      
      if (completedSentences + 1 >= totalSentences) {
        setTimeout(() => {
         
          onReturnToSummary();
        }, 2000);
      }
      
     
      setTimeout(() => {
        
        const currentIndex = words.findIndex(w => w.word.toLowerCase() === activeWord.toLowerCase());
        const nextIndex = (currentIndex + 1) % words.length;
        
        handleWordSelect(words[nextIndex].word);
      }, 1500);
    } else {
      
      let message = "Your sentence needs improvement: ";
      if (!containsWord) message += "It should include the word '" + activeWord + "'. ";
      if (!startsWithCapital) message += "It should start with a capital letter. ";
      if (!endsWithPunctuation) message += "It should end with punctuation (. ! ?). ";
      
      setFeedback({
        isCorrect: false,
        message
      });
    }
  };
  
 
  const handleClear = () => {
    setSentence('');
    setFeedback(null);
    
    
    if (sentenceInputRef.current) {
      sentenceInputRef.current.focus();
    }
  };
  
 
  const handlePlayAudio = () => {
    setIsPlaying(true);
    
   
    setTimeout(() => {
      setIsPlaying(false);
    }, 2000);
  };
  
 
  const handleSentenceStarter = () => {
    const starters = [
      `The ${activeWord.toLowerCase()} `,
      `My favorite ${activeWord.toLowerCase()} `,
      `I saw a ${activeWord.toLowerCase()} `,
      `This ${activeWord.toLowerCase()} `
    ];
    
   
    const starter = starters[Math.floor(Math.random() * starters.length)];
    setSentence(starter);
    
   
    if (sentenceInputRef.current) {
      sentenceInputRef.current.focus();
    }
  };
  
 
  const activeWordDetails = getActiveWordDetails();
  
  return (
    <div className={styles.builderContainer}>
       <ThemeBackground theme={gameConfig?.adventureId ? gameStories[gameConfig.adventureId]?.theme : 'jungle'} />
    
    <AnimatePresence mode="wait">
      
    </AnimatePresence>
       <BackToHomeButton 
      position="top-left"
      customMessage="Are you sure you want to leave? Your sentences will not be saved!"
    />
      <div className={styles.builderCard}>
        {/* Header with student info */}
        <div className={styles.builderHeader}>
          <div className={styles.studentInfo}>
            <span className={styles.studentLabel}>Student: Kyle</span>
            <span className={styles.gradeLabel}>Grade 3</span>
          </div>
        </div>
        
        {/* Main content */}
        <div className={styles.builderContent}>
          {/* Instruction banner */}
          <div className={styles.instructionBanner}>
            <h2 className={styles.instructionTitle}>
              Create sentence using the words you've learned!
            </h2>
            <p className={styles.instructionSubtitle}>
              Pick a word, then write a sentence that shows you understand what it means
            </p>
          </div>
          
          {/* Word selection */}
          <div className={styles.wordSelectionSection}>
            <h3 className={styles.sectionTitle}>Choose a word:</h3>
            <div className={styles.wordOptions}>
              {words.map((word, index) => (
                <motion.button
                  key={index}
                  className={`${styles.wordOption} ${activeWord === word.word ? styles.activeWord : ''}`}
                  onClick={() => handleWordSelect(word.word)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {word.word.toLowerCase()}
                </motion.button>
              ))}
            </div>
          </div>
          
          {/* Word details */}
          <div className={styles.wordDetailsSection}>
            <div className={styles.wordTitle}>
              {activeWord.toLowerCase()} <span className={styles.partOfSpeech}>(noun)</span>
            </div>
            
            <div className={styles.definitionSection}>
              <span className={styles.definitionLabel}>Definition:</span> {activeWordDetails.definition}
            </div>
            
            <div className={styles.exampleSection}>
              <span className={styles.exampleLabel}>Example:</span>
              {activeWordDetails.example.includes(activeWord.toLowerCase()) ? (
                <span>
                  {activeWordDetails.example.split(activeWord.toLowerCase()).map((part, i, arr) => (
                    <React.Fragment key={i}>
                      {part}
                      {i < arr.length - 1 && <span className={styles.highlightedWord}>{activeWord.toLowerCase()}</span>}
                    </React.Fragment>
                  ))}
                </span>
              ) : (
                activeWordDetails.example
              )}
            </div>
          </div>
          
          {/* Sentence input */}
          <div className={styles.sentenceInputSection}>
            <h3 className={styles.sectionTitle}>Write your sentence:</h3>
            <div className={styles.inputArea}>
              <input
                ref={sentenceInputRef}
                type="text"
                value={sentence}
                onChange={handleSentenceChange}
                className={styles.sentenceInput}
                placeholder={`Write a sentence using "${activeWord.toLowerCase()}"`}
              />
            </div>
            
            {/* Helper buttons */}
            <div className={styles.helperButtons}>
              <motion.button
                className={styles.audioButton}
                onClick={handlePlayAudio}
                disabled={isPlaying}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isPlaying ? '🔊' : '🔈'}
              </motion.button>
              
              <motion.button
                className={styles.starterButton}
                onClick={handleSentenceStarter}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sentence Starter
              </motion.button>
              
              <motion.button
                className={styles.recordButton}
                onClick={handlePlayAudio}
                disabled={isPlaying}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🎤
              </motion.button>
            </div>
            
            {/* Action buttons */}
            <div className={styles.actionButtonsContainer}>
              <motion.button
                className={styles.clearButton}
                onClick={handleClear}
                disabled={!sentence}
                whileHover={{ scale: sentence ? 1.05 : 1 }}
                whileTap={{ scale: sentence ? 0.95 : 1 }}
              >
                Clear
              </motion.button>
              
              <motion.button
                className={styles.checkButton}
                onClick={handleCheckSentence}
                disabled={!sentence.trim()}
                whileHover={{ scale: sentence.trim() ? 1.05 : 1 }}
                whileTap={{ scale: sentence.trim() ? 0.95 : 1 }}
              >
                Check Sentence
              </motion.button>
            </div>
            
            {/* Feedback display */}
            {feedback && (
              <motion.div
                className={`${styles.feedbackBox} ${feedback.isCorrect ? styles.correctFeedback : styles.incorrectFeedback}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {feedback.message}
              </motion.div>
            )}
          </div>
          
          {/* Progress bar */}
          <div className={styles.progressSection}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ width: `${(completedSentences / totalSentences) * 100}%` }}
              ></div>
            </div>
            <div className={styles.progressLabel}>
              {completedSentences} of {totalSentences} sentences
            </div>
            
            <motion.button
              className={styles.nextButton}
              onClick={() => {
                // Find the next unused word
                const currentIndex = words.findIndex(w => w.word.toLowerCase() === activeWord.toLowerCase());
                const nextIndex = (currentIndex + 1) % words.length;
                
                handleWordSelect(words[nextIndex].word);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Next Word
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentenceBuilderScreen;