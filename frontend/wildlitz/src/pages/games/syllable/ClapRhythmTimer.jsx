// ClapRhythmTimer.jsx - UPDATED WITH FIXED TIMING
// Green light pauses for 2 seconds, no speed control
import React, { useState, useEffect } from 'react';
import styles from '../../../styles/games/syllable/ClapRhythmTimer.module.css';

const ClapRhythmTimer = ({ 
  isActive = false,
  onBeat
}) => {
  const [phase, setPhase] = useState('red');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setPhase('red');
      setProgress(0);
      return;
    }

    let animationFrame;
    let startTime = Date.now();
    let hasTriggeredBeat = false;

    // Fixed timing:
    const RED_DURATION = 1000;    // 1 second - Wait
    const YELLOW_DURATION = 500;  // 0.5 seconds - Get ready
    const GREEN_DURATION = 2000;  // 2 SECONDS - CLAP! (paused)
    const TOTAL_CYCLE = RED_DURATION + YELLOW_DURATION + GREEN_DURATION;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const cycleProgress = elapsed % TOTAL_CYCLE;

      // Red phase
      if (cycleProgress < RED_DURATION) {
        setPhase('red');
        setProgress((cycleProgress / RED_DURATION) * 100);
        hasTriggeredBeat = false;
      } 
      // Yellow phase
      else if (cycleProgress < RED_DURATION + YELLOW_DURATION) {
        setPhase('yellow');
        const yellowProgress = cycleProgress - RED_DURATION;
        setProgress((yellowProgress / YELLOW_DURATION) * 100);
      } 
      // Green phase - PAUSES FOR 2 SECONDS
      else {
        if (phase !== 'green' && !hasTriggeredBeat) {
          if (onBeat) onBeat();
          hasTriggeredBeat = true;
        }
        setPhase('green');
        const greenProgress = cycleProgress - RED_DURATION - YELLOW_DURATION;
        setProgress((greenProgress / GREEN_DURATION) * 100);
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isActive, phase, onBeat]);

  if (!isActive) {
    return (
      <div className={styles.timerInactive}>
        <span className={styles.inactiveIcon}>⏰</span>
        <span className={styles.inactiveText}>Press Start to begin</span>
      </div>
    );
  }

  return (
    <div className={styles.rhythmTimer}>
      {/* Horizontal Traffic Light */}
      <div className={styles.trafficLights}>
        <div className={`${styles.miniLight} ${styles.red} ${phase === 'red' ? styles.active : ''}`}>
          <div className={styles.lightGlow}></div>
        </div>
        <div className={`${styles.miniLight} ${styles.yellow} ${phase === 'yellow' ? styles.active : ''}`}>
          <div className={styles.lightGlow}></div>
        </div>
        <div className={`${styles.miniLight} ${styles.green} ${phase === 'green' ? styles.active : ''}`}>
          <div className={styles.lightGlow}></div>
        </div>
      </div>

      {/* Phase Label & Hands */}
      <div className={styles.mainDisplay}>
        <div className={styles.phaseLabel}>
          {phase === 'red' && <span className={styles.labelRed}>⏸️ Wait</span>}
          {phase === 'yellow' && <span className={styles.labelYellow}>⚡ Ready</span>}
          {phase === 'green' && <span className={styles.labelGreen}>👏 CLAP NOW!</span>}
        </div>
        
        <div className={styles.handsDisplay}>
          {phase === 'green' ? (
            <span className={styles.handsClapping}>👏</span>
          ) : (
            <span className={styles.handsWaiting}>👐</span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className={styles.progressBar}>
        <div 
          className={`${styles.progressFill} ${styles[phase]}`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Timing Info */}
      <div className={styles.timingInfo}>
        {phase === 'green' && (
          <span className={styles.pauseIndicator}>Paused for clapping</span>
        )}
      </div>
    </div>
  );
};

export default ClapRhythmTimer;