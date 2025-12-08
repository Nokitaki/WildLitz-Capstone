
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BackToHomeButton from '../crossword/BackToHomeButton';
import crosswordAnalyticsService from '../../../services/crosswordAnalyticsService';
import CrosswordQuickTip from './CrosswordQuickTip';
import CrosswordGuideModal from './CrosswordGuideModalEnhanced';
const GameplayScreen = ({ 
  puzzle, 
  theme, 
  onWordSolved, 
  solvedWords = [], 
  timeSpent, 
  timeFormatted,
  storyContext,
  currentPuzzleIndex = 0,
  totalPuzzles = 1,
  currentEpisode = 1,
  totalEpisodes = 1,
  sessionId,
  onAnswerAttempt,
  onPuzzleComplete  
}) => {
  
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [selectedClue, setSelectedClue] = useState(null);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [gridCells, setGridCells] = useState([]);
  const [answerChoices, setAnswerChoices] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [solvedClues, setSolvedClues] = useState({});
  const [showCelebration, setShowCelebration] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState([]);
  const [showHintTooltip, setShowHintTooltip] = useState(false);


  const [currentWordAttempts, setCurrentWordAttempts] = React.useState(0);
  
  
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [revealedLetters, setRevealedLetters] = useState({}); 

  const gridInitializedRef = useRef(false);
  const wordStartTime = useRef(Date.now());
  const hintsUsedForCurrentWordRef = useRef(0);
  const celebrationTimeoutRef = useRef(null);
  const feedbackTimeoutRef = useRef(null);
  const speechSynthRef = useRef(null); 

  const INITIAL_HINTS = 3;

 

  const [showGuide, setShowGuide] = useState(() => {
  const hasSeenGuide = localStorage.getItem('wildlitz_crossword_guide_seen');
 
  return hasSeenGuide !== 'true' && currentEpisode === 1;
});
  
  if (!puzzle || !puzzle.words || !Array.isArray(puzzle.words)) {
    return (
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '24px'
      }}>
        Loading puzzle data...
      </div>
    );
  }


  const currentWord = puzzle.words[currentWordIndex];
  const totalWords = puzzle.words.length;
  const solvedCount = Object.keys(solvedClues).length;
 const isCurrentWordSolved = solvedClues[currentWordIndex];

useEffect(() => {
  const hasSeenGuide = localStorage.getItem('wildlitz_crossword_guide_seen');
 
  if (hasSeenGuide === 'true' || currentEpisode > 1) {
    setShowGuide(false);
  }
}, [currentEpisode]);



const handleAnswerSelection = useCallback((choiceIndex) => {
    if (isCurrentWordSolved || feedback) return;

    const selectedChoice = answerChoices[choiceIndex];
    setSelectedAnswer(choiceIndex);

    const isCorrect = selectedChoice === currentWord.answer;
    
  
    if (onAnswerAttempt) {
      onAnswerAttempt({
        word: currentWord.answer,
        isCorrect: isCorrect,
        timeSpent: (Date.now() - wordStartTime.current) / 1000,
        hintsUsed: hintsUsedForCurrentWordRef.current
      });
    }

    if (isCorrect) {
     
      setFeedback({ type: 'correct', message: 'Correct! 🎉' });
      
    } else {
     
      setFeedback({ type: 'incorrect', message: 'Try again!' });
      
      setTimeout(() => {
        setFeedback(null);
        setSelectedAnswer(null);
      }, 1500);
    }
  }, [currentWord, answerChoices, isCurrentWordSolved, feedback, onAnswerAttempt]);

  


const handleStartFromGuide = () => {
  setShowGuide(false);
  
};

const handleSkipGuide = () => {
  setShowGuide(false);
 
};

 
  useEffect(() => {
    if ('speechSynthesis' in window) {
      speechSynthRef.current = window.speechSynthesis;
      
     
      const loadVoices = () => {
        const voices = speechSynthRef.current.getVoices();
        
      };
      
   
      loadVoices();
      
     
      if (speechSynthRef.current.onvoiceschanged !== undefined) {
        speechSynthRef.current.onvoiceschanged = loadVoices;
      }
    }
  }, []);

 
  const speakText = useCallback((text) => {
    if (!speechSynthRef.current) return;
    
   
    speechSynthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; 
    utterance.pitch = 1.0; 
    utterance.volume = 1;
    
  
    const voices = speechSynthRef.current.getVoices();
    const ukVoice = voices.find(voice => 
      voice.lang === 'en-GB' || 
      voice.name.includes('UK') || 
      voice.name.includes('British')
    );
    if (ukVoice) {
      utterance.voice = ukVoice;
    } else {
      utterance.lang = 'en-GB'; 
    }
    
    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    
    speechSynthRef.current.speak(utterance);
  }, []);

 
  const readQuestion = useCallback(() => {
    if (currentWord?.clue) {
      speakText(currentWord.clue);
    }
  }, [currentWord, speakText]);

 
  const readChoice = useCallback((choice) => {
    speakText(choice);
  }, [speakText]);

 
  const gridWidth = useMemo(() => {
    const maxLength = Math.max(...puzzle.words.map(w => w.answer.length));
    return maxLength + 2;
  }, [puzzle.words]);

  const gridHeight = useMemo(() => puzzle.words.length * 2, [puzzle.words.length]);

 
  const createSimpleGrid = useCallback(() => {
    const cells = [];
    for (let row = 0; row < gridHeight; row++) {
      for (let col = 0; col < gridWidth; col++) {
        cells.push({
          row,
          col,
          value: '',
          revealed: false,
          number: null,
          isEmpty: true,
          letter: '',
          wordIndex: -1
        });
      }
    }

    puzzle.words.forEach((word, wordIdx) => {
      const row = wordIdx * 2;
      for (let i = 0; i < word.answer.length; i++) {
        const col = i + 1;
        const cellIndex = row * gridWidth + col;
        cells[cellIndex] = {
          row,
          col,
          value: '',
          revealed: false,
          number: i === 0 ? word.number : null,
          isEmpty: false,
          letter: word.answer[i],
          wordIndex: wordIdx
        };
      }
    });

    setGridCells(cells);
  }, [puzzle.words, gridWidth, gridHeight]);

 
  useEffect(() => {
    if (!gridInitializedRef.current) {
      createSimpleGrid();
      gridInitializedRef.current = true;
    }
  }, [createSimpleGrid]);


  useEffect(() => {
    if (puzzle?.words?.length > 0 && !selectedClue) {
      setSelectedClue(puzzle.words[0]);
    }
  }, [puzzle, selectedClue]);

 
  useEffect(() => {
    if (currentWord && !solvedClues[currentWord.answer]) {
      generateChoicesForClue(currentWord);
      setSelectedAnswer(null);
      setFeedback(null);
      hintsUsedForCurrentWordRef.current = 0;
      wordStartTime.current = Date.now();
    }
  }, [currentWordIndex, currentWord?.answer]);

 
  useEffect(() => {
  if (solvedWords?.length > 0) {
    const solved = {};
    solvedWords.forEach(sw => {
      const word = typeof sw === 'string' ? sw : sw.word;
      const wordIndex = puzzle.words.findIndex(w => w.answer.toUpperCase() === word.toUpperCase());
      if (wordIndex !== -1) {
        solved[wordIndex] = true;
      }
    });
    setSolvedClues(solved);
  }
}, [solvedWords, puzzle.words]);

 
  useEffect(() => {
    return () => {
      if (celebrationTimeoutRef.current) clearTimeout(celebrationTimeoutRef.current);
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      if (speechSynthRef.current) speechSynthRef.current.cancel();
      setShowCelebration(false);
      setConfettiPieces([]);
    };
  }, []);

 
  const updateGridWithWord = useCallback((word) => {
    if (!word) return;
    
    const wordIdx = puzzle.words.findIndex(w => w.answer === word.answer);
    if (wordIdx === -1) return;
    
    setGridCells(prevCells => {
      const newCells = [...prevCells];
      newCells.forEach((cell, idx) => {
        if (cell.wordIndex === wordIdx) {
          newCells[idx] = {
            ...cell,
            value: cell.letter,
            revealed: true
          };
        }
      });
      return newCells;
    });
  }, [puzzle.words]);

 
  const revealOneLetter = useCallback((word) => {
    if (!word) return;
    
    const wordIdx = puzzle.words.findIndex(w => w.answer === word.answer);
    if (wordIdx === -1) return;

  
    const wordKey = `${wordIdx}-${word.answer}`;
    const revealed = revealedLetters[wordKey] || [];
   
    const unrevealedIndices = [];
    for (let i = 0; i < word.answer.length; i++) {
      if (!revealed.includes(i)) {
        unrevealedIndices.push(i);
      }
    }
    
    if (unrevealedIndices.length === 0) return; 
    
  
    const randomIdx = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
    
   
    setRevealedLetters(prev => ({
      ...prev,
      [wordKey]: [...(prev[wordKey] || []), randomIdx]
    }));
    
   
    setGridCells(prevCells => {
      const newCells = [...prevCells];
      const row = wordIdx * 2;
      const col = randomIdx + 1;
      const cellIndex = row * gridWidth + col;
      
      if (newCells[cellIndex]) {
        newCells[cellIndex] = {
          ...newCells[cellIndex],
          value: newCells[cellIndex].letter,
          revealed: true
        };
      }
      
      return newCells;
    });
  }, [puzzle.words, revealedLetters, gridWidth]);

 
  const generateChoicesForClue = useCallback((clue) => {
    if (!clue?.answer) return;

    const correctAnswer = clue.answer;
    const choices = [correctAnswer];

    const otherWords = puzzle.words
      .filter(w => w?.answer && w.answer !== correctAnswer)
      .map(w => w.answer);

    const similarLength = otherWords.filter(w => 
      Math.abs(w.length - correctAnswer.length) <= 2
    );

    while (choices.length < 4 && similarLength.length > 0) {
      const randomIndex = Math.floor(Math.random() * similarLength.length);
      if (!choices.includes(similarLength[randomIndex])) {
        choices.push(similarLength[randomIndex]);
      }
      similarLength.splice(randomIndex, 1);
    }

    while (choices.length < 4 && otherWords.length > 0) {
      const randomIndex = Math.floor(Math.random() * otherWords.length);
      const randomWord = otherWords[randomIndex];
      if (!choices.includes(randomWord)) {
        choices.push(randomWord);
      }
      otherWords.splice(randomIndex, 1);
    }

    setAnswerChoices(choices.sort(() => Math.random() - 0.5));
  }, [puzzle.words]);

  const triggerCelebration = useCallback(() => {
    setShowCelebration(true);
    
    
    const pieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.3,
      duration: 2 + Math.random() * 1,
      emoji: ['🎉', '⭐', '✨', '🌟', '🎊', '🎈'][Math.floor(Math.random() * 6)]
    }));
    setConfettiPieces(pieces);
    
    if (celebrationTimeoutRef.current) clearTimeout(celebrationTimeoutRef.current);
    celebrationTimeoutRef.current = setTimeout(() => {
      setShowCelebration(false);
      setConfettiPieces([]);
    }, 3000);
  }, []);


  const moveToNextWord = useCallback(() => {
  let nextIndex = currentWordIndex + 1;
  
  if (nextIndex >= puzzle.words.length) {
    const allSolved = puzzle.words.every((_, idx) => solvedClues[idx]);
    if (allSolved) {
    
      if (onPuzzleComplete) {
        onPuzzleComplete();
      }
      return;
    }
    
    nextIndex = puzzle.words.findIndex((_, idx) => !solvedClues[idx]);
    if (nextIndex === -1) nextIndex = 0;
  }
  
  setCurrentWordIndex(nextIndex);
  setSelectedClue(puzzle.words[nextIndex]);
}, [currentWordIndex, puzzle.words, solvedClues, onPuzzleComplete]); 

  const handleSelectAnswer = useCallback((choice) => {
    if (feedback || isCurrentWordSolved) return;
    
    readChoice(choice);
    
    setSelectedAnswer(choice);
  }, [feedback, isCurrentWordSolved, readChoice]);


   React.useEffect(() => {
    setCurrentWordAttempts(0);
  }, [currentWordIndex]);


 const handleSubmitAnswer = useCallback(async () => {
  if (!selectedAnswer || !currentWord || isCurrentWordSolved) return;

  const correctAnswer = currentWord.answer;
  const isCorrect = selectedAnswer.toUpperCase() === correctAnswer.toUpperCase();
  

  const attemptNumber = currentWordAttempts + 1;
  setCurrentWordAttempts(attemptNumber);
  
 
  if (onAnswerAttempt) {
    onAnswerAttempt(correctAnswer, isCorrect, attemptNumber);
  }
  
  setFeedback({ 
    type: isCorrect ? 'success' : 'error',
    message: isCorrect ? `Correct! "${correctAnswer}" is the right answer!` : 'Try again!'
  });

  if (isCorrect) {
   
    setSolvedClues(prev => ({ ...prev, [currentWordIndex]: true }));
    updateGridWithWord(currentWord);
    
    const wordTimeSpent = Math.floor((Date.now() - wordStartTime.current) / 1000);
    
  
    if (sessionId) {
      try {
        await crosswordAnalyticsService.logWordSolved(
          sessionId,
          {
            word: correctAnswer,
            clue: currentWord.clue,
            episodeNumber: currentPuzzleIndex + 1 || 1,
            attempts: attemptNumber,
            score: attemptNumber === 1 ? 100 : attemptNumber === 2 ? 50 : attemptNumber === 3 ? 25 : 0
          },
          wordTimeSpent,
          hintsUsedForCurrentWordRef.current
        );
      } catch (error) {
        console.error('Analytics failed:', error);
      }
    }
    
  
    onWordSolved(correctAnswer, currentWord.definition || '', currentWord.example || '', hintsUsedForCurrentWordRef.current);
    
   
    triggerCelebration();
    
   
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback(null);
      setSelectedAnswer(null);
      moveToNextWord();
    }, 1500);
  } else {
   
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback(null);
      setSelectedAnswer(null); 
    }, 2000);
  }
}, [
  selectedAnswer, 
  currentWord, 
  isCurrentWordSolved, 
  sessionId, 
  onWordSolved, 
  triggerCelebration, 
  moveToNextWord, 
  updateGridWithWord, 
  currentPuzzleIndex, 
  currentWordAttempts, 
  onAnswerAttempt
]);


  const handleNext = useCallback(() => {
    if (currentWordIndex < totalWords - 1) {
      setCurrentWordIndex(prev => prev + 1);
      setSelectedClue(puzzle.words[currentWordIndex + 1]);
      setFeedback(null);
      setSelectedAnswer(null);
      hintsUsedForCurrentWordRef.current = 0;
      wordStartTime.current = Date.now();
    }
  }, [currentWordIndex, totalWords, puzzle.words]);

  const handlePrevious = useCallback(() => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(prev => prev - 1);
      setSelectedClue(puzzle.words[currentWordIndex - 1]);
      setFeedback(null);
      setSelectedAnswer(null);
      hintsUsedForCurrentWordRef.current = 0;
      wordStartTime.current = Date.now();
    }
  }, [currentWordIndex, puzzle.words]);

  const handleJumpToWord = useCallback((index) => {
    
    setCurrentWordIndex(index);
    setSelectedClue(puzzle.words[index]);
    setSelectedAnswer(null);
    setFeedback(null);
  }, [puzzle.words]);

 
  const handleUseHint = useCallback(() => {
    if (hintsRemaining > 0 && !isCurrentWordSolved) {
    
      setHintsRemaining(prev => prev - 1);
      hintsUsedForCurrentWordRef.current += 1;
      
   
      revealOneLetter(currentWord);
      
      setShowHintTooltip(true);
      setTimeout(() => setShowHintTooltip(false), 2000);
    }
  }, [hintsRemaining, isCurrentWordSolved, currentWord, revealOneLetter]);

  
const getWordStatus = useCallback((word, idx) => {
  if (solvedClues[idx]) return 'solved';
  if (idx === currentWordIndex) return 'current';
  return 'pending';
}, [solvedClues, currentWordIndex]);

 
  const renderedGrid = useMemo(() => {
    return puzzle.words.map((word, idx) => {
      const status = getWordStatus(word);
      const isSolved = solvedClues[idx];
      
      return (
        <div
          key={idx}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            padding: '12px 20px',
            background: status === 'solved' ? 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)' : 
                       status === 'current' ? 'linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%)' : 
                       '#f8f9fa',
            borderRadius: '15px',
            border: status === 'current' ? '3px solid #ffc107' : '2px solid transparent',
            boxShadow: status === 'current' ? '0 4px 15px rgba(255,193,7,0.3)' : '0 2px 5px rgba(0,0,0,0.1)',
            transform: status === 'current' ? 'scale(1.02)' : 'scale(1)',
            transition: 'all 0.2s ease',
            marginBottom: '12px'
          }}
        >
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: status === 'solved' ? '#28a745' : '#667eea',
            minWidth: '40px'
          }}>
            {word.number}.
          </div>
          <div style={{
            display: 'flex',
            gap: '8px'
          }}>
            {word.answer.split('').map((letter, letterIdx) => {
              const row = idx * 2;
              const col = letterIdx + 1;
              const cellIndex = row * gridWidth + col;
              const cell = gridCells[cellIndex];
              const isRevealed = cell?.revealed || false;
              
              return (
                <div
                  key={letterIdx}
                  style={{
                    width: '50px',
                    height: '50px',
                    border: isRevealed ? '3px solid #28a745' : '3px solid #dee2e6',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    background: isRevealed ? '#d4edda' : 'white',
                    color: isRevealed ? '#155724' : '#adb5bd',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {isRevealed ? letter.toUpperCase() : ''}
                </div>
              );
            })}
          </div>
          {isSolved && (
            <div style={{
              marginLeft: 'auto',
              fontSize: '28px'
            }}>
              ✅
            </div>
          )}
        </div>
      );
    });
  }, [puzzle.words, getWordStatus, solvedClues, gridCells, gridWidth]);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <BackToHomeButton />

      {/* Header */}
      <div style={{
        padding: '15px 30px',
        background: 'rgba(255,255,255,0.95)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        position: 'relative'
      }}>
        {/* Left spacer for balance */}
        <div style={{ width: '200px' }}></div>
        
        {/* Centered title */}
        <div style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          color: '#667eea',
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)'
        }}>
          
          📚 Episode {currentEpisode} of {totalEpisodes}
        </div>
        
        {/* Right side stats */}
        <div style={{
          display: 'flex',
          gap: '25px',
          alignItems: 'center',
          fontSize: '18px',
          fontWeight: '600'
        }}>
          <div style={{ color: '#667eea' }}>
            ⏱️ {timeFormatted}
          </div>
          <div style={{ color: '#ffc107' }}>
            💡 {hintsRemaining}
          </div>
          <div style={{ color: '#28a745' }}>
            ✅ {solvedCount}/{totalWords}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        display: 'flex',
        height: 'calc(100vh - 70px)',
        padding: '20px',
        gap: '20px'
      }}>
        {/* LEFT SIDE - Word List and Grid */}
        <div style={{
          flex: '0 0 60%',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          overflow: 'hidden'
        }}>
          {/* Word Number Buttons */}
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            padding: '15px',
            background: 'white',
            borderRadius: '15px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
          }}>
            {puzzle.words.map((word, idx) => {
                const status = getWordStatus(word, idx);
              return (
                <button
                  key={idx}
                  onClick={() => handleJumpToWord(idx)}
                  style={{
                    padding: '10px 16px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    border: status === 'current' ? '3px solid #ffc107' : '2px solid #667eea',
                    borderRadius: '10px',
                    background: status === 'solved' ? '#28a745' : status === 'current' ? '#fff3cd' : 'white',
                    color: status === 'solved' ? 'white' : '#5a3e7e',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: status === 'current' ? '0 3px 10px rgba(255,193,7,0.4)' : 'none'
                  }}
                >
                  {word.number}
                </button>
              );
            })}
          </div>

          {/* Grid - Enhanced with better spacing */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '15px',
            background: 'white',
            borderRadius: '15px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
          }}>
            {renderedGrid}
          </div>
        </div>

        {/* RIGHT SIDE - Controls */}
        <div style={{
          flex: '0 0 40%',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          overflow: 'hidden',
          minHeight: 0
        }}>
          {/* Current Clue Card WITH AUDIO BUTTON */}
          <div style={{
            background: 'white',
            borderRadius: '18px',
            padding: '20px',
            boxShadow: '0 6px 18px rgba(0, 0, 0, 0.3)',
            flexShrink: 0
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#667eea',
                background: '#f0f4ff',
                padding: '8px 16px',
                borderRadius: '12px'
              }}>
                #{currentWord.number}
              </div>
              <div style={{
                fontSize: '18px',
                color: '#6c757d',
                fontWeight: '600'
              }}>
                Question {currentWordIndex + 1} of {totalWords}
              </div>
            </div>
            
            {/* Question with Audio Button */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px',
              background: '#f8f9fa',
              borderRadius: '10px',
              borderLeft: '4px solid #667eea'
            }}>
              <div style={{
                fontSize: '20px',
                color: '#2d3748',
                lineHeight: '1.4',
                fontWeight: '600',
                flex: 1
              }}>
                {currentWord.clue || `${currentWord.answer.length}-letter word`}
              </div>
              <button
                onClick={readQuestion}
                disabled={isPlayingAudio}
                style={{
                  background: isPlayingAudio ? '#ffc107' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '45px',
                  height: '45px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  cursor: isPlayingAudio ? 'not-allowed' : 'pointer',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
                title="Listen to question"
              >
                {isPlayingAudio ? '⏸️' : '🔊'}
              </button>
            </div>
          </div>

          {/* Answer Choices WITH AUDIO */}
          <div style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {!isCurrentWordSolved ? (
              <div style={{
                background: 'white',
                borderRadius: '18px',
                padding: '20px',
                boxShadow: '0 6px 18px rgba(0, 0, 0, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
              }}>
                <h3 style={{
                  fontSize: '22px',
                  color: '#5a3e7e',
                  margin: '0 0 15px 0',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  flexShrink: 0
                }}>
                  🎯 Pick the Answer:
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginBottom: '15px',
                  flexShrink: 0
                }}>
                  {answerChoices.map((choice, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectAnswer(choice)}
                      disabled={feedback !== null}
                      style={{
                        padding: '15px',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        border: selectedAnswer === choice ? '4px solid #667eea' : '3px solid #dee2e6',
                        borderRadius: '12px',
                        background: selectedAnswer === choice ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                        color: selectedAnswer === choice ? 'white' : '#5a3e7e',
                        cursor: feedback ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: selectedAnswer === choice ? '0 5px 18px rgba(102,126,234,0.4)' : '0 2px 6px rgba(0,0,0,0.1)',
                        opacity: feedback ? 0.6 : 1
                      }}
                    >
                      {choice}
                    </button>
                  ))}
                </div>

                {selectedAnswer && !feedback && (
                  <button
                    onClick={handleSubmitAnswer}
                    style={{
                      padding: '15px',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      boxShadow: '0 5px 18px rgba(40,167,69,0.4)',
                      flexShrink: 0,
                      transition: 'transform 0.2s ease'
                    }}
                  >
                    ✨ Submit Answer
                  </button>
                )}
              </div>
            ) : (
              <div style={{
                background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)',
                borderRadius: '18px',
                padding: '25px',
                boxShadow: '0 6px 18px rgba(0, 0, 0, 0.2)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%'
              }}>
                <div style={{ fontSize: '56px', marginBottom: '12px' }}>✅</div>
                <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#155724', marginBottom: '8px' }}>
                  Already Solved!
                </div>
                <div style={{ fontSize: '22px', color: '#155724', fontWeight: '600' }}>
                  {currentWord.answer}
                </div>
              </div>
            )}
          </div>

          {/* Teacher Controls */}
          <div style={{
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '10px'
            }}>
              <button
                onClick={handlePrevious}
                disabled={currentWordIndex === 0}
                style={{
                  padding: '14px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: currentWordIndex === 0 ? '#e0e0e0' : 'white',
                  color: currentWordIndex === 0 ? '#999' : '#667eea',
                  border: '2px solid #667eea',
                  borderRadius: '12px',
                  cursor: currentWordIndex === 0 ? 'not-allowed' : 'pointer',
                  opacity: currentWordIndex === 0 ? 0.5 : 1
                }}
              >
                ⬅️ Prev
              </button>
              
              <button
                onClick={handleNext}
                disabled={currentWordIndex === totalWords - 1}
                style={{
                  padding: '14px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: 'white',
                  color: '#6c757d',
                  border: '2px solid #6c757d',
                  borderRadius: '12px',
                  cursor: currentWordIndex === totalWords - 1 ? 'not-allowed' : 'pointer',
                  opacity: currentWordIndex === totalWords - 1 ? 0.5 : 1
                }}
              >
                Next ➡️
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px'
            }}>
              <button
                onClick={handleUseHint}
                disabled={hintsRemaining === 0 || isCurrentWordSolved}
                style={{
                  padding: '14px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: hintsRemaining === 0 || isCurrentWordSolved ? '#e0e0e0' : 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)',
                  color: hintsRemaining === 0 || isCurrentWordSolved ? '#999' : 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: hintsRemaining === 0 || isCurrentWordSolved ? 'not-allowed' : 'pointer',
                  boxShadow: hintsRemaining > 0 && !isCurrentWordSolved ? '0 3px 12px rgba(255,193,7,0.4)' : 'none',
                  opacity: hintsRemaining === 0 || isCurrentWordSolved ? 0.5 : 1,
                  position: 'relative'
                }}
              >
                💡 Hint ({hintsRemaining})
                {showHintTooltip && (
                  <div style={{
                    position: 'absolute',
                    bottom: '110%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#333',
                    color: 'white',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    whiteSpace: 'nowrap',
                    zIndex: 1000
                  }}>
                    Letter revealed! ✨
                  </div>
                )}
              </button>
              
              <button
                onClick={handleSubmitAnswer}
                disabled={isCurrentWordSolved || !selectedAnswer}
                style={{
                  padding: '14px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: isCurrentWordSolved || !selectedAnswer ? '#e0e0e0' : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                  color: isCurrentWordSolved || !selectedAnswer ? '#999' : 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: isCurrentWordSolved || !selectedAnswer ? 'not-allowed' : 'pointer',
                  boxShadow: !isCurrentWordSolved && selectedAnswer ? '0 3px 12px rgba(40,167,69,0.4)' : 'none',
                  opacity: isCurrentWordSolved || !selectedAnswer ? 0.5 : 1
                }}
              >
                ✅ Submit
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Overlay */}
      <AnimatePresence>
        {feedback && !showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: feedback.type === 'success' ? 
                'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)' : 
                'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
              color: feedback.type === 'success' ? '#155724' : '#721c24',
              padding: '30px 50px',
              borderRadius: '20px',
              fontSize: '24px',
              fontWeight: 'bold',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              zIndex: 1000,
              border: feedback.type === 'success' ? '4px solid #28a745' : '4px solid #dc3545'
            }}
          >
            {feedback.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Celebration Overlay with Enhanced Confetti */}
      <AnimatePresence>
        {showCelebration && (
          <>
            {/* Success message overlay */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                color: 'white',
                padding: '40px 60px',
                borderRadius: '25px',
                fontSize: '36px',
                fontWeight: 'bold',
                boxShadow: '0 15px 50px rgba(0,0,0,0.4)',
                zIndex: 1001,
                border: '5px solid white',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '64px', marginBottom: '10px' }}>🎉</div>
              <div>Correct!</div>
            </motion.div>
            
            {/* Confetti pieces */}
            {confettiPieces.map((piece) => (
              <motion.div
                key={piece.id}
                initial={{ 
                  y: -100, 
                  opacity: 0, 
                  scale: 0,
                  x: `${piece.left}vw`
                }}
                animate={{
                  y: ['-100px', `${window.innerHeight + 100}px`],
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1.5, 1, 0.5],
                  rotate: [0, 360, 720],
                  x: `${piece.left + (Math.random() - 0.5) * 20}vw`
                }}
                transition={{
                  duration: piece.duration,
                  delay: piece.delay,
                  ease: 'easeOut'
                }}
                style={{
                  position: 'fixed',
                  fontSize: '56px',
                  zIndex: 1000,
                  pointerEvents: 'none',
                  filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.3))'
                }}
              >
                {piece.emoji}
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>
        <CrosswordQuickTip />
        {/* Guide Modal Overlay */}
{showGuide && (
  <CrosswordGuideModal
    isVisible={showGuide}
    onStart={handleStartFromGuide}
    onSkip={handleSkipGuide}
  />
)}
    </div>
  );
};

export default GameplayScreen;