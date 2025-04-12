import React, { useState } from 'react';
import { motion } from 'framer-motion';
import styles from '../styles/SoundSafariConfig.module.css';
import Character from '../assets/img/wildlitz-idle.png';

/**
 * Configuration screen component for Sound Safari game
 * Allows setting difficulty, target sound, and other game options
 */
const SoundSafariConfigScreen = ({ onStartGame }) => {
  // Game configuration state
  const [playMode, setPlayMode] = useState('solo'); // 'solo' or 'group'
  const [soundPosition, setSoundPosition] = useState('beginning'); // 'beginning', 'middle', 'ending', 'anywhere'
  const [targetSound, setTargetSound] = useState('s'); // Initial target sound
  const [environment, setEnvironment] = useState('jungle'); // 'jungle', 'savanna', 'ocean', 'arctic'
  const [difficulty, setDifficulty] = useState('easy'); // 'easy', 'medium', 'hard'

  // Available sounds for selection
  const availableSounds = [
    { letter: 's', example: 'snake, sun, seal' },
    { letter: 'm', example: 'monkey, mouse, map' },
    { letter: 't', example: 'tiger, turtle, table' },
    { letter: 'b', example: 'bear, ball, boat' },
    { letter: 'p', example: 'penguin, pig, pan' },
    { letter: 'f', example: 'fox, fish, frog' },
    { letter: 'l', example: 'lion, leaf, log' },
    { letter: 'z', example: 'zebra, zoo, zigzag' }
  ];

  // Show more sounds state
  const [showMoreSounds, setShowMoreSounds] = useState(false);
  
  // Additional sounds that show when "More Sounds" is clicked
  const additionalSounds = [
    { letter: 'g', example: 'goat, giraffe, gift' },
    { letter: 'w', example: 'wolf, whale, water' },
    { letter: 'd', example: 'dog, dolphin, desk' },
    { letter: 'c', example: 'cat, cow, car' },
    { letter: 'r', example: 'rabbit, rat, rain' },
    { letter: 'h', example: 'horse, hat, hand' }
  ];

  // Handle play mode selection
  const handlePlayModeChange = (mode) => {
    setPlayMode(mode);
  };
  
  // Handle sound position selection
  const handleSoundPositionChange = (position) => {
    setSoundPosition(position);
  };
  
  // Handle target sound selection
  const handleTargetSoundChange = (sound) => {
    setTargetSound(sound);
  };
  
  // Handle environment selection
  const handleEnvironmentChange = (env) => {
    setEnvironment(env);
  };

  // Handle difficulty selection
  const handleDifficultyChange = (level) => {
    setDifficulty(level);
  };
  
  // Handle more sounds button
  const toggleMoreSounds = () => {
    setShowMoreSounds(!showMoreSounds);
  };
  
  // Handle start game with quick default settings
  const handleQuickStart = () => {
    // Set some reasonable defaults and start
    const gameConfig = {
      playMode: 'solo',
      soundPosition: 'beginning',
      targetSound: 's',
      environment: 'jungle',
      difficulty: 'easy'
    };
    
    if (onStartGame) {
      onStartGame(gameConfig);
    }
  };
  
  // Handle start game with custom settings
  const handleBeginGame = () => {
    const gameConfig = {
      playMode,
      soundPosition,
      targetSound,
      environment,
      difficulty
    };
    
    if (onStartGame) {
      onStartGame(gameConfig);
    }
  };
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>WildLitz - Sound Safari Adventure</h1>
        <div className={styles.logo}>
          <img src={Character} alt="WildLitz Fox" />
        </div>
      </div>
      
      <div className={styles.configContent}>
        <motion.button 
          className={styles.quickStartButton}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleQuickStart}
        >
          Quick Start
        </motion.button>
        
        <div className={styles.configSection}>
          <h2>Choose your Play Mode</h2>
          <div className={styles.playModeOptions}>
            <motion.button 
              className={`${styles.playModeButton} ${playMode === 'group' ? styles.selected : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePlayModeChange('group')}
            >
              <span className={styles.modeTitle}>Group Play</span>
              <span className={styles.modeDescription}>For classroom with teacher</span>
            </motion.button>
            
            <motion.button 
              className={`${styles.playModeButton} ${playMode === 'solo' ? styles.selected : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePlayModeChange('solo')}
            >
              <span className={styles.modeTitle}>Solo Play</span>
              <span className={styles.modeDescription}>For Individual Practice</span>
            </motion.button>
          </div>
        </div>
        
        <div className={styles.configSection}>
          <h2>Sound Target Selection:</h2>
          <div className={styles.soundPositionOptions}>
            <motion.button 
              className={`${styles.positionButton} ${soundPosition === 'beginning' ? styles.selected : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSoundPositionChange('beginning')}
            >
              Beginning
            </motion.button>
            
            <motion.button 
              className={`${styles.positionButton} ${soundPosition === 'middle' ? styles.selected : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSoundPositionChange('middle')}
            >
              Middle
            </motion.button>
            
            <motion.button 
              className={`${styles.positionButton} ${soundPosition === 'ending' ? styles.selected : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSoundPositionChange('ending')}
            >
              Ending
            </motion.button>
            
            <motion.button 
              className={`${styles.positionButton} ${soundPosition === 'anywhere' ? styles.selected : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSoundPositionChange('anywhere')}
            >
              Anywhere
            </motion.button>
          </div>
          
          <h3>Select Target Sound:</h3>
          <div className={styles.soundOptions}>
            {availableSounds.map(sound => (
              <motion.button 
                key={sound.letter}
                className={`${styles.soundButton} ${targetSound === sound.letter ? styles.selected : ''}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleTargetSoundChange(sound.letter)}
              >
                {sound.letter.toUpperCase()}
                {targetSound === sound.letter && (
                  <div className={styles.soundTooltip}>{sound.example}</div>
                )}
              </motion.button>
            ))}
            
            <motion.button 
              className={styles.moreSoundsButton}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleMoreSounds}
            >
              {showMoreSounds ? 'Less Sounds' : 'More Sounds...'}
            </motion.button>
          </div>
          
          {showMoreSounds && (
            <motion.div 
              className={styles.additionalSounds}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {additionalSounds.map(sound => (
                <motion.button 
                  key={sound.letter}
                  className={`${styles.soundButton} ${targetSound === sound.letter ? styles.selected : ''}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleTargetSoundChange(sound.letter)}
                >
                  {sound.letter.toUpperCase()}
                  {targetSound === sound.letter && (
                    <div className={styles.soundTooltip}>{sound.example}</div>
                  )}
                </motion.button>
              ))}
            </motion.div>
          )}
        </div>
        
        <div className={styles.configSection}>
          <h2>Difficulty Level:</h2>
          <div className={styles.difficultyOptions}>
            <motion.button 
              className={`${styles.difficultyButton} ${difficulty === 'easy' ? styles.selected : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleDifficultyChange('easy')}
            >
              <span className={styles.difficultyLabel}>Easy</span>
              <span className={styles.difficultyDescription}>6 animals, 60 seconds</span>
            </motion.button>
            
            <motion.button 
              className={`${styles.difficultyButton} ${difficulty === 'medium' ? styles.selected : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleDifficultyChange('medium')}
            >
              <span className={styles.difficultyLabel}>Medium</span>
              <span className={styles.difficultyDescription}>8 animals, 45 seconds</span>
            </motion.button>
            
            <motion.button 
              className={`${styles.difficultyButton} ${difficulty === 'hard' ? styles.selected : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleDifficultyChange('hard')}
            >
              <span className={styles.difficultyLabel}>Hard</span>
              <span className={styles.difficultyDescription}>12 animals, 30 seconds</span>
            </motion.button>
          </div>
        </div>
        
        <div className={styles.configSection}>
          <h2>Select Target Environment:</h2>
          <div className={styles.environmentOptions}>
            <motion.button 
              className={`${styles.environmentButton} ${styles.jungle} ${environment === 'jungle' ? styles.selected : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleEnvironmentChange('jungle')}
            >
              Jungle
            </motion.button>
            
            <motion.button 
              className={`${styles.environmentButton} ${styles.savanna} ${environment === 'savanna' ? styles.selected : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleEnvironmentChange('savanna')}
            >
              Savanna
            </motion.button>
            
            <motion.button 
              className={`${styles.environmentButton} ${styles.ocean} ${environment === 'ocean' ? styles.selected : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleEnvironmentChange('ocean')}
            >
              Ocean
            </motion.button>
            
            <motion.button 
              className={`${styles.environmentButton} ${styles.arctic} ${environment === 'arctic' ? styles.selected : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleEnvironmentChange('arctic')}
            >
              Arctic
            </motion.button>
          </div>
        </div>
        
        {playMode === 'group' && (
          <div className={styles.groupOptionsSection}>
            <h3>Group play options</h3>
            <motion.button 
              className={styles.setupTeamsButton}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Setup Teams
            </motion.button>
          </div>
        )}
        
        <div className={styles.configActions}>
          <motion.button 
            className={styles.backButton}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.history.back()}
          >
            Back
          </motion.button>
          
          <motion.button 
            className={styles.startButton}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBeginGame}
          >
            Start Safari
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default SoundSafariConfigScreen;