// src/components/animations/FloatingEmojis.jsx
import React from 'react';
import { motion } from 'framer-motion';
import styles from '../../styles/games/vanishing/FloatingEmojis.module.css';

const FloatingEmojis = () => {
  const emojis = ['🎩', '🐇', '✨', '🪄', '🌟'];

  return (
    <div className={styles.emojiContainer}>
      {emojis.map((emoji, i) => (
        <motion.div
          key={i}
          className={styles.emoji}
          initial={{
            opacity: 0,
            y: '100vh',
            scale: Math.random() * 0.4 + 0.8, // Scale between 0.8 and 1.2
            left: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0, 0.7, 0.7, 0],
            y: '-10vh',
          }}
          transition={{
            duration: Math.random() * 8 + 12, // Duration between 12 and 20 seconds
            repeat: Infinity,
            repeatType: 'loop',
            delay: i * 1.5, // Reduced delay for more continuous flow
            ease: 'linear',
          }}
        >
          {emoji}
        </motion.div>
      ))}
    </div>
  );
};

export default FloatingEmojis;
