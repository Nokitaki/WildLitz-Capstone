// src/pages/games/crossword/GameplayScreen.jsx - FIXED VERSION
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BackToHomeButton from '../crossword/BackToHomeButton';
import crosswordAnalyticsService from '../../../services/crosswordAnalyticsService';

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
  sessionId
}) => {
  // State management
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
  const [isPaused, setIsPaused] = useState(false);

  const gridInitializedRef = useRef(false);
  const startTime = useRef(Date.now());
  const wordStartTime = useRef(Date.now());
  const hintsUsedForCurrentWordRef = useRef(0); // ✅ Use ref instead of state

  const INITIAL_HINTS = 3;
  const hintsUsed = INITIAL_HINTS - hintsRemaining;

  // Validation
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
  const isCurrentWordSolved = solvedClues[currentWord?.answer];

  // Initialize grid
  useEffect(() => {
    if (puzzle && puzzle.words && !gridInitializedRef.current) {
      createSimpleGrid();
      gridInitializedRef.current = true;
    }
  }, [puzzle]);

  // Set initial selected clue
  useEffect(() => {
    if (puzzle && puzzle.words && puzzle.words.length > 0 && !selectedClue) {
      setSelectedClue(puzzle.words[0]);
      setCurrentWordIndex(0);
    }
  }, [puzzle]);

  // Generate choices when clue changes
  useEffect(() => {
    if (currentWord && !solvedClues[currentWord.answer]) {
      generateChoicesForClue(currentWord);
      setSelectedAnswer(null);
      setFeedback(null);
      hintsUsedForCurrentWordRef.current = 0; // ✅ Reset ref
      wordStartTime.current = Date.now();
    }
  }, [currentWordIndex, currentWord]);

  // Sync solvedClues with solvedWords prop
  useEffect(() => {
    if (solvedWords && solvedWords.length > 0) {
      const solved = {};
      solvedWords.forEach(sw => {
        const word = typeof sw === 'string' ? sw : sw.word;
        if (word) solved[word] = true;
      });
      setSolvedClues(solved);
    }
  }, [solvedWords]);

  // Create simple grid layout
  const createSimpleGrid = () => {
    const words = puzzle.words;
    const maxLength = Math.max(...words.map(w => w.answer.length));
    const width = maxLength + 2;
    const height = words.length * 2;
    const cells = [];

    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
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

    words.forEach((word, wordIdx) => {
      const row = wordIdx * 2;
      
      for (let i = 0; i < word.answer.length; i++) {
        const col = i + 1;
        const cellIndex = row * width + col;
        
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
  };

  // Generate answer choices
  const generateChoicesForClue = (clue) => {
    if (!clue || !clue.answer) return;

    const correctAnswer = clue.answer;
    const choices = [correctAnswer];

    const otherWords = puzzle.words
      .filter(w => w && w.answer && w.answer !== correctAnswer)
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

    const shuffled = choices.sort(() => Math.random() - 0.5);
    setAnswerChoices(shuffled);
  };

  // Handle answer selection
  const handleSelectAnswer = (choice) => {
    if (feedback || isCurrentWordSolved) return;
    setSelectedAnswer(choice);
  };

  // Handle submit answer
  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !currentWord || isCurrentWordSolved) return;

    const correctAnswer = currentWord.answer;
    const isCorrect = selectedAnswer.toUpperCase() === correctAnswer.toUpperCase();
    
    setFeedback({ 
      type: isCorrect ? 'success' : 'error',
      message: isCorrect ? `Correct! "${correctAnswer}" is the right answer!` : 'Try again!'
    });

    if (isCorrect) {
      setTimeout(async () => {
        // Clear feedback before showing celebration
        setFeedback(null);
        
        // Mark as solved
        setSolvedClues(prev => ({ ...prev, [correctAnswer]: true }));

        // Reveal in grid
        const wordIdx = puzzle.words.findIndex(w => w.answer === correctAnswer);
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

        // Log to analytics
        if (sessionId) {
          try {
            const timeForWord = (Date.now() - wordStartTime.current) / 1000;
            const hintsForThisWord = hintsUsedForCurrentWordRef.current; // ✅ Get current value
            
            console.log(`📊 Logging word "${correctAnswer}": time=${timeForWord.toFixed(1)}s, hints=${hintsForThisWord}`);
            
            await crosswordAnalyticsService.logWordSolved(
              sessionId,
              {
                word: correctAnswer,
                definition: currentWord.definition || '',
                clue: currentWord.clue || '',
                episodeNumber: storyContext?.episodeNumber || 1,
                puzzleId: puzzle?.id || 'unknown'
              },
              timeForWord,
              hintsForThisWord // ✅ Use ref value
            );
          } catch (error) {
            console.log('Analytics failed:', error.message);
          }
        }

        // Call parent handler
        if (onWordSolved) {
          onWordSolved(
            correctAnswer,
            currentWord.clue || '',
            `The word "${correctAnswer}" is in the story.`
          );
        }

        // Show celebration (feedback already cleared above)
        triggerCelebration();

        // Move to next word
        setTimeout(() => {
          if (currentWordIndex < totalWords - 1) {
            handleNext();
          }
        }, 2000);
      }, 1000);
    } else {
      setTimeout(() => {
        setFeedback(null);
        setSelectedAnswer(null);
      }, 1500);
    }
  };

  // Handle mark as solved (teacher control)
  const handleMarkSolved = async () => {
    if (!currentWord || isCurrentWordSolved) return;

    const word = currentWord.answer;
    
    // Mark as solved
    setSolvedClues(prev => ({ ...prev, [word]: true }));
    
    // Reveal in grid
    const wordIdx = puzzle.words.findIndex(w => w.answer === word);
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
    
    // Log to analytics
    if (sessionId) {
      try {
        const timeForWord = (Date.now() - wordStartTime.current) / 1000;
        const hintsForThisWord = hintsUsedForCurrentWordRef.current; // ✅ Get current value
        
        console.log(`📊 Marking word "${word}" as solved: time=${timeForWord.toFixed(1)}s, hints=${hintsForThisWord}`);
        
        await crosswordAnalyticsService.logWordSolved(
          sessionId,
          {
            word,
            definition: currentWord.definition || '',
            clue: currentWord.clue || '',
            episodeNumber: storyContext?.episodeNumber || 1,
            puzzleId: puzzle?.id || 'unknown'
          },
          timeForWord,
          hintsForThisWord // ✅ Use ref value
        );
      } catch (error) {
        console.log('Analytics failed:', error.message);
      }
    }

    // Call parent handler
    if (onWordSolved) {
      onWordSolved(word, currentWord.definition || '', currentWord.example || '');
    }
    
    triggerCelebration();
    
    setTimeout(() => {
      if (currentWordIndex < totalWords - 1) {
        handleNext();
      }
    }, 2000);
  };

  // Navigation handlers
  const handleNext = () => {
    if (currentWordIndex < totalWords - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      setSelectedClue(puzzle.words[currentWordIndex + 1]);
      setFeedback(null);
      setSelectedAnswer(null);
      hintsUsedForCurrentWordRef.current = 0; // ✅ Reset ref
      wordStartTime.current = Date.now();
      console.log(`➡️ Moving to next word. Hints reset to 0 for new word.`);
    }
  };

  const handlePrevious = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1);
      setSelectedClue(puzzle.words[currentWordIndex - 1]);
      setFeedback(null);
      setSelectedAnswer(null);
      hintsUsedForCurrentWordRef.current = 0; // ✅ Reset ref
      wordStartTime.current = Date.now();
      console.log(`⬅️ Moving to previous word. Hints reset to 0 for new word.`);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleJumpToWord = (index) => {
    setCurrentWordIndex(index);
    setSelectedClue(puzzle.words[index]);
    setFeedback(null);
    setSelectedAnswer(null);
    hintsUsedForCurrentWordRef.current = 0; // ✅ Reset ref
    wordStartTime.current = Date.now();
    console.log(`🔢 Jumped to word #${index + 1}. Hints reset to 0 for new word.`);
  };

  const handleUseHint = () => {
    if (hintsRemaining > 0 && !isCurrentWordSolved) {
      setHintsRemaining(hintsRemaining - 1);
      hintsUsedForCurrentWordRef.current += 1; // ✅ Increment ref
      console.log(`💡 Hint used! Total for game: ${3 - hintsRemaining + 1}, For current word: ${hintsUsedForCurrentWordRef.current}`);
      setSelectedAnswer(currentWord.answer);
      setShowHintTooltip(true);
      setTimeout(() => setShowHintTooltip(false), 2000);
    }
  };

  // Celebration effects
  const triggerCelebration = () => {
    setShowCelebration(true);
    const pieces = [];
    for (let i = 0; i < 30; i++) {
      pieces.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.3,
        duration: 2 + Math.random() * 1,
        emoji: ['🎉', '⭐', '✨', '🌟'][Math.floor(Math.random() * 4)]
      });
    }
    setConfettiPieces(pieces);
    setTimeout(() => {
      setShowCelebration(false);
      setConfettiPieces([]);
    }, 2500);
  };

  // Get word status
  const getWordStatus = (word) => {
    if (solvedClues[word.answer]) return 'solved';
    if (currentWord.answer === word.answer) return 'current';
    return 'pending';
  };

  // Render grid
  const renderGrid = () => {
    if (gridCells.length === 0) {
      return <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Loading puzzle...</div>;
    }

    return puzzle.words.map((word, idx) => {
      const status = getWordStatus(word);
      const isSolved = solvedClues[word.answer];
      
      return (
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.1 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 15px',
            background: status === 'solved' ? 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)' : 
                       status === 'current' ? 'linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%)' : 
                       '#f8f9fa',
            borderRadius: '12px',
            border: status === 'current' ? '3px solid #ffc107' : '2px solid transparent',
            boxShadow: status === 'current' ? '0 4px 15px rgba(255,193,7,0.3)' : '0 2px 5px rgba(0,0,0,0.1)',
            transform: status === 'current' ? 'scale(1.02)' : 'scale(1)',
            transition: 'all 0.3s ease',
            marginBottom: '8px'
          }}
        >
          <div style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: status === 'solved' ? '#28a745' : '#667eea',
            minWidth: '45px',
            textAlign: 'center'
          }}>
            {status === 'solved' ? '✅' : word.number}
          </div>
          
          <div style={{ display: 'flex', gap: '5px', flex: 1 }}>
            {word.answer.split('').map((letter, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: idx * 0.1 + i * 0.05 }}
                style={{
                  width: '45px',
                  height: '45px',
                  border: status === 'solved' ? '3px solid #28a745' : 
                         status === 'current' ? '3px solid #ffc107' : '3px solid #667eea',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: status === 'solved' ? '#155724' : '#5a3e7e',
                  background: 'white',
                  boxShadow: status === 'current' ? '0 2px 8px rgba(255,193,7,0.3)' : 'none'
                }}
              >
                {isSolved ? letter : ''}
              </motion.div>
            ))}
          </div>
        </motion.div>
      );
    });
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      padding: '15px',
      boxSizing: 'border-box',
      fontFamily: "'Poppins', 'Comic Sans MS', Arial, sans-serif",
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Home Button - POSITIONED ON LEFT SIDE */}
      <div style={{ position: 'absolute', top: '15px', left: '20px', zIndex: 100 }}>
        <BackToHomeButton 
          customMessage="Are you sure you want to quit? Your crossword progress will be lost!"
        />
      </div>

      {/* Top Stats Bar - CENTERED */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.98)',
        padding: '12px 25px',
        borderRadius: '18px',
        boxShadow: '0 6px 18px rgba(0, 0, 0, 0.3)',
        marginBottom: '15px'
      }}>
        <div style={{ display: 'flex', gap: '35px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>⏱️</span>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#5a3e7e' }}>
              {timeFormatted}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>💡</span>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#5a3e7e' }}>
              {hintsRemaining}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>✅</span>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#5a3e7e' }}>
              {solvedCount}/{totalWords}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{
        display: 'flex',
        gap: '20px',
        flex: 1,
        overflow: 'hidden',
        minHeight: 0
      }}>
        {/* LEFT SIDE - Grid (58%) */}
        <div style={{
          flex: '0 0 58%',
          background: 'white',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <h2 style={{
            fontSize: '24px',
            color: '#5a3e7e',
            margin: '0 0 15px 0',
            textAlign: 'center',
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
          }}>
            📖 {storyContext?.title || puzzle.title || "Crossword Puzzle"}
          </h2>

          {/* Word Number Quick Jump */}
          <div style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            marginBottom: '15px',
            flexWrap: 'wrap'
          }}>
            {puzzle.words.map((word, idx) => {
              const status = getWordStatus(word);
              return (
                <button
                  key={idx}
                  onClick={() => handleJumpToWord(idx)}
                  style={{
                    width: '42px',
                    height: '42px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    border: status === 'current' ? '3px solid #ffc107' : '2px solid #667eea',
                    borderRadius: '10px',
                    background: status === 'solved' ? '#28a745' : status === 'current' ? '#fff3cd' : 'white',
                    color: status === 'solved' ? 'white' : '#5a3e7e',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: status === 'current' ? '0 3px 10px rgba(255,193,7,0.4)' : 'none'
                  }}
                >
                  {word.number}
                </button>
              );
            })}
          </div>

          {/* Grid */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px'
          }}>
            {renderGrid()}
          </div>
        </div>

        {/* RIGHT SIDE - Controls (42%) */}
        <div style={{
          flex: '0 0 40%',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          overflow: 'hidden',
          minHeight: 0
        }}>
          {/* Current Clue Card */}
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
            <div style={{
              fontSize: '20px',
              color: '#2d3748',
              lineHeight: '1.4',
              fontWeight: '600',
              padding: '12px',
              background: '#f8f9fa',
              borderRadius: '10px',
              borderLeft: '4px solid #667eea'
            }}>
              {currentWord.clue || `${currentWord.answer.length}-letter word`}
            </div>
          </div>

          {/* Answer Choices or Solved Message */}
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
                    <motion.button
                      key={index}
                      onClick={() => handleSelectAnswer(choice)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
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
                        transition: 'all 0.3s ease',
                        boxShadow: selectedAnswer === choice ? '0 5px 18px rgba(102,126,234,0.4)' : '0 2px 6px rgba(0,0,0,0.1)',
                        opacity: feedback ? 0.6 : 1
                      }}
                    >
                      {choice}
                    </motion.button>
                  ))}
                </div>

                {selectedAnswer && !feedback && (
                  <motion.button
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={handleSubmitAnswer}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
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
                      flexShrink: 0
                    }}
                  >
                    ✨ Submit Answer
                  </motion.button>
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

          {/* Teacher Controls - FIXED TO ALWAYS BE VISIBLE */}
          <div style={{
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {/* Navigation Row */}
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
                onClick={handleSkip}
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
                ⏭️ Skip
              </button>
              
              <button
                onClick={handleNext}
                disabled={currentWordIndex === totalWords - 1}
                style={{
                  padding: '14px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: currentWordIndex === totalWords - 1 ? '#e0e0e0' : 'white',
                  color: currentWordIndex === totalWords - 1 ? '#999' : '#667eea',
                  border: '2px solid #667eea',
                  borderRadius: '12px',
                  cursor: currentWordIndex === totalWords - 1 ? 'not-allowed' : 'pointer',
                  opacity: currentWordIndex === totalWords - 1 ? 0.5 : 1
                }}
              >
                Next ➡️
              </button>
            </div>

            {/* Hint and Mark Solved Row */}
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
                    Answer revealed! ✨
                  </div>
                )}
              </button>
              
              <button
                onClick={handleMarkSolved}
                disabled={isCurrentWordSolved}
                style={{
                  padding: '14px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: isCurrentWordSolved ? '#e0e0e0' : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                  color: isCurrentWordSolved ? '#999' : 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: isCurrentWordSolved ? 'not-allowed' : 'pointer',
                  boxShadow: !isCurrentWordSolved ? '0 3px 12px rgba(40,167,69,0.4)' : 'none',
                  opacity: isCurrentWordSolved ? 0.5 : 1
                }}
              >
                ✅ Mark Solved
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Overlay - Only show if celebration is not showing */}
      <AnimatePresence>
        {feedback && !showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: feedback.type === 'success' ? 
                'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)' : 
                'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              borderRadius: '25px',
              padding: '40px 60px',
              textAlign: 'center',
              boxShadow: '0 15px 40px rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
              border: '6px solid white',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div style={{ fontSize: '90px', marginBottom: '15px' }}>
              {feedback.type === 'success' ? '🎉' : '💪'}
            </div>
            <div style={{
              fontSize: '42px',
              fontWeight: 'bold',
              color: 'white',
              textShadow: '3px 3px 6px rgba(0,0,0,0.3)',
              textAlign: 'center',
              width: '100%'
            }}>
              {feedback.type === 'success' ? 'CORRECT!' : 'Try Again!'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 999
            }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", duration: 0.6 }}
              style={{
                background: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
                borderRadius: '25px',
                padding: '50px 70px',
                textAlign: 'center',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                border: '6px solid white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div style={{ fontSize: '100px', marginBottom: '20px' }}>🎉🌟✨</div>
              <div style={{
                fontSize: '42px',
                fontWeight: 'bold',
                color: 'white',
                textShadow: '3px 3px 6px rgba(0,0,0,0.3)',
                textAlign: 'center',
                width: '100%'
              }}>
                Amazing Work!
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confetti */}
      <AnimatePresence>
        {confettiPieces.map(piece => (
          <motion.div
            key={piece.id}
            initial={{ top: '-10%', left: `${piece.left}%`, opacity: 1 }}
            animate={{ top: '110%', opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: piece.duration,
              delay: piece.delay,
              ease: 'linear'
            }}
            style={{
              position: 'fixed',
              fontSize: '28px',
              pointerEvents: 'none',
              zIndex: 9999
            }}
          >
            {piece.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default GameplayScreen;