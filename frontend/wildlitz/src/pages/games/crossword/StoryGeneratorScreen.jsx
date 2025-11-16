// src/pages/games/crossword/StoryGeneratorScreen.jsx
// OPTIMIZED VERSION - No default selection, removed sight-words, added audio
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
    e.stopPropagation(); // Prevent triggering the skill selection
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
  
  // Form state - START WITH EMPTY ARRAY (NO DEFAULT SELECTION)
  const [theme, setTheme] = useState('jungle');
  const [focusSkills, setFocusSkills] = useState([]); // Changed from ['sight-words'] to []
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
  
  // Memoized static data - REMOVED 'sight-words' option
  const availableThemes = useMemo(() => [
    { id: 'jungle', name: 'Jungle Adventure', icon: '🌴', description: 'Explore lush rainforests filled with wildlife and mystery.' },
    { id: 'ocean', name: 'Ocean Discovery', icon: '🌊', description: 'Dive into underwater worlds and discover marine life.' },
    { id: 'farm', name: 'Farm Life', icon: '🚜', description: 'Experience life on a farm with animals and crops.' },
    { id: 'space', name: 'Space Journey', icon: '🚀', description: 'Travel among the stars and explore distant planets.' },
    { id: 'city', name: 'City Adventure', icon: '🏙️', description: 'Navigate bustling streets and exciting urban landscapes.' },
    { id: 'fairytale', name: 'Fairy Tale Kingdom', icon: '🏰', description: 'Discover magical castles and meet enchanted creatures.' }
  ], []);
  
  // REMOVED 'sight-words' from available skills
 const availableSkills = useMemo(() => [
  { id: 'phonics-sh', name: 'Phonics: SH Sound', icon: '📊' },
  { id: 'phonics-ch', name: 'Phonics: CH Sound', icon: '🎵' },
  { id: 'phonics-th', name: 'Phonics: TH Sound', icon: '🔤' },
  { id: 'phonics-wh', name: 'Phonics: WH Sound', icon: '❓' },
  { id: 'action-verbs', name: 'Action Verbs', icon: '🏃‍♂️' }
], []);
  
  // Audio playback function
  const playSkillAudio = useCallback((skillName) => {
    if (speechSynthRef.current) {
      // Cancel any ongoing speech
      speechSynthRef.current.cancel();
      
      // Create utterance
      const utterance = new SpeechSynthesisUtterance(skillName);
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1.1; // Slightly higher pitch for children
      utterance.volume = 1.0;
      
      // Try to use a child-friendly voice if available
      const voices = speechSynthRef.current.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Google') && voice.name.includes('US English')
      ) || voices.find(voice => voice.lang === 'en-US') || voices[0];
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      // Speak
      speechSynthRef.current.speak(utterance);
    }
  }, []);
  
  // Memoized handlers
  const handleSkillToggle = useCallback((skillId) => {
  setFocusSkills(prev => {
    if (prev.includes(skillId)) {
      // Remove skill if already selected
      return prev.filter(id => id !== skillId);
    } else {
      // Only allow max 2 skills
      if (prev.length >= 2) {
        // Show a message or just prevent adding more
        return prev; // Don't add more than 2
      }
      return [...prev, skillId];
    }
  });
}, []);

  const handleThemeSelect = useCallback((themeId) => {
    setTheme(themeId);
  }, []);

  const handleEpisodeIncrement = useCallback(() => {
    setEpisodeCount(prev => Math.min(5, prev + 1));
  }, []);

  const handleEpisodeDecrement = useCallback(() => {
    setEpisodeCount(prev => Math.max(1, prev - 1));
  }, []);

  const handleEpisodeChange = useCallback((e) => {
    setEpisodeCount(parseInt(e.target.value));
  }, []);

  // Clear timeout when component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      // Stop any ongoing speech
      if (speechSynthRef.current) {
        speechSynthRef.current.cancel();
      }
    };
  }, []);
  
  // Generate story with AI
  const generateStory = useCallback(async (e) => {
  if (e && e.preventDefault) {
    e.preventDefault();
  }
  
  // Validate that at least one skill is selected
  if (focusSkills.length === 0) {
  setError('⚠️ Please select at least one focus skill before creating your story!');
  
  // Scroll to top to show error
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Clear error after 5 seconds
  setTimeout(() => {
    setError(null);
  }, 5000);
  
  return;
}
  
  setIsGenerating(true);
  setGenerationProgress(0);
  setError(null); // Clear any previous errors
  setTimeoutWarning(false);
    
    // Set a timeout warning after 30 seconds
    timeoutRef.current = setTimeout(() => {
      setTimeoutWarning(true);
    }, 30000);
    
    // Simulated progress updates (optimized with ref)
    progressIntervalRef.current = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) {
          return 90;
        }
        return prev + (prev < 50 ? 4 : (prev < 80 ? 2 : 1));
      });
    }, 1000);
    
    try {
      const controller = new AbortController();
      const timeoutDuration = (episodeCount * 30000) + 30000;
      const fetchTimeout = setTimeout(() => controller.abort(), timeoutDuration);
      
      const requestBody = {
        theme,
        focusSkills: focusSkills.slice(0, 3),
        characterNames: characterNames || undefined,
        episodeCount: Math.min(episodeCount, 5),
        gradeLevel: 3,
      };
      
      
      
      const response = await fetch(`${API_ENDPOINTS.SENTENCE_FORMATION}/generate-story/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(fetchTimeout);
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }
    
      const responseText = await response.text();
      
      
      const responseData = JSON.parse(responseText);
      
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      if (!responseData || !responseData.story || !responseData.puzzles) {
        throw new Error("Response does not contain expected story data");
      }
      
      setGenerationProgress(100);
      
      setTimeout(() => {
        if (onStoryGenerated) {
          onStoryGenerated(responseData);
        }
        setIsGenerating(false);
      }, 500);
      
    } catch (err) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      if (err.name === 'AbortError') {
        setError('Request timed out. The server is taking too long to respond. Try with fewer episodes or a simpler theme.');
      } else {
        setError(err.message || 'An error occurred while generating the story');
      }
      setIsGenerating(false);
      console.error('Error generating story:', err);
    }
  }, [theme, focusSkills, characterNames, episodeCount, onStoryGenerated]);
  
  const handleRetry = useCallback(() => {
    setError(null);
    setIsGenerating(false);
    setGenerationProgress(0);
  }, []);
  
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);
  
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
              message="Creating your adventure..."
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
                    Try with Simpler Settings
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

            {/* Validation Error */}
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
              <label className={styles.formLabel}>Number of Episodes:</label>
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