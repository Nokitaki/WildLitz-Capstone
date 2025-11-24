// src/pages/games/soundsafari/SoundSafariConfigScreen.jsx <updated on 2025-10-26>
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import styles from '../../../styles/games/safari/SoundSafariConfig.module.css';
import backgroundMusic from '../../../assets/music/sound-safari-background-music.mp3';

/**
 * Configuration screen component for Sound Safari game
 * Redesigned with horizontal layout and no overflow/scroll
 * Updated with back button navigation
 */
const SoundSafariConfigScreen = ({ onStartGame }) => {
  const navigate = useNavigate();
  
  // Game configuration state
  const [soundPosition, setSoundPosition] = useState('beginning');
  const [environment, setEnvironment] = useState('jungle');
  const [difficulty, setDifficulty] = useState('easy');
  
  // Audio control state
  const audioRef = useRef(null);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  
  // Initialize and play background music
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.loop = true;
      
      const playMusic = async () => {
        try {
          await audioRef.current.play();
        } catch (error) {
          console.log('Auto-play blocked:', error);
        }
      };
      
      playMusic();
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);
  
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);
  
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0) {
      setIsMuted(false);
    }
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  const toggleVolumeControl = () => {
    setShowVolumeControl(!showVolumeControl);
  };
  
  // Handle back button click
  const handleBackClick = () => {
    navigate('/home');
  };
  
  // Handle quick start with default settings
  const handleQuickStart = () => {
    // Generate random sound for first round
    const allSounds = ['g', 'k', 'w', 'd', 'r', 'c', 'h', 's', 'm', 't', 'b', 'p', 'f', 'l', 'z'];
    const randomSound = allSounds[Math.floor(Math.random() * allSounds.length)];
    
    const config = {
      soundPosition: 'beginning',
      targetSound: randomSound,
      environment: 'jungle',
      difficulty: 'easy'
    };
    
    if (onStartGame) {
      onStartGame(config);
    }
  };
  
  // Handle start game with custom settings
  const handleStartGame = () => {
    // Generate random sound for first round
    const allSounds = ['g', 'k', 'w', 'd', 'r', 'c', 'h', 's', 'm', 't', 'b', 'p', 'f', 'l', 'z'];
    const randomSound = allSounds[Math.floor(Math.random() * allSounds.length)];
    
    const config = {
      soundPosition,
      targetSound: randomSound,
      environment,
      difficulty
    };
    
    if (onStartGame) {
      onStartGame(config);
    }
  };
  
  return (
    <div className={styles.configContainer}>
      <audio 
        ref={audioRef} 
        src={backgroundMusic}
        onLoadedData={() => console.log('✅ Audio loaded successfully!')}
        onError={(e) => console.log('❌ Audio error:', e)}
      />
      
      <motion.div 
        className={styles.soundControlWrapper}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
      >
        <motion.button
          className={styles.soundButton}
          onClick={toggleVolumeControl}
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
                    onChange={handleVolumeChange}
                    className={styles.volumeSlider}
                  />
                  <span className={styles.volumeIcon}>🔊</span>
                </div>
                
                <div className={styles.volumePercentage}>
                  {Math.round(volume * 100)}%
                </div>
                
                <motion.button
                  className={`${styles.muteButton} ${isMuted ? styles.muted : ''}`}
                  onClick={toggleMute}
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
      
      <div className={styles.configCardWrapper}>

        {/* Back Button - Inside the card border */}
        <motion.button
          className={styles.backButton}
          onClick={handleBackClick}
          whileHover={{ scale: 1.05, x: -3 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className={styles.backArrow}>←</span>
          <span className={styles.backText}>Back</span>
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
          {/* Left Column - Game Info */}
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
          
          {/* Center Column - Environment */}
          <div className={styles.configColumn}>
            <div className={styles.configSection}>
              <h2>
                <span className={styles.sectionEmoji}>🌍</span>
                Environment
              </h2>
              <div className={styles.environmentGrid}>
                <motion.button
                  className={`${styles.environmentButton} ${styles.jungleEnv} ${environment === 'jungle' ? styles.selected : ''}`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setEnvironment('jungle')}
                >
                  <span className={styles.envEmoji}>🌴</span>
                  <span>Jungle</span>
                </motion.button>
                
                <motion.button
                  className={`${styles.environmentButton} ${styles.savannaEnv} ${environment === 'savanna' ? styles.selected : ''}`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setEnvironment('savanna')}
                >
                  <span className={styles.envEmoji}>🦒</span>
                  <span>Savanna</span>
                </motion.button>
                
                <motion.button
                  className={`${styles.environmentButton} ${styles.oceanEnv} ${environment === 'ocean' ? styles.selected : ''}`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setEnvironment('ocean')}
                >
                  <span className={styles.envEmoji}>🌊</span>
                  <span>Ocean</span>
                </motion.button>
                
                <motion.button
                  className={`${styles.environmentButton} ${styles.arcticEnv} ${environment === 'arctic' ? styles.selected : ''}`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setEnvironment('arctic')}
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
          
          {/* Right Column - Sound Position & Difficulty */}
          <div className={styles.configColumn}>
            <div className={styles.configSection}>
              <h2>
                <span className={styles.sectionEmoji}>🔍</span>
                Sound Position
              </h2>
              <div className={styles.buttonGrid}>
                <motion.button
                  className={`${styles.optionButton} ${soundPosition === 'beginning' ? styles.selected : ''}`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSoundPosition('beginning')}
                >
                  Beginning
                </motion.button>
                
                <motion.button
                  className={`${styles.optionButton} ${soundPosition === 'middle' ? styles.selected : ''}`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSoundPosition('middle')}
                >
                  Middle
                </motion.button>
                
                <motion.button
                  className={`${styles.optionButton} ${soundPosition === 'ending' ? styles.selected : ''}`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSoundPosition('ending')}
                >
                  Ending
                </motion.button>
                
                <motion.button
                  className={`${styles.optionButton} ${soundPosition === 'anywhere' ? styles.selected : ''}`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSoundPosition('anywhere')}
                >
                  Anywhere
                </motion.button>
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