// src/components/crossword/AIReadingCoach.jsx - Ultimate Reading Helper
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../styles/components/AIReadingCoach.module.css';

const AIReadingCoach = ({ 
  storyText, 
  isVisible, 
  onClose, 
  vocabularyWords = [],
  grade = 3
}) => {
  // State management
  const [selectedWord, setSelectedWord] = useState('');
  const [wordData, setWordData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [readingSpeed, setReadingSpeed] = useState(0.85);
  const [activeTab, setActiveTab] = useState('vocabulary');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  
  // Refs
  const coachRef = useRef(null);
  
  // Character configuration
  const character = {
    name: 'Professor Hoot',
    emoji: '🦉',
    gradient: 'linear-gradient(135deg, #7b1fa2, #9c27b0)'
  };
  
  // Speech synthesis
  const hasSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const speechSynth = hasSpeech ? window.speechSynthesis : null;
  
  // Enhanced word dictionary with detailed information
  const wordDictionary = {
    // Episode 1: Lost in the Jungle
    jungle: {
      definition: "A dense forest in a tropical area with lots of trees, vines, and wild animals.",
      example: "The explorers walked carefully through the thick jungle.",
      partOfSpeech: "noun",
      syllables: "jun-gle",
      synonyms: ["forest", "rainforest", "wilderness"],
      emoji: "🌴"
    },
    map: {
      definition: "A drawing or picture that shows where places are located.",
      example: "They used a map to find their way through the jungle.",
      partOfSpeech: "noun",
      syllables: "map",
      synonyms: ["chart", "guide", "diagram"],
      emoji: "🗺️"
    },
    heard: {
      definition: "Noticed or listened to a sound with your ears (past tense of 'hear').",
      example: "They heard a strange noise coming from the bushes.",
      partOfSpeech: "verb",
      syllables: "heard",
      synonyms: ["listened", "detected", "noticed"],
      emoji: "👂"
    },
    roar: {
      definition: "A loud, deep sound made by a large animal like a lion or tiger.",
      example: "The lion let out a mighty roar that echoed through the jungle.",
      partOfSpeech: "noun",
      syllables: "roar",
      synonyms: ["growl", "bellow", "howl"],
      emoji: "🦁"
    },
    froze: {
      definition: "Stopped moving suddenly, usually because of fear or surprise (past tense of 'freeze').",
      example: "The explorers froze in fear when they heard the roar.",
      partOfSpeech: "verb",
      syllables: "froze",
      synonyms: ["stopped", "halted", "stood still"],
      emoji: "🧊"
    },
    peeked: {
      definition: "Looked quickly or secretly at something (past tense of 'peek').",
      example: "She peeked around the corner to see what was there.",
      partOfSpeech: "verb",
      syllables: "peeked",
      synonyms: ["glanced", "peeped", "glimpsed"],
      emoji: "👀"
    },
    cautious: {
      definition: "Being very careful to avoid danger or problems.",
      example: "They were cautious as they walked through the dark cave.",
      partOfSpeech: "adjective",
      syllables: "cau-tious",
      synonyms: ["careful", "watchful", "alert"],
      emoji: "⚠️"
    },
    
    // Episode 2: The Mysterious Temple
    temple: {
      definition: "A building used for worship or religious ceremonies, often very old and special.",
      example: "The ancient temple was covered with beautiful carvings and symbols.",
      partOfSpeech: "noun",
      syllables: "tem-ple",
      synonyms: ["shrine", "sanctuary", "place of worship"],
      emoji: "⛩️"
    },
    secrets: {
      definition: "Hidden information or things that are not known by everyone.",
      example: "The old temple held many secrets from long ago.",
      partOfSpeech: "noun",
      syllables: "se-crets",
      synonyms: ["mysteries", "hidden things", "unknowns"],
      emoji: "🤫"
    },
    explore: {
      definition: "To travel through a place to learn about it or discover new things.",
      example: "The children wanted to explore the mysterious cave.",
      partOfSpeech: "verb",
      syllables: "ex-plore",
      synonyms: ["discover", "investigate", "search"],
      emoji: "🔍"
    },
    piece: {
      definition: "A part or portion of something larger.",
      example: "She found a piece of the broken pottery.",
      partOfSpeech: "noun",
      syllables: "piece",
      synonyms: ["part", "fragment", "section"],
      emoji: "🧩"
    },
    emerged: {
      definition: "Came out or appeared from somewhere (past tense of 'emerge').",
      example: "A butterfly emerged from its cocoon.",
      partOfSpeech: "verb",
      syllables: "e-merged",
      synonyms: ["appeared", "surfaced", "came out"],
      emoji: "✨"
    },
    
    // Common Words
    adventure: {
      definition: "An exciting or unusual experience, often involving some risk or danger.",
      example: "Their journey through the jungle was a thrilling adventure.",
      partOfSpeech: "noun",
      syllables: "ad-ven-ture",
      synonyms: ["journey", "quest", "expedition"],
      emoji: "🎒"
    },
    heart: {
      definition: "The center or middle part of something; also the organ that pumps blood.",
      example: "In the heart of the forest, they found a hidden waterfall.",
      partOfSpeech: "noun",
      syllables: "heart",
      synonyms: ["center", "core", "middle"],
      emoji: "❤️"
    },
    treasure: {
      definition: "Valuable things like gold, jewels, or special items that are hidden or hard to find.",
      example: "The pirates buried their treasure on a secret island.",
      partOfSpeech: "noun",
      syllables: "treas-ure",
      synonyms: ["riches", "wealth", "valuables"],
      emoji: "💎"
    },
    escape: {
      definition: "To get away from a dangerous or bad situation.",
      example: "They needed to escape from the dark cave before nightfall.",
      partOfSpeech: "verb",
      syllables: "es-cape",
      synonyms: ["flee", "get away", "break free"],
      emoji: "🏃"
    },
    grew: {
      definition: "Became larger or increased in size (past tense of 'grow').",
      example: "The noise grew louder as they got closer.",
      partOfSpeech: "verb",
      syllables: "grew",
      synonyms: ["increased", "expanded", "became bigger"],
      emoji: "📈"
    },
    ancient: {
      definition: "Very old, from a long time ago in history.",
      example: "The ancient ruins were thousands of years old.",
      partOfSpeech: "adjective",
      syllables: "an-cient",
      synonyms: ["old", "historic", "age-old"],
      emoji: "🏛️"
    },
    mysterious: {
      definition: "Strange and difficult to understand or explain.",
      example: "The mysterious sounds came from deep in the forest.",
      partOfSpeech: "adjective",
      syllables: "mys-te-ri-ous",
      synonyms: ["puzzling", "strange", "unexplained"],
      emoji: "❓"
    },
    discovered: {
      definition: "Found something for the first time (past tense of 'discover').",
      example: "They discovered a hidden pathway behind the waterfall.",
      partOfSpeech: "verb",
      syllables: "dis-cov-ered",
      synonyms: ["found", "uncovered", "detected"],
      emoji: "🔦"
    },
    brave: {
      definition: "Having courage and not being afraid in dangerous situations.",
      example: "The brave explorers continued their journey despite the danger.",
      partOfSpeech: "adjective",
      syllables: "brave",
      synonyms: ["courageous", "fearless", "bold"],
      emoji: "🦸"
    },
    hidden: {
      definition: "Kept out of sight or covered up so it cannot be easily found.",
      example: "The hidden treasure was buried under the old tree.",
      partOfSpeech: "adjective",
      syllables: "hid-den",
      synonyms: ["concealed", "secret", "covered"],
      emoji: "🙈"
    },
    danger: {
      definition: "The possibility of harm or being hurt.",
      example: "The explorers knew they were in danger when they heard the growl.",
      partOfSpeech: "noun",
      syllables: "dan-ger",
      synonyms: ["risk", "threat", "peril"],
      emoji: "⚡"
    },
    strange: {
      definition: "Unusual or unexpected in a way that is surprising or hard to understand.",
      example: "They heard strange noises coming from the cave.",
      partOfSpeech: "adjective",
      syllables: "strange",
      synonyms: ["odd", "unusual", "weird"],
      emoji: "👽"
    },
    path: {
      definition: "A way or track made for walking or traveling.",
      example: "They followed the narrow path through the dense forest.",
      partOfSpeech: "noun",
      syllables: "path",
      synonyms: ["trail", "route", "way"],
      emoji: "🛤️"
    },
    whispered: {
      definition: "Spoke very quietly or softly (past tense of 'whisper').",
      example: "She whispered the secret so no one else could hear.",
      partOfSpeech: "verb",
      syllables: "whis-pered",
      synonyms: ["murmured", "spoke softly", "muttered"],
      emoji: "🤫"
    },
    suddenly: {
      definition: "Happening quickly and unexpectedly.",
      example: "Suddenly, a bird flew out of the bushes and startled them.",
      partOfSpeech: "adverb",
      syllables: "sud-den-ly",
      synonyms: ["unexpectedly", "abruptly", "all at once"],
      emoji: "⚡"
    }
  };
  
  // Get voice for speech synthesis
  const getVoice = () => {
    if (!hasSpeech) return null;
    const voices = speechSynth.getVoices();
    return voices.find(v => v.name.includes('Google UK English Female')) || 
           voices.find(v => v.lang.startsWith('en')) || 
           voices[0];
  };
  
  // Speak text with subtitles
  const speak = (text) => {
    if (!hasSpeech) return;
    
    speechSynth.cancel();
    setIsSpeaking(true);
    setCurrentSubtitle(text);
    
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getVoice();
    if (voice) utterance.voice = voice;
    utterance.rate = readingSpeed;
    utterance.pitch = 1.0;
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setTimeout(() => setCurrentSubtitle(''), 500);
    };
    
    utterance.onerror = () => {
      setIsSpeaking(false);
      setCurrentSubtitle('');
    };
    
    speechSynth.speak(utterance);
  };
  
  // Generate definition for words
  const generateDefinition = (word) => {
    const lowerWord = word.toLowerCase();
    
    // Check dictionary first
    if (wordDictionary[lowerWord]) {
      return wordDictionary[lowerWord];
    }
    
    // Generate smart definition
    let partOfSpeech = "word";
    let syllables = word;
    let emoji = "📝";
    
    if (lowerWord.endsWith('ing')) {
      partOfSpeech = "verb";
      syllables = word.slice(0, -3) + '-ing';
      emoji = "⚡";
      return {
        definition: `The action of ${word.slice(0, -3)}. This describes something that is happening.`,
        example: `They were ${lowerWord} in the story.`,
        partOfSpeech,
        syllables,
        synonyms: ["action", "doing"],
        emoji
      };
    }
    
    if (lowerWord.endsWith('ed')) {
      partOfSpeech = "verb";
      syllables = word.slice(0, -2) + '-ed';
      emoji = "✓";
      return {
        definition: `Past tense: This action already happened. It means to have done ${word.slice(0, -2)}.`,
        example: `They ${lowerWord} something in the story.`,
        partOfSpeech,
        syllables,
        synonyms: ["completed", "finished"],
        emoji
      };
    }
    
    // Default
    return {
      definition: `This word "${word}" has special meaning in the story.`,
      example: `"${word}" helps us understand what's happening.`,
      partOfSpeech: "word",
      syllables: word,
      synonyms: [],
      emoji: "📖"
    };
  };
  
  // Fetch definition from GPT API - CORRECTED ENDPOINT
  const fetchGPTDefinition = async (word) => {
    try {
      // IMPORTANT: Using sentence_formation endpoint, not syllabification
      const response = await fetch('/api/sentence_formation/explain-word/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          word: word,
          grade_level: grade,
          context: storyText
        })
      });
      
      if (!response.ok) {
        console.error('API Response Status:', response.status);
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error('API request failed');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Transform API response to our format
        return {
          definition: data.definition || `A word that means "${word}".`,
          example: data.example || `The word "${word}" is used in the story.`,
          partOfSpeech: data.part_of_speech || "word",
          syllables: data.syllables || word,
          synonyms: data.synonyms || [],
          emoji: getEmojiForPartOfSpeech(data.part_of_speech)
        };
      } else {
        throw new Error('Invalid API response');
      }
    } catch (error) {
      console.error('Error fetching definition:', error);
      // Return fallback definition
      return generateDefinition(word);
    }
  };
  
  // Get emoji based on part of speech
  const getEmojiForPartOfSpeech = (partOfSpeech) => {
    const emojiMap = {
      'noun': '📝',
      'verb': '⚡',
      'adjective': '🎨',
      'adverb': '🚀',
      'pronoun': '👤',
      'preposition': '📍',
      'conjunction': '🔗',
      'interjection': '❗'
    };
    return emojiMap[partOfSpeech?.toLowerCase()] || '📖';
  };
  
  // Handle word selection from vocabulary list
  const handleWordSelect = async (word) => {
    if (word === selectedWord) {
      setSelectedWord('');
      setWordData(null);
      return;
    }
    
    setSelectedWord(word);
    setIsLoading(true);
    setWordData(null);
    
    try {
      // First check local dictionary
      let data;
      if (wordDictionary[word.toLowerCase()]) {
        data = wordDictionary[word.toLowerCase()];
      } else {
        // Fetch from GPT API
        data = await fetchGPTDefinition(word);
      }
      
      setWordData(data);
      setIsLoading(false);
      speak(`${word}. ${data.partOfSpeech}. ${data.definition}`);
    } catch (error) {
      console.error('Error loading word data:', error);
      const fallbackData = generateDefinition(word);
      setWordData(fallbackData);
      setIsLoading(false);
      speak(`${word}. ${fallbackData.definition}`);
    }
  };
  
  // Reading tips
  const readingTips = [
    {
      icon: "👀",
      title: "Look for Context Clues",
      description: "If you don't know a word, read the sentence around it to guess its meaning."
    },
    {
      icon: "🔊",
      title: "Sound it Out",
      description: "Break long words into smaller parts (syllables) and say each part slowly."
    },
    {
      icon: "📝",
      title: "Visualize the Story",
      description: "Create pictures in your mind as you read to help you understand and remember."
    },
    {
      icon: "🔄",
      title: "Reread if Confused",
      description: "It's okay to read a sentence again if you didn't understand it the first time."
    },
    {
      icon: "❓",
      title: "Ask Questions",
      description: "Think about what might happen next or why characters do certain things."
    },
    {
      icon: "⭐",
      title: "Take Your Time",
      description: "Reading is not a race! Go at a comfortable pace for you."
    }
  ];
  
  if (!isVisible) return null;
  
  return (
    <div className={styles.coachOverlay}>
      <motion.div 
        className={styles.coachContainer}
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        ref={coachRef}
      >
        {/* Header */}
        <div className={styles.coachHeader} style={{ background: character.gradient }}>
          <div className={styles.characterInfo}>
            <span className={styles.characterEmoji}>{character.emoji}</span>
            <div>
              <span className={styles.characterName}>{character.name}</span>
              <span className={styles.characterSubtitle}>Your Reading Guide</span>
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose} title="Close">
            ✕
          </button>
        </div>
        
        {/* Subtitle Display */}
        <AnimatePresence>
          {currentSubtitle && (
            <motion.div 
              className={styles.subtitleBar}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <div className={styles.subtitleContent}>
                <span className={styles.speakerIcon}>🔊</span>
                <p className={styles.subtitleText}>{currentSubtitle}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Content */}
        <div className={styles.coachContent}>
          {/* Tab Navigation */}
          <div className={styles.tabNav}>
            <button
              className={`${styles.tabButton} ${activeTab === 'vocabulary' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('vocabulary')}
            >
              <span className={styles.tabIcon}>📚</span>
              <span>Vocabulary</span>
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'tips' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('tips')}
            >
              <span className={styles.tabIcon}>💡</span>
              <span>Reading Tips</span>
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'practice' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('practice')}
            >
              <span className={styles.tabIcon}>🎯</span>
              <span>Practice</span>
            </button>
          </div>
          
          {/* Tab Content */}
          <div className={styles.tabContent}>
            {/* Vocabulary Tab */}
            {activeTab === 'vocabulary' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={styles.vocabularyTab}
              >
                <div className={styles.instructionCard}>
                  <span className={styles.instructionIcon}>📖</span>
                  <p><strong>Click on any vocabulary word</strong> to hear its pronunciation, see its meaning, and learn how to use it!</p>
                </div>
                
                {/* Reading Speed Control */}
                <div className={styles.speedControl}>
                  <label>
                    <span className={styles.speedLabel}>🎙️ Speaking Speed:</span>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="1.0" 
                      step="0.05" 
                      value={readingSpeed}
                      onChange={(e) => setReadingSpeed(parseFloat(e.target.value))}
                      className={styles.speedSlider}
                    />
                    <span className={styles.speedValue}>
                      {readingSpeed === 0.5 ? 'Slow' : readingSpeed === 1.0 ? 'Normal' : `${readingSpeed.toFixed(2)}x`}
                    </span>
                  </label>
                </div>
                
                {/* Vocabulary Grid */}
                <div className={styles.vocabularyGrid}>
                  {vocabularyWords.map((word, index) => {
                    const wordInfo = wordDictionary[word.toLowerCase()] || {};
                    return (
                      <motion.button
                        key={index}
                        className={`${styles.vocabCard} ${selectedWord === word ? styles.selectedVocab : ''}`}
                        onClick={() => handleWordSelect(word)}
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className={styles.vocabEmoji}>{wordInfo.emoji || '📝'}</span>
                        <span className={styles.vocabWord}>{word}</span>
                        <span className={styles.vocabHint}>Click to learn!</span>
                      </motion.button>
                    );
                  })}
                </div>
                
                {/* Loading State */}
                {isLoading && selectedWord && (
                  <motion.div 
                    className={styles.loadingPanel}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className={styles.loadingSpinner}></div>
                    <p>Loading definition for <strong>{selectedWord}</strong>...</p>
                  </motion.div>
                )}
                
                {/* Word Details Panel */}
                <AnimatePresence>
                  {selectedWord && wordData && !isLoading && (
                    <motion.div 
                      className={styles.wordPanel}
                      initial={{ y: 20, opacity: 0, scale: 0.95 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      exit={{ y: 20, opacity: 0, scale: 0.95 }}
                      transition={{ type: "spring", damping: 20 }}
                    >
                      <div className={styles.wordHeader}>
                        <div className={styles.wordTitleSection}>
                          <span className={styles.wordEmoji}>{wordData.emoji}</span>
                          <div>
                            <h3 className={styles.wordTitle}>{selectedWord}</h3>
                            <div className={styles.wordMeta}>
                              <span className={styles.partOfSpeech}>{wordData.partOfSpeech}</span>
                              <span className={styles.syllables}>• {wordData.syllables}</span>
                            </div>
                          </div>
                        </div>
                        <button 
                          className={styles.pronounceButton}
                          onClick={() => speak(selectedWord)}
                          title="Hear pronunciation"
                          disabled={isSpeaking}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                          </svg>
                        </button>
                      </div>
                      
                      <div className={styles.wordContent}>
                        <div className={styles.definitionSection}>
                          <strong>📚 Definition:</strong>
                          <p>{wordData.definition}</p>
                        </div>
                        
                        <div className={styles.exampleSection}>
                          <strong>💡 Example:</strong>
                          <p className={styles.exampleText}>"{wordData.example}"</p>
                        </div>
                        
                        {wordData.synonyms && wordData.synonyms.length > 0 && (
                          <div className={styles.synonymsSection}>
                            <strong>🔄 Similar Words:</strong>
                            <div className={styles.synonymsList}>
                              {wordData.synonyms.map((syn, i) => (
                                <span key={i} className={styles.synonymTag}>{syn}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <button 
                          className={styles.explainButton}
                          onClick={() => speak(`${selectedWord}. ${wordData.partOfSpeech}. ${wordData.definition}. For example: ${wordData.example}`)}
                          disabled={isSpeaking}
                        >
                          🎧 Hear Full Explanation
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
            
            {/* Reading Tips Tab */}
            {activeTab === 'tips' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={styles.tipsTab}
              >
                <div className={styles.tipsHeader}>
                  <h3>📖 Helpful Reading Strategies</h3>
                  <p>Use these tips to become a better reader!</p>
                </div>
                
                <div className={styles.tipsGrid}>
                  {readingTips.map((tip, index) => (
                    <motion.div
                      key={index}
                      className={styles.tipCard}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.03, y: -5 }}
                    >
                      <span className={styles.tipIcon}>{tip.icon}</span>
                      <h4 className={styles.tipTitle}>{tip.title}</h4>
                      <p className={styles.tipDescription}>{tip.description}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
            
            {/* Practice Tab */}
            {activeTab === 'practice' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={styles.practiceTab}
              >
                <div className={styles.practiceHeader}>
                  <span className={styles.practiceIcon}>🎯</span>
                  <h3>Practice Your Vocabulary</h3>
                  <p>Test yourself on the words you've learned!</p>
                </div>
                
                <div className={styles.practiceCards}>
                  <motion.div 
                    className={styles.practiceCard}
                    whileHover={{ scale: 1.02 }}
                  >
                    <span className={styles.practiceCardIcon}>🗣️</span>
                    <h4>Pronunciation Practice</h4>
                    <p>Click vocabulary words and repeat them aloud</p>
                    <button 
                      className={styles.practiceCardButton}
                      onClick={() => setActiveTab('vocabulary')}
                    >
                      Start Practicing
                    </button>
                  </motion.div>
                  
                  <motion.div 
                    className={styles.practiceCard}
                    whileHover={{ scale: 1.02 }}
                  >
                    <span className={styles.practiceCardIcon}>✍️</span>
                    <h4>Sentence Writing</h4>
                    <p>Create your own sentences using the vocabulary words</p>
                    <button 
                      className={styles.practiceCardButton}
                      onClick={() => setActiveTab('vocabulary')}
                    >
                      Get Started
                    </button>
                  </motion.div>
                  
                  <motion.div 
                    className={styles.practiceCard}
                    whileHover={{ scale: 1.02 }}
                  >
                    <span className={styles.practiceCardIcon}>🎮</span>
                    <h4>Word Matching</h4>
                    <p>Match words with their definitions</p>
                    <button 
                      className={styles.practiceCardButton}
                      disabled
                    >
                      Coming Soon!
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AIReadingCoach;