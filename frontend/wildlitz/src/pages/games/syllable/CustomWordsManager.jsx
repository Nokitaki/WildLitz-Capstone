// CustomWordsManager.jsx - Separate component for managing custom word priority list
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import styles from '../../../styles/games/syllable/CustomWordsManager.module.css';
import { API_ENDPOINTS } from '../../../config/api';

const CustomWordsManager = ({ 
  customWords, 
  setCustomWords, 
  onClose 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  
  // Ref to store the timeout ID for debouncing
  const searchTimeoutRef = useRef(null);

  // Search database for words
  const handleSearch = async (term) => {
    if (!term.trim()) {
      setSearchResults([]);
      setSearchError('');
      return;
    }

    setIsSearching(true);
    setSearchError('');

    try {
      const response = await axios.get(
        `${API_ENDPOINTS.SYLLABIFICATION}/search-words/`,
        {
          params: {
            q: term,
            page: 1
          }
        }
      );

      setSearchResults(response.data.results || []);
      
      if (response.data.results.length === 0) {
        setSearchError('No words found matching your search');
      }
    } catch (error) {
      console.error('Error searching words:', error);
      setSearchError('Failed to search. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Real-time search effect with debouncing
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for search (500ms delay)
    searchTimeoutRef.current = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        handleSearch(searchTerm);
      } else if (searchTerm.trim().length === 0) {
        setSearchResults([]);
        setSearchError('');
      }
    }, 500);

    // Cleanup function
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Handle search term change
  const handleSearchTermChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Add word to custom words priority list
  const addToCustomWords = (word) => {
    // Check if word already in custom words list
    const alreadyAdded = customWords.some(cw => cw.id === word.id);
    
    if (alreadyAdded) {
      alert('This word is already in your custom words list!');
      return;
    }

    // Add to custom words list
    setCustomWords(prev => [...prev, word]);
    
    // Remove from search results to show it's been added
    setSearchResults(prev => prev.filter(w => w.id !== word.id));
  };

  // Remove word from custom words priority list
  const removeFromCustomWords = (wordId) => {
    setCustomWords(prev => prev.filter(word => word.id !== wordId));
  };

  // Clear all custom words
  const clearAllCustomWords = () => {
    if (!window.confirm('Remove all custom words from priority list? This will not delete them from the database.')) {
      return;
    }
    
    setCustomWords([]);
    setSearchResults([]); // Clear search to refresh
    setSearchTerm('');
  };

  return (
    <div className={styles.managerContainer}>
      <div className={styles.header}>
        <h2>🎯 Manage Custom Words Priority</h2>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
      </div>

      <div className={styles.explanation}>
        <p>
          <strong>Custom Words</strong> are prioritized at the start of the game. 
          Search the database below and add words you want to prioritize.
        </p>
      </div>

      {/* Search Section */}
      <div className={styles.searchSection}>
        <h3>🔍 Search Database (Real-Time)</h3>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Type to search (e.g., 'banana', 'elephant')..."
            value={searchTerm}
            onChange={handleSearchTermChange}
            className={styles.searchInput}
          />
          {isSearching && (
            <div className={styles.searchingIndicator}>
              <span className={styles.spinner}>⏳</span>
              Searching...
            </div>
          )}
          {searchTerm.trim().length > 0 && searchTerm.trim().length < 2 && (
            <div className={styles.searchHint}>
              Type at least 2 characters to search
            </div>
          )}
        </div>

        {searchError && (
          <div className={styles.errorMessage}>{searchError}</div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className={styles.searchResults}>
            <h4>Search Results ({searchResults.length})</h4>
            <div className={styles.resultsList}>
              {searchResults.map((word) => (
                <motion.div
                  key={word.id}
                  className={styles.resultItem}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className={styles.wordInfo}>
                    <span className={styles.wordText}>{word.word}</span>
                    <span className={styles.syllableText}>
                      {word.syllable_breakdown} ({word.syllable_count} syllables)
                    </span>
                    <span className={styles.categoryBadge}>{word.category}</span>
                  </div>
                  <button
                    onClick={() => addToCustomWords(word)}
                    className={styles.addBtn}
                    title="Add to priority list"
                  >
                    ➕ Add
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Custom Words Priority List */}
      <div className={styles.prioritySection}>
        <div className={styles.priorityHeader}>
          <h3>⭐ Custom Words Priority List ({customWords.length})</h3>
          {customWords.length > 0 && (
            <button
              onClick={clearAllCustomWords}
              className={styles.clearAllBtn}
            >
              🗑️ Clear All
            </button>
          )}
        </div>

        {customWords.length === 0 ? (
          <div className={styles.emptyState}>
            <p>📝 No custom words added yet</p>
            <p className={styles.emptyHint}>
              Search for words above and add them to prioritize them in the game!
            </p>
          </div>
        ) : (
          <div className={styles.priorityList}>
            {customWords.map((word, index) => (
              <motion.div
                key={word.id}
                className={styles.priorityItem}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                layout
              >
                <div className={styles.priorityNumber}>#{index + 1}</div>
                <div className={styles.wordDetails}>
                  <div className={styles.wordMain}>
                    <span className={styles.wordName}>{word.word}</span>
                    <span className={styles.wordCategory}>{word.category}</span>
                  </div>
                  <div className={styles.wordMeta}>
                    <span>{word.syllable_breakdown}</span>
                    <span className={styles.syllableCount}>
                      {word.syllable_count} syllable{word.syllable_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => removeFromCustomWords(word.id)}
                  className={styles.removeBtn}
                  title="Remove from priority list"
                >
                  ✕
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <button onClick={onClose} className={styles.doneBtn}>
          ✅ Done
        </button>
      </div>
    </div>
  );
};

export default CustomWordsManager;