import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const VanishingGameAnimation = () => {
  const [currentScene, setCurrentScene] = useState(0);
  const [isVanishing, setIsVanishing] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIsVanishing(true);
      
      setTimeout(() => {
        setCurrentScene((prev) => (prev + 1) % 3);
        setIsVanishing(false);
      }, 800);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  // Reduced particles for better performance
  const particles = Array.from({ length: 8 }, (_, i) => i);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '220px',
      background: 'linear-gradient(135deg, #87CEEB 0%, #98FB98 50%, #FFB6C1 100%)',
      borderRadius: '16px 16px 0 0',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      willChange: 'transform' // GPU acceleration
    }}>
      
      {/* Simplified background elements - only 2 clouds */}
      <motion.div
        style={{
          position: 'absolute',
          top: '15px',
          left: '20px',
          fontSize: '18px',
          willChange: 'transform'
        }}
        animate={{ x: [0, 30, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      >
        ☁️
      </motion.div>
      
      <motion.div
        style={{
          position: 'absolute',
          top: '25px',
          right: '20px',
          fontSize: '20px',
          willChange: 'transform'
        }}
        animate={{ x: [0, -25, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      >
        ☁️
      </motion.div>

      {/* Simplified wizard - removed complex gradients */}
      <motion.div
        style={{
          position: 'absolute',
          left: '25px',
          bottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          willChange: 'transform'
        }}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Simple wizard hat */}
        <div style={{
          width: 0,
          height: 0,
          borderLeft: '15px solid transparent',
          borderRight: '15px solid transparent',
          borderBottom: '25px solid #6A5ACD',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: '18px',
            left: '-3px',
            fontSize: '10px'
          }}>⭐</div>
        </div>
        
        {/* Simple head */}
        <div style={{
          width: '22px',
          height: '22px',
          backgroundColor: '#FFDBAC',
          borderRadius: '50%',
          border: '2px solid #D2691E'
        }} />
        
        {/* Simple body */}
        <div style={{
          width: '26px',
          height: '22px',
          backgroundColor: '#4169E1',
          borderRadius: '0 0 13px 13px',
          border: '2px solid #191970'
        }} />
        
        {/* Simple wand */}
        <motion.div
          style={{
            position: 'absolute',
            right: '-12px',
            top: '18px',
            width: '15px',
            height: '2px',
            backgroundColor: '#8B4513',
            borderRadius: '1px',
            transformOrigin: 'left center',
            willChange: 'transform'
          }}
          animate={{ rotate: [0, 20, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div style={{
            position: 'absolute',
            right: '-5px',
            top: '-4px',
            fontSize: '10px'
          }}>✨</div>
        </motion.div>
      </motion.div>

      {/* Simplified magic hat */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: '25px',
          right: '30px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          willChange: 'transform'
        }}
        animate={{ rotate: [0, 3, -3, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <div style={{
          width: '45px',
          height: '8px',
          backgroundColor: '#2C2C2C',
          borderRadius: '23px',
          marginBottom: '-2px'
        }} />
        
        <div style={{
          width: '38px',
          height: '22px',
          backgroundColor: '#000000',
          borderRadius: '4px 4px 0 0',
          position: 'relative'
        }}>
          <AnimatePresence>
            {isVanishing && (
              <motion.div
                initial={{ scale: 0, y: 0 }}
                animate={{ scale: 1.5, y: -25 }}
                exit={{ scale: 0, opacity: 0 }}
                style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '20px'
                }}
              >
                💨
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Main objects - simplified with fewer elements */}
      <div style={{
        position: 'absolute',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%'
      }}>
        <AnimatePresence mode="wait">
          {!isVanishing && (
            <motion.div
              key={currentScene}
              initial={{ opacity: 0, scale: 0.5, y: -30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ 
                opacity: 0, 
                scale: 0.3,
                y: 40,
                rotate: 180
              }}
              transition={{ duration: 0.5 }}
              style={{
                display: 'flex',
                gap: '15px',
                alignItems: 'center',
                willChange: 'transform'
              }}
            >
              {currentScene === 0 && (
                <>
                  {/* Simplified books */}
                  <motion.div
                    style={{
                      width: '30px',
                      height: '24px',
                      backgroundColor: '#FF6B6B',
                      borderRadius: '3px',
                      border: '2px solid #FF4444'
                    }}
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div style={{
                      width: '22px',
                      height: '2px',
                      backgroundColor: '#FFFFFF',
                      margin: '8px auto'
                    }} />
                  </motion.div>
                  
                  <motion.div
                    style={{
                      width: '30px',
                      height: '24px',
                      backgroundColor: '#4ECDC4',
                      borderRadius: '3px',
                      border: '2px solid #26D0CE'
                    }}
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  >
                    <div style={{
                      width: '22px',
                      height: '2px',
                      backgroundColor: '#FFFFFF',
                      margin: '8px auto'
                    }} />
                  </motion.div>
                </>
              )}

              {currentScene === 1 && (
                <>
                  {/* Simplified letter circles */}
                  {['A', 'B'].map((letter, index) => (
                    <motion.div
                      key={letter}
                      style={{
                        width: '28px',
                        height: '28px',
                        backgroundColor: ['#FFD93D', '#6BCF7F'][index],
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        color: 'white',
                        fontSize: '14px',
                        border: `2px solid ${['#FFA500', '#32CD32'][index]}`,
                        willChange: 'transform'
                      }}
                      animate={{ 
                        y: [0, -12, 0],
                        rotate: [0, 180, 360]
                      }}
                      transition={{ 
                        duration: 2.5,
                        repeat: Infinity,
                        delay: index * 0.2
                      }}
                    >
                      {letter}
                    </motion.div>
                  ))}
                </>
              )}

              {currentScene === 2 && (
                <>
                  {/* Simple emojis */}
                  <motion.div
                    style={{ fontSize: '35px', willChange: 'transform' }}
                    animate={{ 
                      y: [0, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🌟
                  </motion.div>
                  
                  <motion.div
                    style={{ fontSize: '32px', willChange: 'transform' }}
                    animate={{ 
                      y: [0, -12, 0],
                      rotate: [0, 20, -20, 0]
                    }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  >
                    🦋
                  </motion.div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Reduced particles for vanishing effect */}
      <AnimatePresence>
        {isVanishing && (
          <>
            {particles.map((particle, index) => (
              <motion.div
                key={`particle-${particle}`}
                initial={{ 
                  opacity: 0,
                  scale: 0,
                  x: 0,
                  y: 0
                }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: (Math.random() - 0.5) * 150,
                  y: (Math.random() - 0.5) * 150
                }}
                exit={{ opacity: 0 }}
                transition={{ 
                  duration: 1,
                  delay: index * 0.1
                }}
                style={{
                  position: 'absolute',
                  fontSize: '12px',
                  left: '50%',
                  top: '50%',
                  willChange: 'transform'
                }}
              >
                {['✨', '⭐', '🌟'][index % 3]}
              </motion.div>
            ))}
            
            {/* Simple POOF effect */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0.8]
              }}
              transition={{ duration: 1 }}
              style={{
                position: 'absolute',
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#FF1493',
                willChange: 'transform'
              }}
            >
              POOF! ✨
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Only 3 simple sparkles instead of 6 */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          style={{
            position: 'absolute',
            fontSize: '10px',
            left: `${30 + i * 30}%`,
            top: `${30 + i * 20}%`,
            willChange: 'transform'
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.7,
            ease: "easeInOut"
          }}
        >
          ✨
        </motion.div>
      ))}

      {/* Simple corner decorations */}
      <div style={{
        position: 'absolute',
        top: '8px',
        left: '8px',
        fontSize: '12px'
      }}>🌈</div>
      
      <div style={{
        position: 'absolute',
        top: '8px',
        right: '8px',
        fontSize: '12px'
      }}>⭐</div>
    </div>
  );
};

export default VanishingGameAnimation;