import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../../styles/games/syllable/SyllableClappingGame.module.css';
import SyllableConfigScreen from './SyllableConfigScreen';
import SyllableDemoScreen from './SyllableDemoScreen';
import CompletionScreen from './CompletionScreen';
import Character from '../../../assets/img/wildlitz-idle.png';
import Butterfly from '../../../assets/img/butterfly.jpg'; // for visual example

const SyllableClappingGame = () => {
  const navigate = useNavigate();
  
  // Game state management
  const [gamePhase, setGamePhase] = useState('config'); // config, playing, feedback, demo, complete
  const [gameConfig, setGameConfig] = useState(null);
  const [currentWord, setCurrentWord] = useState({
    word: "butterfly",
    syllables: "but-ter-fly",
    count: 3,
    category: "Animals"
  });
  const [clapCount, setClapCount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(1);
  const [totalWords, setTotalWords] = useState(10);
  const [gameStats, setGameStats] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleMessage, setBubbleMessage] = useState("");
  
  // Card flip state
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  
  // Generate hint/welcome messages for different game states
  // [In real implemetation the get message will be Ai generated to provide more variety of message and interaction based on the presented word]
  const getStartMessage = () => {
    const messages = [ 
      `Listen to "${currentWord.word}" and count the syllables!`,
      `Ready for "${currentWord.word}"? Listen carefully!`,
      `Clap along with "${currentWord.word}"!`,
      `Let's count syllables in "${currentWord.word}"!`,
      `Time to clap for "${currentWord.word}"!`
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };
  
  // Show welcome message when a new word starts
  useEffect(() => {
    if (gamePhase === 'playing') {
      // Set message and show bubble
      setBubbleMessage(getStartMessage());
      setShowBubble(true);
      
      // Hide bubble after 4 seconds
      const bubbleTimer = setTimeout(() => {
        setShowBubble(false);
      }, 5000);
      
      // Show image flip at the start
      setIsFlipped(true);
      setIsFlipping(true);
      
      // Auto flip back to word after 4 seconds
      const flipTimer = setTimeout(() => {
        setIsFlipped(false);
        setIsFlipping(true);
      }, 3000);
      
      return () => {
        clearTimeout(bubbleTimer);
        clearTimeout(flipTimer);
      };
    }
  }, [gamePhase, currentWord]);
  
  // Handle card flip transition end
  const handleFlipTransitionEnd = () => {
    setIsFlipping(false);
  };
  
  // Handle manual card flip
  const handleCardFlip = () => {
    if (!isFlipping) {
      setIsFlipped(!isFlipped);
      setIsFlipping(true);
    }
  };
  
  // Handle starting the game from config screen
  const handleStartGame = (config) => {
    setGameConfig(config);
    // Here you would load words based on config
    setGamePhase('playing');
  };
  
  // Handle clap button press
  const handleClap = () => {
    setClapCount(prev => prev + 1);
  };
  
  // Handle play sound button
  const handlePlaySound = () => {
    setIsPlaying(true);
    // Simulate audio playing for 2 seconds
    setTimeout(() => setIsPlaying(false), 2000);
  };
  
  // Handle checking the answer
  const handleCheckAnswer = () => {
    setGamePhase('feedback');
    // Set feedback message based on correct/incorrect
    setBubbleMessage(
      clapCount === currentWord.count 
        ? "Great job! That's correct!" 
        : "Nice try! Listen again."
    );
    setShowBubble(true);
  };
  
  // Handle showing the demo screen
  const handleShowDemo = () => {
    setGamePhase('demo');
  };
  
  // Handle going back from demo to feedback
  const handleBackFromDemo = () => {
    setGamePhase('feedback');
    // Show feedback bubble again when returning from demo
    setShowBubble(true);
  };
  
  // Handle moving to next word
  const handleNextWord = () => {
    // Increase the word index
    const nextIndex = currentIndex + 1;
    
    // Check if we've completed all words
    if (nextIndex > totalWords) {
      // Game is complete, calculate stats
      const sampleStats = {
        totalWords: totalWords,
        correctAnswers: 8,
        accuracy: '80%',
        difficulty: gameConfig?.difficulty || 'Medium',
        completionTime: '3:45'
      };
      setGameStats(sampleStats);
      setGamePhase('complete');
    } else {
      // Move to next word
      setCurrentIndex(nextIndex);
      setClapCount(0);
      setGamePhase('playing');
      
      // New word message will be set by the useEffect
      
      // Here you would load the next word data
    }
  };
  
  // Handle playing again
  const handlePlayAgain = () => {
    setGamePhase('config');
    setClapCount(0);
    setCurrentIndex(1);
  };
  
  // Handle returning to home
  const handleGoHome = () => {
    navigate('/home');
  };
  
  // Render Playing Phase
  const renderPlayingPhase = () => {
    return (
      <div className={styles.gameContainer}>
        {/* Game Header */}
        <div className={styles.gameHeader}>
          <h1>Syllable Clapping Game</h1>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${(currentIndex / totalWords) * 100}%` }}
            />
            <span className={styles.progressText}>{currentIndex}/{totalWords}</span>
          </div>
        </div>
        
        {/* Main Game Area */}
        <div className={styles.gameArea}>
          {/* Character on the Left */}
          <div className={styles.characterSide}>
            <div className={styles.characterWrapper}>
              <img src={Character} alt="WildLitz Character" className={styles.character} />
              
              {/* Feedback bubble below character - now shows on start */}
              {showBubble && (
                <div className={styles.feedbackBubble}>
                  {bubbleMessage}
                </div>
              )}
            </div>
            
            <div className={styles.gameInfo}>
              <div className={styles.infoItem}>
                <span>Category:</span>
                <span>{currentWord.category}</span>
              </div>
              <div className={styles.infoItem}>
                <span>Difficulty:</span>
                <span>{gameConfig?.difficulty || 'Medium'}</span>
              </div>
            </div>
          </div>
          
          {/* Word Display in Center - Now with flip effect */}
          <div 
            className={`${styles.wordSection} ${isFlipped ? styles.flipped : ''}`}
            onClick={handleCardFlip}
            onTransitionEnd={handleFlipTransitionEnd}
          >
            {/* Front side - Word information */}
            <div className={styles.cardFront}>
              <div className={styles.wordImageContainer}>
                <div className={styles.wordImage}>
                  <span>🦋</span>
                </div>
              </div>
              
              <div className={styles.wordDisplay}>
                <h2>{currentWord.word}</h2>
                <button 
                  className={`${styles.playButton} ${isPlaying ? styles.playing : ''}`}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card flip when clicking button
                    handlePlaySound();
                  }}
                  disabled={isPlaying}
                >
                  <span className={styles.soundIcon}>🔊</span>
                  <span>{isPlaying ? 'Playing...' : 'Listen'}</span>
                </button>
              </div>
              
              <div className={styles.flipInstruction}>
                Click to see image
              </div>
            </div>
            
            {/* Back side - Real image */}
            <div className={styles.cardBack}>
              <div className={styles.realImageContainer}>
                <img 
                  src={Butterfly} 
                  alt={currentWord.word} 
                  className={styles.realImage}
                />
              </div>
              <div className={styles.funFactContainer}> {/** Later will be AI generated */}
                <span className={styles.funFactIcon}>💡</span>
                <div className={styles.funFact}>Fun fact: Butterflies taste with their feet and can see ultraviolet light invisible to humans!</div>
              </div>
              <div className={styles.flipInstruction}>
                Click to see word
              </div>
            </div>
          </div>
          
          {/* Clap Area on Right */}
          <div className={styles.clapSection}>
            <p className={styles.instructions}>Clap for each syllable!</p>
            
            <button 
              className={styles.clapButton}
              onClick={handleClap}
            >
              <span className={styles.clapIcon}>👏</span>
            </button>
            
            <div className={styles.clapCountDisplay}>
              <span className={styles.clapCount}>{clapCount}</span>
              <span className={styles.clapLabel}>claps</span>
            </div>
            
            <button 
              className={styles.checkButton}
              onClick={handleCheckAnswer}
              disabled={clapCount === 0}
            >
              Check Answer
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Render Feedback Phase
  const renderFeedbackPhase = () => {
    return (
      <div className={styles.gameContainer}>
        {/* Game Header */}
        <div className={styles.gameHeader}>
          <h1>Syllable Clapping Game</h1>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${(currentIndex / totalWords) * 100}%` }}
            />
            <span className={styles.progressText}>{currentIndex}/{totalWords}</span>
          </div>
        </div>
        
        {/* Feedback Game Area */}
        <div className={styles.gameArea}>
          {/* Character on the Left */}
          <div className={styles.characterSide}>
            <div className={styles.characterWrapper}>
              <img src={Character} alt="WildLitz Character" className={styles.character} />
              
              {/* Feedback bubble below character */}
              {showBubble && (
                <div className={`${styles.feedbackBubble} ${clapCount === currentWord.count ? styles.correct : styles.incorrect}`}>
                  {bubbleMessage}
                </div>
              )}
            </div>
            
            {/* Game info stays at the bottom */}
            <div className={styles.gameInfo}>
              <div className={styles.infoItem}>
                <span>Category:</span>
                <span>{currentWord.category}</span>
              </div>
              <div className={styles.infoItem}>
                <span>Difficulty:</span>
                <span>{gameConfig?.difficulty || 'Medium'}</span>
              </div>
            </div>
          </div>
          
          {/* Word and Image - Now with flip effect */}
          <div 
            className={`${styles.wordSection} ${isFlipped ? styles.flipped : ''}`}
            onClick={handleCardFlip}
            onTransitionEnd={handleFlipTransitionEnd}
          >
            {/* Front side - Word information */}
            <div className={styles.cardFront}>
              <div className={styles.wordImageContainer}>
                <div className={styles.wordImage}>
                  <span>🦋</span>
                </div>
              </div>
              
              <div className={styles.wordDisplay}>
                <h2>{currentWord.word}</h2>
                <div className={styles.resultDisplay}>
                  {clapCount === currentWord.count ? 
                    <span className={styles.correctResult}>✅ Correct!</span> : 
                    <span className={styles.incorrectResult}>
                      ⚠️ {currentWord.word} has {currentWord.count} syllables
                    </span>
                  }
                </div>
              </div>
              
              <div className={styles.flipInstruction}>
                Click to see image
              </div>
            </div>
            
            {/* Back side - Real image */}
            <div className={styles.cardBack}>
              <div className={styles.realImageContainer}>
                <img 
                  src={Butterfly} 
                  alt={currentWord.word} 
                  className={styles.realImage}
                />
              </div>
              <div className={styles.funFactContainer}> {/** Later will be AI generated */}
                <span className={styles.funFactIcon}>💡</span>
                <div className={styles.funFact}>Fun fact: Butterflies taste with their feet and can see ultraviolet light invisible to humans!</div>
              </div>
              <div className={styles.flipInstruction}>
                Click to see word
              </div>
            </div>
          </div>
          
          {/* Syllable Breakdown */}
          <div className={styles.syllableSection}>
            <h3>Syllable Breakdown</h3>
            
            <div className={styles.syllables}>
              {currentWord.syllables.split('-').map((syllable, index) => (
                <div key={index} className={styles.syllable}>
                  <span>{syllable}</span>
                  <button 
                    className={styles.syllablePlayButton}
                    onClick={() => handlePlaySound()}
                  >
                    🔊
                  </button>
                </div>
              ))}
            </div>
            
            {/* AI Feedback Section */}
            <div className={styles.aiFeedbackSection}>
              <div className={styles.aiFeedbackTitle}>
                <span>🤖</span> AI Learning Assistant
              </div>
              <div className={styles.aiFeedbackContent}>
                In "butterfly", we hear three distinct syllables: but-ter-fly. Each syllable has one vowel sound. Try clapping slowly as you say but-ter-fly to feel each syllable!
              </div>
            </div>
            
            <div className={styles.actionButtons}>
              <button 
                className={styles.demoButton}
                onClick={handleShowDemo}
              >
                Sound Demo
              </button>
              
              <button 
                className={styles.nextButton}
                onClick={handleNextWord}
              >
                Next Word
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render the appropriate component based on game phase
  const renderGameContent = () => {
    switch(gamePhase) {
      case 'config':
        return <SyllableConfigScreen onStartGame={handleStartGame} />;
        
      case 'playing':
        return renderPlayingPhase();
        
      case 'feedback':
        return renderFeedbackPhase();
        
      case 'demo':
        return <SyllableDemoScreen word={currentWord} onBack={handleBackFromDemo} />;
        
      case 'complete':
        return <CompletionScreen stats={gameStats} onPlayAgain={handlePlayAgain} onGoHome={handleGoHome} />;
        
      default:
        return <SyllableConfigScreen onStartGame={handleStartGame} />;
    }
  };
  
  return (
    <div className={styles.container}>
      {renderGameContent()}
    </div>
  );
};

export default SyllableClappingGame;