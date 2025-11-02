// src/components/common/GameTipsModal.jsx - OPTIMIZED VERSION
import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Import animation components
import VanishingGameAnimation from '../animations/VanishingGameAnimation';
import SoundSafariAnimation from '../animations/SoundSafariAnimation';
import CrosswordAnimation from '../animations/CrosswordAnimation';
import SyllableClappingAnimation from '../animations/SyllableClappingAnimation';

const GameTipsModal = ({ isOpen, onClose, game, onStartGame }) => {
  const navigate = useNavigate();
  const [audioEnabled, setAudioEnabled] = useState(false);

  // 🔥 OPTIMIZATION: Memoize game info to prevent recreation
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
        'Select a clue from the list to see the available answer choices',
        'Choose the correct answer from the multiple choice options',
        'Watch as the word fills into the crossword grid when you get it right',
        'Use hints wisely if you get stuck on a difficult clue'
      ]
    }
  }), []);

  const currentGame = gameInfo[game] || gameInfo['crossword-puzzle'];
  const isCrosswordGame = game === 'crossword-puzzle';

  // 🔥 OPTIMIZATION: Memoize handlers to prevent recreation
  const handleStartGame = useCallback(() => {
    if (window.playClickSound) window.playClickSound();
    onClose();
    if (onStartGame) {
      onStartGame();
    } else {
      navigate(`/games/${game}`);
    }
  }, [onClose, onStartGame, navigate, game]);

  const handleEnableAudio = useCallback(async () => {
    if (typeof window.enableGameAudio === 'function') {
      window.enableGameAudio();
    }

    if (typeof window.initAudioSystem === 'function') {
      const success = await window.initAudioSystem();
      
      if (success) {
        setAudioEnabled(true);
        setTimeout(() => {
          if (window.playClickSound) window.playClickSound();
        }, 300);
      } else {
        alert('Failed to initialize audio. Please try again.');
      }
    }
  }, []);

  const handleAnalyticsClick = useCallback(() => {
    if (window.playClickSound) window.playClickSound();
    navigate('/analytics/crossword');
  }, [navigate]);

  if (!isOpen) return null;

  // Unified Modal Design for All Games
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
            padding: '40px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}
        >
          <h2 style={{
            color: '#2c3e50',
            fontSize: '28px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {currentGame.emoji} {currentGame.title}
          </h2>
          
          <p style={{
            color: '#7f8c8d',
            fontSize: '16px',
            marginBottom: '30px',
            textAlign: 'center',
            lineHeight: '1.6'
          }}>
            {currentGame.description}
          </p>

          {/* Audio Enable Section - For Crossword */}
          {isCrosswordGame && !audioEnabled && (
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '15px',
              padding: '20px',
              marginBottom: '25px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>🎵</div>
              <p style={{ color: 'white', margin: '0 0 15px 0', fontSize: '15px' }}>
                <strong>Enable audio</strong> to enjoy background music and sound effects!
              </p>
              <button
                onClick={handleEnableAudio}
                style={{
                  padding: '10px 20px',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  background: 'white',
                  color: '#667eea',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                  transition: 'transform 0.2s ease'
                }}
              >
                Enable Audio
              </button>
            </div>
          )}

          {/* Audio Enabled Confirmation - For Crossword */}
          {isCrosswordGame && audioEnabled && (
            <div style={{
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              borderRadius: '15px',
              padding: '20px',
              marginBottom: '25px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔊</div>
              <p style={{ color: 'white', margin: 0, fontSize: '15px', fontWeight: 'bold' }}>
                Audio Enabled! Enjoy the music and sounds!
              </p>
            </div>
          )}

          <div style={{
            background: '#f8f9fa',
            borderRadius: '15px',
            padding: '25px',
            marginBottom: '30px'
          }}>
            <h3 style={{
              color: '#2c3e50',
              fontSize: '20px',
              marginBottom: '15px'
            }}>
              📖 How to Play:
            </h3>
            <ul style={{
              color: '#555',
              lineHeight: '1.8',
              paddingLeft: '20px'
            }}>
              {currentGame.howToPlay.map((step, index) => (
                <li key={index} style={{ marginBottom: '10px' }}>
                  {step}
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <button
              onClick={onClose}
              style={{
                flex: '1 1 auto',
                minWidth: '120px',
                padding: '15px',
                fontSize: '16px',
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

            {/* Analytics Button - Only for Crossword */}
            {isCrosswordGame && (
              <button
                onClick={handleAnalyticsClick}
                style={{
                  flex: '1 1 auto',
                  minWidth: '120px',
                  padding: '15px',
                  fontSize: '16px',
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
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '18px' }}>📊</span>
                Analytics
              </button>
            )}

            <button
              onClick={handleStartGame}
              style={{
                flex: '2 1 auto',
                minWidth: '180px',
                padding: '15px',
                fontSize: '16px',
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