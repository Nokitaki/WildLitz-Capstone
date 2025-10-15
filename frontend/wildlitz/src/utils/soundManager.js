// src/utils/soundManager.js

// Import audio files at the top
import correctSoundFile from "../assets/sound_effects/correct_soundEffect.mp3";
import yeheySoundFile from "../assets/sound_effects/yehey.mp3";
import wrongSoundFile from "../assets/sound_effects/wrong_soundEffect.mp3";
import uhOhSoundFile from "../assets/sound_effects/Uh_oh.mp3"; // 🔊 NEW

class SoundManager {
  constructor() {
    // Initialize audio objects for each sound effect
    this.sounds = {
      correct: null,
      yehey: null,
      wrong: null,
      uhOh: null, // 🔊 NEW
    };

    // Default volume (0.0 to 1.0)
    this.volume = 0.6;

    // Track if sounds are loaded
    this.isLoaded = false;
  }

  /**
   * Load all sound effects
   * Call this once when your component mounts
   */
  loadSounds() {
    try {
      // Create Audio objects for each sound effect using imported files
      this.sounds.correct = new Audio(correctSoundFile);
      this.sounds.yehey = new Audio(yeheySoundFile);
      this.sounds.wrong = new Audio(wrongSoundFile);
      this.sounds.uhOh = new Audio(uhOhSoundFile); // 🔊 NEW

      // Set volume for all sounds
      Object.values(this.sounds).forEach((sound) => {
        if (sound) {
          sound.volume = this.volume;
        }
      });

      this.isLoaded = true;
      console.log("✅ Sound effects loaded successfully");
    } catch (error) {
      console.error("❌ Error loading sound effects:", error);
      this.isLoaded = false;
    }
  }

  /**
   * Play sound for correct answer
   * Plays both correct_soundEffect and yehey
   */
  playCorrectSound() {
    if (!this.isLoaded) {
      console.warn("Sounds not loaded yet");
      return;
    }

    try {
      // Play correct sound effect
      if (this.sounds.correct) {
        this.sounds.correct.currentTime = 0; // Reset to start
        this.sounds.correct.play().catch((err) => {
          console.error("Error playing correct sound:", err);
        });
      }

      // Play yehey sound after a short delay (250ms)
      setTimeout(() => {
        if (this.sounds.yehey) {
          this.sounds.yehey.currentTime = 0; // Reset to start
          this.sounds.yehey.play().catch((err) => {
            console.error("Error playing yehey sound:", err);
          });
        }
      }, 250);
    } catch (error) {
      console.error("Error in playCorrectSound:", error);
    }
  }

  /**
   * Play sound for wrong answer
   * Plays both wrong_soundEffect and Uh_oh
   */
  playWrongSound() {
    if (!this.isLoaded) {
      console.warn("Sounds not loaded yet");
      return;
    }

    try {
      // Play wrong sound effect
      if (this.sounds.wrong) {
        this.sounds.wrong.currentTime = 0; // Reset to start
        this.sounds.wrong.play().catch((err) => {
          console.error("Error playing wrong sound:", err);
        });
      }

      // Play Uh_oh sound after a short delay (250ms)
      setTimeout(() => {
        if (this.sounds.uhOh) {
          this.sounds.uhOh.currentTime = 0; // Reset to start
          this.sounds.uhOh.play().catch((err) => {
            console.error("Error playing Uh_oh sound:", err);
          });
        }
      }, 250);
    } catch (error) {
      console.error("Error in playWrongSound:", error);
    }
  }

  /**
   * Set volume for all sounds (0.0 to 1.0)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1
    
    Object.values(this.sounds).forEach((sound) => {
      if (sound) {
        sound.volume = this.volume;
      }
    });
  }

  /**
   * Stop all currently playing sounds
   */
  stopAll() {
    Object.values(this.sounds).forEach((sound) => {
      if (sound) {
        sound.pause();
        sound.currentTime = 0;
      }
    });
  }
}

// Create and export a singleton instance
const soundManager = new SoundManager();
export default soundManager;