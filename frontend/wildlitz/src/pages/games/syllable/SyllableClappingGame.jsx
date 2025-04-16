import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../../styles/games/syllable/SyllableClappingGame.module.css';
import SyllableConfigScreen from './SyllableConfigScreen';
import SyllableDemoScreen from './SyllableDemoScreen';
import CompletionScreen from './CompletionScreen';

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
  
  // Handle checking the answer
  const handleCheckAnswer = () => {
    setGamePhase('feedback');
    // In a real implementation, you would validate the answer here
  };
  
  // Handle showing the demo screen
  const handleShowDemo = () => {
    setGamePhase('demo');
  };
  
  // Handle going back from demo to feedback
  const handleBackFromDemo = () => {
    setGamePhase('feedback');
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
  
  // Render the appropriate component based on game phase
  const renderGameContent = () => {
    switch(gamePhase) {
      case 'config':
        return <SyllableConfigScreen onStartGame={handleStartGame} />;
        
      case 'playing':
      case 'feedback':
        return (
          <div className={styles.container}>
            {/* Game Header */}
            <div className={styles.gameHeader}>
              <h1>Syllable Clapping Game</h1>
              
              <div className={styles.progressContainer}>
                <div className={styles.progressInfo}>
                  <span>Word {currentIndex} of {totalWords}</span>
                </div>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${(currentIndex / totalWords) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            {gamePhase === 'playing' ? (
              /* Playing Phase */
              <div className={styles.gameCard}>
                <div className={styles.categoryBadge}>
                  {currentWord.category}
                </div>
                
                <div className={styles.wordDisplay}>
                  <h2>{currentWord.word}</h2>
                  <button className={styles.soundButton}>
                    <span className={styles.soundIcon}>🔊</span>
                    Play Word
                  </button>
                </div>
                
                <div className={styles.clapSection}>
                  <div className={styles.instruction}>
                    <p>Listen to the word and clap for each syllable!</p>
                  </div>
                  
                  <button 
                    className={styles.clapButton}
                    onClick={handleClap}
                  >
                    <span className={styles.clapIcon}>👏</span>
                  </button>
                  
                  <div className={styles.clapCount}>
                    {clapCount} claps
                  </div>
                </div>
                
                <div className={styles.actionButtons}>
                  <button 
                    className={styles.checkButton}
                    onClick={handleCheckAnswer}
                    disabled={clapCount === 0}
                  >
                    Check Answer
                  </button>
                </div>
              </div>
            ) : (
              /* Feedback Phase */
              <div className={`${styles.gameCard} ${styles.feedbackCard}`}>
                <div className={styles.feedbackHeader}>
                  <div className={styles.feedbackIcon}>✅</div>
                  <h2 className={styles.feedbackTitle}>Correct!</h2>
                  <p className={styles.feedbackDescription}>
                    Great job! "{currentWord.word}" has {currentWord.count} syllables.
                  </p>
                </div>
                
                <div className={styles.syllableBreakdown}>
                  <h3>Syllable Breakdown</h3>
                  <div className={styles.syllables}>
                    {currentWord.syllables.split('-').map((syllable, index) => (
                      <div key={index} className={styles.syllable}>
                        {syllable}
                        <button className={styles.syllablePlayButton}>🔊</button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className={styles.actionButtons}>
                  <button 
                    className={styles.demoButton}
                    onClick={handleShowDemo}
                  >
                    Show Demonstration
                  </button>
                  
                  <button 
                    className={styles.nextButton}
                    onClick={handleNextWord}
                  >
                    Next Word
                  </button>
                </div>
              </div>
            )}
            
            {/* Character animation could go here, static for now */}
            <div className={styles.characterContainer}>
              <div className={styles.character}>
                🧒
              </div>
            </div>
          </div>
        );
        
      case 'demo':
        return <SyllableDemoScreen word={currentWord} onBack={handleBackFromDemo} />;
        
      case 'complete':
        return <CompletionScreen stats={gameStats} onPlayAgain={handlePlayAgain} onGoHome={handleGoHome} />;
        
      default:
        return <SyllableConfigScreen onStartGame={handleStartGame} />;
    }
  };
  
  return renderGameContent();
};

export default SyllableClappingGame;