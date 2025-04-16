import React from 'react';
import { motion } from 'framer-motion';
import '../../../styles/games/syllable/SampleWordAnimations.module.css'; // Import your CSS styles for animations

// This file contains sample implementations for specific word animations
// You can expand this with more animations for your fixed word set

// Cat Animation Component
const CatAnimation = ({ syllables, currentSyllable }) => {
  return (
    <div className="cat-animation-container">
      <motion.div 
        className="cat-image"
        animate={currentSyllable > -1 ? {
          rotate: [0, 5, 0, -5, 0],
        } : {}}
        transition={{ duration: 0.6 }}
      />
      
      <div className="syllable-text-container">
        {syllables.map((syllable, index) => (
          <motion.div
            key={index}
            className={`syllable-text ${index === currentSyllable ? 'active' : ''}`}
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

// Elephant Animation Component
const ElephantAnimation = ({ syllables, currentSyllable }) => {
  return (
    <div className="elephant-animation-container">
      <div className="elephant-body">
        <motion.div 
          className="elephant-trunk"
          animate={currentSyllable > -1 ? {
            rotate: [0, 15, 0, 15, 0],
          } : {}}
          transition={{ duration: 0.8 }}
        />
        <div className="elephant-head" />
        <div className="elephant-ear-left" />
        <div className="elephant-ear-right" />
      </div>
      
      <div className="syllable-text-container">
        {syllables.map((syllable, index) => (
          <motion.div
            key={index}
            className={`syllable-text ${index === currentSyllable ? 'active' : ''}`}
            animate={index === currentSyllable ? {
              scale: [1, 1.2, 1],
              y: [0, -15, 0],
            } : {}}
            transition={{ duration: 0.6 }}
          >
            {syllable}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Butterfly Animation Component
const ButterflyAnimation = ({ syllables, currentSyllable }) => {
  return (
    <div className="butterfly-animation-container">
      <div className="butterfly-body">
        <motion.div 
          className="butterfly-wing-left"
          animate={currentSyllable > -1 ? {
            rotate: [0, 15, 0, 15, 0],
            scaleX: [1, 1.1, 1, 1.1, 1]
          } : {}}
          transition={{ duration: 0.5, repeat: syllables.length }}
        />
        <motion.div 
          className="butterfly-wing-right"
          animate={currentSyllable > -1 ? {
            rotate: [0, -15, 0, -15, 0],
            scaleX: [1, 1.1, 1, 1.1, 1]
          } : {}}
          transition={{ duration: 0.5, repeat: syllables.length }}
        />
      </div>
      
      <div className="syllable-text-container">
        {syllables.map((syllable, index) => (
          <motion.div
            key={index}
            className={`syllable-text ${index === currentSyllable ? 'active' : ''}`}
            animate={index === currentSyllable ? {
              scale: [1, 1.2, 1],
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

// Watermelon Animation Component for a 4-syllable word
const WatermelonAnimation = ({ syllables, currentSyllable }) => {
  // Generate slices based on syllable count
  const sliceCount = syllables.length;
  const sliceAngle = 360 / sliceCount;
  
  return (
    <div className="watermelon-animation-container">
      <div className="watermelon-circle">
        {syllables.map((_, index) => (
          <motion.div 
            key={index}
            className="watermelon-slice"
            style={{ 
              transform: `rotate(${index * sliceAngle}deg)`,
              transformOrigin: 'bottom center'
            }}
            animate={index === currentSyllable ? {
              scale: [1, 1.1, 1],
              y: [0, -5, 0]
            } : {}}
            transition={{ duration: 0.4 }}
          />
        ))}
        <div className="watermelon-center" />
      </div>
      
      <div className="syllable-text-container">
        {syllables.map((syllable, index) => (
          <motion.div
            key={index}
            className={`syllable-text ${index === currentSyllable ? 'active' : ''}`}
            animate={index === currentSyllable ? {
              scale: [1, 1.2, 1],
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

// The main component that selects the appropriate animation
const SampleWordAnimations = ({ word, animationKey, syllables, currentSyllable }) => {
  const renderAnimationByKey = () => {
    switch(animationKey) {
      case 'cat_animation':
        return <CatAnimation syllables={syllables} currentSyllable={currentSyllable} />;
      case 'elephant_animation':
        return <ElephantAnimation syllables={syllables} currentSyllable={currentSyllable} />;
      case 'butterfly_animation':
        return <ButterflyAnimation syllables={syllables} currentSyllable={currentSyllable} />;
      case 'watermelon_animation':
        return <WatermelonAnimation syllables={syllables} currentSyllable={currentSyllable} />;
      default:
        // Default animation for words without specific animations
        return (
          <div className="default-animation-container">
            <div className="syllable-text-container">
              {syllables.map((syllable, index) => (
                <motion.div
                  key={index}
                  className={`syllable-text ${index === currentSyllable ? 'active' : ''}`}
                  animate={index === currentSyllable ? {
                    scale: [1, 1.2, 1],
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
    }
  };
  
  return (
    <div className="sample-word-animation">
      {renderAnimationByKey()}
    </div>
  );
};

export default SampleWordAnimations;