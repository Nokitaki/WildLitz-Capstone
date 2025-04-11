import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceInputRecorder from '../audio/VoiceInputRecorder';
import axios from 'axios';
import '../../styles/custom_word_modal.css';

const CustomWordModal = ({ isOpen, onClose, onSave, existingWords = [] }) => {
  const [words, setWords] = useState([]);
  const [currentWord, setCurrentWord] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [addMethod, setAddMethod] = useState('type'); // 'type' or 'voice'
  
  // Initialize words from existing words if provided
  useEffect(() => {
    if (existingWords.length > 0) {
      setWords(existingWords);
    }
  }, [existingWords]);

  // Function to add a new typed word - will automatically analyze with AI
  const handleAddTypedWord = async () => {
    // Validate input
    if (!currentWord.trim()) {
      setError('Please enter a word');
      return;
    }
    
    setIsAnalyzing(true);
    setError('');
    
    try {
      // Call API to analyze the word (without audio)
      const response = await axios.post('/api/syllabification/analyze-word/', {
        word: currentWord.trim()
      });
      
      if (response.data) {
        // Add word with AI analysis
        const newWord = {
          word: response.data.word || currentWord.trim(),
          syllableBreakdown: response.data.syllable_breakdown || currentWord.trim(),
          syllableCount: response.data.syllable_count || 1,
          category: response.data.category || 'General',
          usesCustomAudio: false // This will use AI voice
        };
        
        setWords(prevWords => [...prevWords, newWord]);
        setCurrentWord(''); // Reset input field
      }
    } catch (error) {
      console.error('Error analyzing word:', error);
      setError('Error analyzing the word. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle word recognized from voice input
  const handleWordRecognized = (wordData) => {
    // Add the recognized word to the list
    const newWord = {
      word: wordData.word,
      syllableBreakdown: wordData.syllableBreakdown,
      syllableCount: wordData.syllableCount,
      category: wordData.category,
      customAudio: wordData.customAudio,
      usesCustomAudio: true // This will use teacher's voice
    };
    
    setWords(prevWords => [...prevWords, newWord]);
  };

  // Function to remove a word
  const handleRemoveWord = (index) => {
    const newWords = [...words];
    newWords.splice(index, 1);
    setWords(newWords);
  };

  // Function to save all words
  const handleSaveWords = () => {
    onSave(words);
  };

  // Handle switching between typing and voice input methods
  const handleSwitchAddMethod = (method) => {
    setAddMethod(method);
    setCurrentWord('');
    setError('');
  };

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalVariants = {
    hidden: { 
      y: "-100vh",
      opacity: 0 
    },
    visible: { 
      y: 0,
      opacity: 1,
      transition: { 
        type: "spring", 
        damping: 25, 
        stiffness: 300,
        delay: 0.2
      } 
    },
    exit: { 
      y: "100vh",
      opacity: 0,
      transition: { ease: "easeInOut" }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="modal-backdrop"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.div 
            className="custom-word-modal"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <button 
              className="close-button"
              onClick={onClose}
            >
              ×
            </button>

            <h2>Add Custom Words</h2>
            <p className="modal-description">
              Add words by typing or speaking for the syllable clapping game.
            </p>

            <div className="add-method-selector">
              <button 
                className={`add-method-button ${addMethod === 'type' ? 'selected' : ''}`}
                onClick={() => handleSwitchAddMethod('type')}
              >
                <span role="img" aria-label="Type">⌨️</span> Type Words
              </button>
              <button 
                className={`add-method-button ${addMethod === 'voice' ? 'selected' : ''}`}
                onClick={() => handleSwitchAddMethod('voice')}
              >
                <span role="img" aria-label="Speak">🎤</span> Speak Words
              </button>
            </div>

            {addMethod === 'voice' ? (
              <VoiceInputRecorder onWordRecognized={handleWordRecognized} />
            ) : (
              <div className="custom-word-form simplified">
                <div className="form-group">
                  <label htmlFor="word-input">Word:</label>
                  <input 
                    id="word-input"
                    type="text" 
                    value={currentWord}
                    onChange={(e) => setCurrentWord(e.target.value)}
                    placeholder="Enter a word"
                  />
                </div>

                {error && <div className="form-error">{error}</div>}

                <button 
                  className="add-word-button"
                  onClick={handleAddTypedWord}
                  disabled={isAnalyzing || !currentWord.trim()}
                >
                  {isAnalyzing ? 'Analyzing...' : 'Add Word'}
                </button>
                
                {isAnalyzing && (
                  <div className="analyzing-indicator">
                    <p>AI is analyzing the word...</p>
                    <div className="analyzing-spinner"></div>
                  </div>
                )}
                
                <div className="auto-analysis-note">
                  <p>
                    <span role="img" aria-label="AI">🤖</span> The AI will automatically:
                  </p>
                  <ul>
                    <li>Determine the appropriate category</li>
                    <li>Break the word into syllables</li>
                    <li>Count the syllables</li>
                    <li>Use AI voice for pronunciation</li>
                  </ul>
                </div>
              </div>
            )}

            <div className="custom-words-list">
              <h3>Words Added ({words.length})</h3>
              {words.length === 0 ? (
                <p className="no-words-message">No custom words added yet</p>
              ) : (
                <ul>
                  {words.map((word, index) => (
                    <li key={index} className="word-item">
                      <div className="word-info">
                        <span className="word-text">{word.word}</span>
                        <div className="word-details">
                          <span className="word-category">{word.category}</span>
                          {word.syllableBreakdown && (
                            <span className="word-breakdown">{word.syllableBreakdown}</span>
                          )}
                          {word.syllableCount && (
                            <span className="word-count">{word.syllableCount} syllables</span>
                          )}
                          {word.usesCustomAudio ? (
                            <span className="word-audio-badge teacher">Teacher Audio</span>
                          ) : (
                            <span className="word-audio-badge ai">AI Voice</span>
                          )}
                        </div>
                      </div>
                      <button 
                        className="remove-word-button"
                        onClick={() => handleRemoveWord(index)}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="modal-actions">
              <button 
                className="cancel-button"
                onClick={onClose}
              >
                Cancel
              </button>
              <button 
                className="save-button"
                onClick={handleSaveWords}
                disabled={words.length === 0}
              >
                Save Words
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CustomWordModal;