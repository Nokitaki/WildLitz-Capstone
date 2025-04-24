// src/pages/games/soundsafari/ResultScreen/ResultCard.jsx <updated on 2025-04-25>

import React from 'react';
import { motion } from 'framer-motion';
import styles from '../../../../styles/games/safari/SoundSafari.module.css';
import { playSpeech } from '../../../../utils/soundUtils';

/**
 * Component for displaying an animal result card
 */
const ResultCard = ({ 
  animal, 
  resultType = 'correct', // 'correct', 'incorrect', or 'missed'
  isPlaying, 
  setIsPlaying 
}) => {
  // Play animal name when clicked
  const handlePlay = () => {
    if (isPlaying === animal.id) return;
    
    setIsPlaying(animal.id);
    playSpeech(animal.name, 0.8, () => setIsPlaying(null));
  };
  
  // Determine style class based on result type
  const getStyleClass = () => {
    switch(resultType) {
      case 'incorrect': 
        return `${styles.animalResult} ${styles.incorrect}`;
      case 'missed': 
        return `${styles.animalResult} ${styles.missed}`;
      default: 
        return styles.animalResult;
    }
  };
  
  return (
    <motion.div 
      key={animal.id} 
      className={getStyleClass()}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.random() * 0.3 + 0.1 }}
      onClick={handlePlay}
    >
      <div className={styles.animalIcon}>
        {animal.image}
      </div>
      <div className={styles.animalInfo}>
        <div className={styles.animalName}>
          {animal.name}
          <motion.div 
            className={styles.soundIcon}
            animate={isPlaying === animal.id ? { 
              scale: [1, 1.2, 1],
              color: ['#4a9240', '#ffd600', '#4a9240']
            } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            🔊
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default ResultCard;