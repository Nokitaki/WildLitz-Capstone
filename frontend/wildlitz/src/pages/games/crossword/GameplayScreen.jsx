// src/pages/games/crossword/GameplayScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdaptiveHintSystem from '../../../components/crossword/AdaptiveHintSystem';
import styles from '../../../styles/games/crossword/GameplayScreen.module.css';

/**
 * GameplayScreen component for Crossword Puzzle with improved hint system
 */
const GameplayScreen = ({ 
  puzzle, 
  theme, 
  onWordSolved, 
  solvedWords = [], 
  timeFormatted, 
  storyContext 
}) => {
  // Current state
  const [selectedClue, setSelectedClue] = useState(null);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [showHint, setShowHint] = useState(false);
  const [lastHint, setLastHint] = useState('');
  const [showTeacherView, setShowTeacherView] = useState(false);
  const [showAdaptiveHints, setShowAdaptiveHints] = useState(false);
  const [hintHistory, setHintHistory] = useState([]);
  const [incorrectAttempts, setIncorrectAttempts] = useState({});
  const [gridCells, setGridCells] = useState([]);
  const [answerChoices, setAnswerChoices] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [wordIntersections, setWordIntersections] = useState({});
  
  // Local state to track solved clues
  const [solvedClues, setSolvedClues] = useState({});
  const [cluesMap, setCluesMap] = useState({});
  const [isLoadingClues, setIsLoadingClues] = useState(false);
  const [isLoadingChoices, setIsLoadingChoices] = useState(false);
  
  // Create grid when puzzle changes
  useEffect(() => {
    if (puzzle && puzzle.size) {
      console.log("Creating grid with size:", puzzle.size);
      console.log("Puzzle words:", puzzle.words);
      createGrid();
      findWordIntersections();
      generateClues();
    }
  }, [puzzle]);
  
  // Update grid when solvedWords changes
  useEffect(() => {
    if (puzzle && solvedWords.length > 0) {
      console.log("Updating grid with solved words:", solvedWords);
      updateGridWithSolvedWords();
    }
  }, [solvedWords]);
  
  // Set initial selected clue on component mount
  useEffect(() => {
    if (puzzle && puzzle.words && puzzle.words.length > 0 && !selectedClue) {
      // Auto-select the first across clue
      const firstAcrossClue = puzzle.words.find(word => word.direction === 'across');
      if (firstAcrossClue) {
        setSelectedClue(firstAcrossClue);
      }
    }
  }, [puzzle, selectedClue]);
  
  // Generate new answer choices when the selected clue changes
  useEffect(() => {
    if (selectedClue) {
      // Clear existing choices
      setAnswerChoices([]);
      setSelectedAnswer(null);
      setFeedback(null);
      
      // Generate choices for the new clue
      generateChoicesForClue(selectedClue);
    }
  }, [selectedClue]);
  
  // Generate clues for all words
  const generateClues = () => {
    if (!puzzle || !puzzle.words) return;
    
    setIsLoadingClues(true);
    
    try {
      const newCluesMap = {};
      
      // Use clues directly from the puzzle data
      puzzle.words.forEach(word => {
        newCluesMap[word.answer] = word.clue || generateProperClue(word.answer, theme);
      });
      
      setCluesMap(newCluesMap);
    } catch (error) {
      console.error("Error generating clues:", error);
    } finally {
      setIsLoadingClues(false);
    }
  };
  
  /**
   * Get the appropriate clue for a word
   */
  const getClueForWord = (word) => {
    // If we have clues, use those
    if (cluesMap && cluesMap[word]) {
      return cluesMap[word];
    }
    
    // Fallback to clue generator
    return generateProperClue(word, theme);
  };
  
  /**
   * Clue generator (fallback)
   */
  const generateProperClue = (word, theme) => {
    // Dictionary of clues for common words
    const clueMap = {
      // Jungle themed clues
      "MAP": "Drawing that shows locations and features of an area",
      "TREASURE": "Collection of valuable items",
      "PATH": "Track or route for walking",
      "JOURNEY": "Travel from one place to another",
      "COMPASS": "Instrument that shows directions",
    };
    
    // Return specific clue if it exists
    if (clueMap[word]) {
      return clueMap[word];
    }
    
    // Generate general clues based on word length and type
    if (word.length <= 3) {
      return `Short ${theme} word with ${word.length} letters`;
    } else if (word.length <= 5) {
      return `Medium ${theme} word that starts with '${word[0]}'`;
    } else {
      return `Longer ${theme} word (${word.length} letters) found in the story`;
    }
  };
  
  /**
   * Answer choice generator
   */
  const generateChoicesForClue = (clue) => {
    const correctAnswer = clue.answer;
    
    // Dictionary of related words to use as distractors
    const relatedWordMap = {
      "MAP": ["PLAN", "CHAT", "CAP"],
      "PATH": ["ROAD", "WALK", "BATH"],
      "TREASURE": ["PLEASURE", "MEASURE", "FEATURE"],
      "COMPASS": ["COMPARE", "COMPOST", "COMPACT"],
      "JOURNEY": ["TOURNEY", "HURRAY", "JOYFUL"]
    };
    
    // Create array to hold choices
    let choices = [correctAnswer];
    
    // Try to use related words from the map
    const relatedWords = relatedWordMap[correctAnswer] || [];
    for (const word of relatedWords) {
      if (choices.length < 4 && word !== correctAnswer) {
        choices.push(word);
      }
    }
    
    // If we don't have enough choices, generate plausible words
    while (choices.length < 4) {
      const letterPool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let fakeWord = '';
      
      for (let i = 0; i < correctAnswer.length; i++) {
        // 25% chance to keep the original letter
        if (Math.random() < 0.25) {
          fakeWord += correctAnswer[i];
        } else {
          fakeWord += letterPool[Math.floor(Math.random() * letterPool.length)];
        }
      }
      
      // Check if this fake word is unique and not the correct answer
      if (!choices.includes(fakeWord) && fakeWord !== correctAnswer) {
        choices.push(fakeWord);
      }
    }
    
    // Shuffle the choices
    setAnswerChoices(choices.sort(() => Math.random() - 0.5));
  };
  
  /**
   * Find all cells where words intersect
   */
  const findWordIntersections = () => {
    if (!puzzle || !puzzle.words) return;
    
    const intersections = {};
    
    // For each pair of words
    for (let i = 0; i < puzzle.words.length; i++) {
      for (let j = i + 1; j < puzzle.words.length; j++) {
        const word1 = puzzle.words[i];
        const word2 = puzzle.words[j];
        
        if (!word1.cells || !word2.cells) continue;
        
        // Check if they share a cell
        word1.cells.forEach(cell1 => {
          word2.cells.forEach(cell2 => {
            if (cell1.row === cell2.row && cell1.col === cell2.col) {
              // This is an intersection
              const key = `${cell1.row}-${cell1.col}`;
              intersections[key] = true;
            }
          });
        });
      }
    }
    
    setWordIntersections(intersections);
  };
  
  /**
   * Create the crossword grid
   */
  const createGrid = () => {
  if (!puzzle || !puzzle.words) {
    console.error("Cannot create grid: puzzle or words missing");
    return;
  }
  
  console.log("Creating grid with puzzle:", puzzle);
  
  // Determine actual grid size from the word cells
  let maxRow = 0;
  let maxCol = 0;
  
  // Calculate maximum row and column from all word cells
  puzzle.words.forEach(word => {
    if (word.cells && word.cells.length > 0) {
      word.cells.forEach(cell => {
        maxRow = Math.max(maxRow, cell.row);
        maxCol = Math.max(maxCol, cell.col);
      });
    }
  });
  
  // Add 1 to get the grid dimensions (since rows/cols are 0-based)
  const gridHeight = maxRow + 1;
  const gridWidth = maxCol + 1;
  
  console.log(`Calculated grid size: ${gridWidth}x${gridHeight}`);
  
  // Create a matrix to track which cells have content
  const cellMatrix = Array(gridHeight).fill().map(() => Array(gridWidth).fill(false));
  
  // Mark cells that contain letters
  puzzle.words.forEach(word => {
    if (word.cells && word.cells.length > 0) {
      word.cells.forEach(cell => {
        if (cell.row >= 0 && cell.row < gridHeight && cell.col >= 0 && cell.col < gridWidth) {
          cellMatrix[cell.row][cell.col] = true;
        }
      });
    }
  });
  
  // Create cells array for the grid
  const cells = [];
  for (let row = 0; row < gridHeight; row++) {
    for (let col = 0; col < gridWidth; col++) {
      // Check if any word has a number at this position
      const wordsStartingHere = puzzle.words.filter(word => 
        word.cells && 
        word.cells.length > 0 && 
        word.cells[0].row === row && 
        word.cells[0].col === col
      );
      
      const cellNumber = wordsStartingHere.length > 0 ? wordsStartingHere[0].number : null;
      
      // Check if this is an empty cell (no letter)
      const isEmpty = !cellMatrix[row][col];
      
      cells.push({
        row,
        col,
        value: '',
        revealed: false,
        number: cellNumber,
        isEmpty
      });
    }
  }
  
  // Update grid size in puzzle for rendering
  if (puzzle.size) {
    puzzle.size.width = gridWidth;
    puzzle.size.height = gridHeight;
  } else {
    puzzle.size = { width: gridWidth, height: gridHeight };
  }
  
  setGridCells(cells);
  
  // If we have solved words, update the grid
  if (solvedWords.length > 0) {
    updateGridWithSolvedWords();
  }
};
  
  /**
   * Update grid with solved words
   */
  const updateGridWithSolvedWords = () => {
    if (!puzzle || !puzzle.words || solvedWords.length === 0) return;
    
    // Create a map of solved words for easy lookup
    const solvedWordsMap = solvedWords.reduce((map, word) => {
      map[word.word.toUpperCase()] = true;
      return map;
    }, {});
    
    // Create a new grid with updated cells
    const updatedCells = [...gridCells];
    
    // For each word in the puzzle
    puzzle.words.forEach(word => {
      // Check if this word is solved
      if (solvedWordsMap[word.answer]) {
        // Mark this word as solved in our tracking
        setSolvedClues(prev => ({
          ...prev,
          [`${word.direction}-${word.number}`]: true
        }));
        
        // Reveal all cells for this word
        if (word.cells) {
          word.cells.forEach((cell, idx) => {
            const cellIndex = updatedCells.findIndex(c => 
              c.row === cell.row && c.col === cell.col
            );
            
            if (cellIndex !== -1) {
              updatedCells[cellIndex] = {
                ...updatedCells[cellIndex],
                value: word.answer[idx],
                revealed: true
              };
            }
          });
        }
      }
    });
    
    setGridCells(updatedCells);
  };
  
  /**
   * Check if a word has been solved
   */
  const isWordSolved = (word) => {
    if (!word) return false;
    
    // Check in our local tracking
    const key = `${selectedClue?.direction}-${selectedClue?.number}`;
    if (solvedClues[key]) return true;
    
    // Check in the solvedWords array from props
    return solvedWords.some(solved => 
      solved.word.toUpperCase() === word.toUpperCase()
    );
  };
  
  /**
   * Handle clue selection
   */
  const handleSelectClue = (clue) => {
    if (clue) {
      setSelectedClue(clue);
    }
  };
  
  /**
   * Get context sentence for teacher view based on selected clue
   */
  const getContextForClue = () => {
    if (!storyContext || !storyContext.text || !selectedClue) return "";
    
    // Split text into sentences
    const sentences = storyContext.text.split(/[.!?]/).filter(s => s.trim()).map(s => s.trim() + ".");
    
    // Try to find a sentence containing the selected clue answer
    const answer = selectedClue.answer.toLowerCase();
    const matchingSentence = sentences.find(sentence => 
      sentence.toLowerCase().includes(answer.toLowerCase())
    );
    
    return matchingSentence || sentences[0]; // Return matching or first sentence
  };
  
  /**
   * Mark word as solved when answer is correct
   */
  const handleMarkSolved = () => {
    if (!selectedClue) return;
    
    const correctAnswer = selectedClue.answer;
    
    // Update our local tracking of solved clues
    const key = `${selectedClue.direction}-${selectedClue.number}`;
    setSolvedClues(prev => ({
      ...prev,
      [key]: true
    }));
    
    // Update grid cells to reveal the word
    const updatedCells = [...gridCells];
    
    if (selectedClue.cells && selectedClue.cells.length > 0) {
      selectedClue.cells.forEach((cell, index) => {
        const cellIndex = updatedCells.findIndex(c => 
          c.row === cell.row && c.col === cell.col
        );
        
        if (cellIndex !== -1) {
          updatedCells[cellIndex] = {
            ...updatedCells[cellIndex],
            value: correctAnswer[index],
            revealed: true
          };
        }
      });
      
      setGridCells(updatedCells);
    }
    
    // Mark word as solved in parent component if not already solved
    if (!solvedWords.some(word => word.word === correctAnswer)) {
      onWordSolved(
        correctAnswer,
        selectedClue.definition || "No definition available",
        selectedClue.example || `The ${correctAnswer.toLowerCase()} is an important word in the story.`
      );
    }
    
    // Reset states
    setSelectedAnswer(null);
    setFeedback({ type: 'success', message: 'Correct! Word added to the crossword.' });
    
    // Auto-select the next unsolved clue after a delay
    setTimeout(() => {
      const nextClue = findNextUnsolved();
      if (nextClue) {
        setSelectedClue(nextClue);
      }
    }, 800);
  };

  /**
   * Handle answer selection
   */
  const handleSelectAnswer = (choice) => {
    setSelectedAnswer(choice);
    setFeedback(null); // Reset feedback when new answer is selected
  };

  /**
   * Handle answer submission
   */
  const handleSubmitAnswer = () => {
    if (!selectedAnswer || !selectedClue) return;
    
    const correctAnswer = selectedClue.answer;
    
    // If correct choice, mark as solved
    if (selectedAnswer === correctAnswer) {
      setFeedback({ type: 'success', message: 'Correct answer!' });
      setTimeout(() => {
        handleMarkSolved();
      }, 500);
    } else {
      // Track incorrect attempts
      setIncorrectAttempts(prev => ({
        ...prev,
        [selectedClue.answer]: (prev[selectedClue.answer] || 0) + 1
      }));
      
      // Show feedback for incorrect choice
      setFeedback({ type: 'error', message: 'Try again! That\'s not the correct answer.' });
      setLastHint("Try again! That's not the correct answer.");
      setShowHint(true);
      setTimeout(() => setShowHint(false), 2000);
    }
  };

  /**
   * IMPROVED - Handle showing a hint by revealing a random letter
   */
  const handleShowHint = () => {
  if (hintsRemaining <= 0) {
    // No hints remaining
    setShowHint(true);
    setLastHint("You've used all your hints!");
    setTimeout(() => setShowHint(false), 3000);
    return;
  }
  
  if (!selectedClue) {
    // No clue selected
    setShowHint(true);
    setLastHint("Please select a word first!");
    setTimeout(() => setShowHint(false), 3000);
    return;
  }
  
  // Immediately decrease the hint counter
  const newHintCount = hintsRemaining - 1;
  setHintsRemaining(newHintCount);
  
  console.log(`Using hint. Remaining: ${newHintCount}`);
  
  // Get the currently selected word's cells
  const wordCells = selectedClue.cells || [];
  if (wordCells.length === 0) return;
  
  // Find unrevealed cells for this word
  const unrevealedCells = wordCells.filter((cell, index) => {
    const cellIndex = gridCells.findIndex(c => 
      c.row === cell.row && c.col === cell.col
    );
    
    return cellIndex !== -1 && !gridCells[cellIndex].revealed;
  });
  
  // If all cells are revealed, show message
  if (unrevealedCells.length === 0) {
    setShowHint(true);
    setLastHint("All letters for this word are already revealed!");
    setTimeout(() => setShowHint(false), 3000);
    return;
  }
  
  // Choose a random unrevealed cell
  const randomIndex = Math.floor(Math.random() * unrevealedCells.length);
  const cellToReveal = unrevealedCells[randomIndex];
  
  // Find the position of this cell in the word
  const letterPosition = wordCells.findIndex(c => 
    c.row === cellToReveal.row && c.col === cellToReveal.col
  );
  
  // Get the letter at this position
  const letterToReveal = selectedClue.answer[letterPosition];
  
  // Create a hint message
  setLastHint(`Revealing the letter "${letterToReveal}" in position ${letterPosition + 1}`);
  setShowHint(true);
  
  // Update the grid to reveal this letter
  const updatedCells = [...gridCells];
  const cellIndex = updatedCells.findIndex(c => 
    c.row === cellToReveal.row && c.col === cellToReveal.col
  );
  
  if (cellIndex !== -1) {
    updatedCells[cellIndex] = {
      ...updatedCells[cellIndex],
      value: letterToReveal,
      revealed: true
    };
    
    setGridCells(updatedCells);
  }
  
  // Hide hint after 3 seconds
  setTimeout(() => {
    setShowHint(false);
  }, 3000);
};

  
  /**
   * Handle adaptive hint
   */
  const handleAdaptiveHint = (hint) => {
    setHintHistory(prev => [...prev, hint]);
    
    // Display the hint as a popup
    setShowHint(true);
    setLastHint(hint.text);
    
    // If this is a letter reveal hint, update the grid
    if (hint.type === 'letter_reveal' && selectedClue) {
      const letterIndex = hint.letterIndex;
      const letter = hint.letter;
      
      // Find the cell corresponding to this letter position
      if (selectedClue.cells && letterIndex < selectedClue.cells.length) {
        const cell = selectedClue.cells[letterIndex];
        
        // Update the grid
        const updatedCells = [...gridCells];
        const cellIndex = updatedCells.findIndex(c => 
          c.row === cell.row && c.col === cell.col
        );
        
        if (cellIndex !== -1) {
          updatedCells[cellIndex] = {
            ...updatedCells[cellIndex],
            value: letter,
            revealed: true
          };
          
          setGridCells(updatedCells);
        }
      }
    }
    
    // If this is a full reveal hint, reveal all letters
    if (hint.type === 'full_reveal' && selectedClue) {
      const updatedCells = [...gridCells];
      
      selectedClue.cells.forEach((cell, idx) => {
        const cellIndex = updatedCells.findIndex(c => 
          c.row === cell.row && c.col === cell.col
        );
        
        if (cellIndex !== -1) {
          updatedCells[cellIndex] = {
            ...updatedCells[cellIndex],
            value: selectedClue.answer[idx],
            revealed: true
          };
        }
      });
      
      setGridCells(updatedCells);
    }
    
    // Hide hint after 3 seconds
    setTimeout(() => {
      setShowHint(false);
    }, 3000);
  };
  
  /**
   * Render answer choices from state
   */
  const renderAnswerChoices = () => {
    if (!selectedClue) return null;
    
    // Check if the current clue is already solved
    const key = `${selectedClue.direction}-${selectedClue.number}`;
    const isSolved = solvedClues[key] || 
      solvedWords.some(word => word.word.toUpperCase() === selectedClue.answer.toUpperCase());
    
    // Show loading state if generating choices
    if (isLoadingChoices && answerChoices.length === 0) {
      return (
        <div className={styles.answerChoices}>
          <h3 className={styles.choicesTitle}>Answer Choices:</h3>
          <div className={styles.loadingChoices}>
            <div className={styles.spinner}></div>
            <p>Generating answer choices...</p>
          </div>
        </div>
      );
    }
    
    // Show answer choices once they're ready
    return (
      <div className={styles.answerChoices}>
        <h3 className={styles.choicesTitle}>Answer Choices:</h3>
        <div className={styles.choicesList}>
          {answerChoices.map((choice, index) => (
            <button 
              key={index} 
              className={`${styles.choiceButton} ${selectedAnswer === choice ? styles.selectedChoice : ''}`}
              onClick={() => handleSelectAnswer(choice)}
              disabled={isSolved}
            >
              {choice}
            </button>
          ))}
        </div>
        
        {selectedAnswer && !isSolved && (
          <button 
            className={styles.submitAnswerButton}
            onClick={handleSubmitAnswer}
          >
            Submit Answer
          </button>
        )}
        
        {feedback && (
          <div className={`${styles.feedbackMessage} ${feedback.type === 'success' ? styles.successFeedback : styles.errorFeedback}`}>
            {feedback.message}
          </div>
        )}
      </div>
    );
  };

  /**
   * Find the next unsolved clue
   */
  const findNextUnsolved = () => {
    if (!puzzle || !puzzle.words) return null;

    // First, try to find the next unsolved across clue
    const acrossClues = puzzle.words.filter(word => word.direction === 'across');
    for (const clue of acrossClues) {
      const key = `across-${clue.number}`;
      if (!solvedClues[key] && !isWordSolved(clue.answer)) {
        return clue;
      }
    }

    // If no unsolved across clues, look for unsolved down clues
    const downClues = puzzle.words.filter(word => word.direction === 'down');
    for (const clue of downClues) {
      const key = `down-${clue.number}`;
      if (!solvedClues[key] && !isWordSolved(clue.answer)) {
        return clue;
      }
    }

    return null;
  };
  
  /**
   * Highlight the selected word in the context
   */
  const highlightContextWord = () => {
    if (!selectedClue) return getContextForClue();
    
    const context = getContextForClue();
    const answer = selectedClue.answer;
    
    // Regex to find the word with word boundaries
    const regex = new RegExp(`\\b${answer}\\b`, 'gi');
    
    // Replace with highlighted version
    return context.replace(regex, match => 
      `<span class="${styles.highlightedWord}">${match}</span>`
    );
  };
  
  /**
   * Render crossword grid
   */
  const renderCrosswordGrid = () => {
  if (!puzzle || !puzzle.size || gridCells.length === 0) {
    return <div className={styles.emptyGridMessage}>Loading crossword grid...</div>;
  }
  
  const width = puzzle.size.width;
  const height = puzzle.size.height;
  
  console.log(`Rendering grid with dimensions: ${width}x${height}`);
  console.log(`Grid cells: ${gridCells.length}`);
  
  // Ensure the grid is rendered with proper dimensions
  const gridStyle = {
    gridTemplateColumns: `repeat(${width}, 45px)`,
    gridTemplateRows: `repeat(${height}, 45px)`,
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderRadius: '15px',
    display: 'grid',
    gap: '1px',
  };
  
  return (
    <div className={styles.crosswordGrid} style={gridStyle}>
      {gridCells.map((cell, index) => {
        // Empty cells should have a different style
        if (cell.isEmpty) {
          return (
            <div 
              key={`${cell.row}-${cell.col}`} 
              className={styles.emptyCell}
            />
          );
        }
        
        // Check if this is an intersection cell
        const isIntersection = wordIntersections[`${cell.row}-${cell.col}`];
        
        // Find if this cell belongs to the selected clue
        const isSelected = selectedClue && 
          selectedClue.cells && 
          selectedClue.cells.some(c => c.row === cell.row && c.col === cell.col);
        
        return (
          <div 
            key={`${cell.row}-${cell.col}`} 
            className={`
              ${styles.cell}
              ${isSelected ? styles.selectedCell : ''} 
              ${cell.revealed ? styles.solvedCell : ''} 
              ${isIntersection ? styles.intersectionCell : ''}
            `}
            onClick={() => {
              // Find word that this cell belongs to
              const clickedWord = puzzle.words.find(word => 
                word.cells && word.cells.some(c => c.row === cell.row && c.col === cell.col)
              );
              if (clickedWord) handleSelectClue(clickedWord);
            }}
          >
            {cell.number && <span className={styles.cellNumber}>{cell.number}</span>}
            <span className={styles.cellValue}>
              {cell.revealed ? cell.value : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
};

  /**
   * Render the clue list for a specific direction
   */
  const renderClueList = (direction) => {
    return puzzle?.words?.filter(word => word.direction === direction).map(clue => {
      const key = `${clue.direction}-${clue.number}`;
      const isSolved = solvedClues[key] || 
        solvedWords.some(word => word.word.toUpperCase() === clue.answer.toUpperCase());
      
      return (
        <li 
          key={`${direction}-${clue.number}`}
          className={`
            ${styles.clueItem} 
            ${selectedClue && selectedClue.number === clue.number && selectedClue.direction === clue.direction ? styles.active : ''} 
            ${isSolved ? styles.solved : ''}
          `}
          onClick={() => handleSelectClue(clue)}
        >
          <span className={`
            ${styles.clueNumber} 
            ${isSolved ? styles.solvedNumber : ''}
          `}>
            {clue.number}
          </span>
          <span className={styles.clueText}>
            {isLoadingClues && !cluesMap[clue.answer] 
              ? "Generating clue..." 
              : getClueForWord(clue.answer)}
          </span>
        </li>
      );
    }) || [];
  };

  return (
    <div className={styles.crosswordContainer}>
      <div className={styles.crosswordCard}>
        {/* Teacher View with Toggle */}
        <div className={styles.teacherControls}>
          <button 
            className={styles.toggleTeacherView}
            onClick={() => setShowTeacherView(!showTeacherView)}
          >
            {showTeacherView ? "Hide Teacher View" : "Show Teacher View"}
          </button>
        </div>
        
        {/* Teacher Context (Conditional) */}
        {showTeacherView && (
          <div className={styles.teacherContext}>
            <h3>Teacher View: Current Context</h3>
            <p dangerouslySetInnerHTML={{ __html: highlightContextWord() }}></p>
          </div>
        )}
        
        <div className={styles.gameLayout}>
          {/* Left Column - Game Area */}
          <div className={styles.gameArea}>
            <div className={styles.episodeBanner}>
              <p className={styles.episodeNumber}>Episode {storyContext?.episodeNumber || 1}</p>
              <h2 className={styles.episodeTitle}>{storyContext?.title || "The Story Adventure"}</h2>
              <p className={styles.episodeHint}>Remember the story you just read! The answers are in the story.</p>
            </div>
            
            {/* Game Stats */}
            <div className={styles.statsContainer}>
              <div className={styles.statItem}>
                <p className={styles.statLabel}>Story</p>
                <p className={styles.statValue}>{theme.charAt(0).toUpperCase() + theme.slice(1)}</p>
              </div>
              
              <div className={styles.statItem}>
                <p className={styles.statLabel}>Time</p>
                <p className={styles.statValue}>{timeFormatted}</p>
              </div>
            </div>

            {/* Crossword Grid */}
            <div className={styles.gridContainer}>
              {renderCrosswordGrid()}
            </div>

            {/* Selected Word Info and Controls */}
            <div className={styles.classroomControls}>
              {selectedClue && (
                <div className={styles.selectedWordInfo}>
                  <h3 className={styles.selectedWordLabel}>Selected Word: {selectedClue.answer.length} letters</h3>
                  <p className={styles.selectedWordClue}>
                    {isLoadingClues && !cluesMap[selectedClue.answer] 
                      ? "Generating clue..." 
                      : getClueForWord(selectedClue.answer)}
                  </p>
                </div>
              )}
              
              {/* Answer choices for classroom use */}
              {renderAnswerChoices()}
              
              <div className={styles.teacherButtons}>
                <button 
                  className={styles.markSolvedButton}
                  onClick={handleMarkSolved}
                  disabled={!selectedClue || isWordSolved(selectedClue?.answer)}
                >
                  Mark as Solved
                </button>
                
                <button 
                  className={styles.hintButton}
                  onClick={handleShowHint}
                  disabled={!selectedClue || hintsRemaining <= 0}
                >
                  Reveal a Letter ({hintsRemaining} left)
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Clues */}
          <div className={styles.cluesArea}>
            <div className={styles.cluesSection}>
              <h2 className={styles.cluesTitle}>Clues:</h2>
              
              <div>
                {/* Across Clues */}
                <h3 className={styles.clueCategory}>Across:</h3>
                <ul className={styles.clueList}>
                  {renderClueList('across')}
                </ul>
                
                {/* Down Clues */}
                <h3 className={styles.clueCategory}>Down:</h3>
                <ul className={styles.clueList}>
                  {renderClueList('down')}
                </ul>
                
                {/* Smart Hints Button */}
                <button 
                  className={styles.hintsButton}
                  onClick={() => setShowAdaptiveHints(true)}
                  disabled={!selectedClue || hintsRemaining <= 0}
                >
                  Smart Hints ({hintsRemaining} left)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hint popup */}
      {showHint && (
        <motion.div 
          className={styles.hintPopup}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <span className={styles.hintIcon}>💡</span>
          <span className={styles.hintText}>{lastHint}</span>
        </motion.div>
      )}

      {/* Adaptive Hint System Overlay */}
      {showAdaptiveHints && selectedClue && (
        <div className={styles.adaptiveHintOverlay}>
          <AdaptiveHintSystem
            word={selectedClue.answer}
            definition={selectedClue.definition}
            clue={getClueForWord(selectedClue.answer)}
            storyContext={storyContext ? storyContext.text : null}
            previousHints={hintHistory}
            attemptCount={incorrectAttempts[selectedClue.answer] || 0}
            onClose={() => setShowAdaptiveHints(false)}
            onUseHint={handleAdaptiveHint}
          />
        </div>
      )}
    </div>
  );
};

export default GameplayScreen;