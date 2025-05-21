// src/pages/games/crossword/CrosswordGame.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../../styles/games/crossword/CrosswordGame.module.css';

// Import game screens
import StoryScreen from './StoryScreen';
import GameplayScreen from './GameplayScreen';
import SummaryScreen from './SummaryScreen';
import SentenceBuilderScreen from './SentenceBuilderScreen';
import StoryGeneratorScreen from './StoryGeneratorScreen';

// Import AI components
import AIReadingCoach from '../../../components/crossword/AIReadingCoach';
import AdaptiveHintSystem from '../../../components/crossword/AdaptiveHintSystem';

// Import mock data
import { STORY_ADVENTURES, STORY_PUZZLES } from '../../../mock/storyData';

/**
 * Main Crossword Puzzle Game component that manages game state and flow
 * Modified to support multiple puzzles per episode
 */
const CrosswordGame = () => {
  // Game states: 'intro', 'story', 'gameplay', 'summary', 'sentence-builder', 'generate-story'
  // Set initial state to 'generate-story' to bypass intro screen
  const [gameState, setGameState] = useState('generate-story');
  
  // Game configuration
  const [gameConfig, setGameConfig] = useState({
    storyMode: true,
    adventureId: 'jungle_quest'
  });
  
  // Story tracking
  const [currentEpisode, setCurrentEpisode] = useState(0);
  const [storyProgress, setStoryProgress] = useState({});
  
  // Game data
  const [gameStories, setGameStories] = useState({
    ...STORY_ADVENTURES // Default stories
  });
  const [gamePuzzles, setGamePuzzles] = useState({
    ...STORY_PUZZLES // Default puzzles
  });
  const [currentStorySegment, setCurrentStorySegment] = useState(null);
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [solvedWords, setSolvedWords] = useState([]);
  const [timeSpent, setTimeSpent] = useState(0);
  
  // Multiple puzzles support
  const [availablePuzzles, setAvailablePuzzles] = useState([]);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  
  // Reading coach state
  const [showReadingCoach, setShowReadingCoach] = useState(false);
  
  // Timer
  const [timerActive, setTimerActive] = useState(false);
  
  // Start timer when in gameplay mode
  useEffect(() => {
    let timer;
    if (timerActive && gameState === 'gameplay') {
      timer = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timerActive, gameState]);
  
  // Load multiple puzzles when story segment changes
  useEffect(() => {
    if (currentStorySegment) {
      // Get primary puzzle ID
      const primaryPuzzleId = currentStorySegment.crosswordPuzzleId;
      
      // Get additional puzzle IDs
      const additionalPuzzleIds = currentStorySegment.additionalPuzzleIds || [];
      
      // Combine all puzzle IDs
      const allPuzzleIds = [primaryPuzzleId, ...additionalPuzzleIds].filter(Boolean);
      setAvailablePuzzles(allPuzzleIds);
      
      // Load the first puzzle
      setCurrentPuzzleIndex(0);
      if (allPuzzleIds.length > 0) {
        const puzzleData = gamePuzzles[allPuzzleIds[0]];
        setCurrentPuzzle(puzzleData);
      }
      
      // Reset game state for a new story segment
      setSolvedWords([]);
      setTimeSpent(0);
    }
  }, [currentStorySegment, gamePuzzles]);
  
  /**
   * Handle changing between available puzzles
   */
  const handleChangePuzzle = (index) => {
    if (index >= 0 && index < availablePuzzles.length) {
      setCurrentPuzzleIndex(index);
      const puzzleId = availablePuzzles[index];
      const puzzleData = gamePuzzles[puzzleId];
      setCurrentPuzzle(puzzleData);
      
      // Reset game state for the new puzzle
      setSolvedWords([]);
      setTimeSpent(0);
    }
  };
  
  /**
   * Handle starting the game with selected configuration
   */
  const handleStartGame = (config) => {
    setGameConfig(config);
    
    // Always story mode in this version
    const adventure = gameStories[config.adventureId];
    const firstEpisode = adventure.episodes[0];
    setCurrentStorySegment(firstEpisode);
    setCurrentEpisode(1);
    
    // Load corresponding puzzle
    const puzzleData = gamePuzzles[firstEpisode.crosswordPuzzleId];
    setCurrentPuzzle(puzzleData);
    
    // Move to story screen
    setGameState('story');
    
    // Reset game state
    setSolvedWords([]);
    setTimeSpent(0);
  };
  
  /**
   * Handle newly generated story
   */
  const handleStoryGenerated = (data) => {
    // Add the new story to the available stories
    const newStories = {
      ...gameStories,
      [data.story.id]: data.story
    };
    
    setGameStories(newStories);
    
    // Add the new puzzles to the available puzzles
    const newPuzzles = {
      ...gamePuzzles,
      ...data.puzzles
    };
    
    setGamePuzzles(newPuzzles);
    
    // Configure game to use the new story
    setGameConfig({
      storyMode: true,
      adventureId: data.story.id
    });
    
    // Move to story screen directly with the first episode
    const firstEpisode = data.story.episodes[0];
    setCurrentStorySegment(firstEpisode);
    setCurrentEpisode(1);
    
    // Load corresponding puzzle
    const puzzleData = data.puzzles[firstEpisode.crosswordPuzzleId];
    setCurrentPuzzle(puzzleData);
    
    // Reset game state
    setSolvedWords([]);
    setTimeSpent(0);
    
    // Go directly to story screen
    setGameState('story');
  };
  
  /**
   * Handle moving from story to puzzle
   */
  const handleContinueToPuzzle = () => {
    setTimerActive(true);
    setGameState('gameplay');
  };
  
  /**
   * Toggle reading coach visibility
   */
  const toggleReadingCoach = () => {
    setShowReadingCoach(prev => !prev);
  };
  
  /**
   * Get words that will appear in the puzzle from story
   * Updated to collect words from all episodes
   */
  const getWordsFromPuzzle = () => {
    if (!currentPuzzle) return [];
    
    // For the current puzzle, get all words
    return currentPuzzle.words.map(word => word.answer);
  };
  
  /**
   * Get ALL vocabulary words across ALL episodes in the current adventure
   * Used for highlighting words in the story text
   */
  const getAllVocabularyWords = () => {
    if (!gameStories || !gameConfig || !gameConfig.adventureId) return [];
    
    const adventure = gameStories[gameConfig.adventureId];
    if (!adventure || !adventure.episodes) return [];
    
    const allWords = [];
    
    // Go through each episode
    adventure.episodes.forEach(episode => {
      // Get all puzzles for this episode
      const puzzleId = episode.crosswordPuzzleId;
      const additionalIds = episode.additionalPuzzleIds || [];
      const allPuzzleIds = [puzzleId, ...additionalIds].filter(Boolean);
      
      // Go through each puzzle
      allPuzzleIds.forEach(id => {
        const puzzle = gamePuzzles[id];
        if (puzzle && puzzle.words) {
          // Add each word from this puzzle
          puzzle.words.forEach(word => {
            if (!allWords.includes(word.answer)) {
              allWords.push(word.answer);
            }
          });
        }
      });
    });
    
    return allWords;
  };
  
  /**
   * Handle word solved in crossword
   */
  const handleWordSolved = (word, definition, example) => {
    console.log("Word solved:", word);
    
    // Check if word is already in solvedWords to avoid duplicates
    if (!solvedWords.some(solved => solved.word === word)) {
      // Add to solved words
      setSolvedWords(prev => [
        ...prev, 
        {
          word,
          definition,
          example,
          timestamp: new Date()
        }
      ]);
    } else {
      console.log("Word already solved, skipping add:", word);
    }
    
    // Check if puzzle is complete
    if (currentPuzzle && solvedWords.length + 1 >= currentPuzzle.words.length) {
      // Stop timer
      setTimerActive(false);
      
      // Move to summary screen after a short delay
      setTimeout(() => {
        setGameState('summary');
      }, 1000);
    }
  };
  
  /**
   * Handle proceeding to next episode
   */
  const handleNextEpisode = () => {
    const adventure = gameStories[gameConfig.adventureId];
    const nextEpisodeIndex = currentEpisode;
    
    if (nextEpisodeIndex < adventure.episodes.length) {
      // Load next episode
      const nextEpisode = adventure.episodes[nextEpisodeIndex];
      setCurrentStorySegment(nextEpisode);
      setCurrentEpisode(currentEpisode + 1);
      
      // Reset game state
      setSolvedWords([]);
      setTimeSpent(0);
      
      // Move to story screen
      setGameState('story');
    } else {
      // End of adventure - go back to story generator
      setGameState('generate-story');
    }
  };
  
  /**
   * Handle going to sentence builder
   */
  const handleGoToSentenceBuilder = () => {
    setGameState('sentence-builder');
  };
  
  /**
   * Handle returning to main menu
   */
  const handleReturnToMenu = () => {
    setGameState('generate-story');
  };
  
  /**
   * Handle playing again
   */
  const handlePlayAgain = () => {
    // Reset game state
    setSolvedWords([]);
    setTimeSpent(0);
    
    // Move directly to story generator screen
    setGameState('generate-story');
  };
  
  /**
   * Format time display (mm:ss)
   */
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Handle the cancel action from story generator
  const handleGeneratorCancel = () => {
    // Since there's no intro screen to go back to, 
    // just keep the user on the generator screen
    setGameState('generate-story');
  };
  
  return (
    <div className={styles.gameContainer}>
      <div className={styles.gameContent}>
        <AnimatePresence mode="wait">
          {gameState === 'generate-story' && (
            <motion.div
              key="generate-story"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.screenContainer}
            >
              <StoryGeneratorScreen 
                onStoryGenerated={handleStoryGenerated}
                onCancel={handleGeneratorCancel}
              />
            </motion.div>
          )}
          
          {gameState === 'story' && currentStorySegment && (
            <motion.div
              key="story"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.screenContainer}
            >
              <StoryScreen 
                storySegment={currentStorySegment}
                onContinue={handleContinueToPuzzle}
                wordsToPuzzle={getAllVocabularyWords()}
                currentEpisode={currentEpisode}
                onToggleReadingCoach={toggleReadingCoach}
              />
              
              {showReadingCoach && (
                <AIReadingCoach
                  storyText={currentStorySegment.text}
                  isVisible={showReadingCoach}
                  onClose={() => setShowReadingCoach(false)}
                  vocabularyWords={getAllVocabularyWords()}
                  grade={3}
                />
              )}
            </motion.div>
          )}
          
          {gameState === 'gameplay' && currentPuzzle && (
            <motion.div
              key="gameplay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.screenContainer}
            >
              <GameplayScreen 
                puzzle={currentPuzzle}
                theme={"story"}
                onWordSolved={handleWordSolved}
                solvedWords={solvedWords}
                timeFormatted={formatTime(timeSpent)}
                storyContext={currentStorySegment}
                // Pass multiple puzzle navigation props
                puzzleIds={availablePuzzles}
                currentPuzzleIndex={currentPuzzleIndex}
                onChangePuzzle={handleChangePuzzle}
                totalPuzzles={availablePuzzles.length}
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
                solvedWords={solvedWords}
                timeSpent={timeSpent}
                timeFormatted={formatTime(timeSpent)}
                theme={"story"}
                onPlayAgain={handleNextEpisode}
                onBuildSentences={handleGoToSentenceBuilder}
                onReturnToMenu={handleReturnToMenu}
                totalWords={currentPuzzle ? currentPuzzle.words.length : 0}
                isStoryMode={true}
                nextEpisodeAvailable={currentEpisode < gameStories[gameConfig.adventureId]?.episodes.length}
                currentEpisode={currentEpisode}
                storyTitle={gameStories[gameConfig.adventureId]?.title}
                storySegment={currentStorySegment}
                onToggleReadingCoach={toggleReadingCoach}
                currentPuzzleIndex={currentPuzzleIndex}
                totalPuzzles={availablePuzzles.length}
              />
            </motion.div>
          )}
          
          {gameState === 'sentence-builder' && (
            <motion.div
              key="sentence-builder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.screenContainer}
            >
              <SentenceBuilderScreen 
                words={solvedWords}
                onReturnToSummary={() => setGameState('summary')}
                onReturnToMenu={handleReturnToMenu}
                storyContext={currentStorySegment}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Fixed reading coach button */}
      {(gameState === 'story' || gameState === 'summary') && (
        <motion.button
          className={styles.readingCoachButton}
          onClick={toggleReadingCoach}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className={styles.coachEmoji}>🦉</span>
          <span>Reading Helper</span>
        </motion.button>
      )}
    </div>
  );
};

export default CrosswordGame;