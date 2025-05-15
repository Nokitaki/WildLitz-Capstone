// src/services/vanishingGameService.js
const API_URL = 'http://127.0.0.1:8000/api';

/**
 * Generate words for the vanishing game using AI
 * @param {Object} config - Game configuration
 * @param {string} config.challengeLevel - Type of content (simple_words, compound_words, etc.)
 * @param {string} config.learningFocus - Phonics focus (short_vowels, long_vowels, etc.)
 * @param {string} config.difficulty - Difficulty level (easy, medium, hard)
 * @param {number} wordCount - Number of words to generate
 * @returns {Promise} - Promise resolving to generated words
 */
export const generateVanishingGameWords = async (config, wordCount = 10) => {
  try {
    const response = await fetch(`${API_URL}/phonics/generate-vanishing-words/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        challengeLevel: config.challengeLevel,
        learningFocus: config.learningFocus,
        difficulty: config.difficulty,
        wordCount: wordCount
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate words: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error('AI word generation failed');
    }
    
    return data.words;
  } catch (error) {
    console.error('Error generating words:', error);
    
    // Return fallback words if API call fails
    return getFallbackWords(config, wordCount);
  }
};

/**
 * Fallback words in case AI generation fails
 */
const getFallbackWords = (config, wordCount) => {
  const { challengeLevel, learningFocus } = config;
  
  const fallbackWords = {
    simple_words: {
      short_vowels: [
        { word: 'cat', pattern: 'a', patternPosition: 'middle', phonicsRule: 'Short a sound as in apple', syllableBreakdown: 'cat', syllableCount: 1, category: 'Animals' },
        { word: 'bed', pattern: 'e', patternPosition: 'middle', phonicsRule: 'Short e sound as in egg', syllableBreakdown: 'bed', syllableCount: 1, category: 'Objects' },
        { word: 'sit', pattern: 'i', patternPosition: 'middle', phonicsRule: 'Short i sound as in igloo', syllableBreakdown: 'sit', syllableCount: 1, category: 'Actions' },
        { word: 'dog', pattern: 'o', patternPosition: 'middle', phonicsRule: 'Short o sound as in octopus', syllableBreakdown: 'dog', syllableCount: 1, category: 'Animals' },
        { word: 'sun', pattern: 'u', patternPosition: 'middle', phonicsRule: 'Short u sound as in umbrella', syllableBreakdown: 'sun', syllableCount: 1, category: 'Objects' }
      ],
      long_vowels: [
        { word: 'cake', pattern: 'a', patternPosition: 'middle', phonicsRule: 'Long a sound says its name', syllableBreakdown: 'cake', syllableCount: 1, category: 'Food' },
        { word: 'feet', pattern: 'e', patternPosition: 'middle', phonicsRule: 'Long e sound says its name', syllableBreakdown: 'feet', syllableCount: 1, category: 'Body' },
        { word: 'bike', pattern: 'i', patternPosition: 'middle', phonicsRule: 'Long i sound says its name', syllableBreakdown: 'bike', syllableCount: 1, category: 'Objects' },
        { word: 'rope', pattern: 'o', patternPosition: 'middle', phonicsRule: 'Long o sound says its name', syllableBreakdown: 'rope', syllableCount: 1, category: 'Objects' },
        { word: 'cute', pattern: 'u', patternPosition: 'middle', phonicsRule: 'Long u sound says its name', syllableBreakdown: 'cute', syllableCount: 1, category: 'General' }
      ],
      blends: [
        { word: 'stop', pattern: 'st', patternPosition: 'beginning', phonicsRule: 'ST blend combines s and t sounds', syllableBreakdown: 'stop', syllableCount: 1, category: 'Actions' },
        { word: 'flag', pattern: 'fl', patternPosition: 'beginning', phonicsRule: 'FL blend combines f and l sounds', syllableBreakdown: 'flag', syllableCount: 1, category: 'Objects' },
        { word: 'clip', pattern: 'cl', patternPosition: 'beginning', phonicsRule: 'CL blend combines c and l sounds', syllableBreakdown: 'clip', syllableCount: 1, category: 'Actions' },
        { word: 'trip', pattern: 'tr', patternPosition: 'beginning', phonicsRule: 'TR blend combines t and r sounds', syllableBreakdown: 'trip', syllableCount: 1, category: 'Actions' },
        { word: 'grab', pattern: 'gr', patternPosition: 'beginning', phonicsRule: 'GR blend combines g and r sounds', syllableBreakdown: 'grab', syllableCount: 1, category: 'Actions' }
      ],
      digraphs: [
        { word: 'ship', pattern: 'sh', patternPosition: 'beginning', phonicsRule: 'SH makes a single shushing sound', syllableBreakdown: 'ship', syllableCount: 1, category: 'Objects' },
        { word: 'chip', pattern: 'ch', patternPosition: 'beginning', phonicsRule: 'CH makes a single chomping sound', syllableBreakdown: 'chip', syllableCount: 1, category: 'Food' },
        { word: 'this', pattern: 'th', patternPosition: 'beginning', phonicsRule: 'TH makes a soft or hard sound', syllableBreakdown: 'this', syllableCount: 1, category: 'General' },
        { word: 'when', pattern: 'wh', patternPosition: 'beginning', phonicsRule: 'WH makes a breathy w sound', syllableBreakdown: 'when', syllableCount: 1, category: 'General' },
        { word: 'fish', pattern: 'sh', patternPosition: 'ending', phonicsRule: 'SH makes a single shushing sound', syllableBreakdown: 'fish', syllableCount: 1, category: 'Animals' }
      ]
    },
    compound_words: {
      short_vowels: [
        { word: 'sunhat', pattern: 'u', patternPosition: 'first', phonicsRule: 'Short u sound in compound word', syllableBreakdown: 'sun-hat', syllableCount: 2, category: 'Objects' },
        { word: 'catfish', pattern: 'a', patternPosition: 'first', phonicsRule: 'Short a sound in compound word', syllableBreakdown: 'cat-fish', syllableCount: 2, category: 'Animals' }
      ],
      long_vowels: [
        { word: 'beehive', pattern: 'e', patternPosition: 'first', phonicsRule: 'Long e sound in compound word', syllableBreakdown: 'bee-hive', syllableCount: 2, category: 'Objects' },
        { word: 'rainbow', pattern: 'a', patternPosition: 'first', phonicsRule: 'Long a sound in compound word', syllableBreakdown: 'rain-bow', syllableCount: 2, category: 'Objects' }
      ]
    },
    phrases: {
      short_vowels: [
        { word: 'red pen', pattern: 'e', patternPosition: 'first', phonicsRule: 'Short e sound in phrase', syllableBreakdown: 'red pen', syllableCount: 2, category: 'Objects' },
        { word: 'big cat', pattern: 'i', patternPosition: 'first', phonicsRule: 'Short i sound in phrase', syllableBreakdown: 'big cat', syllableCount: 2, category: 'Animals' }
      ],
      blends: [
        { word: 'stop sign', pattern: 'st', patternPosition: 'first', phonicsRule: 'ST blend in phrase', syllableBreakdown: 'stop sign', syllableCount: 2, category: 'Objects' },
        { word: 'blue sky', pattern: 'bl', patternPosition: 'first', phonicsRule: 'BL blend in phrase', syllableBreakdown: 'blue sky', syllableCount: 2, category: 'Objects' }
      ]
    },
    simple_sentences: {
      short_vowels: [
        { word: 'The cat sat on the mat.', pattern: 'a', patternPosition: 'multiple', phonicsRule: 'Short a appears multiple times', syllableBreakdown: 'The cat sat on the mat', syllableCount: 6, category: 'Sentences' }
      ],
      blends: [
        { word: 'Stop at the red light.', pattern: 'st', patternPosition: 'beginning', phonicsRule: 'ST blend starts the sentence', syllableBreakdown: 'Stop at the red light', syllableCount: 5, category: 'Sentences' }
      ]
    }
  };
  
  const words = fallbackWords[challengeLevel]?.[learningFocus] || fallbackWords.simple_words.short_vowels;
  
  // Repeat words to meet the requested count
  const result = [];
  for (let i = 0; i < wordCount; i++) {
    const word = words[i % words.length];
    result.push({
      ...word,
      challengeLevel,
      learningFocus,
      isAiGenerated: false,
      isFallback: true
    });
  }
  
  return result;
};

export default {
  generateVanishingGameWords
};