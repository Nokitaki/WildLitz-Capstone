// src/pages/games/crossword/StoryGeneratorScreen.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import styles from '../../../styles/games/crossword/StoryGeneratorScreen.module.css';

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
  
  // Timeout handling
  const [timeoutId, setTimeoutId] = useState(null);
  
  // Available themes and skills - expanded to 5 themes
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
    { id: 'phonics-sh', name: 'Phonics: SH Sound', icon: '🔈' },
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
        // Slower progress increments
        return prev + (prev < 50 ? 4 : (prev < 80 ? 2 : 1));
      });
    }, 1000);
    
    try {
      const controller = new AbortController();
      // Set a longer timeout for the fetch request
      const fetchTimeoutId = setTimeout(() => controller.abort(), 60000);
      
      // Create a simplified request body
      const requestBody = {
        theme,
        focusSkills: focusSkills.slice(0, 3), // Limit to 3 skills to reduce complexity
        characterNames: characterNames || undefined,
        episodeCount: Math.min(episodeCount, 10), // Allow up to 10 episodes
        gradeLevel: 3,
      };
      
      console.log("Sending request with data:", requestBody);
      
      const response = await fetch('/api/sentence_formation/generate-story/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(fetchTimeoutId);
      clearInterval(progressInterval);
      clearTimeout(warningId);
      setTimeoutId(null);
      
      // Check if the request was aborted
      if (controller.signal.aborted) {
        throw new Error("Request timed out after 60 seconds");
      }
      
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        // If response is JSON, parse it directly
        const data = await response.json();
        
        // Check for error field in the response
        if (data.error) {
          throw new Error(data.error);
        }
        
        // Update progress and generate story
        setGenerationProgress(100);
        
        // Add a slight delay to show 100% completion
        setTimeout(() => {
          if (onStoryGenerated) {
            onStoryGenerated(data);
          }
        }, 500);
        
      } else {
        // If not JSON, get the text and try to parse it
        const textResponse = await response.text();
        console.log("Response text:", textResponse.substring(0, 200) + "...");
        
        try {
          // Try to parse as JSON, handle common issues
          const jsonText = textResponse.trim();
          let data;
          
          if (jsonText.startsWith('{') && jsonText.endsWith('}')) {
            // Valid JSON object
            data = JSON.parse(jsonText);
          } else {
            // Try to extract JSON from the response
            const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              data = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error(`Unable to parse response as JSON`);
            }
          }
          
          // Check for error field in the parsed data
          if (data.error) {
            throw new Error(data.error);
          }
          
          // Update progress and generate story
          setGenerationProgress(100);
          
          // Add a slight delay to show 100% completion
          setTimeout(() => {
            if (onStoryGenerated) {
              onStoryGenerated(data);
            }
          }, 500);
          
        } catch (jsonError) {
          console.error("JSON parse error:", jsonError);
          throw new Error(`Unable to parse response: ${jsonError.message}`);
        }
      }
      
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
  
  // Retry with simpler settings
  const handleRetry = () => {
    // Simplify settings for retry
    const simpleEpisodeCount = Math.max(1, episodeCount - 1);
    const simpleFocusSkills = focusSkills.slice(0, 1); // Just use first skill
    
    setEpisodeCount(simpleEpisodeCount);
    setFocusSkills(simpleFocusSkills);
    
    // Generate with simplified settings
    setTimeout(() => {
      generateStory();
    }, 500);
  };
  
  // Cancel generation and go back
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/games/crossword-puzzle');
    }
  };
  
  return (
    <div className={styles.generatorContainer}>
      <div className={styles.generatorCard}>
        <div className={styles.headerSection}>
          <h1 className={styles.generatorTitle}>Reading Adventures: Crossword Quest</h1>
          <div className={styles.subtitleContainer}>
            <p className={styles.generatorSubtitle}>Set your preferences to generate a custom story with crossword puzzles!</p>
          </div>
        </div>
        
        {isGenerating ? (
          <div className={styles.generatingContent}>
            <div className={styles.progressContainer}>
              <div 
                className={styles.progressBar}
                style={{ width: `${generationProgress}%` }}
              ></div>
            </div>
            <p className={styles.progressText}>
              {generationProgress < 100 
                ? `Creating your adventure (${generationProgress}%)...` 
                : 'Story created successfully!'}
            </p>
            
            {timeoutWarning && generationProgress < 100 && (
              <div className={styles.warningMessage}>
                <p>This is taking longer than expected. Please be patient - AI story generation can take some time.</p>
              </div>
            )}
            
            <div className={styles.generationSteps}>
              <div className={`${styles.stepItem} ${generationProgress >= 20 ? styles.completed : ''}`}>
                <div className={styles.stepIcon}>📝</div>
                <div className={styles.stepText}>Creating story outline</div>
              </div>
              <div className={`${styles.stepItem} ${generationProgress >= 40 ? styles.completed : ''}`}>
                <div className={styles.stepIcon}>📚</div>
                <div className={styles.stepText}>Writing episodes</div>
              </div>
              <div className={`${styles.stepItem} ${generationProgress >= 60 ? styles.completed : ''}`}>
                <div className={styles.stepIcon}>🔤</div>
                <div className={styles.stepText}>Preparing vocabulary</div>
              </div>
              <div className={`${styles.stepItem} ${generationProgress >= 80 ? styles.completed : ''}`}>
                <div className={styles.stepIcon}>🧩</div>
                <div className={styles.stepText}>Building crossword puzzles</div>
              </div>
              <div className={`${styles.stepItem} ${generationProgress >= 100 ? styles.completed : ''}`}>
                <div className={styles.stepIcon}>✅</div>
                <div className={styles.stepText}>Finalizing adventure</div>
              </div>
            </div>
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
                  // Check if this skill can be selected (not already 3 selected)
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
                placeholder="e.g. Sam, Alex, Taylor"
                className={styles.textInput}
              />
            </div>
            
            {/* Episode Count */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Number of Episodes: <span className={styles.optionalHint}>(1-10)</span></label>
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
                  onClick={() => setEpisodeCount(Math.min(10, episodeCount + 1))}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={episodeCount >= 10}
                >
                  +
                </motion.button>
              </div>
              <div className={styles.episodeSlider}>
                <input
                  type="range"
                  min="1"
                  max="10"
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