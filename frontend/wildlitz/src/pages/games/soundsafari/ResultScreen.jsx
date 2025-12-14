import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import styles from "../../../styles/games/safari/ResultsScreen.module.css";
import {
  playCelebrationSound,
  playSpeech,
  stopAllSpeech,
} from "../../../utils/soundUtils";

const ResultsScreen = ({
  results,
  onNextRound,
  onTryAgain,
  currentRound,
  totalRounds,
  environment = "jungle",
}) => {
  const [isPlaying, setIsPlaying] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [feedbackPlayed, setFeedbackPlayed] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const isMountedRef = useRef(true);
  const speechTimeoutRef = useRef(null);

  const {
    correctAnimals,
    incorrectAnimals,
    selectedAnimals,
    targetSound,
    soundPosition,
  } = results;

  const isLastRound = currentRound === totalRounds;

  const correctSelected = selectedAnimals.filter((animal) =>
    correctAnimals.some((a) => a.id === animal.id)
  );

  const incorrectSelected = selectedAnimals.filter((animal) =>
    incorrectAnimals.some((a) => a.id === animal.id)
  );

  const missedCorrect = correctAnimals.filter(
    (animal) => !selectedAnimals.some((a) => a.id === animal.id)
  );

  const calculateScore = () => {
    const correctCount = correctSelected.length;
    const actualIncorrect = incorrectSelected.length;
    const missedCount = missedCorrect.length;

    const totalIncorrect = actualIncorrect + missedCount;

    const total = correctCount + totalIncorrect;

    const successRate =
      total > 0
        ? (correctCount / total) * 100
        : correctAnimals.length === 0
        ? 100
        : 0;

    return Math.round(successRate * 10) / 10;
  };

  const score = calculateScore();

  const getFeedbackMessage = () => {
    if (score >= 90) return "Excellent Work!";
    if (score >= 70) return "Great Job!";
    if (score >= 50) return "Good Effort!";
    return "Keep Practicing!";
  };

  const getFeedbackIcon = () => {
    if (score >= 90) return "🏆";
    if (score >= 70) return "🌟";
    if (score >= 50) return "👍";
    return "🌱";
  };

  const getPositionText = () => {
    if (!soundPosition) return "";
    switch (soundPosition) {
      case "beginning":
        return "at the beginning";
      case "middle":
        return "in the middle";
      case "ending":
        return "at the end";
      case "anywhere":
        return "anywhere";
      default:
        return "";
    }
  };

  const getCharacterFeedback = () => {
    const positionText = getPositionText();

    if (!correctAnimals || correctAnimals.length === 0) {
      if (score === 100) {
        return `Perfect! You correctly identified that there were NO animals with the "${targetSound}" sound ${positionText}! Great listening skills! 🎯`;
      } else {
        return `Oops! There were NO animals with the "${targetSound}" sound ${positionText}, so you shouldn't have selected any. Let's try again!`;
      }
    }

    const correctMessage = `You found ${correctSelected.length} out of ${correctAnimals.length} animals with the "${targetSound}" sound ${positionText}!`;

    if (score >= 90) {
      return `Wonderful job! ${correctMessage} That's excellent listening!`;
    } else if (score >= 70) {
      return `Great work! ${correctMessage} You're becoming a sound expert!`;
    } else if (score >= 50) {
      return `Good effort! ${correctMessage} Keep practicing and you'll get even better.`;
    } else if (score === 0 && correctAnimals.length > 0) {
      return `${correctMessage} Don't worry! Let's try listening more carefully next time.`;
    } else {
      return `${correctMessage} Keep practicing to improve your sound recognition!`;
    }
  };

  const handlePlaySound = (animal) => {
    if (isPlaying || !isMountedRef.current) return;

    setIsPlaying(animal.id);
    playSpeech(animal.name, 0.8, () => {
      if (isMountedRef.current) {
        setIsPlaying(null);
      }
    });
  };

  useEffect(() => {
    isMountedRef.current = true;

    if (score >= 70) {
      setShowConfetti(true);
      playCelebrationSound(score);
    }

    if (!feedbackPlayed) {
      speechTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          playSpeech(getCharacterFeedback(), 0.9, () => {
            if (isMountedRef.current) {
              setFeedbackPlayed(true);
            }
          });
        }
      }, 1000);
    }

    return () => {
      console.log("🧹 ResultsScreen unmounting");
      isMountedRef.current = false;
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      stopAllSpeech();
    };
  }, []);

  const handleNextRoundClick = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    stopAllSpeech();
    onNextRound();
  };

  const handleTryAgainClick = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    stopAllSpeech();
    onTryAgain();
  };

  return (
    <div
      className={`${styles.resultsContainer} ${
        styles[`${environment}Background`]
      }`}
    >
      <div className={styles.resultsCard}>
        {showConfetti && (
          <div className={styles.confettiContainer}>
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={i}
                className={styles.confettiPiece}
                style={{
                  backgroundColor: `hsl(${Math.random() * 360}, 80%, 60%)`,
                  width: `${Math.random() * 8 + 5}px`,
                  height: `${Math.random() * 8 + 5}px`,
                  top: `-20px`,
                  left: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [`0vh`, `100vh`],
                  x: [0, Math.random() * 80 - 40],
                  rotate: [
                    0,
                    Math.random() * 360 * (Math.random() > 0.5 ? 1 : -1),
                  ],
                }}
                transition={{
                  duration: Math.random() * 2 + 2,
                  ease: "linear",
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
        )}

        <div className={styles.resultsHeader}>
          <h2 className={styles.resultsTitle}>
            <span className={styles.titleEmoji}>🔍</span>
            Safari Results
          </h2>
        </div>

        <div className={styles.scoreSection}>
          <div
            className={styles.scoreBanner}
            style={{
              backgroundImage: `linear-gradient(to right, 
              ${score >= 70 ? "#4caf50" : score >= 50 ? "#ff9800" : "#f44336"}, 
              ${
                score >= 70 ? "#81c784" : score >= 50 ? "#ffb74d" : "#ef5350"
              })`,
            }}
          >
            <div className={styles.scoreIcon}>{getFeedbackIcon()}</div>
            <div className={styles.scoreContent}>
              <div className={styles.scoreLabel}>{getFeedbackMessage()}</div>

              <div className={styles.scoreValue}>{score.toFixed(1)}%</div>
            </div>
          </div>

          <div className={styles.scoreInfo}>
            <span className={styles.scoreText}>
              You found:{" "}
              <span>
                {correctSelected.length}/{correctAnimals.length || 0}
              </span>
            </span>
          </div>
        </div>

        {(!correctAnimals || correctAnimals.length === 0) && (
          <div className={styles.feedbackMessageBox}>
            <p className={styles.feedbackContent}>
              {score === 100
                ? `🎯 Smart choice! There were no animals with the "${targetSound}" sound ${getPositionText()}.`
                : `💡 Tip: There were no animals with the "${targetSound}" sound ${getPositionText()} in this round!`}
            </p>
          </div>
        )}

        <div className={styles.resultsContent}>
          <div className={styles.resultsColumn}>
            <div className={styles.resultSection}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>✅</span>
                <h3>Correct Animals</h3>
              </div>

              {correctSelected.length > 0 ? (
                <div className={styles.animalsGrid}>
                  {correctSelected.map((animal) => (
                    <motion.div
                      key={animal.id}
                      className={styles.animalResult}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => handlePlaySound(animal)}
                    >
                      <div className={styles.animalResultImage}>
                        {animal.image_url ? (
                          <img src={animal.image_url} alt={animal.name} />
                        ) : (
                          <span>🐾</span>
                        )}
                      </div>
                      <div className={styles.animalResultName}>
                        {animal.name}
                      </div>
                      <button className={styles.playSoundBtn}>
                        {isPlaying === animal.id ? "🔊" : "🔈"}
                      </button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p>
                    {correctAnimals && correctAnimals.length === 0
                      ? `No animals with "${targetSound}" sound ${getPositionText()}`
                      : "No correct animals selected"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {missedCorrect.length > 0 && (
            <div className={styles.resultsColumn}>
              <div className={styles.resultSection}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionIcon}>❗</span>
                  <h3>You Missed These</h3>
                </div>

                <div className={styles.animalsGrid}>
                  {missedCorrect.map((animal) => (
                    <motion.div
                      key={animal.id}
                      className={styles.animalResult}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => handlePlaySound(animal)}
                    >
                      <div className={styles.animalResultImage}>
                        {animal.image_url ? (
                          <img src={animal.image_url} alt={animal.name} />
                        ) : (
                          <span>🐾</span>
                        )}
                      </div>
                      <div className={styles.animalResultName}>
                        {animal.name}
                      </div>
                      <button className={styles.playSoundBtn}>
                        {isPlaying === animal.id ? "🔊" : "🔈"}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {incorrectSelected.length > 0 && (
            <div className={styles.resultsColumn}>
              <div className={styles.resultSection}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionIcon}>❌</span>
                  <h3>Incorrect Selections</h3>
                </div>

                <div className={styles.animalsGrid}>
                  {incorrectSelected.map((animal) => (
                    <motion.div
                      key={animal.id}
                      className={styles.animalResult}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => handlePlaySound(animal)}
                    >
                      <div className={styles.animalResultImage}>
                        {animal.image_url ? (
                          <img src={animal.image_url} alt={animal.name} />
                        ) : (
                          <span>🐾</span>
                        )}
                      </div>
                      <div className={styles.animalResultName}>
                        {animal.name}
                      </div>
                      <button className={styles.playSoundBtn}>
                        {isPlaying === animal.id ? "🔊" : "🔈"}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.actionButtons}>
          <motion.button
            className={styles.tryAgainButton}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleTryAgainClick}
            disabled={isTransitioning}
          >
            <span className={styles.buttonIcon}>🔄</span>
            Try Again
          </motion.button>

          <motion.button
            className={
              isLastRound ? styles.completeSafariButton : styles.nextButton
            }
            whileHover={{
              scale: 1.03,
              boxShadow: isLastRound
                ? "0 8px 20px rgba(255, 215, 0, 0.6), 0 0 40px rgba(255, 215, 0, 0.4)"
                : "0 6px 12px rgba(0, 0, 0, 0.15)",
            }}
            whileTap={{ scale: 0.97 }}
            onClick={handleNextRoundClick}
            disabled={isTransitioning}
          >
            <span className={styles.buttonIcon}>
              {isLastRound ? "🏆" : "▶️"}
            </span>
            {isLastRound ? "Complete Safari" : "Next Round"}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;
