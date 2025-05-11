// src/pages/games/crossword/CrosswordGame.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../../styles/games/crossword/CrosswordGame.module.css';

// Import game screens
import IntroScreen from './IntroScreen';
import GameplayScreen from './GameplayScreen';
import SentenceBuilderScreen from './SentenceBuilderScreen';
import SummaryScreen from './SummaryScreen';

// Import mock data
import { THEMES, CROSSWORD_PUZZLES } from '../../../mock/crosswordGameData';

/**
 * Main CrosswordGame component that manages game state and flow
 */
const CrosswordGame = () => {
  // Game states: 'intro', 'gameplay', 'sentences', 'summary'
  const [gameState, setGameState] = useState('intro');
  
  // Game configuration
  const [gameConfig, setGameConfig] = useState({
    theme: 'animals',
    difficulty: 'easy',
    puzzleId: null
  });
  
  // Game data
  const [puzzleData, setPuzzleData] = useState(null);
  const [processedGrid, setProcessedGrid] = useState(null);
  const [currentClues, setCurrentClues] = useState({ across: [], down: [] });
  
  // Game progress
  const [solvedWords, setSolvedWords] = useState([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [gameScore, setGameScore] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  
  // Selected words for sentence building
  const [selectedWords, setSelectedWords] = useState([]);
  
  /**
   * Start a new game with the given configuration
   */
  const handleStartGame = (config) => {
    setGameConfig(config);
    
    // Find a puzzle that matches the config
    const puzzles = CROSSWORD_PUZZLES[config.theme] || [];
    const matchingPuzzles = puzzles.filter(p => p.difficulty === config.difficulty);
    
    if (matchingPuzzles.length === 0) {
      // Fall back to any puzzle from the theme
      if (puzzles.length > 0) {
        loadPuzzle(puzzles[0]);
      } else {
        // If no puzzles available, show error (in a real app)
        console.error("No puzzles available for this theme.");
        return;
      }
    } else {
      // Choose a random puzzle from matching puzzles
      const randomIndex = Math.floor(Math.random() * matchingPuzzles.length);
      loadPuzzle(matchingPuzzles[randomIndex]);
    }
    
    // Reset game state
    setSolvedWords([]);
    setCurrentProgress(0);
    setGameScore(0);
    setTimeElapsed(0);
    setSelectedWords([]);
    
    // Start the game
    setGameState('gameplay');
    setTimerActive(true);
  };
  
  /**
   * Load a puzzle and prepare it for gameplay
   */
  const loadPuzzle = (puzzle) => {
    if (!puzzle) {
      console.error("No valid puzzle data found");
      return;
    }
    
    setPuzzleData(puzzle);
    
    // Process the grid data to convert from 1D to 2D
    const gridWidth = puzzle.size?.width || 5;
    const gridHeight = puzzle.size?.height || 5;
    
    // Check if grid data exists
    if (!puzzle.grid || !Array.isArray(puzzle.grid)) {
      console.error("Invalid grid data in puzzle");
      // Create a placeholder grid
      const placeholderGrid = Array(gridHeight).fill().map(() => 
        Array(gridWidth).fill().map(() => ({ value: null, number: null, userInput: null, isCorrect: false }))
      );
      setProcessedGrid(placeholderGrid);
    } else {
      const processedGrid = processGrid(puzzle.grid, gridWidth, gridHeight);
      setProcessedGrid(processedGrid);
    }
    
    // Process clues
    if (!puzzle.words || !Array.isArray(puzzle.words)) {
      console.error("Invalid words data in puzzle");
      setCurrentClues({ across: [], down: [] });
    } else {
      const { across, down } = processClues(puzzle.words);
      setCurrentClues({ across, down });
    }
  };
  
  /**
   * Process grid data from 1D to 2D
   */
  const processGrid = (gridData, width, height) => {
    // Create a 2D grid
    const grid = Array(height).fill().map(() => 
      Array(width).fill().map(() => ({ value: null, number: null, userInput: null, isCorrect: false }))
    );
    
    // Fill in the grid based on 1D array
    for (let i = 0; i < gridData.length; i++) {
      const row = Math.floor(i / width);
      const col = i % width;
      
      if (row < height && col < width) {
        grid[row][col] = {
          ...gridData[i],
          userInput: null,
          isCorrect: false
        };
      }
    }
    
    return grid;
  };
  
  /**
   * Process clues into across and down categories
   */
  const processClues = (words) => {
    const across = [];
    const down = [];
    
    words.forEach(word => {
      if (word.direction === 'across') {
        across.push(word);
      } else if (word.direction === 'down') {
        down.push(word);
      }
    });
    
    // Sort clues by number
    across.sort((a, b) => a.number - b.number);
    down.sort((a, b) => a.number - b.number);
    
    return { across, down };
  };
  
  /**
   * Handle word solved event
   */
  const handleWordSolved = (word) => {
    // Add word to solved words
    setSolvedWords(prev => {
      // Avoid duplicates
      if (prev.some(w => w.number === word.number && w.direction === word.direction)) {
        return prev;
      }
      return [...prev, word];
    });
    
    // Update progress
    const totalWords = (currentClues.across.length + currentClues.down.length);
    const newProgress = Math.round(((solvedWords.length + 1) / totalWords) * 100);
    setCurrentProgress(newProgress);
    
    // Update score - award more points for longer words
    setGameScore(prev => prev + (word.answer.length * 10));
    
    // Check if all words are solved
    if (solvedWords.length + 1 >= totalWords) {
      // Game complete - move to sentence builder
      setTimerActive(false);
      
      // Choose words for sentence building
      const wordsForSentences = selectWordsForSentences();
      setSelectedWords(wordsForSentences);
      
      setTimeout(() => {
        setGameState('sentences');
      }, 1500);
    }
  };
  
  /**
   * Select words for sentence building screen
   */
  const selectWordsForSentences = () => {
    // In a real implementation, this would select words based on educational value
    // For this example, select up to 5 words
    const allWords = [...currentClues.across, ...currentClues.down];
    
    // Sort by word length (prefer longer words)
    const sortedWords = [...allWords].sort((a, b) => b.answer.length - a.answer.length);
    
    // Take the top 5 (or fewer if there aren't 5)
    return sortedWords.slice(0, Math.min(5, sortedWords.length));
  };
  
  /**
   * Handle sentence building completion
   */
  const handleSentencesComplete = () => {
    setGameState('summary');
  };
  
  /**
   * Handle playing again
   */
  const handlePlayAgain = () => {
    setGameState('intro');
  };
  
  /**
   * Timer effect
   */
  useEffect(() => {
    let interval;
    
    if (timerActive) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive]);
  
  /**
   * Format time for display
   */
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  return (
    <div className={styles.gameContainer}>
      <div className={styles.gameContent}>
        <AnimatePresence mode="wait">
          {gameState === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.screenContainer}
            >
              <IntroScreen 
                themes={THEMES}
                onStartGame={handleStartGame}
              />
            </motion.div>
          )}
          
          {gameState === 'gameplay' && processedGrid && puzzleData && (
            <motion.div
              key="gameplay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.screenContainer}
            >
              <GameplayScreen 
                grid={processedGrid}
                clues={currentClues}
                theme={THEMES[gameConfig.theme].name}
                timer={formatTime(timeElapsed)}
                onWordSolved={handleWordSolved}
                solvedWords={solvedWords}
                puzzleData={puzzleData}
              />
            </motion.div>
          )}
          
          {gameState === 'gameplay' && (!processedGrid || !puzzleData) && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.screenContainer}
            >
              <div className={styles.loadingScreen}>
                <h2>Loading Crossword Puzzle...</h2>
                <p>Preparing your {THEMES[gameConfig.theme].name} themed puzzle</p>
              </div>
            </motion.div>
          )}
          
          {gameState === 'sentences' && (
            <motion.div
              key="sentences"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.screenContainer}
            >
              <SentenceBuilderScreen 
                words={selectedWords}
                onComplete={handleSentencesComplete}
              />
            </motion.div>
          )}
          
          {gameState === 'summary' && (
            <motion.div
              key="summary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.screenContainer}
            >
              <SummaryScreen 
                words={selectedWords}
                score={gameScore}
                timeElapsed={formatTime(timeElapsed)}
                solvedWords={solvedWords.length}
                totalWords={currentClues.across.length + currentClues.down.length}
                theme={THEMES[gameConfig.theme].name}
                onPlayAgain={handlePlayAgain}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CrosswordGame;