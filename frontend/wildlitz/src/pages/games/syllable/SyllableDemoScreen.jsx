import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import styles from '../../../styles/games/syllable/SyllableDemoScreen.module.css';
import wildLitzCharacter from '../../../assets/img/wildlitz-idle.png';
import cloudsBackground from '../../../assets/img/backgrounds/clouds.svg';
import mountainsBackground from '../../../assets/img/backgrounds/mountains.svg';
import treesBackground from '../../../assets/img/backgrounds/trees.svg';

const SyllableDemoScreen = ({ word, syllables = [], explanation, onBack, onPlaySound }) => {
  const [selectedSyllable, setSelectedSyllable] = useState('all');
  const [playbackSpeed, setPlaybackSpeed] = useState('normal');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [syllableAudio, setSyllableAudio] = useState({});
  const [mouthAnimation, setMouthAnimation] = useState(false);
  
  // If syllables aren't provided, split the word by hyphens
  const syllableArray = syllables.length > 0 
    ? syllables 
    : (word?.syllable_breakdown?.split('-') || word?.syllables?.split('-') || [word?.word || 'example']);
  
  // Load syllable sounds when component mounts or when word changes
  useEffect(() => {
    if (!word) return;
    
    setIsLoading(true);
    
    // Get the word text, handling different object structures
    const wordText = typeof word === 'string' ? word : word.word;
    
    // Call API to get syllable audio
    axios.post('/api/syllabification/pronounce-word/', {
      word: wordText
    })
    .then(response => {
      if (response.data && response.data.syllables) {
        setSyllableAudio(response.data);
      } else {
        console.warn("No syllable audio data returned");
      }
    })
    .catch(err => {
      console.error("Error loading syllable sounds:", err);
      // If API call fails, we'll fall back to browser speech synthesis
    })
    .finally(() => {
      setIsLoading(false);
    });
  }, [word]);
  
  // Function to play a specific syllable sound
  const playSyllableSound = (syllable) => {
    if (!syllable) return;
    
    setIsPlaying(true);
    setMouthAnimation(true);
    
    // If we have the syllable audio data from the API
    if (syllableAudio.syllables) {
      const syllableData = syllableAudio.syllables.find(s => s.syllable === syllable);
      
      if (syllableData && syllableData.audio && syllableData.audio.audio_data) {
        const audio = new Audio(`data:audio/mp3;base64,${syllableData.audio.audio_data}`);
        audio.playbackRate = playbackSpeed === 'slow' ? 0.7 : 1;
        
        audio.onended = () => {
          setIsPlaying(false);
          setMouthAnimation(false);
        };
        
        audio.play().catch(error => {
          console.error("Failed to play syllable audio:", error);
          useBrowserSpeech(syllable);
        });
        return;
      }
    }
    
    // Fallback: Use browser's speech synthesis
    useBrowserSpeech(syllable);
    
    function useBrowserSpeech(text) {
      if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = playbackSpeed === 'slow' ? 0.5 : 0.8;
        
        utterance.onend = () => {
          setIsPlaying(false);
          setMouthAnimation(false);
        };
        
        utterance.onerror = () => {
          setIsPlaying(false);
          setMouthAnimation(false);
        };
        
        window.speechSynthesis.speak(utterance);
      } else {
        setIsPlaying(false);
        setMouthAnimation(false);
      }
    }
  };
  
  // Function to play the whole word
  const playWordSound = () => {
    setIsPlaying(true);
    setMouthAnimation(true);
    
    if (onPlaySound) {
      onPlaySound();
      // Since we don't control the audio in the parent, set a timeout to stop animation
      setTimeout(() => {
        setIsPlaying(false);
        setMouthAnimation(false);
      }, 1500);
    } else if (syllableAudio.complete_word_audio && syllableAudio.complete_word_audio.audio_data) {
      const audio = new Audio(`data:audio/mp3;base64,${syllableAudio.complete_word_audio.audio_data}`);
      audio.playbackRate = playbackSpeed === 'slow' ? 0.7 : 1;
      
      audio.onended = () => {
        setIsPlaying(false);
        setMouthAnimation(false);
      };
      
      audio.play().catch(error => {
        console.error("Failed to play word audio:", error);
        useBrowserSpeech();
      });
    } else {
      useBrowserSpeech();
    }
    
    function useBrowserSpeech() {
      if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const wordText = typeof word === 'string' ? word : word.word;
        const utterance = new SpeechSynthesisUtterance(wordText);
        utterance.rate = playbackSpeed === 'slow' ? 0.5 : 0.8;
        
        utterance.onend = () => {
          setIsPlaying(false);
          setMouthAnimation(false);
        };
        
        utterance.onerror = () => {
          setIsPlaying(false);
          setMouthAnimation(false);
        };
        
        window.speechSynthesis.speak(utterance);
      } else {
        setIsPlaying(false);
        setMouthAnimation(false);
      }
    }
  };
  
  // Function to get phonetic description based on syllable
  const getPhoneticDescription = (syllable) => {
    if (explanation && explanation.syllables) {
      const syllableInfo = explanation.syllables.find(s => s.syllable === syllable);
      if (syllableInfo) {
        return syllableInfo.pronunciation_guide;
      }
    }
    
    // Default descriptions if we don't have API data
    if (syllable === 'all') {
      return `Say the full word "${word.word || word}" clearly, emphasizing each syllable.`;
    }
    
    return `Pronounce the syllable "${syllable}" by shaping your mouth and focusing on the vowel sound.`;
  };
  
  // Function to get example word with similar sound
  const getSimilarSoundWord = (syllable) => {
    if (explanation && explanation.syllables) {
      const syllableInfo = explanation.syllables.find(s => s.syllable === syllable);
      if (syllableInfo && syllableInfo.similar_sound_word) {
        return syllableInfo.similar_sound_word;
      }
    }
    
    // Default example if none is available
    return 'similar words';
  };
  
  // Function to handle playing the selected syllable or whole word
  const handlePlaySelected = () => {
    if (selectedSyllable === 'all') {
      playWordSound();
    } else {
      playSyllableSound(selectedSyllable);
    }
  };
  
  // Simple function to get vowels in a syllable
  const getVowels = (syllable) => {
    const vowelMatches = syllable.match(/[aeiou]/gi);
    return vowelMatches ? vowelMatches.join('') : 'vowels';
  };
  
  // Mouth position based on syllable
  const getMouthPosition = (syllable) => {
    if (!syllable || syllable === 'all') return { path: "M35,50 Q75,80 115,50", shape: "wide" };
    
    const vowels = getVowels(syllable).toLowerCase();
    
    if (vowels.includes('a')) {
      return { path: "M35,50 Q75,90 115,50", shape: "open" };
    } else if (vowels.includes('e') || vowels.includes('i')) {
      return { path: "M35,50 Q75,60 115,50", shape: "smile" };
    } else if (vowels.includes('o')) {
      return { path: "M35,50 Q75,70 115,50", shape: "round" };
    } else if (vowels.includes('u')) {
      return { path: "M35,50 Q75,65 115,50", shape: "pursed" };
    }
    
    return { path: "M35,50 Q75,70 115,50", shape: "neutral" };
  };
  
  const wordText = typeof word === 'string' ? word : word?.word || 'example';
  const mouthPosition = getMouthPosition(selectedSyllable === 'all' ? null : selectedSyllable);
  
  return (
    <div className={styles.syllableDemoContainer}>
      {/* Background layers */}
      <motion.div 
        className={styles.backgroundLayer}
        style={{ backgroundImage: `url(${cloudsBackground})` }}
        animate={{ backgroundPositionX: [0, -1200] }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />
      <motion.div 
        className={styles.backgroundLayer}
        style={{ backgroundImage: `url(${mountainsBackground})`, backgroundPosition: 'bottom' }}
        animate={{ backgroundPositionX: [0, -1200] }}
        transition={{ duration: 180, repeat: Infinity, ease: "linear" }}
      />
      <motion.div 
        className={styles.backgroundLayer}
        style={{ backgroundImage: `url(${treesBackground})`, backgroundPosition: 'bottom' }}
        animate={{ backgroundPositionX: [0, -1200] }}
        transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
      />
      
      <div className={styles.demoContentWrapper}>
        {/* Character on the left */}
        <div className={styles.demoCharacterColumn}>
          <motion.img 
            src={wildLitzCharacter} 
            alt="WildLitz Character" 
            className={styles.demoCharacter}
            animate={{ 
              y: [0, -10, 0],
              rotate: mouthAnimation ? [0, -5, 5, -5, 0] : 0
            }}
            transition={{ 
              y: { repeat: Infinity, duration: 2, ease: "easeInOut" },
              rotate: { duration: 0.8, repeat: mouthAnimation ? 3 : 0, ease: "easeInOut" }
            }}
          />
          
          <motion.div 
            className={styles.speechBubble}
            initial={{ opacity: 0, scale: 0, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <p>Let's learn how to say each syllable!</p>
          </motion.div>
        </div>
        
        {/* Main demo card */}
        <div className={styles.demoCard}>
          <div className={styles.demoHeader}>
            <h1>Syllable Sound Demonstration</h1>
            <div className={styles.wordDisplay}>
              <h2>{wordText}</h2>
            </div>
          </div>
          
          {/* Syllable Tabs */}
          <div className={styles.syllableTabs}>
            {syllableArray.map((syllable, index) => (
              <motion.button
                key={index}
                className={`${styles.syllableTab} ${selectedSyllable === syllable ? styles.active : ''}`}
                onClick={() => setSelectedSyllable(syllable)}
                whileHover={{ y: -3, boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)" }}
                whileTap={{ y: 0, boxShadow: "0 5px 10px rgba(0, 0, 0, 0.1)" }}
              >
                {syllable}
              </motion.button>
            ))}
            <motion.button
              className={`${styles.syllableTab} ${selectedSyllable === 'all' ? styles.active : ''}`}
              onClick={() => setSelectedSyllable('all')}
              whileHover={{ y: -3, boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)" }}
              whileTap={{ y: 0, boxShadow: "0 5px 10px rgba(0, 0, 0, 0.1)" }}
            >
              Full Word
            </motion.button>
          </div>
          
          {/* Pronunciation Visualization */}
          <div className={styles.pronunciationContainer}>
            {/* Mouth visualization */}
            <div className={styles.mouthVisualization}>
              <h3>Mouth Shape</h3>
              <div className={styles.mouthDiagram}>
                <svg width="150" height="100" viewBox="0 0 150 100">
                  <ellipse cx="75" cy="50" rx="70" ry="40" stroke="#333" strokeWidth="2" fill="#ffebee" />
                  <motion.path 
                    d={mouthPosition.path} 
                    stroke="#d32f2f" 
                    strokeWidth="3" 
                    fill="none"
                    initial={false}
                    animate={{ 
                      d: mouthAnimation 
                        ? [mouthPosition.path, "M35,50 Q75,95 115,50", mouthPosition.path]
                        : mouthPosition.path
                    }}
                    transition={{ 
                      duration: 0.3,
                      repeat: mouthAnimation ? Infinity : 0,
                      repeatType: "reverse"
                    }}
                  />
                </svg>
                <p className={styles.shapeDescription}>Mouth shape: <span>{mouthPosition.shape}</span></p>
              </div>
              
              <motion.button 
                className={styles.playSoundButton}
                onClick={handlePlaySelected}
                disabled={isPlaying || isLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isLoading ? (
                  <span className={styles.loadingIcon}>⏳</span>
                ) : isPlaying ? (
                  <span className={styles.playingIcon}>🔊</span>
                ) : (
                  <span className={styles.playIcon}>▶️</span>
                )}
                {isLoading ? "Loading..." : isPlaying ? "Playing..." : "Play Sound"}
              </motion.button>
              
              <button 
                className={`${styles.speedToggle} ${playbackSpeed === 'slow' ? styles.active : ''}`}
                onClick={() => setPlaybackSpeed(playbackSpeed === 'normal' ? 'slow' : 'normal')}
                disabled={isPlaying || isLoading}
              >
                {playbackSpeed === 'slow' ? 'Normal Speed' : 'Slow Speed'}
              </button>
            </div>
            
            {/* Sound explanation */}
            <div className={styles.soundExplanation}>
              <h3>How to Pronounce</h3>
              <div className={styles.explanationContent}>
                <p className={styles.phoneticGuide}>
                  {getPhoneticDescription(selectedSyllable)}
                </p>
                
                <div className={styles.examples}>
                  {selectedSyllable !== 'all' && (
                    <p>
                      <strong>Similar sound in:</strong> {getSimilarSoundWord(selectedSyllable)}
                    </p>
                  )}
                </div>
                
                {explanation && explanation.full_pronunciation_tip && (
                  <div className={styles.pronunciationTip}>
                    <h4>Pronunciation Tip:</h4>
                    <p>{explanation.full_pronunciation_tip}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Syllable breakdown visualization */}
          <div className={styles.syllableBreakdown}>
            <h3>Syllable Breakdown</h3>
            <div className={styles.breakdownVisualization}>
              {syllableArray.map((syllable, index) => (
                <motion.div 
                  key={index}
                  className={`${styles.syllableUnit} ${selectedSyllable === syllable ? styles.highlighted : ''}`}
                  animate={{ 
                    scale: selectedSyllable === syllable ? 1.1 : 1,
                    backgroundColor: selectedSyllable === syllable ? '#8b5cf6' : '#f5f3ff',
                    color: selectedSyllable === syllable ? '#ffffff' : '#8b5cf6'
                  }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setSelectedSyllable(syllable)}
                >
                  {syllable}
                  <motion.div 
                    className={styles.soundIndicator}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      playSyllableSound(syllable);
                    }}
                  >
                    🔊
                  </motion.div>
                </motion.div>
              ))}
            </div>
            <p className={styles.breakdownTip}>
              Click on each syllable to hear it pronounced separately.
            </p>
          </div>
          
          {/* Control buttons */}
          <div className={styles.demoControls}>
            <motion.button 
              className={styles.backButton}
              onClick={onBack}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Back to Game
            </motion.button>
            
            {syllableArray.length > 1 && selectedSyllable !== 'all' && (
              <div className={styles.navigationControls}>
                <motion.button 
                  className={styles.navButton}
                  onClick={() => {
                    const currentIndex = syllableArray.indexOf(selectedSyllable);
                    if (currentIndex > 0) {
                      setSelectedSyllable(syllableArray[currentIndex - 1]);
                    }
                  }}
                  disabled={syllableArray.indexOf(selectedSyllable) === 0}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Previous
                </motion.button>
                <motion.button 
                  className={styles.navButton}
                  onClick={() => {
                    const currentIndex = syllableArray.indexOf(selectedSyllable);
                    if (currentIndex < syllableArray.length - 1) {
                      setSelectedSyllable(syllableArray[currentIndex + 1]);
                    }
                  }}
                  disabled={syllableArray.indexOf(selectedSyllable) === syllableArray.length - 1}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Next
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyllableDemoScreen;