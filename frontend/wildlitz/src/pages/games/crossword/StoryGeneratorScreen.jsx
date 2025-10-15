// src/pages/games/crossword/StoryGeneratorScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import styles from '../../../styles/games/crossword/StoryGeneratorScreen.module.css';
import { StoryLoadingScreen } from '../../../components/common/LoadingStates';
// ADD THIS IMPORT at the top with other imports
import CrosswordAnalyticsDashboard from '../../../pages/games/crossword/CrosswordAnalyticsDashboard';
import { API_ENDPOINTS } from '../../../config/api';


const StoryGeneratorScreen = ({ onStoryGenerated, onCancel }) => {
  const navigate = useNavigate();
  
  // Form state
  const [theme, setTheme] = useState('jungle');
  const [focusSkills, setFocusSkills] = useState(['sight-words']);
  const [characterNames, setCharacterNames] = useState('');
  const [episodeCount, setEpisodeCount] = useState(3);
  
  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [error, setError] = useState(null);
  const [timeoutWarning, setTimeoutWarning] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Creating your adventure...');
  
  // Timeout handling
  const [timeoutId, setTimeoutId] = useState(null);
  
  // Available themes and skills
  const availableThemes = [
    { id: 'jungle', name: 'Jungle Adventure', icon: '🌴', description: 'Explore lush rainforests filled with wildlife and mystery.' },
    { id: 'ocean', name: 'Ocean Discovery', icon: '🌊', description: 'Dive into underwater worlds and discover marine life.' },
    { id: 'farm', name: 'Farm Life', icon: '🚜', description: 'Experience life on a farm with animals and crops.' },
    { id: 'space', name: 'Space Journey', icon: '🚀', description: 'Travel among the stars and explore distant planets.' },
    { id: 'city', name: 'City Adventure', icon: '🏙️', description: 'Navigate bustling streets and exciting urban landscapes.' },
    { id: 'fairytale', name: 'Fairy Tale Kingdom', icon: '🏰', description: 'Discover magical castles and meet enchanted creatures.' }
  ];
  
  const availableSkills = [
    { id: 'sight-words', name: 'Sight Words', icon: '👁️' },
    { id: 'phonics-sh', name: 'Phonics: SH Sound', icon: '📊' },
    { id: 'phonics-ch', name: 'Phonics: CH Sound', icon: '🎵' },
    { id: 'long-vowels', name: 'Long Vowel Sounds', icon: '🔤' },
    { id: 'compound-words', name: 'Compound Words', icon: '🔗' },
    { id: 'action-verbs', name: 'Action Verbs', icon: '🏃‍♂️' }
  ];
  
  // Handle skill selection
  const handleSkillToggle = (skillId) => {
    if (focusSkills.includes(skillId)) {
      setFocusSkills(focusSkills.filter(id => id !== skillId));
    } else {
      setFocusSkills([...focusSkills, skillId]);
    }
  };

  // Clear timeout when component unmounts
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);
  
  // Generate story with AI
  const generateStory = async (e) => {
  if (e && e.preventDefault) {
    e.preventDefault();
  }
  
  setIsGenerating(true);
  setGenerationProgress(0);
  setError(null);
  setTimeoutWarning(false);
  
  // Set a timeout warning after 30 seconds
  const warningId = setTimeout(() => {
    setTimeoutWarning(true);
  }, 30000);
  
  setTimeoutId(warningId);
  
  // Simulated progress updates
  const progressInterval = setInterval(() => {
    setGenerationProgress(prev => {
      if (prev >= 90) {
        clearInterval(progressInterval);
        return 90;
      }
      return prev + (prev < 50 ? 4 : (prev < 80 ? 2 : 1));
    });
  }, 1000);
  
  try {
    const controller = new AbortController();
    const fetchTimeout = setTimeout(() => controller.abort(), 60000);
    
    const requestBody = {
      theme,
      focusSkills: focusSkills.slice(0, 3),
      characterNames: characterNames || undefined,
      episodeCount: Math.min(episodeCount, 5),
      gradeLevel: 3,
    };
    
    console.log("Sending request with data:", requestBody);
    
    // Updated API call using API_ENDPOINTS
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
    console.log("Response text:", responseText.substring(0, 200) + "...");
    
    const responseData = JSON.parse(responseText);
    
    clearInterval(progressInterval);
    clearTimeout(warningId);
    setTimeoutId(null);
    
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
    clearInterval(progressInterval);
    clearTimeout(warningId);
    setTimeoutId(null);
    
    if (err.name === 'AbortError') {
      setError('Request timed out. The server is taking too long to respond. Try with fewer episodes or a simpler theme.');
    } else {
      setError(err.message || 'An error occurred while generating the story');
    }
    setIsGenerating(false);
    console.error('Error generating story:', err);
  }
};
  
  const handleRetry = () => {
    setError(null);
    setIsGenerating(false);
    setGenerationProgress(0);
  };
  
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };
  
  return (
    <div className={styles.generatorContainer}>
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
            {/* Theme Selection */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Story Theme:</label>
              <div className={styles.themeOptionsContainer}>
                <div className={styles.themeOptions}>
                  {availableThemes.map(themeOption => (
                    <motion.div 
                      key={themeOption.id}
                      className={`${styles.themeOption} ${theme === themeOption.id ? styles.selected : ''}`}
                      onClick={() => setTheme(themeOption.id)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={styles.themeIconContainer}>
                        <span className={styles.themeEmoji}>{themeOption.icon}</span>
                      </div>
                      <div className={styles.themeDetails}>
                        <h3 className={styles.themeName}>{themeOption.name}</h3>
                        <p className={styles.themeDescription}>{themeOption.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Skill Focus */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Focus Skills: <span className={styles.optionalHint}>(select up to 3)</span></label>
              <div className={styles.skillsOptions}>
                {availableSkills.map(skill => {
                  const canSelect = focusSkills.includes(skill.id) || focusSkills.length < 3;
                  
                  return (
                    <motion.div 
                      key={skill.id}
                      className={`${styles.skillOption} ${focusSkills.includes(skill.id) ? styles.selected : ''}`}
                      onClick={() => canSelect && handleSkillToggle(skill.id)}
                      whileHover={{ scale: canSelect ? 1.05 : 1 }}
                      whileTap={{ scale: canSelect ? 0.95 : 1 }}
                      disabled={!canSelect}
                    >
                      <div className={styles.skillCheckbox}>
                        {focusSkills.includes(skill.id) ? skill.icon : ''}
                      </div>
                      <span>{skill.name}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
            
            {/* Character Names (Optional) */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Character Names (Optional):
                <span className={styles.optionalHint}>Leave blank for AI to choose</span>
              </label>
              <input 
                type="text"
                value={characterNames}
                onChange={(e) => setCharacterNames(e.target.value)}
                placeholder="e.g., Sam, Alex, Taylor"
                className={styles.textInput}
              />
            </div>
            
            {/* Episode Count */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Number of Episodes: <span className={styles.optionalHint}>(1-5)</span></label>
              <div className={styles.episodeCountControls}>
                <motion.button 
                  type="button"
                  className={styles.countButton}
                  onClick={() => setEpisodeCount(Math.max(1, episodeCount - 1))}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={episodeCount <= 1}
                >
                  -
                </motion.button>
                <div className={styles.episodeCount}>{episodeCount}</div>
                <motion.button 
                  type="button"
                  className={styles.countButton}
                  onClick={() => setEpisodeCount(Math.min(5, episodeCount + 1))}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={episodeCount >= 5}
                >
                  +
                </motion.button>
              </div>
              <div className={styles.episodeSlider}>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={episodeCount}
                  onChange={(e) => setEpisodeCount(parseInt(e.target.value))}
                  className={styles.slider}
                />
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className={styles.actionButtons}>
              <motion.button 
                type="button"
                className={styles.cancelButton}
                onClick={handleCancel}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
              <motion.button 
                type="submit"
                className={styles.generateButton}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Create Story
              </motion.button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default StoryGeneratorScreen;