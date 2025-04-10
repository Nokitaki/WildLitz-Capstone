// Create a new file: src/components/modals/CustomWordModal.jsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../../styles/custom_word_modal.css';

const CustomWordModal = ({ isOpen, onClose, onSave, existingWords = [] }) => {
  const [words, setWords] = useState([]);
  const [currentWord, setCurrentWord] = useState('');
  const [syllableBreakdown, setSyllableBreakdown] = useState('');
  const [syllableCount, setSyllableCount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Animals');
  const [error, setError] = useState('');

  // Initialize words from existing words if provided
  useEffect(() => {
    if (existingWords.length > 0) {
      setWords(existingWords);
    }
  }, [existingWords]);

  const categories = [
    'Animals',
    'Colors',
    'Food Items',
    'Action Words',
    'Places',
    'Feelings',
    'Common Objects',
    'Numbers',
    'Other'
  ];

  // Function to add a new word
  const handleAddWord = () => {
    // Validate input
    if (!currentWord.trim()) {
      setError('Please enter a word');
      return;
    }

    // Calculate syllable count if not provided but breakdown is
    let count = syllableCount ? parseInt(syllableCount, 10) : 0;
    if (!count && syllableBreakdown) {
      count = syllableBreakdown.split('-').length;
    }
    
    // Add word to list
    const newWord = {
      word: currentWord.trim(),
      syllableBreakdown: syllableBreakdown.trim(),
      syllableCount: count || null,
      category: selectedCategory
    };

    setWords([...words, newWord]);
    
    // Reset form
    setCurrentWord('');
    setSyllableBreakdown('');
    setSyllableCount('');
    setError('');
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

  // Function to auto-generate syllable breakdown (very basic implementation)
  const handleAutoBreakdown = () => {
    if (!currentWord.trim()) {
      setError('Please enter a word first');
      return;
    }

    // A very simple syllable separator - in a real app you would use a proper library
    // or call to your backend service
    const vowels = ['a', 'e', 'i', 'o', 'u', 'y'];
    const word = currentWord.toLowerCase();
    let breakdown = '';
    let inVowelGroup = false;

    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      
      if (i > 0 && isVowel && !inVowelGroup) {
        // Start of a new syllable
        if (i < word.length - 1 && breakdown.length > 0) {
          breakdown += '-';
        }
      }
      
      breakdown += word[i];
      inVowelGroup = isVowel;
    }

    // This is a very basic implementation and won't be accurate for many words
    setSyllableBreakdown(breakdown);
    
    // Estimate syllable count - count '-' plus 1
    const count = (breakdown.match(/-/g) || []).length + 1;
    setSyllableCount(count.toString());
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
              Add your own words for the syllable clapping game. Optionally provide syllable breakdown.
            </p>

            <div className="custom-word-form">
              <div className="form-row">
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

                <div className="form-group">
                  <label htmlFor="category-select">Category:</label>
                  <select
                    id="category-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="syllable-breakdown">
                    Syllable Breakdown:
                    <button 
                      className="auto-breakdown-button" 
                      onClick={handleAutoBreakdown}
                      type="button"
                    >
                      Auto
                    </button>
                  </label>
                  <input 
                    id="syllable-breakdown"
                    type="text" 
                    value={syllableBreakdown}
                    onChange={(e) => setSyllableBreakdown(e.target.value)}
                    placeholder="e.g., el-e-phant"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="syllable-count">Syllable Count:</label>
                  <input 
                    id="syllable-count"
                    type="number" 
                    value={syllableCount}
                    onChange={(e) => setSyllableCount(e.target.value)}
                    placeholder="e.g., 3"
                    min="1"
                    max="10"
                  />
                </div>
              </div>

              {error && <div className="form-error">{error}</div>}

              <button 
                className="add-word-button"
                onClick={handleAddWord}
              >
                Add Word
              </button>
            </div>

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