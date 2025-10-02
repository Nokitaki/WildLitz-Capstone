// src/pages/games/vanishing/ConfigScreen.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../../styles/games/vanishing/ConfigScreen.module.css';

/**
 * Enhanced Configuration screen for the Vanishing Game
 * Features modern design, smooth animations, and intuitive user experience
 */
const ConfigScreen = ({ 
  onStartGame, 
  onViewAnalytics, // ANALYTICS ADDED - Only change to props
  loading = false, 
  error = null 
}) => {
  // Game configuration state - Start with no selections
  const [challengeLevel, setChallengeLevel] = useState('');
  const [learningFocus, setLearningFocus] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [highlightTarget, setHighlightTarget] = useState(true);
  const [vanishSpeed, setVanishSpeed] = useState('normal');
  const [numberOfQuestions, setNumberOfQuestions] = useState(10);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  // Configuration progress
  const [configProgress, setConfigProgress] = useState(0);

  // Audio and team settings
  const [enableAudio, setEnableAudio] = useState(true);
  const [voiceType, setVoiceType] = useState('happy');
  const [teamPlay, setTeamPlay] = useState(false);
  const [teamAName, setTeamAName] = useState('Team A');
  const [teamBName, setTeamBName] = useState('Team B');
  
  // Calculate configuration progress
  useEffect(() => {
    let progress = 0;
    if (challengeLevel) progress += 33.33;
    if (learningFocus) progress += 33.33;
    if (difficulty) progress += 33.34;
    setConfigProgress(progress);
  }, [challengeLevel, learningFocus, difficulty]);
  
  // Handle quick start with default settings
  const handleQuickStart = () => {
    const config = {
      challengeLevel: 'simple_words',
      learningFocus: 'short_vowels',
      difficulty: 'easy',
      highlightTarget: true,
      vanishSpeed: 'normal',
      numberOfQuestions: 10
    };
    
    if (onStartGame) {
      onStartGame(config);
    }
  };
  
  // Check if all required fields are selected
  const isConfigComplete = challengeLevel && learningFocus && difficulty;

  // Handle start game with custom settings
  const handleStartGame = () => {
    if (!isConfigComplete || loading) return;
    
    const config = {
      challengeLevel,
      learningFocus,
      difficulty,
      highlightTarget,
      vanishSpeed,
      numberOfQuestions,
      enableAudio,
      voiceType,
      teamPlay,
      teamAName: teamPlay ? teamAName : null,
      teamBName: teamPlay ? teamBName : null
    };
    
    if (onStartGame) {
      onStartGame(config);
    }
  };
  
  // Get the learning focus display name and icon
  const getLearningFocusInfo = (focus) => {
    const info = {
      short_vowels: { name: 'Short Vowels', icon: '🗣️', description: 'a, e, i, o, u sounds' },
      long_vowels: { name: 'Long Vowels', icon: '📏', description: 'ā, ē, ī, ō, ū sounds' },
      blends: { name: 'Blends', icon: '🔄', description: 'bl, cr, st, etc.' },
      digraphs: { name: 'Digraphs', icon: '🤝', description: 'ch, sh, th, etc.' }
    };
    
    return info[focus] || { name: focus, icon: '📖', description: '' };
  };
  
  // Get the challenge level display name and icon
  const getChallengeLevelInfo = (level) => {
    const info = {
      simple_words: { name: 'Simple Words', icon: '🔤', description: 'Single words like "cat", "sun"' },
      compound_words: { name: 'Compound Words', icon: '🏢', description: 'Combined words like "playground"' },
      phrases: { name: 'Phrases', icon: '💭', description: 'Short phrases like "red car"' },
      simple_sentences: { name: 'Simple Sentences', icon: '📝', description: 'Complete sentences' }
    };
    
    return info[level] || { name: level, icon: '📖', description: '' };
  };

  // Get difficulty info
  const getDifficultyInfo = (level) => {
    const info = {
      easy: { name: 'Easy', icon: '🟢', description: '6 seconds to read', time: '6s' },
      medium: { name: 'Medium', icon: '🟡', description: '4 seconds to read', time: '4s' },
      hard: { name: 'Hard', icon: '🔴', description: '3 seconds to read', time: '3s' }
    };
    
    return info[level] || { name: level, icon: '⚪', description: '', time: '' };
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const buttonVariants = {
    idle: { scale: 1, y: 0 },
    hover: { scale: 1.05, y: -3 },
    tap: { scale: 0.98, y: 0 }
  };

  return (
    <div className={styles.configContainer}>
      <motion.div 
        className={styles.configCard}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Enhanced header with progress */}
        <motion.div className={styles.gameHeader} variants={itemVariants}>
          <div className={styles.logoContainer}>
            <h1 className={styles.gameTitle}>WildLitz Vanishing Game</h1>
            <p className={styles.gameSubtitle}>Configure your reading adventure!</p>
          </div>
          
          {/* Progress indicator */}
          <div className={styles.progressContainer}>
            <div className={styles.progressLabel}>Setup Progress</div>
            <div className={styles.progressBar}>
              <motion.div 
                className={styles.progressFill}
                initial={{ width: 0 }}
                animate={{ width: `${configProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className={styles.progressText}>{Math.round(configProgress)}% Complete</div>
          </div>
        </motion.div>
        
        {/* Quick start section */}
        <motion.div className={styles.quickStartSection} variants={itemVariants}>
          <h3>🚀 Ready to Jump In?</h3>
          <div className={styles.quickStartButtons}>
            <motion.button 
              className={styles.quickStartButton}
              variants={buttonVariants}
              initial="idle"
              whileHover="hover"
              whileTap="tap"
              onClick={handleQuickStart}
              disabled={loading}
            >
              <span className={styles.buttonIcon}>⚡</span>
              Quick Start
              <span className={styles.buttonSubtext}>Default settings</span>
            </motion.button>
            
            {/* ANALYTICS ADDED: View Analytics Button */}
            <motion.button 
              className={styles.analyticsButton}
              variants={buttonVariants}
              initial="idle"
              whileHover="hover"
              whileTap="tap"
              onClick={onViewAnalytics}
            >
              <span className={styles.buttonIcon}>📊</span>
              View Analytics
              <span className={styles.buttonSubtext}>Track progress</span>
            </motion.button>
            {/* END ANALYTICS ADDED */}
          </div>
          <div className={styles.divider}>
            <span>or customize your experience</span>
          </div>
        </motion.div>
        
        {/* Configuration steps */}
        <div className={styles.configSteps}>
          {/* Step 1: Challenge Level */}
          <motion.div className={styles.configStep} variants={itemVariants}>
            <div className={styles.stepHeader}>
              <span className={styles.stepNumber}>1</span>
              <h3 className={styles.stepTitle}>Choose Your Challenge</h3>
            </div>
            
            <div className={styles.optionsGrid}>
              {['simple_words', 'compound_words', 'phrases', 'simple_sentences'].map((level) => {
                const info = getChallengeLevelInfo(level);
                return (
                  <motion.button
                    key={level}
                    className={`${styles.optionCard} ${challengeLevel === level ? styles.selected : ''}`}
                    variants={buttonVariants}
                    initial="idle"
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => setChallengeLevel(level)}
                    disabled={loading}
                  >
                    <div className={styles.cardIcon}>{info.icon}</div>
                    <div className={styles.cardTitle}>{info.name}</div>
                    <div className={styles.cardDescription}>{info.description}</div>
                    {challengeLevel === level && (
                      <motion.div 
                        className={styles.selectedIndicator}
                        layoutId="challengeLevel"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      >
                        ✓
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
          
          {/* Step 2: Learning Focus */}
          <motion.div className={styles.configStep} variants={itemVariants}>
            <div className={styles.stepHeader}>
              <span className={styles.stepNumber}>2</span>
              <h3 className={styles.stepTitle}>Select Learning Focus</h3>
            </div>
            
            <div className={styles.optionsGrid}>
              {['short_vowels', 'long_vowels', 'blends', 'digraphs'].map((focus) => {
                const info = getLearningFocusInfo(focus);
                return (
                  <motion.button
                    key={focus}
                    className={`${styles.optionCard} ${learningFocus === focus ? styles.selected : ''}`}
                    variants={buttonVariants}
                    initial="idle"
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => setLearningFocus(focus)}
                    disabled={loading}
                  >
                    <div className={styles.cardIcon}>{info.icon}</div>
                    <div className={styles.cardTitle}>{info.name}</div>
                    <div className={styles.cardDescription}>{info.description}</div>
                    {learningFocus === focus && (
                      <motion.div 
                        className={styles.selectedIndicator}
                        layoutId="learningFocus"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      >
                        ✓
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
          
          {/* Step 3: Difficulty */}
          <motion.div className={styles.configStep} variants={itemVariants}>
            <div className={styles.stepHeader}>
              <span className={styles.stepNumber}>3</span>
              <h3 className={styles.stepTitle}>Set Difficulty Level</h3>
            </div>
            
            <div className={styles.difficultyGrid}>
              {['easy', 'medium', 'hard'].map((level) => {
                const info = getDifficultyInfo(level);
                return (
                  <motion.button
                    key={level}
                    className={`${styles.difficultyCard} ${difficulty === level ? styles.selected : ''}`}
                    variants={buttonVariants}
                    initial="idle"
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => setDifficulty(level)}
                    disabled={loading}
                  >
                    <div className={styles.difficultyIcon}>{info.icon}</div>
                    <div className={styles.difficultyName}>{info.name}</div>
                    <div className={styles.difficultyTime}>{info.time}</div>
                    <div className={styles.difficultyDescription}>{info.description}</div>
                    {difficulty === level && (
                      <motion.div 
                        className={styles.selectedIndicator}
                        layoutId="difficulty"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      >
                        ✓
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
            
            {/* Advanced options toggle */}
            <motion.button
              className={styles.advancedToggle}
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              variants={buttonVariants}
              initial="idle"
              whileHover="hover"
              whileTap="tap"
              disabled={loading}
            >
              <span className={styles.toggleIcon}>
                {showAdvancedOptions ? '▼' : '▶'}
              </span>
              Advanced Options
              <span className={styles.optionalBadge}>Optional</span>
            </motion.button>
            
            {/* Advanced options panel */}
            <AnimatePresence>
              {showAdvancedOptions && (
                <motion.div
                  className={styles.advancedOptions}
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 20 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={styles.advancedHeader}>
                    <span className={styles.advancedIcon}>⚙️</span>
                    <h4>Fine-tune Your Experience</h4>
                  </div>
                  
                  {/* Number of Questions Setting */}
                  <div className={styles.advancedRow}>
                    <div className={styles.numberInputGroup}>
                      <label className={styles.numberInputLabel}>
                        <span>Number of Questions</span>
                        <span className={styles.numberInputDescription}>How many words/questions to practice</span>
                      </label>
                      <div className={styles.numberInputContainer}>
                        <button 
                          className={styles.numberButton}
                          onClick={() => setNumberOfQuestions(Math.max(5, numberOfQuestions - 1))}
                          disabled={loading || numberOfQuestions <= 5}
                        >
                          −
                        </button>
                        <span className={styles.numberDisplay}>{numberOfQuestions}</span>
                        <button 
                          className={styles.numberButton}
                          onClick={() => setNumberOfQuestions(Math.min(20, numberOfQuestions + 1))}
                          disabled={loading || numberOfQuestions >= 20}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Audio Settings */}
                  <div className={styles.advancedRow}>
                    <div className={styles.toggleGroup}>
                      <label className={styles.toggleLabel}>
                        <span>🔊 Play Audio</span>
                        <span className={styles.toggleDescription}>Read words aloud with kid-friendly voice</span>
                      </label>
                      <motion.button
                        className={`${styles.toggle} ${enableAudio ? styles.active : ''}`}
                        onClick={() => setEnableAudio(!enableAudio)}
                        whileTap={{ scale: 0.95 }}
                        disabled={loading}
                      >
                        <motion.div
                          className={styles.toggleHandle}
                          animate={{ x: enableAudio ? 24 : 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        />
                      </motion.button>
                    </div>
                  </div>

                  {/* Voice Selection */}
                  {enableAudio && (
                    <div className={styles.advancedRow}>
                      <div className={styles.sliderGroup}>
                        <label className={styles.sliderLabel}>
                          <span>🎭 Voice Character</span>
                          <span className={styles.sliderDescription}>Choose the voice that kids will love</span>
                        </label>
                        <div className={styles.speedSelector}>
                          {[
                            { key: 'happy', label: 'Happy', emoji: '😊' },
                            { key: 'gentle', label: 'Gentle', emoji: '🌸' },
                            { key: 'playful', label: 'Playful', emoji: '🎪' },
                            { key: 'friendly', label: 'Friendly', emoji: '🌟' }
                          ].map((voice) => (
                            <motion.button
                              key={voice.key}
                              className={`${styles.speedOption} ${voiceType === voice.key ? styles.active : ''}`}
                              onClick={() => setVoiceType(voice.key)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              disabled={loading}
                            >
                              <span>{voice.emoji}</span>
                              <span>{voice.label}</span>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Team Play Setting */}
                  <div className={styles.advancedRow}>
                    <div className={styles.toggleGroup}>
                      <label className={styles.toggleLabel}>
                        <span>👥 Team Play Mode</span>
                        <span className={styles.toggleDescription}>Split class into two teams and track scores</span>
                      </label>
                      <motion.button
                        className={`${styles.toggle} ${teamPlay ? styles.active : ''}`}
                        onClick={() => setTeamPlay(!teamPlay)}
                        whileTap={{ scale: 0.95 }}
                        disabled={loading}
                      >
                        <motion.div
                          className={styles.toggleHandle}
                          animate={{ x: teamPlay ? 24 : 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        />
                      </motion.button>
                    </div>
                  </div>

                  {/* Team Names */}
                  {teamPlay && (
                    <div className={styles.advancedRow}>
                      <div className={styles.teamNamesGroup}>
                        <label className={styles.teamLabel}>
                          <span>Team Names</span>
                          <span className={styles.teamDescription}>Customize your team names</span>
                        </label>
                        <div className={styles.teamInputs}>
                          <input
                            type="text"
                            value={teamAName}
                            onChange={(e) => setTeamAName(e.target.value)}
                            placeholder="Team A"
                            className={styles.teamInput}
                            disabled={loading}
                            maxLength={20}
                          />
                          <span className={styles.teamVs}>VS</span>
                          <input
                            type="text"
                            value={teamBName}
                            onChange={(e) => setTeamBName(e.target.value)}
                            placeholder="Team B"
                            className={styles.teamInput}
                            disabled={loading}
                            maxLength={20}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className={styles.advancedRow}>
                    <div className={styles.toggleGroup}>
                      <label className={styles.toggleLabel}>
                        <span>Highlight Patterns</span>
                        <span className={styles.toggleDescription}>Visual emphasis on target sounds</span>
                      </label>
                      <motion.button
                        className={`${styles.toggle} ${highlightTarget ? styles.active : ''}`}
                        onClick={() => setHighlightTarget(!highlightTarget)}
                        whileTap={{ scale: 0.95 }}
                        disabled={loading}
                      >
                        <motion.div
                          className={styles.toggleHandle}
                          animate={{ x: highlightTarget ? 24 : 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        />
                      </motion.button>
                    </div>
                  </div>
                  
                  <div className={styles.advancedRow}>
                    <div className={styles.sliderGroup}>
                      <label className={styles.sliderLabel}>
                        <span>Vanish Speed</span>
                        <span className={styles.sliderDescription}>How quickly words disappear</span>
                      </label>
                      <div className={styles.speedSelector}>
                        {['slow', 'normal', 'fast'].map((speed) => (
                          <motion.button
                            key={speed}
                            className={`${styles.speedOption} ${vanishSpeed === speed ? styles.active : ''}`}
                            onClick={() => setVanishSpeed(speed)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={loading}
                          >
                            {speed.charAt(0).toUpperCase() + speed.slice(1)}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
        
        {/* Action buttons */}
        <motion.div className={styles.actionButtons} variants={itemVariants}>
          <motion.button 
            className={styles.backButton}
            variants={buttonVariants}
            initial="idle"
            whileHover="hover"
            whileTap="tap"
            onClick={() => window.history.back()}
            disabled={loading}
          >
            <span className={styles.buttonIcon}>←</span>
            Back
          </motion.button>
          
          <motion.button 
            className={`${styles.startButton} ${!isConfigComplete || loading ? styles.disabled : ''}`}
            variants={buttonVariants}
            initial="idle"
            whileHover={isConfigComplete && !loading ? "hover" : "idle"}
            whileTap={isConfigComplete && !loading ? "tap" : "idle"}
            onClick={handleStartGame}
            disabled={!isConfigComplete || loading}
          >
            <span className={styles.buttonIcon}>
              {loading ? '⏳' : '🎮'}
            </span>
            {loading ? `Generating ${numberOfQuestions} Words...` :
             !isConfigComplete ? 'Select All Options' : `Begin Adventure (${numberOfQuestions} Questions)`}
            {isConfigComplete && !loading && (
              <motion.div 
                className={styles.buttonGlow}
                animate={{ 
                  opacity: [0.5, 1, 0.5],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              />
            )}
          </motion.button>
        </motion.div>
        
        {/* Configuration summary */}
        {(challengeLevel || learningFocus || difficulty) && (
          <motion.div className={styles.configSummary} variants={itemVariants}>
            <h4>🎯 Your Configuration:</h4>
            <div className={styles.summaryItems}>
              {challengeLevel && (
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Challenge:</span>
                  <span className={styles.summaryValue}>
                    {getChallengeLevelInfo(challengeLevel).name}
                  </span>
                </div>
              )}
              {learningFocus && (
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Focus:</span>
                  <span className={styles.summaryValue}>
                    {getLearningFocusInfo(learningFocus).name}
                  </span>
                </div>
              )}
              {difficulty && (
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Difficulty:</span>
                  <span className={styles.summaryValue}>
                    {getDifficultyInfo(difficulty).name} ({getDifficultyInfo(difficulty).time})
                  </span>
                </div>
              )}
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Questions:</span>
                <span className={styles.summaryValue}>{numberOfQuestions}</span>
              </div>
            </div>
            {loading && (
              <div className={styles.loadingMessage}>
                <span className={styles.loadingIcon}>🤖</span>
                AI is generating {numberOfQuestions} unique words for your session...
              </div>
            )}
            {error && (
              <div className={styles.errorMessage}>
                <span className={styles.errorIcon}>⚠️</span>
                {error}
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ConfigScreen;