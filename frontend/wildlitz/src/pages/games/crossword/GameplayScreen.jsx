// src/pages/games/crossword/GameplayScreen.jsx - Simplified Version
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from '../../../styles/games/crossword/GameplayScreen.module.css';
import BackToHomeButton from '../crossword/BackToHomeButton';
// ADD THIS IMPORT at the top with other imports
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
  const [selectedClue, setSelectedClue] = useState(null);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [showHint, setShowHint] = useState(false);
  const [lastHint, setLastHint] = useState('');
  const [showTeacherView, setShowTeacherView] = useState(false);
  const [gridCells, setGridCells] = useState([]);
  const [answerChoices, setAnswerChoices] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [solvedClues, setSolvedClues] = useState({});

  const gridInitializedRef = useRef(false);
  const startTime = useRef(Date.now());

  const INITIAL_HINTS = 3;
  const hintsUsed = INITIAL_HINTS - hintsRemaining;

   if (!puzzle || !puzzle.words || !Array.isArray(puzzle.words)) {
    return (
      <div className={styles.crosswordContainer}>
        <div className={styles.crosswordCard}>
          <div className={styles.emptyGridMessage}>Loading puzzle data...</div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (puzzle && puzzle.words && !gridInitializedRef.current) {
      createSimpleGrid();
      gridInitializedRef.current = true;
    }
  }, [puzzle]);

  useEffect(() => {
    if (puzzle && puzzle.words && puzzle.words.length > 0 && !selectedClue) {
      setSelectedClue(puzzle.words[0]);
    }
  }, [puzzle, selectedClue]);

  useEffect(() => {
    if (selectedClue) {
      generateChoicesForClue(selectedClue);
    }
  }, [selectedClue?.answer]);

  // Simple grid - each word on its own row
  const createSimpleGrid = () => {
    const words = puzzle.words;
    const maxLength = Math.max(...words.map(w => w.answer.length));
    const width = maxLength + 2;
    const height = words.length * 2;
    const cells = [];

    // Create empty grid
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

    // Place each word on its own row
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

  const generateChoicesForClue = (clue) => {
    if (!clue || !clue.answer) return;

    const correctAnswer = clue.answer;
    const choices = [correctAnswer];

    const otherWords = puzzle.words
      .filter(w => w && w.answer && w.answer !== correctAnswer)
      .map(w => w.answer);

    const similarLength = otherWords.filter(w => 
      Math.abs(w.length - correctAnswer.length) <= 1
    );

    for (let i = 0; i < 3 && i < similarLength.length; i++) {
      choices.push(similarLength[i]);
    }

    while (choices.length < 4 && otherWords.length > 0) {
      const randomWord = otherWords[Math.floor(Math.random() * otherWords.length)];
      if (!choices.includes(randomWord)) {
        choices.push(randomWord);
      }
    }

    const shuffled = choices.sort(() => Math.random() - 0.5);
    setAnswerChoices(shuffled);
  };

  const handleSelectAnswer = (choice) => {
    setSelectedAnswer(choice);
    setFeedback(null);
  };

    const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !selectedClue) return;

    const correctAnswer = selectedClue.answer;
    
    if (selectedAnswer.toUpperCase() === correctAnswer.toUpperCase()) {
      setFeedback({ 
        type: 'success', 
        message: `Correct! "${correctAnswer}" is the right answer!` 
      });

      const key = selectedClue.answer;
      setSolvedClues(prev => ({ ...prev, [key]: true }));

      // Reveal the word in the grid
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

      // Log the word solved to analytics - FIX: Use calculated hintsUsed
      if (sessionId) {
        try {
          const timeForWord = (Date.now() - startTime.current) / 1000;
          await crosswordAnalyticsService.logWordSolved(
            sessionId,
            {
              word: correctAnswer,
              definition: selectedClue.definition || '',
              clue: selectedClue.clue || '',
              episodeNumber: storyContext?.episodeNumber || 1,
              puzzleId: puzzle?.id || 'unknown'
            },
            timeForWord,
            hintsUsed  // FIX: Now this is properly defined
          );
          console.log('✅ Word solved logged:', correctAnswer);
        } catch (error) {
          console.log('⚠️ Analytics failed (continuing game):', error.message);
        }
      }

      if (onWordSolved) {
        onWordSolved(
          correctAnswer,
          selectedClue.clue || '',
          `The word "${correctAnswer}" is in the story.`
        );
      }

      setTimeout(() => {
        const nextClue = findNextUnsolved();
        if (nextClue) {
          setSelectedClue(nextClue);
          setSelectedAnswer(null);
          setFeedback(null);
        }
      }, 1500);

    } else {
      setFeedback({ type: 'error', message: 'Try again!' });
      setTimeout(() => setFeedback(null), 2000);
    }
  };


  const handleMarkSolved = async () => {
  if (selectedClue) {
    const word = selectedClue.answer;
    const definition = selectedClue.definition || '';
    const example = selectedClue.example || '';
    
    // Call parent handler
    onWordSolved(word, definition, example);
    
    // Mark as solved in state
    setSolvedClues(prev => ({
      ...prev,
      [word]: true
    }));
    
    // ✅ FIX: Reveal the word in the grid
    const wordIdx = puzzle.words.findIndex(w => w.answer === word);
    
    setGridCells(prevCells => {
      const newCells = [...prevCells];
      newCells.forEach((cell, idx) => {
        if (cell.wordIndex === wordIdx) {
          newCells[idx] = {
            ...cell,
            value: cell.letter,  // Show the letter
            revealed: true       // Mark as revealed
          };
        }
      });
      return newCells;
    });
    
    // Log to analytics if we have a session
    if (sessionId) {
      try {
        await crosswordAnalyticsService.logWordSolved(
          sessionId,
          {
            word,
            definition,
            example,
            episodeNumber: storyContext?.episodeNumber || 1,
            puzzleId: puzzle?.id || 'unknown'
          },
          timeSpent,
          hintsUsed
        );
        console.log('✅ Word marked as solved logged:', word);
      } catch (error) {
        console.log('⚠️ Analytics failed (continuing game):', error.message);
      }
    }
    
    // Clear selection and move to next word
    setTimeout(() => {
      const nextClue = findNextUnsolved();
      if (nextClue) {
        setSelectedClue(nextClue);
        setSelectedAnswer(null);
        setFeedback(null);
        setAnswerChoices([]);
      }
    }, 1000);
  }
};

  const findNextUnsolved = () => {
    for (const word of puzzle.words) {
      if (!solvedClues[word.answer]) {
        return word;
      }
    }
    return null;
  };

  const handleSelectClue = (clue) => {
    setSelectedClue(clue);
    setSelectedAnswer(null);
    setFeedback(null);
  };

  const getGridDimensions = () => {
    if (gridCells.length === 0) return { width: 0, height: 0 };
    const maxCol = Math.max(...gridCells.map(c => c.col)) + 1;
    const maxRow = Math.max(...gridCells.map(c => c.row)) + 1;
    return { width: maxCol, height: maxRow };
  };

  const renderCrosswordGrid = () => {
    if (gridCells.length === 0) {
      return <div className={styles.emptyGridMessage}>Loading puzzle...</div>;
    }

    const { width, height } = getGridDimensions();
    const selectedWordIdx = puzzle.words.findIndex(w => w.answer === selectedClue?.answer);

    return (
      <div 
        className={styles.crosswordGrid}
        style={{
          gridTemplateColumns: `repeat(${width}, 50px)`,
          gridTemplateRows: `repeat(${height}, 50px)`,
          gap: '2px',
          backgroundColor: '#e0e0e0'
        }}
      >
        {gridCells.map((cell, index) => {
          if (cell.isEmpty) {
            return (
              <div 
                key={index}
                style={{
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #e0e0e0'
                }}
              />
            );
          }

          const isSelected = cell.wordIndex === selectedWordIdx;

          return (
            <motion.div
              key={index}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.002 }}
              style={{
                backgroundColor: cell.revealed ? '#c8e6c9' : (isSelected ? '#fff9c4' : 'white'),
                border: isSelected ? '3px solid #fbc02d' : '2px solid #1976d2',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                cursor: 'pointer',
                boxShadow: isSelected ? '0 0 12px rgba(251, 192, 45, 0.6)' : 'none'
              }}
            >
              {cell.number && (
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  left: '3px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: '#666'
                }}>
                  {cell.number}
                </span>
              )}
              <span style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: cell.revealed ? '#2e7d32' : '#1565c0',
                textTransform: 'uppercase',
                fontFamily: 'Arial, sans-serif'
              }}>
                {cell.revealed ? cell.value : ''}
              </span>
            </motion.div>
          );
        })}
      </div>
    );
  };

  const renderClueList = () => {
    if (!puzzle || !puzzle.words) return null;

    return puzzle.words.map((clue, index) => {
      if (!clue || !clue.answer) return null;
      
      const isSolved = solvedClues[clue.answer];
      const isActive = selectedClue?.answer === clue.answer;

      return (
        <li
          key={index}
          className={`${styles.clueItem} ${isActive ? styles.active : ''} ${isSolved ? styles.solved : ''}`}
          onClick={() => handleSelectClue(clue)}
        >
          <span className={styles.clueNumber}>{clue.number || index + 1}</span>
          <span className={styles.clueText}>
            {clue.clue || `${clue.answer.length}-letter word`}
          </span>
        </li>
      );
    }).filter(Boolean);
  };

  return (
    <div className={styles.crosswordContainer}>
       <BackToHomeButton 
      position="top-left" 
      customMessage="Are you sure you want to quit? Your crossword progress will be lost!"
    />
   
    
   
      <div className={styles.crosswordCard}>
        <div className={styles.teacherControls}>
          <button 
            className={styles.toggleTeacherView}
            onClick={() => setShowTeacherView(!showTeacherView)}
          >
            {showTeacherView ? "Hide Teacher View" : "Show Teacher View"}
          </button>
        </div>

        <div className={styles.episodeBanner}>
          <p className={styles.episodeNumber}>Episode {storyContext?.episodeNumber || 1}</p>
          <h2 className={styles.episodeTitle}>{storyContext?.title || "Crossword Puzzle"}</h2>
        </div>

        <div className={styles.statsContainer}>
          <div className={styles.statItem}>
            <p className={styles.statLabel}>TIME</p>
            <p className={styles.statValue}>{timeFormatted}</p>
          </div>
          <div className={styles.statItem}>
            <p className={styles.statLabel}>HINTS</p>
            <p className={styles.statValue}>{hintsRemaining}</p>
          </div>
          <div className={styles.statItem}>
            <p className={styles.statLabel}>SOLVED</p>
            <p className={styles.statValue}>{Object.keys(solvedClues).length}/{puzzle.words.length}</p>
          </div>
        </div>

        <div className={styles.gameLayout}>
          <div className={styles.gameArea}>
            <div className={styles.gridContainer}>
              {renderCrosswordGrid()}
            </div>

            {selectedClue && answerChoices.length > 0 && !solvedClues[selectedClue.answer] && (
              <div className={styles.answerSection}>
                <h3 className={styles.choicesTitle}>
                  Choose the answer: <em>{selectedClue.clue || `${selectedClue.answer.length}-letter word`}</em>
                </h3>
                <div className={styles.choicesList}>
                  {answerChoices.map((choice, index) => (
                    <button
                      key={index}
                      className={`${styles.choiceButton} ${selectedAnswer === choice ? styles.selectedChoice : ''}`}
                      onClick={() => handleSelectAnswer(choice)}
                    >
                      {choice}
                    </button>
                  ))}
                </div>

                {selectedAnswer && (
                  <button 
                    className={styles.submitAnswerButton}
                    onClick={handleSubmitAnswer}
                  >
                    Submit Answer
                  </button>
                )}

                {feedback && (
                  <div className={`${styles.feedbackMessage} ${feedback.type === 'success' ? styles.successFeedback : styles.errorFeedback}`}>
                    {feedback.message}
                  </div>
                )}

                <div className={styles.teacherButtons}>
                  <button 
                    className={styles.markSolvedButton}
                    onClick={handleMarkSolved}
                  >
                    Mark as Solved
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className={styles.cluesArea}>
            <div className={styles.cluesSection}>
              <h2 className={styles.cluesTitle}>Clues:</h2>
              <div>
                <ul className={styles.clueList}>
                  {renderClueList()}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameplayScreen;