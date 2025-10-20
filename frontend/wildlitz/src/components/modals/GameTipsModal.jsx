// src/components/common/GameTipsModal.jsx
// FIXED VERSION - Audio now properly initializes

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Import the animation components
import VanishingGameAnimation from '../animations/VanishingGameAnimation';
import SoundSafariAnimation from '../animations/SoundSafariAnimation';
import CrosswordAnimation from '../animations/CrosswordAnimation';
import SyllableClappingAnimation from '../animations/SyllableClappingAnimation';

const GameTipsModal = ({ isOpen, onClose, game, onStartGame }) => {
  const navigate = useNavigate();
  const [audioEnabled, setAudioEnabled] = useState(false);

  const gameInfo = {
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
  };

  const currentGame = gameInfo[game] || gameInfo['crossword-puzzle'];
  const isCrosswordGame = game === 'crossword-puzzle';

  const handleStartGame = () => {
    console.log('🎮 [GameTipsModal] Starting game with audio enabled');
    if (window.playClickSound) window.playClickSound();
    
    onClose();
    if (onStartGame) {
      onStartGame();
    } else {
      navigate(`/games/${game}`);
    }
  };

  // 🔥 FIXED: Now properly initializes the audio system!
  const handleEnableAudio = async () => {
    console.log('🎵 [GameTipsModal] Enable Audio button clicked!');
    
    // Step 1: Enable the audio in the provider (shows controls, sets state)
    if (typeof window.enableGameAudio === 'function') {
      console.log('✅ [GameTipsModal] Calling window.enableGameAudio()...');
      window.enableGameAudio();
    } else {
      console.error('❌ [GameTipsModal] window.enableGameAudio not found!');
      alert('Audio system not ready. Please refresh the page.');
      return;
    }

    // Step 2: Initialize the actual audio system (Tone.js synths)
    if (typeof window.initAudioSystem === 'function') {
      console.log('🎵 [GameTipsModal] Calling window.initAudioSystem()...');
      const success = await window.initAudioSystem();
      
      if (success) {
        console.log('✅ [GameTipsModal] Audio system initialized successfully!');
        setAudioEnabled(true);
        
        // Step 3: Play test sound to confirm it works
        setTimeout(() => {
          if (window.playClickSound) {
            console.log('🔊 [GameTipsModal] Playing test click sound...');
            window.playClickSound();
          }
        }, 300);
      } else {
        console.error('❌ [GameTipsModal] Audio initialization failed!');
        alert('Failed to initialize audio. Please try again.');
      }
    } else {
      console.error('❌ [GameTipsModal] window.initAudioSystem not found!');
      alert('Audio system not ready. Please refresh the page.');
    }
  };

  if (!isOpen) return null;

  // ✨ BEAUTIFUL CROSSWORD MODAL
  if (isCrosswordGame) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
            overflow: 'auto'
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, y: 100, rotateX: -15 }}
            animate={{ scale: 1, y: 0, rotateX: 0 }}
            exit={{ scale: 0.8, y: 100, rotateX: -15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #f8f9ff 100%)',
              borderRadius: '30px',
              padding: '0',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '95vh',
              overflow: 'hidden',
              boxShadow: '0 30px 90px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.3) inset',
              position: 'relative'
            }}
          >
            {/* Animated Background Pattern */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '200px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '30px 30px 0 0',
              overflow: 'hidden'
            }}>
              <motion.div
                animate={{
                  backgroundPosition: ['0% 0%', '100% 100%']
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  repeatType: 'reverse'
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                  backgroundSize: '200% 200%'
                }}
              />
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                fontSize: '24px',
                cursor: 'pointer',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                transition: 'all 0.3s ease'
              }}
            >
              ×
            </button>

            {/* Content Container */}
            <div style={{ 
              padding: '40px', 
              paddingTop: '120px',
              overflowY: 'auto',
              maxHeight: '95vh'
            }}>
              {/* Game Icon & Title */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                style={{
                  fontSize: '80px',
                  textAlign: 'center',
                  marginBottom: '20px',
                  filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.2))'
                }}
              >
                {currentGame.emoji}
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                  color: '#2c3e50',
                  fontSize: '36px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  marginBottom: '15px',
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                {currentGame.title}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{
                  color: '#7f8c8d',
                  fontSize: '18px',
                  textAlign: 'center',
                  marginBottom: '40px',
                  lineHeight: '1.6'
                }}
              >
                {currentGame.description}
              </motion.p>

              {/* Audio Enable Section - Only show if not enabled */}
              {!audioEnabled && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '20px',
                    padding: '25px',
                    marginBottom: '30px',
                    textAlign: 'center',
                    boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '20px',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎵</div>
                      <p style={{ color: 'white', margin: 0, fontSize: '16px', lineHeight: '1.5' }}>
                        <strong>Enable audio</strong> to enjoy background music and sound effects during gameplay!
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleEnableAudio}
                      style={{
                        padding: '12px 25px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        background: 'white',
                        color: '#667eea',
                        border: 'none',
                        borderRadius: '15px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Enable Audio
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Audio Enabled Confirmation */}
              {audioEnabled && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                    borderRadius: '20px',
                    padding: '20px',
                    marginBottom: '30px',
                    textAlign: 'center',
                    boxShadow: '0 10px 30px rgba(17, 153, 142, 0.3)'
                  }}
                >
                  <div style={{ fontSize: '30px', marginBottom: '10px' }}>🔊</div>
                  <p style={{ color: 'white', margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
                    Audio Enabled! Enjoy the music and sounds!
                  </p>
                </motion.div>
              )}

              {/* How to Play Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: '30px',
                  marginBottom: '30px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
                }}
              >
                <h3 style={{
                  color: '#2c3e50',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span>📖</span> How to Play
                </h3>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0
                }}>
                  {currentGame.howToPlay.map((step, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      style={{
                        padding: '15px',
                        marginBottom: '12px',
                        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        fontSize: '16px',
                        lineHeight: '1.6',
                        color: '#2c3e50'
                      }}
                    >
                      <span style={{
                        background: currentGame.color,
                        color: 'white',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        flexShrink: 0,
                        fontSize: '14px'
                      }}>
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              {/* Game Preview Animation */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 }}
                style={{
                  marginBottom: '30px',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)'
                }}
              >
                {currentGame.component}
              </motion.div>

              {/* Action Buttons - Start Game + Analytics */}
              <div style={{ 
                display: 'flex', 
                gap: '15px',
                marginBottom: '0'
              }}>
                {/* Start Game Button */}
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 15px 40px rgba(102, 126, 234, 0.4)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStartGame}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 }}
                  style={{
                    flex: 2,
                    padding: '20px',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    background: `linear-gradient(135deg, ${currentGame.color} 0%, ${currentGame.color}dd 100%)`,
                    color: 'white',
                    border: 'none',
                    borderRadius: '15px',
                    cursor: 'pointer',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}
                >
                  <span style={{ fontSize: '24px' }}>🎮</span>
                  Start Playing!
                </motion.button>

                {/* Analytics Button */}
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 15px 40px rgba(52, 152, 219, 0.4)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (window.playClickSound) window.playClickSound();
                    navigate('/analytics/crossword');
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  style={{
                    flex: 1,
                    padding: '20px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '15px',
                    cursor: 'pointer',
                    boxShadow: '0 10px 30px rgba(52, 152, 219, 0.3)',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span style={{ fontSize: '22px' }}>📊</span>
                  Analytics
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Simple modal for other games
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
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
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '20px',
              padding: '40px',
              maxWidth: '600px',
              width: '100%',
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

            <div style={{ display: 'flex', gap: '15px' }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '15px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: '#e0e0e0',
                  color: '#555',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Close
              </button>
              <button
                onClick={handleStartGame}
                style={{
                  flex: 2,
                  padding: '15px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: currentGame.color,
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
                }}
              >
                🎮 Start Game
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GameTipsModal;