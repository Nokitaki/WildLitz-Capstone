import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import styles from '../../../styles/games/safari/SoundSafariConfig.module.css';
import { getRandomValidSound } from '../../../utils/excludedCombinations';
import { fetchRandomSound } from '../../../services/soundSafariApi';
// 1. Import the Analytics component
import SoundSafariAnalytics from './SoundSafariAnalytics';

const SoundSafariConfigScreen = ({ 
  onStartGame, 
  // onViewAnalytics, // We don't use this anymore as we handle it internally
  currentEnvironment = 'jungle', 
  onEnvironmentChange,
  initialDifficulty = 'easy',
  initialSoundPosition = 'beginning',
  volume,
  isMuted,
  showVolumeControl,
  onVolumeChange,
  onToggleMute,
  onToggleVolumeControl
}) => {
  const navigate = useNavigate();

  const [soundPosition, setSoundPosition] = useState(initialSoundPosition);
  const [difficulty, setDifficulty] = useState(initialDifficulty);
  
  // 2. Add state to control the modal visibility
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  const handleStartGame = async () => {
    try {
      // Try to get a sound from backend that has animals available
      const response = await fetchRandomSound(soundPosition);
      
      let randomSound;
      if (response.sound) {
        randomSound = response.sound;
        console.log('✅ Backend selected sound:', randomSound);
      } else {
        // Fallback to client-side selection
        randomSound = getRandomValidSound(soundPosition, []);
        console.log('⚠️ Using fallback sound:', randomSound);
      }
      
      const config = {
        soundPosition,
        targetSound: randomSound,
        environment: currentEnvironment,
        difficulty
      };
      if (onStartGame) onStartGame(config);
    } catch (error) {
      console.error('❌ Error selecting sound:', error);
      // Fallback to client-side selection on error
      const randomSound = getRandomValidSound(soundPosition, []);
      const config = {
        soundPosition,
        targetSound: randomSound,
        environment: currentEnvironment,
        difficulty
      };
      if (onStartGame) onStartGame(config);
    }
  };
  
  return (
    <div className={styles.configContainer}>
      
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

      {/* 3. Add the Analytics Modal Overlay */}
      <AnimatePresence>
        {showAnalyticsModal && (
          <motion.div 
            className={styles.analyticsModalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAnalyticsModal(false)}
          >
            <motion.div 
              className={styles.analyticsModalContent}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                className={styles.closeAnalyticsButton}
                onClick={() => setShowAnalyticsModal(false)}
              >
                ✕
              </button>
              
              {/* Pass onClose to tell the analytics component it's in a modal */}
              <SoundSafariAnalytics onClose={() => setShowAnalyticsModal(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className={styles.configCardWrapper}>
        <motion.button
          className={styles.backButton}
          onClick={() => navigate('/home')}
          whileHover={{ scale: 1.05, x: -3 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className={styles.backArrow}>←</span>
          <span className={styles.backText}>Back</span>
        </motion.button>
        
        {/* 4. Update Analytics button to open modal instead of navigating */}
        <motion.button
          className={styles.analyticsButton}
          onClick={() => setShowAnalyticsModal(true)}
          whileHover={{ scale: 1.05, x: 3 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className={styles.analyticsIcon}>📊</span>
          <span className={styles.analyticsText}>Analytics</span>
        </motion.button>
        
        <div className={styles.configHeader}>
          <h1 className={styles.configTitle}>
            Sound Safari <span>Adventure</span>
          </h1>
          <p className={styles.configSubtitle}>
            Help animals find their sounds in this exciting adventure!
          </p>
        </div>
        
        <div className={styles.configContent}>
          <div className={styles.configColumn}>
            <div className={styles.gameInfoSection}>
              <div className={styles.infoBox}>
                <h3>
                  <span className={styles.infoEmoji}>🎮</span>
                  How to Play
                </h3>
                <p>Listen for the target sound and find animals with that sound in their names. Select all matching animals before time runs out!</p>
              </div>
              
              <div className={styles.infoBox}>
                <h3>
                  <span className={styles.infoEmoji}>🏆</span>
                  Learning Goals
                </h3>
                <p>Improve phonemic awareness, sound recognition, and vocabulary building through engaging gameplay.</p>
              </div>
              
              <div className={styles.infoBox}>
                <h3>
                  <span className={styles.infoEmoji}>👩‍🏫</span>
                  Teacher Tips
                </h3>
                <p>Use different difficulty levels to match student abilities. Discuss animal names and sounds to reinforce phonetic concepts.</p>
              </div>
            </div>
          </div>
          
          <div className={styles.configColumn}>
            <div className={styles.configSection}>
              <h2>
                <span className={styles.sectionEmoji}>🌍</span>
                Select Theme
              </h2>
              <div className={styles.environmentGrid}>
                <motion.button
                  className={`${styles.environmentButton} ${styles.jungleEnv} ${currentEnvironment === 'jungle' ? styles.selected : ''}`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onEnvironmentChange('jungle')}
                >
                  <span className={styles.envEmoji}>🌴</span>
                  <span>Jungle</span>
                </motion.button>
                
                <motion.button
                  className={`${styles.environmentButton} ${styles.savannaEnv} ${currentEnvironment === 'savanna' ? styles.selected : ''}`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onEnvironmentChange('savanna')}
                >
                  <span className={styles.envEmoji}>🦒</span>
                  <span>Savanna</span>
                </motion.button>
                
                <motion.button
                  className={`${styles.environmentButton} ${styles.oceanEnv} ${currentEnvironment === 'ocean' ? styles.selected : ''}`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onEnvironmentChange('ocean')}
                >
                  <span className={styles.envEmoji}>🌊</span>
                  <span>Ocean</span>
                </motion.button>
                
                <motion.button
                  className={`${styles.environmentButton} ${styles.arcticEnv} ${currentEnvironment === 'arctic' ? styles.selected : ''}`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onEnvironmentChange('arctic')}
                >
                  <span className={styles.envEmoji}>❄️</span>
                  <span>Arctic</span>
                </motion.button>
              </div>
              
              <div className={styles.startButtonContainer}>
                <motion.button 
                  className={styles.startButton}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleStartGame}
                >
                  <span className={styles.buttonEmoji}>🚀</span>
                  Start Adventure
                </motion.button>
              </div>
            </div>
          </div>
          
          <div className={styles.configColumn}>
            <div className={styles.configSection}>
              <h2>
                <span className={styles.sectionEmoji}>🔍</span>
                Sound Position
              </h2>
              <div className={styles.buttonGrid}>
                {['beginning', 'middle', 'ending', 'anywhere'].map((pos) => (
                  <motion.button
                    key={pos}
                    className={`${styles.optionButton} ${soundPosition === pos ? styles.selected : ''}`}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSoundPosition(pos)}
                  >
                    {pos.charAt(0).toUpperCase() + pos.slice(1)}
                  </motion.button>
                ))}
              </div>
            </div>
            
            <div className={styles.configSection}>
              <h2>
                <span className={styles.sectionEmoji}>🎚️</span>
                Difficulty Level
              </h2>
              <div className={styles.difficultyButtons}>
                <motion.button
                  className={`${styles.difficultyButton} ${difficulty === 'easy' ? styles.selected : ''}`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setDifficulty('easy')}
                >
                  <div className={styles.difficultyTitle}>Easy</div>
                  <div className={styles.difficultyDetails}>
                    <span>6 animals</span>
                    <span>60 seconds</span>
                  </div>
                </motion.button>
                
                <motion.button
                  className={`${styles.difficultyButton} ${difficulty === 'medium' ? styles.selected : ''}`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setDifficulty('medium')}
                >
                  <div className={styles.difficultyTitle}>Medium</div>
                  <div className={styles.difficultyDetails}>
                    <span>8 animals</span>
                    <span>45 seconds</span>
                  </div>
                </motion.button>
                
                <motion.button
                  className={`${styles.difficultyButton} ${difficulty === 'hard' ? styles.selected : ''}`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setDifficulty('hard')}
                >
                  <div className={styles.difficultyTitle}>Hard</div>
                  <div className={styles.difficultyDetails}>
                    <span>12 animals</span>
                    <span>30 seconds</span>
                  </div>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoundSafariConfigScreen;