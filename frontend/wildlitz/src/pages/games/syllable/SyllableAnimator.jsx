import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import '../../../styles/SyllableAnimator.css';

// This component handles the animation timing for syllables
const SyllableAnimator = ({ 
  word, 
  syllableBreakdown, 
  isPlaying,
  onComplete,
  highlightColor = "#4dabf7"
}) => {
  const [syllables, setSyllables] = useState([]);
  const [activeSyllable, setActiveSyllable] = useState(-1);
  const timerRef = useRef(null);
  
  // Parse the syllables when the word changes
  useEffect(() => {
    if (!syllableBreakdown) {
      setSyllables([word]); // If no breakdown, use the whole word
      return;
    }
    
    const parts = syllableBreakdown.split('-');
    setSyllables(parts);
    setActiveSyllable(-1); // Reset active syllable
  }, [word, syllableBreakdown]);
  
  // Handle animation playback
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    if (!isPlaying || syllables.length === 0) {
      return;
    }
    
    // Function to animate through syllables
    const animateSyllables = (index = 0) => {
      setActiveSyllable(index);
      
      // If we've animated all syllables
      if (index >= syllables.length - 1) {
        timerRef.current = setTimeout(() => {
          setActiveSyllable(-1); // Reset highlight
          if (onComplete) onComplete();
        }, 1000);
        return;
      }
      
      // Animate next syllable after delay
      timerRef.current = setTimeout(() => {
        animateSyllables(index + 1);
      }, 700); // Time between syllables
    };
    
    // Start animation sequence
    animateSyllables(0);
    
    // Cleanup timer on unmount or when dependencies change
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isPlaying, syllables, onComplete]);
  
  // Render syllables with animation
  return (
    <div className="syllable-animator">
      <div className="syllable-container">
        {syllables.map((syllable, index) => (
          <motion.div
            key={index}
            className={`syllable ${activeSyllable === index ? 'active' : ''}`}
            style={{ 
              backgroundColor: activeSyllable === index ? highlightColor : '#e9ecef'
            }}
            animate={activeSyllable === index ? {
              scale: [1, 1.2, 1], 
              y: [0, -10, 0]
            } : {}}
            transition={{ duration: 0.5 }}
          >
            {syllable}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SyllableAnimator;