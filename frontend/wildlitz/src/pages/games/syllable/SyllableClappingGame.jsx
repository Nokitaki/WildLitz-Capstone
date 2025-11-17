// src/pages/games/syllable/SyllableClappingGame.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "../../../styles/games/syllable/SyllableClappingGame.module.css";
import SyllableConfigScreen from "./SyllableConfigScreen";
import SyllableDemoScreen from "./SyllableDemoScreen";
import CompletionScreen from "./CompletionScreen";
import SyllableLoadingScreen from "./SyllableLoadingScreen";
import Character from "../../../assets/img/wildlitz-idle.png";
import WordTransitionScreen from "./WordTransitionScreen";
import soundManager from "../../../utils/soundManager";
import { API_ENDPOINTS } from "../../../config/api";
import useClapDetection from "./useClapDetection"; // ← ADD THIS LINE
//import ClapRhythmTimer from "./ClapRhythmTimer";
import DraggableRhythmTimer from "./DraggableRhythmTimer";

const SyllableClappingGame = () => {
  const navigate = useNavigate();

  // Game state management
  const [gamePhase, setGamePhase] = useState("config"); // config, loading, playing, feedback, demo, complete
  const [gameConfig, setGameConfig] = useState(null);

  const [wordPlayTimestamp, setWordPlayTimestamp] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [speakingSyllable, setSpeakingSyllable] = useState(null);

  const audioRef = useRef(null);

  const [currentWord, setCurrentWord] = useState({
    word: "",
    syllables: "",
    count: 0,
    category: "",
    image_url: null,
    fun_fact: "",
    intro_message: "",
  });
  const [clapCount, setClapCount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(1);
  const [totalWords, setTotalWords] = useState(10);
  const [gameStats, setGameStats] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleMessage, setBubbleMessage] = useState("");
  const [aiResponse, setAiResponse] = useState(null);
  const [syllableTip, setSyllableTip] = useState("");
  const [learningFeedback, setLearningFeedback] = useState("");

  // Button disabling states
  const [checkButtonDisabled, setCheckButtonDisabled] = useState(false);
  const [nextButtonDisabled, setNextButtonDisabled] = useState(false);
  const [demoButtonDisabled, setDemoButtonDisabled] = useState(false);

  // Track correct answers
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [startTime, setStartTime] = useState(null);

  // Card flip state
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);

  // Microphone clap detection state                        // ← ADD THESE
  const [micEnabled, setMicEnabled] = useState(false); // ← ADD THESE

  const { isListening, micPermission, errorMessage } = useClapDetection(
    micEnabled && gamePhase === "playing", // Only enable during playing phase
    () => setClapCount((prev) => prev + 1) // ✅ Inline function works!
  );

  useEffect(() => {
    setWordPlayTimestamp(null);
  }, [currentWord.word]);

  // Auto-enable microphone when entering playing phase
  useEffect(() => {
    if (gamePhase === "playing" && !micEnabled) {
      setMicEnabled(true); // ✅ Automatically turn ON mic when game starts
    }

    // Disable mic when game ends
    if (gamePhase === "complete" || gamePhase === "config") {
      setMicEnabled(false);
    }
  }, [gamePhase]);

  // 🔊 Load sound effects when component mounts
  useEffect(() => {
    soundManager.loadSounds();

    // Cleanup: stop all sounds when component unmounts
    return () => {
      soundManager.stopAll();
    };
  }, []);

  // Instead of making an API call, use these hardcoded tips
  const getSyllableTip = (difficulty) => {
    const tips = {
      easy: [
        "Listen for the beat in each word - every beat is a syllable!",
        "Clap as you say each word part to count syllables.",
        "Every syllable has one vowel sound.",
      ],
      medium: [
        "Put your hand under your chin - each time your jaw drops is a syllable!",
        "Break words into chunks by listening for vowel sounds.",
        "Try singing the word slowly to hear each syllable.",
      ],
      hard: [
        "Compound words often have syllables from each original word.",
        "Long words can be broken down into smaller parts to count syllables.",
        "Focus on vowel sounds - each syllable has exactly one vowel sound.",
      ],
    };

    const difficultyTips = tips[difficulty.toLowerCase()] || tips["medium"];
    return difficultyTips[Math.floor(Math.random() * difficultyTips.length)];
  };

  const handleQuit = () => {
    if (
      window.confirm(
        "Are you sure you want to quit? Your progress will be lost."
      )
    ) {
      // Reset all game state and go back to config screen
      setGamePhase("config");
      setClapCount(0);
      setCurrentIndex(1);
      setCorrectAnswers(0);
      setStartTime(null);
      setMicEnabled(false); // Turn off microphone
      setIsFlipped(false);
      setShowBubble(false);
      setLearningFeedback("");
      setGameWords([]);
      setWordIndex(0);
    }
  };

  // NEW: Handle syllable pronunciation with robust loading and NO TTS
  const handleSyllablePronunciation = (syllable, syllableIndex) => {
    setSpeakingSyllable(syllable);

    // Stop any existing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    let syllableAudioUrls = currentWord.syllable_audio_urls || [];

    if (typeof syllableAudioUrls === "string") {
      try {
        syllableAudioUrls = JSON.parse(syllableAudioUrls);
      } catch (error) {
        console.error("Error parsing syllable_audio_urls:", error);
        syllableAudioUrls = [];
      }
    }

    const audioUrl = syllableAudioUrls[syllableIndex];

    if (!audioUrl) {
      console.warn(
        `No audio available for syllable "${syllable}" at index ${syllableIndex}`
      );
      setSpeakingSyllable(null);
      alert("⚠️ No audio available for this syllable");
      return;
    }

    const audio = new Audio();
    audioRef.current = audio;

    audio.src = audioUrl;
    audio.preload = "auto";
    audio.load();

    let hasPlayed = false;

    const playAudio = () => {
      if (hasPlayed) return;
      hasPlayed = true;

      audio.play().catch((error) => {
        console.error("Failed to play syllable audio:", error);
        setSpeakingSyllable(null);
        audioRef.current = null;
        alert("⚠️ Could not play syllable audio.");
      });
    };

    audio.addEventListener("canplay", playAudio, { once: true });
    audio.addEventListener(
      "loadeddata",
      () => {
        setTimeout(playAudio, 100);
      },
      { once: true }
    );

    audio.onended = () => {
      setSpeakingSyllable(null);
      audioRef.current = null;
    };

    audio.onerror = (error) => {
      console.error("Error loading syllable audio:", error);
      setSpeakingSyllable(null);
      audioRef.current = null;
      alert("⚠️ Syllable audio file not available.");
    };

    // Safety timeout
    setTimeout(() => {
      if (!hasPlayed && audioRef.current === audio) {
        playAudio();
      }
    }, 3000);
  };

  const renderSyllableButtons = () => {
    // Safety check
    if (!currentWord || !currentWord.syllables) {
      return <div className={styles.syllables}>No syllables available</div>;
    }

    const syllableArray = currentWord.syllables.split("-");

    return (
      <div className={styles.syllables}>
        {syllableArray.map((syllable, index) => {
          return (
            <button
              key={index}
              className={`${styles.syllableButton} ${
                speakingSyllable === syllable ? styles.speaking : ""
              }`}
              onClick={() => handleSyllablePronunciation(syllable, index)}
              disabled={speakingSyllable !== null}
            >
              {syllable}
            </button>
          );
        })}
      </div>
    );
  };

  const validateWordData = (wordData) => {
    // Check for required fields
    if (!wordData.word || !wordData.syllables) {
      console.error("Word data missing critical fields:", wordData);
      return false;
    }

    // Check syllable breakdown
    const syllables = wordData.syllables.split("-");
    if (syllables.length !== wordData.count) {
      console.warn(
        `Syllable count mismatch: breakdown has ${syllables.length} but count is ${wordData.count}`
      );
    }

    // Check pronunciation guide if available
    if (wordData.pronunciation_guide) {
      try {
        const pronunciations = wordData.pronunciation_guide.split("-");
        if (pronunciations.length !== syllables.length) {
          console.warn(
            `Pronunciation guide segments (${pronunciations.length}) don't match syllable count (${syllables.length})`
          );
        }
      } catch (error) {
        console.error("Error parsing pronunciation guide:", error);
        return false;
      }
    }

    return true;
  };

  // Fetch a new word from the API
  const fetchNewWord = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Use the selected difficulty and categories from gameConfig
      const difficulty = gameConfig?.difficulty || "medium";
      const categories = gameConfig?.categories || [];

      // Build query string for categories
      const categoryParams = categories
        .map((cat) => `categories[]=${encodeURIComponent(cat)}`)
        .join("&");

      // Call API to get a word with AI-generated content
      const response = await axios.get(
        `${API_ENDPOINTS.SYLLABIFICATION}/get-word-supabase/?difficulty=${difficulty}&${categoryParams}`
      );

      const wordData = response.data;

      // Validate the word data
      if (!validateWordData(wordData)) {
        console.warn(
          "Word data validation failed, but continuing with available data"
        );
      }

      // Debug pronunciation guide specifically
      console.log("Pronunciation guide:", wordData.pronunciation_guide);

      // First update state with the new word
      setCurrentWord({
        word: wordData.word,
        syllables: wordData.syllables,
        count: wordData.count,
        category: wordData.category,
        image_url: wordData.image_url || null,
        full_word_audio_url: wordData.full_word_audio_url || null,
        syllable_audio_urls: wordData.syllable_audio_urls || [],
        fun_fact:
          wordData.fun_fact ||
          `Fun fact about ${
            wordData.word
          }: This is a ${wordData.category.toLowerCase()} with ${
            wordData.count
          } syllables!`,
        intro_message:
          wordData.intro_message ||
          `Listen to "${wordData.word}" and count the syllables!`,
      });

      // Then set the bubble message from the AI-generated intro
      setBubbleMessage(
        wordData.intro_message ||
          `Listen to "${wordData.word}" and count the syllables!`
      );
    } catch (err) {
      setError("Failed to load word. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // State to store all preloaded words
  const [gameWords, setGameWords] = useState([]);
  const [wordIndex, setWordIndex] = useState(0);

  // Check answer with the AI feedback
  const checkAnswerWithAI = async () => {
    // Disable the check button to prevent multiple clicks
    setCheckButtonDisabled(true);

    // ✅ ADD THIS CONFIG OBJECT
    const config = {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
    };
    try {
      const response = await axios.post(
        `${API_ENDPOINTS.SYLLABIFICATION}/check-syllable-answer/`,
        {
          // This is the data payload
          word: currentWord.word,
          syllables: currentWord.syllables,
          clapCount: clapCount,
          correctCount: currentWord.count,
          difficulty: gameConfig?.difficulty || "medium",
        },
        config // ✅ PASS THE CONFIG OBJECT AS THE THIRD ARGUMENT
      );

      setAiResponse(response.data);

      // Update bubble message with AI feedback
      setBubbleMessage(response.data.feedback_message);

      // Store the learning feedback from API
      if (response.data.learning_feedback) {
        setLearningFeedback(response.data.learning_feedback);
      }

      // Update correct answers count
      if (response.data.is_correct) {
        setCorrectAnswers((prev) => prev + 1);
      }

      // 🔥 NEW: Log this question activity
      await logQuestionActivity(
        currentWord,
        clapCount,
        response.data.is_correct,
        10 // We'll add proper timing later
      );

      // 🔊 NEW: Play sound based on whether answer is correct
      if (response.data.is_correct) {
        soundManager.playCorrectSound(); // Plays correct_soundEffect + yehey
      } else {
        soundManager.playWrongSound(); // Plays wrong_soundEffect
      }

      // Move to feedback phase
      setGamePhase("feedback");
      setShowBubble(true);
    } catch (error) {
      console.error("Error checking answer:", error);

      // Fallback to basic feedback without AI
      const isCorrect = clapCount === currentWord.count;
      setBubbleMessage(
        isCorrect ? "Great job! That's correct!" : "Nice try! Listen again."
      );

      // Set fallback learning feedback
      if (isCorrect) {
        setLearningFeedback(
          `Great job! "${currentWord.word}" has ${currentWord.count} syllable${
            currentWord.count !== 1 ? "s" : ""
          }. Keep up the excellent work!`
        );
      } else {
        setLearningFeedback(
          `The word "${currentWord.word}" has ${currentWord.count} syllable${
            currentWord.count !== 1 ? "s" : ""
          }. Don't worry - keep practicing!`
        );
      }

      // 🔊 NEW: Play sound for fallback (in error handler)
      if (isCorrect) {
        soundManager.playCorrectSound(); // Plays correct_soundEffect + yehey
      } else {
        soundManager.playWrongSound(); // Plays wrong_soundEffect
      }

      if (isCorrect) {
        setCorrectAnswers((prev) => prev + 1);
      }

      // 🔥 NEW: Log this question activity (fallback case)
      await logQuestionActivity(
        currentWord,
        clapCount,
        isCorrect,
        10 // We'll add proper timing later
      );

      setGamePhase("feedback");
      setShowBubble(true);
    }

    // Enable the check button after a delay (6 seconds)
    setTimeout(() => {
      setCheckButtonDisabled(false);
    }, 6000);
  };

  // Request AI pronunciation guidance for the demo screen
  const fetchPronunciationGuide = async () => {
    try {
      const response = await axios.post(
        `${API_ENDPOINTS.SYLLABIFICATION}/get-syllable-pronunciation/`,
        {
          word: currentWord.word,
          syllables: currentWord.syllables,
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching pronunciation guide:", error);
      return null;
    }
  };

  // UPDATED: useEffect with longer delay and better state checking
  useEffect(() => {
    if (gamePhase === "playing") {
      setShowBubble(true);

      const bubbleTimer = setTimeout(() => {
        setShowBubble(false);
      }, 6000);

      setIsFlipped(true);
      setIsFlipping(true);

      const flipTimer = setTimeout(() => {
        setIsFlipped(false);
        setIsFlipping(true);

        // MUCH LONGER DELAY: Wait for flip animation to completely finish
        const audioTimer = setTimeout(() => {
          console.log("=== ATTEMPTING TO PLAY AUDIO ===");
          console.log("Current word:", currentWord);
          console.log("Audio URL:", currentWord?.full_word_audio_url);

          if (
            currentWord &&
            currentWord.word &&
            currentWord.full_word_audio_url
          ) {
            // Stop any existing audio first
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
              audioRef.current = null;
            }

            // Now play the sound
            handlePlaySound();
          } else {
            console.warn("Cannot play audio - missing word or audio URL");
          }
        }, 1500); // 1.5 seconds after flip completes

        return () => clearTimeout(audioTimer);
      }, 3000); // Flip animation duration

      return () => {
        clearTimeout(bubbleTimer);
        clearTimeout(flipTimer);
        // Cleanup audio on unmount
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
      };
    }
  }, [gamePhase, currentWord]);

  useEffect(() => {
    return () => {
      // Cleanup on component unmount
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

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

  const handleStartGame = async (config) => {
    setGameConfig(config);

    // Initialize game stats
    setCorrectAnswers(0);
    setStartTime(new Date());
    setTotalWords(config.questionCount || 10);

    // Set a tip using our hardcoded function
    const gameTip = getSyllableTip(config.difficulty);
    setSyllableTip(gameTip);

    // Show loading screen before preloading words
    setGamePhase("loading");

    // Preload all words first - IMPORTANT: capture the returned words
    const words = await preloadGameWords(config);

    if (words && words.length > 0) {
      // Use the words array directly instead of relying on gameWords state

      // ✅ ADD DEBUGGING
      console.log("=== WORD DATA FROM API ===");
      console.log("First word object:", words[0]);
      console.log("Has phonetic_guide?", words[0].phonetic_guide);
      console.log(
        "phonetic_guide value:",
        JSON.stringify(words[0].phonetic_guide, null, 2)
      );
      console.log("==========================");

      // Set the current word explicitly using the first word from the returned array
      const firstWord = words[0];
      setCurrentWord({
        word: firstWord.word,
        syllables: firstWord.syllables,
        count: firstWord.count,
        category: firstWord.category,
        image_url: firstWord.image_url || null,
        full_word_audio_url: firstWord.full_word_audio_url || null,
        syllable_audio_urls: firstWord.syllable_audio_urls || [],
        phonetic_guide: firstWord.phonetic_guide || null, // ✅ ADDED
        fun_fact: firstWord.fun_fact || `Fun fact about ${firstWord.word}!`,
        intro_message:
          firstWord.intro_message || `Let's listen and count the syllables!`,
      });

      // Set bubble message
      setBubbleMessage(
        firstWord.intro_message || `Let's listen and count the syllables!`
      );

      // Transition to playing phase
      setGamePhase("playing");
    } else {
      // Handle error - words couldn't be loaded
      console.error("Failed to load word data");
      setError(
        "Could not load game data. Please try different settings or reload the page."
      );
    }
  };

  const playWordWithTTS = (word) => {
    if ("speechSynthesis" in window) {
      // IMPORTANT: Cancel any ongoing speech first
      window.speechSynthesis.cancel();

      // Small delay to ensure cancel completes
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.rate = 0.35;

        utterance.onend = () => {
          setIsPlaying(false);
        };

        utterance.onerror = () => {
          setIsPlaying(false);
        };

        window.speechSynthesis.speak(utterance);
      }, 100);
    } else {
      console.warn("Text-to-speech not supported in this browser");
      setTimeout(() => setIsPlaying(false), 2000);
    }
  };

  // Handle clap button press
  const handleClap = () => {
    setClapCount((prev) => prev + 1);
  };

  // Handle play sound button
  const handlePlaySound = () => {
    const word = currentWord?.word;

    if (!word) {
      console.warn("Attempted to play sound for undefined word");
      return;
    }

    // Stop any existing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    const fullWordAudioUrl = currentWord?.full_word_audio_url;

    if (!fullWordAudioUrl) {
      console.warn("No audio URL available for word:", word);
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    setWordPlayTimestamp(Date.now());

    const audio = new Audio();
    audioRef.current = audio;

    // Set source
    audio.src = fullWordAudioUrl;

    // Preload the audio
    audio.preload = "auto";
    audio.load();

    // Set up event listeners BEFORE loading
    let hasPlayed = false;

    const playAudio = () => {
      if (hasPlayed) return;
      hasPlayed = true;

      audio.play().catch((error) => {
        console.error("Failed to play audio:", error);
        setIsPlaying(false);
        audioRef.current = null;
        alert("⚠️ Could not play audio. Please try again.");
      });
    };

    // Multiple fallback events to ensure playback
    audio.addEventListener("canplay", playAudio, { once: true });
    audio.addEventListener(
      "loadeddata",
      () => {
        // Small delay to ensure audio is really ready
        setTimeout(playAudio, 100);
      },
      { once: true }
    );

    audio.onended = () => {
      setIsPlaying(false);
      audioRef.current = null;
    };

    audio.onerror = (error) => {
      console.error("Error loading/playing audio:", error);
      setIsPlaying(false);
      audioRef.current = null;
      alert("⚠️ Audio file not available.");
    };

    // Safety timeout - if nothing plays after 3 seconds, give up
    setTimeout(() => {
      if (!hasPlayed && audioRef.current === audio) {
        console.warn(
          "Audio did not play after 3 seconds, forcing play attempt"
        );
        playAudio();
      }
    }, 3000);
  };

  // Handle checking the answer
  const handleCheckAnswer = () => {
    // Only process if the button is not disabled
    if (!checkButtonDisabled) {
      checkAnswerWithAI();
    }
  };

  // Helper function to truncate long messages
  const truncateMessage = (message, maxLength) => {
    if (!message) return "";
    return message.length > maxLength
      ? message.substring(0, maxLength) + "..."
      : message;
  };

  const handleShowDemo = async () => {
    // Disable the demo button to prevent multiple clicks
    setDemoButtonDisabled(true);

    try {
      // Check if phonetic guide already exists
      let phoneticGuide = currentWord.phonetic_guide;

      // If not, generate it on-demand
      if (!phoneticGuide) {
        console.log("No phonetic guide found, generating...");
        const response = await axios.post(
          `${API_ENDPOINTS.SYLLABIFICATION}/generate-phonetic-guide/`,
          {
            word: currentWord.word,
            syllable_breakdown: currentWord.syllables,
          }
        );

        if (response.data && response.data.phonetic_guide) {
          phoneticGuide = response.data.phonetic_guide;
        }
      }

      // Generate demo character message
      let characterMessage = `Let's learn how to pronounce "${currentWord.word}" syllable by syllable!`;
      try {
        const messageResponse = await axios.post(
          `${API_ENDPOINTS.SYLLABIFICATION}/generate-ai-content/`,
          {
            type: "character_message",
            word: currentWord.word,
            context: "demo",
          }
        );

        if (messageResponse.data && messageResponse.data.content) {
          const message = messageResponse.data.content;
          characterMessage = truncateMessage(message, 120);
        }
      } catch (error) {
        console.error("Error generating demo character message:", error);
      }

      // Store both in currentWord
      setCurrentWord((prev) => ({
        ...prev,
        phonetic_guide: phoneticGuide,
        demo_character_message: characterMessage,
      }));

      setGamePhase("demo");
    } catch (error) {
      console.error("Error preparing demo:", error);
      alert("Failed to load demo. Please try again.");
    } finally {
      // Re-enable the demo button after 3 seconds
      setTimeout(() => {
        setDemoButtonDisabled(false);
      }, 3000);
    }
  };

  // Handle going back from demo to feedback
  const handleBackFromDemo = () => {
    setGamePhase("feedback");
    // Show feedback bubble again when returning from demo
    setShowBubble(true);
  };

  // Calculate elapsed time in MM:SS format
  const getElapsedTime = () => {
    if (!startTime) return "0:00";

    const now = new Date();
    const elapsed = Math.floor((now - startTime) / 1000); // seconds

    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const logQuestionActivity = async (
    wordData,
    userAnswer,
    isCorrect,
    timeSpent
  ) => {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        console.warn("No auth token found, skipping activity log");
        return;
      }

      const activityData = {
        module: "syllabification",
        activity_type: "syllable_clapping",
        difficulty: gameConfig?.difficulty?.toLowerCase() || "medium",
        question_data: {
          word: wordData.word,
          syllables: wordData.syllables,
          syllable_count: wordData.count,
          category: wordData.category,
        },
        user_answer: {
          clap_count: userAnswer,
        },
        correct_answer: {
          syllable_count: wordData.count,
          syllables: wordData.syllables,
        },
        is_correct: isCorrect,
        time_spent: timeSpent || 0,
        challenge_level: gameConfig?.difficulty || "medium",
        learning_focus: "syllable_counting",
      };

      await axios.post(
        `${API_ENDPOINTS.API_BASE_URL}/progress/log/`,
        activityData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Question activity logged successfully");
    } catch (error) {
      console.error("❌ Failed to log activity:", error);
      console.error("Error details:", error.response?.data);
    }
  };

  // Function to properly set up the next word
  const setupNextWord = (nextWordIndex) => {
    // Get the next word data
    const nextWordData = gameWords[nextWordIndex];
    if (!nextWordData) return false;

    // Log the word data being loaded
    console.log("Setting up next word:", nextWordData);
    console.log(
      "Pronunciation guide for next word:",
      nextWordData.pronunciation_guide
    );

    // Reset all related states
    setClapCount(0);
    setAiResponse(null);

    // Update the current word - ensure all fields are properly populated
    setCurrentWord({
      word: nextWordData.word,
      syllables: nextWordData.syllables,
      count: nextWordData.count,
      category: nextWordData.category,
      image_url: nextWordData.image_url || null,
      full_word_audio_url: nextWordData.full_word_audio_url || null,
      syllable_audio_urls: nextWordData.syllable_audio_urls || [],
      fun_fact: nextWordData.fun_fact || `Fun fact about ${nextWordData.word}!`,
      intro_message:
        nextWordData.intro_message ||
        `Listen to "${nextWordData.word}" and count the syllables!`,
    });

    // Update bubble message for the new word
    setBubbleMessage(
      nextWordData.intro_message ||
        `Listen to "${nextWordData.word}" and count the syllables!`
    );

    // Log the current word state after update
    console.log("Current word state updated:", {
      word: nextWordData.word,
      syllables: nextWordData.syllables,
      pronunciation_guide:
        nextWordData.pronunciation_guide || nextWordData.syllables,
    });

    return true;
  };

  const handleNextWord = async () => {
    // Disable the next button to prevent multiple clicks
    setNextButtonDisabled(true);

    // 🔧 FIX: Stop any existing audio before transitioning
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    // Increase the word index
    const nextIndex = currentIndex + 1;

    // Check if we've completed all words
    if (nextIndex > totalWords) {
      // Game is complete, calculate stats
      const accuracy = Math.round((correctAnswers / totalWords) * 100);

      const gameStats = {
        totalWords: totalWords,
        correctAnswers: correctAnswers,
        accuracy: `${accuracy}%`,
        difficulty: gameConfig?.difficulty || "Medium",
        completionTime: getElapsedTime(),
      };

      setGameStats(gameStats);
      setGamePhase("complete");
      setNextButtonDisabled(false);
      setLearningFeedback("");
      return;
    }

    // First completely reset any answer-related states
    setClapCount(0);
    setAiResponse(null);

    // Update index counter
    setCurrentIndex(nextIndex);

    // Generate a new tip for this transition
    const gameTip = getSyllableTip(gameConfig?.difficulty || "medium");
    setSyllableTip(gameTip);

    // Show the word transition screen overlay
    setGamePhase("wordTransition");

    // Wait 1.5 seconds with the transition screen
    setTimeout(() => {
      // Advance to the next word index
      const newWordIndex = wordIndex + 1;
      setWordIndex(newWordIndex);

      // Explicitly set the current word to the new word
      const wordData = gameWords[newWordIndex];
      if (wordData) {
        // Update the current word explicitly
        setCurrentWord({
          word: wordData.word,
          syllables: wordData.syllables,
          count: wordData.count,
          category: wordData.category,
          image_url: wordData.image_url || null,
          full_word_audio_url: wordData.full_word_audio_url || null,
          syllable_audio_urls: wordData.syllable_audio_urls || [],
          phonetic_guide: wordData.phonetic_guide || null,
          fun_fact: wordData.fun_fact || `Fun fact about ${wordData.word}!`,
          intro_message:
            wordData.intro_message || `Let's listen and count the syllables!`,
        });

        // Set bubble message
        setBubbleMessage(
          wordData.intro_message || `Let's listen and count the syllables!`
        );
      }

      // Now change to playing phase
      setGamePhase("playing");

      // Re-enable the next button
      setNextButtonDisabled(false);

      // Show the bubble for the new word
      setShowBubble(true);

      // Auto hide bubble after 6 seconds
      setTimeout(() => {
        setShowBubble(false);
      }, 6000);

      // ✅ FIX: Removed the nested setTimeout that was calling handlePlaySound()
      // The useEffect hook will handle playing audio automatically when
      // gamePhase changes to "playing" and currentWord is updated
    }, 1500);
  };

  // Load the current word from the preloaded array
  const loadCurrentWord = () => {
    if (gameWords.length === 0 || wordIndex >= gameWords.length) {
      setError("No more words available. Please start a new game.");
      return false;
    }

    try {
      const wordData = gameWords[wordIndex];

      if (!wordData) {
        console.error(`No word data found at index ${wordIndex}`);
        setError("Failed to load word data. Please try again.");
        return false;
      }

      // Update state with the current word
      setCurrentWord({
        word: wordData.word,
        syllables: wordData.syllables,
        count: wordData.count,
        category: wordData.category,
        image_url: wordData.image_url || null,
        full_word_audio_url: wordData.full_word_audio_url || null,
        syllable_audio_urls: wordData.syllable_audio_urls || [],
        fun_fact: wordData.fun_fact || `Fun fact about ${wordData.word}!`,
        intro_message:
          wordData.intro_message || `Let's listen and count the syllables!`,
      });

      // Set the bubble message from the AI-generated intro
      setBubbleMessage(
        wordData.intro_message || `Let's listen and count the syllables!`
      );

      return true;
    } catch (error) {
      console.error("Error loading current word:", error);
      setError("An error occurred while loading the word. Please try again.");
      return false;
    }
  };

  // Preload all words for the game session
  const preloadGameWords = async (config) => {
    setIsLoading(true);
    setError(null);

    try {
      const difficulty = config?.difficulty || "medium";
      const categories = config?.categories || [];
      const wordCount = config?.questionCount || 10;
      const customWordIds = config?.customWords || []; // Array of {id, word}

      console.log("Preloading with config:", {
        difficulty,
        categories,
        wordCount,
        customWordCount: customWordIds.length,
      });

      let allWords = [];

      // ✅ STEP 1: Fetch custom words first (if any)
      if (customWordIds.length > 0) {
        console.log("Fetching custom words:", customWordIds);

        try {
          // Extract just the IDs
          const ids = customWordIds.map((w) => w.id);

          // Fetch full word data for custom words
          const customWordsResponse = await axios.get(
            `${API_ENDPOINTS.SYLLABIFICATION}/get-custom-words/`,
            {
              params: {
                word_ids: ids,
              },
            }
          );

          const customWordsData = customWordsResponse.data.words || [];
          console.log("Custom words fetched:", customWordsData.length);

          // Add custom words to the beginning
          allWords = customWordsData.map((word) => ({
            word: word.word,
            syllables: word.syllable_breakdown,
            count: word.syllable_count,
            category: word.category || "Custom",
            image_url: word.image_url || null,
            full_word_audio_url: word.full_word_audio_url || null,
            syllable_audio_urls: word.syllable_audio_urls || [],
            fun_fact: `This is a custom word with ${word.syllable_count} syllables!`,
            intro_message: `Let's practice "${word.word}"!`,
          }));
        } catch (error) {
          console.error("Error fetching custom words:", error);
          // Continue anyway - we'll just use category words
        }
      }

      // ✅ STEP 2: Calculate how many MORE words we need from categories
      const remainingCount = wordCount - allWords.length;

      if (remainingCount > 0 && categories.length > 0) {
        console.log(`Fetching ${remainingCount} more words from categories`);

        // Build query string for categories
        const categoryParams = categories
          .map((cat) => `categories[]=${encodeURIComponent(cat)}`)
          .join("&");

        const url = `${API_ENDPOINTS.SYLLABIFICATION}/get-word-batch/?difficulty=${difficulty}&${categoryParams}&count=${remainingCount}`;
        console.log("API URL:", url);

        // Fetch category words
        const response = await axios.get(url);
        const categoryWords = response.data.words || [];

        console.log("Category words fetched:", categoryWords.length);

        // Add category words AFTER custom words
        allWords = [...allWords, ...categoryWords];
      }

      console.log("Total words loaded:", allWords.length);

      if (allWords.length > 0) {
        // Remove duplicates
        const wordSet = new Set();
        const uniqueWords = [];

        for (const word of allWords) {
          if (!wordSet.has(word.word)) {
            wordSet.add(word.word);
            if (word.image_url === "") {
              word.image_url = null;
            }
            uniqueWords.push(word);
          }
        }

        console.log(`Unique words: ${uniqueWords.length}`);

        // ✅ IMPORTANT: Don't shuffle! Keep custom words at the start
        // Only shuffle the category words portion
        const customCount = customWordIds.length;
        const customWordsSection = uniqueWords.slice(0, customCount);
        const categoryWordsSection = uniqueWords.slice(customCount);

        // Shuffle only category words
        const shuffledCategoryWords = categoryWordsSection.sort(
          () => Math.random() - 0.5
        );

        // Combine: custom words first, then shuffled category words
        const finalWords = [...customWordsSection, ...shuffledCategoryWords];

        // Set state
        setGameWords(finalWords);
        setWordIndex(0);

        return finalWords;
      } else {
        setError("Could not load enough words. Please try different settings.");
        return null;
      }
    } catch (err) {
      console.error("Error preloading words:", err);
      setError("Failed to load words. Please try again.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback message if API fails
  const getFallbackMessage = () => {
    return `Let's listen and count the syllables!`;
  };

  const renderQuitButton = () => {
    // Only show the quit button during actual gameplay phases
    if (gamePhase === "playing" || gamePhase === "feedback") {
      return (
        <button className={styles.quitButton} onClick={handleQuit}>
          <span>←</span>
          Quit Game
        </button>
      );
    }
    return null; // Don't render the button for other phases
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
            <span className={styles.progressText}>
              {currentIndex}/{totalWords}
            </span>
          </div>
        </div>

        {/* Main Game Area */}
        <div className={styles.gameArea}>
          {/* Character on the Left */}
          <div className={styles.characterSide}>
            <div className={styles.characterWrapper}>
              <img
                src={Character}
                alt="WildLitz Character"
                className={styles.character}
              />

              {/* Feedback bubble below character */}
              {showBubble && (
                <div className={styles.feedbackBubble}>
                  {bubbleMessage || getFallbackMessage()}
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
                <span>{gameConfig?.difficulty || "Medium"}</span>
              </div>
            </div>
          </div>

          {/* Word Display in Center - With flip effect */}
          <div
            className={`${styles.wordSection} ${
              isFlipped ? styles.flipped : ""
            }`}
            onClick={handleCardFlip}
            onTransitionEnd={handleFlipTransitionEnd}
          >
            {/* Front side - Word information */}
            <div className={styles.cardFront}>
              <div className={styles.wordImageContainer}>
                <div className={styles.wordImage}>
                  {currentWord.image_url ? (
                    <img
                      src={currentWord.image_url}
                      alt={currentWord.word}
                      className={styles.realImage}
                    />
                  ) : (
                    <div className={styles.placeholderImage}>
                      <span>🖼️</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.wordDisplay}>
                <h2>{currentWord.word}</h2>
                <button
                  className={`${styles.playButton} ${
                    isPlaying ? styles.playing : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card flip when clicking button
                    handlePlaySound();
                  }}
                  disabled={isPlaying}
                >
                  <span className={styles.soundIcon}>🔊</span>
                  <span>{isPlaying ? "Playing..." : "Listen Again"}</span>
                </button>
              </div>

              <div className={styles.flipInstruction}>
                Click to see big image
              </div>
            </div>

            {/* Back side - Real image */}
            <div className={styles.cardBack}>
              <div className={styles.realImageContainer}>
                {currentWord.image_url ? (
                  <img
                    src={currentWord.image_url}
                    alt={currentWord.word}
                    className={styles.realImage}
                  />
                ) : (
                  <div className={styles.placeholderImage}>
                    <span>No image available</span>
                  </div>
                )}
              </div>
              <div className={styles.funFactContainer}>
                <span className={styles.funFactIcon}>💡</span>
                <div className={styles.funFact}>{currentWord.fun_fact}</div>
              </div>
              <div className={styles.flipInstruction}>Click to see word</div>
            </div>
          </div>

          {/* Clap Area on Right */}
          <div className={styles.clapSection}>
            <p className={styles.instructions} style={{ fontSize: "1.1rem" }}>
              👏 Clap out loud for{" "}
              <strong style={{ color: "gold" }}>each syllable!</strong>
            </p>

            {/* Microphone Toggle Button */}
            <div className={styles.micControls}>
              <button
                className={`${styles.micToggle} ${
                  micEnabled ? styles.micActive : ""
                }`}
                onClick={() => setMicEnabled(!micEnabled)}
                title={micEnabled ? "Disable microphone" : "Enable microphone"}
              >
                <span className={styles.micIcon}>🎤</span>
                <span className={styles.micLabel}>
                  {isListening
                    ? "Listening..."
                    : micEnabled
                    ? "Starting..."
                    : "Use Mic"}
                </span>
                {/* Active indicator inside button */}
                {isListening && (
                  <>
                    <span className={styles.pulseIcon}>🔴</span>
                    <span className={styles.activeLabel}>Active</span>
                  </>
                )}
              </button>

              {/* Show error messages */}
              {micEnabled && errorMessage && (
                <div className={styles.micError}>
                  <span className={styles.errorIcon}>⚠️</span>
                  <span className={styles.errorText}>{errorMessage}</span>
                </div>
              )}

              {/* Permission denied message */}
              {micEnabled && micPermission === "denied" && (
                <div className={styles.micError}>
                  <span className={styles.errorIcon}>⚠️</span>
                  <span className={styles.errorText}>Mic access denied</span>
                </div>
              )}
            </div>

            {/* Manual Clap Button */}
            <button className={styles.clapButton} onClick={handleClap}>
              <span className={styles.clapIcon}>👏</span>
            </button>

            <div className={styles.clapCountDisplay}>
              <span className={styles.clapCount}>{clapCount}</span>
              <span className={styles.clapLabel}>claps</span>

              {/* Add reset button here */}
              <button
                className={styles.resetButton}
                onClick={() => setClapCount(0)}
                title="Reset claps"
              >
                <span className={styles.resetIcon}>🔄</span>
              </button>
            </div>

            <button
              className={`${styles.checkButton} ${
                checkButtonDisabled ? styles.disabled : ""
              }`}
              onClick={handleCheckAnswer}
              disabled={clapCount === 0 || checkButtonDisabled}
            >
              {checkButtonDisabled ? "Checking..." : "Check Answer"}
            </button>
          </div>
        </div>

        {/* Loading and Error States */}
        {isLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading next word...</p>
          </div>
        )}

        {error && (
          <div className={styles.errorMessage}>
            <p>{error}</p>
            <button onClick={fetchNewWord}>Try Again</button>
          </div>
        )}
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
            <span className={styles.progressText}>
              {currentIndex}/{totalWords}
            </span>
          </div>
        </div>

        {/* Feedback Game Area */}
        <div className={styles.gameArea}>
          {/* Character on the Left */}
          <div className={styles.characterSide}>
            <div className={styles.characterWrapper}>
              <img
                src={Character}
                alt="WildLitz Character"
                className={styles.character}
              />

              {/* Feedback bubble below character */}
              {showBubble && (
                <div
                  className={`${styles.feedbackBubble} ${
                    clapCount === currentWord.count
                      ? styles.correct
                      : styles.incorrect
                  }`}
                >
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
                <span>{gameConfig?.difficulty || "Medium"}</span>
              </div>
            </div>
          </div>

          {/* Word and Image - With flip effect */}
          <div
            className={`${styles.wordSection} ${
              isFlipped ? styles.flipped : ""
            }`}
            onClick={handleCardFlip}
            onTransitionEnd={handleFlipTransitionEnd}
          >
            {/* Front side - Word information */}
            <div className={styles.cardFront}>
              <div className={styles.wordImageContainer}>
                <div className={styles.wordImage}>
                  {currentWord.image_url ? (
                    <img
                      src={currentWord.image_url}
                      alt={currentWord.word}
                      className={styles.realImage}
                    />
                  ) : (
                    <div className={styles.placeholderImage}>
                      <span>🖼️</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.wordDisplay}>
                <h2>{currentWord.word}</h2>
                <div className={styles.resultDisplay}>
                  {clapCount === currentWord.count ? (
                    <span className={styles.correctResult}>✅ Correct!</span>
                  ) : (
                    <span className={styles.incorrectResult}>
                      ⚠️ {currentWord.word} has {currentWord.count} syllables
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.flipInstruction}>
                Click to see big image
              </div>
            </div>

            {/* Back side - Real image */}
            <div className={styles.cardBack}>
              <div className={styles.realImageContainer}>
                {currentWord.image_url ? (
                  <img
                    src={currentWord.image_url}
                    alt={currentWord.word}
                    className={styles.realImage}
                  />
                ) : (
                  <div className={styles.placeholderImage}>
                    <span>No image available</span>
                  </div>
                )}
              </div>
              <div className={styles.funFactContainer}>
                <span className={styles.funFactIcon}>💡</span>
                <div className={styles.funFact}>{currentWord.fun_fact}</div>
              </div>
              <div className={styles.flipInstruction}>Click to see word</div>
            </div>
          </div>

          {/* Syllable Breakdown */}
          <div className={styles.syllableSection}>
            <h3>Syllable Breakdown</h3>

            <div className={styles.syllables}>
              {currentWord.syllables.split("-").map((syllable, index) => {
                // Check if this syllable has audio available
                const syllableAudioUrls = currentWord.syllable_audio_urls || [];
                const hasAudio = syllableAudioUrls[index] ? true : false;

                return (
                  <button
                    key={index}
                    className={`${styles.syllableButton} ${
                      speakingSyllable === syllable ? styles.speaking : ""
                    }`}
                    onClick={() => handleSyllablePronunciation(syllable, index)} // ✅ Fixed: Pass index
                    disabled={speakingSyllable !== null}
                    title={
                      hasAudio
                        ? `Click to hear "${syllable}"`
                        : "No audio available"
                    } // ✅ Kept tooltip
                  >
                    {syllable}
                    {!hasAudio && (
                      <span className={styles.noAudioIndicator}> ⚠️</span> // ✅ Visual warning if no audio
                    )}
                  </button>
                );
              })}
            </div>

            {/* AI Feedback Section */}
            <div className={styles.aiFeedbackSection}>
              <div className={styles.aiFeedbackTitle}>
                <span>🤖</span> AI Learning Assistant
              </div>
              <div className={styles.aiFeedbackContent}>
                <div
                  style={{
                    /* This controls the line height *within* each paragraph */
                    lineHeight: "1.2",
                    /* ✅ ADD THIS LINE */
                    fontSize:
                      "0.9rem" /* Adjust this value (e.g., '14px', '0.85em') */,
                  }}
                >
                  {learningFeedback
                    ? learningFeedback.split("\n\n").map((paragraph, index) => (
                        <p
                          key={index}
                          style={{
                            /* This controls the space *between* each paragraph */
                            margin: "0",
                            marginBottom: "1em" /* Adjust this as needed */,
                          }}
                        >
                          {paragraph}
                        </p>
                      ))
                    : `In "${currentWord.word}", we hear ${currentWord.count} distinct syllables: ${currentWord.syllables}. Keep practicing!`}
                </div>
              </div>
            </div>

            <div className={styles.actionButtons}>
              <button
                className={`${styles.demoButton} ${
                  demoButtonDisabled ? styles.disabled : ""
                }`}
                onClick={handleShowDemo}
                disabled={demoButtonDisabled}
              >
                {demoButtonDisabled ? "Loading Demo..." : "Sound Demo"}
              </button>

              <button
                className={`${styles.nextButton} ${
                  nextButtonDisabled ? styles.disabled : ""
                }`}
                onClick={handleNextWord}
                disabled={nextButtonDisabled}
              >
                {nextButtonDisabled
                  ? "Loading..."
                  : currentIndex === totalWords
                  ? "See Results"
                  : "Next Word"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render the appropriate component based on game phase
  const renderGameContent = () => {
    switch (gamePhase) {
      case "config":
        return <SyllableConfigScreen onStartGame={handleStartGame} />;

      case "loading":
        const displayDifficulty = gameConfig?.difficulty || "Medium";

        return (
          <SyllableLoadingScreen
            difficulty={displayDifficulty}
            wordIndex={currentIndex}
            totalWords={totalWords}
            tip={syllableTip}
          />
        );

      case "wordTransition":
        return (
          <>
            {renderPlayingPhase()}
            <WordTransitionScreen
              wordIndex={currentIndex}
              totalWords={totalWords}
              tip={syllableTip}
            />
          </>
        );

      case "playing":
        return renderPlayingPhase();

      case "feedback":
        return renderFeedbackPhase();

      case "demo":
        return (
          <SyllableDemoScreen
            word={currentWord}
            onBack={handleBackFromDemo}
            pronunciationGuide={currentWord.pronunciationGuide}
          />
        );

      case "complete":
        return (
          <CompletionScreen
            stats={gameStats}
            onPlayAgain={handlePlayAgain}
            onGoHome={handleGoHome}
          />
        );

      default:
        return <SyllableConfigScreen onStartGame={handleStartGame} />;
    }
  };

  // Handle playing again
  const handlePlayAgain = () => {
    setGamePhase("config");
    setClapCount(0);
    setCurrentIndex(1);
    setCorrectAnswers(0);
    setStartTime(null);
    setGameWords([]);
    setWordIndex(0);
  };

  // Handle returning to home
  const handleGoHome = () => {
    navigate("/home");
  };

  return (
    <>
      <div className={styles.container}>
        {renderQuitButton()}
        {renderGameContent()}
      </div>

      <DraggableRhythmTimer
        isGameActive={gamePhase === "playing"}
        wordPlayTimestamp={wordPlayTimestamp}
      />
    </>
  );
};

export default SyllableClappingGame;
