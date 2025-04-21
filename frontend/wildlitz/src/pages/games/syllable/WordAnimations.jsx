// src/pages/games/syllable/WordAnimations.jsx <current update > 2025-04-21 9:30:00>
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import '../../../styles/WordAnimations.css';

// This component will display animations for specific words
const WordAnimations = ({ word, animationKey, syllableCount, isPlaying }) => {
  const [syllables, setSyllables] = useState([]);
  const [currentSyllable, setCurrentSyllable] = useState(0);
  
  // Initialize syllables when word changes
  useEffect(() => {
    if (!word) return;
    
    // We can customize this logic to use a mapping of word animations
    // For this simple example, we'll just break down the word
    const parts = word.split('-');
    if (parts.length === 1 && syllableCount > 1) {
      // If we only have one part but multiple syllables,
      // create a basic split (this would be replaced by actual data)
      const charsPerSyllable = Math.ceil(word.length / syllableCount);
      const newParts = [];
      
      for (let i = 0; i < syllableCount; i++) {
        const start = i * charsPerSyllable;
        const end = Math.min(start + charsPerSyllable, word.length);
        newParts.push(word.slice(start, end));
      }
      
      setSyllables(newParts);
    } else {
      setSyllables(parts);
    }
    
    // Reset current syllable
    setCurrentSyllable(0);
  }, [word, syllableCount]);
  
  // Handle syllable animation progression
  useEffect(() => {
    if (!isPlaying || syllables.length === 0) return;
    
    let timer;
    
    // Set up animation timing for each syllable
    const animateSyllables = () => {
      if (currentSyllable < syllables.length) {
        // Advance to next syllable after delay
        timer = setTimeout(() => {
          setCurrentSyllable(prev => prev + 1);
        }, 700); // Adjust timing as needed
      }
    };
    
    animateSyllables();
    
    return () => {
      clearTimeout(timer);
    };
  }, [isPlaying, currentSyllable, syllables]);
  
  // Map animation key to specific animation components
  const renderAnimation = () => {
    // This is where you would implement different animations based on the word
    // For this example, we'll use a simple bouncing animation
    
    // In a full implementation, you could have a switch statement for different animations:
    // switch(animationKey) {
    //   case 'cat_animation': return <CatAnimation syllables={syllables} currentSyllable={currentSyllable} />;
    //   case 'dog_animation': return <DogAnimation syllables={syllables} currentSyllable={currentSyllable} />;
    //   // etc for each word
    //   default: return <DefaultAnimation syllables={syllables} currentSyllable={currentSyllable} />;
    // }
    
    return (
      <div className="word-animation-container">
        <div className="syllable-animation">
          {syllables.map((syllable, index) => (
            <motion.div
              key={index}
              className={`syllable-visual ${index === currentSyllable ? 'active' : ''}`}
              animate={index === currentSyllable ? {
                scale: [1, 1.3, 1],
                y: [0, -10, 0],
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
  
  return (
    <div className="word-animation">
      {renderAnimation()}
    </div>
  );
};

export default WordAnimations;