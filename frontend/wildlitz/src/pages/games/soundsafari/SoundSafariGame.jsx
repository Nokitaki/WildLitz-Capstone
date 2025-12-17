import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import styles from "../../../styles/games/safari/SoundSafariGame.module.css";

import jungleMusic from "../../../assets/music/sound-safari-background-music-2.mp3";
import oceanMusic from "../../../assets/music/Ocean.mp3";
import savannaMusic from "../../../assets/music/Savanna.mp3";
import arcticMusic from "../../../assets/music/Snow.mp3";

import WildLitzFox from "../../../assets/img/wildlitz-idle.png";

import SoundSafariConfigScreen from "./SoundSafariConfigScreen";
import SoundSafariLoadingScreen from "./SoundSafariLoadingScreen";
import SoundIntroScreen from "./SoundIntroScreen";
import GameplayScreen from "./GameplayScreen";
import ResultsScreen from "./ResultScreen";
import GameCompleteScreen from "./GameCompleteScreen";

import {
  getRandomValidSound,
  isCombinationExcluded,
} from "../../../utils/excludedCombinations";
import {
  fetchSafariAnimals,
  fetchRandomSound,
  // fetchSoundExamples, 
  // submitGameResults, 
} from "../../../services/soundSafariApi";

import soundSafariAnalyticsService from "../../../services/soundSafariAnalyticsService";

import {
  SOUND_DESCRIPTIONS,
  SOUND_POSITIONS,
  DIFFICULTY_LEVELS,
} from "../../../mock/soundSafariData";

import jungleBg from "../../../assets/img/backgrounds/Jungle.png";
import savannaBg from "../../../assets/img/backgrounds/Savannah.png";
import oceanBg from "../../../assets/img/backgrounds/Ocean.png";
import arcticBg from "../../../assets/img/backgrounds/Artic.png";

const SoundSafariGame = () => {
  const navigate = useNavigate();

  const [gameState, setGameState] = useState("config");
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);

  const audioRef = useRef(null);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeControl, setShowVolumeControl] = useState(false);

  // Background Images Mapping
  const backgrounds = {
    jungle: jungleBg,
    savanna: savannaBg,
    ocean: oceanBg,
    arctic: arcticBg,
  };

  // Music Tracks Mapping
  const musicTracks = {
    jungle: jungleMusic,
    savanna: savannaMusic,
    ocean: oceanMusic,
    arctic: arcticMusic,
  };

  const [gameConfig, setGameConfig] = useState({
    difficulty: "easy",
    targetSound: "s",
    soundPosition: SOUND_POSITIONS.beginning,
    environment: "jungle",
  });

  // --- Audio Effect Handler ---
  useEffect(() => {
    // Play music in CONFIG, LOADING, or INTRO
    if (
      (gameState === "config" || gameState === "loading" || gameState === "intro") &&
      audioRef.current
    ) {
      audioRef.current.volume = volume;
      audioRef.current.loop = true;

      const playMusic = async () => {
        try {
          await audioRef.current.play();
        } catch (error) {
          console.log("Auto-play blocked:", error);
        }
      };

      playMusic();
    } else if (
      audioRef.current &&
      gameState !== "config" && 
      gameState !== "loading" &&
      gameState !== "intro"
    ) {
      audioRef.current.pause();
    }
  }, [gameState, gameConfig.environment]); 

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleVolumeControl = () => {
    setShowVolumeControl(!showVolumeControl);
  };

  const handleEnvironmentChange = (newEnv) => {
    setGameConfig((prev) => ({ ...prev, environment: newEnv }));
  };

  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds] = useState(5);
  const [score, setScore] = useState(0);

  const [roundAnimals, setRoundAnimals] = useState([]);
  const [selectedAnimals, setSelectedAnimals] = useState([]);

  const [soundsUsed, setSoundsUsed] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(Date.now());

  const [allRoundsData, setAllRoundsData] = useState([]);
  const [currentRoundData, setCurrentRoundData] = useState(null);
  const [roundStartTime, setRoundStartTime] = useState(Date.now());

  const [error, setError] = useState(null);

  const [showBubble, setShowBubble] = useState(false);
  const [bubbleMessage, setBubbleMessage] = useState("");

  const [fromIntroScreen, setFromIntroScreen] = useState(false);

  const handleStartGame = async (config) => {
    const finalConfig = { ...config, environment: gameConfig.environment };
    setGameConfig(finalConfig);

    setSessionStartTime(Date.now());
    setAllRoundsData([]);
    setCurrentRoundData(null);
    setRoundStartTime(Date.now());

    setCurrentRound(1);
    setScore(0);
    setSoundsUsed([finalConfig.targetSound]);
    setGameState("loading");
    setFromIntroScreen(false);
    setError(null);

    // ✅ FIX: Pass soundPosition explicitly instead of relying on gameConfig state
    await prepareNewRound(
      finalConfig.targetSound,
      finalConfig.difficulty,
      0,
      [],
      finalConfig.environment,
      finalConfig.soundPosition  // ← ADD THIS
    );

    setTimeout(() => {
      setGameState("intro");
      const introMessage = `Today we're learning about the "${finalConfig.targetSound}" sound. Listen and find it in animal names!`;
      setBubbleMessage(introMessage);
      setShowBubble(true);

      setTimeout(() => {
        setShowBubble(false);
      }, 8000);
    }, 2000);
  };

  const handleViewAnalytics = () => {
    navigate("/profile?tab=soundsafari");
  };

  const saveRoundData = (
    correctSelections,
    incorrectSelections,
    missedCorrect
  ) => {
    const roundTime = Math.floor((Date.now() - roundStartTime) / 1000);

    const roundData = soundSafariAnalyticsService.formatRoundData(
      currentRound,
      gameConfig,
      {
        correctSelections,
        incorrectSelections,
        missedCorrect,
        timeSpent: roundTime,
      }
    );

    setCurrentRoundData(roundData);
    setRoundStartTime(Date.now());
  };

  const saveCompleteSession = async () => {
    try {
      const totalTimeSpent = Date.now() - sessionStartTime;

      const sessionData = soundSafariAnalyticsService.formatSessionData(
        gameConfig,
        allRoundsData,
        totalTimeSpent
      );

      await soundSafariAnalyticsService.saveGameSession(
        sessionData
      );
    } catch (error) {
      console.error("❌ Error saving session:", error);
    }
  };

  const prepareNewRound = async (
    targetSound = gameConfig.targetSound,
    difficulty = gameConfig.difficulty,
    retryCount = 0,
    triedSounds = [],
    environment = gameConfig.environment,
    soundPosition = gameConfig.soundPosition  // ← ADD THIS PARAMETER
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const currentTriedSounds = [...triedSounds, targetSound];
      // ✅ FIX: soundPosition now comes from parameter, not state

      setGameConfig((prev) => ({
        ...prev,
        targetSound,
      }));

      if (
        isCombinationExcluded(
          targetSound,
          soundPosition,
          gameConfig.environment
        )
      ) {
        const validSound = getRandomValidSound(
          soundPosition,
          currentTriedSounds,
          gameConfig.environment
        );
        setGameConfig((prev) => ({ ...prev, targetSound: validSound }));
        return prepareNewRound(
          validSound,
          difficulty,
          retryCount,
          currentTriedSounds,
          environment,
          soundPosition  // ← ADD THIS
        );
      }

      const response = await fetchSafariAnimals({
        sound: targetSound,
        difficulty: difficulty,
        environment: environment,
        position: soundPosition,
      });

      console.log('🎯 BACKEND RESPONSE:', {
        sound: targetSound,
        position: soundPosition,
        totalAnimals: response.animals?.length,
        correctCount: response.correct_count,
        animals: response.animals?.map(a => ({
          name: a.name,
          sound: a.target_sound,
          position: a.sound_position
        }))
      });

      if (response.animals && response.animals.length > 0) {
        setRoundAnimals(response.animals);
        return;
      }

      if (retryCount < 15) {
        const allSounds = Object.keys(SOUND_DESCRIPTIONS);
        const availableSounds = allSounds.filter(
          (sound) => !currentTriedSounds.includes(sound)
        );

        if (availableSounds.length > 0) {
          const newSound =
            availableSounds[Math.floor(Math.random() * availableSounds.length)];
          return prepareNewRound(
            newSound,
            difficulty,
            retryCount + 1,
            currentTriedSounds,
            environment,
            soundPosition  // ← ADD THIS
          );
        }
      }

      setError("Unable to load animals for this round");
    } catch (error) {
      setError(`Failed to load animals: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const selectNewTargetSound = async () => {
    try {
      const response = await fetchRandomSound(gameConfig.soundPosition);

      if (
        response.sound &&
        !soundsUsed.includes(response.sound) &&
        !isCombinationExcluded(
          response.sound,
          gameConfig.soundPosition,
          gameConfig.environment
        )
      ) {
        setSoundsUsed((prev) => [...prev, response.sound]);
        return response.sound;
      }

      const validSound = getRandomValidSound(
        gameConfig.soundPosition,
        soundsUsed,
        gameConfig.environment
      );

      if (validSound) {
        setSoundsUsed((prev) => [...prev, validSound]);
        return validSound;
      }

      return "s";
    } catch (error) {
      return "s";
    }
  };

  const handleContinueFromIntro = () => {
    setFromIntroScreen(true);
    setGameState("gameplay");

    const positionText = getPositionText();

    setBubbleMessage(
      `Find animals with the "${gameConfig.targetSound}" sound ${positionText} of their names!`
    );
    setShowBubble(true);

    setTimeout(() => {
      setShowBubble(false);
    }, 5000);
  };

  const getPositionText = () => {
    switch (gameConfig.soundPosition) {
      case "beginning":
        return "at the beginning";
      case "middle":
        return "in the middle";
      case "ending":
        return "at the end";
      case "anywhere":
        return "anywhere";
      default:
        return "anywhere";
    }
  };

  const handleContinueFromLoading = () => {
    setGameState("intro");
    setFromIntroScreen(false);

    const introMessage = `Today we're learning about the "${gameConfig.targetSound}" sound. Listen and find it in animal names!`;
    setBubbleMessage(introMessage);
    setShowBubble(true);

    setTimeout(() => {
      setShowBubble(false);
    }, 8000);
  };

  const handleSubmitAnswers = (selected) => {
    setSelectedAnimals(selected);

    // ✅ FIX: For Round 1, accept animals with correct sound regardless of position
    // Backend may return mixed positions when specific position has too few animals
    const correctAnimals = roundAnimals.filter((animal) => {
      return animal.target_sound === gameConfig.targetSound;
    });

    const correctSelections = selected.filter((animal) => {
      return animal.target_sound === gameConfig.targetSound;
    }).length;

    const incorrectSelections = selected.length - correctSelections;

    const roundScore =
      correctAnimals.length > 0
        ? (correctSelections / correctAnimals.length) * 100
        : 0;

    setScore((prevScore) => prevScore + roundScore);

    const missedCorrect = correctAnimals.length - correctSelections;

    saveRoundData(correctSelections, incorrectSelections, missedCorrect);

    setGameState("results");
  };

  // --- RESTORED HELPER FUNCTION ---
  const getGameResults = () => {
    const correctAnimals = roundAnimals.filter((animal) => {
      if (gameConfig.soundPosition === "anywhere") {
        return animal.target_sound === gameConfig.targetSound;
      }
      return (
        animal.target_sound === gameConfig.targetSound &&
        animal.sound_position === gameConfig.soundPosition
      );
    });

    const incorrectAnimals = roundAnimals.filter((animal) => {
      if (gameConfig.soundPosition === "anywhere") {
        return animal.target_sound !== gameConfig.targetSound;
      }
      return (
        animal.target_sound !== gameConfig.targetSound ||
        animal.sound_position !== gameConfig.soundPosition
      );
    });

    return {
      correctAnimals,
      incorrectAnimals,
      selectedAnimals,
      targetSound: gameConfig.targetSound,
      soundPosition: gameConfig.soundPosition,
    };
  };

  const handleNextRound = async () => {
    let updatedRoundsData = allRoundsData;

    if (currentRoundData) {
      updatedRoundsData = [...allRoundsData, currentRoundData];
      setAllRoundsData(updatedRoundsData);
      setCurrentRoundData(null);
    }

    if (currentRound >= totalRounds) {
      const totalTimeSpent = Date.now() - sessionStartTime;
      const sessionData = soundSafariAnalyticsService.formatSessionData(
        gameConfig,
        updatedRoundsData,
        totalTimeSpent
      );
      await soundSafariAnalyticsService.saveGameSession(sessionData);

      setGameState("complete");
      return;
    }

    setGameState("loading");
    setCurrentRound((prev) => prev + 1);
    const newSound = await selectNewTargetSound();
    setRoundStartTime(Date.now());
    await prepareNewRound(
      newSound,
      gameConfig.difficulty,
      0,
      [],
      gameConfig.environment,
      gameConfig.soundPosition  // ← ADD THIS
    );

    setTimeout(() => {
      setGameState("intro");
    }, 2000);
  };

  const handleTryAgain = async () => {
    await prepareNewRound(
      gameConfig.targetSound,
      gameConfig.difficulty,
      0,
      [],
      gameConfig.environment,
      gameConfig.soundPosition  // ← ADD THIS
    );
    setRoundStartTime(Date.now());
    setGameState("intro");
    setFromIntroScreen(false);

    const introMessage = `Let's try again with the "${gameConfig.targetSound}" sound. Listen and find it in animal names!`;
    setBubbleMessage(introMessage);
    setShowBubble(true);

    setTimeout(() => {
      setShowBubble(false);
    }, 8000);
  };

  const handlePlayAgain = async () => {
    setSessionStartTime(Date.now());
    setAllRoundsData([]);
    setCurrentRoundData(null);
    setRoundStartTime(Date.now());
    setCurrentRound(1);
    setScore(0);
    setFromIntroScreen(false);

    const newSound = await selectNewTargetSound();
    await prepareNewRound(
      newSound,
      gameConfig.difficulty,
      0,
      [],
      gameConfig.environment,
      gameConfig.soundPosition  // ← ADD THIS
    );

    setGameState("loading");

    setTimeout(() => {
      setGameState("intro");
      const introMessage = `Welcome back! Today we're learning about the "${newSound}" sound. Listen and find it in animal names!`;
      setBubbleMessage(introMessage);
      setShowBubble(true);

      setTimeout(() => {
        setShowBubble(false);
      }, 8000);
    }, 2000);
  };

  const handleChangeDifficulty = () => {
    setGameState("config");
    setFromIntroScreen(false);
  };

  const handleExitGame = () => {
    setShowExitConfirmation(true);
  };

  const confirmExit = () => {
    setShowExitConfirmation(false);
    console.log("🚪 Exit button clicked - forcing complete shutdown");
    
    // CRITICAL: Stop all speech IMMEDIATELY and repeatedly
    const forceStopAllSpeech = () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
    
    // Stop speech multiple times to ensure it's cancelled
    forceStopAllSpeech();
    setTimeout(forceStopAllSpeech, 50);
    setTimeout(forceStopAllSpeech, 100);
    setTimeout(forceStopAllSpeech, 200);
    
    // Stop all audio playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    // Clear any ongoing intervals/timers in child components
    // by changing state that triggers cleanup
    setIsLoading(false);
    setShowBubble(false);
    setBubbleMessage("");
    
    // Reset ALL game states to initial values
    setCurrentRound(1);
    setScore(0);
    setRoundAnimals([]);
    setSelectedAnimals([]);
    setSoundsUsed([]);
    setAllRoundsData([]);
    setCurrentRoundData(null);
    setFromIntroScreen(false);
    setError(null);
    
    // Force unmount all game screens by setting to a temporary state
    setGameState("exiting");
    
    // After a brief delay, go to config (ensures components unmount)
    setTimeout(() => {
      // One more speech cancellation for safety
      forceStopAllSpeech();
      
      // Reset game config to defaults
      setGameConfig({
        difficulty: "easy",
        targetSound: "s",
        soundPosition: SOUND_POSITIONS.beginning,
        environment: "jungle",
      });
      
      // Now go to config screen
      setGameState("config");
      
      console.log("✅ Game fully exited - back to config");
    }, 300);
  };

  const cancelExit = () => {
    setShowExitConfirmation(false);
  };

  const shouldShowMascot = () => {
    return gameState === "intro" || gameState === "gameplay";
  };

  if (isLoading && gameState === "config") {
    return (
      <div
        className={styles.gameContainer}
        style={{
          backgroundImage: `url(${backgrounds[gameConfig.environment]})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className={styles.gameContent}>
          <div
            style={{
              color: "white",
              fontSize: "1.5rem",
              textAlign: "center",
            }}
          >
            Loading game...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={styles.gameContainer}
      style={{
        backgroundImage: `url(${backgrounds[gameConfig.environment]})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        transition: "background-image 0.5s ease-in-out",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <AnimatePresence>
        {showExitConfirmation && (
          <motion.div
            className={styles.exitConfirmationOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={styles.exitConfirmationPanel}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2 className={styles.exitConfirmationTitle}>
                <span role="img" aria-label="door">
                  🚪
                </span>{" "}
                Exit Game?
              </h2>
              <p className={styles.exitConfirmationMessage}>
                Are you sure you want to leave the safari? All your progress in
                this round will be lost.
              </p>
              <div className={styles.exitConfirmationButtons}>
                <motion.button
                  className={`${styles.exitConfirmButton} ${styles.noButton}`}
                  onClick={cancelExit}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span role="img" aria-label="cross mark">
                    ❌
                  </span>{" "}
                  No, Stay
                </motion.button>
                <motion.button
                  className={`${styles.exitConfirmButton} ${styles.yesButton}`}
                  onClick={confirmExit}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span role="img" aria-label="check mark">
                    ✅
                  </span>{" "}
                  Yes, Exit
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {gameState !== "config" && gameState !== "loading" && gameState !== "intro" && (
        <motion.button
          className={styles.exitButton}
          onClick={handleExitGame}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Exit game and return to configuration"
        >
          <span className={styles.exitIcon}>←</span>
          <span className={styles.exitText}>Exit</span>
        </motion.button>
      )}
      {(gameState === "config" || gameState === "loading" || gameState === "intro") && (
        <audio
          ref={audioRef}
          src={musicTracks[gameConfig.environment] || musicTracks.jungle}
        />
      )}

      <div className={styles.gameContent}>
        {shouldShowMascot() && (
          <motion.div
            className={styles.foxMascot}
            animate={{
              y: [0, -8, 0],
              rotate: [0, 2, 0, -2, 0],
            }}
            transition={{
              y: { repeat: Infinity, duration: 3, ease: "easeInOut" },
              rotate: { repeat: Infinity, duration: 2, ease: "easeInOut" },
            }}
          >
            <img
              src={WildLitzFox}
              alt="WildLitz Fox"
              className={styles.foxImage}
            />

            {showBubble && (
              <motion.div
                className={styles.speechBubble}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {bubbleMessage}
              </motion.div>
            )}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {gameState === "exiting" && (
            <motion.div
              key="exiting"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={styles.screenContainer}
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh'
              }}
            >
              <div style={{ 
                color: 'white', 
                fontSize: '1.5rem', 
                textAlign: 'center',
                fontFamily: 'Comic Sans MS, cursive'
              }}>
                Exiting game...
              </div>
            </motion.div>
          )}

          {gameState === "config" && (
            <motion.div
              key="config"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.screenContainer}
            >
              <SoundSafariConfigScreen
                onStartGame={handleStartGame}
                onViewAnalytics={handleViewAnalytics}
                currentEnvironment={gameConfig.environment}
                onEnvironmentChange={handleEnvironmentChange}
                initialDifficulty={gameConfig.difficulty}
                initialSoundPosition={gameConfig.soundPosition}
                volume={volume}
                isMuted={isMuted}
                showVolumeControl={showVolumeControl}
                onVolumeChange={handleVolumeChange}
                onToggleMute={toggleMute}
                onToggleVolumeControl={toggleVolumeControl}
              />
            </motion.div>
          )}

          {gameState === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.screenContainer}
            >
              <div
                style={{
                  background: "white",
                  padding: "40px",
                  borderRadius: "20px",
                  textAlign: "center",
                  maxWidth: "600px",
                  margin: "0 auto",
                }}
              >
                <h1 style={{ color: "#333", marginBottom: "20px" }}>
                  📊 Analytics
                </h1>
                <p style={{ color: "#666", marginBottom: "30px" }}>
                  Analytics feature coming soon!
                </p>
                <button
                  onClick={() => setGameState("config")}
                  style={{
                    background:
                      "linear-gradient(135deg, #D84315 0%, #BF360C 100%)",
                    color: "white",
                    border: "none",
                    padding: "12px 24px",
                    borderRadius: "25px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  ← Back to Config
                </button>
              </div>
            </motion.div>
          )}

          {gameState === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.screenContainer}
            >
              <SoundSafariLoadingScreen
                targetSound={gameConfig.targetSound}
                difficulty={gameConfig.difficulty}
                onContinue={handleContinueFromLoading}
                round={currentRound}
                totalRounds={totalRounds}
                volume={volume}
                isMuted={isMuted}
                showVolumeControl={showVolumeControl}
                onVolumeChange={handleVolumeChange}
                onToggleMute={toggleMute}
                onToggleVolumeControl={toggleVolumeControl}
                environment={gameConfig.environment}
              />
            </motion.div>
          )}

          {gameState === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.screenContainer}
            >
              <SoundIntroScreen
                targetSound={gameConfig.targetSound}
                onContinue={handleContinueFromIntro}
                volume={volume}
                isMuted={isMuted}
                showVolumeControl={showVolumeControl}
                onVolumeChange={handleVolumeChange}
                onToggleMute={toggleMute}
                onToggleVolumeControl={toggleVolumeControl}
                environment={gameConfig.environment}
              />
            </motion.div>
          )}

          {gameState === "gameplay" && roundAnimals.length > 0 && (
            <motion.div
              key="gameplay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.screenContainer}
            >
              <GameplayScreen
                animals={roundAnimals}
                targetSound={gameConfig.targetSound}
                soundPosition={gameConfig.soundPosition}
                onSubmit={handleSubmitAnswers}
                timeLimit={DIFFICULTY_LEVELS[gameConfig.difficulty].timeLimit}
                skipIntro={!fromIntroScreen}
                environment={gameConfig.environment}
                forceStop={gameState === "exiting"}
              />
            </motion.div>
          )}

          {gameState === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.screenContainer}
            >
              <ResultsScreen
                results={getGameResults()}
                onNextRound={handleNextRound}
                onTryAgain={handleTryAgain}
                currentRound={currentRound}
                totalRounds={totalRounds}
                environment={gameConfig.environment}
              />
            </motion.div>
          )}

          {gameState === "complete" && (
            <GameCompleteScreen
              score={score}
              totalRounds={totalRounds}
              totalCorrect={allRoundsData.reduce(
                (sum, round) => sum + (round.correctCount || 0),
                0
              )}
              totalAnimalsWithSound={allRoundsData.reduce(
                (sum, round) => sum + (round.totalCorrectAnimals || 0),
                0
              )}
              onPlayAgain={handlePlayAgain}
              onChangeDifficulty={handleChangeDifficulty}
              gameConfig={gameConfig}
              roundsData={allRoundsData}
            />
          )}
        </AnimatePresence>

        {error && (
          <motion.div
            className={styles.errorOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "rgba(255, 255, 255, 0.95)",
              padding: "20px",
              borderRadius: "10px",
              textAlign: "center",
              maxWidth: "400px",
              zIndex: 1000,
            }}
          >
            <h3 style={{ color: "#f44336", margin: "0 0 10px 0" }}>Error</h3>
            <p style={{ color: "#333", margin: "0 0 15px 0" }}>{error}</p>
            <button
              onClick={() => {
                setError(null);
                setGameState("config");
              }}
              style={{
                backgroundColor: "#4caf50",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SoundSafariGame;