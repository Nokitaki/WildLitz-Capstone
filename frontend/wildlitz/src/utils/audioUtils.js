// src/utils/audioUtils.js - CLEANED VERSION

/**
 * Play audio from various sources with fallback options
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.text - Text to speak if no audio is available
 * @param {string} options.audioData - Base64 audio data
 * @param {string} options.audioUrl - URL to audio file
 * @param {Object} options.apiOptions - Options for API call
 * @param {Function} options.onStart - Callback when audio starts playing
 * @param {Function} options.onEnd - Callback when audio ends playing
 * @param {Function} options.onError - Callback on error
 */
export const playAudio = async ({
  text,
  audioData,
  audioUrl,
  apiOptions = { text: null, voice: 'nova' },
  onStart = () => {},
  onEnd = () => {},
  onError = (err) => console.error(err)
}) => {
  try {
    onStart();
    
    // Option 1: Use provided base64 audio data
    if (audioData) {
      const audio = new Audio(audioData);
      audio.onended = onEnd;
      await audio.play();
      return;
    }
    
    // Option 2: Use provided audio URL
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.onended = onEnd;
      await audio.play();
      return;
    }
    
    // Option 3: Use API if text is provided in options
    if (apiOptions.text) {
      try {
        const response = await fetch('/api/syllabification/text-to-speech/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: apiOptions.text,
            voice: apiOptions.voice
          })
        });
        
        const data = await response.json();
        
        if (data.success && data.audio_data) {
          const audio = new Audio(`data:audio/mp3;base64,${data.audio_data}`);
          audio.onended = onEnd;
          await audio.play();
          return;
        }
      } catch (apiError) {
        console.error("API TTS error:", apiError);
        // Continue to browser fallback
      }
    }
    
    // Option 4: Fallback to browser speech synthesis
    if (text && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.onend = onEnd;
      window.speechSynthesis.speak(utterance);
      return;
    }
    
    // If all options fail, call the onEnd callback anyway
    onEnd();
    
  } catch (error) {
    onError(error);
    
    // Try browser speech as last resort
    if (text && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.8;
        utterance.onend = onEnd;
        window.speechSynthesis.speak(utterance);
      } catch (speechError) {
        console.error("Speech synthesis error:", speechError);
        onEnd(); // Ensure onEnd is called even if everything fails
      }
    } else {
      onEnd(); // Ensure onEnd is called even if everything fails
    }
  }
};

/**
 * Format base64 audio data to ensure it's playable
 * 
 * @param {string} base64data - The base64 encoded audio data
 * @returns {string} - Properly formatted base64 data URI
 */
export const formatBase64Audio = (base64data) => {
  // Check if it's already a data URI
  if (base64data.startsWith('data:')) {
    return base64data;
  }
  
  // Add the proper MIME type prefix for audio
  return `data:audio/mp3;base64,${base64data.replace(/^data:audio\/(mp3|wav|ogg);base64,/, '')}`;
};

/**
 * Get syllable count from word data
 * 
 * @param {Object} word - The word object
 * @returns {number} - The number of syllables
 */
export const getSyllableCount = (word) => {
  if (!word) return 0;
  
  // First check if the feedback contains the correct count
  if (word.feedback && word.feedback.correct_count) {
    return word.feedback.correct_count;
  }
  
  // For custom words, use the syllable count provided by the user
  if (word.isCustomWord && word.syllableCount) {
    return word.syllableCount;
  }
  
  // For other cases, check if count is directly available
  if (word.count) {
    return word.count;
  }
  
  // If we have syllable breakdown, count the hyphens and add 1
  if (word.syllableBreakdown && word.syllableBreakdown.includes('-')) {
    return (word.syllableBreakdown.match(/-/g) || []).length + 1;
  }
  
  if (word.syllables && word.syllables.includes('-')) {
    return (word.syllables.match(/-/g) || []).length + 1;
  }
  
  // If no information is available, default to 1
  return 1;
};

/**
 * Break word into syllables based on provided breakdown
 * 
 * @param {string} word - The word to break down
 * @param {string} syllableBreakdown - The syllable breakdown string
 * @returns {Array} - Array of syllables
 */
export const breakIntoSyllables = (word, syllableBreakdown) => {
  if (!word) return [];
  if (!syllableBreakdown) return [word];
  
  // If the syllable breakdown contains hyphens, split by those
  if (syllableBreakdown.includes('-')) {
    return syllableBreakdown.split('-');
  } 
  
  // If no hyphens but we have the word, return the whole word
  return [word];
};