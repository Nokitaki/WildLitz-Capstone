// utils/soundUtils.js
// Utility functions for sound and speech synthesis - FIXED VERSION

/**
 * Stop all ongoing speech synthesis
 */
export const stopAllSpeech = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    console.log('🔇 All speech stopped');
  }
};

/**
 * Play a word or sound using the browser's speech synthesis
 * @param {string} text - The text to speak
 * @param {number} rate - Speaking rate (0.5-2.0)
 * @param {Function} onEnd - Callback when speech ends
 */
export const playSpeech = (text, rate = 0.8, onEnd = () => {}) => {
  if ('speechSynthesis' in window) {
    // CRITICAL: Cancel any ongoing speech before starting new speech
    window.speechSynthesis.cancel();
    
    console.log('🔊 Playing speech:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.onend = () => {
      console.log('✅ Speech completed:', text.substring(0, 30));
      onEnd();
    };
    
    // Add error handler to ensure onEnd is called even if speech fails
    utterance.onerror = (event) => {
      console.error('❌ Speech synthesis error:', event);
      onEnd();
    };
    
    window.speechSynthesis.speak(utterance);
    return true;
  } else {
    console.warn('⚠️ Text-to-speech not supported in this browser');
    // Fallback if speech synthesis isn't available
    setTimeout(onEnd, 1000);
    return false;
  }
};

/**
 * Play a simple celebratory sound effect
 * @param {number} score - User's score (affects sound)
 */
export const playCelebrationSound = (score) => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Play a few happy notes
    const notes = score > 90 
      ? [0, 4, 7, 12, 7, 12] // Major victory
      : [0, 4, 7, 12];       // Simple celebration
    
    notes.forEach((note, index) => {
      const oscillator = audioContext.createOscillator();
      oscillator.type = 'triangle';
      oscillator.frequency.value = 440 * Math.pow(2, note / 12); // A major scale
      
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.1;
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start(audioContext.currentTime + index * 0.15);
      oscillator.stop(audioContext.currentTime + 0.2 + index * 0.15);
    });
  } catch (error) {
    console.warn('Audio context not available', error);
  }
};