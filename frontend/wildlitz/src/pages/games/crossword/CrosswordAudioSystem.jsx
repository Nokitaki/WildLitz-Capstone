import React, { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';

const CrosswordAudioSystem = ({ 
  isPlaying = false, 
  onCorrect = false, 
  onWrong = false,
  volume = 0.5,
  shouldInitialize = false 
}) => {
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const synthRef = useRef(null);
  const melodyPartRef = useRef(null);
  const correctSynthRef = useRef(null);
  const wrongSynthRef = useRef(null);

  // Initialize audio system ONLY when shouldInitialize is true
  useEffect(() => {
    let mounted = true;
    
    const initAudio = async () => {
      if (!audioInitialized && shouldInitialize && mounted) {
        try {
          await Tone.start();
          
          // Create synth for background music
          synthRef.current = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'sine' },
            envelope: {
              attack: 0.1,
              decay: 0.2,
              sustain: 0.3,
              release: 1
            }
          }).toDestination();
          synthRef.current.volume.value = -15;

          // Create synth for correct answer sound
          correctSynthRef.current = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'triangle' },
            envelope: {
              attack: 0.01,
              decay: 0.1,
              sustain: 0.2,
              release: 0.3
            }
          }).toDestination();
          correctSynthRef.current.volume.value = -10;

          // Create synth for wrong answer sound
          wrongSynthRef.current = new Tone.Synth({
            oscillator: { type: 'sine' },
            envelope: {
              attack: 0.01,
              decay: 0.1,
              sustain: 0.1,
              release: 0.2
            }
          }).toDestination();
          wrongSynthRef.current.volume.value = -12;

          // Create cheerful background melody pattern
          const melody = [
            { time: '0:0', note: 'C4', duration: '4n' },
            { time: '0:1', note: 'E4', duration: '4n' },
            { time: '0:2', note: 'G4', duration: '4n' },
            { time: '0:3', note: 'E4', duration: '4n' },
            { time: '1:0', note: 'D4', duration: '4n' },
            { time: '1:1', note: 'F4', duration: '4n' },
            { time: '1:2', note: 'A4', duration: '4n' },
            { time: '1:3', note: 'F4', duration: '4n' },
            { time: '2:0', note: 'E4', duration: '4n' },
            { time: '2:1', note: 'G4', duration: '4n' },
            { time: '2:2', note: 'C5', duration: '4n' },
            { time: '2:3', note: 'G4', duration: '4n' },
            { time: '3:0', note: 'C4', duration: '2n' },
            { time: '3:2', note: 'E4', duration: '2n' }
          ];

          melodyPartRef.current = new Tone.Part((time, value) => {
            if (synthRef.current && !isMuted) {
              synthRef.current.triggerAttackRelease(value.note, value.duration, time);
            }
          }, melody);

          melodyPartRef.current.loop = true;
          melodyPartRef.current.loopEnd = '4m';

          if (mounted) {
            setAudioInitialized(true);
          }
        } catch (error) {
          console.error('Audio initialization error:', error);
        }
      }
    };

    initAudio();

    return () => {
      mounted = false;
      
      try {
        if (melodyPartRef.current && melodyPartRef.current.state !== 'disposed') {
          melodyPartRef.current.stop();
          melodyPartRef.current.dispose();
          melodyPartRef.current = null;
        }
      } catch (e) {
        console.warn('Melody cleanup error:', e);
      }
      
      try {
        if (synthRef.current && synthRef.current.disposed === false) {
          synthRef.current.dispose();
          synthRef.current = null;
        }
      } catch (e) {
        console.warn('Synth cleanup error:', e);
      }
      
      try {
        if (correctSynthRef.current && correctSynthRef.current.disposed === false) {
          correctSynthRef.current.dispose();
          correctSynthRef.current = null;
        }
      } catch (e) {
        console.warn('Correct synth cleanup error:', e);
      }
      
      try {
        if (wrongSynthRef.current && wrongSynthRef.current.disposed === false) {
          wrongSynthRef.current.dispose();
          wrongSynthRef.current = null;
        }
      } catch (e) {
        console.warn('Wrong synth cleanup error:', e);
      }
    };
  }, [shouldInitialize]); // Only re-run if shouldInitialize changes

  // Control background music
  useEffect(() => {
    if (audioInitialized && melodyPartRef.current) {
      if (isPlaying && !isMuted) {
        Tone.Transport.start();
        melodyPartRef.current.start(0);
      } else {
        melodyPartRef.current.stop();
        Tone.Transport.stop();
      }
    }
  }, [isPlaying, audioInitialized, isMuted]);

  // Play correct answer sound
  useEffect(() => {
    if (onCorrect && correctSynthRef.current && !isMuted) {
      const now = Tone.now();
      // Happy ascending notes
      correctSynthRef.current.triggerAttackRelease('C5', '8n', now);
      correctSynthRef.current.triggerAttackRelease('E5', '8n', now + 0.1);
      correctSynthRef.current.triggerAttackRelease('G5', '8n', now + 0.2);
      correctSynthRef.current.triggerAttackRelease('C6', '4n', now + 0.3);
    }
  }, [onCorrect, isMuted]);

  // Play wrong answer sound
  useEffect(() => {
    if (onWrong && wrongSynthRef.current && !isMuted) {
      const now = Tone.now();
      // Gentle descending tone (not harsh)
      wrongSynthRef.current.triggerAttackRelease('D4', '8n', now);
      wrongSynthRef.current.triggerAttackRelease('C4', '8n', now + 0.1);
    }
  }, [onWrong, isMuted]);

  // Mute/unmute controls
  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (synthRef.current && synthRef.current.disposed === false) {
      synthRef.current.volume.value = newMutedState ? -Infinity : -15;
    }
    if (correctSynthRef.current && correctSynthRef.current.disposed === false) {
      correctSynthRef.current.volume.value = newMutedState ? -Infinity : -10;
    }
    if (wrongSynthRef.current && wrongSynthRef.current.disposed === false) {
      wrongSynthRef.current.volume.value = newMutedState ? -Infinity : -12;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 1000
    }}>
      <button
        onClick={toggleMute}
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          border: 'none',
          background: isMuted 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>
    </div>
  );
};

// Demo component to test the audio system
const AudioDemo = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCorrect, setShowCorrect] = useState(false);
  const [showWrong, setShowWrong] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);

  const handleEnableAudio = async () => {
    setAudioInitialized(true);
    setIsPlaying(true);
  };

  const playCorrect = () => {
    setShowCorrect(true);
    setTimeout(() => setShowCorrect(false), 100);
  };

  const playWrong = () => {
    setShowWrong(true);
    setTimeout(() => setShowWrong(false), 100);
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '30px',
      padding: '20px'
    }}>
      <h1 style={{ color: 'white', fontSize: '36px', marginBottom: '20px' }}>
        🎵 Crossword Game Audio System
      </h1>
      
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '20px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        maxWidth: '600px',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#333', marginBottom: '20px' }}>Test the Audio</h2>
        
        {!audioInitialized ? (
          <button
            onClick={handleEnableAudio}
            style={{
              padding: '20px 50px',
              fontSize: '20px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              cursor: 'pointer',
              width: '100%',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
            }}
          >
            🔊 Click Here to Enable Audio & Start Music
          </button>
        ) : (
          <>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                padding: '15px 40px',
                fontSize: '18px',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '12px',
                background: isPlaying 
                  ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                cursor: 'pointer',
                marginBottom: '20px',
                width: '100%',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
              }}
            >
              {isPlaying ? '⏸️ Pause Background Music' : '▶️ Play Background Music'}
            </button>

            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
              <button
                onClick={playCorrect}
                style={{
                  flex: 1,
                  padding: '15px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  border: 'none',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
                }}
              >
                ✓ Correct Sound
              </button>

              <button
                onClick={playWrong}
                style={{
                  flex: 1,
                  padding: '15px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  border: 'none',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #ee9ca7 0%, #ffdde1 100%)',
                  color: '#333',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
                }}
              >
                ✗ Wrong Sound
              </button>
            </div>
          </>
        )}

        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: '#f8f9fa',
          borderRadius: '12px',
          textAlign: 'left'
        }}>
          <h3 style={{ color: '#333', marginBottom: '10px' }}>Features:</h3>
          <ul style={{ color: '#666', lineHeight: '1.8' }}>
            <li>🎵 Cheerful background music loop</li>
            <li>✅ Happy sound for correct answers</li>
            <li>❌ Gentle sound for wrong answers</li>
            <li>🔊 Mute/Unmute button (bottom-right)</li>
            <li>👶 Grade 3 appropriate sounds</li>
          </ul>
          <div style={{ 
            marginTop: '15px', 
            padding: '10px', 
            background: '#fff3cd', 
            borderRadius: '8px',
            border: '1px solid #ffc107'
          }}>
            <strong>💡 Note:</strong> Click "Play Background Music" to start the audio. 
            Browsers require user interaction before playing sounds!
          </div>
        </div>
      </div>

      {audioInitialized && (
        <CrosswordAudioSystem
          shouldInitialize={audioInitialized}
          isPlaying={isPlaying}
          onCorrect={showCorrect}
          onWrong={showWrong}
        />
      )}
    </div>
  );
};

export default AudioDemo;