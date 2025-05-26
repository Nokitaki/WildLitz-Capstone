import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SyllableClappingAnimation = () => {
  const [currentWord, setCurrentWord] = useState(0);
  const [isClapping, setIsClapping] = useState(false);
  const [currentSyllable, setCurrentSyllable] = useState(0);
  const [showClaps, setShowClaps] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIsClapping(true);
      setShowClaps(true);
      setCurrentSyllable(0);
      
      // Animate through syllables
      const syllableInterval = setInterval(() => {
        setCurrentSyllable(prev => {
          const nextSyllable = prev + 1;
          if (nextSyllable >= words[currentWord].syllables.length) {
            clearInterval(syllableInterval);
            setTimeout(() => {
              setIsClapping(false);
              setShowClaps(false);
              setCurrentWord(prev => (prev + 1) % words.length);
            }, 800);
            return prev;
          }
          return nextSyllable;
        });
      }, 600);
      
    }, 3500);
    
    return () => clearInterval(interval);
  }, []);

  const words = [
    { 
      word: 'ELEPHANT', 
      syllables: ['EL', 'E', 'PHANT'], 
      colors: ['#FF6B6B', '#4ECDC4', '#45B7D1'] 
    },
    { 
      word: 'BUTTERFLY', 
      syllables: ['BUT', 'TER', 'FLY'], 
      colors: ['#96CEB4', '#FFEAA7', '#DDA0DD'] 
    },
    { 
      word: 'BANANA', 
      syllables: ['BA', 'NA', 'NA'], 
      colors: ['#FFD93D', '#6BCF7F', '#FF8A80'] 
    }
  ];

  const currentWordData = words[currentWord];

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '220px',
      background: 'linear-gradient(135deg, #FFE5B4 0%, #FFCCCB 30%, #E0E0E0 60%, #B0E0E6 100%)',
      borderRadius: '16px 16px 0 0',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      willChange: 'transform'
    }}>
      
      {/* Background musical notes */}
      <motion.div
        style={{
          position: 'absolute',
          top: '12px',
          left: '15px',
          fontSize: '16px',
          willChange: 'transform'
        }}
        animate={{ 
          rotate: [0, 15, -15, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        🎵
      </motion.div>
      
      <motion.div
        style={{
          position: 'absolute',
          top: '8px',
          right: '20px',
          fontSize: '14px',
          willChange: 'transform'
        }}
        animate={{ 
          y: [0, -8, 0],
          opacity: [0.7, 1, 0.7]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        🎶
      </motion.div>

      {/* Teacher/Student Character */}
      <motion.div
        style={{
          position: 'absolute',
          left: '20px',
          bottom: '15px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          willChange: 'transform'
        }}
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Head */}
        <div style={{
          width: '24px',
          height: '24px',
          backgroundColor: '#FFDBAC',
          borderRadius: '50%',
          border: '2px solid #D2691E',
          position: 'relative',
          marginBottom: '2px'
        }}>
          {/* Eyes */}
          <div style={{
            position: 'absolute',
            top: '7px',
            left: '6px',
            width: '3px',
            height: '3px',
            backgroundColor: '#000',
            borderRadius: '50%'
          }} />
          <div style={{
            position: 'absolute',
            top: '7px',
            right: '6px',
            width: '3px',
            height: '3px',
            backgroundColor: '#000',
            borderRadius: '50%'
          }} />
          {/* Smile */}
          <div style={{
            position: 'absolute',
            bottom: '6px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '8px',
            height: '4px',
            border: '2px solid #000',
            borderTop: 'none',
            borderRadius: '0 0 8px 8px'
          }} />
        </div>
        
        {/* Body */}
        <div style={{
          width: '26px',
          height: '22px',
          backgroundColor: '#FF69B4',
          borderRadius: '0 0 13px 13px',
          border: '2px solid #FF1493'
        }} />
        
        {/* Hands/Arms - Clapping motion */}
        <motion.div
          style={{
            position: 'absolute',
            left: '-8px',
            top: '20px',
            willChange: 'transform'
          }}
          animate={isClapping ? {
            rotate: [0, -15, 15, 0],
            x: [0, 2, -2, 0]
          } : { rotate: 0, x: 0 }}
          transition={{ 
            duration: 0.6, 
            repeat: isClapping ? (currentWordData.syllables.length - 1) : 0,
            ease: "easeInOut"
          }}
        >
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: '#FFDBAC',
            borderRadius: '50%',
            border: '1px solid #D2691E'
          }} />
        </motion.div>
        
        <motion.div
          style={{
            position: 'absolute',
            right: '-8px',
            top: '20px',
            willChange: 'transform'
          }}
          animate={isClapping ? {
            rotate: [0, 15, -15, 0],
            x: [0, -2, 2, 0]
          } : { rotate: 0, x: 0 }}
          transition={{ 
            duration: 0.6, 
            repeat: isClapping ? (currentWordData.syllables.length - 1) : 0,
            ease: "easeInOut"
          }}
        >
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: '#FFDBAC',
            borderRadius: '50%',
            border: '1px solid #D2691E'
          }} />
        </motion.div>
      </motion.div>

      {/* Main Word Display */}
      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Word Title */}
        <motion.div
          key={`word-${currentWord}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '10px'
          }}
        >
          {currentWordData.word}
        </motion.div>

        {/* Syllables Display */}
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {currentWordData.syllables.map((syllable, index) => (
            <motion.div
              key={`${currentWord}-${index}`}
              style={{
                backgroundColor: index <= currentSyllable && isClapping ? 
                  currentWordData.colors[index] : '#F0F0F0',
                color: index <= currentSyllable && isClapping ? 'white' : '#666',
                padding: '8px 12px',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: 'bold',
                border: '2px solid',
                borderColor: index <= currentSyllable && isClapping ? 
                  currentWordData.colors[index] : '#DDD',
                willChange: 'transform',
                minWidth: '45px',
                textAlign: 'center'
              }}
              animate={index === currentSyllable && isClapping ? {
                scale: [1, 1.2, 1],
                y: [0, -5, 0]
              } : { scale: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {syllable}
            </motion.div>
          ))}
        </div>

        {/* Clap Count Display */}
        <motion.div
          style={{
            marginTop: '8px',
            fontSize: '12px',
            color: '#666',
            fontWeight: 'bold'
          }}
          animate={{ opacity: isClapping ? 1 : 0.7 }}
        >
          {currentWordData.syllables.length} claps
        </motion.div>
      </div>

      {/* Clapping Visual Effects */}
      <AnimatePresence>
        {showClaps && (
          <>
            {Array.from({ length: currentWordData.syllables.length }).map((_, index) => (
              <motion.div
                key={`clap-${currentWord}-${index}`}
                initial={{ 
                  opacity: 0,
                  scale: 0,
                  x: 0,
                  y: 0
                }}
                animate={{ 
                  opacity: index <= currentSyllable ? [0, 1, 0] : 0,
                  scale: index <= currentSyllable ? [0, 1.5, 0] : 0,
                  x: (Math.random() - 0.5) * 100,
                  y: (Math.random() - 0.5) * 80
                }}
                exit={{ opacity: 0 }}
                transition={{ 
                  duration: 0.8,
                  delay: index * 0.6
                }}
                style={{
                  position: 'absolute',
                  fontSize: '20px',
                  left: '50%',
                  top: '50%',
                  willChange: 'transform'
                }}
              >
                👏
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Rhythm Indicators */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '4px'
      }}>
        {currentWordData.syllables.map((_, index) => (
          <motion.div
            key={`rhythm-${index}`}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: index <= currentSyllable && isClapping ? 
                currentWordData.colors[index] : '#CCC',
              willChange: 'transform'
            }}
            animate={index === currentSyllable && isClapping ? {
              scale: [1, 1.5, 1]
            } : { scale: 1 }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>

      {/* Corner decorations */}
      <div style={{
        position: 'absolute',
        bottom: '8px',
        right: '15px',
        fontSize: '16px'
      }}>📚</div>
      
      <motion.div
        style={{
          position: 'absolute',
          top: '50%',
          right: '8px',
          transform: 'translateY(-50%)',
          fontSize: '12px',
          willChange: 'transform'
        }}
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 10, -10, 0]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        ✋
      </motion.div>

      {/* Floating learning elements */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`float-${i}`}
          style={{
            position: 'absolute',
            fontSize: '10px',
            left: `${20 + i * 25}%`,
            top: `${25 + i * 15}%`,
            willChange: 'transform'
          }}
          animate={{
            y: [0, -8, 0],
            opacity: [0.5, 1, 0.5],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            delay: i * 0.8,
            ease: "easeInOut"
          }}
        >
          {['🎯', '🌟', '📖'][i]}
        </motion.div>
      ))}

      {/* Syllable separator lines */}
      <AnimatePresence>
        {isClapping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              top: '30%',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '20px'
            }}
          >
            {Array.from({ length: currentWordData.syllables.length - 1 }).map((_, index) => (
              <motion.div
                key={`separator-${index}`}
                style={{
                  width: '2px',
                  height: '40px',
                  backgroundColor: '#999',
                  borderRadius: '1px'
                }}
                animate={{
                  scaleY: [0, 1, 0]
                }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.6
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SyllableClappingAnimation;