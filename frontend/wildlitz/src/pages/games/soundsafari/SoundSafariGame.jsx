import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import styles from "../../../styles/games/safari/SoundSafariGame.module.css";
import backgroundMusic2 from "../../../assets/music/sound-safari-background-music-2.mp3";

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
  fetchSoundExamples,
  submitGameResults,
} from "../../../services/soundSafariApi";
import soundSafariAnalyticsService from "../../../services/soundSafariAnalyticsService";

import {
  SOUND_DESCRIPTIONS,
  SOUND_POSITIONS,
  DIFFICULTY_LEVELS,
  ENVIRONMENTS,
} from "../../../mock/soundSafariData";

const SoundSafariGame = () => {
  const navigate = useNavigate();

  const [gameState, setGameState] = useState("config");

  const audioRef = useRef(null);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeControl, setShowVolumeControl] = useState(false);

  useEffect(() => {
    if (
      (gameState === "loading" || gameState === "intro") &&
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
      gameState !== "loading" &&
      gameState !== "intro"
    ) {
      audioRef.current.pause();
    }
  }, [gameState]);

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

  const [gameConfig, setGameConfig] = useState({
    difficulty: "easy",
    targetSound: "s",
    soundPosition: SOUND_POSITIONS.beginning,
    environment: "jungle",
  });

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
    setGameConfig(config);

    setSessionStartTime(Date.now());
    setAllRoundsData([]);
    setCurrentRoundData(null);
    setRoundStartTime(Date.now());

    setCurrentRound(1);
    setScore(0);
    setSoundsUsed([config.targetSound]);
    setGameState("loading");
    setFromIntroScreen(false);
    setError(null);

    await prepareNewRound(
      config.targetSound,
      config.difficulty,
      0,
      [],
      config.environment
    );

    setTimeout(() => {
      setGameState("intro");
      const introMessage = `Today we're learning about the "${config.targetSound}" sound. Listen and find it in animal names!`;
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

    console.log(
      `📊 Round ${currentRound} data (stored temporarily):`,
      roundData
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

      console.log("📊 Saving complete session:", sessionData);
      console.log(`   - ${allRoundsData.length} rounds`);
      console.log(`   - Total time: ${Math.floor(totalTimeSpent / 1000)}s`);

      const result = await soundSafariAnalyticsService.saveGameSession(
        sessionData
      );

      if (result.success) {
        if (result.anonymous) {
          console.log("✅ Session saved anonymously (user not logged in)");
        } else {
          console.log("✅ Session saved successfully!");
          console.log("   Session ID:", result.session_id);
        }
      } else {
        console.error("❌ Failed to save session:", result.error);
      }

      return result;
    } catch (error) {
      console.error("❌ Error saving session:", error);
      return { success: false, error: error.message };
    }
  };

  const prepareNewRound = async (
    targetSound = gameConfig.targetSound,
    difficulty = gameConfig.difficulty,
    retryCount = 0,
    triedSounds = [],
    environment = gameConfig.environment
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const currentTriedSounds = [...triedSounds, targetSound];
      const soundPosition = gameConfig.soundPosition;

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
        console.warn(
          `⚠️ Excluded combination detected: ${targetSound}-${soundPosition}-${gameConfig.environment}, selecting new sound`
        );
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
          environment
        );
      }

      console.log(
        `🎯 Fetching animals for sound "${targetSound}" at position "${soundPosition}"`
      );

      const response = await fetchSafariAnimals({
        sound: targetSound,
        difficulty: difficulty,
        environment: environment,
        position: soundPosition,
      });

      if (response.animals && response.animals.length > 0) {
        setRoundAnimals(response.animals);
        console.log(`✅ Loaded ${response.animals.length} animals`);
        return;
      }

      console.warn(`⚠️ No animals found, retrying...`);

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
            environment
          );
        }
      }

      console.error("❌ Unable to find animals");
      setError("Unable to load animals for this round");
    } catch (error) {
      console.error("❌ Error preparing round:", error);
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
      console.error("Error selecting sound:", error);
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

    const correctAnimals = roundAnimals.filter((animal) => {
      if (animal.target_sound !== gameConfig.targetSound) {
        return false;
      }

      if (gameConfig.soundPosition === "anywhere") {
        return true;
      }

      return animal.sound_position === gameConfig.soundPosition;
    });

    const correctSelections = selected.filter((animal) => {
      if (animal.target_sound !== gameConfig.targetSound) {
        return false;
      }

      if (gameConfig.soundPosition === "anywhere") {
        return true;
      }

      return animal.sound_position === gameConfig.soundPosition;
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

  const handleNextRound = async () => {
    let updatedRoundsData = allRoundsData;

    if (currentRoundData) {
      console.log(`✅ Saving Round ${currentRound} data`);
      updatedRoundsData = [...allRoundsData, currentRoundData];
      setAllRoundsData(updatedRoundsData);
      setCurrentRoundData(null);
    }

    if (currentRound >= totalRounds) {
      console.log("🎮 Game complete! Saving session with all rounds...");
      console.log(`   - Total rounds to save: ${updatedRoundsData.length}`);

      const totalTimeSpent = Date.now() - sessionStartTime;

      const sessionData = soundSafariAnalyticsService.formatSessionData(
        gameConfig,
        updatedRoundsData,
        totalTimeSpent
      );

      console.log("📊 Saving complete session:", sessionData);
      console.log(`   - ${updatedRoundsData.length} rounds included`);

      const result = await soundSafariAnalyticsService.saveGameSession(
        sessionData
      );

      if (result.success) {
        console.log("✅ Session saved successfully with all rounds!");
      } else {
        console.error("❌ Failed to save session:", result.error);
      }

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
      gameConfig.environment
    );

    setTimeout(() => {
      setGameState("intro");
    }, 2000);
  };

  const handleTryAgain = async () => {
    console.log(
      `🔄 Trying Round ${currentRound} again (will overwrite previous attempt)`
    );

    await prepareNewRound(
      gameConfig.targetSound,
      gameConfig.difficulty,
      0,
      [],
      gameConfig.environment
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
      gameConfig.environment
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

  const getEnvironmentClass = () => {
    switch (gameConfig.environment) {
      case "jungle":
        return styles.jungleBackground;
      case "savanna":
        return styles.savannaBackground;
      case "ocean":
        return styles.oceanBackground;
      case "arctic":
        return styles.arcticBackground;
      default:
        return styles.jungleBackground;
    }
  };

  const getGameResults = () => {
    const correctAnimals = roundAnimals.filter((animal) => {
      if (animal.target_sound !== gameConfig.targetSound) {
        return false;
      }

      if (gameConfig.soundPosition === "anywhere") {
        return true;
      }

      return animal.sound_position === gameConfig.soundPosition;
    });

    const incorrectAnimals = roundAnimals.filter((animal) => {
      if (animal.target_sound !== gameConfig.targetSound) {
        return true;
      }

      if (gameConfig.soundPosition === "anywhere") {
        return false;
      }

      return animal.sound_position !== gameConfig.soundPosition;
    });

    return {
      correctAnimals,
      incorrectAnimals,
      selectedAnimals,
      targetSound: gameConfig.targetSound,
      soundPosition: gameConfig.soundPosition,
    };
  };

  const shouldShowMascot = () => {
    return gameState === "intro" || gameState === "gameplay";
  };

  if (isLoading && gameState === "config") {
    return (
      <div className={`${styles.gameContainer} ${getEnvironmentClass()}`}>
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
    <div className={`${styles.gameContainer} ${getEnvironmentClass()}`}>
      {(gameState === "loading" || gameState === "intro") && (
        <audio ref={audioRef} src={backgroundMusic2} />
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
