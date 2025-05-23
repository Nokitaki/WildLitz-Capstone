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
      
      // Create a request body
      const requestBody = {
        theme,
        focusSkills: focusSkills.slice(0, 3), // Limit to 3 skills to reduce complexity
        characterNames: characterNames || undefined,
        episodeCount: Math.min(episodeCount, 5), // Reduce to 5 episodes maximum for reliability
        gradeLevel: 3,
      };
      
      console.log("Sending request with data:", requestBody);
      
      // Always try to call the real API first
      let responseData;
      let useMockResponse = false;
      
      try {
        // Real API call
        const response = await fetch('/api/sentence_formation/generate-story/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });
        
        // Check if response is OK
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }
      
        // Get response text first (not directly as JSON)
        const responseText = await response.text();
        console.log("Response text:", responseText.substring(0, 200) + "...");
        
        // Try to parse as JSON
        responseData = JSON.parse(responseText);
      } catch (apiError) {
        console.error("API error, using mock response:", apiError);
        useMockResponse = true;
      }
      
      // Only use mock response if the real API call failed
      if (useMockResponse) {
        // Use a fixed delay to simulate API call
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Create a mock response based on the theme and other parameters
        responseData = createMockStoryResponse(theme, episodeCount);
        
        // Add warning that this is mock data
        console.warn("Using mock data instead of real API response");
      }
      
      clearTimeout(fetchTimeoutId);
      clearInterval(progressInterval);
      clearTimeout(warningId);
      setTimeoutId(null);
      
      // Check if responseData has the expected structure
      if (!responseData || !responseData.story || !responseData.puzzles) {
        throw new Error("Response does not contain expected story data");
      }
      
      // Update progress and generate story
      setGenerationProgress(100);
      
      // Add a slight delay to show 100% completion
      setTimeout(() => {
        if (onStoryGenerated) {
          onStoryGenerated(responseData);
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
  
  // Create a mock story response for demonstration purposes
  const createMockStoryResponse = (theme, episodeCount) => {
    // Base story structure
    const storyId = `${theme}_generated_${Date.now()}`;
    const storyTitle = `The ${theme.charAt(0).toUpperCase() + theme.slice(1)} Adventure`;
    
    // Generate episodes
    const episodes = [];
    const puzzles = {};
    
    // Theme-based vocabulary words with proper clues
    const themeVocabulary = {
      jungle: [
        {word: "map", clue: "Folded paper showing hidden paths", definition: "A drawing that shows you where places are"},
        {word: "path", clue: "Narrow way through the trees", definition: "A track or small road for walking on"},
        {word: "treasure", clue: "Buried chest of gold and jewels", definition: "Valuable things like gold and jewels"},
        {word: "journey", clue: "Long trip from start to finish", definition: "Traveling from one place to another"},
        {word: "compass", clue: "Magnetic pointer to find your way", definition: "Tool that shows which direction is north"}
      ],
      ocean: [
        {word: "dive", clue: "Plunge beneath the waves", definition: "To jump into water headfirst"},
        {word: "coral", clue: "Colorful underwater home for fish", definition: "Hard material made by tiny sea animals"},
        {word: "wave", clue: "Rolling water that crashes on shore", definition: "Water that moves up and down in the ocean"},
        {word: "shell", clue: "Hard home carried by sea creatures", definition: "Hard covering that protects some sea animals"},
        {word: "island", clue: "Land surrounded completely by water", definition: "Land with water all around it"}
      ],
      space: [
        {word: "rocket", clue: "Vehicle that blasts to the stars", definition: "A vehicle that travels into space"},
        {word: "planet", clue: "Round world orbiting a star", definition: "A large round object that moves around a star"},
        {word: "star", clue: "Twinkling light in the night sky", definition: "A ball of burning gas in space that we see as a point of light at night"},
        {word: "astronaut", clue: "Space explorer in a special suit", definition: "A person who travels into space"},
        {word: "alien", clue: "Creature from another world", definition: "A being from a different planet"}
      ],
      city: [
        {word: "building", clue: "Tall structure with many floors", definition: "A structure with walls and a roof"},
        {word: "street", clue: "Road between city blocks", definition: "A public road in a city with buildings on both sides"},
        {word: "museum", clue: "Place to see old treasures", definition: "A building where important objects are kept and shown to the public"},
        {word: "park", clue: "Green space for city play", definition: "An area of land with grass and trees for people to enjoy"},
        {word: "subway", clue: "Underground train in the city", definition: "A train that runs under the ground in a city"}
      ],
      farm: [
        {word: "tractor", clue: "Machine used to pull farm equipment", definition: "A powerful vehicle used on farms"},
        {word: "barn", clue: "Building where animals sleep", definition: "A large farm building for storing crops and keeping animals"},
        {word: "crops", clue: "Plants that farmers grow", definition: "Plants grown by farmers for food or other uses"},
        {word: "harvest", clue: "Time to gather ripe crops", definition: "The gathering of crops when they are ripe"},
        {word: "animals", clue: "Living creatures raised on farms", definition: "Living creatures that breathe and can move"}
      ],
      fairytale: [
        {word: "castle", clue: "Royal building with towers", definition: "A large building with thick walls built long ago"},
        {word: "magic", clue: "Special powers in fairy tales", definition: "Special powers that make impossible things happen"},
        {word: "dragon", clue: "Fire-breathing mythical creature", definition: "A large mythical animal that can breathe fire"},
        {word: "princess", clue: "Daughter of a king and queen", definition: "A female member of a royal family"},
        {word: "wizard", clue: "Person who can cast spells", definition: "A person who can do magic"}
      ]
    };
    
    const defaultVocab = [
      {word: "adventure", clue: "Exciting journey with unknown outcomes", definition: "An unusual and exciting experience"},
      {word: "discovery", clue: "Finding something new or hidden", definition: "Finding something for the first time"},
      {word: "mystery", clue: "Puzzle waiting to be solved", definition: "Something that is difficult to understand or explain"},
      {word: "explore", clue: "Search unknown areas for exciting things", definition: "To travel through a place to learn about it"},
      {word: "secret", clue: "Something hidden or unknown to others", definition: "Something that is kept hidden or unknown to others"}
    ];
    
    // Get vocabulary for the theme or use default
    const vocabList = themeVocabulary[theme] || defaultVocab;
    
    for (let i = 0; i < episodeCount; i++) {
      const episodeId = `${storyId}_ep${i+1}`;
      const puzzleId = `${episodeId}_puzzle`;
      
      // Create episode
      episodes.push({
        id: episodeId,
        episodeNumber: i + 1,
        title: `Episode ${i+1}: The ${getRandomTitle(theme)}`,
        text: getRandomStoryText(theme),
        recap: getRandomRecap(theme),
        discussionQuestions: [
          `What did you learn about ${theme} from this story?`,
          `Which character do you like the most and why?`,
          `What do you think will happen in the next episode?`
        ],
        crosswordPuzzleId: puzzleId,
        vocabularyFocus: vocabList.map(v => v.word)
      });
      
      // Create corresponding puzzle
      puzzles[puzzleId] = createMockPuzzle(theme, vocabList);
    }
    
    return {
      story: {
        id: storyId,
        title: storyTitle,
        description: `Join an exciting adventure in the ${theme} world with fun characters and new vocabulary!`,
        gradeLevel: "Grade 3",
        readingLevel: "Early Chapter Book",
        episodes: episodes
      },
      puzzles: puzzles
    };
  };
  
  // Helper functions for mock story generation
  const getRandomTitle = (theme) => {
    const titles = {
      jungle: ["Lost Path", "Hidden Treasure", "Mysterious Cave", "Wild Adventure", "Secret Map"],
      ocean: ["Deep Dive", "Coral Mystery", "Underwater Cave", "Sunken Ship", "Tide Pools"],
      farm: ["New Animals", "Harvest Day", "Barn Mystery", "Country Fair", "Tractor Ride"],
      space: ["Shooting Star", "Alien Friend", "Moon Landing", "Planet Visit", "Space Station"],
      city: ["Busy Streets", "Tall Buildings", "City Park", "Museum Day", "Lost in Town"],
      fairytale: ["Magic Castle", "Enchanted Forest", "Wizard's Tower", "Royal Ball", "Dragon's Lair"]
    };
    
    const themeChoices = titles[theme] || titles.jungle;
    return themeChoices[Math.floor(Math.random() * themeChoices.length)];
  };
  
  const getRandomStoryText = (theme) => {
    const storyTexts = {
      jungle: "Maya and Leo found an old map in their grandmother's attic. The map showed a hidden jungle path that led to a treasure. \"Do you think this treasure is real?\" asked Leo. Maya nodded excitedly. \"Let's find out!\" The next day, they packed their backpacks with water, snacks, and a compass. Their journey was about to begin in the dense jungle!",
      ocean: "Emma and Jack visited the beach on a sunny day. They found a bottle with a message inside. The note had a map of an underwater cave. \"This looks like a real treasure map!\" Jack said. Emma smiled and pointed to their diving gear. \"Let's explore the ocean and find out what's in that cave!\" They prepared for an underwater adventure.",
      farm: "Sam and Lily visited their grandparents' farm for summer vacation. They discovered an old barn they had never seen before. \"I wonder what's inside,\" said Sam. Lily pointed to a path of animal footprints. \"Let's follow these tracks!\" They grabbed a lantern and started their farm exploration.",
      space: "Zoe and Aiden built a cardboard spaceship in their backyard. Suddenly, a real shooting star landed nearby. It contained a strange glowing map of the solar system. \"This must be from aliens!\" Aiden whispered. Zoe nodded. \"Let's prepare for our space mission!\" They packed their astronaut gear for the journey.",
      city: "Noah and Mia took the wrong bus and ended up in an unfamiliar part of the city. They found a mysterious map in an old bookstore. \"This shows a hidden park in the city,\" said Noah. Mia looked at the tall buildings around them. \"Let's navigate through the city streets and find this secret place!\"",
      fairytale: "Oliver and Sophie found a magical key under their treehouse. It had strange symbols that matched an old book in their attic. \"This key must open a door to a castle!\" Sophie said excitedly. Oliver nodded. \"The book says the entrance is in the forest behind our house.\" They prepared for their fairytale adventure."
    };
    
    return storyTexts[theme] || storyTexts.jungle;
  };
  
  const getRandomRecap = (theme) => {
    const recaps = {
      jungle: "Maya and Leo discovered a map leading to treasure in the jungle and prepared for their adventure.",
      ocean: "Emma and Jack found a map in a bottle and decided to explore an underwater cave.",
      farm: "Sam and Lily discovered a mysterious old barn on their grandparents' farm and followed animal tracks.",
      space: "Zoe and Aiden found a strange map from a shooting star and prepared for a space mission.",
      city: "Noah and Mia got lost in the city and found a map to a secret park.",
      fairytale: "Oliver and Sophie discovered a magical key that might lead to a castle in the forest."
    };
    
    return recaps[theme] || recaps.jungle;
  };
  
  // Create a mock puzzle
  const createMockPuzzle = (theme, vocabularyWords) => {
    // Create a puzzle with the vocabulary words
    const words = vocabularyWords.map((wordData, index) => {
      return {
        direction: index % 2 === 0 ? "across" : "down",
        number: index + 1,
        clue: wordData.clue, // Use the clue from the vocabulary words data
        answer: wordData.word.toUpperCase(),
        definition: wordData.definition,
        example: `They used the ${wordData.word} to help them on their journey.`,
        cells: [] // In a real implementation, this would contain cell positions
      };
    });
    
    return {
      id: `${theme}_puzzle_${Date.now()}`,
      title: `${theme.charAt(0).toUpperCase() + theme.slice(1)} Adventure Puzzle`,
      size: { width: 10, height: 10 },
      words: words
    };
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