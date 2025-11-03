// src/pages/games/crossword/CrosswordGame.jsx
// REPLACE with this SIMPLIFIED version (no local audio, uses global)

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
  
  // Story and puzzle data
  const [gameStories, setGameStories] = useState(STORY_ADVENTURES);
  const [gamePuzzles, setGamePuzzles] = useState(STORY_PUZZLES);
  
  // Current game data
  const [currentStorySegment, setCurrentStorySegment] = useState(null);
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  
  // Game progress
  const [solvedWords, setSolvedWords] = useState([]);
  const [timeSpent, setTimeSpent] = useState(0);
  const [totalHints, setTotalHints] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  
  // Available puzzles in current episode
  const [availablePuzzles, setAvailablePuzzles] = useState([]);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  
  // Reading coach
  const [showReadingCoach, setShowReadingCoach] = useState(false);
  
  useEffect(() => {
  console.log('🔄 showReadingCoach changed to:', showReadingCoach);
}, [showReadingCoach]);

  // Timer for tracking time spent
  useEffect(() => {
    let interval;
    if (timerActive) {
      interval = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Initialize available puzzles when story segment changes
  useEffect(() => {
    if (currentStorySegment && gamePuzzles) {
      const mainPuzzleId = currentStorySegment.crosswordPuzzleId;
      const additionalPuzzleIds = currentStorySegment.additionalPuzzles || [];
      const allPuzzleIds = [mainPuzzleId, ...additionalPuzzleIds].filter(Boolean);
      setAvailablePuzzles(allPuzzleIds);
      
      setCurrentPuzzleIndex(0);
      if (allPuzzleIds.length > 0) {
        const puzzleData = gamePuzzles[allPuzzleIds[0]];
        setCurrentPuzzle(puzzleData);
      }
      
      setSolvedWords([]);
      setTimeSpent(0);
      setTotalHints(0);
    }
  }, [currentStorySegment, gamePuzzles]);
  
  const handleChangePuzzle = (index) => {
    if (index >= 0 && index < availablePuzzles.length) {
      setCurrentPuzzleIndex(index);
      const puzzleId = availablePuzzles[index];
      const puzzleData = gamePuzzles[puzzleId];
      setCurrentPuzzle(puzzleData);
      
      setSolvedWords([]);
      setTimeSpent(0);
      setTotalHints(0);
    }
  };
  
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
    setTotalHints(0);
    setTimerActive(false);
  };
  
  const handleStoryGenerated = async (data) => {
  const newStory = {
    id: data.story.id,
    title: data.story.title,
    description: data.story.description,
    theme: data.story.theme,
    gradeLevel: data.story.gradeLevel,
    episodes: data.story.episodes ? data.story.episodes : []
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
  
  try {
    const userEmail = (isAuthenticated && user?.email) 
      ? user.email 
      : 'guest@wildlitz.com';
    
    const sessionData = {
      user_email: userEmail,
      story_id: newStory.id,
      story_title: newStory.title,
      theme: data.story.theme || 'adventure',  // ✅ ADD THIS
      focus_skills: data.story.focusSkills || [],  // ✅ ADD THIS
      episode_count: newStory.episodes.length,  // ✅ ADD THIS
      difficulty: newStory.gradeLevel || 'grade_3',
      character_names: data.story.characterNames || ''  // ✅ ADD THIS
    };
    
    const session = await crosswordAnalyticsService.createSession(sessionData);
    setSessionId(session.session_id);
  } catch (error) {
    console.error('Failed to create session:', error);
  }
  
  if (newStory.episodes && newStory.episodes.length > 0) {
    const firstEpisode = newStory.episodes[0];
    setCurrentStorySegment(firstEpisode);
    setCurrentEpisode(1);
    
    const firstPuzzleId = firstEpisode.crosswordPuzzleId;
    if (firstPuzzleId && newPuzzles[firstPuzzleId]) {
      setCurrentPuzzle(newPuzzles[firstPuzzleId]);
    }
    
    setGameState('story');
  }
  
  setSolvedWords([]);
  setTimeSpent(0);
  setTotalHints(0);
  setTimerActive(false);
};
  
 const toggleReadingCoach = () => {
  console.log('🎯 toggleReadingCoach called! Current state:', showReadingCoach);
  setShowReadingCoach(!showReadingCoach);
  console.log('📊 Setting showReadingCoach to:', !showReadingCoach);
};
  
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
  
  const handleContinueToPuzzle = () => {
    setGameState('gameplay');
    setTimerActive(true);
  };
  
  const handleWordSolved = (word, definition, example, hintsUsedForWord = 0) => {
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
      
      if (hintsUsedForWord > 0) {
        setTotalHints(prev => prev + hintsUsedForWord);
      }
    }
    
    if (currentPuzzle && solvedWords.length + 1 >= currentPuzzle.words.length) {
      setTimerActive(false);
      setTimeout(() => {
        setGameState('summary');
      }, 1000);
    }
  };
  
  const handlePuzzleComplete = () => {
    setGameState('summary');
    setTimerActive(false);
  };
  
  const handleNextEpisode = () => {
    const adventure = gameStories[gameConfig.adventureId];
    
    if (!adventure || !adventure.episodes) {
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
      setTotalHints(0);
      setTimerActive(false);
      
      setGameState('story');
    } else {
      setGameState('generate-story');
    }
  };
  
  const handleReturnToMenu = () => {
    if (window.disableGameAudio) window.disableGameAudio();
    setGameState('generate-story');
    setCurrentEpisode(0);
    setCurrentStorySegment(null);
    setCurrentPuzzle(null);
    setSolvedWords([]);
    setTimeSpent(0);
    setTotalHints(0);
    setTimerActive(false);
    setSessionId(null);
  };

  return (
    <div className={styles.container}>
      <AnimatePresence mode="wait">
        {gameState === 'generate-story' && (
          <motion.div
            key="generate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <StoryGeneratorScreen
              onStoryGenerated={handleStoryGenerated}
              existingStories={gameStories}
            />
          </motion.div>
        )}
        
        {gameState === 'story' && currentStorySegment && (
          <motion.div
            key="story"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
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
          >
            <GameplayScreen
              puzzle={currentPuzzle}
              theme="story"
              onWordSolved={(word, def, example, hints) => handleWordSolved(word, def, example, hints)}
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
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <SummaryScreen
              solvedWords={solvedWords}
              timeSpent={timeSpent}
              timeFormatted={formatTime(timeSpent)}
              theme="story"
              onPlayAgain={handleNextEpisode}
              onReturnToMenu={handleReturnToMenu}
              totalWords={currentPuzzle?.words?.length || 0}
              totalHints={totalHints}
              isStoryMode={gameConfig.storyMode}
              storySegment={currentStorySegment}
              currentEpisode={currentEpisode}
              totalEpisodes={gameStories[gameConfig.adventureId]?.episodes.length || 1}
              hasNextEpisode={currentEpisode < (gameStories[gameConfig.adventureId]?.episodes.length || 0)}
              sessionId={sessionId}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
  {showReadingCoach && (
  <>
    {console.log('🎨 Rendering AIReadingCoach modal')}
    <AIReadingCoach
      isVisible={true}  // ✅ ADD THIS LINE - This is what was missing!
      vocabularyWords={getCurrentEpisodeVocabularyWords()}
      solvedWords={solvedWords}
      onClose={toggleReadingCoach}
    />
  </>
)}
    </div>
  );
};

export default CrosswordGame;