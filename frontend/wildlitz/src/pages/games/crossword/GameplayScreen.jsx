// src/pages/games/crossword/GameplayScreen.jsx - FIXED CROSSWORD WITH PROPER INTERSECTIONS
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BackToHomeButton from '../crossword/BackToHomeButton';
import crosswordAnalyticsService from '../../../services/crosswordAnalyticsService';
import styles from '../../../styles/games/crossword/GameplayScreenDragDrop.module.css';

const GameplayScreen = ({ 
  puzzle, 
  theme, 
  onWordSolved, 
  solvedWords = [], 
  timeSpent, 
  timeFormatted,
  storyContext,
  currentPuzzleIndex = 0,
  totalPuzzles = 1,
  currentEpisode = 1,
  totalEpisodes = 1,
  sessionId,
  onAnswerAttempt,
  onPuzzleComplete  
}) => {
  
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [selectedClue, setSelectedClue] = useState(null);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [gridCells, setGridCells] = useState([]);
  const [solvedClues, setSolvedClues] = useState({});
  const [showCelebration, setShowCelebration] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState([]);
  
  const [scrambledLetters, setScrambledLetters] = useState([]);
  const [answerSlots, setAnswerSlots] = useState([]);
  const [draggedLetter, setDraggedLetter] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [gridLayout, setGridLayout] = useState({ width: 0, height: 0, cells: [] });
  const [wordPositions, setWordPositions] = useState([]);
  
  const gridInitializedRef = useRef(false);
  const wordStartTime = useRef(Date.now());
  const hintsUsedForCurrentWordRef = useRef(0);
  const celebrationTimeoutRef = useRef(null);
  const feedbackTimeoutRef = useRef(null);
  
  const INITIAL_HINTS = 3;

  if (!puzzle || !puzzle.words || !Array.isArray(puzzle.words)) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorMessage}>
          <h2>⚠️ Oops!</h2>
          <p>Unable to load the puzzle. Please try again!</p>
        </div>
      </div>
    );
  }

  const currentWord = puzzle.words[currentWordIndex];
  const totalWords = puzzle.words.length;
  const solvedCount = Object.keys(solvedClues).filter(key => solvedClues[key]).length;

  // Generate proper crossword with letter intersections
const generateCrosswordLayout = useCallback(() => {
  const words = puzzle.words.map((word, idx) => ({
    ...word,
    index: idx,
    answer: word.answer.toUpperCase()
  }));

  // Sort words by length (longest first) for better connections
  const sortedWords = [...words].sort((a, b) => b.answer.length - a.answer.length);
  
  const gridSize = 30;
  const grid = [];
  for (let i = 0; i < gridSize; i++) {
    grid[i] = [];
    for (let j = 0; j < gridSize; j++) {
      grid[i][j] = null;
    }
  }

  const placements = [];
  const centerRow = Math.floor(gridSize / 2);
  const centerCol = Math.floor(gridSize / 2);

  // Place longest word first (horizontally)
  const firstWord = sortedWords[0];
  const firstStartCol = centerCol - Math.floor(firstWord.answer.length / 2);
  
  placements.push({
    word: firstWord,
    row: centerRow,
    col: firstStartCol,
    direction: 'across',
    wordIndex: firstWord.index
  });

  for (let i = 0; i < firstWord.answer.length; i++) {
    grid[centerRow][firstStartCol + i] = {
      letter: firstWord.answer[i],
      wordIndices: [firstWord.index],
      positions: [i]
    };
  }

  // Place remaining words - FORCE CONNECTIONS
  for (let i = 1; i < sortedWords.length; i++) {
    const word = sortedWords[i];
    let placed = false;
    const attempts = [];

    // Try EVERY possible intersection with EVERY placed word
    for (const placement of placements) {
      const placedWord = placement.word.answer;
      
      // Try both directions
      for (const tryDirection of ['across', 'down']) {
        // Skip if same direction as placed word (we want perpendicular)
        if (tryDirection === placement.direction) continue;

        // Find ALL letter matches
        for (let wordIdx = 0; wordIdx < word.answer.length; wordIdx++) {
          for (let placedIdx = 0; placedIdx < placedWord.length; placedIdx++) {
            
            if (word.answer[wordIdx] === placedWord[placedIdx]) {
              let newRow, newCol;

              if (tryDirection === 'down') {
                newRow = placement.row - wordIdx;
                newCol = placement.col + placedIdx;
              } else {
                newRow = placement.row + placedIdx;
                newCol = placement.col - wordIdx;
              }

              // Check if valid
              const isValid = checkPlacement(
                grid, 
                word.answer, 
                newRow, 
                newCol, 
                tryDirection, 
                gridSize,
                wordIdx
              );

              if (isValid) {
                attempts.push({
                  row: newRow,
                  col: newCol,
                  direction: tryDirection,
                  intersections: countIntersections(grid, word.answer, newRow, newCol, tryDirection),
                  distance: Math.abs(newRow - centerRow) + Math.abs(newCol - centerCol)
                });
              }
            }
          }
        }
      }
    }

    // Choose best placement (most intersections, closest to center)
    if (attempts.length > 0) {
      attempts.sort((a, b) => {
        if (b.intersections !== a.intersections) {
          return b.intersections - a.intersections;
        }
        return a.distance - b.distance;
      });

      const best = attempts[0];
      
      placements.push({
        word: word,
        row: best.row,
        col: best.col,
        direction: best.direction,
        wordIndex: word.index
      });

      // Place in grid
      if (best.direction === 'down') {
        for (let k = 0; k < word.answer.length; k++) {
          const r = best.row + k;
          const c = best.col;
          
          if (grid[r][c] === null) {
            grid[r][c] = {
              letter: word.answer[k],
              wordIndices: [word.index],
              positions: [k]
            };
          } else {
            grid[r][c].wordIndices.push(word.index);
            grid[r][c].positions.push(k);
          }
        }
      } else {
        for (let k = 0; k < word.answer.length; k++) {
          const r = best.row;
          const c = best.col + k;
          
          if (grid[r][c] === null) {
            grid[r][c] = {
              letter: word.answer[k],
              wordIndices: [word.index],
              positions: [k]
            };
          } else {
            grid[r][c].wordIndices.push(word.index);
            grid[r][c].positions.push(k);
          }
        }
      }
      
      placed = true;
    }

    // Last resort: stack vertically
    if (!placed) {
      const lastPlacement = placements[placements.length - 1];
      const fallbackRow = lastPlacement.row + 2;
      const fallbackCol = centerCol - Math.floor(word.answer.length / 2);
      
      placements.push({
        word: word,
        row: fallbackRow,
        col: fallbackCol,
        direction: 'across',
        wordIndex: word.index
      });

      for (let k = 0; k < word.answer.length; k++) {
        grid[fallbackRow][fallbackCol + k] = {
          letter: word.answer[k],
          wordIndices: [word.index],
          positions: [k]
        };
      }
    }
  }

  function checkPlacement(grid, word, row, col, direction, gridSize, intersectIdx) {
  const length = word.length;
  
  // Bounds check
  if (direction === 'down') {
    if (row < 2 || row + length >= gridSize - 2) return false;
    if (col < 2 || col >= gridSize - 2) return false;
  } else {
    if (col < 2 || col + length >= gridSize - 2) return false;
    if (row < 2 || row >= gridSize - 2) return false;
  }

  let intersectionCount = 0; // Track intersections

  // Check each position
  for (let i = 0; i < length; i++) {
    const r = direction === 'down' ? row + i : row;
    const c = direction === 'across' ? col + i : col;

    const cell = grid[r][c];
    
    if (cell !== null) {
      // Cell occupied - must match letter
      if (cell.letter !== word[i]) return false;
      
      intersectionCount++; // Count this intersection
      
      // CRITICAL: Only allow ONE intersection per word
      if (intersectionCount > 1) {
        return false; // Reject if trying to intersect at multiple points
      }
    } else {
      // Cell empty - check perpendicular cells (no adjacent words)
      if (direction === 'down') {
        // Check left and right
        if (grid[r][c - 1] !== null || grid[r][c + 1] !== null) return false;
      } else {
        // Check above and below
        if (grid[r - 1]?.[c] !== null || grid[r + 1]?.[c] !== null) return false;
      }
    }
  }

  // MUST have exactly ONE intersection
  if (intersectionCount !== 1) {
    return false;
  }

  // Check before/after word (no adjacent words)
  if (direction === 'down') {
    if (grid[row - 1]?.[col] !== null) return false;
    if (grid[row + length]?.[col] !== null) return false;
  } else {
    if (grid[row]?.[col - 1] !== null) return false;
    if (grid[row]?.[col + length] !== null) return false;
  }

  return true;
}

  function countIntersections(grid, word, row, col, direction) {
    let count = 0;
    for (let i = 0; i < word.length; i++) {
      const r = direction === 'down' ? row + i : row;
      const c = direction === 'across' ? col + i : col;
      if (grid[r]?.[c] !== null) count++;
    }
    return count;
  }

  // Find bounds and create cells (same as before)
  let minRow = gridSize, maxRow = 0, minCol = gridSize, maxCol = 0;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (grid[r][c] !== null) {
        minRow = Math.min(minRow, r);
        maxRow = Math.max(maxRow, r);
        minCol = Math.min(minCol, c);
        maxCol = Math.max(maxCol, c);
      }
    }
  }

  minRow = Math.max(0, minRow - 1);
  maxRow = Math.min(gridSize - 1, maxRow + 1);
  minCol = Math.max(0, minCol - 1);
  maxCol = Math.min(gridSize - 1, maxCol + 1);

  const finalWidth = maxCol - minCol + 1;
  const finalHeight = maxRow - minRow + 1;

  const cells = [];
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      const cellData = grid[r][c];
      cells.push({
        row: r - minRow,
        col: c - minCol,
        letter: cellData?.letter || '',
        wordIndices: cellData?.wordIndices || [],
        positions: cellData?.positions || [],
        isEmpty: cellData === null,
        revealed: false,
        number: null
      });
    }
  }

  // Restore original order for numbering
 const finalPlacements = placements.map(p => ({
  ...p,
  row: p.row - minRow,
  col: p.col - minCol
})).sort((a, b) => a.wordIndex - b.wordIndex);

// Assign numbers based on position in array (1-5)
finalPlacements.forEach((placement, idx) => {
  const cellIndex = placement.row * finalWidth + placement.col;
  if (cells[cellIndex]) {
    cells[cellIndex].number = idx + 1; // THIS CHANGED - use idx instead of wordIndex
    cells[cellIndex].isWordStart = true;
    cells[cellIndex].wordIndex = placement.wordIndex;
  }
});

// Update placements to match
finalPlacements.forEach((p, idx) => {
  p.displayNumber = idx + 1;
});

  setGridLayout({ width: finalWidth, height: finalHeight, cells });
  setWordPositions(finalPlacements);
  setGridCells(cells);

}, [puzzle.words]);

  useEffect(() => {
    if (!gridInitializedRef.current) {
      generateCrosswordLayout();
      gridInitializedRef.current = true;
    }
  }, [generateCrosswordLayout]);

  useEffect(() => {
    if (puzzle?.words?.length > 0 && !selectedClue) {
      setSelectedClue(puzzle.words[0]);
    }
  }, [puzzle, selectedClue]);

  useEffect(() => {
    if (currentWord && !solvedClues[currentWordIndex]) {
      setupScrambledLetters(currentWord.answer);
      wordStartTime.current = Date.now();
      hintsUsedForCurrentWordRef.current = 0;
      setFeedback(null);
    }
  }, [currentWordIndex, currentWord?.answer]);

  useEffect(() => {
    if (solvedWords?.length > 0) {
      const solved = {};
      solvedWords.forEach(sw => {
        const word = typeof sw === 'string' ? sw : sw.word;
        const wordIndex = puzzle.words.findIndex(w => w.answer.toUpperCase() === word.toUpperCase());
        if (wordIndex !== -1) {
          solved[wordIndex] = true;
        }
      });
      setSolvedClues(solved);
    }
  }, [solvedWords, puzzle.words]);

  useEffect(() => {
    return () => {
      if (celebrationTimeoutRef.current) clearTimeout(celebrationTimeoutRef.current);
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

  const setupScrambledLetters = (answer) => {
    const letters = answer.toUpperCase().split('');
    const shuffled = [...letters].sort(() => Math.random() - 0.5);
    
    setScrambledLetters(shuffled.map((letter, idx) => ({
      id: `scrambled-${idx}`,
      letter: letter,
      isPlaced: false
    })));
    
    setAnswerSlots(letters.map((_, idx) => ({
      id: `slot-${idx}`,
      letter: null,
      letterIndex: null
    })));
  };

  const handleShuffle = () => {
    const availableLetters = scrambledLetters.filter(l => !l.isPlaced);
    const shuffled = [...availableLetters].sort(() => Math.random() - 0.5);
    
    setScrambledLetters(prev => {
      const newLetters = [...prev];
      let shuffledIdx = 0;
      return newLetters.map(letter => {
        if (!letter.isPlaced) {
          return { ...shuffled[shuffledIdx++] };
        }
        return letter;
      });
    });
  };

  const handleClear = () => {
    setScrambledLetters(prev => prev.map(l => ({ ...l, isPlaced: false })));
    setAnswerSlots(prev => prev.map(slot => ({ ...slot, letter: null, letterIndex: null })));
    setFeedback(null);
  };

  const handleDragStart = (e, letterIndex) => {
    setDraggedLetter(letterIndex);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnSlot = (e, slotIndex) => {
    e.preventDefault();
    
    if (draggedLetter === null) return;

    const letter = scrambledLetters[draggedLetter];
    
    if (answerSlots[slotIndex].letter !== null) {
      const oldLetterIndex = answerSlots[slotIndex].letterIndex;
      setScrambledLetters(prev => {
        const newLetters = [...prev];
        newLetters[oldLetterIndex] = { ...newLetters[oldLetterIndex], isPlaced: false };
        return newLetters;
      });
    }

    setAnswerSlots(prev => {
      const newSlots = [...prev];
      newSlots[slotIndex] = {
        ...newSlots[slotIndex],
        letter: letter.letter,
        letterIndex: draggedLetter
      };
      return newSlots;
    });

    setScrambledLetters(prev => {
      const newLetters = [...prev];
      newLetters[draggedLetter] = { ...newLetters[draggedLetter], isPlaced: true };
      return newLetters;
    });

    setDraggedLetter(null);
  };

  const handleLetterClick = (letterIndex) => {
    const letter = scrambledLetters[letterIndex];
    if (letter.isPlaced) return;

    const emptySlotIndex = answerSlots.findIndex(slot => slot.letter === null);
    if (emptySlotIndex !== -1) {
      setAnswerSlots(prev => {
        const newSlots = [...prev];
        newSlots[emptySlotIndex] = {
          ...newSlots[emptySlotIndex],
          letter: letter.letter,
          letterIndex: letterIndex
        };
        return newSlots;
      });

      setScrambledLetters(prev => {
        const newLetters = [...prev];
        newLetters[letterIndex] = { ...newLetters[letterIndex], isPlaced: true };
        return newLetters;
      });
    }
  };

  const handleSlotClick = (slotIndex) => {
    const slot = answerSlots[slotIndex];
    if (slot.letter === null) return;

    setScrambledLetters(prev => {
      const newLetters = [...prev];
      newLetters[slot.letterIndex] = { ...newLetters[slot.letterIndex], isPlaced: false };
      return newLetters;
    });

    setAnswerSlots(prev => {
      const newSlots = [...prev];
      newSlots[slotIndex] = { ...newSlots[slotIndex], letter: null, letterIndex: null };
      return newSlots;
    });
  };

  const handleSubmit = async () => {
    const allFilled = answerSlots.every(slot => slot.letter !== null);
    if (!allFilled) {
      alert('Please fill all letters!');
      return;
    }

    setIsSubmitting(true);

    const userAnswer = answerSlots.map(slot => slot.letter).join('');
    const correctAnswer = currentWord.answer.toUpperCase();

    if (userAnswer === correctAnswer) {
      setFeedback('correct');
      
      updateGridWithWord(currentWord);
      
      setSolvedClues(prev => ({
        ...prev,
        [currentWordIndex]: true
      }));

      if (onWordSolved) {
        onWordSolved(currentWord.answer, {
          timeSpent: Date.now() - wordStartTime.current,
          hintsUsed: hintsUsedForCurrentWordRef.current
        });
      }

      triggerCelebration();

      setTimeout(() => {
        setFeedback(null);
        setIsSubmitting(false);
        
        if (solvedCount + 1 >= totalWords) {
          if (onPuzzleComplete) {
            onPuzzleComplete();
          }
        } else {
          moveToNextWord();
        }
      }, 2000);

    } else {
      setFeedback('wrong');
      
      setTimeout(() => {
        handleClear();
        setFeedback(null);
        setIsSubmitting(false);
      }, 1500);
    }
  };

  const handleUseHint = () => {
    if (hintsRemaining <= 0) {
      alert('No hints remaining!');
      return;
    }

    const emptySlotIndex = answerSlots.findIndex(slot => slot.letter === null);
    if (emptySlotIndex === -1) return;

    const correctLetter = currentWord.answer[emptySlotIndex].toUpperCase();
    const letterIndex = scrambledLetters.findIndex(l => l.letter === correctLetter && !l.isPlaced);
    
    if (letterIndex !== -1) {
      setAnswerSlots(prev => {
        const newSlots = [...prev];
        newSlots[emptySlotIndex] = {
          ...newSlots[emptySlotIndex],
          letter: correctLetter,
          letterIndex: letterIndex
        };
        return newSlots;
      });

      setScrambledLetters(prev => {
        const newLetters = [...prev];
        newLetters[letterIndex] = { ...newLetters[letterIndex], isPlaced: true };
        return newLetters;
      });

      setHintsRemaining(prev => prev - 1);
      hintsUsedForCurrentWordRef.current++;
    }
  };

 const updateGridWithWord = (word) => {
  const wordIdx = currentWordIndex;
  
  // Update gridCells
  setGridCells(prevCells => {
    return prevCells.map(cell => {
      if (cell.wordIndices.includes(wordIdx)) {
        return {
          ...cell,
          revealed: true
        };
      }
      return cell;
    });
  });
  
  // ALSO update gridLayout at the same time
  setGridLayout(prev => ({
    ...prev,
    cells: prev.cells.map(cell => {
      if (cell.wordIndices.includes(wordIdx)) {
        return {
          ...cell,
          revealed: true
        };
      }
      return cell;
    })
  }));
};

  const moveToNextWord = () => {
    let nextIndex = currentWordIndex + 1;
    while (nextIndex < totalWords && solvedClues[nextIndex]) {
      nextIndex++;
    }
    
    if (nextIndex < totalWords) {
      setCurrentWordIndex(nextIndex);
      setSelectedClue(puzzle.words[nextIndex]);
    }
  };

  const triggerCelebration = () => {
    setShowCelebration(true);
    
    const pieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 2,
      emoji: ['🎉', '⭐', '✨', '🎊', '💫'][Math.floor(Math.random() * 5)]
    }));
    
    setConfettiPieces(pieces);
    
    celebrationTimeoutRef.current = setTimeout(() => {
      setShowCelebration(false);
      setConfettiPieces([]);
    }, 3000);
  };

  const handleJumpToWord = (wordIndex) => {
    if (!solvedClues[wordIndex]) {
      setCurrentWordIndex(wordIndex);
      setSelectedClue(puzzle.words[wordIndex]);
    }
  };

  // Click on cell number to view that word's clue
  const handleCellClick = (cell) => {
    if (cell.isWordStart && cell.wordIndex !== undefined) {
      if (!solvedClues[cell.wordIndex]) {
        setCurrentWordIndex(cell.wordIndex);
        setSelectedClue(puzzle.words[cell.wordIndex]);
      }
    }
  };

  const getWordStatus = (wordIdx) => {
    if (solvedClues[wordIdx]) return 'solved';
    if (wordIdx === currentWordIndex) return 'current';
    return 'unsolved';
  };

  return (
    <div className={styles.gameContainer}>
      <BackToHomeButton />

      <AnimatePresence>
        {showCelebration && (
          <div className={styles.confettiContainer}>
            {confettiPieces.map(piece => (
              <motion.div
                key={piece.id}
                className={styles.confetti}
                initial={{ top: -20, left: `${piece.left}%`, opacity: 1 }}
                animate={{ top: '100%', opacity: 0 }}
                transition={{ duration: piece.duration, delay: piece.delay }}
              >
                {piece.emoji}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.levelBadge}>
            📚 Episode {currentPuzzleIndex + 1}
          </div>
          <h1 className={styles.title}>🎯 Crossword Puzzle</h1>
          <div className={styles.stats}>
            <div className={styles.stat}>⏱️ {timeFormatted}</div>
            <div className={styles.stat}>💡 {hintsRemaining}</div>
            <div className={styles.stat}>✅ {solvedCount}/{totalWords} Words</div>
          </div>
        </div>
      </header>

      <div className={styles.mainContent}>
        
        <div className={styles.leftPanel}>
          
          <div className={styles.wordButtons}>
            {puzzle.words.map((word, idx) => {
              const status = getWordStatus(idx);
              return (
                <button
                  key={idx}
                  onClick={() => handleJumpToWord(idx)}
                  className={`${styles.wordButton} ${styles[status]}`}
                  disabled={status === 'solved'}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className={styles.gridWrapper}>
            <div className={styles.gridContainer}>
              <div 
                className={styles.grid}
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${gridLayout.width}, 1fr)`,
                  gridTemplateRows: `repeat(${gridLayout.height}, 1fr)`,
                  gap: '2px',
                  width: '100%',
                  height: '100%',
                  maxWidth: '650px',
                  maxHeight: '650px',
                  aspectRatio: `${gridLayout.width} / ${gridLayout.height}`
                }}
              >
                
                  {gridLayout.cells.map((cell, idx) => {
                  if (cell.isEmpty) {
                    return <div key={idx} className={styles.emptyCell}></div>;
                  }
                  
                  const isCurrent = cell.wordIndices.includes(currentWordIndex);
                  const isSolved = cell.wordIndices.some(wordIdx => solvedClues[wordIdx]);
                  const isClickable = cell.isWordStart && !solvedClues[cell.wordIndex];
                  
                  return (
                    <div
                      key={idx}
                      className={`${styles.cell} ${isCurrent ? styles.currentCell : ''} ${isSolved ? styles.solvedCell : ''} ${isClickable ? styles.clickableCell : ''}`}
                      onClick={() => handleCellClick(cell)}
                    >
                      {cell.number && (
                        <span className={styles.cellNumber}>
                          {cell.number}
                        </span>
                      )}
                     <span className={styles.cellValue}>
                      {cell.revealed && cell.letter ? cell.letter.toUpperCase() : ''}
                    </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.rightPanel}>
          
          <div className={styles.clueCard}>
            <div className={styles.clueHeader}>
              <span className={styles.clueNumber}>#{currentWordIndex + 1}</span>
              <span className={styles.clueDirection}>
                {wordPositions[currentWordIndex]?.direction || 'Across'}
              </span>
            </div>
            <div className={styles.clueContent}>
              <div className={styles.clueIcon}>🎯</div>
              <p className={styles.clueText}>{currentWord?.clue || ''}</p>
            </div>
          </div>

          <div className={styles.answerArea}>
            <h3 className={styles.answerTitle}>📝 Drop Letters Here:</h3>
            <div className={styles.answerSlots}>
              {answerSlots.map((slot, idx) => (
                <div
                  key={slot.id}
                  className={`${styles.answerSlot} ${slot.letter ? styles.filled : ''} ${feedback === 'correct' ? styles.correct : ''} ${feedback === 'wrong' ? styles.wrong : ''}`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnSlot(e, idx)}
                  onClick={() => handleSlotClick(idx)}
                >
                  {slot.letter || ''}
                </div>
              ))}
            </div>
            <div className={styles.answerInfo}>
              {currentWord?.answer.length} letters • {wordPositions[currentWordIndex]?.direction}
            </div>
          </div>

          <div className={styles.scrambleArea}>
            <h3 className={styles.scrambleTitle}>🔤 Available Letters:</h3>
            <div className={styles.scrambleContainer}>
              {scrambledLetters.map((letter, idx) => (
                !letter.isPlaced && (
                  <div
                    key={letter.id}
                    className={styles.letterTile}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onClick={() => handleLetterClick(idx)}
                  >
                    {letter.letter}
                  </div>
                )
              ))}
            </div>
            <button 
              className={styles.shuffleBtn}
              onClick={handleShuffle}
            >
              🔄 Shuffle
            </button>
          </div>

          <div className={styles.actionButtons}>
            <button 
              className={styles.hintBtn}
              onClick={handleUseHint}
              disabled={hintsRemaining <= 0}
            >
              💡 Hint ({hintsRemaining})
            </button>
            <button 
              className={styles.clearBtn}
              onClick={handleClear}
            >
              🗑️ Clear
            </button>
            <button 
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={isSubmitting || answerSlots.some(slot => slot.letter === null)}
            >
              ✨ Submit
            </button>
          </div>

          {feedback && (
            <motion.div
              className={`${styles.feedbackBanner} ${styles[feedback]}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              {feedback === 'correct' ? (
                <>🎉 Correct! Amazing!</>
              ) : (
                <>😊 Try again! You've got this!</>
              )}
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
};

export default GameplayScreen;