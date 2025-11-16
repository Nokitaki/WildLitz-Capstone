// ClapRhythmTimer.jsx
// Traffic light + clapping hands animation for rhythm practice
// No syllable count hints - just timing!

import React, { useState, useEffect } from 'react';
import styles from '../../../styles/games/syllable/ClapRhythmTimer.module.css';

const ClapRhythmTimer = ({ 
  isActive = false,
  interval = 1000, // milliseconds per cycle
  onBeat // callback when it's time to clap
}) => {
  const [phase, setPhase] = useState('red'); // red, yellow, green
  const [isClapping, setIsClapping] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setPhase('red');
      setIsClapping(false);
      return;
    }

    let timeoutId;
    const cyclePhases = () => {
      // Red phase - Wait (40% of cycle)
      setPhase('red');
      setIsClapping(false);
      
      setTimeout(() => {
        // Yellow phase - Get ready (20% of cycle)
        setPhase('yellow');
        
        setTimeout(() => {
          // Green phase - CLAP! (40% of cycle)
          setPhase('green');
          setIsClapping(true);
          
          // Trigger clap callback
          if (onBeat) {
            onBeat();
          }
          
          // After green, loop back to red
          timeoutId = setTimeout(cyclePhases, interval * 0.4);
        }, interval * 0.2);
      }, interval * 0.4);
    };

    cyclePhases();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isActive, interval, onBeat]);

  return (
    <div className={styles.rhythmContainer}>
      {/* Traffic Light */}
      <div className={styles.trafficLight}>
        <div className={styles.lightBox}>
          <div className={`${styles.light} ${styles.redLight} ${
            phase === 'red' ? styles.active : ''
          }`}>
            {phase === 'red' && <span className={styles.lightLabel}>Wait</span>}
          </div>
          <div className={`${styles.light} ${styles.yellowLight} ${
            phase === 'yellow' ? styles.active : ''
          }`}>
            {phase === 'yellow' && <span className={styles.lightLabel}>Ready</span>}
          </div>
          <div className={`${styles.light} ${styles.greenLight} ${
            phase === 'green' ? styles.active : ''
          }`}>
            {phase === 'green' && <span className={styles.lightLabel}>CLAP!</span>}
          </div>
        </div>
      </div>

      {/* Clapping Hands Animation */}
      <div className={styles.handsContainer}>
        <div className={`${styles.hands} ${isClapping ? styles.clapping : ''}`}>
          <div className={styles.leftHand}>
            <span className={styles.handEmoji}>👋</span>
          </div>
          <div className={styles.rightHand}>
            <span className={styles.handEmoji}>👋</span>
          </div>
        </div>
        
        {/* Clap effect */}
        {isClapping && (
          <div className={styles.clapEffect}>
            <span className={styles.clapBurst}>💥</span>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className={styles.instructions}>
        {isActive ? (
          <>
            <span className={styles.emoji}>🎵</span>
            <span>Clap when the light turns green!</span>
          </>
        ) : (
          <>
            <span className={styles.emoji}>⏰</span>
            <span>Press start to begin rhythm practice</span>
          </>
        )}
      </div>
    </div>
  );
};

export default ClapRhythmTimer;