// src/pages/games/crossword/GameplayScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdaptiveHintSystem from '../../../components/crossword/AdaptiveHintSystem';
import styles from '../../../styles/games/crossword/GameplayScreen.module.css';

/**
 * GameplayScreen component for Crossword Puzzle
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
  const [wordIntersections, setWordIntersections] = useState({}); // Track cell intersections
  
  // Local state to track solved clues between navigations
  const [solvedClues, setSolvedClues] = useState({});
  
  // Create grid immediately when puzzle changes
  useEffect(() => {
    if (puzzle && puzzle.size) {
      console.log("Creating grid with size:", puzzle.size);
      createGrid();
      findWordIntersections();
    }
  }, [puzzle]);
  
  // Update grid when solvedWords changes
  useEffect(() => {
    if (puzzle && solvedWords.length > 0) {
      console.log("Updating grid with solved words:", solvedWords);
      updateGridWithSolvedWords();
    }
  }, [solvedWords]);







const generateCellsForWord = (word, gridSize, existingWords = []) => {
  if (word.cells && Array.isArray(word.cells)) {
    return word.cells; // Return existing cells if present
  }
  
  const answer = word.answer.toUpperCase();
  const cells = [];
  const maxRow = gridSize.height - 1;
  const maxCol = gridSize.width - 1;
  
  // Create a more organized layout based on word number and direction
  let startRow, startCol;
  
  if (word.direction === 'across') {
    // Place across words along the left side, spaced vertically
    startRow = Math.min(word.number * 2, maxRow);
    startCol = 0; // Start from the left edge
  } else { // down
    // Place down words along the top, spaced horizontally
    startRow = 0; // Start from the top
    startCol = Math.min(word.number * 2, maxCol);
  }
  
  // For words with the same number but different directions, try to create proper intersections
  if (existingWords.length > 0) {
    // Find potential intersection points with existing words
    for (const existingWord of existingWords) {
      // Only try to intersect words with different directions
      if (existingWord.direction !== word.direction) {
        for (let i = 0; i < answer.length; i++) {
          const letterToIntersect = answer[i];
          
          // Find the same letter in the existing word
          for (let j = 0; j < existingWord.answer.length; j++) {
            if (existingWord.answer[j] === letterToIntersect) {
              // Create an intersection at this point
              if (word.direction === 'across') {
                startRow = existingWord.cells[j].row;
                startCol = existingWord.cells[j].col - i;
              } else { // down
                startRow = existingWord.cells[j].row - i;
                startCol = existingWord.cells[j].col;
              }
              
              // Validate the position to make sure it doesn't go out of bounds
              if (startRow < 0 || startCol < 0) continue;
              if (word.direction === 'across' && startCol + answer.length > maxCol) continue;
              if (word.direction === 'down' && startRow + answer.length > maxRow) continue;
              
              // Found a valid intersection, break out of the inner loop
              break;
            }
          }
          
          // If we found a valid intersection, break out of the outer loop
          if ((word.direction === 'across' && startRow !== 0) || 
              (word.direction === 'down' && startCol !== 0)) {
            break;
          }
        }
      }
      
      // If we found a valid intersection, break out of the existingWords loop
      if ((word.direction === 'across' && startRow !== 0) || 
          (word.direction === 'down' && startCol !== 0)) {
        break;
      }
    }
  }
  
  // Generate cells for each letter in the word
  for (let i = 0; i < answer.length; i++) {
    if (word.direction === 'across') {
      cells.push({
        row: startRow,
        col: startCol + i
      });
    } else { // down
      cells.push({
        row: startRow + i,
        col: startCol
      });
    }
  }
  
  return cells;
};





  
  // Find all cells where words intersect
 const findWordIntersections = () => {
  if (!puzzle || !puzzle.words) return;
  
  const intersections = {};
  const processedWords = [];
  
  // Process words in order to build proper intersections
  if (puzzle.size) {
    // Sort words by direction and number for better processing
    // Process "across" words first, then "down" words
    const sortedWords = [...puzzle.words].sort((a, b) => {
      if (a.direction === b.direction) return a.number - b.number;
      return a.direction === 'across' ? -1 : 1;
    });
    
    // Generate cells for each word
    sortedWords.forEach(word => {
      if (!word.cells || !Array.isArray(word.cells)) {
        console.log(`Generating cells for word: ${word.answer}`);
        word.cells = generateCellsForWord(word, puzzle.size, processedWords);
        processedWords.push(word);
      }
    });
  }
  
  // Continue with the original intersection finding logic
  puzzle.words.forEach(word => {
    if (!word.cells || !Array.isArray(word.cells)) {
      console.error("Word is missing cells array:", word);
      return;
    }
  });
  
  // For each pair of words
  for (let i = 0; i < puzzle.words.length; i++) {
    for (let j = i + 1; j < puzzle.words.length; j++) {
      const word1 = puzzle.words[i];
      const word2 = puzzle.words[j];
      
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
  
  // Create the grid cells
  const createGrid = () => {
  if (!puzzle || !puzzle.size) {
    console.error("Cannot create grid: puzzle or size missing");
    return;
  }
  
  // Process words to generate cells in the correct order
  const processedWords = [];
  
  // Sort words by direction and number for better layout
  const sortedWords = [...puzzle.words].sort((a, b) => {
    if (a.direction === b.direction) return a.number - b.number;
    return a.direction === 'across' ? -1 : 1;
  });
  
  // Generate cells for words that don't have them
  sortedWords.forEach(word => {
    if (!word.cells || !Array.isArray(word.cells)) {
      word.cells = generateCellsForWord(word, puzzle.size, processedWords);
      processedWords.push(word);
    } else {
      processedWords.push(word);
    }
  });
  
  // Create grid with appropriate size
  const { width, height } = puzzle.size;
  console.log(`Creating ${width}x${height} grid`);
  
  // Create empty grid
  const cells = [];
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      // Find if this cell has a number
      const cellWithNumber = puzzle.words.find(word => 
        word.cells && word.cells.length > 0 && 
        word.cells[0].row === row && word.cells[0].col === col
      );
      
      // Check if cell should be empty
      const isEmptyCell = !puzzle.words.some(word => 
        word.cells && word.cells.some(cell => 
          cell.row === row && cell.col === col
        )
      );
      
      cells.push({
        row,
        col,
        value: '',
        revealed: false,
        number: cellWithNumber?.number || null,
        isEmpty: isEmptyCell
      });
    }
  }
  
  setGridCells(cells);
  console.log("Grid created with", cells.length, "cells");
  
  // If we have solved words, update the grid
  if (solvedWords.length > 0) {
    updateGridWithSolvedWords();
  }
};
  
  // Update grid with solved words
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
      if (solvedWordsMap[word.answer.toUpperCase()]) {
        console.log("Found solved word:", word.answer);
        
        // Mark this word as solved in our tracking
        setSolvedClues(prev => ({
          ...prev,
          [`${word.direction}-${word.number}`]: true
        }));
        
        // Reveal all cells for this word
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
    });
    
    setGridCells(updatedCells);
  };
  
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
      generateChoicesForClue(selectedClue);
      setSelectedAnswer(null);
      setFeedback(null);
    }
  }, [selectedClue]);
  
  // Function to generate choices for a clue
  const generateChoicesForClue = (clue) => {
    const correctAnswer = clue.answer;
    
    // Simple algorithm to generate fake but plausible answers
    const generateFakeAnswer = (real) => {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let fake = real.split('');
      
      // Change 1-2 letters
      for (let i = 0; i < Math.min(2, real.length); i++) {
        const pos = Math.floor(Math.random() * fake.length);
        fake[pos] = letters[Math.floor(Math.random() * letters.length)];
      }
      
      return fake.join('');
    };
    
    // Create 3 fake options
    let choices = [correctAnswer];
    while (choices.length < 4) {
      const fake = generateFakeAnswer(correctAnswer);
      if (!choices.includes(fake) && fake !== correctAnswer) {
        choices.push(fake);
      }
    }
    
    // Shuffle the array
    choices = choices.sort(() => Math.random() - 0.5);
    
    // Set the choices in state
    setAnswerChoices(choices);
  };
  
  // Check if a word has been solved
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
  
  // Handle clue selection
  const handleSelectClue = (clue) => {
    if (clue) {
      console.log("Selecting clue:", clue);
      setSelectedClue(clue);
    }
  };
  
  // Get context sentence for teacher view based on selected clue
  const getContextForClue = () => {
    if (!storyContext || !storyContext.text || !selectedClue) return "";
    
    // Split text into sentences
    const sentences = storyContext.text.split(/[.!?]/).filter(s => s.trim()).map(s => s.trim() + ".");
    
    // Try to find a sentence containing the selected clue answer
    const answer = selectedClue.answer.toLowerCase();
    const matchingSentence = sentences.find(sentence => 
      sentence.toLowerCase().includes(answer)
    );
    
    return matchingSentence || sentences[0]; // Return matching or first sentence
  };
  
  // Mark word as solved when answer is correct
  const handleMarkSolved = () => {
    if (!selectedClue) return;
    
    const correctAnswer = selectedClue.answer.toUpperCase();
    console.log("Marking as solved:", correctAnswer);
    
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
        selectedClue.example || `The ${correctAnswer.toLowerCase()} is an interesting word.`
      );
    }
    
    // Reset states
    setSelectedAnswer(null);
    setFeedback({ type: 'success', message: 'Correct! Word added to the crossword.' });
    
    // Auto-select the next unsolved clue after a delay
    const nextClue = findNextUnsolved();
    if (nextClue) {
      setTimeout(() => {
        setSelectedClue(nextClue);
      }, 800);
    }
  };

  // Handle answer selection
  const handleSelectAnswer = (choice) => {
    setSelectedAnswer(choice);
    setFeedback(null); // Reset feedback when new answer is selected
  };

  // Handle answer submission
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

  // Render answer choices from state
  const renderAnswerChoices = () => {
    if (!selectedClue || answerChoices.length === 0) return null;
    
    // Check if the current clue is already solved
    const key = `${selectedClue.direction}-${selectedClue.number}`;
    const isSolved = solvedClues[key] || 
      solvedWords.some(word => word.word.toUpperCase() === selectedClue.answer.toUpperCase());
    
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

  // Find the next unsolved clue
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
  
  // Highlight the selected word in the context
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
  
  // Handle showing a hint
  const handleShowHint = () => {
    if (hintsRemaining > 0 && selectedClue) {
      setHintsRemaining(prev => prev - 1);
      setShowHint(true);
      setLastHint(`The word starts with "${selectedClue.answer[0]}"`);
      
      // Hide hint after 3 seconds
      setTimeout(() => {
        setShowHint(false);
      }, 3000);
    }
  };
  
  // Handle adaptive hint
  const handleAdaptiveHint = (hint) => {
    setHintHistory(prev => [...prev, hint]);
    
    // Display the hint as a popup
    setShowHint(true);
    setLastHint(hint.text);
    
    // Hide hint after 3 seconds
    setTimeout(() => {
      setShowHint(false);
    }, 3000);
  };
  
  // Render crossword grid
  const renderCrosswordGrid = () => {
    if (!puzzle || !puzzle.size || gridCells.length === 0) {
      console.warn("Cannot render grid - missing data");
      return <div className={styles.emptyGridMessage}>Loading crossword grid...</div>;
    }
    
    const { width, height } = puzzle.size;
    
    // Ensure the grid is rendered with proper dimensions
    const gridStyle = {
  gridTemplateColumns: `repeat(${width}, 45px)`,
  gridTemplateRows: `repeat(${height}, 45px)`,
  backgroundColor: '#f9f9f9', // Change from black to a light, friendly background
  padding: '20px',
  borderRadius: '15px',
};
    
    return (
      <div className={styles.crosswordGrid} style={gridStyle}>
        {gridCells.map((cell, index) => {
          // Skip empty cells
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

  // Check if all clues of a certain direction are solved
  const areAllCluesSolved = (direction) => {
    if (!puzzle || !puzzle.words) return false;
    
    const directionClues = puzzle.words.filter(word => word.direction === direction);
    return directionClues.every(clue => {
      const key = `${clue.direction}-${clue.number}`;
      return solvedClues[key] || 
        solvedWords.some(word => word.word.toUpperCase() === clue.answer.toUpperCase());
    });
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
              <h2 className={styles.episodeTitle}>{storyContext?.title || "The Space Academy"}</h2>
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
                  <p className={styles.selectedWordClue}>{selectedClue.clue}</p>
                </div>
              )}
              
              {/* Answer choices for classroom use */}
              {renderAnswerChoices()}
              
              <div className={styles.teacherButtons}>
                <button 
                  className={styles.markSolvedButton}
                  onClick={handleMarkSolved}
                  disabled={!selectedClue || isWordSolved(selectedClue.answer)}
                >
                  Mark as Solved
                </button>
                
                <button 
                  className={styles.hintButton}
                  onClick={handleShowHint}
                  disabled={!selectedClue || hintsRemaining <= 0}
                >
                  Show Hint ({hintsRemaining} left)
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
                  {puzzle?.words?.filter(word => word.direction === 'across').map(clue => {
                    const key = `${clue.direction}-${clue.number}`;
                    const isSolved = solvedClues[key] || 
                      solvedWords.some(word => word.word.toUpperCase() === clue.answer.toUpperCase());
                    
                    return (
                      <li 
                        key={`across-${clue.number}`}
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
                        <span className={styles.clueText}>{clue.clue}</span>
                      </li>
                    );
                  })}
                </ul>
                
                {/* Down Clues */}
                <h3 className={styles.clueCategory}>Down:</h3>
                <ul className={styles.clueList}>
                  {puzzle?.words?.filter(word => word.direction === 'down').map(clue => {
                    const key = `${clue.direction}-${clue.number}`;
                    const isSolved = solvedClues[key] || 
                      solvedWords.some(word => word.word.toUpperCase() === clue.answer.toUpperCase());
                    
                    return (
                      <li 
                        key={`down-${clue.number}`}
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
                        <span className={styles.clueText}>{clue.clue}</span>
                      </li>
                    );
                  })}
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
            clue={selectedClue.clue}
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