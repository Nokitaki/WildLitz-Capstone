import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import styles from '../../../styles/SyllableDemoScreen.module.css'; // Assuming you have a CSS module for styles

const SyllableDemoScreen = ({ word, syllables, explanation, onBack, onPlaySound }) => {
  const [selectedSyllable, setSelectedSyllable] = useState('all');
  const [playbackSpeed, setPlaybackSpeed] = useState('normal');
  const [isLoading, setIsLoading] = useState(false);
  const [syllableAudio, setSyllableAudio] = useState({});
  
  // Load syllable sounds when component mounts or when word changes
  useEffect(() => {
    if (!word || syllables.length === 0) return;
    
    setIsLoading(true);
    
    // Call API without awaiting
    axios.post('/api/syllabification/pronounce-word/', {
      word: word
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
  }, [word, syllables]);
  
  // Function to play a specific syllable sound
  const playSyllableSound = (syllable) => {
    // If we have the syllable audio data from the API
    if (syllableAudio.syllables) {
      const syllableData = syllableAudio.syllables.find(s => s.syllable === syllable);
      
      if (syllableData && syllableData.audio && syllableData.audio.audio_url) {
        const audio = new Audio(syllableData.audio.audio_url);
        audio.playbackRate = playbackSpeed === 'slow' ? 0.7 : 1;
        audio.play();
        return;
      }
    }
    
    // Fallback: Use browser's speech synthesis
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(syllable);
      utterance.rate = playbackSpeed === 'slow' ? 0.5 : 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };
  
  // Function to play the whole word
  const playWordSound = () => {
    if (onPlaySound) {
      onPlaySound();
    } else if (syllableAudio.complete_word_audio && syllableAudio.complete_word_audio.audio_url) {
      const audio = new Audio(syllableAudio.complete_word_audio.audio_url);
      audio.playbackRate = playbackSpeed === 'slow' ? 0.7 : 1;
      audio.play();
    } else if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = playbackSpeed === 'slow' ? 0.5 : 0.8;
      window.speechSynthesis.speak(utterance);
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
    return 'Pronounce the syllable clearly, focusing on each sound.';
  };
  
  // Function to handle playing the selected syllable or whole word
  const handlePlaySelected = () => {
    if (selectedSyllable === 'all') {
      playWordSound();
    } else {
      playSyllableSound(selectedSyllable);
    }
  };
  
  return (
    <div className={styles.container}>
      <div className={styles.demoContent}>
        <div className={styles.demoCard}>
          <div className={styles.header}>
            <h1>WildLitz - Syllable Sound Demonstration</h1>
            <div className={styles.wordBadge}>
              Word: <span className={styles.wordHighlight}>{word}</span>
            </div>
          </div>
          
          <h2 className={styles.demoTitle}>Listen and Watch Each Syllable</h2>
          
          <div className={styles.syllableButtons}>
            {syllables.map((syllable, index) => (
              <button 
                key={index}
                className={`${styles.syllableButton} ${selectedSyllable === syllable ? styles.active : ''}`}
                onClick={() => setSelectedSyllable(syllable)}
                disabled={isLoading}
              >
                {syllable}
              </button>
            ))}
            <button 
              className={`${styles.syllableButton} ${selectedSyllable === 'all' ? styles.active : ''}`}
              onClick={() => setSelectedSyllable('all')}
              disabled={isLoading}
            >
              Full Word
            </button>
          </div>
          
          <div className={styles.demoDisplay}>
            <motion.button 
              className={styles.playButton}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handlePlaySelected}
              disabled={isLoading}
            >
              {isLoading ? (
                <span role="img" aria-label="Loading">⏳</span>
              ) : (
                <span role="img" aria-label="Play">▶️</span>
              )}
            </motion.button>
            
            <div className={styles.phoneticDisplay}>
              <div className={styles.soundLabel}>
                {selectedSyllable === 'all' ? 
                  `Word: "${word}"` : 
                  `Syllable: "${selectedSyllable}"`
                }
              </div>
              
              <div className={styles.mouthDiagram}>
                <svg width="150" height="100" viewBox="0 0 150 100">
                  <ellipse cx="75" cy="50" rx="70" ry="40" stroke="#333" strokeWidth="2" fill="none" />
                  <path d="M30,50 Q75,80 120,50" stroke="#f00" strokeWidth="2" fill="none" />
                </svg>
                <p className={styles.diagramLabel}>{getPhoneticDescription(selectedSyllable === 'all' ? word : selectedSyllable)}</p>
              </div>
              
              <button 
                className={`${styles.speedButton} ${playbackSpeed === 'slow' ? styles.active : ''}`}
                onClick={() => setPlaybackSpeed(playbackSpeed === 'slow' ? 'normal' : 'slow')}
                disabled={isLoading}
              >
                {playbackSpeed === 'slow' ? 'Normal Speed' : 'Slow Speed'}
              </button>
            </div>
          </div>
          
          <div className={styles.practiceSection}>
            <h3>Practice with this sound:</h3>
            <p>
              Try saying the {selectedSyllable === 'all' ? 'word' : 'syllable'} slowly, then at normal speed. 
              Pay attention to the shape of your mouth and the position of your tongue.
            </p>
            
            {explanation && explanation.full_pronunciation_tip && (
              <div className={styles.pronunciationTip}>
                <h4>Pronunciation Tip:</h4>
                <p>{explanation.full_pronunciation_tip}</p>
              </div>
            )}
          </div>
          
          <div className={styles.demoControls}>
            <button 
              className={`${styles.controlButton} ${styles.backButton}`}
              onClick={onBack}
              disabled={isLoading}
            >
              Back to Game
            </button>
            {syllables.length > 1 && (
              <button 
                className={`${styles.controlButton} ${styles.nextButton}`}
                onClick={() => {
                  const currentIndex = syllables.indexOf(selectedSyllable);
                  if (currentIndex === -1 || currentIndex === syllables.length - 1) {
                    setSelectedSyllable(syllables[0]);
                  } else {
                    setSelectedSyllable(syllables[currentIndex + 1]);
                  }
                }}
                disabled={isLoading || selectedSyllable === 'all'}
              >
                Next Syllable
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyllableDemoScreen;