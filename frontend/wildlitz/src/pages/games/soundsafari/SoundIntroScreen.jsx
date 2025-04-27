// src/pages/games/soundsafari/SoundIntroScreen.jsx <updated on 2025-04-27>

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SOUND_EXAMPLES, SOUND_DESCRIPTIONS } from '../../../mock/soundSafariData'; 
import styles from '../../../styles/games/safari/SoundIntroScreen.module.css';
import { playSpeech } from '../../../utils/soundUtils';
import WildLitzFox from '../../../assets/img/wildlitz-idle.png';

/**
 * Component for introducing the target sound to players
 * Redesigned with horizontal layout and no overflow/scroll
 */
const SoundIntroScreen = ({ targetSound, onContinue }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeExample, setActiveExample] = useState(null);
  const [showSpeechBubble, setShowSpeechBubble] = useState(true);
  const [introPlayed, setIntroPlayed] = useState(false);
  
  // Get description and examples for this target sound
  const soundDescription = SOUND_DESCRIPTIONS[targetSound] || 
    'Listen carefully for this sound in words';
  
  const examples = SOUND_EXAMPLES[targetSound] || [];
  
  // Generate character intro speech
  const getCharacterIntro = () => {
    return `Hi there! Today we're going to learn about the "${targetSound}" sound. Listen carefully to how it sounds and try to find it in different words.`;
  };
  
  // Play intro speech when component mounts
  useEffect(() => {
    if (!introPlayed) {
      // Small delay to ensure component is fully mounted
      setTimeout(() => {
        playSpeech(getCharacterIntro(), 0.9, () => {
          setIntroPlayed(true);
          
          // Short pause then play the sound itself
          setTimeout(() => {
            playSound();
            
            // After playing the sound, explain how to make it
            setTimeout(() => {
              playSpeech(soundDescription, 0.9, () => {
                setShowSpeechBubble(false);
              });
            }, 1500);
          }, 500);
        });
      }, 300);
    }
  }, []);
  
  // Play the target sound
  const playSound = () => {
    setIsPlaying(true);
    playSpeech(targetSound, 0.7, () => setIsPlaying(false));
  };
  
  // Play an example word
  const playExampleWord = (word) => {
    setActiveExample(word);
    playSpeech(word, 0.8, () => setActiveExample(null));
  };
  
  return (
    <div className={styles.introContainer}>
      <div className={styles.introCard}>
        <div className={styles.introHeader}>
          <h2 className={styles.introTitle}>
            <span className={styles.titleEmoji}>👂</span>
            Listen for the Sound
          </h2>
          <p className={styles.introSubtitle}>
            Learn to identify the "{targetSound}" sound
          </p>
        </div>
        
        {/* Character */}
        <div className={styles.characterContainer}>
          <motion.div 
            className={styles.character}
            animate={{ 
              y: [0, -8, 0],
              rotate: [0, 2, 0, -2, 0]
            }}
            transition={{ 
              y: { repeat: Infinity, duration: 3, ease: "easeInOut" },
              rotate: { repeat: Infinity, duration: 2, ease: "easeInOut" }
            }}
          >
            <img src={WildLitzFox} alt="WildLitz Fox" className={styles.characterImage} />
            
            {/* Speech bubble */}
            {showSpeechBubble && (
              <motion.div 
                className={styles.speechBubble}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {getCharacterIntro()}
              </motion.div>
            )}
          </motion.div>
        </div>
        
        <div className={styles.introContent}>

          {/* Right Column - Task & Continue Button */}
          <div className={styles.introColumn}>
            <div className={styles.taskSection}>
              <div className={styles.sectionTitle}>
                <span className={styles.sectionEmoji}>🎯</span>
                <h3>Your Safari Task:</h3>
              </div>
              
              <div className={styles.taskStep}>
                <div className={styles.stepNumber}>1</div>
                <p>Listen carefully for the "{targetSound}" sound.</p>
              </div>
              
              <div className={styles.taskStep}>
                <div className={styles.stepNumber}>2</div>
                <p>Find animals that have this sound in their names.</p>
              </div>
              
              <div className={styles.taskStep}>
                <div className={styles.stepNumber}>3</div>
                <p>Select all matching animals before time runs out!</p>
              </div>
              
              <div className={styles.tipBox}>
                <span className={styles.tipIcon}>💡</span>
                <p>The sound might be at the beginning, middle, or end of an animal's name.</p>
              </div>
              
              
            </div>
          </div>
        

          {/* Left Column - Sound Circle & How to Make */}
          <div className={styles.introColumn}>
            <div className={styles.soundCircleWrapper}>
              <motion.div 
                className={styles.soundCircle}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={playSound}
              >
                <span className={styles.soundLetter}>
                  {targetSound.toUpperCase()} {targetSound.toLowerCase()}
                </span>
                
                {isPlaying && (
                  <div className={styles.soundWaves}>
                    {[...Array(3)].map((_, i) => (
                      <motion.div 
                        key={i}
                        className={styles.soundWave}
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.7, 0.3, 0]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.3
                        }}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
              
              <motion.p 
                className={styles.tapInstruction}
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Tap to hear sound
              </motion.p>
            </div>
            
            <div className={styles.howToMakeSection}>
              <div className={styles.sectionTitle}>
                <span className={styles.sectionEmoji}>🔤</span>
                <h3>How to make this sound:</h3>
              </div>
              <div className={styles.descriptionBox}>
                <p>{soundDescription}</p>
              </div>
            </div>
            <div className={styles.startButtonContainer}>
                <motion.button 
                  className={styles.continueButton}
                  whileHover={{ scale: 1.03, boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onContinue}
                >
                  Start the Safari!
                  <span className={styles.buttonEmoji}>🦁</span>
                </motion.button>
              </div>
          </div>

          {/* Center Column - Example Words */}
          <div className={styles.introColumn}>
            <div className={styles.examplesSection}>
              <div className={styles.sectionTitle}>
                <span className={styles.sectionEmoji}>✨</span>
                <h3>Words with "{targetSound}" sound:</h3>
              </div>
              
              <div className={styles.examplesGrid}>
                {examples.slice(0, 6).map((word, index) => (
                  <motion.div 
                    key={index} 
                    className={`${styles.exampleWord} ${activeExample === word ? styles.activeExample : ''}`}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => playExampleWord(word)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + (index * 0.1) }}
                  >
                    <span>{word}</span>
                    <motion.div 
                      className={styles.playIcon}
                      animate={activeExample === word ? { 
                        scale: [1, 1.2, 1],
                        color: ['#4a9240', '#ffd600', '#4a9240'] 
                      } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      🔊
                    </motion.div>
                  </motion.div>
                ))}
              </div>
              
              <div className={styles.wordDetails}>
                <div className={styles.wordDetail}>
                  <span className={styles.detailIcon}>🔍</span>
                  <p>Notice how the "{targetSound}" sound appears in these words.</p>
                </div>
                <div className={styles.wordDetail}>
                  <span className={styles.detailIcon}>👆</span>
                  <p>Tap any word to hear it pronounced.</p>
                </div>
              </div>
            </div>
          </div>
          
          
        </div>
      </div>
    </div>
  );
};

export default SoundIntroScreen;