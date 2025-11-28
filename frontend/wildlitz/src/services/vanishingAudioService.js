// src/services/vanishingAudioService.js
/**
 * Audio service for Vanishing Game
 * Handles text-to-speech AND sound effects
 */

class VanishingAudioService {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.currentUtterance = null;
    this.voices = [];
    this.isInitialized = false;
    
    // Create Audio Context for sound effects
    this.audioContext = null;
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
    
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
        selectedVoice = this.voices.find(v => 
          v.name.includes('Samantha') || 
          v.name.includes('Karen') ||
          v.name.includes('Google UK English Female')
        );
        break;
      
      case 'gentle':
        selectedVoice = this.voices.find(v => 
          v.name.includes('Victoria') ||
          v.name.includes('Fiona') ||
          v.name.includes('Google US English')
        );
        break;
      
      case 'playful':
        selectedVoice = this.voices.find(v => 
          v.name.includes('Princess') ||
          v.name.includes('Zira') ||
          v.name.includes('Google UK English Male')
        );
        break;
      
      case 'friendly':
        selectedVoice = this.voices.find(v => 
          v.name.includes('Alex') ||
          v.name.includes('Daniel') ||
          v.name.includes('Google US English')
        );
        break;
    }

    // Fallback to first available English voice
    if (!selectedVoice) {
      selectedVoice = this.voices.find(v => v.lang.startsWith('en'));
    }

    return selectedVoice;
  }

  /**
   * Speak a word or sentence
   */
  async speakWord(text, options = {}) {
    this.stop();

    if (!this.synthesis) {
      console.warn('Speech synthesis not available');
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const { 
        voiceType = 'friendly', 
        rate = 0.9, 
        pitch = 1.0, 
        volume = 1.0 
      } = options;

      this.currentUtterance = new SpeechSynthesisUtterance(text);
      
      const voice = this.getVoiceByCharacter(voiceType);
      if (voice) {
        this.currentUtterance.voice = voice;
      }

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
      this.currentUtterance.onend = () => resolve();
      this.currentUtterance.onerror = (error) => {
        console.error('Speech error:', error);
        resolve();
      };

      try {
        this.synthesis.speak(this.currentUtterance);
      } catch (error) {
        console.error('Error speaking:', error);
        resolve();
      }
    });
  }

  /**
   * 🎉 Play celebration sound effect - Ta-da!
   * Happy ascending notes
   */
  playSuccessSound() {
    if (!this.audioContext) return;

    try {
      const now = this.audioContext.currentTime;
      
      // C major chord arpeggio: C - E - G - C (higher)
      const notes = [
        { freq: 523.25, time: 0.0, duration: 0.15 },   // C5
        { freq: 659.25, time: 0.12, duration: 0.15 },  // E5
        { freq: 783.99, time: 0.24, duration: 0.15 },  // G5
        { freq: 1046.50, time: 0.36, duration: 0.25 }  // C6
      ];

      notes.forEach(note => {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(note.freq, now + note.time);
        
        gainNode.gain.setValueAtTime(0, now + note.time);
        gainNode.gain.linearRampToValueAtTime(0.3, now + note.time + 0.02);
        gainNode.gain.linearRampToValueAtTime(0.2, now + note.time + note.duration * 0.7);
        gainNode.gain.linearRampToValueAtTime(0, now + note.time + note.duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start(now + note.time);
        oscillator.stop(now + note.time + note.duration);

        // Add sparkle
        const sparkle = this.audioContext.createOscillator();
        const sparkleGain = this.audioContext.createGain();
        
        sparkle.type = 'sine';
        sparkle.frequency.setValueAtTime(note.freq * 2, now + note.time);
        sparkleGain.gain.setValueAtTime(0, now + note.time);
        sparkleGain.gain.linearRampToValueAtTime(0.1, now + note.time + 0.02);
        sparkleGain.gain.linearRampToValueAtTime(0, now + note.time + note.duration);
        
        sparkle.connect(sparkleGain);
        sparkleGain.connect(this.audioContext.destination);
        
        sparkle.start(now + note.time);
        sparkle.stop(now + note.time + note.duration);
      });

    } catch (error) {
      console.error('Error playing success sound:', error);
    }
  }

  /**
   * 📉 Play "give up" sound - Sad Trombone (wenk wenk wenk)
   */
  playGiveUpSound() {
    if (!this.audioContext) return;

    try {
      const now = this.audioContext.currentTime;
      
      // Sad trombone: descending sliding notes
      const notes = [
        { startFreq: 440, endFreq: 415, time: 0.0, duration: 0.25 },
        { startFreq: 392, endFreq: 370, time: 0.22, duration: 0.25 },
        { startFreq: 349, endFreq: 330, time: 0.44, duration: 0.25 },
        { startFreq: 311, endFreq: 277, time: 0.66, duration: 0.35 }
      ];

      notes.forEach((note, index) => {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sawtooth'; // Brass-like sound
        
        // Slide down (wenk effect)
        oscillator.frequency.setValueAtTime(note.startFreq, now + note.time);
        oscillator.frequency.exponentialRampToValueAtTime(
          note.endFreq, 
          now + note.time + note.duration
        );
        
        const volume = 0.25 - (index * 0.03);
        gainNode.gain.setValueAtTime(0, now + note.time);
        gainNode.gain.linearRampToValueAtTime(volume, now + note.time + 0.03);
        gainNode.gain.linearRampToValueAtTime(volume * 0.7, now + note.time + note.duration * 0.6);
        gainNode.gain.linearRampToValueAtTime(0, now + note.time + note.duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start(now + note.time);
        oscillator.stop(now + note.time + note.duration);

        // Add bass on last note
        if (index === notes.length - 1) {
          const bass = this.audioContext.createOscillator();
          const bassGain = this.audioContext.createGain();
          
          bass.type = 'sine';
          bass.frequency.setValueAtTime(note.endFreq * 0.5, now + note.time);
          bassGain.gain.setValueAtTime(0, now + note.time);
          bassGain.gain.linearRampToValueAtTime(0.15, now + note.time + 0.05);
          bassGain.gain.linearRampToValueAtTime(0, now + note.time + note.duration);
          
          bass.connect(bassGain);
          bassGain.connect(this.audioContext.destination);
          
          bass.start(now + note.time);
          bass.stop(now + note.time + note.duration);
        }
      });

    } catch (error) {
      console.error('Error playing give up sound:', error);
    }
  }

  playEncouragement(message) {
    this.speakWord(message, { voiceType: 'friendly', rate: 0.9 });
  }

  stop() {
    if (this.synthesis && this.synthesis.speaking) {
      this.synthesis.cancel();
    }
  }

  isAvailable() {
    return !!this.synthesis || !!this.audioContext;
  }
}

const vanishingAudioService = new VanishingAudioService();
export default vanishingAudioService;