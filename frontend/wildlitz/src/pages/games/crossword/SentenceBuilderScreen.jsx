// src/pages/games/crossword/SentenceBuilderScreen.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from '../../../styles/games/crossword/SentenceBuilderScreen.module.css';

/**
 * SentenceBuilderScreen component for the Crossword Game
 * Allows building sentences with the words learned from the crossword
 */
const SentenceBuilderScreen = ({ words, onComplete }) => {
  // Current state
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [sentence, setSentence] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [hasChecked, setHasChecked] = useState(false);
  
  // Track progress
  const [completedWords, setCompletedWords] = useState([]);
  
  // Get the current word
  const currentWord = words[currentWordIndex] || null;
  
  // Example sentences for each word (would come from an API in a real app)
  const getExampleSentences = (word) => {
    // These would be retrieved from a database in a real app
    // Each word should have a set of valid sentences using it
    return [
      `${word.answer} is an important vocabulary word.`,
      `Students should practice using ${word.answer} in sentences.`,
      `Can you think of ways to use ${word.answer} in your writing?`
    ];
  };
  
  // Starter sentence suggestions
  const getSentenceStarters = (word) => {
    return [
      `The ${word.answer} is...`,
      `I saw a ${word.answer} that...`,
      `My favorite ${word.answer}...`
    ];
  };
  
  // Handle sentence input change
  const handleSentenceChange = (e) => {
    setSentence(e.target.value);
    // Clear feedback when user types
    if (feedback) {
      setFeedback(null);
    }
  };
  
  // Insert a sentence starter
  const insertSentenceStarter = () => {
    if (currentWord) {
      // Choose a random starter
      const starters = getSentenceStarters(currentWord);
      const randomStarter = starters[Math.floor(Math.random() * starters.length)];
      setSentence(randomStarter);
    }
  };
  
  // Check the sentence
  const checkSentence = () => {
    if (!sentence.trim()) {
      setFeedback({
        correct: false,
        message: "Please enter a sentence before checking."
      });
      return;
    }
    
    // Check if the sentence contains the current word
    const sentenceLower = sentence.toLowerCase();
    const wordLower = currentWord.answer.toLowerCase();
    
    if (!sentenceLower.includes(wordLower)) {
      setFeedback({
        correct: false,
        message: `Your sentence should include the word "${currentWord.answer}".`
      });
      return;
    }
    
    // Check if the sentence is long enough
    if (sentence.trim().split(/\s+/).length < 3) {
      setFeedback({
        correct: false,
        message: "Your sentence is too short. Please use at least 3 words."
      });
      return;
    }
    
    // Check if the sentence ends with punctuation
    if (!/[.!?]$/.test(sentence)) {
      setFeedback({
        correct: false,
        message: "Please end your sentence with a period, question mark, or exclamation point."
      });
      return;
    }
    
    // Success!
    setFeedback({
      correct: true,
      message: "Great job! That's a good sentence using the word."
    });
    
    setHasChecked(true);
    
    // Mark word as completed
    setCompletedWords(prev => [...prev, currentWord]);
  };
  
  // Move to the next word
  const moveToNextWord = () => {
    // If sentence is not checked yet, check it first
    if (!hasChecked) {
      checkSentence();
      return;
    }
    
    // Clear state for next word
    setSentence('');
    setFeedback(null);
    setHasChecked(false);
    
    // Check if we've completed all words
    if (currentWordIndex >= words.length - 1) {
      // All words completed
      if (onComplete) {
        onComplete();
      }
      return;
    }
    
    // Move to the next word
    setCurrentWordIndex(prevIndex => prevIndex + 1);
  };
  
  // Clear the current sentence
  const clearSentence = () => {
    setSentence('');
    setFeedback(null);
  };
  
  // Calculate progress percentage
  const calculateProgress = () => {
    if (words.length === 0) return 0;
    return Math.round((completedWords.length / words.length) * 100);
  };
  
  return (
    <div className={styles.builderContainer}>
      <div className={styles.builderCard}>
        {/* Header */}
        <div className={styles.builderHeader}>
          <div className={styles.studentInfo}>
            <div className={styles.studentLabel}>Activity: Sentence Building</div>
          </div>
        </div>
        
        {/* Main content */}
        <div className={styles.builderContent}>
          {/* Instruction banner */}
          <div className={styles.instructionBanner}>
            <h3 className={styles.instructionTitle}>Create a Sentence!</h3>
            <p className={styles.instructionSubtitle}>
              Use the words you learned in the crossword to make meaningful sentences.
            </p>
          </div>
          
          {/* Word selection */}
          <div className={styles.wordSelectionSection}>
            <h3 className={styles.sectionTitle}>Words Available:</h3>
            <div className={styles.wordOptions}>
              {words.map((word, index) => (
                <button
                  key={`word-${index}`}
                  className={`${styles.wordOption} ${index === currentWordIndex ? styles.activeWord : ''}`}
                  onClick={() => {
                    if (!hasChecked || index === currentWordIndex) {
                      setCurrentWordIndex(index);
                      setSentence('');
                      setFeedback(null);
                      setHasChecked(false);
                    }
                  }}
                  disabled={hasChecked && index !== currentWordIndex}
                >
                  {word.answer}
                </button>
              ))}
            </div>
          </div>
          
          {/* Word details */}
          {currentWord && (
            <div className={styles.wordDetailsSection}>
              <h3 className={styles.wordTitle}>
                {currentWord.answer}
                <span className={styles.partOfSpeech}>(from clue: {currentWord.clue})</span>
              </h3>
              
              <div className={styles.definitionSection}>
                <span className={styles.definitionLabel}>Definition: </span>
                {currentWord.definition || "No definition available"}
              </div>
              
              <div className={styles.exampleSection}>
                <span className={styles.exampleLabel}>Example: </span>
                {currentWord.example || getExampleSentences(currentWord)[0]}
              </div>
            </div>
          )}
          
          {/* Sentence input */}
          <div className={styles.sentenceInputSection}>
            <h3 className={styles.sectionTitle}>Write Your Sentence:</h3>
            
            <div className={styles.helperButtons}>
              <button
                className={styles.starterButton}
                onClick={insertSentenceStarter}
              >
                Give me a sentence starter
              </button>
            </div>
            
            <div className={styles.inputArea}>
              <input
                type="text"
                className={styles.sentenceInput}
                value={sentence}
                onChange={handleSentenceChange}
                placeholder={`Write a sentence using "${currentWord?.answer}"`}
              />
            </div>
            
            <div className={styles.actionButtonsContainer}>
              <button
                className={styles.clearButton}
                onClick={clearSentence}
                disabled={!sentence}
              >
                Clear
              </button>
              
              <button
                className={styles.checkButton}
                onClick={hasChecked ? moveToNextWord : checkSentence}
                disabled={!sentence}
              >
                {hasChecked ? 'Next Word' : 'Check Sentence'}
              </button>
            </div>
            
            {feedback && (
              <div className={`${styles.feedbackBox} ${feedback.correct ? styles.correctFeedback : styles.incorrectFeedback}`}>
                {feedback.message}
              </div>
            )}
          </div>
        </div>
        
        {/* Progress section */}
        <div className={styles.progressSection}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
          
          <div className={styles.progressLabel}>
            <span>Progress: {completedWords.length}/{words.length} words</span>
            <span>{calculateProgress()}% complete</span>
          </div>
          
          {currentWordIndex === words.length - 1 && hasChecked && (
            <button
              className={styles.nextButton}
              onClick={onComplete}
            >
              Complete Activity
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SentenceBuilderScreen;