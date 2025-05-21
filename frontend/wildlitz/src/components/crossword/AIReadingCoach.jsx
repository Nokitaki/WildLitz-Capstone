// src/components/AIReadingCoach.jsx - Enhanced with intelligent definitions
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
  const [mode, setMode] = useState('help'); // 'help', 'word', 'question'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  
  // Refs
  const coachRef = useRef(null);
  const textRef = useRef(null);
  
  // Character configuration
  const characters = {
    owl: {
      name: 'Professor Hoot',
      emoji: '🦉',
      color: '#7b1fa2',
      greeting: "Hi there! I'm Professor Hoot, your reading helper! Click on any word you don't understand, and I'll explain it.",
      voices: ['Google UK English Female', 'Microsoft Zira - English (United States)']
    },
    fox: {
      name: 'Felix Fox',
      emoji: '🦊',
      color: '#e65100',
      greeting: "Hello! I'm Felix Fox! I'm here to help you with your reading. Just ask if you have questions!",
      voices: ['Google UK English Male', 'Microsoft Mark - English (United States)']
    }
  };
  
  const [character, setCharacter] = useState(characters.owl);
  
  // Detect if speech synthesis is available
  const hasSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const speechSynth = hasSpeech ? window.speechSynthesis : null;
  
  // Get available voices
  const [voices, setVoices] = useState([]);
  
  useEffect(() => {
    if (hasSpeech) {
      const updateVoices = () => {
        setVoices(speechSynth.getVoices());
      };
      
      // Chrome loads voices asynchronously
      speechSynth.onvoiceschanged = updateVoices;
      updateVoices();
      
      return () => {
        speechSynth.onvoiceschanged = null;
      };
    }
  }, [hasSpeech, speechSynth]);
  
  // Find the best matching voice for the character
  const getVoice = () => {
    if (!hasSpeech || voices.length === 0) return null;
    
    // Try to find a preferred voice
    for (const preferredVoice of character.voices) {
      const match = voices.find(v => v.name === preferredVoice);
      if (match) return match;
    }
    
    // Fallback to any English voice
    return voices.find(v => v.lang.includes('en'));
  };
  
  // Function to make the character speak
  const speak = (text) => {
    if (!hasSpeech) return;
    
    // Cancel any ongoing speech
    speechSynth.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = getVoice();
    utterance.rate = 0.9; // Slightly slower for kids
    utterance.pitch = 1.1; // Slightly higher pitch for character voice
    
    speechSynth.speak(utterance);
  };
  
  // Switch character
  const switchCharacter = () => {
    setCharacter(character === characters.owl ? characters.fox : characters.owl);
  };

  // Comprehensive dictionary with definitions for common words
  const wordDictionary = {
    // Story vocabulary words
    jungle: {
      definition: "A dense forest in a tropical region with many trees, plants, and animals living very close together.",
      example: "The explorers trekked through the jungle, hearing monkeys and birds all around them.",
      visualization: "https://cdn-icons-png.flaticon.com/512/1998/1998627.png"
    },
    dense: {
      definition: "Closely packed together with very little space between things.",
      example: "The trees in the forest were so dense that little light reached the ground.",
      visualization: "https://cdn-icons-png.flaticon.com/512/3437/3437489.png"
    },
    footprints: {
      definition: "Marks left by a foot or shoe on the ground or another surface.",
      example: "They followed the footprints in the sand to see where the person had gone.",
      visualization: "https://cdn-icons-png.flaticon.com/512/2548/2548374.png"
    },
    curious: {
      definition: "Eager to learn or know about something.",
      example: "The curious child asked many questions about how things work.",
      visualization: "https://cdn-icons-png.flaticon.com/512/742/742751.png"
    },
    foliage: {
      definition: "The leaves of a plant or tree.",
      example: "The autumn foliage turned bright red and orange.",
      visualization: "https://cdn-icons-png.flaticon.com/512/3437/3437489.png"
    },
    heart: {
      definition: "The central or innermost part of something.",
      example: "They traveled to the heart of the city to see the main attractions.",
      visualization: "https://cdn-icons-png.flaticon.com/512/742/742751.png"
    },
    secret: {
      definition: "Something kept hidden or unexplained.",
      example: "The children discovered a secret door behind the bookshelf.",
      visualization: "https://cdn-icons-png.flaticon.com/512/3898/3898082.png"
    },
    
    // Common verbs
    explore: {
      definition: "To travel through an unfamiliar area to learn about it.",
      example: "The astronauts will explore the surface of Mars.",
      visualization: "https://cdn-icons-png.flaticon.com/512/2548/2548374.png"
    },
    discover: {
      definition: "To find or learn something for the first time.",
      example: "Scientists discovered a new species of frog in the rainforest.",
      visualization: "https://cdn-icons-png.flaticon.com/512/3437/3437489.png"
    },
    realized: {
      definition: "To understand something that you didn't understand before.",
      example: "She suddenly realized that she had left her keys at home.",
      visualization: "https://cdn-icons-png.flaticon.com/512/742/742751.png"
    },
    wander: {
      definition: "To walk slowly around or to a place, often without a specific purpose or direction.",
      example: "They wandered through the park on the sunny afternoon.",
      visualization: "https://cdn-icons-png.flaticon.com/512/2548/2548374.png"
    },
    encountered: {
      definition: "To meet or find someone or something, often unexpectedly.",
      example: "While hiking, they encountered a family of deer.",
      visualization: "https://cdn-icons-png.flaticon.com/512/3437/3437489.png"
    },
    
    // Common nouns
    path: {
      definition: "A track that has been made for people to walk along.",
      example: "They followed the path through the woods to reach the lake.",
      visualization: "https://cdn-icons-png.flaticon.com/512/854/854878.png"
    },
    treasure: {
      definition: "A collection of valuable things such as gold, silver, or jewels.",
      example: "The pirates buried their treasure on a deserted island.",
      visualization: "https://cdn-icons-png.flaticon.com/512/3437/3437489.png"
    },
    journey: {
      definition: "Traveling from one place to another, especially over a long distance.",
      example: "Their journey to the mountains took three days.",
      visualization: "https://cdn-icons-png.flaticon.com/512/2548/2548374.png"
    },
    compass: {
      definition: "A tool that shows directions, with a needle that points north.",
      example: "They used a compass to find their way through the forest.",
      visualization: "https://cdn-icons-png.flaticon.com/512/3437/3437489.png"
    },
    
    // Character names
    leo: {
      definition: "A boy's name, and one of the main characters in this story.",
      example: "Leo and Ella were exploring the jungle together.",
      visualization: "https://cdn-icons-png.flaticon.com/512/3898/3898082.png"
    },
    ella: {
      definition: "A girl's name, and one of the main characters in this story.",
      example: "Ella helped Leo find their way through the jungle.",
      visualization: "https://cdn-icons-png.flaticon.com/512/3898/3898082.png"
    }
  };
  
  // Smart definition generator - creates definitions for words not in dictionary
  const generateDefinition = (word) => {
    // Get word in lowercase
    const lowerWord = word.toLowerCase();
    
    // Check for common word endings to guess part of speech
    
    // Verb forms
    if (lowerWord.endsWith('ing')) {
      const root = lowerWord.slice(0, -3);
      return {
        definition: `The action of ${root}ing something or someone.`,
        example: `They were ${lowerWord} through the forest all day.`,
        visualization: "https://cdn-icons-png.flaticon.com/512/2548/2548374.png"
      };
    }
    
    if (lowerWord.endsWith('ed')) {
      const root = lowerWord.slice(0, -2);
      return {
        definition: `Completed the action of ${root}ing.`,
        example: `They ${lowerWord} the beautiful scenery.`,
        visualization: "https://cdn-icons-png.flaticon.com/512/2548/2548374.png"
      };
    }
    
    // Nouns
    if (lowerWord.endsWith('s') && !lowerWord.endsWith('ss')) {
      const singular = lowerWord.slice(0, -1);
      return {
        definition: `More than one ${singular}.`,
        example: `The ${lowerWord} were all around them in the jungle.`,
        visualization: "https://cdn-icons-png.flaticon.com/512/3437/3437489.png"
      };
    }
    
    // Adjectives
    if (lowerWord.endsWith('ful')) {
      const root = lowerWord.slice(0, -3);
      return {
        definition: `Full of or having the quality of ${root}.`,
        example: `The ${lowerWord} display caught everyone's attention.`,
        visualization: "https://cdn-icons-png.flaticon.com/512/742/742751.png"
      };
    }
    
    if (lowerWord.endsWith('y')) {
      return {
        definition: `Having the qualities or characteristics of ${lowerWord.slice(0, -1)}.`,
        example: `It was a ${lowerWord} day in the jungle.`,
        visualization: "https://cdn-icons-png.flaticon.com/512/742/742751.png"
      };
    }
    
    // Default definition by examining context
    const sentences = storyText.match(/[^.!?]+[.!?]+/g) || [storyText];
    let contextSentence = "";
    
    // Find a sentence containing this word
    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes(lowerWord)) {
        contextSentence = sentence;
        break;
      }
    }
    
    // If we found the word in context
    if (contextSentence) {
      return {
        definition: `A word meaning "${lowerWord}" in this story. It appears in: "${contextSentence.trim()}"`,
        example: `The word "${lowerWord}" is used to describe something in the story.`,
        visualization: "https://cdn-icons-png.flaticon.com/512/3898/3898082.png"
      };
    }
    
    // Very generic fallback (should rarely be used)
    return {
      definition: `A word that appears in the story with meaning related to "${lowerWord}".`,
      example: `The word "${lowerWord}" helps us understand the story better.`,
      visualization: "https://cdn-icons-png.flaticon.com/512/3898/3898082.png"
    };
  };
  
  // Handle word selection with intelligent fallback
  const handleWordSelect = async (word) => {
    if (!word || word === selectedWord) return;
    
    setSelectedWord(word);
    setMode('word');
    setIsLoading(true);
    setError(null);
    setWordData(null);
    
    try {
      // First check our local dictionary
      const dictionaryEntry = wordDictionary[word.toLowerCase()];
      
      if (dictionaryEntry) {
        // Use local dictionary entry
        setWordData(dictionaryEntry);
        
        // Speak the explanation
        speak(`${word}. ${dictionaryEntry.definition}`);
      } else {
        // Try to fetch from API
        try {
          const response = await fetch('/api/explain-word', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              word,
              storyContext: storyText,
              grade
            })
          });
          
          if (!response.ok) {
            throw new Error('API unavailable');
          }
          
          const data = await response.json();
          setWordData(data);
          
          // Speak the explanation
          speak(`${word}. ${data.definition}`);
        } catch (apiError) {
          // Generate an intelligent definition instead of generic fallback
          const generatedDefinition = generateDefinition(word);
          setWordData(generatedDefinition);
          speak(`${word}. ${generatedDefinition.definition}`);
        }
      }
    } catch (err) {
      const generatedDefinition = generateDefinition(word);
      setWordData(generatedDefinition);
      speak(`${word}. ${generatedDefinition.definition}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Generate reading questions
  const generateQuestions = async () => {
    setMode('question');
    setIsLoading(true);
    setError(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setUserAnswer('');
    setFeedback(null);
    
    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          storyText,
          grade,
          count: 3
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate questions');
      }
      
      const data = await response.json();
      setQuestions(data.questions);
      
      // Speak the first question
      if (data.questions.length > 0) {
        speak(data.questions[0].question);
      }
      
    } catch (err) {
      setError(err.message);
      console.error('Error generating questions:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Check answer
  const checkAnswer = async () => {
    if (!userAnswer.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/check-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: questions[currentQuestionIndex].question,
          answer: userAnswer,
          storyText,
          grade
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to check answer');
      }
      
      const data = await response.json();
      setFeedback(data);
      
      // Speak the feedback
      speak(data.feedback);
      
    } catch (err) {
      setError(err.message);
      console.error('Error checking answer:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Move to next question
  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      setUserAnswer('');
      setFeedback(null);
      
      // Speak the next question
      speak(questions[currentQuestionIndex + 1].question);
    } else {
      // End of questions
      setMode('help');
      speak("Great job answering all the questions!");
    }
  };
  
  // Read story aloud
  const readStoryAloud = () => {
    if (!hasSpeech) return;
    
    // Cancel any ongoing speech
    speechSynth.cancel();
    
    // Break the story into smaller chunks to avoid long utterances
    const sentences = storyText.match(/[^.!?]+[.!?]+/g) || [storyText];
    
    sentences.forEach((sentence, index) => {
      const utterance = new SpeechSynthesisUtterance(sentence.trim());
      utterance.voice = getVoice();
      utterance.rate = 0.85; // Slower for story reading
      
      // Add a delay between sentences
      utterance.onend = () => {
        // Could implement text highlighting here
      };
      
      setTimeout(() => {
        speechSynth.speak(utterance);
      }, index * 250); // Slight delay between queuing sentences
    });
  };
  
  // Stop reading
  const stopReading = () => {
    if (hasSpeech) {
      speechSynth.cancel();
    }
  };
  
  // Process story text to make words interactive
  const processStoryText = () => {
    if (!storyText) return null;
    
    // Split text by spaces, preserving punctuation
    const words = storyText.split(/\b/);
    
    return (
      <div className={styles.interactiveText} ref={textRef}>
        {words.map((word, index) => {
          // Skip spaces and punctuation for click handlers
          if (/^\s*$/.test(word) || /^[.,;:!?()[\]{}'"—–-]$/.test(word)) {
            return <span key={index}>{word}</span>;
          }
          
          // Clean the word for comparison
          const cleanWord = word.toLowerCase().replace(/[.,;:!?()[\]{}'"—–-]/g, '');
          
          // Check if this is a vocabulary word
          const isVocabWord = vocabularyWords.some(
            vocabWord => vocabWord.toLowerCase() === cleanWord
          );
          
          return (
            <span
              key={index}
              className={`
                ${styles.interactiveWord} 
                ${isVocabWord ? styles.vocabWord : ''}
                ${cleanWord === selectedWord.toLowerCase() ? styles.selectedWord : ''}
              `}
              onClick={() => handleWordSelect(cleanWord)}
            >
              {word}
            </span>
          );
        })}
      </div>
    );
  };
  
  // Speak greeting when coach appears
  useEffect(() => {
    if (isVisible && hasSpeech) {
      speak(character.greeting);
    }
    
    return () => {
      if (hasSpeech) {
        speechSynth.cancel();
      }
    };
  }, [isVisible, character, hasSpeech]);
  
  // If not visible, don't render
  if (!isVisible) return null;
  
  return (
    <div className={styles.coachOverlay}>
      <div className={styles.coachContainer} ref={coachRef}>
        <div className={styles.coachHeader} style={{ backgroundColor: character.color }}>
          <div className={styles.characterInfo}>
            <span className={styles.characterEmoji}>{character.emoji}</span>
            <span className={styles.characterName}>{character.name}</span>
          </div>
          <div className={styles.coachControls}>
            <button
              className={styles.controlButton}
              onClick={switchCharacter}
              title="Change character"
            >
              🔄
            </button>
            <button
              className={styles.controlButton}
              onClick={onClose}
              title="Close reading coach"
            >
              ✖️
            </button>
          </div>
        </div>
        
        <div className={styles.coachContent}>
          {/* Mode selector */}
          <div className={styles.modeTabs}>
            <button
              className={`${styles.modeTab} ${mode === 'help' ? styles.activeTab : ''}`}
              onClick={() => setMode('help')}
            >
              Reading Help
            </button>
            <button
              className={`${styles.modeTab} ${mode === 'question' ? styles.activeTab : ''}`}
              onClick={generateQuestions}
            >
              Questions
            </button>
          </div>
          
          {/* Help mode */}
          {mode === 'help' && (
            <div className={styles.helpMode}>
              <div className={styles.readControls}>
                <button 
                  className={styles.readButton}
                  onClick={readStoryAloud}
                  disabled={!hasSpeech}
                >
                  Read Aloud 🔊
                </button>
                <button 
                  className={styles.stopButton}
                  onClick={stopReading}
                  disabled={!hasSpeech}
                >
                  Stop Reading ⏹️
                </button>
              </div>
              
              <div className={styles.instructions}>
                {character.emoji} Click on any word to learn more about it!
              </div>
              
              <div className={styles.storyTextContainer}>
                {processStoryText()}
              </div>
            </div>
          )}
          
          {/* Word explanation mode */}
          {mode === 'word' && (
            <div className={styles.wordMode}>
              <h3 className={styles.selectedWordHeading}>
                {selectedWord}
              </h3>
              
              {isLoading ? (
                <div className={styles.loadingContainer}>
                  <div className={styles.spinner}></div>
                  <p>Finding information...</p>
                </div>
              ) : error ? (
                <div className={styles.errorMessage}>
                  <p>{error}</p>
                  <button 
                    className={styles.retryButton}
                    onClick={() => handleWordSelect(selectedWord)}
                  >
                    Try Again
                  </button>
                </div>
              ) : wordData ? (
                <div className={styles.wordInfoContainer}>
                  <div className={styles.definitionSection}>
                    <h4>Definition:</h4>
                    <p>{wordData.definition}</p>
                  </div>
                  
                  <div className={styles.exampleSection}>
                    <h4>Example:</h4>
                    <p>{wordData.example}</p>
                  </div>
                  
                  {wordData.visualization && (
                    <div className={styles.visualizationSection}>
                      <div 
                        className={styles.wordImage}
                        style={{ backgroundImage: `url(${wordData.visualization})` }}
                      ></div>
                    </div>
                  )}
                  
                  <button 
                    className={styles.backButton}
                    onClick={() => {
                      setMode('help');
                      setSelectedWord('');
                    }}
                  >
                    Back to Reading
                  </button>
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p>Select a word to get started</p>
                </div>
              )}
            </div>
          )}
          
          {/* Question mode */}
          {mode === 'question' && (
            <div className={styles.questionMode}>
              {isLoading && !questions.length ? (
                <div className={styles.loadingContainer}>
                  <div className={styles.spinner}></div>
                  <p>Creating questions about the story...</p>
                </div>
              ) : error ? (
                <div className={styles.errorMessage}>
                  <p>Sorry, I couldn't create questions right now.</p>
                  <button 
                    className={styles.retryButton}
                    onClick={generateQuestions}
                  >
                    Try Again
                  </button>
                </div>
              ) : questions.length > 0 ? (
                <div className={styles.questionContainer}>
                  <div className={styles.questionCount}>
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </div>
                  
                  <h3 className={styles.questionText}>
                    {questions[currentQuestionIndex].question}
                  </h3>
                  
                  <textarea
                    className={styles.answerInput}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    disabled={!!feedback || isLoading}
                  />
                  
                  {!feedback ? (
                    <button
                      className={styles.checkAnswerButton}
                      onClick={checkAnswer}
                      disabled={!userAnswer.trim() || isLoading}
                    >
                      {isLoading ? 'Checking...' : 'Check Answer'}
                    </button>
                  ) : (
                    <div className={styles.feedbackContainer}>
                      <div className={`${styles.feedbackMessage} ${feedback.isCorrect ? styles.correctFeedback : styles.improvementFeedback}`}>
                        {feedback.feedback}
                      </div>
                      
                      <button
                        className={styles.nextButton}
                        onClick={nextQuestion}
                      >
                        {currentQuestionIndex < questions.length - 1 
                          ? 'Next Question' 
                          : 'Finish'
                        }
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p>Let's create some questions about the story!</p>
                  <button 
                    className={styles.generateButton}
                    onClick={generateQuestions}
                  >
                    Generate Questions
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIReadingCoach;