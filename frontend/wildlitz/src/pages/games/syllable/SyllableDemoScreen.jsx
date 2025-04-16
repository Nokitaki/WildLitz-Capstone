import React, { useState } from 'react';
import styles from '../../../styles/games/syllable/SyllableDemoScreen.module.css';

const SyllableDemoScreen = ({ word, onBack }) => {
  // Demo data (static for design purposes)
  const [currentWord] = useState({
    word: "butterfly",
    syllables: ["but", "ter", "fly"],
    count: 3
  });
  
  const [selectedSyllable, setSelectedSyllable] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Handle play button (design only)
  const handlePlay = () => {
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), 1000); // Simulate playing
  };


  return (
    <div className={styles.container}>
      <div className={styles.demoCard}>
        <div className={styles.header}>
          <h1>Syllable Demonstration</h1>
          <div className={styles.wordDisplay}>
            <h2>{currentWord.word}</h2>
          </div>
        </div>
        
        <div className={styles.demoContent}>
          <div className={styles.syllableTabs}>
            {currentWord.syllables.map((syllable, index) => (
              <button
                key={index}
                className={`${styles.syllableTab} ${selectedSyllable === index ? styles.active : ''}`}
                onClick={() => setSelectedSyllable(index)}
              >
                {syllable}
              </button>
            ))}
            <button
              className={`${styles.syllableTab} ${selectedSyllable === currentWord.syllables.length ? styles.active : ''}`}
              onClick={() => setSelectedSyllable(currentWord.syllables.length)}
            >
              Full Word
            </button>
          </div>
          
          <div className={styles.demoVisualization}>
            <div className={styles.animationContainer}>
              {selectedSyllable === currentWord.syllables.length ? (
                <div className={styles.fullWordAnimation}>
                  {currentWord.syllables.map((syllable, index) => (
                    <div key={index} className={styles.syllableVisual}>
                      {syllable}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.singleSyllableAnimation}>
                  <div className={`${styles.syllableVisual} ${styles.large}`}>
                    {currentWord.syllables[selectedSyllable]}
                  </div>
                </div>
              )}
            </div>
            
            <button 
              className={`${styles.playButton} ${isPlaying ? styles.playing : ''}`}
              onClick={handlePlay}
              disabled={isPlaying}
            >
              {isPlaying ? (
                <span className={styles.playingIcon}>🔊</span>
              ) : (
                <span className={styles.playIcon}>▶️</span>
              )}
            </button>
          </div>
          
          <div className={styles.pronunciationGuide}>
            <h3>Pronunciation Guide</h3>
            <div className={styles.guideContent}>
              {selectedSyllable === currentWord.syllables.length ? (
                <p>
                  Say the full word by combining all syllables smoothly: 
                  <span className={styles.emphasisText}>{currentWord.syllables.join('-')}</span>
                </p>
              ) : (
                <p>
                  Say <span className={styles.emphasisText}>{currentWord.syllables[selectedSyllable]}</span> 
                  by shaping your mouth as shown and making a clear sound.
                </p>
              )}
            </div>
          </div>
          
          <div className={styles.mouthShape}>
            <div className={styles.mouthContainer}>
              <div className={`${styles.mouth} ${isPlaying ? styles.speaking : ''}`}></div>
            </div>
            <p>Watch how the mouth moves when saying this sound</p>
          </div>
        </div>
        
        <div className={styles.actionButtons}>
          <button 
            className={styles.backButton}
            onClick={onBack}
          >
            Back to Game
          </button>
          
          <div className={styles.navigationButtons}>
            <button 
              className={styles.navButton}
              disabled={selectedSyllable === 0}
              onClick={() => setSelectedSyllable(current => Math.max(0, current - 1))}
            >
              Previous
            </button>
            <button 
              className={styles.navButton}
              disabled={selectedSyllable === currentWord.syllables.length}
              onClick={() => setSelectedSyllable(current => Math.min(currentWord.syllables.length, current + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


export default SyllableDemoScreen;