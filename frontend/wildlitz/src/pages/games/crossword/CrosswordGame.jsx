// src/pages/games/crossword/CrosswordGame.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../../styles/games/crossword/CrosswordGame.module.css';
import { GameLoadingScreen, CrosswordGridLoader } from '../../../components/common/LoadingStates';
import crosswordAnalyticsService from '../../../services/crosswordAnalyticsService';
// Import game screens
import StoryScreen from './StoryScreen';
import GameplayScreen from './GameplayScreen';
import SummaryScreen from './SummaryScreen';
import SentenceBuilderScreen from './SentenceBuilderScreen';
import StoryGeneratorScreen from './StoryGeneratorScreen';

// Import AI components
import AIReadingCoach from '../../../components/crossword/AIReadingCoach';
import AdaptiveHintSystem from '../../../components/crossword/AdaptiveHintSystem';
import { useAuth } from '../../../context/AuthContext';

// Import mock data
import { STORY_ADVENTURES, STORY_PUZZLES } from '../../../mock/storyData';

/**
 * Main Crossword Puzzle Game component that manages game state and flow
 */
const CrosswordGame = () => {
  // Game states
  const [gameState, setGameState] = useState('generate-story');
  
  const { user, isAuthenticated } = useAuth();


  // Game configuration
  const [gameConfig, setGameConfig] = useState({
    storyMode: true,
    adventureId: 'jungle_quest'
  });
  
  // Story tracking
  const [currentEpisode, setCurrentEpisode] = useState(0);
  const [storyProgress, setStoryProgress] = useState({});
  
  // ADD THIS LINE - Session ID for analytics
  const [sessionId, setSessionId] = useState(null);  // ✨ ADD THIS
  
  // Game data
  const [gameStories, setGameStories] = useState({
    ...STORY_ADVENTURES
  });
  const [gamePuzzles, setGamePuzzles] = useState({
    ...STORY_PUZZLES
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
      const primaryPuzzleId = currentStorySegment.crosswordPuzzleId;
      const additionalPuzzleIds = currentStorySegment.additionalPuzzleIds || [];
      const allPuzzleIds = [primaryPuzzleId, ...additionalPuzzleIds].filter(Boolean);
      setAvailablePuzzles(allPuzzleIds);
      
      setCurrentPuzzleIndex(0);
      if (allPuzzleIds.length > 0) {
        const puzzleData = gamePuzzles[allPuzzleIds[0]];
        setCurrentPuzzle(puzzleData);
      }
      
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
      
      setSolvedWords([]);
      setTimeSpent(0);
    }
  };
  
  /**
   * Handle starting the game with selected configuration
   */
  const handleStartGame = (config) => {
    setGameConfig(config);
    
    const adventure = gameStories[config.adventureId];
    const firstEpisode = adventure.episodes[0];
    setCurrentStorySegment(firstEpisode);
    setCurrentEpisode(1);
    
    const puzzleData = gamePuzzles[firstEpisode.crosswordPuzzleId];
    setCurrentPuzzle(puzzleData);
    
    setGameState('story');
    
    setSolvedWords([]);
    setTimeSpent(0);
  };
  
  /**
   * Handle newly generated story
   */
  const handleStoryGenerated = async (data) => {
  console.log('Story generated with', data.story.episodes?.length, 'episodes');
  
  const newStory = {
    ...data.story,
    episodes: Array.isArray(data.story.episodes) ? data.story.episodes : []
  };
  
  const newStories = {
    ...gameStories,
    [newStory.id]: newStory
  };
  
  const newPuzzles = {
    ...gamePuzzles,
    ...data.puzzles
  };
  
  setGameStories(newStories);
  setGamePuzzles(newPuzzles);
  
  const config = {
    storyMode: true,
    adventureId: newStory.id
  };
  
  setGameConfig(config);
  
  // CREATE A SESSION for analytics tracking
  try {
    // ✅ USE LOGGED-IN USER EMAIL OR FALLBACK TO GUEST
    const userEmail = (isAuthenticated && user?.email) 
      ? user.email 
      : 'guest@wildlitz.com';
    
    console.log('🔐 Creating session for user:', userEmail);
    
    const sessionData = {
      user_email: userEmail, // ✅ USING ACTUAL USER EMAIL!
      story_id: newStory.id,
      story_title: newStory.title,
      theme: newStory.theme,
      focus_skills: [],
      episode_count: newStory.totalEpisodes || newStory.episodes?.length || 0,
      character_names: ''
    };
    
    const sessionResponse = await crosswordAnalyticsService.createSession(sessionData);
    
    if (sessionResponse.success && sessionResponse.session_id) {
      setSessionId(sessionResponse.session_id);
      console.log('✅ Session created:', sessionResponse.session_id);
      console.log('✅ User email:', userEmail);
    }
  } catch (error) {
    console.log('⚠️ Could not create session (analytics disabled):', error.message);
  }
  
  if (newStory.episodes && newStory.episodes.length > 0) {
    const firstEpisode = newStory.episodes[0];
    setCurrentStorySegment(firstEpisode);
    setCurrentEpisode(1);
    
    const puzzleData = data.puzzles[firstEpisode.crosswordPuzzleId];
    if (puzzleData) {
      setCurrentPuzzle(puzzleData);
    }
    
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
    setShowReadingCoach(!showReadingCoach);
  };
  
  /**
   * Get vocabulary words for the current episode
   */
  const getCurrentEpisodeVocabularyWords = () => {
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
    }
    
    if (currentPuzzle && solvedWords.length + 1 >= currentPuzzle.words.length) {
      setTimerActive(false);
      
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
    
    if (!adventure || !adventure.episodes) {
      console.error('No adventure or episodes found');
      setGameState('generate-story');
      return;
    }
    
    const nextEpisodeIndex = currentEpisode;
    
    if (nextEpisodeIndex < adventure.episodes.length) {
      const nextEpisode = adventure.episodes[nextEpisodeIndex];
      setCurrentStorySegment(nextEpisode);
      setCurrentEpisode(currentEpisode + 1);
      
      const puzzleData = gamePuzzles[nextEpisode.crosswordPuzzleId];
      if (puzzleData) {
        setCurrentPuzzle(puzzleData);
      }
      
      setSolvedWords([]);
      setTimeSpent(0);
      setTimerActive(false);
      
      setGameState('story');
    } else {
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
                onContinue={handleContinueToPuzzle}
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
      sessionId={sessionId}  
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
      theme="story"
      onPlayAgain={handleNextEpisode}
      onReturnToMenu={handleReturnToMenu}
      totalWords={currentPuzzle ? currentPuzzle.words.length : 0}
      isStoryMode={true}
      nextEpisodeAvailable={currentEpisode < (gameStories[gameConfig.adventureId]?.episodes?.length || 0)}
      hasNextEpisode={currentEpisode < (gameStories[gameConfig.adventureId]?.episodes?.length || 0)}
      currentEpisode={currentEpisode}
      totalEpisodes={gameStories[gameConfig.adventureId]?.episodes?.length || 0}
      storyTitle={gameStories[gameConfig.adventureId]?.title || 'Adventure'}
      storySegment={currentStorySegment}
      sessionId={sessionId}
    />
  </motion.div>
)}
          
          
        </AnimatePresence>
        
        {/* AI Reading Coach overlay */}
        <AnimatePresence>
          {showReadingCoach && currentStorySegment && (
            <AIReadingCoach
              storyText={currentStorySegment.text}
              isVisible={showReadingCoach}
              onClose={toggleReadingCoach}
              vocabularyWords={getCurrentEpisodeVocabularyWords()}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CrosswordGame;