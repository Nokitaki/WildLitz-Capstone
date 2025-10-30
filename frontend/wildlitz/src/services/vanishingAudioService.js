// src/services/vanishingAudioService.js
/**
 * Audio service for Vanishing Game
 * Handles text-to-speech with different voice characters
 */

class VanishingAudioService {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.currentUtterance = null;
    this.voices = [];
    this.isInitialized = false;
    
    // Initialize voices
    if (this.synthesis) {
      this.initVoices();
    }
  }

  initVoices() {
    // Load voices
    this.voices = this.synthesis.getVoices();
    
    // If voices aren't loaded yet, wait for them
    if (this.voices.length === 0) {
      this.synthesis.onvoiceschanged = () => {
        this.voices = this.synthesis.getVoices();
        this.isInitialized = true;
      };
    } else {
      this.isInitialized = true;
    }
  }

  /**
   * Get voice based on character type
   * @param {string} voiceType - 'happy', 'gentle', 'playful', 'friendly'
   */
  getVoiceByCharacter(voiceType = 'happy') {
    if (this.voices.length === 0) {
      this.voices = this.synthesis.getVoices();
    }

    let selectedVoice = null;

    switch (voiceType) {
      case 'happy':
        // Higher pitch, energetic voice
        selectedVoice = this.voices.find(v => 
          v.name.includes('Samantha') || 
          v.name.includes('Karen') ||
          v.name.includes('Google UK English Female')
        );
        break;
      
      case 'gentle':
        // Softer, calmer voice
        selectedVoice = this.voices.find(v => 
          v.name.includes('Victoria') ||
          v.name.includes('Fiona') ||
          v.name.includes('Google US English')
        );
        break;
      
      case 'playful':
        // Fun, energetic voice
        selectedVoice = this.voices.find(v => 
          v.name.includes('Kate') ||
          v.name.includes('Princess') ||
          v.name.includes('Google UK English')
        );
        break;
      
      case 'friendly':
        // Warm, welcoming voice
        selectedVoice = this.voices.find(v => 
          v.name.includes('Susan') ||
          v.name.includes('Nicky') ||
          v.name.includes('Google US English')
        );
        break;
      
      default:
        selectedVoice = this.voices.find(v => v.lang.startsWith('en'));
    }

    // Fallback to first English voice
    if (!selectedVoice) {
      selectedVoice = this.voices.find(v => v.lang.startsWith('en'));
    }

    // Last resort - use first available voice
    if (!selectedVoice && this.voices.length > 0) {
      selectedVoice = this.voices[0];
    }

    return selectedVoice;
  }

  /**
   * Speak a word with the selected voice character
   * @param {string} text - Text to speak
   * @param {Object} options - Voice options
   */
  speakWord(text, options = {}) {
    return new Promise((resolve, reject) => {
      // Check if speech synthesis is available
      if (!this.synthesis) {
        console.warn('Speech synthesis not available');
        resolve();
        return;
      }

      // Cancel any ongoing speech
      this.stop();

      const {
        voiceType = 'happy',
        rate = 0.9,
        pitch = 1.1,
        volume = 1.0
      } = options;

      // Create utterance
      this.currentUtterance = new SpeechSynthesisUtterance(text);
      
      // Set voice
      const voice = this.getVoiceByCharacter(voiceType);
      if (voice) {
        this.currentUtterance.voice = voice;
      }

      // Set voice characteristics based on character
      switch (voiceType) {
        case 'happy':
          this.currentUtterance.rate = 0.95;
          this.currentUtterance.pitch = 1.2;
          break;
        case 'gentle':
          this.currentUtterance.rate = 0.85;
          this.currentUtterance.pitch = 1.0;
          break;
        case 'playful':
          this.currentUtterance.rate = 1.0;
          this.currentUtterance.pitch = 1.3;
          break;
        case 'friendly':
          this.currentUtterance.rate = 0.9;
          this.currentUtterance.pitch = 1.1;
          break;
        default:
          this.currentUtterance.rate = rate;
          this.currentUtterance.pitch = pitch;
      }

      this.currentUtterance.volume = volume;

      // Set callbacks
      this.currentUtterance.onend = () => {
        resolve();
      };

      this.currentUtterance.onerror = (error) => {
        console.error('Speech error:', error);
        resolve(); // Resolve anyway to not block the game
      };

      // Speak
      try {
        this.synthesis.speak(this.currentUtterance);
      } catch (error) {
        console.error('Error speaking:', error);
        resolve();
      }
    });
  }

  /**
   * Play success sound
   */
  playSuccessSound() {
    this.speakWord('Amazing!', { voiceType: 'happy', rate: 1.0, pitch: 1.3 });
  }

  /**
   * Play encouragement
   */
  playEncouragement(message) {
    this.speakWord(message, { voiceType: 'friendly', rate: 0.9 });
  }

  /**
   * Stop current speech
   */
  stop() {
    if (this.synthesis && this.synthesis.speaking) {
      this.synthesis.cancel();
    }
  }

  /**
   * Check if audio is available
   */
  isAvailable() {
    return !!this.synthesis;
  }
}

// Export singleton instance
const vanishingAudioService = new VanishingAudioService();
export default vanishingAudioService;