// src/pages/games/crossword/StoryGeneratorScreen.jsx
// OPTIMIZED VERSION - Progressive Episode Generation (FIXED)
// 
// KEY CHANGES:
// 1. generateStoryProgressively now ONLY generates the FIRST episode
// 2. Stores totalEpisodes and generatedEpisodes in story metadata
// 3. Subsequent episodes are generated on-demand when user clicks "Continue to Next Episode"

import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Volume2 } from 'lucide-react';
import styles from '../../../styles/games/crossword/StoryGeneratorScreen.module.css';
import { StoryLoadingScreen } from '../../../components/common/LoadingStates';
import CrosswordAnalyticsDashboard from '../../../pages/games/crossword/CrosswordAnalyticsDashboard';
import { API_ENDPOINTS } from '../../../config/api';
import BackToHomeButton from '../../games/crossword/BackToHomeButton';

// Memoized Theme Option Component
const ThemeOption = memo(({ themeOption, isSelected, onSelect }) => {
  return (
    <div 
      className={`${styles.themeOption} ${isSelected ? styles.selected : ''}`}
      onClick={() => onSelect(themeOption.id)}
    >
      <div className={styles.themeIcon}>{themeOption.icon}</div>
      <div className={styles.themeContent}>
        <h3 className={styles.themeName}>{themeOption.name}</h3>
        <p className={styles.themeDescription}>{themeOption.description}</p>
      </div>
    </div>
  );
});

ThemeOption.displayName = 'ThemeOption';

// Memoized Skill Option Component with Audio
const SkillOption = memo(({ skill, isSelected, onToggle, onPlayAudio, disabled }) => {
  const handleAudioClick = (e) => {
    e.stopPropagation();
    onPlayAudio(skill.name);
  };

  return (
    <div 
      className={`${styles.skillOption} ${isSelected ? styles.selected : ''} ${disabled ? styles.disabled : ''}`}
      onClick={() => !disabled && onToggle(skill.id)}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}
    >
      <span className={styles.skillIcon}>{skill.icon}</span>
      <span className={styles.skillName}>{skill.name}</span>
      <button 
        className={styles.audioButton}
        onClick={handleAudioClick}
        type="button"
        aria-label={`Play audio for ${skill.name}`}
        disabled={disabled}
      >
        <Volume2 size={18} />
      </button>
    </div>
  );
});

SkillOption.displayName = 'SkillOption';

const StoryGeneratorScreen = ({ onStoryGenerated, onCancel }) => {
  const navigate = useNavigate();
  
  // Form state
  const [theme, setTheme] = useState('jungle');
  const [focusSkills, setFocusSkills] = useState([]);
  const [characterNames, setCharacterNames] = useState('');
  const [episodeCount, setEpisodeCount] = useState(3);
  
  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [error, setError] = useState(null);
  const [timeoutWarning, setTimeoutWarning] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Creating your adventure...');
  
  // Timeout handling
  const timeoutRef = useRef(null);
  const progressIntervalRef = useRef(null);
  
  // Speech synthesis reference
  const speechSynthRef = useRef(null);
  
  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthRef.current = window.speechSynthesis;
    }
  }, []);
  
  // Memoized static data
  const availableThemes = useMemo(() => [
    { id: 'jungle', name: 'Jungle Adventure', icon: '🌴', description: 'Explore lush rainforests filled with wildlife and mystery.' },
    { id: 'ocean', name: 'Ocean Discovery', icon: '🌊', description: 'Dive into underwater worlds and discover marine life.' },
    { id: 'farm', name: 'Farm Life', icon: '🚜', description: 'Experience life on a farm with animals and crops.' },
    { id: 'space', name: 'Space Journey', icon: '🚀', description: 'Travel among the stars and explore distant planets.' },
    { id: 'city', name: 'City Adventure', icon: '🏙️', description: 'Navigate bustling streets and exciting urban landscapes.' },
    { id: 'fairytale', name: 'Fairy Tale Kingdom', icon: '🏰', description: 'Discover magical castles and meet enchanted creatures.' }
  ], []);
  
  const availableSkills = useMemo(() => [
    { id: 'phonics-sh', name: 'Phonics: SH Sound', icon: '🔊' },
    { id: 'phonics-ch', name: 'Phonics: CH Sound', icon: '🎵' },
    { id: 'phonics-th', name: 'Phonics: TH Sound', icon: '🔤' },
    { id: 'phonics-wh', name: 'Phonics: WH Sound', icon: '❓' },
    { id: 'action-verbs', name: 'Action Verbs', icon: '🏃‍♂️' }
  ], []);
  
  // Audio playback function
  const playSkillAudio = useCallback((skillName) => {
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
      
      const utterance = new SpeechSynthesisUtterance(skillName);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 1.0;
      
      const voices = speechSynthRef.current.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Google') && voice.name.includes('US English')
      ) || voices.find(voice => voice.lang === 'en-US') || voices[0];
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      speechSynthRef.current.speak(utterance);
    }
  }, []);

  // ⭐ FIXED: Generate ONLY the first episode, not all episodes
  const generateStoryProgressively = useCallback(async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setError(null);
    
    try {
      // Generate ONLY the FIRST episode
      setGenerationProgress(50);
      
      const response = await fetch(`${API_ENDPOINTS.SENTENCE_FORMATION}/generate-story/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme,
          focusSkills: focusSkills.slice(0, 3),
          characterNames: characterNames || undefined,
          episodeCount: 1, // ⭐ Only generate first episode
          episodeNumber: 1, // This is episode 1
          gradeLevel: 3,
          totalEpisodes: episodeCount // ⭐ Store total requested for later
        }),
        signal: AbortSignal.timeout(25000)
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate first episode');
      }
      
      const data = await response.json();
      
      setGenerationProgress(100);
      
      // ⭐ Create story with ONLY the first episode
      const storyData = {
        story: {
          id: `story_${Date.now()}`,
          title: `${theme.charAt(0).toUpperCase() + theme.slice(1)} Adventure`,
          description: `An exciting ${theme} adventure story!`,
          theme,
          focusSkills,
          characterNames: characterNames || '',
          gradeLevel: 3,
          episodes: data.story?.episodes || [],
          totalEpisodes: episodeCount, // ⭐ Total episodes user requested
          generatedEpisodes: 1 // ⭐ Only 1 episode generated so far
        },
        puzzles: data.puzzles || {}
      };
      
      setTimeout(() => {
        if (onStoryGenerated) {
          onStoryGenerated(storyData);
        }
        setIsGenerating(false);
      }, 500);
      
    } catch (err) {
      setError(err.message || 'Failed to generate story');
      setIsGenerating(false);
      console.error('Error:', err);
    }
  }, [theme, focusSkills, characterNames, episodeCount, onStoryGenerated]);

  const handleRetry = useCallback(() => {
    setError(null);
    setIsGenerating(false);
    setGenerationProgress(0);
    setTimeoutWarning(false);
  }, []);

  const handleCancel = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsGenerating(false);
    setError(null);
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  const handleThemeSelect = useCallback((themeId) => {
    setTheme(themeId);
  }, []);

  const handleSkillToggle = useCallback((skillId) => {
    setFocusSkills(prev => {
      if (prev.includes(skillId)) {
        return prev.filter(id => id !== skillId);
      } else if (prev.length < 2) {
        return [...prev, skillId];
      }
      return prev;
    });
  }, []);

  const handleEpisodeIncrement = useCallback(() => {
    setEpisodeCount(prev => Math.min(prev + 1, 5));
  }, []);

  const handleEpisodeDecrement = useCallback(() => {
    setEpisodeCount(prev => Math.max(prev - 1, 1));
  }, []);

  const handleEpisodeChange = useCallback((e) => {
    setEpisodeCount(parseInt(e.target.value, 10));
  }, []);

  const generateStory = useCallback(async (e) => {
    e.preventDefault();
    
    if (focusSkills.length === 0) {
      setError('Please select at least 1 focus skill');
      return;
    }
    
    if (focusSkills.length > 2) {
      setError('Please select no more than 2 focus skills');
      return;
    }
    
    setError(null);
    await generateStoryProgressively();
  }, [focusSkills, generateStoryProgressively]);

  return (
    <div className={styles.generatorContainer}>
      <BackToHomeButton position="top-left" />
      <div className={styles.generatorCard}>
        <div className={styles.titleContainer}>
          <h1 className={styles.generatorTitle}>Story Adventure Creator</h1>
          <div className={styles.subtitleContainer}>
            <p className={styles.generatorSubtitle}>Design your perfect reading adventure!</p>
          </div>
        </div>
        
        {isGenerating ? (
          <div className={styles.generatingContent}>
            <StoryLoadingScreen 
              progress={generationProgress}
              message="Creating your first episode..."
              showWarning={timeoutWarning && generationProgress < 100}
            />
            
            {timeoutWarning && generationProgress < 100 && (
              <div className={styles.warningMessage}>
                <p>This is taking longer than expected. Please be patient - AI story generation can take some time.</p>
              </div>
            )}
            
            {error && (
              <div className={styles.errorMessage}>
                <p>{error}</p>
                <div className={styles.errorActions}>
                  <button 
                    className={styles.retryButton}
                    onClick={handleRetry}
                  >
                    Try Again
                  </button>
                  <button 
                    className={styles.cancelButton}
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            {generationProgress >= 90 && !error && (
              <div className={styles.longOperationMessage}>
                <p>Almost done! The AI is crafting the final details...</p>
                <button 
                  className={styles.cancelButton}
                  onClick={handleCancel}
                >
                  Cancel and Go Back
                </button>
              </div>
            )}
          </div>
        ) : (
          <form className={styles.generatorForm} onSubmit={generateStory}>
            {error && !isGenerating && (
              <div className={styles.validationError}>
                <span className="errorIcon">⚠️</span>
                <p className="errorText">{error}</p>
              </div>
            )}
            
            {/* Theme Selection */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Story Theme:</label>
              <div className={styles.themeOptionsContainer}>
                <div className={styles.themeOptions}>
                  {availableThemes.map(themeOption => (
                    <ThemeOption
                      key={themeOption.id}
                      themeOption={themeOption}
                      isSelected={theme === themeOption.id}
                      onSelect={handleThemeSelect}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            {/* Skills Selection */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Focus Skills:
                <span className={styles.skillCount}>
                  {focusSkills.length}/2 selected
                </span>
              </label>
              {focusSkills.length >= 2 && (
                <p className={styles.maxSkillsWarning}>
                  ⚠️ Maximum 2 skills selected. Deselect one to choose a different skill.
                </p>
              )}
              <div className={styles.skillOptions}>
                {availableSkills.map(skill => (
                  <SkillOption
                    key={skill.id}
                    skill={skill}
                    isSelected={focusSkills.includes(skill.id)}
                    onToggle={handleSkillToggle}
                    onPlayAudio={playSkillAudio}
                    disabled={!focusSkills.includes(skill.id) && focusSkills.length >= 2}
                  />
                ))}
              </div>
              <p className={styles.skillHint}>
                💡 Select 1-2 skills for the best results. Click 🔊 to hear each skill!
              </p>
            </div>
            
            {/* Character Names */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Character Names (Optional):</label>
              <input
                type="text"
                className={styles.textInput}
                placeholder="e.g., Alex, Maya, Sam (comma-separated)"
                value={characterNames}
                onChange={(e) => setCharacterNames(e.target.value)}
              />
              <p className={styles.inputHint}>
                ✨ Leave blank for auto-generated names
              </p>
            </div>
            
            {/* Episode Count */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Number of Episodes:
                <span className={styles.episodeHint}> (First episode generated now, rest generated as you play!)</span>
              </label>
              <div className={styles.episodeCountControls}>
                <button 
                  type="button"
                  className={styles.countButton}
                  onClick={handleEpisodeDecrement}
                  disabled={episodeCount <= 1}
                >
                  -
                </button>
                <div className={styles.episodeCount}>{episodeCount}</div>
                <button 
                  type="button"
                  className={styles.countButton}
                  onClick={handleEpisodeIncrement}
                  disabled={episodeCount >= 5}
                >
                  +
                </button>
              </div>
              <div className={styles.episodeSlider}>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={episodeCount}
                  onChange={handleEpisodeChange}
                  className={styles.slider}
                />
              </div>
            </div>
            
            {/* Action Buttons */}
            {error && !isGenerating && (
              <div className={styles.validationError}>
                <span className={styles.errorIcon}>⚠️</span>
                <p className={styles.errorText}>{error}</p>
              </div>
            )}
            <div className={styles.actionButtons}>
              <button 
                type="button"
                className={styles.cancelButton}
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button 
                type="submit"
                className={styles.generateButton}
              >
                Create Story
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default StoryGeneratorScreen;