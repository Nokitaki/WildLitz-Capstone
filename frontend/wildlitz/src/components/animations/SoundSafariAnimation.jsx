import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SoundSafariAnimation = () => {
  const [currentAnimal, setCurrentAnimal] = useState(0);
  const [showSoundWaves, setShowSoundWaves] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setShowSoundWaves(true);
      
      setTimeout(() => {
        setCurrentAnimal((prev) => (prev + 1) % 3);
        setShowSoundWaves(false);
      }, 1200);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const animals = [
    { emoji: '🦁', sound: 'ROAR!', color: '#FF6B6B' },
    { emoji: '🐘', sound: 'TRUMPET!', color: '#4ECDC4' },
    { emoji: '🐒', sound: 'OOH!', color: '#45B7D1' }
  ];

  const particles = Array.from({ length: 6 }, (_, i) => i);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '220px',
      background: 'linear-gradient(135deg, #87CEEB 0%, #98FB98 30%, #F0E68C 60%, #FFB6C1 100%)',
      borderRadius: '16px 16px 0 0',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      willChange: 'transform'
    }}>
      
      {/* Background Elements */}
      <motion.div
        style={{
          position: 'absolute',
          top: '10px',
          left: '15px',
          fontSize: '20px',
          willChange: 'transform'
        }}
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        🌴
      </motion.div>
      
      <motion.div
        style={{
          position: 'absolute',
          top: '15px',
          right: '20px',
          fontSize: '18px',
          willChange: 'transform'
        }}
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        ☀️
      </motion.div>

      {/* Safari Guide Character */}
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
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Safari hat */}
        <div style={{
          width: '24px',
          height: '12px',
          backgroundColor: '#8B4513',
          borderRadius: '12px 12px 0 0',
          marginBottom: '2px'
        }} />
        
        {/* Head */}
        <div style={{
          width: '20px',
          height: '20px',
          backgroundColor: '#FFDBAC',
          borderRadius: '50%',
          border: '2px solid #D2691E',
          position: 'relative'
        }}>
          {/* Eyes */}
          <div style={{
            position: 'absolute',
            top: '6px',
            left: '4px',
            width: '3px',
            height: '3px',
            backgroundColor: '#000',
            borderRadius: '50%'
          }} />
          <div style={{
            position: 'absolute',
            top: '6px',
            right: '4px',
            width: '3px',
            height: '3px',
            backgroundColor: '#000',
            borderRadius: '50%'
          }} />
        </div>
        
        {/* Body */}
        <div style={{
          width: '22px',
          height: '20px',
          backgroundColor: '#CD853F',
          borderRadius: '0 0 11px 11px',
          border: '2px solid #8B4513'
        }} />
        
        {/* Binoculars */}
        <motion.div
          style={{
            position: 'absolute',
            right: '-8px',
            top: '12px',
            fontSize: '12px',
            willChange: 'transform'
          }}
          animate={{ scale: showSoundWaves ? [1, 1.2, 1] : 1 }}
          transition={{ duration: 0.5 }}
        >
          🔍
        </motion.div>
      </motion.div>

      {/* Main Animal Display */}
      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentAnimal}
            initial={{ scale: 0.5, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: -20 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
            style={{
              fontSize: '60px',
              textAlign: 'center',
              willChange: 'transform'
            }}
          >
            {animals[currentAnimal].emoji}
          </motion.div>
        </AnimatePresence>

        {/* Sound Display */}
        <AnimatePresence>
          {showSoundWaves && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              style={{
                position: 'absolute',
                top: '-20px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: animals[currentAnimal].color,
                color: 'white',
                padding: '4px 8px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                willChange: 'transform'
              }}
            >
              {animals[currentAnimal].sound}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sound Wave Particles */}
      <AnimatePresence>
        {showSoundWaves && (
          <>
            {particles.map((particle, index) => (
              <motion.div
                key={`wave-${particle}-${currentAnimal}`}
                initial={{ 
                  opacity: 0,
                  scale: 0,
                  x: 0,
                  y: 0
                }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                  x: (Math.random() - 0.5) * 120,
                  y: (Math.random() - 0.5) * 120
                }}
                exit={{ opacity: 0 }}
                transition={{ 
                  duration: 1.2,
                  delay: index * 0.1
                }}
                style={{
                  position: 'absolute',
                  fontSize: '16px',
                  left: '50%',
                  top: '50%',
                  willChange: 'transform'
                }}
              >
                🎵
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Grass at bottom */}
      <div style={{
        position: 'absolute',
        bottom: '0',
        left: '0',
        right: '0',
        height: '15px',
        background: 'linear-gradient(to top, #228B22, #32CD32)',
        clipPath: 'polygon(0 100%, 10% 70%, 20% 90%, 30% 60%, 40% 85%, 50% 65%, 60% 80%, 70% 55%, 80% 75%, 90% 60%, 100% 80%, 100% 100%)'
      }} />

      {/* Corner decorations */}
      <div style={{
        position: 'absolute',
        top: '8px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '14px'
      }}>🎯</div>
      
      <motion.div
        style={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
          fontSize: '12px',
          willChange: 'transform'
        }}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      >
        👂
      </motion.div>

      {/* Floating sound notes */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`note-${i}`}
          style={{
            position: 'absolute',
            fontSize: '8px',
            left: `${20 + i * 25}%`,
            top: `${25 + i * 15}%`,
            willChange: 'transform'
          }}
          animate={{
            y: [0, -10, 0],
            opacity: [0.3, 1, 0.3]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            delay: i * 0.8,
            ease: "easeInOut"
          }}
        >
          ♪
        </motion.div>
      ))}
    </div>
  );
};

export default SoundSafariAnimation;