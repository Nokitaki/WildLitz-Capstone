
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../styles/components/AIReadingCoach.module.css';
import { API_ENDPOINTS } from '../../config/api';

const SentenceWritingPractice = ({ vocabularyWords, wordDictionary, onSpeak, isSpeaking }) => {
  const [selectedWord, setSelectedWord] = useState(vocabularyWords[0] || '');
  const [sentence, setSentence] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [completedWords, setCompletedWords] = useState([]);
  const [showHint, setShowHint] = useState(false);
  const sentenceInputRef = useRef(null);
  

  const checkSentence = () => {
    if (!sentence.trim()) {
      setFeedback({
        type: 'error',
        message: 'Please write a sentence first!'
      });
      return;
    }
    

    const containsWord = sentence.toLowerCase().includes(selectedWord.toLowerCase());
    const endsWithPunctuation = /[.!?]$/.test(sentence);
    
    if (containsWord && endsWithPunctuation) {
      setFeedback({
        type: 'success',
        message: `Perfect! Your sentence uses the word "${selectedWord}"! 🎉`
      });
      
  
      if (!completedWords.includes(selectedWord)) {
        setCompletedWords([...completedWords, selectedWord]);
      }
      
     
      setTimeout(() => {
        const currentIndex = vocabularyWords.indexOf(selectedWord);
        const nextIndex = (currentIndex + 1) % vocabularyWords.length;
        setSelectedWord(vocabularyWords[nextIndex]);
        setSentence('');
        setFeedback(null);
        setShowHint(false);
      }, 2000);
    } else {
      let errors = [];
      if (!containsWord) errors.push(`use the word "${selectedWord}"`);
      if (!endsWithPunctuation) errors.push('end with . ! or ?');
      
      setFeedback({
        type: 'error',
        message: `Your sentence needs to: ${errors.join(' and ')}.`
      });
    }
  };
  
 
  const getSentenceStarters = () => {
    return [
      `The ${selectedWord?.toLowerCase()} `,
      `I saw a ${selectedWord?.toLowerCase()} `,
      `Yesterday, the ${selectedWord?.toLowerCase()} `,
      `In the story, the ${selectedWord?.toLowerCase()} `
    ];
  };
  
  const useSentenceStarter = (starter) => {
    setSentence(starter);
    sentenceInputRef.current?.focus();
    setShowHint(false);
  };
  
  return (
    <div className={styles.sentenceWriting}>
     
      <div className={styles.practiceHeader}>
        <span className={styles.practiceIcon}>✍️</span>
        <h3>Sentence Writing Practice</h3>
        <p>Write creative sentences using your vocabulary words!</p>
      </div>
      
      {/* Progress Bar */}
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${(completedWords.length / vocabularyWords.length) * 100}%` }}></div>
      </div>
      <p className={styles.progressText}>
        {completedWords.length} of {vocabularyWords.length} words completed
      </p>
      
      {/* Word Selector */}
      <div className={styles.wordSelector}>
        <div className={styles.wordTabs}>
          {vocabularyWords.map((word, index) => (
            <button
              key={index}
              className={`${styles.wordTab} ${selectedWord === word ? styles.activeWordTab : ''} ${completedWords.includes(word) ? styles.completedWordTab : ''}`}
              onClick={() => {
                setSelectedWord(word);
                setSentence('');
                setFeedback(null);
                setShowHint(false);
              }}
            >
              {completedWords.includes(word) && <span className={styles.checkmark}>✓ </span>}
              {word}
            </button>
          ))}
        </div>
      </div>
      
      {/* Writing Prompt */}
      <div className={styles.writingPrompt}>
        <label className={styles.promptLabel}>
          Write your sentence using "<strong>{selectedWord}</strong>":
        </label>
        <button 
          className={styles.listenWordButton}
          onClick={() => onSpeak(selectedWord)}
          disabled={isSpeaking}
        >
          🔊 Listen
        </button>
      </div>
      
      {/* Sentence Input */}
      <div className={styles.sentenceInputArea}>
        <textarea
          ref={sentenceInputRef}
          className={styles.sentenceTextarea}
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
          placeholder={`Example: The ${selectedWord?.toLowerCase()} was beautiful...`}
          rows={4}
        />
        
        {/* Helper Tools */}
        <div className={styles.helperTools}>
          <button 
            className={styles.hintButton}
            onClick={() => setShowHint(!showHint)}
          >
            💡 {showHint ? 'Hide' : 'Show'} Sentence Starters
          </button>
          <button 
            className={styles.clearButton}
            onClick={() => {
              setSentence('');
              setFeedback(null);
            }}
            disabled={!sentence}
          >
            🗑️ Clear
          </button>
        </div>
        
        {/* Sentence Starters */}
        <AnimatePresence>
          {showHint && (
            <motion.div 
              className={styles.sentenceStarters}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <p className={styles.startersLabel}>Click a starter to begin:</p>
              <div className={styles.starterButtons}>
                {getSentenceStarters().map((starter, index) => (
                  <button
                    key={index}
                    className={styles.starterButton}
                    onClick={() => useSentenceStarter(starter)}
                  >
                    {starter}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Check Button */}
        <button 
          className={styles.checkSentenceButton}
          onClick={checkSentence}
          disabled={!sentence.trim()}
        >
          ✓ Check My Sentence
        </button>
      </div>
      
      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div 
            className={`${styles.feedback} ${feedback.type === 'success' ? styles.successFeedback : styles.errorFeedback}`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
          >
            <span className={styles.feedbackIcon}>
              {feedback.type === 'success' ? '🎉' : '💭'}
            </span>
            {feedback.message}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Completion Message */}
      {completedWords.length === vocabularyWords.length && (
        <motion.div 
          className={styles.completionBanner}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <h3>🎊 Amazing Work!</h3>
          <p>You've written sentences for all {vocabularyWords.length} vocabulary words!</p>
        </motion.div>
      )}
    </div>
  );
};

const AIReadingCoach = ({ 
  storyText, 
  isVisible, 
  onClose, 
  vocabularyWords = [],
  grade = 3
}) => {
 
  const [selectedWord, setSelectedWord] = useState('');
  const [wordData, setWordData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [readingSpeed, setReadingSpeed] = useState(0.85);
  const [activeTab, setActiveTab] = useState('vocabulary');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const wordPanelRef = useRef(null);
 
  const coachRef = useRef(null);
  

  const character = {
    name: 'Professor Hoot',
    emoji: '🦉',
    gradient: 'linear-gradient(135deg, #7b1fa2, #9c27b0)'
  };
  
 
  const hasSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const speechSynth = hasSpeech ? window.speechSynthesis : null;
  

  const wordDictionary = {
   
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
  

  const getVoice = () => {
    if (!hasSpeech) return null;
    const voices = speechSynth.getVoices();
    return voices.find(v => v.name.includes('Google UK English Female')) || 
           voices.find(v => v.lang.startsWith('en')) || 
           voices[0];
  };
  

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
  

  const generateDefinition = (word) => {
    const lowerWord = word.toLowerCase();
    
   
    if (wordDictionary[lowerWord]) {
      return wordDictionary[lowerWord];
    }
    
  
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
    
   
    return {
      definition: `This word "${word}" has special meaning in the story.`,
      example: `"${word}" helps us understand what's happening.`,
      partOfSpeech: "word",
      syllables: word,
      synonyms: [],
      emoji: "📖"
    };
  };
  

  const fetchGPTDefinition = async (word) => {
    try {
     
      
        const response = await fetch(`${API_ENDPOINTS.SENTENCE_FORMATION}/explain-word/`, {
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
     
      return generateDefinition(word);
    }
  };
  
 
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
     
      let data;
      if (wordDictionary[word.toLowerCase()]) {
        data = wordDictionary[word.toLowerCase()];
      } else {
        
        data = await fetchGPTDefinition(word);
      }
      
      setWordData(data);
      setIsLoading(false);
      speak(`${word}. ${data.partOfSpeech}. ${data.definition}`);

       setTimeout(() => {
      if (wordPanelRef.current) {
        wordPanelRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      }
    }, 300);

    } catch (error) {
      console.error('Error loading word data:', error);
      const fallbackData = generateDefinition(word);
      setWordData(fallbackData);
      setIsLoading(false);
      speak(`${word}. ${fallbackData.definition}`);


       setTimeout(() => {
      if (wordPanelRef.current) {
        wordPanelRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      }
    }, 300);
    }
  };
  

 
  
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
        
      
        
        
      
        <div className={styles.coachContent}>
       
          <div className={styles.tabNav}>
            <button
              className={`${styles.tabButton} ${activeTab === 'vocabulary' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('vocabulary')}
            >
              <span className={styles.tabIcon}>📚</span>
              <span>Vocabulary</span>
            </button>
            
            <button
              className={`${styles.tabButton} ${activeTab === 'practice' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('practice')}
            >
              <span className={styles.tabIcon}>🎯</span>
              <span>Practice</span>
            </button>
          </div>
          
         
          <div className={styles.tabContent}>
         
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
                        
                        <span className={styles.vocabWord}>{word}</span>
                        <span className={styles.vocabHint}>Click to learn!</span>
                      </motion.button>
                    );
                  })}
                </div>
                
               
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
                
              
                <AnimatePresence>
                  {selectedWord && wordData && !isLoading && (
                    <motion.div 
                      ref={wordPanelRef}
                      className={styles.wordPanel}
                      initial={{ y: 20, opacity: 0, scale: 0.95 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      exit={{ y: 20, opacity: 0, scale: 0.95 }}
                      transition={{ type: "spring", damping: 20 }}
                    >
                      <div className={styles.wordHeader}>
                        <div className={styles.wordTitleSection}>
                          
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
            
           
            
            
            
            {activeTab === 'practice' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={styles.practiceTab}
              >
                <SentenceWritingPractice 
                  vocabularyWords={vocabularyWords}
                  wordDictionary={wordDictionary}
                  onSpeak={speak}
                  isSpeaking={isSpeaking}
                />
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AIReadingCoach;