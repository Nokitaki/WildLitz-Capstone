import React, { useState } from 'react';
import { motion } from 'framer-motion';
import styles from '../styles/SoundSafariGame.module.css';

const SoundSafariConfigScreen = ({ onStartGame }) => {
  // Game configuration state
  const [playMode, setPlayMode] = useState('solo'); // 'solo' or 'group'
  const [soundPosition, setSoundPosition] = useState('beginning'); // 'beginning', 'middle', 'ending'
  const [targetSound, setTargetSound] = useState('s'); // 's', 'm', 't', 'b', 'p', etc.
  const [environment, setEnvironment] = useState('jungle'); // 'jungle', 'savanna', 'ocean', 'arctic'
  
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
  
  // Handle start game
  const handleBeginGame = () => {
    const gameConfig = {
      playMode,
      soundPosition,
      targetSound,
      environment
    };
    
    // In a real implementation, this would pass the config to the game component
    console.log('Starting game with config:', gameConfig);
    if (onStartGame) {
      onStartGame(gameConfig);
    }
  };
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>WildLitz - Sound Safari Adventure</h1>
        <div className={styles.logo}>
          <img src="/assets/img/wildlitz-fox.png" alt="WildLitz Fox" />
        </div>
      </div>
      
      <div className={styles.configContent}>
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
          </div>
          
          <h3>Select Target Sound:</h3>
          <div className={styles.soundOptions}>
            <motion.button 
              className={`${styles.soundButton} ${targetSound === 's' ? styles.selected : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleTargetSoundChange('s')}
            >
              S
            </motion.button>
            
            <motion.button 
              className={`${styles.soundButton} ${targetSound === 'm' ? styles.selected : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleTargetSoundChange('m')}
            >
              M
            </motion.button>
            
            <motion.button 
              className={`${styles.soundButton} ${targetSound === 't' ? styles.selected : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleTargetSoundChange('t')}
            >
              T
            </motion.button>
            
            <motion.button 
              className={`${styles.soundButton} ${targetSound === 'b' ? styles.selected : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleTargetSoundChange('b')}
            >
              B
            </motion.button>
            
            <motion.button 
              className={`${styles.soundButton} ${targetSound === 'p' ? styles.selected : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleTargetSoundChange('p')}
            >
              P
            </motion.button>
            
            <motion.button 
              className={styles.moreSoundsButton}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              More Sounds ...
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