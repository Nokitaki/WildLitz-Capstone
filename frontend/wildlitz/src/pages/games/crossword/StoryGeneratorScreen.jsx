// src/pages/games/crossword/StoryGeneratorScreen.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import styles from '../../../styles/games/crossword/StoryGeneratorScreen.module.css';

const StoryGeneratorScreen = ({ onStoryGenerated }) => {
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
  
  // Generate story with AI
  const generateStory = async (e) => {
  e.preventDefault();
  setIsGenerating(true);
  setGenerationProgress(0);
  setError(null);
  
  // Simulated progress updates
  const progressInterval = setInterval(() => {
    setGenerationProgress(prev => {
      if (prev >= 90) {
        clearInterval(progressInterval);
        return 90;
      }
      return prev + 10;
    });
  }, 1000);
  
  try {
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
      })
    });
    
    clearInterval(progressInterval);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate story');
    }
    
    const data = await response.json();
    setGenerationProgress(100);
    
    // Add a slight delay to show 100% completion
    setTimeout(() => {
      if (onStoryGenerated) {
        onStoryGenerated(data);
      }
    }, 500);
    
  } catch (err) {
    clearInterval(progressInterval);
    setError(err.message || 'An error occurred while generating the story');
    setIsGenerating(false);
    console.error('Error generating story:', err);
  }
};
  
  // Cancel generation and go back
  const handleCancel = () => {
    navigate('/games/crossword-puzzle');
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
                <button 
                  className={styles.retryButton}
                  onClick={() => generateStory}
                >
                  Try Again
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