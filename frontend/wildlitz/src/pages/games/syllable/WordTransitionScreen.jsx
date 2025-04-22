// src/pages/games/syllable/WordTransitionScreen.jsx
import React from 'react';
import { motion } from 'framer-motion';
import styles from '../../../styles/games/syllable/WordTransitionScreen.module.css';

const WordTransitionScreen = ({ wordIndex, totalWords, tip }) => {
  // Simple dot animation for loading indicator
  const dotVariants = {
    jump: {
      y: -10,
      transition: {
        duration: 0.5,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
      },
    },
  };

  return (
    <div className={styles.transitionContainer}>
      <div className={styles.transitionContent}>
        <h2 className={styles.transitionTitle}>Next Word Coming Up...</h2>
        
        <motion.div 
          className={styles.dotsContainer}
          animate="jump"
          transition={{ staggerChildren: 0.2 }}
        >
          <motion.div className={styles.dot} variants={dotVariants} />
          <motion.div className={styles.dot} variants={dotVariants} />
          <motion.div className={styles.dot} variants={dotVariants} />
        </motion.div>
        
        <div className={styles.progressInfo}>
          <span>Word {wordIndex} of {totalWords}</span>
        </div>
        
        {tip && (
          <div className={styles.tipBox}>
            <span role="img" aria-label="Tip">💡</span> <strong>Tip:</strong> {tip}
          </div>
        )}
      </div>
    </div>
  );
};

export default WordTransitionScreen;