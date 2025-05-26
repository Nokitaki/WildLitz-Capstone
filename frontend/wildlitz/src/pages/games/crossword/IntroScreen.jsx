// src/pages/games/crossword/IntroScreen.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import styles from '../../../styles/games/crossword/IntroScreen.module.css';

/**
 * Introduction screen for Story-Based Crossword Adventures
 * Allows selection of adventure stories
 */
const IntroScreen = ({ onStartGame, storyAdventures, onStartStoryGeneration }) => {
  // Game options
  const [selectedAdventure, setSelectedAdventure] = useState('jungle_quest');
  
  // Handle adventure selection
  const handleAdventureSelect = (adventureId) => {
    setSelectedAdventure(adventureId);
  };
  
  // Handle start game
  const handleStartGame = () => {
    const config = {
      storyMode: true,
      adventureId: selectedAdventure
    };
    
    onStartGame(config);
  };
  
  // Handle create new adventure
  const handleCreateNewAdventure = () => {
    if (onStartStoryGeneration) {
      onStartStoryGeneration();
    }
  };
  
  return (
    <div className={styles.introContainer}>
      <div className={styles.introCard}>
        <div className={styles.headerSection}>
          <h1 className={styles.mainTitle}>Reading Adventures: Crossword Quest</h1>
          <p className={styles.subtitle}>
            Read exciting stories and solve crossword puzzles to improve your reading and vocabulary skills!
          </p>
        </div>
        
        {/* Adventure Selection */}
        <div className={styles.adventureSection}>
          <h2 className={styles.sectionTitle}>Choose Your Adventure:</h2>
          <div className={styles.adventureOptions}>
            {storyAdventures && Object.keys(storyAdventures).map(adventureId => (
              <motion.div
                key={adventureId}
                className={`${styles.adventureCard} ${selectedAdventure === adventureId ? styles.selected : ''}`}
                onClick={() => handleAdventureSelect(adventureId)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={styles.adventureImageContainer}>
                  {adventureId.includes('jungle') ? 
                    <div className={styles.jungleImage}></div> : 
                    adventureId.includes('space') ?
                    <div className={styles.spaceImage}></div> :
                    adventureId.includes('ocean') ?
                    <div className={styles.oceanImage}></div> :
                    adventureId.includes('farm') ?
                    <div className={styles.farmImage}></div> :
                    <div className={styles.defaultImage}></div>
                  }
                </div>
                <div className={styles.adventureContent}>
                  <h3 className={styles.adventureTitle}>{storyAdventures[adventureId].title}</h3>
                  <p className={styles.adventureDescription}>{storyAdventures[adventureId].description}</p>
                  <div className={styles.episodeCount}>
                    {storyAdventures[adventureId].episodes.length} Episodes
                  </div>
                </div>
              </motion.div>
            ))}
            
            {/* Create New Adventure Card */}
            <motion.div
              className={styles.createNewCard}
              onClick={handleCreateNewAdventure}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={styles.createNewImageContainer}>
                <div className={styles.createNewImage}>✨</div>
              </div>
              <div className={styles.adventureContent}>
                <h3 className={styles.createNewTitle}>Create New Adventure</h3>
                <p className={styles.createNewDescription}>
                  Use AI to create a custom story with vocabulary words for your class!
                </p>
                <div className={styles.createNewBadge}>
                  AI Powered
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Teacher Instructions */}
        <div className={styles.teacherInstructions}>
          <div className={styles.instructionIcon}>👩‍🏫</div>
          <div className={styles.instructionContent}>
            <h3>Teacher Instructions:</h3>
            <p>Guide students through the reading passage, then work on the crossword as a class. Words from the story appear in the puzzle!</p>
            <div className={styles.instructionTips}>
              <p><strong>Tips:</strong></p>
              <ul>
                <li>Have different students read passages aloud</li>
                <li>Discuss the highlighted vocabulary words</li>
                <li>Use the Reading Helper for pronunciation and definitions</li>
                <li>Work together to solve the crossword puzzle</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Start Button */}
        <div className={styles.startButtonContainer}>
          <motion.button
            className={styles.startButton}
            onClick={handleStartGame}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Begin Adventure
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default IntroScreen;