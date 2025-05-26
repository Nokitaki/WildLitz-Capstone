import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Import the animation components
import VanishingGameAnimation from '../animations/VanishingGameAnimation';
import SoundSafariAnimation from '../animations/SoundSafariAnimation';
import CrosswordAnimation from '../animations/CrosswordAnimation';
import SyllableClappingAnimation from '../animations/SyllableClappingAnimation';

const GameTipsModal = ({ isOpen, onClose, game, onStartGame }) => {
  // Game information data
  const gameInfo = {
    'syllable-clapping': {
      title: 'Syllable Clapping Game',
      description: 'Practice breaking words into syllables with fun clapping activities!',
      component: <SyllableClappingAnimation />,
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
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{
            backgroundColor: '#4B352A',
            borderRadius: '20px',
            padding: '0',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'hidden',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
              background: '#FFC107',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#333',
              zIndex: 10,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}
          >
            ×
          </button>

          {/* Header */}
          <div style={{
            textAlign: 'center',
            padding: '30px 20px 20px',
            color: '#FFC107'
          }}>
            <h2 style={{
              fontSize: '2rem',
              margin: '0 0 10px',
              fontWeight: 'bold'
            }}>
              {currentGame.title}
            </h2>
            <p style={{
              fontSize: '1rem',
              margin: 0,
              color: 'white',
              opacity: 0.9
            }}>
              {currentGame.description}
            </p>
          </div>

          {/* Content */}
          <div style={{
            display: 'flex',
            padding: '0 20px 20px',
            gap: '20px',
            alignItems: 'flex-start'
          }}>
            {/* Left side - Game visual */}
            <div style={{
              flex: '0 0 200px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <div style={{
                width: '200px',
                height: '150px',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}>
                {currentGame.component}
              </div>
            </div>

            {/* Right side - How to play */}
            <div style={{
              flex: 1,
              color: 'white'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                margin: '0 0 15px',
                color: '#FFC107',
                fontWeight: 'bold'
              }}>
                How to Play:
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
                    transition={{ delay: index * 0.1 }}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      marginBottom: '12px',
                      fontSize: '0.95rem',
                      lineHeight: '1.4'
                    }}
                  >
                    <span style={{
                      display: 'inline-block',
                      width: '20px',
                      height: '20px',
                      backgroundColor: '#FFC107',
                      color: '#333',
                      borderRadius: '50%',
                      textAlign: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      lineHeight: '20px',
                      marginRight: '12px',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer with play button */}
          <div style={{
            padding: '20px',
            textAlign: 'center',
            borderTop: '2px solid rgba(255, 193, 7, 0.3)'
          }}>
            <motion.button
              onClick={onStartGame}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                backgroundColor: '#FFC107',
                color: '#333',
                border: 'none',
                borderRadius: '25px',
                padding: '12px 40px',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              Let's Play!
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GameTipsModal;