// src/components/common/GlobalAudioSystem.jsx
// FIXED VERSION - Mute/Unmute now works properly!

import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';

const GlobalAudioSystem = ({ isEnabled, showControls = true }) => {
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  
  const clickSynthRef = useRef(null);
  const correctSynthRef = useRef(null);
  const wrongSynthRef = useRef(null);
  const musicSynthRef = useRef(null);
  const melodyPartRef = useRef(null);

  // Expose initialization function globally
  useEffect(() => {
    if (!isEnabled) return;

    console.log('🎵 [GlobalAudioSystem] Registering initAudioSystem function...');
    
    window.initAudioSystem = async () => {
      console.log('🎵 [initAudioSystem] Starting initialization...');
      
      try {
        // Start Tone.js (MUST be from user gesture!)
        await Tone.start();
        console.log('✅ Tone.js started, context state:', Tone.context.state);

        // Create sound effect synths
        clickSynthRef.current = new Tone.Synth({
          oscillator: { type: 'sine' },
          envelope: { attack: 0.005, decay: 0.2, sustain: 0.3, release: 0.3 }
        }).toDestination();
        clickSynthRef.current.volume.value = 6;
        console.log('✅ Click synth created');

        correctSynthRef.current = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.6 }
        }).toDestination();
        correctSynthRef.current.volume.value = 8;
        console.log('✅ Correct synth created');

        wrongSynthRef.current = new Tone.Synth({
          oscillator: { type: 'sawtooth' },
          envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.3 }
        }).toDestination();
        wrongSynthRef.current.volume.value = 3;
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
        musicSynthRef.current.volume.value = -8; // Softer than sound effects
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

        setAudioInitialized(true);
        console.log('✅ Audio system fully initialized!');
        
        // Play test beep
        console.log('🔊 Playing test beep...');
        clickSynthRef.current.triggerAttackRelease('C5', '0.3');
        
        // 🎵 AUTO-START BACKGROUND MUSIC
        console.log('🎵 Auto-starting background music...');
        setTimeout(() => {
          Tone.Transport.start();
          melodyPartRef.current.start(0);
          setMusicPlaying(true);
          console.log('🎵 Background music started!');
        }, 500);
        
        return true;
      } catch (error) {
        console.error('❌ Audio initialization failed:', error);
        return false;
      }
    };

    return () => {
      delete window.initAudioSystem;
    };
  }, [isEnabled]);

  // Register sound functions
  useEffect(() => {
    if (!audioInitialized) return;

    console.log('🎵 [GlobalAudioSystem] Registering sound functions...');
    
    window.playClickSound = () => {
      if (!isMuted && clickSynthRef.current) {
        try {
          clickSynthRef.current.triggerAttackRelease('G4', '0.2');
          console.log('🔊 Click!');
        } catch (e) {
          console.error('❌ Click error:', e);
        }
      }
    };

    window.playCorrectSound = () => {
      if (!isMuted && correctSynthRef.current) {
        try {
          const now = Tone.now();
          correctSynthRef.current.triggerAttackRelease(['C5', 'E5', 'G5'], '0.4', now);
          correctSynthRef.current.triggerAttackRelease('C6', '0.6', now + 0.3);
          console.log('🔊 Correct!');
        } catch (e) {
          console.error('❌ Correct error:', e);
        }
      }
    };

    window.playWrongSound = () => {
      if (!isMuted && wrongSynthRef.current) {
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
  }, [audioInitialized, isMuted]);

  // 🔥 FIX: Control music playback when mute state changes
  useEffect(() => {
    if (!audioInitialized || !melodyPartRef.current) return;

    if (isMuted) {
      // When muting, stop the music but keep musicPlaying state true
      console.log('🔇 Muting audio...');
      
      // Stop and cancel the melody part
      melodyPartRef.current.stop();
      melodyPartRef.current.cancel(); // Cancel all scheduled events
      Tone.Transport.stop();
      Tone.Transport.cancel(); // Cancel all scheduled events on transport
      
      // Mute all synth volumes
      if (clickSynthRef.current) clickSynthRef.current.volume.value = -Infinity;
      if (correctSynthRef.current) correctSynthRef.current.volume.value = -Infinity;
      if (wrongSynthRef.current) wrongSynthRef.current.volume.value = -Infinity;
      if (musicSynthRef.current) musicSynthRef.current.volume.value = -Infinity;
    } else {
      // When unmuting, restart the music if it was playing
      console.log('🔊 Unmuting audio...');
      
      // Restore synth volumes
      if (clickSynthRef.current) clickSynthRef.current.volume.value = 6;
      if (correctSynthRef.current) correctSynthRef.current.volume.value = 8;
      if (wrongSynthRef.current) wrongSynthRef.current.volume.value = 3;
      if (musicSynthRef.current) musicSynthRef.current.volume.value = -8;
      
      // 🔥 FIX: Properly restart music if it should be playing
      if (musicPlaying && melodyPartRef.current) {
        console.log('🎵 Restarting music...');
        
        // First make sure transport is stopped and at position 0
        Tone.Transport.stop();
        Tone.Transport.position = 0;
        
        // Cancel any existing scheduled events
        melodyPartRef.current.cancel();
        
        // Schedule the part again from the beginning
        melodyPartRef.current.start(0);
        
        // Start the transport
        Tone.Transport.start();
        
        console.log('✅ Music restarted! Transport state:', Tone.Transport.state);
      }
    }
  }, [isMuted, audioInitialized, musicPlaying]);

  const toggleMute = () => {
    console.log('🔄 Toggle mute, current state:', isMuted);
    setIsMuted(prev => !prev);
  };

  // 🔥 FIX: Stop music when disabled or controls hidden
  useEffect(() => {
    if (!isEnabled || !showControls) {
      console.log('🔇 Audio disabled or controls hidden - stopping music...');
      
      // Stop the music immediately
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

  if (!isEnabled || !showControls) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999
    }}>
      <button
        onClick={toggleMute}
        title={isMuted ? 'Unmute' : 'Mute'}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          border: 'none',
          background: isMuted 
            ? 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)'
            : 'linear-gradient(135deg, #28a745 0%, #218838 100%)',
          color: 'white',
          fontSize: '28px',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>
      
      {/* Music indicator */}
      {musicPlaying && !isMuted && audioInitialized && (
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(40, 167, 69, 0.9)',
          color: 'white',
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
        }}>
          🎵 Music On
        </div>
      )}
    </div>
  );
};

export default GlobalAudioSystem;