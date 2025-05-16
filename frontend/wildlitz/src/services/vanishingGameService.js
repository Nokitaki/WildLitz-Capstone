// Updated vanishingGameService.js with optimizations
const API_URL = 'http://127.0.0.1:8000/api';

/**
 * Generate words for the vanishing game using AI with optimizations
 */
export const generateVanishingGameWords = async (config, wordCount = 10) => {
  try {
    // For smaller numbers, generate immediately
    if (wordCount <= 10) {
      return await generateWordsImmediate(config, wordCount);
    }
    
    // For larger numbers, generate in batches
    return await generateWordsInBatches(config, wordCount);
  } catch (error) {
    console.error('Error generating words:', error);
    return getFallbackWords(config, wordCount);
  }
};

/**
 * Generate words immediately for smaller requests
 */
const generateWordsImmediate = async (config, wordCount) => {
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
};

/**
 * Generate words in smaller batches for better performance
 */
const generateWordsInBatches = async (config, wordCount) => {
  const batchSize = 5;
  const batches = Math.ceil(wordCount / batchSize);
  const allWords = [];
  
  for (let i = 0; i < batches; i++) {
    const remainingWords = wordCount - (i * batchSize);
    const currentBatchSize = Math.min(batchSize, remainingWords);
    
    const batchWords = await generateWordsImmediate(config, currentBatchSize);
    allWords.push(...batchWords);
    
    // Small delay between batches to prevent overwhelming the API
    if (i < batches - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return allWords;
};

/**
 * Pre-generate words with caching (Future enhancement)
 */
export const preGenerateWords = async (config) => {
  const cacheKey = `${config.challengeLevel}-${config.learningFocus}-${config.difficulty}`;
  
  // Check if words are already cached
  const cached = localStorage.getItem(`vanishing_words_${cacheKey}`);
  if (cached) {
    try {
      const cachedWords = JSON.parse(cached);
      if (cachedWords.timestamp > Date.now() - 24 * 60 * 60 * 1000) { // 24 hours
        return cachedWords.words;
      }
    } catch (e) {
      console.error('Error parsing cached words:', e);
    }
  }
  
  // Generate new words
  const words = await generateVanishingGameWords(config, 20); // Pre-generate 20 words
  
  // Cache the results
  localStorage.setItem(`vanishing_words_${cacheKey}`, JSON.stringify({
    words,
    timestamp: Date.now()
  }));
  
  return words;
};

/**
 * Enhanced fallback with more words
 */
const getFallbackWords = (config, wordCount) => {
  // Your existing fallback logic remains the same
  // ... (keeping the existing implementation)
};