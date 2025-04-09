import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../../styles/game_tips_modal.css';

function GameTipsModal({ isOpen, onClose, game, onStartGame }) {
    // Modal content based on game type
    const getGameContent = () => {
      switch(game) {
        case 'syllable-clapping':
          return {
            title: 'Syllable Clapping Game',
            description: 'Learn to break words into syllables through interactive clapping!',
            tips: [
              'Listen carefully to the word pronunciation',
              'Clap once for each syllable you hear',
              'Say the word out loud while clapping',
              'Count the number of claps to identify syllable count'
            ],
            image: '/assets/img/syllable-clapping-game.jpg'
          };
        case 'sound-safari':
          return {
            title: 'Sound Safari',
            description: 'Hunt for specific sounds in words to develop phonemic awareness!',
            tips: [
              'Listen for the target sound announced at the beginning',
              'Identify animals and objects that contain the target sound',
              'Pay attention to the position of sounds (beginning, middle, or end)',
              'Raise your hand when you hear the target sound in a word'
            ],
            image: '/assets/img/sound-safari-game.jpg'
          };
        case 'vanishing-game':
          return {
            title: 'Vanishing Game',
            description: 'Improve word recognition and memory as words gradually disappear!',
            tips: [
              'Read and memorize words before they start to fade',
              'Pay special attention to letter patterns and phonics',
              'Say the word out loud after it disappears',
              'Look for familiar word parts to help recognition'
            ],
            image: '/assets/img/vanishing-game.jpg'
          };
        case 'crossword-puzzle':
          return {
            title: 'Crossword Puzzle',
            description: 'Build vocabulary and sentence structure with fun word puzzles!',
            tips: [
              'Read each clue carefully before answering',
              'Look for clues that might be easier to solve first',
              'Use letter intersections to help figure out difficult words',
              'Think about words that match both the clue and the available spaces'
            ],
            image: '/assets/img/crossword-game.png'
          };
        default:
          return {
            title: 'Game Tips',
            description: 'Get ready to play!',
            tips: ['Have fun!'],
            image: null
          };
      }
    };
  
    const content = getGameContent();
  
    // Animation variants
    const backdropVariants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1 }
    };
  
    const modalVariants = {
      hidden: { 
        y: "-100vh",
        opacity: 0 
      },
      visible: { 
        y: 0,
        opacity: 1,
        transition: { 
          type: "spring", 
          damping: 25, 
          stiffness: 300,
          delay: 0.2
        } 
      },
      exit: { 
        y: "100vh",
        opacity: 0,
        transition: { ease: "easeInOut" }
      }
    };
  
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="modal-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <motion.div 
              className="modal-container"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <motion.button 
                className="close-button"
                onClick={onClose}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                ×
              </motion.button>
  
              <div className="modal-content">
                <div className="modal-header">
                  <h2>{content.title}</h2>
                  <p className="game-description">{content.description}</p>
                </div>
  
                <div className="modal-body">
                  {content.image && (
                    <div className="image-container">
                      <motion.img 
                        src={content.image} 
                        alt={content.title}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                      />
                    </div>
                  )}
  
                  <div className="tips-container">
                    <h3>How to Play:</h3>
                    <ul>
                      {content.tips.map((tip, index) => (
                        <motion.li 
                          key={index}
                          initial={{ opacity: 0, x: -50 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + (index * 0.1) }}
                        >
                          {tip}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </div>
  
                <div className="modal-footer">
                  <motion.button 
                    className="start-game-button"
                    onClick={onStartGame}
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: "0 5px 15px rgba(255, 193, 7, 0.4)"
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Let's Play!
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
  
  export default GameTipsModal;