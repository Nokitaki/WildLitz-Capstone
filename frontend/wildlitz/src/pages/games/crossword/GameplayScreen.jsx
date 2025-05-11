// src/pages/games/crossword/GameplayScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from '../../../styles/games/crossword/GameplayScreen.module.css';

/**
 * GameplayScreen component for Crossword Puzzle
 * Shows the crossword grid, clues, and input field
 */
const GameplayScreen = ({ puzzle, theme, onWordSolved, solvedWords, timeFormatted }) => {
  // Current state
  const [currentInput, setCurrentInput] = useState('');
  const [selectedClue, setSelectedClue] = useState(null);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [showHint, setShowHint] = useState(false);
  const [lastAnswer, setLastAnswer] = useState({
    word: '',
    correct: false
  });
  const [gridState, setGridState] = useState([]);
  
  // References
  const inputRef = useRef(null);
  
  // Initialize grid state when puzzle changes
  useEffect(() => {
    if (puzzle && puzzle.grid) {
      // Create a copy of the grid with visibility state for each cell
      const initialGridState = puzzle.grid.map(cell => ({
        ...cell,
        revealed: false
      }));
      
      // Mark cells of already solved words as revealed
      if (solvedWords.length > 0) {
        // Find all cells that belong to solved words
        let revealedCells = [];
        puzzle.words.forEach(word => {
          if (isWordSolved(word.answer)) {
            word.cells.forEach(cell => {
              revealedCells.push(`${cell.row}-${cell.col}`);
            });
          }
        });
        
        // Update the grid state
        const updatedGridState = initialGridState.map((cell, index) => {
          const row = Math.floor(index / puzzle.size.width);
          const col = index % puzzle.size.width;
          const cellKey = `${row}-${col}`;
          
          return {
            ...cell,
            revealed: revealedCells.includes(cellKey)
          };
        });
        
        setGridState(updatedGridState);
      } else {
        setGridState(initialGridState);
      }
    }
  }, [puzzle, solvedWords]);

  // Set initial selected clue on component mount
  useEffect(() => {
    if (puzzle && puzzle.words && puzzle.words.length > 0 && !selectedClue) {
      // Auto-select the first across clue
      const firstAcrossClue = puzzle.words.find(word => word.direction === 'across');
      if (firstAcrossClue) {
        setSelectedClue(firstAcrossClue);
      }
    }
  }, [puzzle]);
  
  // Focus input field when a clue is selected
  useEffect(() => {
    if (selectedClue && inputRef.current) {
      inputRef.current.focus();
      
      // Pre-fill input with letters from crossing solved words
      if (selectedClue.cells && selectedClue.cells.length > 0) {
        let prefill = '';
        for (let i = 0; i < selectedClue.answer.length; i++) {
          const cell = selectedClue.cells[i];
          const cellIndex = cell.row * puzzle.size.width + cell.col;
          
          if (gridState[cellIndex] && gridState[cellIndex].revealed) {
            prefill += gridState[cellIndex].value;
          } else {
            prefill += '_';
          }
        }
        
        // Only set prefill if it contains at least one letter
        if (prefill.replace(/_/g, '').length > 0) {
          setCurrentInput(prefill);
        } else {
          setCurrentInput('');
        }
      } else {
        setCurrentInput('');
      }
    }
  }, [selectedClue, gridState]);
  
  // Check if a word has been solved
  const isWordSolved = (word) => {
    return solvedWords.some(solved => 
      solved.word.toLowerCase() === word.toLowerCase()
    );
  };
  
  // Handle clue selection
  const handleSelectClue = (clue) => {
    // If already selected, deselect it
    if (selectedClue && selectedClue.number === clue.number && selectedClue.direction === clue.direction) {
      setSelectedClue(null);
      setCurrentInput('');
      return;
    }
    
    setSelectedClue(clue);
  };
  
  // Handle input change
  const handleInputChange = (e) => {
    let value = e.target.value.toUpperCase();
    
    if (!selectedClue) return;
    
    // Process the input
    const processedInput = processInput(value);
    setCurrentInput(processedInput);
  };
  
  // Process the input to handle existing letters from crossing words
  const processInput = (input) => {
    if (!selectedClue || !selectedClue.cells) return input;
    
    let result = '';
    const answerLength = selectedClue.answer.length;
    
    // Ensure input is not longer than the answer length
    input = input.slice(0, answerLength);
    
    // Create an array of characters representing the current grid state for this word
    let currentWordState = Array(answerLength).fill('_');
    
    // Fill in letters from crossing words
    selectedClue.cells.forEach((cell, index) => {
      const cellIndex = cell.row * puzzle.size.width + cell.col;
      
      if (gridState[cellIndex] && gridState[cellIndex].revealed) {
        currentWordState[index] = gridState[cellIndex].value;
      }
    });
    
    // Fill in user input, preserving letters from crossing words
    let inputIndex = 0;
    for (let i = 0; i < answerLength; i++) {
      if (currentWordState[i] !== '_') {
        // This is a revealed letter from a crossing word
        result += currentWordState[i];
      } else if (inputIndex < input.length) {
        // This is a position for user input
        result += input[inputIndex];
        inputIndex++;
      } else {
        // No input for this position
        result += '_';
      }
    }
    
    return result;
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedClue) return;
    
    // Replace underscores with spaces for checking
    const answer = currentInput.replace(/_/g, '').trim().toUpperCase();
    const correctAnswer = selectedClue.answer.toUpperCase();
    
    if (answer === correctAnswer) {
      // Correct answer
      setLastAnswer({
        word: correctAnswer,
        correct: true
      });
      
      // Update grid state to reveal the word
      const updatedGridState = [...gridState];
      selectedClue.cells.forEach((cell, index) => {
        const cellIndex = cell.row * puzzle.size.width + cell.col;
        updatedGridState[cellIndex] = {
          ...updatedGridState[cellIndex],
          revealed: true
        };
      });
      
      setGridState(updatedGridState);
      
      // Mark word as solved
      onWordSolved(
        correctAnswer,
        selectedClue.definition || "No definition available",
        selectedClue.example || `The ${correctAnswer.toLowerCase()} is an interesting word.`
      );
      
      // Reset
      setSelectedClue(null);
      setCurrentInput('');

      // Auto-select the next unsolved clue
      const nextClue = findNextUnsolved();
      if (nextClue) {
        setTimeout(() => {
          setSelectedClue(nextClue);
        }, 300);
      }
    } else {
      // Incorrect answer
      setLastAnswer({
        word: answer,
        correct: false
      });
    }
  };

  // Find the next unsolved clue
  const findNextUnsolved = () => {
    if (!puzzle || !puzzle.words) return null;

    // First, try to find the next unsolved across clue
    const acrossClues = puzzle.words.filter(word => word.direction === 'across');
    const unsolvedAcross = acrossClues.filter(clue => !isWordSolved(clue.answer));
    
    if (unsolvedAcross.length > 0) {
      return unsolvedAcross[0];
    }

    // If no unsolved across clues, look for unsolved down clues
    const downClues = puzzle.words.filter(word => word.direction === 'down');
    const unsolvedDown = downClues.filter(clue => !isWordSolved(clue.answer));
    
    if (unsolvedDown.length > 0) {
      return unsolvedDown[0];
    }

    return null;
  };
  
  // Use a hint
  const handleUseHint = () => {
    if (hintsRemaining > 0 && selectedClue) {
      setHintsRemaining(prev => prev - 1);
      setShowHint(true);
      
      // Hide hint after 3 seconds
      setTimeout(() => {
        setShowHint(false);
      }, 3000);
    }
  };
  
  // Get hint content
  const getHintContent = () => {
    if (!selectedClue) return '';
    
    const { answer } = selectedClue;
    
    // Reveal the first letter of the word if it's not already filled
    return `The word starts with "${answer[0]}"`;
  };
  
  // Handle cell click in the grid
  const handleCellClick = (row, col) => {
    // Find the word that this cell belongs to
    const clickedWord = puzzle.words.find(word => 
      word.cells.some(cell => cell.row === row && cell.col === col)
    );
    
    if (clickedWord) {
      handleSelectClue(clickedWord);
    }
  };

  // Handle show answer (teacher action)
  const handleShowAnswer = () => {
    if (!selectedClue) return;
    
    // Set input to the correct answer
    setCurrentInput(selectedClue.answer.toUpperCase());
  };
  
  // Render crossword grid
  const renderCrosswordGrid = () => {
    if (!puzzle || !puzzle.size || !gridState.length) return null;
    
    const { size } = puzzle;
    
    return (
      <div 
        className={styles.crosswordGrid}
        style={{ 
          gridTemplateColumns: `repeat(${size.width}, 1fr)`,
          gridTemplateRows: `repeat(${size.height}, 1fr)`
        }}
      >
        {gridState.map((cell, index) => {
          const row = Math.floor(index / size.width);
          const col = index % size.width;
          
          // Skip empty cells
          if (cell.value === null) {
            return (
              <div 
                key={`${row}-${col}`} 
                className={styles.emptyCell}
              />
            );
          }
          
          // Find if this cell belongs to the selected clue
          const isSelected = selectedClue && 
            selectedClue.cells && selectedClue.cells.some(c => c.row === row && c.col === col);
          
          // Find if this cell is revealed (part of a solved word)
          const isRevealed = cell.revealed;
          
          // Find if this is a highlighted cell (current clue)
          const isHighlighted = selectedClue && 
            selectedClue.cells && selectedClue.cells.some(c => c.row === row && c.col === col);
            
          // Is this cell being focused on as the current letter to guess?
          const isFocused = selectedClue && selectedClue.cells && selectedClue.cells.some((c, idx) => {
            if (c.row === row && c.col === col) {
              // Find the index of this cell in the selected clue
              const charIndex = idx;
              // Check if this position in the input is empty or underscored
              return currentInput.length <= charIndex || currentInput[charIndex] === '_';
            }
            return false;
          });
          
          return (
            <div 
              key={`${row}-${col}`} 
              className={`
                ${styles.cell} 
                ${isSelected ? styles.selectedCell : ''} 
                ${isRevealed ? styles.solvedCell : ''} 
                ${isHighlighted ? styles.highlightedCell : ''}
                ${isFocused ? styles.focusedCell : ''}
              `}
              onClick={() => handleCellClick(row, col)}
            >
              {cell.number && <span className={styles.cellNumber}>{cell.number}</span>}
              <span className={styles.cellValue}>
                {isRevealed ? cell.value : ''}
                {isFocused && !isRevealed ? '?' : ''}
              </span>
            </div>
          );
        })}
      </div>
    );
  };
  
  // Render clues section
  const renderCluesSection = () => {
    if (!puzzle || !puzzle.words) return null;
    
    // Separate across and down clues
    const acrossClues = puzzle.words.filter(word => word.direction === 'across');
    const downClues = puzzle.words.filter(word => word.direction === 'down');
    
    return (
      <div className={styles.cluesSection}>
        <h2 className={styles.cluesTitle}>Clues:</h2>
        
        <div className={styles.cluesList}>
          <h3 className={styles.cluesCategoryTitle}>Across:</h3>
          <ul className={styles.cluesSublist}>
            {acrossClues.map(clue => (
              <li 
                key={`across-${clue.number}`}
                className={`
                  ${styles.clueItem} 
                  ${selectedClue && selectedClue.number === clue.number && selectedClue.direction === clue.direction ? styles.selectedClue : ''} 
                  ${isWordSolved(clue.answer) ? styles.solvedClue : ''}
                `}
                onClick={() => handleSelectClue(clue)}
              >
                {clue.number}. {clue.clue}
              </li>
            ))}
          </ul>
          
          <h3 className={styles.cluesCategoryTitle}>Down:</h3>
          <ul className={styles.cluesSublist}>
            {downClues.map(clue => (
              <li 
                key={`down-${clue.number}`}
                className={`
                  ${styles.clueItem} 
                  ${selectedClue && selectedClue.number === clue.number && selectedClue.direction === clue.direction ? styles.selectedClue : ''} 
                  ${isWordSolved(clue.answer) ? styles.solvedClue : ''}
                `}
                onClick={() => handleSelectClue(clue)}
              >
                {clue.number}. {clue.clue}
              </li>
            ))}
          </ul>
        </div>
        
        <motion.button
          className={styles.hintButton}
          onClick={handleUseHint}
          disabled={hintsRemaining <= 0 || !selectedClue}
          whileHover={{ scale: hintsRemaining > 0 && selectedClue ? 1.05 : 1 }}
          whileTap={{ scale: hintsRemaining > 0 && selectedClue ? 0.95 : 1 }}
        >
          Use a Hint ({hintsRemaining} left)
        </motion.button>
      </div>
    );
  };
  
  return (
    <div className={styles.gameplayContainer}>
      <div className={styles.gameplayCard}>
        {/* Header with theme and timer */}
        <div className={styles.gameHeader}>
          <span className={styles.themeLabel}>Theme: {theme.charAt(0).toUpperCase() + theme.slice(1)}</span>
          <span className={styles.timer}>{timeFormatted}</span>
        </div>
        
        {/* Main game layout */}
        <div className={styles.gameLayout}>
          {/* Left column - Teams/Scores (removed as per request) */}
          
          {/* Center column - Crossword Grid */}
          <div className={styles.centerColumn}>
            {renderCrosswordGrid()}
            
            <div className={styles.inputSection}>
              <div className={styles.currentWordLabel}>
                Current Word:
              </div>
              <form onSubmit={handleSubmit} className={styles.inputForm}>
                <input
                  ref={inputRef}
                  type="text"
                  value={currentInput}
                  onChange={handleInputChange}
                  className={styles.wordInput}
                  placeholder={selectedClue ? `${selectedClue.answer.length} letters` : 'Select a clue'}
                />
                <motion.button
                  type="submit"
                  className={styles.submitButton}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  SUBMIT
                </motion.button>
              </form>
            </div>
          </div>
          
          {/* Right column - Clues */}
          <div className={styles.rightColumn}>
            {renderCluesSection()}
          </div>
        </div>
        
        {/* Hint popup */}
        {showHint && (
          <motion.div
            className={styles.hintPopup}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className={styles.hintContent}>
              <span className={styles.hintIcon}>💡</span>
              <span className={styles.hintText}>{getHintContent()}</span>
            </div>
          </motion.div>
        )}
        
      </div>
    </div>
  );
};

export default GameplayScreen;