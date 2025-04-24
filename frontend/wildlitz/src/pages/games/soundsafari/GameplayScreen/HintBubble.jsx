// components/SoundSafari/GameplayScreen/HintBubble.jsx

import React from 'react';
import { motion } from 'framer-motion';
import styles from '../../../../styles/games/safari/SoundSafari.module.css';

/**
 * Component for displaying hint bubble
 */
const HintBubble = ({ visibleHint, showHint }) => {
  if (!showHint) return null;
  
  return (
    <motion.div 
      className={styles.hintBubble}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {visibleHint}
    </motion.div>
  );
};

export default HintBubble;