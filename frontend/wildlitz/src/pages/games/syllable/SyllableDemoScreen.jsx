import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../../../styles/games/syllable/SyllableDemoScreen.module.css';
import wildLitzCharacter from '../../../assets/img/wildlitz-idle.png';

const SyllableDemoScreen = ({ word, syllables = [], explanation, onBack, onPlaySound }) => {
  const [selectedSyllable, setSelectedSyllable] = useState('all');
  const [playbackSpeed, setPlaybackSpeed] = useState('normal');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [syllableAudio, setSyllableAudio] = useState({});
  
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
    
    // If we have the syllable audio data from the API
    if (syllableAudio.syllables) {
      const syllableData = syllableAudio.syllables.find(s => s.syllable === syllable);
      
      if (syllableData && syllableData.audio && syllableData.audio.audio_data) {
        const audio = new Audio(`data:audio/mp3;base64,${syllableData.audio.audio_data}`);
        audio.playbackRate = playbackSpeed === 'slow' ? 0.7 : 1;
        
        audio.onended = () => {
          setIsPlaying(false);
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
        };
        
        utterance.onerror = () => {
          setIsPlaying(false);
        };
        
        window.speechSynthesis.speak(utterance);
      } else {
        setIsPlaying(false);
      }
    }
  };
  
  // Function to play the whole word
  const playWordSound = () => {
    setIsPlaying(true);
    
    if (onPlaySound) {
      onPlaySound();
      // Since we don't control the audio in the parent, set a timeout to stop animation
      setTimeout(() => {
        setIsPlaying(false);
      }, 1500);
    } else if (syllableAudio.complete_word_audio && syllableAudio.complete_word_audio.audio_data) {
      const audio = new Audio(`data:audio/mp3;base64,${syllableAudio.complete_word_audio.audio_data}`);
      audio.playbackRate = playbackSpeed === 'slow' ? 0.7 : 1;
      
      audio.onended = () => {
        setIsPlaying(false);
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
        };
        
        utterance.onerror = () => {
          setIsPlaying(false);
        };
        
        window.speechSynthesis.speak(utterance);
      } else {
        setIsPlaying(false);
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
  
  const wordText = typeof word === 'string' ? word : word?.word || 'example';
  
  return (
    <div className={styles.syllableDemoContainer}>
      <div className={styles.demoContentWrapper}>
        {/* Character on the left */}
        <div className={styles.demoCharacterColumn}>
          <img 
            src={wildLitzCharacter} 
            alt="WildLitz Character" 
            className={styles.demoCharacter}
          />
          
          <div className={styles.speechBubble}>
            <p>Let's learn how to say each syllable!</p>
          </div>
        </div>
        
        {/* Main demo card */}
        <div className={styles.demoCard}>
          <div className={styles.demoHeader}>
            <h1>Syllable Sound Demonstration</h1>
          </div>
          
          {/* Syllable breakdown visualization - now at the top */}
          <div className={styles.syllableBreakdown}>
            <h3>Syllable Breakdown</h3>
            <div className={styles.breakdownVisualization}>
              {syllableArray.map((syllable, index) => (
                <div 
                  key={index}
                  className={`${styles.syllableUnit} ${selectedSyllable === syllable ? styles.highlighted : ''}`}
                  onClick={() => setSelectedSyllable(syllable)}
                >
                  {syllable}
                  <div 
                    className={styles.soundIndicator}
                    onClick={(e) => {
                      e.stopPropagation();
                      playSyllableSound(syllable);
                    }}
                  >
                    🔊
                  </div>
                </div>
              ))}
              <button
                className={`${styles.fullWordButton} ${selectedSyllable === 'all' ? styles.active : ''}`}
                onClick={() => setSelectedSyllable('all')}
              >
                Full Word
              </button>
            </div>
            <p className={styles.breakdownTip}>
              Click on a syllable to select it or use the "Full Word" button for the entire word.
            </p>
          </div>
          
          {/* Pronunciation Section */}
          <div className={styles.pronunciationContainer}>
            {/* Sound player section */}
            <div className={styles.soundPlayerSection}>
              <h3>{selectedSyllable === 'all' ? 'Listen to Full Word' : `Listen to "${selectedSyllable}"`}</h3>
              <div className={styles.playerControls}>
                <button 
                  className={styles.playSoundButton}
                  onClick={handlePlaySelected}
                  disabled={isPlaying || isLoading}
                >
                  {isLoading ? (
                    <span className={styles.loadingIcon}>⏳</span>
                  ) : isPlaying ? (
                    <span className={styles.playingIcon}>🔊</span>
                  ) : (
                    <span className={styles.playIcon}>▶️</span>
                  )}
                  {isLoading ? "Loading..." : isPlaying ? "Playing..." : "Play Sound"}
                </button>
                
                <button 
                  className={`${styles.speedToggle} ${playbackSpeed === 'slow' ? styles.active : ''}`}
                  onClick={() => setPlaybackSpeed(playbackSpeed === 'normal' ? 'slow' : 'normal')}
                  disabled={isPlaying || isLoading}
                >
                  {playbackSpeed === 'slow' ? 'Normal Speed' : 'Slow Speed'}
                </button>
              </div>
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
          
          {/* Navigation buttons with Back to Game button positioned on the right */}
          <div className={styles.navigationContainer}>
            {syllableArray.length > 1 && selectedSyllable !== 'all' ? (
              <div className={styles.syllableNavigation}>
                <button 
                  className={styles.navButton}
                  onClick={() => {
                    const currentIndex = syllableArray.indexOf(selectedSyllable);
                    if (currentIndex > 0) {
                      setSelectedSyllable(syllableArray[currentIndex - 1]);
                    }
                  }}
                  disabled={syllableArray.indexOf(selectedSyllable) === 0}
                >
                  Previous Syllable
                </button>
                <button 
                  className={styles.navButton}
                  onClick={() => {
                    const currentIndex = syllableArray.indexOf(selectedSyllable);
                    if (currentIndex < syllableArray.length - 1) {
                      setSelectedSyllable(syllableArray[currentIndex + 1]);
                    }
                  }}
                  disabled={syllableArray.indexOf(selectedSyllable) === syllableArray.length - 1}
                >
                  Next Syllable
                </button>
              </div>
            ) : (
              <div className={styles.emptyNavSpace}></div>
            )}
            
            {/* Back to Game button positioned on the right */}
            <button 
              className={styles.backButton}
              onClick={onBack}
            >
              Back to Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyllableDemoScreen;