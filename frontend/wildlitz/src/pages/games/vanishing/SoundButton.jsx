// src/components/SoundButton.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import styles from "../../../styles/games/vanishing/SoundButton.module.css";
import vanishingAudioService from "../../../services/vanishingAudioService";

/**
 * 🔊 Sound Button Component
 * Plays audio for words, sentences, or any text
 * @param {string} text - The text to be read aloud
 * @param {string} voiceType - Voice character: 'happy', 'gentle', 'playful', 'friendly'
 * @param {string} size - Button size: 'small', 'medium', 'large'
 * @param {boolean} disabled - Whether the button is disabled
 */
const SoundButton = ({ 
  text, 
  voiceType = 'friendly', 
  size = 'medium',
  disabled = false,
  className = ''
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleClick = async () => {
    if (disabled || isPlaying || !text) return;
    
    setIsPlaying(true);
    
    try {
      // Use the vanishing audio service to speak the word
      await vanishingAudioService.speakWord(text, { voiceType });
    } catch (error) {
      console.error('Error playing sound:', error);
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <motion.button
      className={`${styles.soundButton} ${styles[size]} ${className} ${isPlaying ? styles.playing : ''}`}
      onClick={handleClick}
      disabled={disabled || isPlaying}
      whileHover={!disabled && !isPlaying ? { scale: 1.1 } : {}}
      whileTap={!disabled && !isPlaying ? { scale: 0.95 } : {}}
      animate={isPlaying ? { 
        scale: [1, 1.2, 1], 
        rotate: [0, 10, -10, 0] 
      } : {}}
      transition={{ duration: 0.3 }}
      title={`Click to hear "${text}"`}
    >
      {isPlaying ? (
        // Playing animation - sound waves
        <motion.div
          className={styles.soundWaves}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
        >
          🔊
        </motion.div>
      ) : (
        // Default speaker icon
        <span className={styles.speakerIcon}>🔉</span>
      )}
    </motion.button>
  );
};

export default SoundButton;