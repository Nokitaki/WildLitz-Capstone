// src/pages/games/crossword/StoryGeneratorScreen.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  
  // Available themes and skills
  const availableThemes = [
    // Remove jungle and space since they already exist
    { id: 'ocean', name: 'Ocean Discovery' },
    { id: 'farm', name: 'Farm Life' },
    { id: 'city', name: 'City Adventure' }
  ];
  
  const availableSkills = [
    { id: 'sight-words', name: 'Sight Words' },
    { id: 'phonics-sh', name: 'Phonics: SH Sound' },
    { id: 'phonics-ch', name: 'Phonics: CH Sound' },
    { id: 'long-vowels', name: 'Long Vowel Sounds' },
    { id: 'compound-words', name: 'Compound Words' },
    { id: 'action-verbs', name: 'Action Verbs' }
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
    
    // Simulated progress updates - slower to prevent reaching 90% too quickly
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
      
      const response = await fetch('/api/sentence_formation/generate-story/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          theme,
          focusSkills,
          characterNames: characterNames || undefined,
          episodeCount,
          gradeLevel: 3,
          refresh: true  // This flag forces new content generation
        }),
        signal: controller.signal
      });
      
      clearTimeout(fetchTimeoutId);
      clearInterval(progressInterval);
      clearTimeout(warningId);
      setTimeoutId(null);
      
      // Even if we get a 500 error, try to parse the response JSON
      let data;
      let errorMessage = null;
      
      try {
        const textResponse = await response.text();
        console.log("Response text:", textResponse.substring(0, 200) + "...");
        
        // Try to parse as JSON, if it fails, handle the error gracefully
        try {
          data = JSON.parse(textResponse);
          
          if (!response.ok) {
            errorMessage = data.message || `Server error: ${response.status}`;
            throw new Error(errorMessage);
          }
        } catch (jsonError) {
          console.error("JSON parse error:", jsonError);
          
          if (!response.ok) {
            throw new Error(`Server error (${response.status}): Unable to parse response`);
          }
          
          // If we can't parse JSON but the response was OK, something's really wrong
          throw new Error("Failed to parse server response");
        }
      } catch (responseError) {
        console.error("Response processing error:", responseError);
        throw responseError;
      }
      
      // If we got here, we have valid data
      setGenerationProgress(100);
      
      // Add a slight delay to show 100% completion
      setTimeout(() => {
        if (onStoryGenerated) {
          onStoryGenerated(data);
        }
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
        <h1 className={styles.generatorTitle}>Create a New Story Adventure</h1>
        <p className={styles.generatorSubtitle}>Set your preferences to generate a custom story with crossword puzzles!</p>
        
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
              <div className={styles.themeOptions}>
                {availableThemes.map(themeOption => (
                  <div 
                    key={themeOption.id}
                    className={`${styles.themeOption} ${theme === themeOption.id ? styles.selected : ''}`}
                    onClick={() => setTheme(themeOption.id)}
                  >
                    <div className={`${styles.themeIcon} ${styles[themeOption.id + 'Icon']}`}></div>
                    <span>{themeOption.name}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Skill Focus */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Focus Skills:</label>
              <div className={styles.skillsOptions}>
                {availableSkills.map(skill => (
                  <div 
                    key={skill.id}
                    className={`${styles.skillOption} ${focusSkills.includes(skill.id) ? styles.selected : ''}`}
                    onClick={() => handleSkillToggle(skill.id)}
                  >
                    <div className={styles.skillCheckbox}>
                      {focusSkills.includes(skill.id) && <span>✓</span>}
                    </div>
                    <span>{skill.name}</span>
                  </div>
                ))}
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
              <label className={styles.formLabel}>Number of Episodes:</label>
              <div className={styles.episodeCountWrapper}>
                <button 
                  type="button"
                  className={styles.countButton}
                  onClick={() => setEpisodeCount(Math.max(1, episodeCount - 1))}
                >
                  -
                </button>
                <div className={styles.episodeCount}>{episodeCount}</div>
                <button 
                  type="button"
                  className={styles.countButton}
                  onClick={() => setEpisodeCount(Math.min(5, episodeCount + 1))}
                >
                  +
                </button>
              </div>
            </div>
            
            {/* Action Buttons */}
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