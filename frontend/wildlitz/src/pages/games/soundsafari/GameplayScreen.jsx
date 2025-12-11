import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "../../../styles/games/safari/GameplayScreen.module.css";
import { playSpeech, stopAllSpeech } from "../../../utils/soundUtils";

const GameplayScreen = ({
  animals,
  targetSound,
  soundPosition,
  onSubmit,
  timeLimit,
  skipIntro = false,
  environment = "jungle",
}) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedAnimals, setSelectedAnimals] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [showHint, setShowHint] = useState(false);
  const [isPlaying, setIsPlaying] = useState(null);
  const [currentIntroAnimal, setCurrentIntroAnimal] = useState(null);
  const [showCenterStage, setShowCenterStage] = useState(false);
  const [isIntroducing, setIsIntroducing] = useState(false);
  const [canSkipAnimal, setCanSkipAnimal] = useState(false);
  const [introductionsComplete, setIntroductionsComplete] = useState(false);

  const timerRef = useRef(null);
  const isIntroducingRef = useRef(false);
  const hasIntroducedRef = useRef(false);
  const readCountRef = useRef(0);
  const introPlayedRef = useRef(false);
  const introSpeechInProgressRef = useRef(false);
  const skipAnimalRef = useRef(false);
  const currentSpeechResolveRef = useRef(null);
  const selectedAnimalsRef = useRef([]);
  const hasSubmittedRef = useRef(false);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const getPositionText = () => {
    switch (soundPosition) {
      case "beginning":
        return "at the beginning";
      case "middle":
        return "in the middle";
      case "ending":
        return "at the end";
      default:
        return "anywhere";
    }
  };

  const generateIntroSpeech = () => {
    const positionText = getPositionText();
    return `Let's find the animals with the "${targetSound}" sound ${positionText} of their names! Listen carefully and select all the matching animals.`;
  };

  const playIntroSpeech = () => {
    if (
      introPlayedRef.current ||
      introSpeechInProgressRef.current ||
      skipIntro
    ) {
      console.log("⏭️ Skipping intro speech");
      return Promise.resolve();
    }

    console.log("🎤 Playing intro speech...");
    introSpeechInProgressRef.current = true;
    const speechText = generateIntroSpeech();

    return new Promise((resolve) => {
      playSpeech(speechText, 0.9, () => {
        console.log("✅ Intro speech completed");
        introPlayedRef.current = true;
        introSpeechInProgressRef.current = false;
        resolve();
      });
    });
  };

  const readAnimalTwice = (animalName) => {
    return new Promise((resolve) => {
      readCountRef.current = 0;
      skipAnimalRef.current = false;
      currentSpeechResolveRef.current = resolve;

      const readOnce = () => {
        if (skipAnimalRef.current) {
          console.log(`⏭️ Skipped "${animalName}"`);
          stopAllSpeech();
          resolve();
          return;
        }

        readCountRef.current++;
        console.log(`🔊 Reading "${animalName}" (${readCountRef.current}/2)`);

        playSpeech(animalName, 0.9, () => {
          if (skipAnimalRef.current) {
            console.log(`⏭️ Skipped "${animalName}"`);
            stopAllSpeech();
            resolve();
            return;
          }

          if (readCountRef.current === 1) {
            setTimeout(() => {
              readOnce();
            }, 500);
          } else if (readCountRef.current === 2) {
            console.log(`✅ Finished reading "${animalName}"`);
            setTimeout(() => {
              resolve();
            }, 800);
          }
        });
      };

      readOnce();
    });
  };

  const introduceSingleAnimal = (animal) => {
    return new Promise((resolve) => {
      console.log(`🐾 Introducing: ${animal.name}`);

      setCurrentIntroAnimal(animal);
      setShowCenterStage(true);
      setCanSkipAnimal(true);

      setTimeout(async () => {
        await readAnimalTwice(animal.name);
        setCanSkipAnimal(false);
        setCurrentIntroAnimal(null);
        setTimeout(() => {
          resolve();
        }, 300);
      }, 300);
    });
  };

  const handleSkipCurrentAnimal = () => {
    console.log("⏭️ Skip button clicked");
    skipAnimalRef.current = true;
    stopAllSpeech();

    if (currentSpeechResolveRef.current) {
      currentSpeechResolveRef.current();
      currentSpeechResolveRef.current = null;
    }

    setCanSkipAnimal(false);
  };

  const introduceAllAnimals = () => {
    return new Promise(async (resolve) => {
      if (isIntroducingRef.current || hasIntroducedRef.current) {
        console.log("⏭️ Animals already introduced, skipping");
        resolve();
        return;
      }

      console.log("🎯 Starting animal introductions...");
      isIntroducingRef.current = true;
      setIsIntroducing(true);
      hasIntroducedRef.current = true;

      try {
        for (let i = 0; i < animals.length; i++) {
          await introduceSingleAnimal(animals[i]);

          if (i < animals.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
        }

        console.log("✅ All animals introduced");

        setShowCenterStage(false);
        isIntroducingRef.current = false;
        setIsIntroducing(false);
        setIntroductionsComplete(true);

        setTimeout(() => {
          startTimer();
          resolve();
        }, 500);
      } catch (error) {
        console.error("❌ Error introducing animals:", error);
        setShowCenterStage(false);
        isIntroducingRef.current = false;
        setIsIntroducing(false);
        startTimer();
        resolve();
      }
    });
  };

  const startGameSequence = async () => {
    console.log("🎮 Starting game sequence, skipIntro:", skipIntro);

    try {
      if (!skipIntro) {
        console.log("📢 Step 1: Playing intro speech...");
        await playIntroSpeech();

        console.log("⏸️ Step 2: Pause after intro...");
        await new Promise((resolve) => setTimeout(resolve, 500));

        console.log("🐾 Step 3: Introducing animals...");
        await introduceAllAnimals();
      } else {
        console.log("⏭️ Skipping intro, starting timer immediately");
        introPlayedRef.current = true;
        hasIntroducedRef.current = true;
        startTimer();
      }
    } catch (error) {
      console.error("❌ Error in game sequence:", error);
      startTimer();
    }
  };

  const handleStartGame = () => {
    console.log("🚀 User clicked Start - beginning game sequence");
    setGameStarted(true);
    setIntroductionsComplete(false);

    setTimeout(() => {
      startGameSequence();
    }, 100);
  };

  useEffect(() => {
    console.log("🚀 GameplayScreen mounted");
    selectedAnimalsRef.current = [];
    hasSubmittedRef.current = false;

    return () => {
      console.log("🛑 GameplayScreen unmounting - stopping all speech");
      stopAllSpeech();

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      isIntroducingRef.current = false;
      hasIntroducedRef.current = false;
    };
  }, []);

  const startTimer = () => {
    console.log("⏱️ Starting timer with timeLimit:", timeLimit);

    if (timerRef.current) {
      console.log("⚠️ Clearing existing timer before starting new one");
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (timeLimit > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            console.log("⏰ Time expired!");
            clearInterval(timerRef.current);
            timerRef.current = null;

            setTimeout(() => {
              handleSubmit();
            }, 0);

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleToggleSelect = (animal) => {
    if (isIntroducingRef.current || !introductionsComplete) {
      console.log("⚠️ Cannot select - introductions not complete");
      return;
    }

    setSelectedAnimals((prev) => {
      const newSelections = prev.some((a) => a.id === animal.id)
        ? prev.filter((a) => a.id !== animal.id)
        : [...prev, animal];

      selectedAnimalsRef.current = newSelections;

      return newSelections;
    });
  };

  const playAnimalSound = (e, animal) => {
    e.stopPropagation();

    if (isIntroducingRef.current || isPlaying !== null) return;

    setIsPlaying(animal.id);
    playSpeech(animal.name, 0.8, () => setIsPlaying(null));
  };

  const handleShowHint = () => {
    setShowHint(true);
    setTimeout(() => {
      setShowHint(false);
    }, 3000);
  };

  const handleSubmit = () => {
    if (hasSubmittedRef.current) {
      console.log("⚠️ Already submitted this round, ignoring duplicate call");
      return;
    }

    hasSubmittedRef.current = true;

    const currentSelections = selectedAnimalsRef.current;

    console.log("📤 Round ending - stopping all speech");
    console.log(
      `📊 Submitting with ${currentSelections.length} selected animals`
    );

    stopAllSpeech();

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    onSubmit(currentSelections);
  };

  const handleClearSelection = () => {
    if (isIntroducingRef.current) return;
    setSelectedAnimals([]);
    selectedAnimalsRef.current = [];
  };

  const isAnimalHighlighted = (animal) => {
    return currentIntroAnimal && currentIntroAnimal.id === animal.id;
  };

  if (!gameStarted) {
    return (
      <div className={styles.gameplayContainer}>
        <div className={styles.gameplayCard}>
          <motion.div
            className={styles.startScreen}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className={styles.startContent}>
              <h2 className={styles.startTitle}>🔍 Sound Safari Hunt</h2>

              <div className={styles.startInstructions}>
                <div className={styles.startInstruction}>
                  <span className={styles.startIcon}>🔊</span>
                  <p>Listen carefully to the animal names</p>
                </div>
                <div className={styles.startInstruction}>
                  <span className={styles.startIcon}>👆</span>
                  <p>
                    Select animals with the "{targetSound}" sound{" "}
                    {getPositionText()}
                  </p>
                </div>
                <div className={styles.startInstruction}>
                  <span className={styles.startIcon}>⏱️</span>
                  <p>Beat the clock - you have {timeLimit} seconds!</p>
                </div>
              </div>

              <motion.button
                className={styles.startButton}
                onClick={handleStartGame}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)",
                }}
                whileTap={{ scale: 0.95 }}
              >
                <span className={styles.startButtonIcon}>🎮</span>
                Start Game
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.gameplayContainer} ${
        styles[`${environment}Background`]
      }`}
    >
      <div className={styles.gameplayCard}>
        <div className={styles.gameHeader}>
          <div className={styles.targetInfo}>
            <h2 className={styles.gameTitle}>
              <span className={styles.titleEmoji}>🔍</span>
              Sound Safari Hunt
            </h2>
          </div>

          <div className={styles.gameControls}>
            <div className={styles.selectionCount}>
              <span className={styles.countLabel}>Selected:</span>
              <span className={styles.countNumber}>
                {selectedAnimals.length}/{animals.length}
              </span>
            </div>

            <motion.button
              className={styles.hintButton}
              onClick={handleShowHint}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              disabled={isIntroducing}
            >
              <span className={styles.hintIcon}>💡</span>
              Hint
            </motion.button>
          </div>
        </div>

        {showHint && (
          <motion.div
            className={styles.hintDisplay}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            Look for animals with the "{targetSound}" sound {getPositionText()}{" "}
            of their name!
          </motion.div>
        )}

        <div className={styles.gameContent}>
          <div className={styles.gameColumn}>
            <div className={styles.timerSection}>
              <div className={styles.timerContainer}>
                <div className={styles.timerLabel}>
                  Time:{" "}
                  <span
                    className={timeRemaining < 10 ? styles.timerWarning : ""}
                  >
                    {formatTime(timeRemaining)}
                  </span>
                </div>
                <div className={styles.timerBarContainer}>
                  <motion.div
                    className={styles.timerBar}
                    initial={{ width: "100%" }}
                    animate={{
                      width: `${(timeRemaining / timeLimit) * 100}%`,
                      backgroundColor:
                        timeRemaining < 10 ? "#f44336" : "#4caf50",
                    }}
                    transition={{ duration: 0.5 }}
                  ></motion.div>
                </div>
              </div>

              <div className={styles.instructionsSection}>
                <div className={styles.instructionCard}>
                  <div className={styles.cardIcon}>🔊</div>
                  <div className={styles.cardContent}>
                    <h3>Listen Carefully</h3>
                    <p>
                      {isIntroducing
                        ? "Animals are being introduced..."
                        : "Click on animal cards to hear their names pronounced."}
                    </p>
                  </div>
                </div>

                <div className={styles.instructionCard}>
                  <div className={styles.cardIcon}>👆</div>
                  <div className={styles.cardContent}>
                    <h3>Select Animals</h3>
                    <p>
                      Choose all animals with the "{targetSound}" sound{" "}
                      {getPositionText()}.
                    </p>
                  </div>
                </div>

                <div className={styles.instructionCard}>
                  <div className={styles.cardIcon}>⏱️</div>
                  <div className={styles.cardContent}>
                    <h3>Beat the Clock</h3>
                    <p>Submit your answers before time runs out!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`${styles.gameColumn} ${styles.animalsColumn}`}>
            <div className={styles.animalsGrid}>
              {animals.map((animal, index) => (
                <motion.div
                  key={animal.id}
                  className={`${styles.animalCard} 
                    ${
                      selectedAnimals.some((a) => a.id === animal.id)
                        ? styles.selected
                        : ""
                    } 
                    ${isAnimalHighlighted(animal) ? styles.highlighted : ""}`}
                  onClick={() => handleToggleSelect(animal)}
                  whileHover={
                    introductionsComplete && !isIntroducing
                      ? {
                          scale: 1.03,
                          boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)",
                        }
                      : {}
                  }
                  whileTap={
                    introductionsComplete && !isIntroducing
                      ? { scale: 0.97 }
                      : {}
                  }
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity:
                      isIntroducing && !isAnimalHighlighted(animal) ? 0.3 : 1,
                    y: 0,
                    scale: 1,
                  }}
                  transition={{
                    delay: index * 0.1,
                    duration: 0.3,
                  }}
                  style={{
                    cursor:
                      !introductionsComplete || isIntroducing
                        ? "not-allowed"
                        : "pointer",
                    pointerEvents:
                      !introductionsComplete || isIntroducing ? "none" : "auto",
                  }}
                >
                  <div className={styles.animalImage}>
                    {animal.image &&
                    (animal.image.startsWith("http") ||
                      animal.image.startsWith("data:")) ? (
                      <img
                        src={animal.image}
                        alt={animal.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: "10px",
                        }}
                        onError={(e) => {
                          e.target.style.display = "none";
                          if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = "block";
                          }
                        }}
                      />
                    ) : (
                      <span>{animal.image || "🐾"}</span>
                    )}
                    {animal.image &&
                      (animal.image.startsWith("http") ||
                        animal.image.startsWith("data:")) && (
                        <span style={{ display: "none" }}>
                          {animal.image || "🐾"}
                        </span>
                      )}
                  </div>
                  <div className={styles.animalInfo}>
                    <div className={styles.animalName}>
                      {animal.name}
                      <motion.button
                        className={styles.soundButton}
                        onClick={(e) => playAnimalSound(e, animal)}
                        whileHover={!isIntroducing ? { scale: 1.1 } : {}}
                        whileTap={!isIntroducing ? { scale: 0.9 } : {}}
                        disabled={isIntroducing || isPlaying !== null}
                        style={{ opacity: isIntroducing ? 0.5 : 1 }}
                      >
                        {isPlaying === animal.id ? "🔊" : "🔊"}
                      </motion.button>
                    </div>
                  </div>

                  {selectedAnimals.some((a) => a.id === animal.id) && (
                    <motion.div
                      className={styles.checkmark}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                    >
                      ✓
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>

            <div className={styles.actionButtons}>
              <motion.button
                className={styles.clearButton}
                whileHover={introductionsComplete ? { scale: 1.03 } : {}}
                whileTap={introductionsComplete ? { scale: 0.97 } : {}}
                onClick={handleClearSelection}
                disabled={
                  selectedAnimals.length === 0 ||
                  !introductionsComplete ||
                  isIntroducing
                }
                style={{
                  opacity: !introductionsComplete || isIntroducing ? 0.5 : 1,
                }}
              >
                <span className={styles.buttonIcon}>🔄</span>
                Clear Selection
              </motion.button>
              <motion.button
                className={styles.submitButton}
                whileHover={
                  introductionsComplete
                    ? {
                        scale: 1.03,
                        boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)",
                      }
                    : {}
                }
                whileTap={introductionsComplete ? { scale: 0.97 } : {}}
                onClick={handleSubmit}
                disabled={!introductionsComplete || isIntroducing}
                style={{
                  opacity: !introductionsComplete || isIntroducing ? 0.5 : 1,
                }}
              >
                <span className={styles.buttonIcon}>✅</span>
                {!introductionsComplete
                  ? "Wait for introductions..."
                  : "Submit Answer"}
              </motion.button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showCenterStage && currentIntroAnimal && (
            <motion.div
              className={styles.centerStage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className={styles.centerAnimalCard}
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 50 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                }}
              >
                <div className={styles.centerAnimalImage}>
                  {currentIntroAnimal.image &&
                  (currentIntroAnimal.image.startsWith("http") ||
                    currentIntroAnimal.image.startsWith("data:")) ? (
                    <img
                      src={currentIntroAnimal.image}
                      alt={currentIntroAnimal.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "20px",
                      }}
                    />
                  ) : (
                    <span>{currentIntroAnimal.image || "🐾"}</span>
                  )}
                </div>
                <div className={styles.centerAnimalName}>
                  {currentIntroAnimal.name}
                </div>
                <div className={styles.centerGlow} />
              </motion.div>

              {canSkipAnimal && (
                <motion.button
                  className={styles.skipAnimalButton}
                  onClick={handleSkipCurrentAnimal}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <span className={styles.skipArrow}>⏭️</span>
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GameplayScreen;
