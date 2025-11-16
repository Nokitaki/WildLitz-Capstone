import React, { useState, useEffect, useRef } from 'react';
import styles from '../../../styles/games/syllable/DraggableRhythmTimer.module.css';

const DraggableRhythmTimer = ({ 
  isGameActive = false,
  wordPlayTimestamp = null,
  onBeat
}) => {
  const [phase, setPhase] = useState('waiting');
  const [progress, setProgress] = useState(0);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [countdown, setCountdown] = useState(3);
  
  const timerRef = useRef(null);
  const lastPhaseRef = useRef('waiting');

  // Main rhythm timer effect
  useEffect(() => {
    if (!isGameActive || !wordPlayTimestamp) {
      setPhase('waiting');
      setProgress(0);
      setCountdown(3);
      lastPhaseRef.current = 'waiting';
      return;
    }

    let animationFrame;
    const DELAY = 3000; // 3 seconds delay
    const RED_DURATION = 1000;
    const YELLOW_DURATION = 2000;
    const GREEN_DURATION = 2000;
    const TOTAL_CYCLE = RED_DURATION + YELLOW_DURATION + GREEN_DURATION;

    const animate = () => {
      const now = Date.now();
      const elapsedSinceWord = now - wordPlayTimestamp;

      if (elapsedSinceWord < DELAY) {
        // Still in countdown phase
        const remainingMs = DELAY - elapsedSinceWord;
        const remainingSec = Math.ceil(remainingMs / 1000);
        setCountdown(remainingSec);
        setPhase('waiting');
        lastPhaseRef.current = 'waiting';
      } else {
        // Rhythm phase - calculate elapsed time since rhythm should have started
        const rhythmElapsed = elapsedSinceWord - DELAY;
        const cycleProgress = rhythmElapsed % TOTAL_CYCLE;

        let currentPhase;
        let currentProgress;

        if (cycleProgress < RED_DURATION) {
          // Red phase: 0-1000ms
          currentPhase = 'red';
          currentProgress = (cycleProgress / RED_DURATION) * 100;
        } else if (cycleProgress < RED_DURATION + YELLOW_DURATION) {
          // Yellow phase: 1000-3000ms
          currentPhase = 'yellow';
          const yellowProgress = cycleProgress - RED_DURATION;
          currentProgress = (yellowProgress / YELLOW_DURATION) * 100;
        } else {
          // Green phase: 3000-5000ms
          currentPhase = 'green';
          const greenProgress = cycleProgress - RED_DURATION - YELLOW_DURATION;
          currentProgress = (greenProgress / GREEN_DURATION) * 100;
          
          // Trigger beat on transition to green phase
          if (lastPhaseRef.current !== 'green' && onBeat) {
            onBeat();
          }
        }

        setPhase(currentPhase);
        setProgress(currentProgress);
        lastPhaseRef.current = currentPhase;
      }

      animationFrame = requestAnimationFrame(animate);
    };

    // Start animation loop
    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isGameActive, wordPlayTimestamp, onBeat]);

  // Dragging handlers
  const handleMouseDown = (e) => {
    if (e.target.closest(`.${styles.minimizeBtn}`)) return;
    
    setIsDragging(true);
    const rect = timerRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    const maxX = window.innerWidth - timerRef.current.offsetWidth;
    const maxY = window.innerHeight - timerRef.current.offsetHeight;

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e) => {
    if (e.target.closest(`.${styles.minimizeBtn}`)) return;
    
    setIsDragging(true);
    const touch = e.touches[0];
    const rect = timerRef.current.getBoundingClientRect();
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;

    const touch = e.touches[0];
    const newX = touch.clientX - dragOffset.x;
    const newY = touch.clientY - dragOffset.y;

    const maxX = window.innerWidth - timerRef.current.offsetWidth;
    const maxY = window.innerHeight - timerRef.current.offsetHeight;

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, dragOffset]);

  if (!isGameActive) return null;

  return (
    <div
      ref={timerRef}
      className={`${styles.floatingTimer} ${isDragging ? styles.dragging : ''} ${isMinimized ? styles.minimized : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Drag Handle */}
      <div className={styles.dragHandle}>
        <span className={styles.dragIcon}>⋮⋮</span>
        <span className={styles.timerTitle}>Rhythm Helper</span>
        <button
          className={styles.minimizeBtn}
          onClick={() => setIsMinimized(!isMinimized)}
          title={isMinimized ? "Expand" : "Minimize"}
        >
          {isMinimized ? '▢' : '−'}
        </button>
      </div>

      {/* Timer Content */}
      {!isMinimized && (
        <div className={styles.timerContent}>
          {phase === 'waiting' ? (
            // Show countdown during 3-second wait
            <div className={styles.countdownDisplay}>
              <div className={styles.countdownNumber}>{countdown}</div>
              <div className={styles.countdownText}>
                {countdown > 0 ? 'Think about it...' : 'Get ready!'}
              </div>
            </div>
          ) : (
            <>
              {/* Traffic Lights */}
              <div className={styles.trafficLights}>
                <div className={`${styles.light} ${styles.red} ${phase === 'red' ? styles.active : ''}`} />
                <div className={`${styles.light} ${styles.yellow} ${phase === 'yellow' ? styles.active : ''}`} />
                <div className={`${styles.light} ${styles.green} ${phase === 'green' ? styles.active : ''}`} />
              </div>

              {/* Phase Display */}
              <div className={styles.phaseDisplay}>
                {phase === 'red' && (
                  <span className={styles.phaseRed}>⏸️ Wait</span>
                )}
                {phase === 'yellow' && (
                  <span className={styles.phaseYellow}>⚡ Ready</span>
                )}
                {phase === 'green' && (
                  <span className={styles.phaseGreen}>👏 CLAP!</span>
                )}
              </div>

              {/* Hands */}
              <div className={styles.hands}>
                {phase === 'green' ? '👏' : '👐'}
              </div>

              {/* Progress Bar */}
              <div className={styles.progressBar}>
                <div 
                  className={`${styles.progressFill} ${styles[phase]}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DraggableRhythmTimer;