// frontend/wildlitz/src/utils/soundUtils.js
// FIXED VERSION - Prevents Speech Synthesis Error Messages

/**
 * Stop all ongoing speech synthesis gracefully
 * Now properly suppresses error messages when cancelling speech
 */
export const stopAllSpeech = () => {
  try {
    if ('speechSynthesis' in window) {
      // Check if speech is actually speaking before cancelling
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
        console.log('🔇 All speech stopped');
      }
    }
  } catch (error) {
    // Silently handle any cancellation errors
    // These are normal when stopping speech
  }
};

/**
 * Play text using browser's speech synthesis
 * @param {string} text - The text to speak
 * @param {number} rate - Speaking rate (0.5-2.0)
 * @param {Function} onEnd - Callback when speech ends
 * @returns {boolean} - True if speech started successfully
 */
export const playSpeech = (text, rate = 0.8, onEnd = () => {}) => {
  try {
    if (!('speechSynthesis' in window)) {
      console.warn('⚠️ Text-to-speech not supported in this browser');
      setTimeout(onEnd, 1000);
      return false;
    }

    // Stop any ongoing speech first
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
    }
    
    console.log('🔊 Playing speech:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    
    // Track if callback was already called to prevent double-calling
    let callbackCalled = false;
    
    const safeCallback = () => {
      if (!callbackCalled) {
        callbackCalled = true;
        onEnd();
      }
    };
    
    // Handle successful completion
    utterance.onend = () => {
      console.log('✅ Speech completed');
      safeCallback();
    };
    
    // Handle errors WITHOUT showing error messages
    utterance.onerror = (event) => {
      // Only log errors that aren't "interrupted" or "cancelled"
      // These are normal when we stop speech intentionally
      if (event.error !== 'interrupted' && event.error !== 'canceled') {
        console.warn('Speech error (non-critical):', event.error);
      }
      // Always call the callback even on error
      safeCallback();
    };
    
    // Speak the text
    window.speechSynthesis.speak(utterance);
    return true;
    
  } catch (error) {
    console.error('Failed to initialize speech:', error);
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
    
    // Play happy notes based on score
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
    // Silently fail if audio context isn't available
    console.warn('Audio context not available');
  }
};

/**
 * Create a safe speech wrapper that won't throw errors
 * Use this for components that frequently start/stop speech
 * 
 * @param {string} text - Text to speak
 * @param {number} rate - Speech rate
 * @param {Function} onComplete - Callback when done
 */
export const safeSpeech = (text, rate = 0.8, onComplete = () => {}) => {
  // Stop any existing speech first
  stopAllSpeech();
  
  // Small delay to ensure cancellation completes
  setTimeout(() => {
    playSpeech(text, rate, onComplete);
  }, 50);
};

/**
 * Global error handler for Speech Synthesis
 * Call this once when your app loads to suppress speech errors globally
 */
export const initializeSpeechErrorHandling = () => {
  if ('speechSynthesis' in window) {
    // Add global error event listener to suppress speech errors
    window.addEventListener('error', (event) => {
      // Check if this is a speech synthesis error
      if (event.message && event.message.includes('SpeechSynthesis')) {
        // Prevent the error from showing in console
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    }, true);
    
    console.log('✅ Speech error handling initialized');
  }
};

export default {
  stopAllSpeech,
  playSpeech,
  playCelebrationSound,
  safeSpeech,
  initializeSpeechErrorHandling
};