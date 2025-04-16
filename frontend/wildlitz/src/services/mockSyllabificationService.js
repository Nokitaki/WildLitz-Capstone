// mockSyllabificationService.js
// Mock API service for the syllable clapping game
import syllabificationWords, { 
    getRandomWordsByDifficulty, 
    getWordById, 
    getWordByText,
    getAllCategories 
  } from '../mock/mockSyllabificationData';
  
  class MockSyllabificationService {
    constructor() {
      this.delay = 800; // Simulate network delay in ms
    }
    
    // Change the simulated network delay
    setDelay(ms) {
      this.delay = ms;
    }
    
    // Helper to simulate async API calls
    async simulateApiCall(responseData, errorChance = 0) {
      // Simulate random failures if specified (for testing error handling)
      if (errorChance > 0 && Math.random() < errorChance) {
        await new Promise(resolve => setTimeout(resolve, this.delay));
        throw new Error('Simulated API failure');
      }
      
      // Otherwise return success after delay
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(responseData);
        }, this.delay);
      });
    }
    
    // Get a random word based on difficulty and categories
    async getWord(difficulty = 'medium', categories = []) {
      const words = getRandomWordsByDifficulty(difficulty, 1, [], categories);
      
      if (words.length === 0) {
        return this.simulateApiCall({
          error: 'No matching words found for the specified criteria'
        });
      }
      
      const word = words[0];
      return this.simulateApiCall({
        word: word.word,
        syllables: word.syllable_breakdown,
        count: word.syllable_count,
        category: word.category,
        animation_key: word.animation_key
      });
    }
    
    // Generate a batch of words
    async generateWords(difficulty = 'medium', count = 10, previousWords = [], categories = []) {
      const words = getRandomWordsByDifficulty(
        difficulty, 
        count, 
        previousWords, 
        categories
      );
      
      // Map the words to match the API response format
      const formattedWords = words.map(word => ({
        word: word.word,
        syllables: word.syllable_breakdown,
        count: word.syllable_count,
        category: word.category,
        animation_key: word.animation_key
      }));
      
      return this.simulateApiCall({ words: formattedWords });
    }
    
    // Check the user's syllable clapping
    async checkSyllableClapping(word, clap_count, is_custom = false, syllable_breakdown = null) {
      // Find the word in our database
      let wordData = getWordByText(word);
      
      // If it's a custom word or not found, use the provided breakdown
      if (is_custom || !wordData) {
        if (syllable_breakdown) {
          // Use the provided breakdown for custom words
          const syllable_count = (syllable_breakdown.match(/-/g) || []).length + 1;
          
          wordData = {
            word: word,
            syllable_breakdown: syllable_breakdown,
            syllable_count: syllable_count
          };
        } else {
          // Basic fallback if no data and no breakdown provided
          const syllable_count = this._countSyllables(word);
          wordData = {
            word: word,
            syllable_breakdown: word,
            syllable_count: syllable_count
          };
        }
      }
      
      // Compare user's clap count with actual syllable count
      const is_correct = parseInt(clap_count) === wordData.syllable_count;
      
      // Generate appropriate feedback
      let feedback;
      if (is_correct) {
        feedback = `Great job! "${word}" has ${wordData.syllable_count} syllable${wordData.syllable_count !== 1 ? 's' : ''}: ${wordData.syllable_breakdown}.`;
      } else {
        feedback = `Nice try! "${word}" actually has ${wordData.syllable_count} syllable${wordData.syllable_count !== 1 ? 's' : ''}: ${wordData.syllable_breakdown}. Try saying the word slowly and listen for each part.`;
        
        // Add extra feedback based on the difference
        if (clap_count > wordData.syllable_count) {
          feedback += " You clapped too many times. Remember, a syllable is a unit of pronunciation with one vowel sound.";
        } else {
          feedback += " You didn't clap enough times. Make sure to clap for each syllable you hear.";
        }
      }
      
      return this.simulateApiCall({
        is_correct: is_correct,
        correct_count: wordData.syllable_count,
        user_count: parseInt(clap_count),
        word: word,
        syllable_breakdown: wordData.syllable_breakdown,
        feedback: feedback
      });
    }
    
    // Generate a new challenge word
    async generateNewChallenge(difficulty = 'medium', previousWords = [], categories = []) {
      const words = getRandomWordsByDifficulty(
        difficulty, 
        1, 
        previousWords, 
        categories
      );
      
      if (words.length === 0) {
        return this.simulateApiCall({
          error: 'No matching words found for the specified criteria'
        });
      }
      
      const word = words[0];
      return this.simulateApiCall({
        challenge: {
          word: word.word,
          syllables: word.syllable_breakdown,
          count: word.syllable_count,
          category: word.category,
          animation_key: word.animation_key,
          hint: `This word has ${word.syllable_count} syllables`
        }
      });
    }
    
    // Get explanation of syllable sounds
    async getSyllableSounds(word) {
      // Find the word in our data
      const wordData = getWordByText(word);
      
      if (!wordData) {
        return this.simulateApiCall({
          error: `Word "${word}" not found`
        });
      }
      
      // Syllable breakdown for demonstration
      const syllables = wordData.syllable_breakdown.split('-');
      
      // Create a mock detailed explanation
      const explanation = {
        word: word,
        syllables: syllables.map((syllable, index) => {
          return {
            syllable: syllable,
            pronunciation_guide: `Say "${syllable}" with ${this._getSyllableSound(syllable)}`,
            similar_sound_word: this._getSimilarSoundWord(syllable),
            phonetic_components: this._getPhoneticComponents(syllable)
          };
        }),
        full_pronunciation_tip: `To say "${word}" clearly, break it into syllables: ${syllables.join('-')}. Emphasize each part while keeping the word flowing smoothly.`
      };
      
      return this.simulateApiCall(explanation);
    }
    
    // Text-to-speech - this would normally return audio data, 
    // but we'll just return a success message for the mock
    async textToSpeech(text, voice = 'nova') {
      // In a real implementation, this would call an API and return audio data
      // For our mock, we'll just return a placeholder
      return this.simulateApiCall({
        success: true,
        audio_data: "base64_encoded_audio_data_would_be_here",
        format: 'mp3',
        word: text
      });
    }
    
    // Pronounce a word and its syllables
    async pronounceWord(word) {
      const wordData = getWordByText(word);
      
      if (!wordData) {
        return this.simulateApiCall({
          error: `Word "${word}" not found`
        });
      }
      
      const syllables = wordData.syllable_breakdown.split('-');
      
      // Create a mock pronounce word response
      const response = {
        word: word,
        syllable_breakdown: wordData.syllable_breakdown,
        complete_word_audio: {
          success: true,
          audio_data: "base64_encoded_audio_for_full_word",
          format: 'mp3',
          word: word
        },
        syllables: syllables.map(syllable => ({
          syllable: syllable,
          audio: {
            success: true,
            audio_data: `base64_encoded_audio_for_${syllable}`,
            format: 'mp3',
            word: syllable
          }
        }))
      };
      
      return this.simulateApiCall(response);
    }
    
    // Analyze a word (used for custom words)
    async analyzeWord(word) {
      // First check if the word exists in our database
      let wordData = getWordByText(word);
      
      if (wordData) {
        return this.simulateApiCall({
          word: wordData.word,
          category: wordData.category,
          syllable_breakdown: wordData.syllable_breakdown,
          syllable_count: wordData.syllable_count
        });
      }
      
      // If not found, do a basic syllable analysis
      const syllable_count = this._countSyllables(word);
      const syllable_breakdown = this._generateSyllableBreakdown(word);
      const category = this._determineCategory(word);
      
      return this.simulateApiCall({
        word: word,
        category: category,
        syllable_breakdown: syllable_breakdown,
        syllable_count: syllable_count
      });
    }
    
    // Get all available categories
    async getCategories() {
      return this.simulateApiCall({
        categories: getAllCategories()
      });
    }
    
    // Helper functions for word analysis
    
    // Simple syllable counter
    _countSyllables(word) {
      // Special cases dictionary for problematic words
      const specialCases = {
        "yellow": 2,
        "orange": 2,
        // Add other problematic words as needed
      };
      
      // Check if word is in special cases
      const lowerWord = word.toLowerCase();
      if (specialCases[lowerWord]) {
        return specialCases[lowerWord];
      }
      
      // Regular syllable counting logic
      const vowels = 'aeiouy';
      let count = 0;
      let prevIsVowel = false;
      
      for (let i = 0; i < lowerWord.length; i++) {
        const isVowel = vowels.includes(lowerWord[i]);
        if (isVowel && !prevIsVowel) {
          count++;
        }
        prevIsVowel = isVowel;
      }
      
      // Handle special cases
      if (count === 0) {
        count = 1;  // Every word has at least one syllable
      }
      
      // Handle silent e at the end
      if (lowerWord.endsWith('e') && lowerWord.length > 2 && !vowels.includes(lowerWord[lowerWord.length - 2])) {
        count = Math.max(1, count - 1);
      }
      
      return count;
    }
    
    // Simple syllable breakdown generator
    _generateSyllableBreakdown(word) {
      const syllableCount = this._countSyllables(word);
      
      if (syllableCount === 1 || word.length <= 3) {
        return word;
      }
      
      // Simple approach: divide word evenly by syllable count
      const charsPerSyllable = Math.floor(word.length / syllableCount);
      const result = [];
      
      for (let i = 0; i < syllableCount; i++) {
        const start = i * charsPerSyllable;
        const end = (i === syllableCount - 1) ? word.length : start + charsPerSyllable;
        result.push(word.substring(start, end));
      }
      
      return result.join('-');
    }
    
    // Determine category based on word
    _determineCategory(word) {
      const lowerWord = word.toLowerCase();
      
      // Simple categorization based on word characteristics
      if (['cat', 'dog', 'bird', 'lion', 'tiger', 'fish'].includes(lowerWord)) {
        return 'Animals';
      }
      
      if (['red', 'blue', 'green', 'yellow', 'purple', 'orange'].includes(lowerWord)) {
        return 'Colors';
      }
      
      if (['apple', 'banana', 'bread', 'cake', 'pizza'].includes(lowerWord)) {
        return 'Food Items';
      }
      
      if (['run', 'jump', 'walk', 'play', 'swim', 'dance'].includes(lowerWord)) {
        return 'Action Words';
      }
      
      // Default category
      return 'General';
    }
    
    // Helper for syllable sound explanation
    _getSyllableSound(syllable) {
      const vowels = 'aeiou';
      let vowelSounds = [];
      let consonantSounds = [];
      
      for (let char of syllable.toLowerCase()) {
        if (vowels.includes(char)) {
          vowelSounds.push(char);
        } else if (char !== 'y') {  // Consider y separately
          consonantSounds.push(char);
        }
      }
      
      if (vowelSounds.length === 0 && syllable.toLowerCase().includes('y')) {
        vowelSounds.push('y');  // y acts as a vowel
      }
      
      if (vowelSounds.length === 0) {
        return "a strong consonant sound";
      }
      
      if (consonantSounds.length === 0) {
        return `a pure vowel sound ("${vowelSounds.join(', ')}")`;
      }
      
      return `a combination of consonant sounds (${consonantSounds.join(', ')}) and vowel sounds (${vowelSounds.join(', ')})`;
    }
    
    // Get a similar sounding word for a syllable
    _getSimilarSoundWord(syllable) {
      // Map of syllables to similar-sounding words
      const similarSounds = {
        'cat': 'hat',
        'dog': 'fog',
        'ba': 'ball',
        'be': 'bed',
        'bi': 'big',
        'bo': 'box',
        'bu': 'but',
        'ca': 'car',
        'co': 'cot',
        'da': 'dad',
        'de': 'den',
        'di': 'dig',
        'do': 'dot',
        'du': 'duck',
        'fa': 'fan',
        'fe': 'fell',
        'fi': 'fit',
        'fo': 'fox',
        'fu': 'fun',
        'ga': 'gap',
        'go': 'got',
        'ha': 'hat',
        'he': 'hen',
        'hi': 'hit',
        'ho': 'hot',
        'hu': 'hut',
        'ja': 'jam',
        'jo': 'job',
        'ju': 'jug',
        'ka': 'kale',
        'ki': 'kit',
        'la': 'lap',
        'le': 'let',
        'li': 'lip',
        'lo': 'lot',
        'lu': 'lump',
        'ma': 'map',
        'me': 'men',
        'mi': 'mix',
        'mo': 'mom',
        'mu': 'mud',
        'na': 'nap',
        'ne': 'net',
        'ni': 'nip',
        'no': 'not',
        'nu': 'nut',
        'pa': 'pat',
        'pe': 'pen',
        'pi': 'pit',
        'po': 'pot',
        'pu': 'put',
        'ra': 'rat',
        're': 'red',
        'ri': 'rip',
        'ro': 'rot',
        'ru': 'run',
        'sa': 'sat',
        'se': 'set',
        'si': 'sit',
        'so': 'sot',
        'su': 'sun',
        'ta': 'tap',
        'te': 'ten',
        'ti': 'tip',
        'to': 'top',
        'tu': 'tub',
        'va': 'van',
        've': 'vet',
        'vi': 'vim',
        'vo': 'vow',
        'wa': 'wax',
        'we': 'wet',
        'wi': 'win',
        'wo': 'won',
        'ya': 'yam',
        'ye': 'yes',
        'yo': 'yonder',
        'za': 'zap',
        'ze': 'zen',
        'zi': 'zip',
        'zo': 'zone',
        'zu': 'zoom'
      };
      
      const lowerSyllable = syllable.toLowerCase();
      
      // Check if we have a direct match
      if (similarSounds[lowerSyllable]) {
        return similarSounds[lowerSyllable];
      }
      
      // Check if we have a match for the first two letters
      if (lowerSyllable.length >= 2 && similarSounds[lowerSyllable.substring(0, 2)]) {
        return similarSounds[lowerSyllable.substring(0, 2)];
      }
      
      // Default similar word
      return "sample";
    }
    
    // Get phonetic components description
    _getPhoneticComponents(syllable) {
      if (!syllable || syllable.length === 0) return "no sounds";
      
      const consonants = "bcdfghjklmnpqrstvwxyz";
      const vowels = "aeiou"; // y can be both
      
      let description = [];
      let currentPosition = 0;
      
      // Check for initial consonant or consonant cluster
      while (currentPosition < syllable.length && 
             consonants.includes(syllable[currentPosition].toLowerCase())) {
        currentPosition++;
      }
      
      if (currentPosition > 0) {
        const initialConsonants = syllable.substring(0, currentPosition);
        description.push(`initial ${initialConsonants.length > 1 ? 'consonant cluster' : 'consonant'} "${initialConsonants}"`);
      }
      
      // Check for vowel or vowel cluster
      const startVowel = currentPosition;
      while (currentPosition < syllable.length && 
             (vowels.includes(syllable[currentPosition].toLowerCase()) || 
              (syllable[currentPosition].toLowerCase() === 'y' && currentPosition > 0))) {
        currentPosition++;
      }
      
      if (currentPosition > startVowel) {
        const vowelPart = syllable.substring(startVowel, currentPosition);
        description.push(`vowel ${vowelPart.length > 1 ? 'cluster' : 'sound'} "${vowelPart}"`);
      }
      
      // Check for final consonant or consonant cluster
      if (currentPosition < syllable.length) {
        const finalConsonants = syllable.substring(currentPosition);
        description.push(`final ${finalConsonants.length > 1 ? 'consonant cluster' : 'consonant'} "${finalConsonants}"`);
      }
      
      return description.join(", ");
    }
  }
  
  export default new MockSyllabificationService();