// src/components/common/GameTipsModal.jsx - COMPACT VERSION
import React, { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Import animation components
import VanishingGameAnimation from '../animations/VanishingGameAnimation';
import SoundSafariAnimation from '../animations/SoundSafariAnimation';
import CrosswordAnimation from '../animations/CrosswordAnimation';
import SyllableClappingAnimation from '../animations/SyllableClappingAnimation';

const GameTipsModal = ({ isOpen, onClose, game, onStartGame }) => {
  const navigate = useNavigate();

  const gameInfo = useMemo(() => ({
    'syllable-clapping': {
      title: 'Syllable Clapping Game',
      description: 'Practice breaking words into syllables with fun clapping activities!',
      component: <SyllableClappingAnimation />,
      color: '#FF6B9D',
      emoji: '👏',
      howToPlay: [
        'Listen to the word pronunciation carefully',
        'Count the syllables by clapping along with the rhythm',
        'Watch how words break into smaller parts (syllables)',
        'Practice with different words and difficulty levels'
      ]
    },
    'sound-safari': {
      title: 'Sound Safari',
      description: 'Hunt for specific sounds in words to develop phonemic awareness!',
      component: <SoundSafariAnimation />,
      color: '#4ECDC4',
      emoji: '🦁',
      howToPlay: [
        'Listen for the target sound announced at the beginning',
        'Identify animals and objects that contain the target sound',
        'Pay attention to the position of sounds (beginning, middle, or end)',
        'Raise your hand when you hear the target sound in a word'
      ]
    },
    'vanishing-game': {
      title: 'Vanishing Game',
      description: 'Watch objects disappear and reappear while learning phonics patterns!',
      component: <VanishingGameAnimation />,
      color: '#45B7D1',
      emoji: '✨',
      howToPlay: [
        'Watch carefully as objects appear and disappear',
        'Identify the phonics patterns in each word',
        'Remember the words that vanished',
        'Practice spelling and pronunciation'
      ]
    },
    'crossword-puzzle': {
      title: 'Crossword Puzzle',
      description: 'Build vocabulary and sentence structure with fun word puzzles!',
      component: <CrosswordAnimation />,
      color: '#9B59B6',
      emoji: '🧩',
      howToPlay: [
        'Read the clues carefully to understand what word you need to find',
        'Select a clue to see the available answer choices',
        'Choose the correct answer from the options',
        'Use hints wisely if you get stuck'
      ]
    }
  }), []);

  const currentGame = gameInfo[game] || gameInfo['crossword-puzzle'];
  const isCrosswordGame = game === 'crossword-puzzle';

  const handleStartGame = useCallback(() => {
    
    onClose();
    if (onStartGame) {
      onStartGame();
    } else {
      navigate(`/games/${game}`);
    }
  }, [onClose, onStartGame, navigate, game]);

  const handleAnalyticsClick = useCallback(() => {
   
    navigate('/analytics/crossword');
  }, [navigate]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 30 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'white',
            borderRadius: '20px',
            padding: '30px',
            maxWidth: '520px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}
        >
          <h2 style={{
            color: '#2c3e50',
            fontSize: '24px',
            marginBottom: '10px',
            textAlign: 'center'
          }}>
            {currentGame.emoji} {currentGame.title}
          </h2>
          
          <p style={{
            color: '#7f8c8d',
            fontSize: '14px',
            marginBottom: '20px',
            textAlign: 'center',
            lineHeight: '1.5'
          }}>
            {currentGame.description}
          </p>

          <div style={{
            background: '#f8f9fa',
            borderRadius: '15px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h3 style={{
              color: '#2c3e50',
              fontSize: '17px',
              marginBottom: '12px'
            }}>
              📖 How to Play:
            </h3>
            <ul style={{
              color: '#555',
              fontSize: '14px',
              lineHeight: '1.6',
              paddingLeft: '20px',
              margin: 0
            }}>
              {currentGame.howToPlay.map((step, index) => (
                <li key={index} style={{ marginBottom: '8px' }}>
                  {step}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={onClose}
              style={{
                flex: '1 1 auto',
                minWidth: '100px',
                padding: '12px',
                fontSize: '15px',
                fontWeight: 'bold',
                background: '#e0e0e0',
                color: '#555',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Close
            </button>

            {isCrosswordGame && (
              <button
                onClick={handleAnalyticsClick}
                style={{
                  flex: '1 1 auto',
                  minWidth: '110px',
                  padding: '12px',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 15px rgba(52, 152, 219, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ fontSize: '16px' }}>📊</span>
                Analytics
              </button>
            )}

            <button
              onClick={handleStartGame}
              style={{
                flex: '2 1 auto',
                minWidth: '150px',
                padding: '12px',
                fontSize: '15px',
                fontWeight: 'bold',
                background: currentGame.color,
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
              }}
            >
              🎮 Start Game
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GameTipsModal;