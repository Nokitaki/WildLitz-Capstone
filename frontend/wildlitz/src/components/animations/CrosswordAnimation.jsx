import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CrosswordAnimation = () => {
  const [currentWord, setCurrentWord] = useState(0);
  const [fillingLetters, setFillingLetters] = useState(false);
  const [completedCells, setCompletedCells] = useState(new Set());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setFillingLetters(true);
      
      setTimeout(() => {
        setCurrentWord((prev) => (prev + 1) % 3);
        setCompletedCells(prev => {
          const newSet = new Set(prev);
          // Add some random cells as completed
          for (let i = 0; i < 3; i++) {
            newSet.add(Math.floor(Math.random() * 16));
          }
          if (newSet.size > 12) {
            newSet.clear(); // Reset when too many are filled
          }
          return newSet;
        });
        setFillingLetters(false);
      }, 1000);
    }, 3500);
    
    return () => clearInterval(interval);
  }, []);

  const words = [
    { word: 'CAT', color: '#FF6B6B', cells: [0, 1, 2] },
    { word: 'BOOK', color: '#4ECDC4', cells: [4, 8, 12, 13] },
    { word: 'READ', color: '#45B7D1', cells: [6, 7, 11, 15] }
  ];

  // Create a 4x4 grid
  const gridCells = Array.from({ length: 16 }, (_, i) => i);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '220px',
      background: 'linear-gradient(135deg, #E8F4FD 0%, #B8E6B8 50%, #FFE4B5 100%)',
      borderRadius: '16px 16px 0 0',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      willChange: 'transform'
    }}>
      
      {/* Floating Books */}
      <motion.div
        style={{
          position: 'absolute',
          top: '12px',
          left: '15px',
          fontSize: '18px',
          willChange: 'transform'
        }}
        animate={{ 
          y: [0, -8, 0],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        📚
      </motion.div>
      
      <motion.div
        style={{
          position: 'absolute',
          top: '8px',
          right: '15px',
          fontSize: '16px',
          willChange: 'transform'
        }}
        animate={{ 
          x: [0, 5, -5, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        📖
      </motion.div>

      {/* Student Character */}
      <motion.div
        style={{
          position: 'absolute',
          left: '18px',
          bottom: '12px',
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
          width: '22px',
          height: '22px',
          backgroundColor: '#FFDBAC',
          borderRadius: '50%',
          border: '2px solid #D2691E',
          position: 'relative',
          marginBottom: '2px'
        }}>
          {/* Eyes */}
          <div style={{
            position: 'absolute',
            top: '6px',
            left: '5px',
            width: '3px',
            height: '3px',
            backgroundColor: '#000',
            borderRadius: '50%'
          }} />
          <div style={{
            position: 'absolute',
            top: '6px',
            right: '5px',
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
          width: '24px',
          height: '20px',
          backgroundColor: '#4169E1',
          borderRadius: '0 0 12px 12px',
          border: '2px solid #191970'
        }} />
        
        {/* Pencil */}
        <motion.div
          style={{
            position: 'absolute',
            right: '-10px',
            top: '15px',
            willChange: 'transform'
          }}
          animate={{ 
            rotate: fillingLetters ? [0, 15, -15, 0] : 0,
            x: fillingLetters ? [0, 2, -2, 0] : 0
          }}
          transition={{ duration: 0.3, repeat: fillingLetters ? 3 : 0 }}
        >
          <div style={{
            width: '12px',
            height: '3px',
            backgroundColor: '#FFD700',
            borderRadius: '1px'
          }} />
          <div style={{
            width: '3px',
            height: '3px',
            backgroundColor: '#FF69B4',
            borderRadius: '1px',
            marginLeft: '12px',
            marginTop: '-3px'
          }} />
        </motion.div>
      </motion.div>

      {/* Main Crossword Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '2px',
        width: '120px',
        height: '120px',
        position: 'relative'
      }}>
        {gridCells.map((index) => {
          const isInCurrentWord = words[currentWord].cells.includes(index);
          const isCompleted = completedCells.has(index);
          const isActive = index % 5 === currentWord; // Some cells are active
          
          return (
            <motion.div
              key={index}
              style={{
                width: '28px',
                height: '28px',
                backgroundColor: isActive || isInCurrentWord ? '#FFFFFF' : '#F0F0F0',
                border: '2px solid #333',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 'bold',
                color: isCompleted ? words[currentWord].color : '#333',
                willChange: 'transform'
              }}
              animate={{
                scale: isInCurrentWord && fillingLetters ? [1, 1.2, 1] : 1,
                backgroundColor: isInCurrentWord ? 
                  (fillingLetters ? words[currentWord].color : '#FFFFFF') : 
                  (isActive ? '#FFFFFF' : '#F0F0F0')
              }}
              transition={{ duration: 0.3 }}
            >
              {/* Show letters for completed cells */}
              <AnimatePresence>
                {isCompleted && (
                  <motion.span
                    initial={{ scale: 0, rotate: 180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: -180 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    {['C', 'A', 'T', 'B', 'O', 'O', 'K', 'R', 'E', 'A', 'D', 'F', 'U', 'N'][index % 14]}
                  </motion.span>
                )}
              </AnimatePresence>
              
              {/* Show numbers for starting cells */}
              {[0, 4, 6].includes(index) && !isCompleted && (
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  left: '2px',
                  fontSize: '8px',
                  color: '#666'
                }}>
                  {index === 0 ? '1' : index === 4 ? '2' : '3'}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Floating Letters */}
      <AnimatePresence>
        {fillingLetters && (
          <>
            {['A', 'B', 'C'].map((letter, index) => (
              <motion.div
                key={`letter-${letter}-${currentWord}`}
                initial={{ 
                  opacity: 0,
                  scale: 0,
                  x: 0,
                  y: 0
                }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0, 1.2, 0],
                  x: (Math.random() - 0.5) * 100,
                  y: (Math.random() - 0.5) * 100
                }}
                exit={{ opacity: 0 }}
                transition={{ 
                  duration: 1,
                  delay: index * 0.2
                }}
                style={{
                  position: 'absolute',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: words[currentWord].color,
                  left: '50%',
                  top: '50%',
                  willChange: 'transform'
                }}
              >
                {letter}
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Teacher's Desk */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: '5px',
          right: '15px',
          fontSize: '16px',
          willChange: 'transform'
        }}
        animate={{ 
          scale: [1, 1.05, 1],
          rotate: [0, 2, -2, 0]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        🪑
      </motion.div>

      {/* Floating sparkles */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          style={{
            position: 'absolute',
            fontSize: '10px',
            left: `${25 + i * 20}%`,
            top: `${20 + i * 15}%`,
            willChange: 'transform'
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            delay: i * 0.6,
            ease: "easeInOut"
          }}
        >
          ✨
        </motion.div>
      ))}

      {/* Corner decorations */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '8px',
        transform: 'translateY(-50%)',
        fontSize: '12px'
      }}>📝</div>
      
      <div style={{
        position: 'absolute',
        bottom: '8px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '12px'
      }}>🧩</div>

      {/* Word Label */}
      <AnimatePresence>
        <motion.div
          key={`word-${currentWord}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          style={{
            position: 'absolute',
            top: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: words[currentWord].color,
            color: 'white',
            padding: '2px 8px',
            borderRadius: '8px',
            fontSize: '10px',
            fontWeight: 'bold',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          {words[currentWord].word}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CrosswordAnimation;