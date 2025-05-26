import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Import the animation components
import VanishingGameAnimation from '../animations/VanishingGameAnimation';
import SoundSafariAnimation from '../animations/SoundSafariAnimation';
import CrosswordAnimation from '../animations/CrosswordAnimation';
import SyllableClappingAnimation from '../animations/SyllableClappingAnimation';

const GameTipsModal = ({ isOpen, onClose, game, onStartGame }) => {
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
      color: '#96CEB4',
      emoji: '🧩',
      howToPlay: [
        'Read each clue carefully before answering',
        'Look for clues that might be easier to solve first',
        'Use letter intersections to help figure out difficult words',
        'Think about words that match both the clue and the available spaces'
      ]
    }
  };

  const currentGame = gameInfo[game] || gameInfo['syllable-clapping'];

  if (!isOpen) return null;

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
          background: 'linear-gradient(135deg, rgba(75, 53, 42, 0.95), rgba(93, 64, 55, 0.95))',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.7, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.7, opacity: 0, y: 50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          style={{
            background: `linear-gradient(135deg,
              rgba(139, 95, 68, 0.98) 0%,
              rgba(160, 116, 89, 0.98) 25%,
              rgba(181, 137, 110, 0.98) 50%,
              rgba(202, 158, 131, 0.98) 75%,
              rgba(223, 179, 152, 0.98) 100%)`,
            borderRadius: '25px',
            padding: 0,
            maxWidth: '600px',
            width: '100%',
            maxHeight: '85vh',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: `0 20px 50px rgba(0, 0, 0, 0.4),
                       0 0 0 3px ${currentGame.color}40,
                       0 0 25px ${currentGame.color}30`,
            border: `3px solid ${currentGame.color}60`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            overflow: 'hidden',
            pointerEvents: 'none'
          }}>
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  fontSize: '20px',
                  opacity: 0.3
                }}
                animate={{
                  y: [0, -20, 0],
                  x: [0, Math.random() * 20 - 10, 0],
                  rotate: [0, 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 4 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
              >
                {['🌟', '✨', '🎮', '📚', '🎯', '⭐'][Math.floor(Math.random() * 6)]}
              </motion.div>
            ))}
          </div>

          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
              background: `linear-gradient(45deg, ${currentGame.color}, ${currentGame.color}CC)`,
              border: 'none',
              borderRadius: '50%',
              width: '45px',
              height: '45px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'white',
              zIndex: 10,
              boxShadow: `0 4px 15px ${currentGame.color}50`
            }}
          >
            ×
          </motion.button>

          <div style={{ textAlign: 'center', padding: '20px 15px 10px' }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              style={{ fontSize: '2.5rem', marginBottom: '8px' }}
            >
              {currentGame.emoji}
            </motion.div>

            <motion.h2
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{
                fontSize: '1.8rem',
                fontWeight: 'bold',
                background: `linear-gradient(45deg, ${currentGame.color}, #FF6B9D, #4ECDC4)`,
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontFamily: 'Fredoka One, cursive',
                textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              {currentGame.title}
            </motion.h2>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              style={{
                fontSize: '1rem',
                color: '#2C1810',
                opacity: 0.9,
                fontFamily: 'Bubblegum Sans, cursive',
                fontWeight: '600'
              }}
            >
              {currentGame.description}
            </motion.p>
          </div>

          <div style={{ display: 'flex', padding: '0 25px 20px', gap: '25px', alignItems: 'flex-start' }}>
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{
                flex: '0 0 220px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <div style={{
                width: '220px',
                height: '160px',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: `0 8px 25px rgba(0,0,0,0.2), 0 0 0 3px ${currentGame.color}60`,
                border: `2px solid ${currentGame.color}`,
                position: 'relative'
              }}>
                {currentGame.component}
              </div>
            </motion.div>

            <motion.ul
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              style={{
                margin: 0,
                padding: 0,
                listStyleType: 'disc',
                fontSize: '0.95rem',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 500,
                color: '#2C1810',
                lineHeight: '1.5'
              }}
            >
              {currentGame.howToPlay.map((step, idx) => (
                <li key={idx} style={{ marginBottom: '10px' }}>{step}</li>
              ))}
            </motion.ul>
          </div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStartGame}
            style={{
              background: currentGame.color,
              margin: '0 25px 25px',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              padding: '10px 20px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '1rem',
              textAlign: 'center',
              fontFamily: 'Poppins, sans-serif',
              boxShadow: `0 4px 15px ${currentGame.color}70`
            }}
          >
            Start Game
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GameTipsModal;
