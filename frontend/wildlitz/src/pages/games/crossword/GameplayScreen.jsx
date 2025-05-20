// src/pages/games/crossword/GameplayScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../../styles/games/crossword/GameplayScreen.module.css';

/**
 * GameplayScreen component for Crossword Puzzle with proper word connections
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
  
  // Create grid when puzzle changes
  useEffect(() => {
    if (puzzle && puzzle.size) {
      console.log("Creating grid with size:", puzzle.size);
      console.log("Puzzle words:", puzzle.words);
      createProperCrosswordGrid();
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
  
  /**
   * Create a proper crossword grid with words connecting at shared letters
   */
  const createProperCrosswordGrid = () => {
    if (!puzzle || !puzzle.words || puzzle.words.length === 0) {
      console.error("Cannot create grid: puzzle or words missing");
      return;
    }
    
    console.log("Original words:", puzzle.words);
    
    try {
      // Special handling for potential errors in puzzle data
      if (!puzzle.words.every(word => word.answer && typeof word.answer === 'string')) {
        console.error("Invalid word data detected, using fallback grid");
        createFallbackGrid();
        return;
      }
      
      // First, determine proper placement for each word
      const placedWords = findProperWordPlacements(puzzle.words);
      if (!placedWords || placedWords.length === 0) {
        console.error("Failed to place words in grid, using fallback");
        createFallbackGrid();
        return;
      }
      
      // Find grid dimensions
      let maxRow = 0;
      let maxCol = 0;
      
      placedWords.forEach(word => {
        if (word.cells && word.cells.length > 0) {
          word.cells.forEach(cell => {
            maxRow = Math.max(maxRow, cell.row);
            maxCol = Math.max(maxCol, cell.col);
          });
        }
      });
      
      // Add 1 to get grid dimensions (0-based to 1-based)
      const gridHeight = maxRow + 1;
      const gridWidth = maxCol + 1;
      
      console.log(`Created grid with dimensions: ${gridWidth}x${gridHeight}`);
      
      // Initialize empty cells matrix
      const cellMatrix = Array(gridHeight).fill().map(() => Array(gridWidth).fill(null));
      
      // Fill matrix with cell data
      placedWords.forEach(word => {
        if (!word.cells || word.cells.length === 0) return;
        
        word.cells.forEach((cell, index) => {
          const letter = word.answer[index];
          const row = cell.row;
          const col = cell.col;
          
          if (row >= 0 && row < gridHeight && col >= 0 && col < gridWidth) {
            // Check if there's already a letter in this cell (intersection)
            if (cellMatrix[row][col] && cellMatrix[row][col].letter && cellMatrix[row][col].letter !== letter) {
              console.error(`Conflict at cell ${row},${col}: ${cellMatrix[row][col].letter} vs ${letter}`);
            }
            
            // Store letter and words this cell belongs to
            if (!cellMatrix[row][col]) {
              cellMatrix[row][col] = {
                letter,
                words: [{ word: word.answer, direction: word.direction, index }]
              };
            } else {
              cellMatrix[row][col].letter = letter; // Should be the same letter at intersections
              if (!cellMatrix[row][col].words) {
                cellMatrix[row][col].words = [];
              }
              cellMatrix[row][col].words.push({ word: word.answer, direction: word.direction, index });
            }
          }
        });
      });
      
      // Find cell numbering
      const numberedCells = {};
      let currentNumber = 1;
      
      placedWords.forEach(word => {
        if (!word.cells || word.cells.length === 0) return;
        
        const startCell = word.cells[0];
        const key = `${startCell.row}-${startCell.col}`;
        
        if (!numberedCells[key]) {
          numberedCells[key] = currentNumber++;
        }
        
        // Update the word's number property
        word.number = numberedCells[key];
      });
      
      // Create grid cells for rendering
      const cells = [];
      const intersections = {};
      
      for (let row = 0; row < gridHeight; row++) {
        for (let col = 0; col < gridWidth; col++) {
          const cellData = cellMatrix[row][col];
          const key = `${row}-${col}`;
          
          // Check if cell is part of a word
          if (cellData) {
            // Check if this is a numbered cell (start of a word)
            const cellNumber = numberedCells[key] || null;
            
            // Check if this is an intersection
            const isIntersection = cellData.words && cellData.words.length > 1;
            if (isIntersection) {
              intersections[key] = true;
            }
            
            cells.push({
              row,
              col,
              value: '',  // Initially empty, will be filled when solved
              revealed: false,
              number: cellNumber,
              isEmpty: false,
              letter: cellData.letter
            });
          } else {
            // Empty cell (not part of any word)
            cells.push({
              row,
              col,
              value: '',
              revealed: false,
              number: null,
              isEmpty: true
            });
          }
        }
      }
      
      // Update puzzle with new word data (with proper numbers)
      puzzle.words = placedWords;
      
      // Update grid size
      puzzle.size = { width: gridWidth, height: gridHeight };
      
      // Update state
      setGridCells(cells);
      setWordIntersections(intersections);
      
      // Generate clues map
      generateClues();
      
      // If we have solved words, update the grid
      if (solvedWords.length > 0) {
        updateGridWithSolvedWords();
      }
    } catch (error) {
      console.error("Error creating crossword grid:", error);
      // If anything goes wrong, use a simple fallback grid
      createFallbackGrid();
    }
  };
  
  /**
   * Create a simple fallback grid when the main grid creation fails
   */
  const createFallbackGrid = () => {
    console.log("Using fallback grid creation method");
    
    // Create a basic linear grid with separated words
    const placedWords = [];
    const gridCells = [];
    const wordIntersections = {};
    
    if (!puzzle || !puzzle.words) return;
    
    // Place words in a simple grid layout
    let currentRow = 0;
    
    puzzle.words.forEach((word, wordIndex) => {
      const direction = wordIndex % 2 === 0 ? 'across' : 'down';
      const wordNumber = wordIndex + 1;
      
      const cells = [];
      
      if (direction === 'across') {
        // Place horizontally
        for (let i = 0; i < word.answer.length; i++) {
          cells.push({ row: currentRow, col: i });
          
          // Add to grid cells
          gridCells.push({
            row: currentRow,
            col: i,
            value: '',
            revealed: false,
            number: i === 0 ? wordNumber : null,
            isEmpty: false,
            letter: word.answer[i]
          });
        }
        
        currentRow += 2; // Leave a row gap
      } else {
        // Place vertically
        for (let i = 0; i < word.answer.length; i++) {
          cells.push({ row: i, col: currentRow });
          
          // Add to grid cells
          gridCells.push({
            row: i, 
            col: currentRow,
            value: '',
            revealed: false,
            number: i === 0 ? wordNumber : null,
            isEmpty: false,
            letter: word.answer[i]
          });
        }
        
        currentRow += 2; // Leave a column gap
      }
      
      // Update word data
      placedWords.push({
        ...word,
        direction,
        number: wordNumber,
        cells
      });
    });
    
    // Fill gaps with empty cells to create a complete grid
    const maxRow = Math.max(...gridCells.map(cell => cell.row)) + 1;
    const maxCol = Math.max(...gridCells.map(cell => cell.col)) + 1;
    
    // Create empty cells for the complete grid
    for (let row = 0; row < maxRow; row++) {
      for (let col = 0; col < maxCol; col++) {
        // Check if this cell already exists
        if (!gridCells.some(cell => cell.row === row && cell.col === col)) {
          // Add empty cell
          gridCells.push({
            row,
            col,
            value: '',
            revealed: false,
            number: null,
            isEmpty: true
          });
        }
      }
    }
    
    // Update puzzle
    puzzle.words = placedWords;
    puzzle.size = { width: maxCol, height: maxRow };
    
    // Update state
    setGridCells(gridCells);
    setWordIntersections(wordIntersections);
    
    // Generate clues
    generateClues();
    
    // Update grid with solved words
    if (solvedWords.length > 0) {
      updateGridWithSolvedWords();
    }
  };
  
  /**
   * Find optimal placement for words in a crossword grid
   * Words should connect at shared letters, and be placed intelligently
   */
  const findProperWordPlacements = (words) => {
    if (!words || words.length === 0) return [];
    
    // Make a copy of words to avoid mutating the original
    const wordsCopy = JSON.parse(JSON.stringify(words));
    
    // Sort words by length (longest first, to make placement easier)
    wordsCopy.sort((a, b) => b.answer.length - a.answer.length);
    
    // Place first word horizontally in the middle
    const firstWord = wordsCopy[0];
    firstWord.direction = 'across';
    firstWord.cells = [];
    
    const startRow = 4; // Start in the middle
    const startCol = 2; // Start with some margin from the left
    
    for (let i = 0; i < firstWord.answer.length; i++) {
      firstWord.cells.push({ row: startRow, col: startCol + i });
    }
    
    // Keep track of placed words
    const placedWords = [firstWord];
    
    // Try to place each remaining word
    for (let i = 1; i < wordsCopy.length; i++) {
      const wordToPlace = wordsCopy[i];
      const wordLetters = wordToPlace.answer.split('');
      
      // Find if this word shares any letters with placed words
      let bestPlacement = null;
      let bestScore = -1;
      
      // Try each placed word for possible intersections
      for (const placedWord of placedWords) {
        const placedLetters = placedWord.answer.split('');
        
        // Look for shared letters
        for (let placedIdx = 0; placedIdx < placedLetters.length; placedIdx++) {
          for (let newIdx = 0; newIdx < wordLetters.length; newIdx++) {
            // Found a shared letter
            if (placedLetters[placedIdx].toLowerCase() === wordLetters[newIdx].toLowerCase()) {
              // Try to place the new word perpendicular to the placed word at this intersection
              const newDirection = placedWord.direction === 'across' ? 'down' : 'across';
              
              // Calculate starting cell for new word
              let newCells = [];
              
              if (newDirection === 'across') {
                // Starting col is placedCol - newIdx
                const startCol = placedWord.cells[placedIdx].col - newIdx;
                const row = placedWord.cells[placedIdx].row;
                
                // Generate cells for horizontal word
                for (let j = 0; j < wordLetters.length; j++) {
                  newCells.push({ row, col: startCol + j });
                }
              } else {
                // Starting row is placedRow - newIdx
                const startRow = placedWord.cells[placedIdx].row - newIdx;
                const col = placedWord.cells[placedIdx].col;
                
                // Generate cells for vertical word
                for (let j = 0; j < wordLetters.length; j++) {
                  newCells.push({ row: startRow + j, col });
                }
              }
              
              // Check if this placement overlaps with existing words incorrectly
              let isValidPlacement = true;
              const cellsUsed = new Set();
              
              // Check each cell of the new word
              for (let cellIdx = 0; cellIdx < newCells.length; cellIdx++) {
                const cell = newCells[cellIdx];
                const cellKey = `${cell.row}-${cell.col}`;
                
                // Check if this cell is already used
                if (cellsUsed.has(cellKey)) {
                  isValidPlacement = false;
                  break;
                }
                
                // Add this cell to used set
                cellsUsed.add(cellKey);
                
                // Check against all placed words
                for (const existingWord of placedWords) {
                  for (let existingIdx = 0; existingIdx < existingWord.cells.length; existingIdx++) {
                    const existingCell = existingWord.cells[existingIdx];
                    
                    // If coordinates match, check if letter matches
                    if (cell.row === existingCell.row && cell.col === existingCell.col) {
                      // This is an intersection - must have the same letter
                      const existingLetter = existingWord.answer[existingIdx];
                      const newLetter = wordLetters[cellIdx];
                      
                      if (existingLetter.toLowerCase() !== newLetter.toLowerCase()) {
                        isValidPlacement = false;
                        break;
                      }
                    }
                  }
                  if (!isValidPlacement) break;
                }
                if (!isValidPlacement) break;
              }
              
              // Calculate placement score - prioritize intersections and centered placements
              if (isValidPlacement) {
                let score = 10; // Base score for a valid placement
                
                // Prefer more centered placements
                const centerRow = 5;
                const centerCol = 5;
                const rowDist = Math.abs(newCells[0].row - centerRow);
                const colDist = Math.abs(newCells[0].col - centerCol);
                score -= (rowDist + colDist) * 0.1;
                
                // Prefer multiple intersections
                let intersectionCount = 0;
                for (const cell of newCells) {
                  for (const existingWord of placedWords) {
                    for (const existingCell of existingWord.cells) {
                      if (cell.row === existingCell.row && cell.col === existingCell.col) {
                        intersectionCount++;
                      }
                    }
                  }
                }
                score += intersectionCount * 5;
                
                // Update best placement if this is better
                if (score > bestScore) {
                  bestScore = score;
                  bestPlacement = {
                    direction: newDirection,
                    cells: newCells
                  };
                }
              }
            }
          }
        }
      }
      
      if (bestPlacement) {
        // We found a valid intersection
        wordToPlace.direction = bestPlacement.direction;
        wordToPlace.cells = bestPlacement.cells;
        placedWords.push(wordToPlace);
      } else {
        // No valid intersection - place word separately
        const direction = Math.random() > 0.5 ? 'across' : 'down';
        const cells = [];
        
        // Find a free spot
        let row, col;
        let found = false;
        
        // Try several positions
        for (row = 2; row < 12 && !found; row += 2) {
          for (col = 2; col < 12 && !found; col += 2) {
            let validPos = true;
            
            // Check if this position works
            for (let j = 0; j < wordLetters.length; j++) {
              const checkRow = direction === 'across' ? row : row + j;
              const checkCol = direction === 'across' ? col + j : col;
              
              // Check if this position conflicts with any placed word
              for (const placedWord of placedWords) {
                for (const placedCell of placedWord.cells) {
                  if (checkRow === placedCell.row && checkCol === placedCell.col) {
                    validPos = false;
                    break;
                  }
                }
                if (!validPos) break;
              }
              if (!validPos) break;
            }
            
            if (validPos) {
              found = true;
              
              // Create cells for the word
              for (let j = 0; j < wordLetters.length; j++) {
                if (direction === 'across') {
                  cells.push({ row, col: col + j });
                } else {
                  cells.push({ row: row + j, col });
                }
              }
            }
          }
        }
        
        // If we couldn't find a spot, just place it below all existing words
        if (!found) {
          const maxRow = Math.max(...placedWords.flatMap(w => w.cells.map(c => c.row))) + 2;
          const startCol = 2;
          
          wordToPlace.direction = 'across'; // Default to across
          wordToPlace.cells = wordLetters.map((_, j) => ({ 
            row: maxRow, 
            col: startCol + j 
          }));
        } else {
          wordToPlace.direction = direction;
          wordToPlace.cells = cells;
        }
        
        placedWords.push(wordToPlace);
      }
    }
    
    return placedWords;
  };
  
  /**
   * Find available intersections between placed words and remaining words
   */
  const findAvailableIntersections = (placedWords, remainingWords) => {
    const intersections = [];
    
    // For each placed word
    for (const placedWord of placedWords) {
      const placedLetters = placedWord.answer.split('');
      
      // For each remaining word
      for (const remainingWord of remainingWords) {
        const remainingLetters = remainingWord.answer.split('');
        
        // Find shared letters
        for (let i = 0; i < placedLetters.length; i++) {
          for (let j = 0; j < remainingLetters.length; j++) {
            if (placedLetters[i].toLowerCase() === remainingLetters[j].toLowerCase()) {
              // Possible intersection!
              // Direction should be opposite to the placed word
              const direction = placedWord.direction === 'across' ? 'down' : 'across';
              
              // Find the cell coordinates
              const cell = placedWord.cells[i];
              
              intersections.push({
                placedWord: placedWord.answer,
                remainingWord: remainingWord.answer,
                placedWordIndex: i,
                remainingWordIndex: j,
                row: cell.row,
                col: cell.col,
                letter: placedLetters[i],
                direction
              });
            }
          }
        }
      }
    }
    
    return intersections;
  };
  
  /**
   * Place a word at a specific intersection
   */
  const placeWordAtIntersection = (word, intersection) => {
    const cells = [];
    
    // Calculate starting position based on the intersection
    let startRow = intersection.row;
    let startCol = intersection.col;
    
    if (intersection.direction === 'across') {
      // Move left to the start of the word
      startCol -= intersection.remainingWordIndex;
    } else {
      // Move up to the start of the word
      startRow -= intersection.remainingWordIndex;
    }
    
    // Generate cells for the word
    for (let i = 0; i < word.answer.length; i++) {
      if (intersection.direction === 'across') {
        cells.push({ row: startRow, col: startCol + i });
      } else {
        cells.push({ row: startRow + i, col: startCol });
      }
    }
    
    return cells;
  };
  
  /**
   * Check if a word placement overlaps with existing words (at non-intersection points)
   */
  const doesOverlapExistingWords = (cells, placedWords) => {
    // We need to find the word for these cells by looking at the remaining words
    const wordBeingPlaced = Array.from({ length: cells.length }, () => '?');
    
    // Check each cell of the new word
    for (const cell of cells) {
      // Check against all cells of placed words
      for (const placedWord of placedWords) {
        for (const placedCell of placedWord.cells) {
          // If coordinates match, check if the letter matches
          if (cell.row === placedCell.row && cell.col === placedCell.col) {
            // Find the position of this cell in each word
            const newWordIndex = cells.findIndex(c => c.row === cell.row && c.col === cell.col);
            const placedWordIndex = placedWord.cells.findIndex(c => c.row === cell.row && c.col === cell.col);
            
            if (newWordIndex >= 0 && placedWordIndex >= 0) {
              // Get the letter from the placed word
              const placedLetter = placedWord.answer[placedWordIndex];
              
              // This should match at the intersection, but we don't know the new word's letters yet
              // So we'll just mark this as an intersection point
              return false; // Allow intersections for now
            }
          }
        }
      }
    }
    
    return false; // No overlap detected
  };
  
  /**
   * Place a word separately from other words
   */
  const placeWordSeparately = (word, placedWords) => {
    // Find the maximum extents of the current grid
    let maxRow = 0;
    let maxCol = 0;
    let minRow = Infinity;
    let minCol = Infinity;
    
    for (const placedWord of placedWords) {
      for (const cell of placedWord.cells) {
        maxRow = Math.max(maxRow, cell.row);
        maxCol = Math.max(maxCol, cell.col);
        minRow = Math.min(minRow, cell.row);
        minCol = Math.min(minCol, cell.col);
      }
    }
    
    // Choose a placement strategy
    // 1. Place horizontally below existing words with a gap
    // 2. Or place vertically to the right with a gap
    
    const cells = [];
    let direction;
    
    // Randomly choose direction for variety
    if (Math.random() > 0.5) {
      // Place horizontally below
      direction = 'across';
      const startRow = maxRow + 2; // Leave a 1-cell gap
      const startCol = Math.max(minCol, 5); // Try to keep somewhat centered
      
      for (let i = 0; i < word.answer.length; i++) {
        cells.push({ row: startRow, col: startCol + i });
      }
    } else {
      // Place vertically to the right
      direction = 'down';
      const startRow = Math.max(minRow, 5); // Try to keep somewhat centered
      const startCol = maxCol + 2; // Leave a 1-cell gap
      
      for (let i = 0; i < word.answer.length; i++) {
        cells.push({ row: startRow + i, col: startCol });
      }
    }
    
    return { cells, direction };
  };
  
  /**
   * Generate clues for all words
   */
  const generateClues = () => {
    if (!puzzle || !puzzle.words) return;
    
    setIsLoadingClues(true);
    
    try {
      const newCluesMap = {};
      
      // Use clues directly from the puzzle data
      puzzle.words.forEach(word => {
        // Use the clue from puzzle data or generate a suitable one
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
   * Clue generator (more cryptic, doesn't give away answers)
   */
  const generateProperClue = (word, theme) => {
    // Dictionary of clues without directly mentioning the word
    const clueMap = {
      // Jungle themed clues
      "MAP": "Guide that shows you where to go",
      "TREASURE": "Something valuable that might be hidden",
      "PATH": "A way to walk through the jungle",
      "JOURNEY": "A long trip or adventure",
      "COMPASS": "Tool that helps you find north",
      
      // City themed clues
      "BUILDING": "Structure where people live or work",
      "STREET": "Cars drive on this in the city",
      "MUSEUM": "Place to see old and interesting things",
      "PARK": "Green space in the city where people relax",
      "SUBWAY": "Underground train in the city"
    };
    
    // Return specific clue if it exists
    if (clueMap[word]) {
      return clueMap[word];
    }
    
    // Generate more cryptic general clues
    switch (word.toLowerCase()) {
      case 'park':
        return "Green space for city enjoyment";
      case 'building':
        return "Structure with floors and walls";
      case 'museum':
        return "Place to see historical exhibits";
      case 'street':
        return "Urban roadway between buildings";
      case 'subway':
        return "Underground transportation option";
      case 'hall':
        return "Long passage or room in a building";
      case 'path':
        return "Way to walk from here to there";
      default:
        // Generate clues based on word length
        if (word.length <= 3) {
          return `Short ${word.length}-letter ${theme} word`;
        } else if (word.length <= 5) {
          return `${word.length}-letter word found in the story`;
        } else {
          return `Longer word from the story (${word.length} letters)`;
        }
    }
  };
  
  /**
   * Generate answer choices for a clue
   */
  const generateChoicesForClue = (clue) => {
    const correctAnswer = clue.answer;
    
    // Dictionary of related words to use as distractors
    const relatedWordMap = {
      "MAP": ["CAP", "LAP", "NAP"],
      "PATH": ["BATH", "MATH", "PATTY"],
      "TREASURE": ["PLEASURE", "MEASURE", "FEATURE"],
      "COMPASS": ["COMPARE", "COMPOST", "COMPACT"],
      "JOURNEY": ["JOURNAL", "FURNACE", "TOURNEY"],
      "BUILDING": ["BOULDER", "BILLING", "BRIDGING"],
      "PARK": ["MARK", "DARK", "BARK"],
      "STREET": ["STREAK", "STREAM", "STREWN"],
      "MUSEUM": ["MAUSOLEUM", "MEDIUM", "MUSLIM"],
      "SUBWAY": ["SUBWAT", "SUBPAR", "SUNRAY"]
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
   * Update grid with solved words
   */
  const updateGridWithSolvedWords = () => {
    if (!puzzle || !puzzle.words || solvedWords.length === 0) return;
    
    console.log("Updating grid with solved words:", solvedWords);
    
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
              // Use the letter from the word or fallback to a default
              const letterToReveal = idx < word.answer.length ? word.answer[idx] : '';
              
              updatedCells[cellIndex] = {
                ...updatedCells[cellIndex],
                value: letterToReveal,
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
   * Handle word solved in crossword
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
          const letterToReveal = index < correctAnswer.length ? correctAnswer[index] : '';
          
          updatedCells[cellIndex] = {
            ...updatedCells[cellIndex],
            value: letterToReveal,
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
    
    // Check if the puzzle is complete after solving this word
    const allWordsSolved = checkPuzzleCompletion();
    
    // Auto-select the next unsolved clue after a delay
    setTimeout(() => {
      if (!allWordsSolved) {
        const nextClue = findNextUnsolved();
        if (nextClue) {
          setSelectedClue(nextClue);
        }
      }
    }, 800);
  };
  
  /**
   * Check if the entire puzzle is complete
   */
  const checkPuzzleCompletion = () => {
    if (!puzzle || !puzzle.words) return false;
    
    // Create a set of word answers for quick lookup
    const solvedWordsSet = new Set(solvedWords.map(w => w.word.toUpperCase()));
    
    // Check if all words in the puzzle are solved
    const allSolved = puzzle.words.every(word => solvedWordsSet.has(word.answer.toUpperCase()));
    
    // If all words are solved, trigger completion feedback
    if (allSolved) {
      console.log("PUZZLE COMPLETE! All words solved.");
      // Show special completion feedback
      setFeedback({
        type: "success",
        message: "Congratulations! You've completed the crossword puzzle!"
      });
      
      // Stop timer and move to summary screen
      if (typeof timerActive !== 'undefined') {
        setTimeout(() => {
          // This will likely be handled in the parent component via detecting when all words are solved
          console.log("Puzzle is complete, moving to summary screen...");
        }, 1500);
      }
    }
    
    return allSolved;
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
   * Handle showing a hint by revealing a random letter
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
   * Render crossword grid with proper letter sharing
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
      gap: '2px',
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
          
          // For color differentiation: across words get yellow, down words get green
          // If it's an intersection, it depends on which direction is selected
          let cellColor = 'default';
          
          // For each cell, find which words it belongs to
          const acrossWord = puzzle.words.find(word => 
            word.direction === 'across' && 
            word.cells && 
            word.cells.some(c => c.row === cell.row && c.col === cell.col)
          );
          
          const downWord = puzzle.words.find(word => 
            word.direction === 'down' && 
            word.cells && 
            word.cells.some(c => c.row === cell.row && c.col === cell.col)
          );
          
          // Set colors based on word direction
          if (acrossWord && downWord) {
            // Intersection cell
            if (selectedClue && selectedClue.direction === 'across' && 
                acrossWord.number === selectedClue.number) {
              cellColor = 'across';
            } else if (selectedClue && selectedClue.direction === 'down' && 
                     downWord.number === selectedClue.number) {
              cellColor = 'down';
            } else {
              cellColor = 'intersection';
            }
          } else if (acrossWord) {
            cellColor = 'across';
          } else if (downWord) {
            cellColor = 'down';
          }
          
          // Check if this cell is solved in any word
          const isSolvedAcross = acrossWord && 
            solvedClues[`across-${acrossWord.number}`];
          
          const isSolvedDown = downWord && 
            solvedClues[`down-${downWord.number}`];
          
          const isSolved = isSolvedAcross || isSolvedDown;
          
          return (
            <div 
              key={`${cell.row}-${cell.col}`} 
              className={`
                ${styles.cell}
                ${isSelected ? styles.selectedCell : ''} 
                ${cell.revealed ? styles.solvedCell : ''} 
                ${isIntersection ? styles.intersectionCell : ''}
                ${cellColor === 'across' ? styles.acrossCell : ''}
                ${cellColor === 'down' ? styles.downCell : ''}
              `}
              onClick={() => {
                // Find word that this cell belongs to and select it
                let wordToSelect;
                
                if (selectedClue && selectedClue.direction === 'across' && downWord) {
                  // If we already have a selected across word and this cell is in a down word,
                  // select the down word
                  wordToSelect = downWord;
                } else if (selectedClue && selectedClue.direction === 'down' && acrossWord) {
                  // If we already have a selected down word and this cell is in an across word,
                  // select the across word
                  wordToSelect = acrossWord;
                } else if (acrossWord) {
                  // Prioritize across word if available
                  wordToSelect = acrossWord;
                } else if (downWord) {
                  // Otherwise use down word
                  wordToSelect = downWord;
                }
                
                if (wordToSelect) handleSelectClue(wordToSelect);
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
              
              <div className={styles.statItem}>
                <p className={styles.statLabel}>Hints</p>
                <p className={styles.statValue}>{hintsRemaining}</p>
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
              <div className={styles.answerChoices}>
                <h3 className={styles.choicesTitle}>Answer Choices:</h3>
                <div className={styles.choicesList}>
                  {answerChoices.map((choice, index) => (
                    <button 
                      key={index} 
                      className={`${styles.choiceButton} ${selectedAnswer === choice ? styles.selectedChoice : ''}`}
                      onClick={() => handleSelectAnswer(choice)}
                      disabled={selectedClue ? isWordSolved(selectedClue.answer) : true}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
                
                {selectedAnswer && selectedClue && !isWordSolved(selectedClue.answer) && (
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
              
              <div className={styles.teacherButtons}>
                <button 
                  className={styles.markSolvedButton}
                  onClick={handleMarkSolved}
                  disabled={!selectedClue || isWordSolved(selectedClue?.answer)}
                >
                  Mark as Solved
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Clues */}
          <div className={styles.cluesArea}>
            <div className={styles.cluesSection}>
              <h2 className={styles.cluesTitle}>Clues:</h2>
              
              <button 
                className={styles.hintButton}
                onClick={handleShowHint}
                disabled={!selectedClue || hintsRemaining <= 0}
              >
                <span className={styles.hintButtonIcon}>💡</span>
                Reveal a Letter ({hintsRemaining} left)
              </button>
              
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hint popup */}
      {showHint && (
        <div className={styles.hintPopup}>
          <span className={styles.hintIcon}>💡</span>
          <span className={styles.hintText}>{lastHint}</span>
        </div>
      )}

    </div>
  );
};

export default GameplayScreen;