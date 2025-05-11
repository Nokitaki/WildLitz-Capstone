// src/pages/games/crossword/GameplayScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from '../../../styles/games/crossword/GameplayScreen.module.css';

/**
 * Gameplay screen component for the Crossword Game
 */
const GameplayScreen = ({ grid, clues, theme, timer, onWordSolved, solvedWords, puzzleData }) => {
  // Cell selection state
  const [selectedCell, setSelectedCell] = useState({ row: -1, col: -1 });
  const [focusedDirection, setFocusedDirection] = useState('across');
  const [highlightedCells, setHighlightedCells] = useState([]);
  const [currentWord, setCurrentWord] = useState(null);
  
  // User input state
  const [userInputGrid, setUserInputGrid] = useState([]);
  
  // Hints and feedback
  const [showHint, setShowHint] = useState(false);
  const [hintContent, setHintContent] = useState('');
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  
  // Refs
  const gridRef = useRef(null);
  const inputRef = useRef(null);
  
  // Initialize user input grid
  useEffect(() => {
    if (grid) {
      const height = grid.length;
      const width = grid[0].length;
      
      const newUserGrid = Array(height).fill().map(() => 
        Array(width).fill(null)
      );
      
      setUserInputGrid(newUserGrid);
    }
  }, [grid]);
  
  // Handle keyboard events for navigation and input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedCell.row < 0 || selectedCell.col < 0) return;
      
      // Get current position
      const { row, col } = selectedCell;
      
      if (e.key === 'ArrowRight') {
        moveToNextCell(row, col, 'right');
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        moveToNextCell(row, col, 'left');
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        moveToNextCell(row, col, 'down');
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        moveToNextCell(row, col, 'up');
        e.preventDefault();
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleCellClear(row, col);
        e.preventDefault();
      } else if (e.key === 'Tab') {
        toggleDirection();
        e.preventDefault();
      } else if (e.key === ' ') {
        toggleDirection();
        e.preventDefault();
      } else if (e.key.length === 1 && e.key.match(/[a-zA-Z]/)) {
        // Handle letter input
        handleCellInput(row, col, e.key.toUpperCase());
        e.preventDefault();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedCell, focusedDirection, grid, userInputGrid]);
  
  // Find and highlight the current word when cell or direction changes
  useEffect(() => {
    if (selectedCell.row < 0 || selectedCell.col < 0 || !grid) return;
    
    const { row, col } = selectedCell;
    
    // Find the word that contains this cell in the current direction
    const wordInfo = findWordAtPosition(row, col, focusedDirection);
    
    if (wordInfo) {
      setCurrentWord(wordInfo);
      
      // Highlight cells for this word
      const cellsToHighlight = [];
      
      if (wordInfo.direction === 'across') {
        for (let c = wordInfo.startCol; c < wordInfo.startCol + wordInfo.word.length; c++) {
          cellsToHighlight.push({ row: wordInfo.startRow, col: c });
        }
      } else {
        for (let r = wordInfo.startRow; r < wordInfo.startRow + wordInfo.word.length; r++) {
          cellsToHighlight.push({ row: r, col: wordInfo.startCol });
        }
      }
      
      setHighlightedCells(cellsToHighlight);
    } else {
      setCurrentWord(null);
      setHighlightedCells([]);
    }
  }, [selectedCell, focusedDirection, grid]);
  
  /**
   * Find a word at a given position
   */
  const findWordAtPosition = (row, col, preferredDirection) => {
    // Check if this cell is part of any word
    const acrossWord = findWordInDirection(row, col, 'across');
    const downWord = findWordInDirection(row, col, 'down');
    
    if (preferredDirection === 'across' && acrossWord) {
      return acrossWord;
    } else if (preferredDirection === 'down' && downWord) {
      return downWord;
    }
    
    // Fallback to any available word
    return acrossWord || downWord;
  };
  
  /**
   * Find a word in a specific direction from a position
   */
  const findWordInDirection = (row, col, direction) => {
    if (!grid || row < 0 || col < 0 || row >= grid.length || col >= grid[0]?.length) {
      return null;
    }
    
    const cell = grid[row][col];
    if (!cell || cell.value === null) return null;
    
    // Search in the clues list
    const directionalClues = clues[direction];
    if (!directionalClues || !Array.isArray(directionalClues)) return null;
    
    for (const clue of directionalClues) {
      // Make sure the clue has the cells property and it's an array
      if (!clue.cells || !Array.isArray(clue.cells)) continue;
      
      // Check if this cell is in the word's cells
      const isPartOfWord = clue.cells.some(
        cellPos => cellPos && cellPos.row === row && cellPos.col === col
      );
      
      if (isPartOfWord) {
        // Find the starting position of the word
        const startCell = clue.cells[0];
        
        if (startCell) {
          return {
            ...clue,
            startRow: startCell.row,
            startCol: startCell.col,
            word: clue.answer
          };
        }
      }
    }
    
    return null;
  };
  
  /**
   * Move to the next cell in the given direction
   */
  const moveToNextCell = (row, col, direction) => {
    const height = grid.length;
    const width = grid[0].length;
    
    let newRow = row;
    let newCol = col;
    
    switch (direction) {
      case 'right':
        newCol = col + 1;
        break;
      case 'left':
        newCol = col - 1;
        break;
      case 'down':
        newRow = row + 1;
        break;
      case 'up':
        newRow = row - 1;
        break;
      default:
        return;
    }
    
    // Check boundaries
    if (newRow < 0 || newRow >= height || newCol < 0 || newCol >= width) {
      return;
    }
    
    // Check if target cell is valid (not empty/black)
    if (grid[newRow][newCol].value !== null) {
      setSelectedCell({ row: newRow, col: newCol });
    } else {
      // Continue in the same direction to find the next valid cell
      moveToNextCell(newRow, newCol, direction);
    }
  };
  
  /**
   * Move to the next cell in the current word
   */
  const moveToNextCellInWord = (row, col) => {
    // If we have a current word, move to the next cell in that word
    if (currentWord) {
      const { direction, startRow, startCol, word } = currentWord;
      
      // Calculate current position in the word
      let posInWord;
      if (direction === 'across') {
        posInWord = col - startCol;
      } else {
        posInWord = row - startRow;
      }
      
      // Move to next position if within word
      if (posInWord < word.length - 1) {
        if (direction === 'across') {
          setSelectedCell({ row, col: col + 1 });
        } else {
          setSelectedCell({ row: row + 1, col });
        }
      } else {
        // We're at the end of the word, try to find the next word
        const directionalClues = clues[direction];
        if (directionalClues) {
          const currentIndex = directionalClues.findIndex(c => c.number === currentWord.number);
          if (currentIndex < directionalClues.length - 1) {
            // Move to the next word in the same direction
            const nextWord = directionalClues[currentIndex + 1];
            const nextCell = nextWord.cells[0];
            setSelectedCell({ row: nextCell.row, col: nextCell.col });
          }
        }
      }
    }
  };
  
  /**
   * Toggle between across and down directions
   */
  const toggleDirection = () => {
    setFocusedDirection(prev => prev === 'across' ? 'down' : 'across');
  };
  
  /**
   * Handle cell input
   */
  const handleCellInput = (row, col, value) => {
    // Update user input grid
    const newGrid = [...userInputGrid];
    newGrid[row][col] = value;
    setUserInputGrid(newGrid);
    
    // Check if this input completes a word
    checkWordCompletion(row, col, value);
    
    // Move to next cell
    moveToNextCellInWord(row, col);
  };
  
  /**
   * Handle cell clearing (backspace/delete)
   */
  const handleCellClear = (row, col) => {
    // Clear the cell
    const newGrid = [...userInputGrid];
    
    if (newGrid[row][col]) {
      // If there's a value, clear it
      newGrid[row][col] = null;
      setUserInputGrid(newGrid);
    } else {
      // If the cell is already empty, move to the previous cell
      if (focusedDirection === 'across') {
        if (col > 0) {
          setSelectedCell({ row, col: col - 1 });
        }
      } else {
        if (row > 0) {
          setSelectedCell({ row: row - 1, col });
        }
      }
    }
  };
  
  /**
   * Check if a word is completed after a cell input
   */
  const checkWordCompletion = (row, col, value) => {
    // Check words in both directions
    const directions = ['across', 'down'];
    
    for (const direction of directions) {
      const wordInfo = findWordInDirection(row, col, direction);
      
      if (wordInfo) {
        const { cells, answer } = wordInfo;
        let isCompleted = true;
        
        // Check if all cells are filled correctly
        for (let i = 0; i < cells.length; i++) {
          const cell = cells[i];
          const userValue = userInputGrid[cell.row][cell.col] || value;
          
          // Check if the newly entered value would go in this cell
          const isCurrentCell = cell.row === row && cell.col === col;
          const cellValue = isCurrentCell ? value : userValue;
          
          if (!cellValue || cellValue !== answer[i]) {
            isCompleted = false;
            break;
          }
        }
        
        // If word is completed, notify parent
        if (isCompleted && !isWordSolved(wordInfo)) {
          onWordSolved(wordInfo);
          showWordCompletedFeedback(wordInfo);
        }
      }
    }
  };
  
  /**
   * Check if a word is already solved
   */
  const isWordSolved = (word) => {
    return solvedWords.some(w => w.number === word.number && w.direction === word.direction);
  };
  
  /**
   * Show feedback when a word is completed
   */
  const showWordCompletedFeedback = (word) => {
    setFeedbackMessage(`Great job! You completed "${word.answer}" - ${word.clue}`);
    setShowFeedback(true);
    
    // Hide feedback after 3 seconds
    setTimeout(() => {
      setShowFeedback(false);
    }, 3000);
  };
  
  /**
   * Handle cell click
   */
  const handleCellClick = (row, col) => {
    // If clicking the same cell, toggle direction
    if (selectedCell.row === row && selectedCell.col === col) {
      toggleDirection();
    } else {
      setSelectedCell({ row, col });
    }
  };
  
  /**
   * Handle clue click
   */
  const handleClueClick = (clue) => {
    // Select the first cell of the clue
    if (clue && clue.cells && clue.cells.length > 0) {
      const firstCell = clue.cells[0];
      setSelectedCell({ row: firstCell.row, col: firstCell.col });
      setFocusedDirection(clue.direction);
    }
  };
  
  /**
   * Show a hint for the current word
   */
  const showHintForCurrentWord = () => {
    if (!currentWord || hintsRemaining <= 0) return;
    
    // Reduce hints remaining
    setHintsRemaining(prev => prev - 1);
    
    // Show hint popup
    setHintContent(currentWord.definition || `Hint for ${currentWord.answer}: ${currentWord.clue}`);
    setShowHint(true);
    
    // Hide hint after 5 seconds
    setTimeout(() => {
      setShowHint(false);
    }, 5000);
  };
  
  /**
   * Get CSS class for a cell
   */
  const getCellClass = (row, col) => {
    const classes = [styles.cell];
    
    // Selected cell
    if (selectedCell.row === row && selectedCell.col === col) {
      classes.push(styles.selectedCell);
    }
    
    // Highlighted cells (current word)
    if (highlightedCells.some(cell => cell.row === row && cell.col === col)) {
      classes.push(styles.highlightedCell);
    }
    
    // Solved cells
    const cellIsSolved = solvedWords.some(word => {
      return word.cells.some(cell => cell.row === row && cell.col === col);
    });
    
    if (cellIsSolved) {
      classes.push(styles.solvedCell);
    }
    
    return classes.join(' ');
  };
  
  return (
    <div className={styles.gameplayContainer}>
      <div className={styles.gameplayCard}>
        {/* Game header */}
        <div className={styles.gameHeader}>
          <div className={styles.themeLabel}>Theme: {theme}</div>
          <div className={styles.timer}>{timer}</div>
        </div>
        
        {/* Main game layout */}
        <div className={styles.gameLayout}>
          {/* Center column - Crossword grid */}
          <div className={styles.centerColumn}>
            {grid && grid.length > 0 && grid[0] && (
              <div ref={gridRef} className={styles.crosswordGrid} style={{
                gridTemplateRows: `repeat(${grid.length}, 1fr)`,
                gridTemplateColumns: `repeat(${grid[0].length}, 1fr)`
              }}>
                {grid.map((row, rowIndex) => (
                  row.map((cell, colIndex) => (
                    <div
                      key={`cell-${rowIndex}-${colIndex}`}
                      className={cell.value === null ? styles.emptyCell : getCellClass(rowIndex, colIndex)}
                      onClick={() => cell.value !== null && handleCellClick(rowIndex, colIndex)}
                    >
                      {cell.value !== null && (
                        <>
                          {cell.number && <div className={styles.cellNumber}>{cell.number}</div>}
                          <div className={styles.cellValue}>
                            {userInputGrid[rowIndex] && userInputGrid[rowIndex][colIndex]}
                          </div>
                        </>
                      )}
                    </div>
                  ))
                ))}
              </div>
            )}
            
            {(!grid || grid.length === 0) && (
              <div className={styles.loadingMessage}>
                Loading crossword puzzle...
              </div>
            )}
            
            {/* Input section */}
            <div className={styles.inputSection}>
              <div className={styles.currentWordLabel}>
                {currentWord && `Current Clue: ${currentWord.clue}`}
              </div>
              
              {showFeedback && (
                <div className={styles.feedbackBox}>
                  {feedbackMessage}
                </div>
              )}
            </div>
          </div>
          
          {/* Right column - Clues */}
          <div className={styles.rightColumn}>
            <div className={styles.cluesSection}>
              <div className={styles.cluesTitle}>Crossword Clues</div>
              
              <div className={styles.cluesList}>
                {/* Across clues */}
                <div className={styles.cluesCategoryTitle}>Across</div>
                <ul className={styles.cluesSublist}>
                  {clues.across && clues.across.map((clue) => (
                    <li
                      key={`across-${clue.number}`}
                      className={`${styles.clueItem} ${
                        currentWord && currentWord.number === clue.number && currentWord.direction === 'across'
                          ? styles.selectedClue
                          : ''
                      } ${isWordSolved(clue) ? styles.solvedClue : ''}`}
                      onClick={() => handleClueClick(clue)}
                    >
                      {clue.number}. {clue.clue}
                    </li>
                  ))}
                </ul>
                
                {/* Down clues */}
                <div className={styles.cluesCategoryTitle}>Down</div>
                <ul className={styles.cluesSublist}>
                  {clues.down && clues.down.map((clue) => (
                    <li
                      key={`down-${clue.number}`}
                      className={`${styles.clueItem} ${
                        currentWord && currentWord.number === clue.number && currentWord.direction === 'down'
                          ? styles.selectedClue
                          : ''
                      } ${isWordSolved(clue) ? styles.solvedClue : ''}`}
                      onClick={() => handleClueClick(clue)}
                    >
                      {clue.number}. {clue.clue}
                    </li>
                  ))}
                </ul>
              </div>
              
              <button
                className={styles.hintButton}
                onClick={showHintForCurrentWord}
                disabled={!currentWord || hintsRemaining <= 0}
              >
                Use Hint ({hintsRemaining} remaining)
              </button>
            </div>
          </div>
        </div>
        
        {/* Hint popup */}
        {showHint && (
          <motion.div
            className={styles.hintPopup}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
          >
            <div className={styles.hintContent}>
              <div className={styles.hintIcon}>💡</div>
              <div className={styles.hintText}>{hintContent}</div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default GameplayScreen;