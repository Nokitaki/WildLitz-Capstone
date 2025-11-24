// src/pages/games/soundsafari/SoundIntroScreen.jsx <updated on 2025-05-16>

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SOUND_EXAMPLES, SOUND_DESCRIPTIONS } from '../../../mock/soundSafariData'; 
import { fetchSoundExamples } from '../../../services/soundSafariApi';
import styles from '../../../styles/games/safari/SoundIntroScreen.module.css';
import { playSpeech } from '../../../utils/soundUtils';

/**
 * Component for introducing the target sound to players
 * Updated to use Supabase for sound examples when available
 */
const SoundIntroScreen = ({ 
  targetSound, 
  onContinue,
  volume,
  isMuted,
  showVolumeControl,
  onVolumeChange,
  onToggleMute,
  onToggleVolumeControl
  }) => {

  const [isPlaying, setIsPlaying] = useState(false);
  const [activeExample, setActiveExample] = useState(null);
  const [examples, setExamples] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  
  // Get description for this target sound
  const soundDescription = SOUND_DESCRIPTIONS[targetSound] || 
    'Listen carefully for this sound in words';
  
  // Fetch sound examples from Supabase when component mounts
  useEffect(() => {
    const loadExamples = async () => {
      setIsLoading(true);
      try {
        // Try to fetch examples from Supabase
        const response = await fetchSoundExamples(targetSound);
        
        if (response.examples && response.examples.length > 0) {
          setExamples(response.examples);
        } else {
          // Fallback to local examples
          const localExamples = SOUND_EXAMPLES[targetSound] || [];
          setExamples(localExamples);
        }
      } catch (error) {
        console.error('Error fetching sound examples:', error);
        // Fallback to local examples
        const localExamples = SOUND_EXAMPLES[targetSound] || [];
        setExamples(localExamples);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadExamples();
  }, [targetSound]);
  
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsButtonEnabled(true);
    }, 3000); // 3 seconds
    
    // Cleanup timer on unmount
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className={styles.introContainer}>
      <motion.div 
        className={styles.soundControlWrapper}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
      >
        <motion.button
          className={styles.soundButton}
          onClick={onToggleVolumeControl}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {isMuted ? '🔇' : volume > 0.5 ? '🔊' : volume > 0 ? '🔉' : '🔈'}
        </motion.button>
        
        <AnimatePresence>
          {showVolumeControl && (
            <motion.div
              className={styles.volumeControlPanel}
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <div className={styles.volumeHeader}>
                <span className={styles.volumeTitle}>🎵 Background Music</span>
              </div>
              
              <div className={styles.volumeControls}>
                <div className={styles.volumeSliderContainer}>
                  <span className={styles.volumeIcon}>🔈</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={onVolumeChange}
                    className={styles.volumeSlider}
                  />
                  <span className={styles.volumeIcon}>🔊</span>
                </div>
                
                <div className={styles.volumePercentage}>
                  {Math.round(volume * 100)}%
                </div>
                
                <motion.button
                  className={`${styles.muteButton} ${isMuted ? styles.muted : ''}`}
                  onClick={onToggleMute}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isMuted ? '🔇 Unmute' : '🔇 Mute'}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
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
                  whileHover={isButtonEnabled ? { scale: 1.03, boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)" } : {}}
                  whileTap={isButtonEnabled ? { scale: 0.97 } : {}}
                  onClick={isButtonEnabled ? onContinue : undefined}
                  disabled={!isButtonEnabled}
                  animate={{
                    opacity: isButtonEnabled ? 1 : 0.4
                  }}
                  transition={{
                    opacity: { duration: 0.5, ease: "easeInOut" }
                  }}
                  style={{
                    cursor: isButtonEnabled ? 'pointer' : 'not-allowed',
                    pointerEvents: isButtonEnabled ? 'auto' : 'none'
                  }}
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
              
              {isLoading ? (
                <div className={styles.loadingMessage}>
                  <p>Loading examples...</p>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoundIntroScreen;