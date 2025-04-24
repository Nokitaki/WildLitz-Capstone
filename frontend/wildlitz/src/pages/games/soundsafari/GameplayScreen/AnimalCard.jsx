// components/SoundSafari/GameplayScreen/AnimalCard.jsx

import React from 'react';
import { motion } from 'framer-motion';
import styles from '../../../../styles/games/safari/SoundSafari.module.css';
import { playSpeech } from '../../../../utils/soundUtils';

/**
 * Component for displaying an animal card that can be selected
 */
const AnimalCard = ({ 
  animal, 
  isSelected, 
  onToggleSelect, 
  isPlaying,
  setIsPlaying 
}) => {
  // Play animal name
  const playAnimalSound = (e) => {
    e.stopPropagation(); // Prevent toggling selection when playing sound
    
    setIsPlaying(animal.id);
    playSpeech(animal.name, 0.8, () => setIsPlaying(null));
  };
  
  return (
    <motion.div 
      key={animal.id}
      className={`${styles.animalCard} ${isSelected ? styles.selected : ''}`}
      onClick={() => onToggleSelect(animal)}
      whileHover={{ scale: 1.05, boxShadow: "0 8px 16px rgba(0,0,0,0.2)" }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.random() * 0.5 }}
    >
      <div className={styles.animalImage}>
        {animal.image}
      </div>
      <div className={styles.animalName}>
        {animal.name}
        <motion.button 
          className={styles.soundButton}
          onClick={(e) => playAnimalSound(e)}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          disabled={isPlaying !== null}
        >
          {isPlaying === animal.id ? '🔊' : '🔊'}
        </motion.button>
      </div>
      {isSelected && (
        <motion.div 
          className={styles.checkmark}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          ✓
        </motion.div>
      )}
    </motion.div>
  );
};

export default AnimalCard;