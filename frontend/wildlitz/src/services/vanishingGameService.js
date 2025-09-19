// AI-Enabled vanishingGameService.js - Full AI Integration
const API_URL = 'http://127.0.0.1:8000/api';

/**
 * Generate words for the vanishing game using AI with robust fallback
 */
export const generateVanishingGameWords = async (config, wordCount = 10) => {
  console.log('🤖 AI ENABLED: Generating words with OpenAI');
  console.log('Config:', config);
  console.log('Word count requested:', wordCount);
  
  try {
    // For smaller numbers, generate immediately
    if (wordCount <= 10) {
      return await generateWordsImmediate(config, wordCount);
    }
    
    // For larger numbers, generate in batches
    return await generateWordsInBatches(config, wordCount);
  } catch (error) {
    console.error('🚨 AI generation failed, using fallback:', error);
    return getFallbackWords(config, wordCount);
  }
};

/**
 * Generate words immediately for smaller requests using AI
 */
const generateWordsImmediate = async (config, wordCount) => {
  try {
    console.log('🔥 Calling AI API with:', {
      challengeLevel: config.challengeLevel,
      learningFocus: config.learningFocus,
      difficulty: config.difficulty,
      wordCount: wordCount
    });
    
    const startTime = Date.now();
    
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
    
    const responseTime = Date.now() - startTime;
    console.log(`⚡ API Response received in ${responseTime}ms`);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error response:', errorText);
      throw new Error(`HTTP ${response.status}: Failed to generate words - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ AI Response data:', {
      success: data.success,
      wordCount: data.words?.length,
      aiGenerated: data.ai_generated,
      config: data.config
    });
    
    // Enhanced validation
    if (!data || !data.success) {
      throw new Error(`AI generation failed: ${data.error || 'Unknown error'}`);
    }
    
    if (!data.words || !Array.isArray(data.words) || data.words.length === 0) {
      throw new Error('AI generation failed - no valid words received');
    }
    
    // Validate each word structure
    const validatedWords = data.words.filter(word => {
      const isValid = word && 
                     typeof word.word === 'string' && 
                     typeof word.syllableBreakdown === 'string' &&
                     typeof word.definition === 'string';
      
      if (!isValid) {
        console.warn('⚠️  Invalid word structure:', word);
      }
      return isValid;
    });
    
    if (validatedWords.length === 0) {
      throw new Error('No valid words received from AI');
    }
    
    console.log(`🎉 Successfully generated ${validatedWords.length} AI words!`);
    console.log('Sample word:', validatedWords[0]);
    
    return validatedWords;
  } catch (error) {
    console.error('🚨 generateWordsImmediate error:', error);
    throw error; // Re-throw so the main function can handle with fallback
  }
};

/**
 * Generate words in smaller batches for better performance
 */
const generateWordsInBatches = async (config, wordCount) => {
  console.log(`🔄 Generating ${wordCount} words in batches`);
  
  const batchSize = 5;
  const batches = Math.ceil(wordCount / batchSize);
  const allWords = [];
  
  for (let i = 0; i < batches; i++) {
    const remainingWords = wordCount - (i * batchSize);
    const currentBatchSize = Math.min(batchSize, remainingWords);
    
    console.log(`📦 Processing batch ${i + 1}/${batches} (${currentBatchSize} words)`);
    
    try {
      const batchWords = await generateWordsImmediate(config, currentBatchSize);
      allWords.push(...batchWords);
      
      // Small delay between batches to prevent overwhelming the API
      if (i < batches - 1) {
        console.log('⏳ Waiting before next batch...');
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`❌ Batch ${i + 1} failed:`, error);
      // If a batch fails, add fallback words for that batch
      const fallbackBatch = getFallbackWords(config, currentBatchSize);
      allWords.push(...fallbackBatch);
    }
  }
  
  console.log(`✅ Batch generation complete: ${allWords.length} total words`);
  return allWords;
};

/**
 * Pre-generate words with caching
 */
export const preGenerateWords = async (config) => {
  const cacheKey = `${config.challengeLevel}-${config.learningFocus}-${config.difficulty}`;
  
  // Check if words are already cached
  const cached = localStorage.getItem(`vanishing_words_${cacheKey}`);
  if (cached) {
    try {
      const cachedWords = JSON.parse(cached);
      if (cachedWords.timestamp > Date.now() - 24 * 60 * 60 * 1000) { // 24 hours
        console.log('📋 Using cached AI words');
        return cachedWords.words;
      }
    } catch (e) {
      console.error('Error parsing cached words:', e);
    }
  }
  
  // Generate new words
  console.log('🔄 Pre-generating and caching words...');
  const words = await generateVanishingGameWords(config, 20); // Pre-generate 20 words
  
  // Cache the results
  localStorage.setItem(`vanishing_words_${cacheKey}`, JSON.stringify({
    words,
    timestamp: Date.now()
  }));
  
  return words;
};

/**
 * Enhanced fallback with more words - COMPLETE IMPLEMENTATION
 */
const getFallbackWords = (config, wordCount) => {
  console.warn('🔄 Using fallback words due to AI generation failure');
  
  // Define fallback word sets based on configuration
  const fallbackSets = {
    simple_words: {
      short_vowels: [
        { word: 'cat', syllableBreakdown: 'cat', targetLetter: 'a', definition: 'A small furry pet', pattern: 'short_a', patternPosition: 'middle', phonicsRule: "Short vowel 'a' makes the sound like in 'apple'" },
        { word: 'dog', syllableBreakdown: 'dog', targetLetter: 'o', definition: 'A friendly pet that barks', pattern: 'short_o', patternPosition: 'middle', phonicsRule: "Short vowel 'o' makes the sound like in 'octopus'" },
        { word: 'sun', syllableBreakdown: 'sun', targetLetter: 'u', definition: 'A bright star in the sky', pattern: 'short_u', patternPosition: 'middle', phonicsRule: "Short vowel 'u' makes the sound like in 'umbrella'" },
        { word: 'pen', syllableBreakdown: 'pen', targetLetter: 'e', definition: 'Used for writing', pattern: 'short_e', patternPosition: 'middle', phonicsRule: "Short vowel 'e' makes the sound like in 'egg'" },
        { word: 'sit', syllableBreakdown: 'sit', targetLetter: 'i', definition: 'To rest on a chair', pattern: 'short_i', patternPosition: 'middle', phonicsRule: "Short vowel 'i' makes the sound like in 'igloo'" },
        { word: 'run', syllableBreakdown: 'run', targetLetter: 'u', definition: 'To move fast on foot', pattern: 'short_u', patternPosition: 'middle', phonicsRule: "Short vowel 'u' makes the sound like in 'umbrella'" },
        { word: 'hat', syllableBreakdown: 'hat', targetLetter: 'a', definition: 'Something you wear on your head', pattern: 'short_a', patternPosition: 'middle', phonicsRule: "Short vowel 'a' makes the sound like in 'apple'" },
        { word: 'bed', syllableBreakdown: 'bed', targetLetter: 'e', definition: 'Where you sleep', pattern: 'short_e', patternPosition: 'middle', phonicsRule: "Short vowel 'e' makes the sound like in 'egg'" },
        { word: 'big', syllableBreakdown: 'big', targetLetter: 'i', definition: 'Very large', pattern: 'short_i', patternPosition: 'middle', phonicsRule: "Short vowel 'i' makes the sound like in 'igloo'" },
        { word: 'hot', syllableBreakdown: 'hot', targetLetter: 'o', definition: 'Very warm', pattern: 'short_o', patternPosition: 'middle', phonicsRule: "Short vowel 'o' makes the sound like in 'octopus'" },
        { word: 'cup', syllableBreakdown: 'cup', targetLetter: 'u', definition: 'Used for drinking', pattern: 'short_u', patternPosition: 'middle', phonicsRule: "Short vowel 'u' makes the sound like in 'umbrella'" },
        { word: 'bag', syllableBreakdown: 'bag', targetLetter: 'a', definition: 'Used to carry things', pattern: 'short_a', patternPosition: 'middle', phonicsRule: "Short vowel 'a' makes the sound like in 'apple'" },
        { word: 'red', syllableBreakdown: 'red', targetLetter: 'e', definition: 'A bright color', pattern: 'short_e', patternPosition: 'middle', phonicsRule: "Short vowel 'e' makes the sound like in 'egg'" },
        { word: 'win', syllableBreakdown: 'win', targetLetter: 'i', definition: 'To be first in a game', pattern: 'short_i', patternPosition: 'middle', phonicsRule: "Short vowel 'i' makes the sound like in 'igloo'" },
        { word: 'box', syllableBreakdown: 'box', targetLetter: 'o', definition: 'A container for things', pattern: 'short_o', patternPosition: 'middle', phonicsRule: "Short vowel 'o' makes the sound like in 'octopus'" }
      ],
      long_vowels: [
        { word: 'cake', syllableBreakdown: 'cake', targetLetter: 'a_e', definition: 'A sweet dessert', pattern: 'long_a', patternPosition: 'middle', phonicsRule: "Long vowel 'a' makes the name of the letter" },
        { word: 'bike', syllableBreakdown: 'bike', targetLetter: 'i_e', definition: 'Two-wheeled vehicle', pattern: 'long_i', patternPosition: 'middle', phonicsRule: "Long vowel 'i' makes the name of the letter" },
        { word: 'home', syllableBreakdown: 'home', targetLetter: 'o_e', definition: 'Where you live', pattern: 'long_o', patternPosition: 'middle', phonicsRule: "Long vowel 'o' makes the name of the letter" },
        { word: 'cute', syllableBreakdown: 'cute', targetLetter: 'u_e', definition: 'Very pretty or adorable', pattern: 'long_u', patternPosition: 'middle', phonicsRule: "Long vowel 'u' makes the name of the letter" },
        { word: 'kite', syllableBreakdown: 'kite', targetLetter: 'i_e', definition: 'Flies high in the sky', pattern: 'long_i', patternPosition: 'middle', phonicsRule: "Long vowel 'i' makes the name of the letter" },
        { word: 'game', syllableBreakdown: 'game', targetLetter: 'a_e', definition: 'Something fun to play', pattern: 'long_a', patternPosition: 'middle', phonicsRule: "Long vowel 'a' makes the name of the letter" },
        { word: 'bone', syllableBreakdown: 'bone', targetLetter: 'o_e', definition: 'Hard part inside your body', pattern: 'long_o', patternPosition: 'middle', phonicsRule: "Long vowel 'o' makes the name of the letter" },
        { word: 'tune', syllableBreakdown: 'tune', targetLetter: 'u_e', definition: 'A song or melody', pattern: 'long_u', patternPosition: 'middle', phonicsRule: "Long vowel 'u' makes the name of the letter" },
        { word: 'make', syllableBreakdown: 'make', targetLetter: 'a_e', definition: 'To create something', pattern: 'long_a', patternPosition: 'middle', phonicsRule: "Long vowel 'a' makes the name of the letter" },
        { word: 'time', syllableBreakdown: 'time', targetLetter: 'i_e', definition: 'Hours and minutes', pattern: 'long_i', patternPosition: 'middle', phonicsRule: "Long vowel 'i' makes the name of the letter" }
      ],
      blends: [
        { word: 'stop', syllableBreakdown: 'stop', targetLetter: 'st', definition: 'To quit moving', pattern: 'st_blend', patternPosition: 'beginning', phonicsRule: "The blend 'st' combines the 's' and 't' sounds" },
        { word: 'plan', syllableBreakdown: 'plan', targetLetter: 'pl', definition: 'To think ahead', pattern: 'pl_blend', patternPosition: 'beginning', phonicsRule: "The blend 'pl' combines the 'p' and 'l' sounds" },
        { word: 'frog', syllableBreakdown: 'frog', targetLetter: 'fr', definition: 'Green animal that jumps', pattern: 'fr_blend', patternPosition: 'beginning', phonicsRule: "The blend 'fr' combines the 'f' and 'r' sounds" },
        { word: 'tree', syllableBreakdown: 'tree', targetLetter: 'tr', definition: 'Tall plant with leaves', pattern: 'tr_blend', patternPosition: 'beginning', phonicsRule: "The blend 'tr' combines the 't' and 'r' sounds" },
        { word: 'blue', syllableBreakdown: 'blue', targetLetter: 'bl', definition: 'Color of the sky', pattern: 'bl_blend', patternPosition: 'beginning', phonicsRule: "The blend 'bl' combines the 'b' and 'l' sounds" },
        { word: 'flag', syllableBreakdown: 'flag', targetLetter: 'fl', definition: 'Symbol of a country', pattern: 'fl_blend', patternPosition: 'beginning', phonicsRule: "The blend 'fl' combines the 'f' and 'l' sounds" }
      ]
    },
    compound_words: {
      short_vowels: [
        { word: 'sunset', syllableBreakdown: 'sun-set', targetLetter: 'compound', definition: 'When the sun goes down', pattern: 'compound_word', patternPosition: 'whole', phonicsRule: 'Two words joined together make a compound word' },
        { word: 'hotdog', syllableBreakdown: 'hot-dog', targetLetter: 'compound', definition: 'A sausage in a bun', pattern: 'compound_word', patternPosition: 'whole', phonicsRule: 'Two words joined together make a compound word' }
      ]
    },
    phrases: {
      short_vowels: [
        { word: 'big red hat', syllableBreakdown: 'big red hat', targetLetter: 'phrase', definition: 'A large hat that is red', pattern: 'descriptive_phrase', patternPosition: 'whole', phonicsRule: 'A phrase describes something with multiple words' }
      ]
    },
    simple_sentences: {
      short_vowels: [
        { word: 'The cat ran.', syllableBreakdown: 'The cat ran', targetLetter: 'sentence', definition: 'A sentence about a cat moving fast', pattern: 'simple_sentence', patternPosition: 'whole', phonicsRule: 'A sentence expresses a complete thought' }
      ]
    }
  };
  
  // Get the appropriate word set based on config
  const challengeSet = fallbackSets[config.challengeLevel] || fallbackSets.simple_words;
  const focusSet = challengeSet[config.learningFocus] || challengeSet.short_vowels || challengeSet[Object.keys(challengeSet)[0]];
  
  // Ensure we always return an array
  if (!Array.isArray(focusSet)) {
    console.error('Fallback set is not an array:', focusSet);
    return getEmergencyFallback(wordCount);
  }
  
  // Shuffle the array and take the requested number of words
  const shuffledWords = [...focusSet].sort(() => Math.random() - 0.5);
  
  // If we need more words than available, repeat the set
  const finalWords = [];
  for (let i = 0; i < wordCount; i++) {
    finalWords.push(shuffledWords[i % shuffledWords.length]);
  }
  
  console.log(`📋 Generated ${finalWords.length} fallback words`);
  return finalWords;
};

/**
 * Emergency fallback when everything else fails
 */
const getEmergencyFallback = (wordCount) => {
  console.error('🆘 Using emergency fallback words');
  
  const emergencyWords = [
    { word: 'cat', syllableBreakdown: 'cat', targetLetter: 'a', definition: 'A pet animal', pattern: 'short_a', patternPosition: 'middle', phonicsRule: "Short vowel 'a' sound" },
    { word: 'dog', syllableBreakdown: 'dog', targetLetter: 'o', definition: 'A friendly pet', pattern: 'short_o', patternPosition: 'middle', phonicsRule: "Short vowel 'o' sound" },
    { word: 'sun', syllableBreakdown: 'sun', targetLetter: 'u', definition: 'Star in the sky', pattern: 'short_u', patternPosition: 'middle', phonicsRule: "Short vowel 'u' sound" },
    { word: 'run', syllableBreakdown: 'run', targetLetter: 'u', definition: 'To move fast', pattern: 'short_u', patternPosition: 'middle', phonicsRule: "Short vowel 'u' sound" },
    { word: 'hat', syllableBreakdown: 'hat', targetLetter: 'a', definition: 'Worn on head', pattern: 'short_a', patternPosition: 'middle', phonicsRule: "Short vowel 'a' sound" }
  ];
  
  const result = [];
  for (let i = 0; i < wordCount; i++) {
    result.push(emergencyWords[i % emergencyWords.length]);
  }
  
  return result;
};