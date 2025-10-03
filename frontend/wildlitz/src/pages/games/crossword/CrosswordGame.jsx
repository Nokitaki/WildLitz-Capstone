// src/pages/games/crossword/CrosswordGame.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../../styles/games/crossword/CrosswordGame.module.css';
import { GameLoadingScreen, CrosswordGridLoader } from '../../../components/common/LoadingStates';

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
   * Handle newly generated story - FIXED VERSION
   */
  const handleStoryGenerated = (data) => {
  console.log('=== Story Generation Debug ===');
  console.log('Raw story data:', data);
  console.log('Number of episodes received:', data.story.episodes?.length);
  
  // IMPORTANT: Ensure episodes array is properly set
  const newStory = {
    ...data.story,
    episodes: Array.isArray(data.story.episodes) ? data.story.episodes : []
  };
  
  console.log('Processed story:', newStory);
  console.log('Episodes in processed story:', newStory.episodes.length);
  console.log('Episode titles:', newStory.episodes.map(ep => ep.title));
  
  // Add the new story to the available stories
  const newStories = {
    ...gameStories,
    [newStory.id]: newStory
  };
  
  const newPuzzles = {
    ...gamePuzzles,
    ...data.puzzles
  };
  
  setGamePuzzles(newPuzzles);
    
    // Configure game to use the new story
     const config = {
    storyMode: true,
    adventureId: newStory.id
  };
    
    setGameConfig(config);
    
    // Move to story screen directly with the first episode
    if (newStory.episodes && newStory.episodes.length > 0) {
    const firstEpisode = newStory.episodes[0];
    setCurrentStorySegment(firstEpisode);
    setCurrentEpisode(1);
      
       console.log('Starting with episode 1 of', newStory.episodes.length);
      console.log('First episode:', firstEpisode.title);
      
      // Load corresponding puzzle
      const puzzleData = data.puzzles[firstEpisode.crosswordPuzzleId];
    if (puzzleData) {
      setCurrentPuzzle(puzzleData);
      console.log('Loaded puzzle:', puzzleData.title);
    } else {
      console.error('No puzzle found for:', firstEpisode.crosswordPuzzleId);
    }
    
    // Reset game state
    setSolvedWords([]);
    setTimeSpent(0);
      
      setGameState('story');
  } else {
    console.error('No episodes found in generated story');
    setGameState('generate-story');
  }
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
   */
  const getWordsFromPuzzle = () => {
    if (!currentPuzzle) return [];
    return currentPuzzle.words.map(word => word.answer);
  };
  
  /**
   * Get vocabulary words for the CURRENT episode only
   */
  const getCurrentEpisodeVocabularyWords = () => {
    if (!currentStorySegment) return [];
    
    const puzzleId = currentStorySegment.crosswordPuzzleId;
    const additionalIds = currentStorySegment.additionalPuzzleIds || [];
    const allPuzzleIds = [puzzleId, ...additionalIds].filter(Boolean);
    
    const episodeWords = [];
    
    allPuzzleIds.forEach(id => {
      const puzzle = gamePuzzles[id];
      if (puzzle && puzzle.words) {
        puzzle.words.forEach(word => {
          if (!episodeWords.includes(word.answer)) {
            episodeWords.push(word.answer);
          }
        });
      }
    });
    
    if (currentStorySegment.vocabularyFocus) {
      currentStorySegment.vocabularyFocus.forEach(word => {
        const upperWord = word.toUpperCase();
        if (!episodeWords.includes(upperWord)) {
          episodeWords.push(upperWord);
        }
      });
    }
    
    return episodeWords;
  };
  
  /**
   * Get ALL vocabulary words across ALL episodes
   */
  const getAllVocabularyWords = () => {
    if (!gameStories || !gameConfig || !gameConfig.adventureId) return [];
    
    const adventure = gameStories[gameConfig.adventureId];
    if (!adventure || !adventure.episodes) return [];
    
    const allWords = [];
    
    adventure.episodes.forEach(episode => {
      const puzzleId = episode.crosswordPuzzleId;
      const additionalIds = episode.additionalPuzzleIds || [];
      const allPuzzleIds = [puzzleId, ...additionalIds].filter(Boolean);
      
      allPuzzleIds.forEach(id => {
        const puzzle = gamePuzzles[id];
        if (puzzle && puzzle.words) {
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
    
    if (!solvedWords.some(solved => solved.word === word)) {
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
      setTimerActive(false);
      
      setTimeout(() => {
        setGameState('summary');
      }, 1000);
    }
  };
  
  /**
   * Handle proceeding to next episode - FIXED VERSION
   */
  const handleNextEpisode = () => {
    const adventure = gameStories[gameConfig.adventureId];
    
    if (!adventure || !adventure.episodes) {
      console.error('No adventure or episodes found');
      setGameState('generate-story');
      return;
    }
    
    console.log('=== handleNextEpisode called ===');
    console.log('Current Episode:', currentEpisode);
    console.log('Total Episodes:', adventure.episodes.length);
    console.log('Adventure ID:', gameConfig.adventureId);
    
    // currentEpisode is 1-based, array is 0-based
    // So if currentEpisode = 1, we want episodes[1] (the second episode)
    const nextEpisodeIndex = currentEpisode; // This gets us the next episode in 0-based array
    
    if (nextEpisodeIndex < adventure.episodes.length) {
      console.log('Loading next episode at index:', nextEpisodeIndex);
      
      // Load next episode
      const nextEpisode = adventure.episodes[nextEpisodeIndex];
      setCurrentStorySegment(nextEpisode);
      setCurrentEpisode(currentEpisode + 1);
      
      console.log('Next episode title:', nextEpisode.title);
      
      // Load corresponding puzzle
      const puzzleData = gamePuzzles[nextEpisode.crosswordPuzzleId];
      if (puzzleData) {
        setCurrentPuzzle(puzzleData);
      } else {
        console.error('No puzzle found for episode:', nextEpisode.crosswordPuzzleId);
      }
      
      // Reset game state
      setSolvedWords([]);
      setTimeSpent(0);
      setTimerActive(false);
      
      // Move to story screen
      setGameState('story');
    } else {
      console.log('No more episodes, ending adventure');
      setGameState('generate-story');
    }
  };
  
  /**
   * Format time display (mm:ss)
   */
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  /**
   * Return to main menu
   */
  const handleReturnToMenu = () => {
    setGameState('generate-story');
    setCurrentEpisode(0);
    setSolvedWords([]);
    setTimeSpent(0);
    setTimerActive(false);
  };
  
  /**
   * Go to sentence builder
   */
  const handleGoToSentenceBuilder = () => {
    setGameState('sentence-builder');
  };

  return (
    <div className={styles.gameContainer}>
      <div className={styles.gameWrapper}>
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
                onCancel={handleReturnToMenu}
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
      currentEpisode={currentEpisode}
      vocabularyWords={getCurrentEpisodeVocabularyWords()}
      onContinue={handleContinueToPuzzle}  // Direct connection to puzzle
      onToggleReadingCoach={toggleReadingCoach}
    />
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
                theme="story"
                onWordSolved={handleWordSolved}
                solvedWords={solvedWords}
                timeSpent={timeSpent}
                timeFormatted={formatTime(timeSpent)}
                storyContext={currentStorySegment}
                currentPuzzleIndex={currentPuzzleIndex}
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
    {/* Debug logging - ADD THIS */}
    {(() => {
      const currentAdventure = gameStories[gameConfig.adventureId];
      const episodeCount = currentAdventure?.episodes?.length || 0;
      const nextAvailable = currentEpisode < episodeCount;
      
      console.log('=== SUMMARY SCREEN DEBUG ===');
      console.log('Adventure ID:', gameConfig.adventureId);
      console.log('Current Episode:', currentEpisode);
      console.log('Total Episodes:', episodeCount);
      console.log('Episodes Array:', currentAdventure?.episodes?.map(ep => ep.title) || []);
      console.log('Next Episode Available:', nextAvailable);
      console.log('Full adventure object:', currentAdventure);
      console.log('========================');
      
      return null;
    })()}
    
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
      nextEpisodeAvailable={currentEpisode < (gameStories[gameConfig.adventureId]?.episodes?.length || 0)}
      currentEpisode={currentEpisode}
      storyTitle={gameStories[gameConfig.adventureId]?.title}
      storySegment={currentStorySegment}
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
      
      {/* AI Reading Coach Overlay */}
      {showReadingCoach && (
        <AIReadingCoach 
          vocabularyWords={getAllVocabularyWords()}
          currentStory={currentStorySegment}
          onClose={toggleReadingCoach}
        />
      )}
      
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