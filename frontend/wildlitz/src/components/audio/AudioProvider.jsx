// src/context/AudioProvider.jsx - FIXED VERSION
import React, { createContext, useContext, useState, useEffect } from 'react';
import GlobalAudioSystem from '../audio/GlobalAudioSystem';

const AudioContext = createContext();

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return context;
};

export const AudioProvider = ({ children }) => {
  const [audioEnabled, setAudioEnabled] = useState(() => {
    const saved = localStorage.getItem('wildlitz_audio_enabled');
    return saved === 'true';
  });
  
  // Track if we should show audio controls (only in crossword game)
  const [showAudioControls, setShowAudioControls] = useState(false);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('wildlitz_audio_enabled', audioEnabled);
    
  }, [audioEnabled]);

  // Register global functions
  useEffect(() => {
    
    
    // Enable audio and show controls (called from GameTipsModal)
    window.enableGameAudio = () => {
      console.log('✅ [AudioProvider] Enabling audio + showing controls');
      setAudioEnabled(true);
      setShowAudioControls(true);
    };
    
    // Disable audio
    window.disableGameAudio = () => {
      
      setAudioEnabled(false);
      setShowAudioControls(false);
    };
    
    // Show/hide controls independently
    window.showAudioControls = () => {
      console.log('👁️ [AudioProvider] Showing audio controls');
      setShowAudioControls(true);
    };
    
    window.hideAudioControls = () => {
      console.log('🙈 [AudioProvider] Hiding audio controls');
      setShowAudioControls(false);
    };

    return () => {
      delete window.enableGameAudio;
      delete window.disableGameAudio;
      delete window.showAudioControls;
      delete window.hideAudioControls;
    };
  }, []);

  const enableAudio = () => {
    console.log('🎵 [AudioProvider] enableAudio called');
    setAudioEnabled(true);
    setShowAudioControls(true);
  };

  const disableAudio = () => {
    console.log('🔇 [AudioProvider] disableAudio called');
    setAudioEnabled(false);
    setShowAudioControls(false);
  };

  return (
    <AudioContext.Provider 
      value={{ 
        audioEnabled,
        showAudioControls,
        enableAudio, 
        disableAudio
      }}
    >
      {/* Global Audio System - Only show controls when in crossword game */}
      <GlobalAudioSystem 
        isEnabled={audioEnabled} 
        showControls={showAudioControls}
      />
      
      {children}
    </AudioContext.Provider>
  );
};

export default AudioProvider;