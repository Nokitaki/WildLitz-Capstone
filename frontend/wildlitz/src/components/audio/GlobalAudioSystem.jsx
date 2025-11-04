import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Tone from 'tone';

const GlobalAudioSystem = ({ isEnabled = true, showControls = true }) => {
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [volume, setVolume] = useState(70); // Volume from 0-100, default 70%
  const [showSlider, setShowSlider] = useState(false); // Toggle slider visibility
  
  const musicSynthRef = useRef(null);
  const clickSynthRef = useRef(null);
  const correctSynthRef = useRef(null);
  const wrongSynthRef = useRef(null);
  const melodyPartRef = useRef(null);

  // Helper function to convert volume percentage (0-100) to decibels
  const volumeToDecibels = useCallback((volumePercent) => {
    if (volumePercent === 0) return -Infinity;
    // Convert 0-100 to decibels (logarithmic scale)
    // Range: -60dB (very quiet at 1%) to 0dB (max at 100%)
    const normalized = volumePercent / 100;
    return (Math.log10(normalized) * 20);
  }, []);

  // Base volume levels for each synth (in dB)
  const BASE_VOLUMES = {
    click: 6,
    correct: 8,
    wrong: 3,
    music: -8
  };

  // Calculate actual volume in dB based on percentage
  const getAdjustedVolume = useCallback((baseVolume) => {
    if (volume === 0) return -Infinity;
    const volumeMultiplier = volumeToDecibels(volume);
    return baseVolume + volumeMultiplier;
  }, [volume, volumeToDecibels]);

  // Initialize audio system
  useEffect(() => {
    let mounted = true;

    const initAudio = async () => {
      if (audioInitialized || !isEnabled) return;

      try {
        console.log('🎵 Initializing audio system...');
        await Tone.start();
        console.log('✅ Tone.js started, context state:', Tone.context.state);

        // Create sound effect synths
        clickSynthRef.current = new Tone.Synth({
          oscillator: { type: 'sine' },
          envelope: { attack: 0.005, decay: 0.2, sustain: 0.3, release: 0.3 }
        }).toDestination();
        clickSynthRef.current.volume.value = getAdjustedVolume(BASE_VOLUMES.click);
        console.log('✅ Click synth created');

        correctSynthRef.current = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.6 }
        }).toDestination();
        correctSynthRef.current.volume.value = getAdjustedVolume(BASE_VOLUMES.correct);
        console.log('✅ Correct synth created');

        wrongSynthRef.current = new Tone.Synth({
          oscillator: { type: 'sawtooth' },
          envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.3 }
        }).toDestination();
        wrongSynthRef.current.volume.value = getAdjustedVolume(BASE_VOLUMES.wrong);
        console.log('✅ Wrong synth created');

        // 🎵 CREATE BACKGROUND MUSIC SYNTH
        musicSynthRef.current = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'sine' },
          envelope: {
            attack: 0.1,
            decay: 0.2,
            sustain: 0.3,
            release: 1
          }
        }).toDestination();
        musicSynthRef.current.volume.value = getAdjustedVolume(BASE_VOLUMES.music);
        console.log('✅ Music synth created');

        // 🎵 CREATE CHEERFUL MELODY
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
          if (musicSynthRef.current) {
            musicSynthRef.current.triggerAttackRelease(value.note, value.duration, time);
          }
        }, melody);

        melodyPartRef.current.loop = true;
        melodyPartRef.current.loopEnd = '4m';
        console.log('✅ Background melody created');

        if (mounted) {
          setAudioInitialized(true);
          setMusicPlaying(true);
          
          // Start the music
          Tone.Transport.start();
          melodyPartRef.current.start(0);
          console.log('✅ Audio system fully initialized!');
        }
      } catch (e) {
        console.error('❌ Audio initialization error:', e);
      }
    };

    initAudio();

    return () => {
      mounted = false;
    };
  }, [audioInitialized, isEnabled, getAdjustedVolume]);

  // Update volumes when volume state changes
  useEffect(() => {
    if (!audioInitialized) return;

    const newClickVolume = getAdjustedVolume(BASE_VOLUMES.click);
    const newCorrectVolume = getAdjustedVolume(BASE_VOLUMES.correct);
    const newWrongVolume = getAdjustedVolume(BASE_VOLUMES.wrong);
    const newMusicVolume = getAdjustedVolume(BASE_VOLUMES.music);

    if (clickSynthRef.current) {
      clickSynthRef.current.volume.rampTo(newClickVolume, 0.1);
    }
    if (correctSynthRef.current) {
      correctSynthRef.current.volume.rampTo(newCorrectVolume, 0.1);
    }
    if (wrongSynthRef.current) {
      wrongSynthRef.current.volume.rampTo(newWrongVolume, 0.1);
    }
    if (musicSynthRef.current) {
      musicSynthRef.current.volume.rampTo(newMusicVolume, 0.1);
    }

    console.log(`🔊 Volume updated to ${volume}%`);
  }, [volume, audioInitialized, getAdjustedVolume]);

  // Register global sound functions
  useEffect(() => {
    if (!audioInitialized) return;

    window.playClickSound = () => {
      if (volume > 0 && clickSynthRef.current) {
        try {
          clickSynthRef.current.triggerAttackRelease('C5', '0.1');
          
        } catch (e) {
          console.error('❌ Click error:', e);
        }
      }
    };

    window.playCorrectSound = () => {
      if (volume > 0 && correctSynthRef.current) {
        try {
          const now = Tone.now();
          correctSynthRef.current.triggerAttackRelease('C5', '0.1', now);
          correctSynthRef.current.triggerAttackRelease('E5', '0.1', now + 0.1);
          correctSynthRef.current.triggerAttackRelease('G5', '0.2', now + 0.2);
          console.log('🔊 Correct!');
        } catch (e) {
          console.error('❌ Correct error:', e);
        }
      }
    };

    window.playWrongSound = () => {
      if (volume > 0 && wrongSynthRef.current) {
        try {
          const now = Tone.now();
          wrongSynthRef.current.triggerAttackRelease('D4', '0.15', now);
          wrongSynthRef.current.triggerAttackRelease('C4', '0.2', now + 0.15);
          console.log('🔊 Wrong!');
        } catch (e) {
          console.error('❌ Wrong error:', e);
        }
      }
    };
    
    console.log('✅ Sound functions registered');
  }, [audioInitialized, volume]);

  // Control music playback when volume changes
  useEffect(() => {
    if (!audioInitialized || !melodyPartRef.current) return;

    if (volume === 0) {
      // When volume is 0, stop the music but keep musicPlaying state true
      console.log('🔇 Muting audio...');
      
      melodyPartRef.current.stop();
      melodyPartRef.current.cancel();
      Tone.Transport.stop();
      Tone.Transport.cancel();
    } else {
      // When volume > 0, restart the music if it should be playing
      if (musicPlaying) {
        console.log('🔊 Unmuting audio...');
        
        Tone.Transport.stop();
        Tone.Transport.position = 0;
        melodyPartRef.current.cancel();
        melodyPartRef.current.start(0);
        Tone.Transport.start();
        
        console.log('✅ Music restarted!');
      }
    }
  }, [volume, audioInitialized, musicPlaying]);

  // Stop music when disabled or controls hidden
  useEffect(() => {
    if (!isEnabled || !showControls) {
      if (melodyPartRef.current) {
        try {
          melodyPartRef.current.stop();
          melodyPartRef.current.cancel();
        } catch (e) {
          console.warn('Error stopping melody:', e);
        }
      }
      
      if (audioInitialized) {
        try {
          Tone.Transport.stop();
          Tone.Transport.cancel();
          console.log('✅ Music stopped and transport cleared');
        } catch (e) {
          console.warn('Error stopping transport:', e);
        }
      }
      
      setMusicPlaying(false);
    }
  }, [isEnabled, showControls, audioInitialized]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        if (melodyPartRef.current) {
          melodyPartRef.current.stop();
          melodyPartRef.current.dispose();
        }
        if (musicSynthRef.current) musicSynthRef.current.dispose();
        if (clickSynthRef.current) clickSynthRef.current.dispose();
        if (correctSynthRef.current) correctSynthRef.current.dispose();
        if (wrongSynthRef.current) wrongSynthRef.current.dispose();
        Tone.Transport.stop();
        Tone.Transport.cancel();
      } catch (e) {
        console.warn('Cleanup error:', e);
      }
    };
  }, []);

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
  };

  const toggleSlider = () => {
    setShowSlider(prev => !prev);
  };

  if (!isEnabled || !showControls) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '10px'
    }}>
      {/* Volume Slider - appears above the button when active */}
      {showSlider && (
        <div style={{
          background: 'linear-gradient(135deg, #28a745 0%, #218838 100%)',
          borderRadius: '12px',
          padding: '15px 20px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          minWidth: '200px',
          animation: 'slideIn 0.3s ease'
        }}>
          <div style={{
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            Volume: {volume}%
          </div>
          
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={handleVolumeChange}
            style={{
              width: '100%',
              height: '8px',
              borderRadius: '5px',
              background: `linear-gradient(to right, #fff ${volume}%, #218838 ${volume}%)`,
              outline: 'none',
              WebkitAppearance: 'none',
              cursor: 'pointer'
            }}
          />
          
          {/* Quick preset buttons */}
          <div style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center'
          }}>
            {[0, 25, 50, 75, 100].map(preset => (
              <button
                key={preset}
                onClick={() => setVolume(preset)}
                style={{
                  background: volume === preset ? 'white' : 'rgba(255, 255, 255, 0.3)',
                  color: volume === preset ? '#28a745' : 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (volume !== preset) {
                    e.target.style.background = 'rgba(255, 255, 255, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (volume !== preset) {
                    e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                  }
                }}
              >
                {preset}%
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Volume Button */}
      <button
        onClick={toggleSlider}
        title={`Volume: ${volume}%`}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          border: 'none',
          background: volume === 0
            ? 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)'
            : 'linear-gradient(135deg, #28a745 0%, #218838 100%)',
          color: 'white',
          fontSize: '28px',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        {volume === 0 ? '🔇' : volume < 30 ? '🔈' : volume < 70 ? '🔉' : '🔊'}
        
        {/* Volume indicator ring */}
        <svg 
          style={{
            position: 'absolute',
            top: '-5px',
            left: '-5px',
            transform: 'rotate(-90deg)'
          }}
          width="70" 
          height="70"
        >
          <circle
            cx="35"
            cy="35"
            r="32"
            stroke={volume === 0 ? '#dc3545' : '#28a745'}
            strokeWidth="4"
            fill="none"
            strokeDasharray={`${(volume / 100) * 201} 201`}
            opacity="0.6"
          />
        </svg>
      </button>
      
      {/* Music indicator */}
      {musicPlaying && volume > 0 && audioInitialized && (
        <div style={{
          background: 'rgba(40, 167, 69, 0.9)',
          color: 'white',
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
        }}>
          
        </div>
      )}
      
      {/* CSS for slider animation */}
      <style>
        {`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          input[type='range']::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            transition: transform 0.2s ease;
          }
          
          input[type='range']::-webkit-slider-thumb:hover {
            transform: scale(1.2);
          }
          
          input[type='range']::-moz-range-thumb {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            border: none;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            transition: transform 0.2s ease;
          }
          
          input[type='range']::-moz-range-thumb:hover {
            transform: scale(1.2);
          }
        `}
      </style>
    </div>
  );
};

export default GlobalAudioSystem;