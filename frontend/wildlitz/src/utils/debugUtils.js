// Add this utility function for audio debugging to a new file: src/utils/debugUtils.js

/**
 * Safely logs audio data objects to the console without causing browser slowdowns
 * from very large data dumps
 * 
 * @param {string} prefix - Descriptive prefix for the log
 * @param {object} wordObj - The word object containing audio data
 */
export const logAudioDebug = (prefix, wordObj) => {
    // Create a safe copy for logging
    const safeCopy = {...wordObj};
    
    // Truncate any audio data
    if (safeCopy.customAudio) {
      const audioLength = safeCopy.customAudio.length;
      safeCopy.customAudio = `[Audio data: ${audioLength} chars, starts with: ${safeCopy.customAudio.substring(0, 30)}...]`;
    }
    
    // Add debugging info
    safeCopy._debugInfo = {
      hasUsesCustomAudioFlag: typeof wordObj.usesCustomAudio === 'boolean',
      usesCustomAudioValue: wordObj.usesCustomAudio,
      hasAudioData: !!wordObj.customAudio,
      audioDataType: wordObj.customAudio ? typeof wordObj.customAudio : 'none',
      audioDataLength: wordObj.customAudio ? wordObj.customAudio.length : 0,
      isValidAudioFormat: wordObj.customAudio && (
        wordObj.customAudio.startsWith('data:audio') || 
        wordObj.customAudio.startsWith('data:application/octet-stream') ||
        wordObj.customAudio.startsWith('blob:')
      )
    };
    
    // Log the safe object
    console.log(`${prefix}:`, safeCopy);
  };
  
  // Add a function to add script debug tools to the page
  export const injectDebugTools = () => {
    if (process.env.NODE_ENV === 'development') {
      window.debugWildLitz = {
        // Get all custom words from localStorage
        getCustomWords: () => {
          try {
            const saved = localStorage.getItem('wildlitz_custom_words');
            if (saved) {
              const words = JSON.parse(saved);
              return words.map(word => ({
                ...word,
                customAudio: word.customAudio ? `[${word.customAudio.length} chars]` : null
              }));
            }
            return 'No custom words found';
          } catch (e) {
            return `Error: ${e.message}`;
          }
        },
        
        // Test playing custom audio
        testAudio: (index = 0) => {
          try {
            const saved = localStorage.getItem('wildlitz_custom_words');
            if (saved) {
              const words = JSON.parse(saved);
              if (words[index] && words[index].customAudio) {
                const audio = new Audio(words[index].customAudio);
                audio.onerror = (e) => console.error('Audio error:', e);
                audio.onplay = () => console.log('Audio started playing');
                audio.onended = () => console.log('Audio finished playing');
                audio.play();
                return `Playing audio for word: ${words[index].word}`;
              }
              return `No audio found for word at index ${index}`;
            }
            return 'No custom words found';
          } catch (e) {
            return `Error: ${e.message}`;
          }
        },
        
        // Clear custom words
        clearCustomWords: () => {
          localStorage.removeItem('wildlitz_custom_words');
          return 'Custom words cleared from localStorage';
        }
      };
      
      console.log('WildLitz debug tools injected. Use window.debugWildLitz to access them.');
    }
  };
  
  // Add this debugging injection to your App.jsx's useEffect