// Update the categories to match the database exactly
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../../styles/games/syllable/SyllableConfigScreen.module.css';

const SyllableConfigScreen = ({ onStartGame }) => {
  // State management
  const [difficulty, setDifficulty] = useState('easy');
  const [questionCount, setQuestionCount] = useState(10);
  const [selectedCategories, setSelectedCategories] = useState({
    animals: true,
    fruits: false,
    food: true,
    toys: true,
    clothes: false,
    schoolSupplies: true,
    nature: true,
  });
  const [showCustomWordModal, setShowCustomWordModal] = useState(false);
  const [customWords, setCustomWords] = useState([]);
  const [newCustomWord, setNewCustomWord] = useState({ 
    word: '', 
    category: 'Custom Words',
  });
  const [audioRecording, setAudioRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  // Load saved custom words from localStorage when component mounts
  useEffect(() => {
    const savedWords = localStorage.getItem('wildlitz_custom_words');
    if (savedWords) {
      try {
        setCustomWords(JSON.parse(savedWords));
      } catch (error) {
        console.error("Error loading saved custom words:", error);
      }
    }
  }, []);

  // IMPORTANT: Make sure these category IDs and names match exactly with your database
  const categories = [
    { id: 'animals', name: 'Animals', icon: '🦁' },
    { id: 'fruits', name: 'Fruits', icon: '🍎' },
    { id: 'food', name: 'Food', icon: '🍕' },
    { id: 'toys', name: 'Toys', icon: '🧸' },
    { id: 'clothes', name: 'Clothes', icon: '👕' },
    { id: 'schoolSupplies', name: 'School Supplies', icon: '✏️' },
    { id: 'nature', name: 'Nature', icon: '🌿' },
  ];

  const difficultyInfo = {
    easy: { emoji: '😊', text: '1-2 syllables', color: '#4caf50' },
    medium: { emoji: '🤔', text: '2-3 syllables', color: '#ff9800' },
    hard: { emoji: '🧠', text: '3+ syllables', color: '#f44336' }
  };

  // Toggle category selection
  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Select random categories
  const selectRandomCategories = () => {
    const newCategories = {};
    categories.forEach(category => {
      newCategories[category.id] = Math.random() > 0.5;
    });
    
    // Ensure at least one category is selected
    if (!Object.values(newCategories).some(value => value)) {
      const randomIndex = Math.floor(Math.random() * categories.length);
      newCategories[categories[randomIndex].id] = true;
    }
    
    setSelectedCategories(newCategories);
  };

  // Calculate syllable count automatically based on hyphens
  const calculateSyllableCount = (breakdown) => {
    if (!breakdown || !breakdown.includes('-')) return 1;
    return breakdown.split('-').length;
  };

  // Update syllable breakdown and automatically calculate count
  const updateSyllableBreakdown = (value) => {
    const count = calculateSyllableCount(value);
    setNewCustomWord(prev => ({
      ...prev, 
      syllableBreakdown: value,
      syllableCount: count
    }));
  };

  // Add a custom word
  const addCustomWord = () => {
    if (newCustomWord.word.trim() === '') return;

    const wordToAdd = {
      ...newCustomWord,
      id: Date.now(), // Add unique ID
    };

    const updatedWords = [...customWords, wordToAdd];
    setCustomWords(updatedWords);
    
    // Save to localStorage
    try {
      localStorage.setItem('wildlitz_custom_words', JSON.stringify(updatedWords));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
    
    // Reset form
    setNewCustomWord({ 
      word: '', 
      category: 'Custom Words',
    });
  };

  // Delete a custom word
  const deleteCustomWord = (id) => {
    const updatedWords = customWords.filter(word => word.id !== id);
    setCustomWords(updatedWords);
    
    try {
      localStorage.setItem('wildlitz_custom_words', JSON.stringify(updatedWords));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  };

  // Start the game with selected settings
  const handleStartGame = () => {
    // Get selected category names - make sure they match database categories exactly
    const categoryNames = Object.entries(selectedCategories)
      .filter(([_, isSelected]) => isSelected)
      .map(([id, _]) => {
        const category = categories.find(cat => cat.id === id);
        
        // Use the exact category name - this must match your database
        return category ? category.name : '';
      })
      .filter(name => name !== '');
      
    // Validate - ensure we have categories or custom words
    if (categoryNames.length === 0 && customWords.length === 0) {
      alert("Please select at least one category or add custom words");
      return;
    }

    console.log("Starting game with categories:", categoryNames);

    // Pass game configuration to parent
    onStartGame({
      difficulty,
      questionCount,
      categories: categoryNames,
      customWords
    });
  };

  return (
    <div className={styles.fixedContainer}>
      <div className={styles.gameCard}>
        <div className={styles.header}>
          <h1>WildLitz Syllable Clapping</h1>
          <p>Let's set up your practice session!</p>
        </div>

        <div className={styles.contentWrapper}>
          {/* DIFFICULTY SECTION */}
          <div className={styles.section}>
            <h2>Difficulty Level</h2>
            <div className={styles.difficultyButtons}>
              {Object.entries(difficultyInfo).map(([level, info]) => (
                <motion.button
                  key={level}
                  className={`${styles.difficultyBtn} ${difficulty === level ? styles.active : ''}`}
                  whileHover={{ scale: 1.03, boxShadow: "0 6px 10px rgba(0,0,0,0.15)" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setDifficulty(level)}
                  style={difficulty === level ? { 
                    backgroundColor: info.color,
                    borderColor: info.color
                  } : {}}
                >
                  <span>{info.emoji}</span>
                  <div className={styles.difficultyLabel}>
                    <span className={styles.difficultyName}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </span>
                    <span className={styles.difficultySyllables}>
                      {info.text}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* CATEGORIES SECTION */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Word Categories</h2>
              <motion.button
                className={styles.randomBtn}
                whileHover={{ scale: 1.05, boxShadow: "0 4px 8px rgba(255,179,71,0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={selectRandomCategories}
              >
                <span className={styles.diceIcon}>🎲</span>
                Random Mix
              </motion.button>
            </div>
            
            <div className={styles.categoriesGrid}>
              {categories.map(category => (
                <motion.div
                  key={category.id}
                  className={`${styles.categoryCard} ${selectedCategories[category.id] ? styles.selected : ''}`}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => toggleCategory(category.id)}
                >
                  <input 
                    type="checkbox" 
                    id={`category-${category.id}`}
                    checked={selectedCategories[category.id]} 
                    onChange={() => toggleCategory(category.id)}
                    onClick={e => e.stopPropagation()}
                  />
                  <span className={styles.categoryIcon}>{category.icon}</span>
                  <span className={styles.categoryName}>{category.name}</span>
                </motion.div>
              ))}
              
              <motion.div
                className={styles.addCustomBtn}
                whileHover={{ scale: 1.03, boxShadow: "0 4px 8px rgba(255,179,71,0.3)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowCustomWordModal(true)}
              >
                <span className={styles.customIcon}>✏️</span>
                <div className={styles.customLabel}>
                  <div className={styles.customLabelFlex}>
                    <span>Custom Words </span>
                    {customWords.length > 0 && (
                      <span className={styles.customCount}>{customWords.length}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* QUESTION COUNT SECTION */}
          <div className={styles.section}>
            <h2>Number of Questions</h2>
            <div className={styles.sliderContainer}>
              <input
                type="range"
                min="5"
                max="20"
                step="1"
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                className={styles.slider}
                style={{
                  background: `linear-gradient(to right, 
                    ${difficultyInfo[difficulty].color} 0%, 
                    ${difficultyInfo[difficulty].color} ${(questionCount-5)/15*100}%, 
                    #ddd ${(questionCount-5)/15*100}%, 
                    #ddd 100%)`
                }}
              />
              <div className={styles.sliderLabels}>
                <span>5</span>
                <span 
                  className={styles.currentValue} 
                  style={{backgroundColor: difficultyInfo[difficulty].color}}
                >
                  {questionCount}
                </span>
                <span>20</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.gameFooter}>
          <motion.button
            className={styles.startButton}
            whileHover={{ scale: 1.03, boxShadow: "0 8px 15px rgba(106,90,205,0.4)" }}
            whileTap={{ scale: 0.97 }}
            onClick={handleStartGame}
            style={{backgroundColor: difficultyInfo[difficulty].color}}
          >
            Start Game
          </motion.button>

          {customWords.length > 0 && (
            <div className={styles.customWordsSummary}>
              <span className={styles.customWordsIcon}>📚</span>
              <span>{customWords.length} custom word{customWords.length !== 1 ? 's' : ''} added</span>
            </div>
          )}
        </div>
      </div>

      {/* CUSTOM WORD MODAL */}
      <AnimatePresence>
        {showCustomWordModal && (
          <div className={styles.modalOverlay}>
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className={styles.modalHeader}>
                <h2>Custom Words</h2>
                <motion.button 
                  className={styles.closeButton}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowCustomWordModal(false)}
                >
                  ✕
                </motion.button>
              </div>
              
              <p>Add your own words for syllable clapping practice!</p>

              <div className={styles.wordForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="custom-word">Word</label>
                  <input
                    id="custom-word"
                    type="text"
                    value={newCustomWord.word}
                    onChange={(e) => setNewCustomWord({...newCustomWord, word: e.target.value})}
                    placeholder="Enter a word"
                    className={styles.wordInput}
                  />
                </div>

                <motion.button
                  className={styles.addWordButton}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={addCustomWord}
                  disabled={!newCustomWord.word.trim()}
                >
                  <span>+</span>
                  Add Word
                </motion.button>
              </div>

              {/* Custom Words List */}
              {customWords.length > 0 && (
                <div className={styles.customWordsContainer}>
                  <h3>Your Custom Words ({customWords.length})</h3>
                  <div className={styles.customList}>
                    {customWords.map((word, index) => (
                      <motion.div 
                        key={word.id || index}
                        className={styles.wordItem}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className={styles.wordItemContent}>
                          <div className={styles.wordItemHeader}>
                            <span className={styles.wordText}>{word.word}</span>
                          </div>
                        </div>
                        
                        <motion.button
                          className={styles.deleteButton}
                          whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 77, 77, 0.2)" }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => deleteCustomWord(word.id || index)}
                        >
                          ✕
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.modalActions}>
                <motion.button
                  className={styles.clearButton}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    if (window.confirm("Are you sure you want to clear all custom words?")) {
                      setCustomWords([]);
                      localStorage.removeItem('wildlitz_custom_words');
                    }
                  }}
                  disabled={customWords.length === 0}
                >
                  Clear All
                </motion.button>
                <motion.button
                  className={styles.saveButton}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowCustomWordModal(false)}
                >
                  Save & Close
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SyllableConfigScreen;