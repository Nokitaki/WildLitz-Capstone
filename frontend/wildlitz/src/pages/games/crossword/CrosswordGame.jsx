// src/pages/games/crossword/CrosswordGame.jsx
// COMPLETE VERSION WITH CROSSWORD GUIDE MODAL INTEGRATION

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

// ✅ NEW: Import the CrosswordGuideModal
import CrosswordGuideModal from '../crossword/CrosswordGuideModal';

// Import AI components
import AIReadingCoach from '../../../components/crossword/AIReadingCoach';
import AdaptiveHintSystem from '../../../components/crossword/AdaptiveHintSystem';
import { useAuth } from '../../../context/AuthContext';

// Import mock data
import { STORY_ADVENTURES, STORY_PUZZLES } from '../../../mock/storyData';
import { API_ENDPOINTS } from '../../../config/api';
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
  

  // Add new state for progressive generation
  const [isGeneratingNextEpisode, setIsGeneratingNextEpisode] = useState(false);
  const [generationError, setGenerationError] = useState(null);

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
  
  // ✅ NEW: Add state for guide modal
  const [showGuide, setShowGuide] = useState(true);
  
  useEffect(() => {
  
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
      episodes: data.story.episodes ? data.story.episodes : [],
      totalEpisodes: data.story.totalEpisodes || 1,        // ⭐ ADD
      generatedEpisodes: data.story.generatedEpisodes || 1, // ⭐ ADD
      focusSkills: data.story.focusSkills || [],           // ⭐ ADD
      characterNames: data.story.characterNames || ''       // ⭐ ADD
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
        theme: data.story.theme || 'adventure',
        focus_skills: data.story.focusSkills || [],
        episode_count: newStory.episodes.length,
        difficulty: newStory.gradeLevel || 'grade_3',
        character_names: data.story.characterNames || ''
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
    setShowReadingCoach(!showReadingCoach);
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
  
  // ✅ UPDATED: Modified to show guide when transitioning to gameplay
  const handleContinueToPuzzle = () => {
    setShowGuide(true);  // Show guide for each new puzzle
    setGameState('gameplay');
  };
  
  // ✅ NEW: Handler for starting game from guide
  const handleStartFromGuide = () => {
    if (window.playClickSound) window.playClickSound();
    setShowGuide(false);
    setTimerActive(true);
  };

  // ✅ NEW: Handler for skipping guide
  const handleSkipGuide = () => {
    if (window.playClickSound) window.playClickSound();
    setShowGuide(false);
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
  
  const handleNextEpisode = async () => {
  const adventure = gameStories[gameConfig.adventureId];
  
  if (!adventure || !adventure.episodes) {
    setGameState('generate-story');
    return;
  }
  
  const nextEpisodeIndex = currentEpisode; // Next episode (currentEpisode is 0-indexed for array)
  
  // Check if we've already generated this episode
  if (nextEpisodeIndex < adventure.episodes.length) {
    // Episode already exists, just load it
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
  } 
  // Check if we need to generate the next episode
  else if (adventure.generatedEpisodes < adventure.totalEpisodes) {
    // ⭐ GENERATE NEXT EPISODE ON-DEMAND
    await generateNextEpisodeOnDemand();
  } 
  else {
    // All episodes completed
    setGameState('generate-story');
  }
};

// ⭐ NEW FUNCTION: Generate next episode on demand
const generateNextEpisodeOnDemand = async () => {
  const adventure = gameStories[gameConfig.adventureId];
  const nextEpisodeNumber = adventure.generatedEpisodes + 1;
  
  setIsGeneratingNextEpisode(true);
  setGenerationError(null);
  
  try {
    // Gather previous episodes for context
    const previousEpisodes = adventure.episodes.map(ep => ({
      title: ep.title,
      text: ep.text,
      vocabularyWords: gamePuzzles[ep.crosswordPuzzleId]?.words?.map(w => ({
        word: w.answer.toLowerCase(),
        definition: w.definition
      })) || []
    }));
    
    const requestBody = {
      storyId: adventure.id,
      episodeNumber: nextEpisodeNumber,
      theme: adventure.theme,
      focusSkills: adventure.focusSkills,
      characterNames: adventure.characterNames || '',
      gradeLevel: 3,
      previousEpisodes: previousEpisodes
    };
    
    const response = await fetch(
      `${API_ENDPOINTS.SENTENCE_FORMATION}/generate-next-episode/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(28000) // 28-second timeout
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to generate episode ${nextEpisodeNumber}`);
    }
    
    const data = await response.json();
    
    if (!data.success || !data.episode || !data.puzzle) {
      throw new Error('Invalid response from server');
    }
    
    // Add new episode to story
    const updatedStory = {
      ...adventure,
      episodes: [...adventure.episodes, data.episode],
      generatedEpisodes: nextEpisodeNumber
    };
    
    // Add new puzzle
    const updatedPuzzles = {
      ...gamePuzzles,
      ...data.puzzle
    };
    
    // Update state
    setGameStories({
      ...gameStories,
      [gameConfig.adventureId]: updatedStory
    });
    setGamePuzzles(updatedPuzzles);
    
    // Set new episode as current
    setCurrentStorySegment(data.episode);
    setCurrentEpisode(currentEpisode + 1);
    setCurrentPuzzle(data.puzzle[data.episode.crosswordPuzzleId]);
    
    // Reset game state
    setSolvedWords([]);
    setTimeSpent(0);
    setTotalHints(0);
    setTimerActive(false);
    
    setIsGeneratingNextEpisode(false);
    setGameState('story');
    
  } catch (error) {
    console.error('Error generating next episode:', error);
    setGenerationError(error.message || 'Failed to generate next episode');
    setIsGeneratingNextEpisode(false);
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
        
        {/* ✅ NEW: Game Guide Modal - Shows between story and gameplay */}
        {gameState === 'gameplay' && showGuide && (
          <CrosswordGuideModal
            onStart={handleStartFromGuide}
            onSkip={handleSkipGuide}
            storyContext={currentStorySegment}
          />
        )}
        
        {/* ✅ UPDATED: Gameplay Screen - Only shows when guide is dismissed */}
        {gameState === 'gameplay' && !showGuide && currentPuzzle && (
          <motion.div
            key="gameplay"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
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

        {isGeneratingNextEpisode && (
  <motion.div
    key="generating-next"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}
  >
    <div style={{
      background: 'white',
      padding: '40px',
      borderRadius: '20px',
      textAlign: 'center',
      maxWidth: '400px'
    }}>
      <div style={{ fontSize: '48px', marginBottom: '20px' }}>📚</div>
      <h2 style={{ marginBottom: '10px' }}>Creating Next Episode...</h2>
      <p style={{ color: '#666' }}>Please wait while we generate your next adventure!</p>
      <div style={{
        marginTop: '20px',
        width: '100%',
        height: '6px',
        background: '#e0e0e0',
        borderRadius: '3px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, #9c27b0, #673ab7)',
          animation: 'loading 2s linear infinite'
        }} />
      </div>
      {generationError && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: '#fee',
          borderRadius: '10px',
          color: '#c00'
        }}>
          {generationError}
        </div>
      )}
    </div>
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
              totalEpisodes={gameStories[gameConfig.adventureId]?.totalEpisodes || 1}
              hasNextEpisode={currentEpisode < (gameStories[gameConfig.adventureId]?.totalEpisodes || 0)}
              sessionId={sessionId}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {showReadingCoach && (
        <>
          <AIReadingCoach
            isVisible={true}
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