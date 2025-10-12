// src/pages/games/syllable/SyllableDemoScreen.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "../../../styles/games/syllable/SyllableDemoScreen.module.css";
import wildLitzCharacter from "../../../assets/img/wildlitz-idle.png";

const SyllableDemoScreen = ({ word, onBack, onPlaySound }) => {
  const [selectedSyllable, setSelectedSyllable] = useState("all");
  const [playbackSpeed, setPlaybackSpeed] = useState("normal");
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [characterMessage, setCharacterMessage] = useState("");

  // Split syllables from syllable breakdown
  const syllableArray = word?.syllables?.split("-") || [
    word?.word || "example",
  ];

  // Helper function to truncate messages to prevent UI overflow
  const truncateMessage = (message, maxLength) => {
    if (!message) return "";
    return message.length > maxLength
      ? message.substring(0, maxLength) + "..."
      : message;
  };

  // Generate character message when component mounts
  useEffect(() => {
    if (!word) return;

    setIsLoading(true);

    // Generate a word-specific demo message
    const generateDemoMessage = async () => {
      try {
        const response = await axios.post(
          "http://127.0.0.1:8000/api/syllabification/generate-ai-content/",
          {
            type: "character_message",
            word: word.word,
            context: "demo",
          }
        );

        if (response.data && response.data.content) {
          // Truncate message to prevent UI overflow
          setCharacterMessage(truncateMessage(response.data.content, 120));
        } else {
          setCharacterMessage(
            `Let's learn how to pronounce "${word.word}" syllable by syllable!`
          );
        }
      } catch (error) {
        console.error("Error generating demo message:", error);
        setCharacterMessage(
          `Let's learn how to pronounce "${word.word}" syllable by syllable!`
        );
      } finally {
        setIsLoading(false);
      }
    };

    generateDemoMessage();
  }, [word]);

  // Generate a word-specific demo message if needed
  const generateDemoMessage = async () => {
    // Don't generate a message if we already have one from pronunciationGuide
    if (characterMessage) return;

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/syllabification/generate-ai-content/",
        {
          type: "character_message",
          word: word.word,
          context: "demo",
        }
      );

      if (response.data && response.data.content) {
        // Truncate message to prevent UI overflow
        setCharacterMessage(truncateMessage(response.data.content, 120));
      } else {
        setCharacterMessage(
          `Let's learn how to pronounce "${word.word}" syllable by syllable!`
        );
      }
    } catch (error) {
      console.error("Error generating demo message:", error);
      setCharacterMessage(
        `Let's learn how to pronounce "${word.word}" syllable by syllable!`
      );
    }
  };

  // Function to play a specific syllable sound using audio URLs
  const playSyllableSound = (syllable, index) => {
    if (!syllable) return;

    setIsPlaying(true);

    // Get syllable audio URLs from word data
    const syllableAudioUrls = word?.syllable_audio_urls || [];
    const audioUrl = syllableAudioUrls[index];

    if (audioUrl) {
      // Play the recorded audio
      const audio = new Audio(audioUrl);
      audio.playbackRate = playbackSpeed === "slow" ? 0.7 : 1;

      audio.onended = () => {
        setIsPlaying(false);
      };

      audio.onerror = (error) => {
        console.error("Failed to play syllable audio:", error);
        setIsPlaying(false);
        alert("⚠️ No audio available for this syllable");
      };

      audio.play().catch((error) => {
        console.error("Failed to play audio:", error);
        setIsPlaying(false);
        alert("⚠️ No audio available for this syllable");
      });
    } else {
      // No audio available
      console.warn(
        `No audio available for syllable "${syllable}" at index ${index}`
      );
      setIsPlaying(false);
      alert("⚠️ No audio available for this syllable");
    }
  };

  // Function to play the whole word - keep using the whole word rather than pronunciation guide
  // Function to play the whole word using audio URL with TTS fallback
  const playWordSound = () => {
    setIsPlaying(true);

    // Get full word audio URL
    const fullWordAudioUrl = word?.full_word_audio_url;

    if (fullWordAudioUrl) {
      // Play the recorded audio
      const audio = new Audio(fullWordAudioUrl);
      audio.playbackRate = playbackSpeed === "slow" ? 0.7 : 1;

      audio.onended = () => {
        setIsPlaying(false);
      };

      audio.onerror = (error) => {
        console.error("Failed to play word audio:", error);
        // Fallback to TTS
        useBrowserSpeech();
      };

      audio.play().catch((error) => {
        console.error("Failed to play audio:", error);
        // Fallback to TTS
        useBrowserSpeech();
      });
    } else {
      // No recorded audio, use TTS as fallback
      console.log("No recorded audio available, using TTS fallback");
      useBrowserSpeech();
    }

    function useBrowserSpeech() {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();

        const wordText = typeof word === "string" ? word : word.word;
        const utterance = new SpeechSynthesisUtterance(wordText);
        utterance.rate = playbackSpeed === "slow" ? 0.5 : 0.8;

        utterance.onend = () => {
          setIsPlaying(false);
        };

        utterance.onerror = () => {
          setIsPlaying(false);
        };

        window.speechSynthesis.speak(utterance);
      } else {
        setIsPlaying(false);
      }
    }
  };

  // Function to handle playing the selected syllable or whole word
  const handlePlaySelected = () => {
    if (selectedSyllable === "all") {
      playWordSound();
    } else {
      // Get the index of the syllable to find the corresponding pronunciation guide
      const syllableIndex = syllableArray.indexOf(selectedSyllable);
      playSyllableSound(selectedSyllable, syllableIndex);
    }
  };

  const wordText = typeof word === "string" ? word : word?.word || "example";

  return (
    <div className={styles.syllableDemoContainer}>
      <div className={styles.demoContentWrapper}>
        {/* Character on the left */}
        <div className={styles.demoCharacterColumn}>
          <img
            src={wildLitzCharacter}
            alt="WildLitz Character"
            className={styles.demoCharacter}
          />

          <div className={styles.speechBubble}>
            <p>{characterMessage || "Let's learn how to say each syllable!"}</p>
          </div>
        </div>

        {/* Main demo card */}
        <div className={styles.demoCard}>
          <div className={styles.demoHeader}>
            <h1>Syllable Sound Demonstration</h1>
          </div>

          {/* Syllable breakdown visualization - now at the top */}
          <div className={styles.syllableBreakdown}>
            <h3>Syllable Breakdown</h3>
            <div className={styles.breakdownVisualization}>
              {syllableArray.map((syllable, index) => (
                <div
                  key={index}
                  className={`${styles.syllableUnit} ${
                    selectedSyllable === syllable ? styles.highlighted : ""
                  }`}
                  onClick={() => setSelectedSyllable(syllable)}
                >
                  {syllable}
                  <div
                    className={styles.soundIndicator}
                    onClick={(e) => {
                      e.stopPropagation();
                      playSyllableSound(syllable, index);
                    }}
                  >
                    🔊
                  </div>
                </div>
              ))}
              <button
                className={`${styles.fullWordButton} ${
                  selectedSyllable === "all" ? styles.active : ""
                }`}
                onClick={() => setSelectedSyllable("all")}
              >
                Full Word
              </button>
            </div>
            <p className={styles.breakdownTip}>
              Click on a syllable to select it or use the "Full Word" button for
              the entire word.
            </p>
          </div>

          {/* Pronunciation Section */}
          <div className={styles.pronunciationContainer}>
            {/* Sound player section */}
            <div className={styles.soundPlayerSection}>
              <h3>
                {selectedSyllable === "all"
                  ? "Listen to Full Word"
                  : `Listen to "${selectedSyllable}"`}
              </h3>
              <div className={styles.playerControls}>
                <button
                  className={styles.playSoundButton}
                  onClick={handlePlaySelected}
                  disabled={isPlaying || isLoading}
                >
                  {isLoading ? (
                    <span className={styles.loadingIcon}>⏳</span>
                  ) : isPlaying ? (
                    <span className={styles.playingIcon}>🔊</span>
                  ) : (
                    <span className={styles.playIcon}>▶️</span>
                  )}
                  {isLoading
                    ? "Loading..."
                    : isPlaying
                    ? "Playing..."
                    : "Play Sound"}
                </button>

                <button
                  className={`${styles.speedToggle} ${
                    playbackSpeed === "slow" ? styles.active : ""
                  }`}
                  onClick={() =>
                    setPlaybackSpeed(
                      playbackSpeed === "normal" ? "slow" : "normal"
                    )
                  }
                  disabled={isPlaying || isLoading}
                >
                  {playbackSpeed === "slow" ? "Normal Speed" : "Slow Speed"}
                </button>
              </div>
            </div>

            {/* Sound explanation */}
            <div className={styles.soundExplanation}>
              <h3>How to Pronounce</h3>
              <div className={styles.explanationContent}>
                <p className={styles.phoneticGuide}>
                  {selectedSyllable === "all"
                    ? `Listen to the full word "${word.word}" and notice how each syllable flows together.`
                    : `Listen carefully to the syllable "${selectedSyllable}" and try to repeat it.`}
                </p>

                <div className={styles.examples}>
                  {selectedSyllable === "all" ? (
                    <p>
                      <strong>Tip:</strong> Clap along as you hear each syllable
                      to help you count them!
                    </p>
                  ) : (
                    <p>
                      <strong>Tip:</strong> Pay attention to the vowel sound in
                      this syllable.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation buttons with Back to Game button positioned on the right */}
          <div className={styles.navigationContainer}>
            {syllableArray.length > 1 && selectedSyllable !== "all" ? (
              <div className={styles.syllableNavigation}>
                <button
                  className={styles.navButton}
                  onClick={() => {
                    const currentIndex =
                      syllableArray.indexOf(selectedSyllable);
                    if (currentIndex > 0) {
                      setSelectedSyllable(syllableArray[currentIndex - 1]);
                    }
                  }}
                  disabled={syllableArray.indexOf(selectedSyllable) === 0}
                >
                  Previous Syllable
                </button>
                <button
                  className={styles.navButton}
                  onClick={() => {
                    const currentIndex =
                      syllableArray.indexOf(selectedSyllable);
                    if (currentIndex < syllableArray.length - 1) {
                      setSelectedSyllable(syllableArray[currentIndex + 1]);
                    }
                  }}
                  disabled={
                    syllableArray.indexOf(selectedSyllable) ===
                    syllableArray.length - 1
                  }
                >
                  Next Syllable
                </button>
              </div>
            ) : (
              <div className={styles.emptyNavSpace}></div>
            )}

            {/* Back to Game button positioned on the right */}
            <button className={styles.backButton} onClick={onBack}>
              Back to Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyllableDemoScreen;
