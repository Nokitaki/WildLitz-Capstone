import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import styles from "../../../styles/games/syllable/SyllableConfigScreen.module.css";
import EditWordModal from "./EditWordModal";

const SyllableConfigScreen = ({ onStartGame }) => {
  // State management
  const [difficulty, setDifficulty] = useState("easy");
  const [questionCount, setQuestionCount] = useState(10);
  const [selectedCategories, setSelectedCategories] = useState({
    animals: true,
    fruits: false,
    food: true,
    toys: true,
    clothes: false,
    schoolSupplies: true,
    nature: true,
    everydayWords: true,
  });

  // AI Syllable Suggestion state
  const [isSuggestingBreakdown, setIsSuggestingBreakdown] = useState(false);

  const [showCategoryNotice, setShowCategoryNotice] = useState("");

  const [showSearchModal, setShowSearchModal] = useState(false);

  const [validationDismissed, setValidationDismissed] = useState(false);

  const [editingWord, setEditingWord] = useState(null);

  const [showEditWordModal, setShowEditWordModal] = useState(false);
  const [showCustomWordModal, setShowCustomWordModal] = useState(false);
  const [customWords, setCustomWords] = useState([]);
  // Enhanced custom word form state
  const [newCustomWord, setNewCustomWord] = useState({
    word: "",
    syllableBreakdown: "",
    syllableCount: 0,
    category: "",
  });

  // Spelling check state
  const [spellingError, setSpellingError] = useState(false);
  const [spellingSuggestions, setSpellingSuggestions] = useState([]);

  // Check spelling using a free API
  const checkSpelling = async (word) => {
    if (!word || word.length < 2) {
      setSpellingError(false);
      setSpellingSuggestions([]);
      return;
    }

    try {
      // Using LanguageTool API (free tier)
      const response = await axios.post(
        "https://api.languagetool.org/v2/check",
        new URLSearchParams({
          text: word,
          language: "en-US",
        })
      );

      if (response.data.matches && response.data.matches.length > 0) {
        const match = response.data.matches[0];
        if (match.rule.issueType === "misspelling") {
          setSpellingError(true);
          setSpellingSuggestions(
            match.replacements.slice(0, 3).map((r) => r.value)
          );
        } else {
          setSpellingError(false);
          setSpellingSuggestions([]);
        }
      } else {
        setSpellingError(false);
        setSpellingSuggestions([]);
      }
    } catch (error) {
      console.error("Error checking spelling:", error);
      // Fail silently - spelling check is optional
      setSpellingError(false);
    }
  };

  // AI Validation state
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  // Image upload state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Audio recording state
  const [isRecordingFullWord, setIsRecordingFullWord] = useState(false);
  const [fullWordAudio, setFullWordAudio] = useState(null);
  const [syllableAudios, setSyllableAudios] = useState({});
  const [recordingSyllableIndex, setRecordingSyllableIndex] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  // AI category suggestion
  const [aiSuggestedCategory, setAiSuggestedCategory] = useState("");

  // Form submission state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Word existence check
  const [wordExists, setWordExists] = useState(false);
  const [existingWordData, setExistingWordData] = useState(null);

  // Database Search Panel State
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFilters, setSearchFilters] = useState({
    categories: [],
    has_audio: false,
  });
  const [searchResults, setSearchResults] = useState([]);
  const [searchIsLoading, setSearchIsLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchTotalPages, setSearchTotalPages] = useState(0);
  const [searchCurrentPage, setSearchCurrentPage] = useState(1);

  const handleSearch = async (page = 1) => {
    setSearchIsLoading(true);
    setSearchError("");
    setSearchCurrentPage(page);

    try {
      // Build query parameters
      const params = new URLSearchParams({
        q: searchTerm,
        page: page,
        has_audio: searchFilters.has_audio,
      });
      searchFilters.categories.forEach((cat) =>
        params.append("categories[]", cat)
      );

      const response = await axios.get(
        `http://127.0.0.1:8000/api/syllabification/search-words/?${params.toString()}`
      );

      setSearchResults(response.data.results || []);
      setSearchTotalPages(response.data.totalPages || 0);
    } catch (error) {
      console.error("Error searching words:", error);
      setSearchError("Failed to fetch words. Please try again.");
    } finally {
      setSearchIsLoading(false);
    }
  };

  // Trigger initial search when the SEARCH modal opens
  useEffect(() => {
    if (showSearchModal) {
      handleSearch();
    }
  }, [showSearchModal]);

  // Load custom words from database when modal opens
  /*
  useEffect(() => {
    if (showCustomWordModal) {
      //loadCustomWordsFromDB();
    }
  }, [showCustomWordModal]);
  */

  const loadCustomWordsFromDB = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/api/syllabification/get-custom-words/"
      );
      setCustomWords(response.data.words || []);
    } catch (error) {
      console.error("Error loading custom words:", error);
    }
  };

  const categories = [
    { id: "animals", name: "Animals", icon: "🦁" },
    { id: "fruits", name: "Fruits", icon: "🍎" },
    { id: "food", name: "Food", icon: "🍕" },
    { id: "toys", name: "Toys", icon: "🧸" },
    { id: "clothes", name: "Clothes", icon: "👕" },
    { id: "schoolSupplies", name: "School Supplies", icon: "✏️" },
    { id: "nature", name: "Nature", icon: "🌿" },
    { id: "everydayWords", name: "Everyday Words", icon: "🗣️" },
    { id: "everydayObjects", name: "Everyday Objects", icon: "🔧" },
  ];

  const difficultyInfo = {
    easy: { emoji: "😊", text: "1-2 syllables", color: "#4caf50" },
    medium: { emoji: "🤔", text: "2-3 syllables", color: "#ff9800" },
    hard: { emoji: "🧠", text: "3+ syllables", color: "#f44336" },
  };

  const toggleCategory = (categoryId) => {
    setSelectedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleFilterChange = (filterName, value, isChecked) => {
    setSearchFilters((prevFilters) => {
      const newFilters = { ...prevFilters };

      if (filterName === "category") {
        if (isChecked) {
          newFilters.categories = [...newFilters.categories, value];
        } else {
          newFilters.categories = newFilters.categories.filter(
            (cat) => cat !== value
          );
        }
      } else {
        // This now handles 'has_audio'
        newFilters[filterName] = value;
      }

      return newFilters;
    });
  };

  // We need to trigger a search when filters change. Modify this useEffect.
  useEffect(() => {
    // This effect now runs when the modal opens OR when filters change
    if (showSearchModal) {
      handleSearch(1); // Reset to page 1 on filter change
    }
  }, [showSearchModal, searchFilters]); // Add searchFilters to dependency array

  const selectRandomCategories = () => {
    const newCategories = {};
    categories.forEach((category) => {
      newCategories[category.id] = Math.random() > 0.5;
    });

    if (!Object.values(newCategories).some((value) => value)) {
      const randomIndex = Math.floor(Math.random() * categories.length);
      newCategories[categories[randomIndex].id] = true;
    }

    setSelectedCategories(newCategories);
  };

  // Calculate syllable count from breakdown
  const updateSyllableBreakdown = (value) => {
    const breakdown = value.trim();
    const count = breakdown ? breakdown.split("-").length : 0;

    setNewCustomWord((prev) => ({
      ...prev,
      syllableBreakdown: breakdown,
      syllableCount: count,
    }));

    // Reset validation when breakdown changes
    setValidationResult(null);
  };

  // Auto-validate when both word and syllable breakdown are present
  useEffect(() => {
    const timer = setTimeout(() => {
      // 👇 ADD THIS CHECK
      if (
        newCustomWord.word.trim() &&
        newCustomWord.syllableBreakdown.trim() &&
        newCustomWord.syllableCount > 0 &&
        !validationDismissed // <-- Only run if it has NOT been dismissed
      ) {
        handleValidateSyllables();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [newCustomWord.word, newCustomWord.syllableBreakdown]);

  // Check if word exists in database
  const checkWordExists = async (word) => {
    if (!word || word.length < 2) {
      setWordExists(false);
      setExistingWordData(null);
      return;
    }

    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/api/syllabification/check-word-exists/?word=${word}`
      );

      if (response.data.exists) {
        setWordExists(true);
        setExistingWordData(response.data.word);
      } else {
        setWordExists(false);
        setExistingWordData(null);
      }
    } catch (error) {
      console.error("Error checking word existence:", error);
    }
  };

  const handleValidateSyllables = async () => {
    if (!newCustomWord.word || !newCustomWord.syllableBreakdown) {
      alert("Please enter both word and syllable breakdown");
      return;
    }

    setIsValidating(true);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/syllabification/validate-syllable-structure/",
        {
          word: newCustomWord.word,
          syllable_breakdown: newCustomWord.syllableBreakdown,
        }
      );

      setValidationResult(response.data.validation);

      // AI-suggest category based on word (Now runs every time)
      try {
        const categoryResponse = await axios.post(
          "http://127.0.0.1:8000/api/syllabification/generate-ai-content/",
          {
            type: "category_suggestion",
            word: newCustomWord.word,
          }
        );

        const suggestedCategory = categoryResponse.data.content;
        if (suggestedCategory) {
          // 1. Automatically update the form's category
          setNewCustomWord((prev) => ({
            ...prev,
            category: suggestedCategory,
          }));

          // 2. Show the notice with the suggested category
          setShowCategoryNotice(suggestedCategory);

          // 3. Set a timer to hide the notice after 5 seconds
          setTimeout(() => {
            setShowCategoryNotice("");
          }, 5000);
        }
      } catch (error) {
        console.error("Error getting AI category suggestion:", error);
      }
    } catch (error) {
      console.error("Error validating syllables:", error);
      alert("Failed to validate syllables. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  // Consolidated useEffect for all debounced actions on the 'Word' input
  useEffect(() => {
    const trimmedWord = newCustomWord.word.trim();

    // Set a single timer for 800ms
    const timer = setTimeout(() => {
      if (trimmedWord) {
        // Run all suggestions and checks from one place
        fetchAiSyllableBreakdown(trimmedWord);
        fetchAiCategorySuggestion(trimmedWord);
        checkSpelling(trimmedWord);
        checkWordExists(trimmedWord);

        setValidationDismissed(false);
      }
    }, 800);

    // This cleanup function will run every time the user types a new letter,
    // resetting the timer and preventing the functions from running too early.
    return () => clearTimeout(timer);
  }, [newCustomWord.word]);

  const fetchAiCategorySuggestion = async (word) => {
    if (!word || word.length < 2) return; // Don't run on very short words

    try {
      const categoryResponse = await axios.post(
        "http://127.0.0.1:8000/api/syllabification/generate-ai-content/",
        {
          type: "category_suggestion",
          word: word,
        }
      );

      const suggestedCategory = categoryResponse.data.content;

      // ✅ CHANGED: Only update if AI actually suggested something
      if (
        suggestedCategory &&
        suggestedCategory !== "null" &&
        suggestedCategory !== ""
      ) {
        // Automatically update the form's category
        setNewCustomWord((prev) => ({ ...prev, category: suggestedCategory }));

        // Show the timed notice
        setShowCategoryNotice(suggestedCategory);
        setTimeout(() => {
          setShowCategoryNotice("");
        }, 5000);
      }
      // ✅ NEW: If AI returns null/empty, do nothing - let teacher choose manually
    } catch (error) {
      console.error("Error getting AI category suggestion:", error);
      // On error, also do nothing - let teacher choose manually
    }
  };

  const fetchAiSyllableBreakdown = async (word) => {
    // Don't fetch for very short words to save API calls
    if (!word || word.length < 3) return;

    setIsSuggestingBreakdown(true);
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/syllabification/generate-ai-content/",
        {
          type: "syllable_breakdown_suggestion",
          word: word,
        }
      );

      if (response.data.content) {
        // Use your existing function to update the input field and syllable count
        updateSyllableBreakdown(response.data.content);
      }
    } catch (error) {
      console.error("Error fetching AI syllable breakdown:", error);
    } finally {
      setIsSuggestingBreakdown(false);
    }
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // Audio recording functions
  const startRecording = async (type, syllableIndex = null) => {
    try {
      // ← ADD NOISE SUPPRESSION HERE
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true, // ← Removes echo
          noiseSuppression: true, // ← Reduces background noise
          autoGainControl: true, // ← Normalizes volume
          sampleRate: 48000, // ← Higher quality
        },
      });

      const recorder = new MediaRecorder(stream);
      const audioChunks = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);

        if (type === "fullWord") {
          setFullWordAudio({ blob: audioBlob, url: audioUrl });
          setIsRecordingFullWord(false);
        } else if (type === "syllable" && syllableIndex !== null) {
          setSyllableAudios((prev) => ({
            ...prev,
            [syllableIndex]: { blob: audioBlob, url: audioUrl },
          }));
          setRecordingSyllableIndex(null);
        }

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);

      if (type === "fullWord") {
        setIsRecordingFullWord(true);
      } else if (type === "syllable") {
        setRecordingSyllableIndex(syllableIndex);
      }

      // Auto-stop after 5 seconds
      setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop();
        }
      }, 5000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
    }
  };

  const deleteAudio = (type, syllableIndex = null) => {
    if (type === "fullWord") {
      setFullWordAudio(null);
    } else if (type === "syllable" && syllableIndex !== null) {
      setSyllableAudios((prev) => {
        const newAudios = { ...prev };
        delete newAudios[syllableIndex];
        return newAudios;
      });
    }
  };

  // Save custom word to database
  const saveCustomWordToDB = async () => {
    // Validation
    if (!newCustomWord.word || !newCustomWord.syllableBreakdown) {
      alert("Please enter word and syllable breakdown");
      return;
    }

    if (!validationResult) {
      alert("Please validate the syllable structure first");
      return;
    }

    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append("word", newCustomWord.word);
      formData.append("syllable_breakdown", newCustomWord.syllableBreakdown);
      formData.append(
        "category",
        newCustomWord.category || aiSuggestedCategory || "Custom Words"
      );

      // Add image if uploaded
      if (imageFile) {
        formData.append("image", imageFile);
      }

      // Add full word audio if recorded
      if (fullWordAudio) {
        formData.append(
          "full_word_audio",
          fullWordAudio.blob,
          "full_word.webm"
        );
      }

      // Add syllable audios if recorded
      const syllables = newCustomWord.syllableBreakdown.split("-");
      syllables.forEach((syllable, index) => {
        if (syllableAudios[index]) {
          formData.append(
            `syllable_audio_${index}`,
            syllableAudios[index].blob,
            `syllable_${index}.webm`
          );
        }
      });

      const response = await axios.post(
        "http://127.0.0.1:8000/api/syllabification/create-custom-word/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        setSaveSuccess(true);

        // Reload custom words list
        await loadCustomWordsFromDB();

        // Reset form after 2 seconds
        setTimeout(() => {
          resetCustomWordForm();
          setSaveSuccess(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Error saving custom word:", error);
      alert("Failed to save custom word. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const resetCustomWordForm = () => {
    setNewCustomWord({
      word: "",
      syllableBreakdown: "",
      syllableCount: 0,
      category: "",
    });
    setValidationResult(null);
    setImageFile(null);
    setImagePreview(null);
    setFullWordAudio(null);
    setSyllableAudios({});
    setShowCategoryNotice("");
    setWordExists(false);
    setExistingWordData(null);
    setEditingWord(null);
    setValidationDismissed(false);  // ✅ ADD THIS LINE
  };

  const deleteCustomWord = (wordId) => {
    // I've updated the confirmation text to be more accurate
    if (
      !window.confirm(
        "Are you sure you want to remove this word from the game list?"
      )
    ) {
      return;
    }

    // This only updates the temporary list on your screen (the "playlist")
    setCustomWords((currentWords) =>
      currentWords.filter((word) => word.id !== wordId)
    );
  };

  const handleStartGame = () => {
    const categoryNames = Object.entries(selectedCategories)
      .filter(([_, isSelected]) => isSelected)
      .map(([id, _]) => {
        const category = categories.find((cat) => cat.id === id);
        return category ? category.name : "";
      })
      .filter((name) => name !== "");

    if (categoryNames.length === 0 && customWords.length === 0) {
      alert("Please select at least one category or add custom words");
      return;
    }

    onStartGame({
      difficulty,
      questionCount,
      categories: categoryNames,
      customWords: customWords.map((w) => ({ id: w.id, word: w.word })),
    });
  };

  const syllables = newCustomWord.syllableBreakdown
    ? newCustomWord.syllableBreakdown.split("-")
    : [];

  const handlePermanentDelete = async (wordId) => {
    if (
      !window.confirm(
        "Are you sure you want to PERMANENTLY delete this word from the database? This cannot be undone."
      )
    ) {
      return;
    }

    try {
      await axios.delete(
        `http://127.0.0.1:8000/api/syllabification/delete-custom-word/${wordId}/`
      );

      // 👇 ADD THIS LINE to remove the word from the list on screen
      setSearchResults((currentResults) =>
        currentResults.filter((word) => word.id !== wordId)
      );
    } catch (error) {
      console.error("Error permanently deleting word:", error);
      alert("Failed to delete the word from the database. Please try again.");
    }
  };

  const handleStartEdit = (word) => {
    // Set the selected word as the one being edited
    setEditingWord(word);

    // Open the EDIT modal (not the custom word modal)
    setShowEditWordModal(true);
  };

  const handleUpdateWord = async (editedData) => {
    if (!editingWord) return;

    setIsSaving(true);
    try {
      // Create FormData to handle file uploads
      const formData = new FormData();

      // Add basic text fields
      formData.append("word", editedData.word);
      formData.append("syllable_breakdown", editedData.syllableBreakdown);
      formData.append("category", editedData.category);

      // Add new full word audio if recorded
      if (editedData.newFullWordAudio && editedData.newFullWordAudio.blob) {
        formData.append(
          "full_word_audio",
          editedData.newFullWordAudio.blob,
          `${editedData.word.toLowerCase().replace(/\s+/g, "_")}_full.webm`
        );
      }

      // Add new syllable audios if recorded
      const syllables = editedData.syllableBreakdown.split("-");
      if (editedData.newSyllableAudios) {
        Object.keys(editedData.newSyllableAudios).forEach((index) => {
          const audioData = editedData.newSyllableAudios[index];
          if (audioData && audioData.blob) {
            formData.append(
              `syllable_audio_${index}`,
              audioData.blob,
              `${editedData.word
                .toLowerCase()
                .replace(/\s+/g, "_")}_syl_${index}.webm`
            );
          }
        });
      }

      // Send PUT request with FormData
      const response = await axios.put(
        `http://127.0.0.1:8000/api/syllabification/update-custom-word/${editingWord.id}/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Update the search results list on screen with the new data
      setSearchResults((currentResults) =>
        currentResults.map((word) =>
          word.id === editingWord.id ? response.data : word
        )
      );

      // Close the edit modal and reset
      setShowEditWordModal(false);
      setEditingWord(null);

      alert("Word updated successfully!");
    } catch (error) {
      console.error("Error updating word:", error);
      alert("Failed to update word. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAudioUpload = (event, type, syllableIndex = null) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const audioUrl = URL.createObjectURL(file);
    const audioBlob = file; // The selected file is already in the right format (a Blob)

    if (type === 'fullWord') {
      setFullWordAudio({ blob: audioBlob, url: audioUrl });
    } else if (type === 'syllable' && syllableIndex !== null) {
      setSyllableAudios(prev => ({
        ...prev,
        [syllableIndex]: { blob: audioBlob, url: audioUrl },
      }));
    }

    // It's important to reset the file input's value.
    // This allows the user to select the same file again if they need to.
    event.target.value = null;
  };

  return (
    <div className={styles.fixedContainer}>
      <div className={styles.gameCard}>
        <div className={styles.header}>
          <h1>WildLitz Syllable Clapping</h1>
          <p>Let's set up your practice session!</p>
        </div>

        <div className={styles.contentWrapper}>
          {/* DIFFICULTY SECTION */}
          <div className={styles.section}>
            <h2>Difficulty Level</h2>
            <div className={styles.difficultyButtons}>
              {Object.entries(difficultyInfo).map(([level, info]) => (
                <motion.button
                  key={level}
                  className={`${styles.difficultyBtn} ${difficulty === level ? styles.active : ""
                    }`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setDifficulty(level)}
                  style={
                    difficulty === level
                      ? {
                        backgroundColor: info.color,
                        borderColor: info.color,
                      }
                      : {}
                  }
                >
                  <span>{info.emoji}</span>
                  <div className={styles.difficultyLabel}>
                    <span className={styles.difficultyName}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </span>
                    <span className={styles.difficultySyllables}>
                      {info.text}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* CATEGORIES SECTION */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Word Categories</h2>
              <div className={styles.headerButtons}>
                <motion.button
                  className={`${styles.randomBtn} ${styles.manageDbBtn}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSearchModal(true)}
                >
                  <span>📚</span>
                  Manage Database
                </motion.button>
                <motion.button
                  className={styles.randomBtn}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={selectRandomCategories}
                >
                  <span className={styles.diceIcon}>🎲</span>
                  Random Mix
                </motion.button>
              </div>
            </div>

            <div className={styles.categoriesGrid}>
              {categories.map((category) => (
                <motion.div
                  key={category.id}
                  className={`${styles.categoryCard} ${selectedCategories[category.id] ? styles.selected : ""
                    }`}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => toggleCategory(category.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories[category.id]}
                    onChange={() => toggleCategory(category.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className={styles.categoryIcon}>{category.icon}</span>
                  <span className={styles.categoryName}>{category.name}</span>
                </motion.div>
              ))}

              <motion.div
                className={styles.addCustomBtn}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowCustomWordModal(true)}
              >
                <span className={styles.customIcon}>✏️</span>
                <div className={styles.customLabel}>
                  <div className={styles.customLabelFlex}>
                    <span>Custom Words </span>
                    {customWords.length > 0 && (
                      <span className={styles.customCount}>
                        {customWords.length}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* QUESTION COUNT SECTION */}
          <div className={styles.section}>
            <h2>Number of Questions</h2>
            <div className={styles.sliderContainer}>
              <input
                type="range"
                min="5"
                max="20"
                step="1"
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                className={styles.slider}
                style={{
                  background: `linear-gradient(to right, 
                    ${difficultyInfo[difficulty].color} 0%, 
                    ${difficultyInfo[difficulty].color} ${((questionCount - 5) / 15) * 100
                    }%, 
                    #ddd ${((questionCount - 5) / 15) * 100}%, 
                    #ddd 100%)`,
                }}
              />
              <div className={styles.sliderLabels}>
                <span>5</span>
                <span
                  className={styles.currentValue}
                  style={{ backgroundColor: difficultyInfo[difficulty].color }}
                >
                  {questionCount}
                </span>
                <span>20</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.gameFooter}>
          <motion.button
            className={styles.startButton}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleStartGame}
            style={{ backgroundColor: difficultyInfo[difficulty].color }}
          >
            Start Game
          </motion.button>

          {customWords.length > 0 && (
            <div className={styles.customWordsSummary}>
              <span className={styles.customWordsIcon}>📚</span>
              <span>
                {customWords.length} custom word
                {customWords.length !== 1 ? "s" : ""} ready
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 
  ==========================================
  CUSTOM WORD MODAL - FOR CREATING NEW WORDS ONLY
  ==========================================
  Note: This modal is ONLY for adding NEW custom words to the database.
  For EDITING existing words, use the EditWordModal which is opened
  from the "Manage Database" search panel.
*/}
      <AnimatePresence>
        {showCustomWordModal && (
          <div className={styles.modalOverlay}>
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
            >
              <div className={styles.modalHeader}>
                <h2>Add Custom Word to Database</h2>
                <motion.button
                  className={styles.closeButton}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setShowCustomWordModal(false);
                    resetCustomWordForm();
                  }}
                >
                  ✕
                </motion.button>
              </div>

              <p>
                Create a custom word that will be saved to the database for
                future use!
              </p>

              {/* WORD INPUT */}
              <div className={styles.wordForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="custom-word">Word *</label>
                  <input
                    id="custom-word"
                    type="text"
                    value={newCustomWord.word}
                    onChange={(e) =>
                      setNewCustomWord({
                        ...newCustomWord,
                        word: e.target.value,
                      })
                    }
                    placeholder="Enter a word (e.g., butterfly)"
                    className={styles.wordInput}
                  />

                  {/* Word Exists Warning */}
                  {wordExists && existingWordData && (
                    <div
                      className={styles.aiSuggestionBox}
                      style={{
                        marginTop: "0.5rem",
                        backgroundColor: "#e3f2fd",
                        borderColor: "#2196f3",
                      }}
                    >
                      <span className={styles.aiIcon}>💡</span>
                      <div className={styles.suggestionText}>
                        <strong>"{existingWordData.word}"</strong> already
                        exists in database
                        <div
                          style={{ fontSize: "0.75rem", marginTop: "0.2rem" }}
                        >
                          Syllables: {existingWordData.syllable_breakdown} |
                          Category: {existingWordData.category}
                        </div>
                        <div
                          style={{
                            marginTop: "0.5rem",
                            display: "flex",
                            gap: "0.5rem",
                          }}
                        >
                          <button
                            className={styles.acceptSuggestionButton}
                            onClick={() => {
                              // Add to game selection without creating duplicate
                              setCustomWords((prev) => {
                                const exists = prev.some(
                                  (w) => w.id === existingWordData.id
                                );
                                if (exists) return prev;
                                return [...prev, existingWordData];
                              });
                              resetCustomWordForm();
                            }}
                          >
                            ✓ Use Existing Word
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Spelling Error Warning */}

                  {spellingError && spellingSuggestions.length > 0 && (
                    <div
                      className={styles.aiSuggestionBox}
                      style={{
                        marginTop: "0.5rem",
                        backgroundColor: "#fff8e1",
                        borderColor: "#ffc107",
                      }}
                    >
                      <span className={styles.aiIcon}>📝</span>

                      <div className={styles.suggestionText}>
                        <strong>Possible spelling error.</strong> Did you mean:{" "}
                        {spellingSuggestions.join(", ")}?
                        <div
                          style={{
                            marginTop: "0.3rem",
                            display: "flex",
                            gap: "0.3rem",
                            flexWrap: "wrap",
                          }}
                        >
                          {spellingSuggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              className={styles.acceptSuggestionButton}
                              onClick={() =>
                                setNewCustomWord({
                                  ...newCustomWord,
                                  word: suggestion,
                                })
                              }
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* SYLLABLE BREAKDOWN */}
                <div className={styles.formGroup}>
                  <label htmlFor="syllable-breakdown">
                    Syllable Breakdown *{" "}
                    <span className={styles.infoText}>
                      (use hyphens: but-ter-fly)
                    </span>
                  </label>
                  {/* 👇 Add a conditional 'loading' class here */}
                  <div
                    className={`${styles.syllableBreakdownGroup} ${isSuggestingBreakdown ? styles.loading : ""
                      }`}
                  >
                    <input
                      id="syllable-breakdown"
                      type="text"
                      value={newCustomWord.syllableBreakdown}
                      onChange={(e) => updateSyllableBreakdown(e.target.value)}
                      placeholder="e.g., but-ter-fly"
                      className={`${styles.wordInput} ${styles.syllableBreakdownInput}`}
                    />
                    {/* 👇 Add this spinner element */}
                    {isSuggestingBreakdown && (
                      <span className={styles.inputSpinner}></span>
                    )}

                    <div className={styles.syllableCountBadge}>
                      <span className={styles.count}>
                        {newCustomWord.syllableCount}
                      </span>
                      <span className={styles.label}>syllables</span>
                    </div>
                  </div>
                </div>

                {/* AI VALIDATION */}
                <div className={styles.aiValidationSection}>
                  {validationResult && !validationDismissed && (
                    <div
                      className={`${styles.validationResult} ${validationResult.is_correct
                        ? styles.correct
                        : styles.incorrect
                        }`}
                    >
                      <div>
                        <span className={styles.resultIcon}>
                          {validationResult.is_correct ? "✅" : "❌"}
                        </span>
                        <span className={styles.resultText}>
                          {validationResult.is_correct
                            ? "Syllable structure looks correct!"
                            : "Syllable structure may be incorrect"}
                        </span>
                      </div>

                      {/* ✅ NEW DISMISS BUTTON */}
                      <button
                        className={styles.dismissButton}
                        onClick={() => setValidationDismissed(true)}
                        title="Dismiss AI validation - I'll verify manually"
                      >
                        Dismiss
                      </button>

                      {validationResult.suggestion && (
                        <div className={styles.suggestion}>
                          💡 {validationResult.suggestion}
                        </div>
                      )}

                      {validationResult.alternative_breakdown && (
                        <div className={styles.alternativeBreakdown}>
                          Suggested: {validationResult.alternative_breakdown}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ✅ NEW: Show message when dismissed */}
                  {validationDismissed && (
                    <div
                      style={{
                        backgroundColor: "#e3f2fd",
                        border: "1px solid #90caf9",
                        borderRadius: "8px",
                        padding: "0.8rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.85rem",
                        color: "#0d47a1",
                      }}
                    >
                      <span>ℹ️</span>
                      <span>
                        AI validation dismissed. You're in manual control -
                        verify the syllable breakdown yourself before saving.
                      </span>
                    </div>
                  )}
                </div>

                {/* CATEGORY SELECTION */}
                <div className={styles.formGroup}>
                  <label htmlFor="category">Category</label>
                  <select
                    id="category"
                    value={newCustomWord.category}
                    onChange={(e) =>
                      setNewCustomWord({
                        ...newCustomWord,
                        category: e.target.value,
                      })
                    }
                    className={styles.categorySelect}
                  >
                    <option value="">Select category...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>

                  {showCategoryNotice && (
                    <div className={styles.aiSuggestionBox}>
                      <span className={styles.aiIcon}>🤖</span>
                      <span className={styles.suggestionText}>
                        AI suggested and selected:{" "}
                        <strong>{showCategoryNotice}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* ✅ NEW: Show a different message when AI can't categorize */}
                {newCustomWord.word.length > 2 &&
                  !showCategoryNotice &&
                  !newCustomWord.category && (
                    <div
                      className={styles.aiSuggestionBox}
                      style={{
                        backgroundColor: "#fff3cd",
                        borderColor: "#ffc107",
                      }}
                    >
                      <span className={styles.aiIcon}>💭</span>
                      <span
                        className={styles.suggestionText}
                        style={{ color: "#856404" }}
                      >
                        AI couldn't categorize this word automatically. Please
                        select a category manually.
                      </span>
                    </div>
                  )}

                {/* IMAGE UPLOAD */}
                <div className={styles.imageUploadSection}>
                  <label>Word Image (Optional)</label>
                  <div
                    className={`${styles.imageUploadBox} ${imagePreview ? styles.hasImage : ""
                      }`}
                    onClick={() =>
                      document.getElementById("image-upload-input").click()
                    }
                  >
                    {!imagePreview ? (
                      <>
                        <div className={styles.uploadIcon}>🖼️</div>
                        <div className={styles.uploadText}>
                          Click to upload image
                        </div>
                      </>
                    ) : (
                      <div className={styles.imagePreview}>
                        <img src={imagePreview} alt="Preview" />
                        <button
                          className={styles.removeImageButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage();
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                  <input
                    id="image-upload-input"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: "none" }}
                  />
                </div>

                {/* AUDIO RECORDING - FULL WORD */}
                <div className={styles.audioRecordingSection}>
                  <div className={styles.audioSectionTitle}>
                    <span>🔊</span> Full Word Audio (Optional)
                  </div>

                  {!fullWordAudio ? (
                    <>
                      <div className={styles.audioActionButtons}>
                        <button
                          className={`${styles.recordButton} ${isRecordingFullWord ? styles.recording : ""
                            }`}
                          onClick={() => isRecordingFullWord ? stopRecording() : startRecording("fullWord")}
                        >
                          <span className={styles.micIcon}>🎤</span>
                          {isRecordingFullWord ? "Stop" : "Record"}
                        </button>
                        <button
                          className={styles.uploadButton}
                          onClick={() => document.getElementById('full-word-audio-upload').click()}
                        >
                          <span>☁️</span>
                          Upload
                        </button>
                      </div>
                      <input
                        type="file"
                        accept="audio/mp3, audio/wav, audio/m4a, audio/webm"
                        style={{ display: 'none' }}
                        id="full-word-audio-upload"
                        onChange={(e) => handleAudioUpload(e, 'fullWord')}
                      />
                    </>
                  ) : (
                    <div className={styles.audioPreview}>
                      <audio src={fullWordAudio.url} controls />
                      <button
                        className={styles.deleteAudioButton}
                        onClick={() => deleteAudio("fullWord")}
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>

                {/* AUDIO RECORDING - SYLLABLES */}
                {syllables.length > 0 && (
                  <div className={styles.audioRecordingSection}>
                    <div className={styles.audioSectionTitle}>
                      <span>🎵</span> Individual Syllable Audio (Optional)
                    </div>

                    <div className={styles.syllableAudioGrid}>
                      {syllables.map((syllable, index) => (
                        <div key={index} className={styles.syllableAudioItem}>
                          <div className={styles.syllableLabel}>{syllable}</div>

                          {!syllableAudios[index] ? (
                            <>
                              <div className={styles.audioActionButtons}>
                                <button
                                  className={`${styles.recordButton} ${recordingSyllableIndex === index ? styles.recording : ""
                                    }`}
                                  onClick={() => recordingSyllableIndex === index ? stopRecording() : startRecording("syllable", index)}
                                >
                                  <span className={styles.micIcon}>🎤</span>
                                  {recordingSyllableIndex === index ? "Stop" : "Record"}
                                </button>
                                <button
                                  className={styles.uploadButton}
                                  onClick={() => document.getElementById(`syllable-audio-upload-${index}`).click()}
                                >
                                  <span>☁️</span>
                                  Upload
                                </button>
                              </div>
                              <input
                                type="file"
                                accept="audio/mp3, audio/wav, audio/m4a, audio/webm"
                                style={{ display: 'none' }}
                                id={`syllable-audio-upload-${index}`}
                                onChange={(e) => handleAudioUpload(e, 'syllable', index)}
                              />
                            </>
                          ) : (
                            <div className={styles.audioPreview}>
                              <audio src={syllableAudios[index].url} controls />
                              <button
                                className={styles.deleteAudioButton}
                                onClick={() => deleteAudio("syllable", index)}
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SUCCESS MESSAGE */}
                {saveSuccess && (
                  <div className={styles.successMessage}>
                    <span className={styles.successIcon}>✅</span>
                    <span className={styles.successText}>
                      Word saved to database successfully!
                    </span>
                  </div>
                )}

                {/* FORM ACTIONS */}
                <div className={styles.formActions}>

                  <input
                    type="file"
                    accept="audio/mp3, audio/wav, audio/m4a, audio/webm"
                    style={{ display: 'none' }}
                    id="audio-upload-input"
                  />

                  <button
                    className={styles.cancelFormButton}
                    onClick={resetCustomWordForm}
                  >
                    Clear Form
                  </button>

                  <button
                    className={styles.saveToDbButton}
                    onClick={saveCustomWordToDB}
                    disabled={
                      isSaving ||
                      !newCustomWord.word ||
                      !newCustomWord.syllableBreakdown ||
                      wordExists ||
                      // This is the new, correct logic:
                      // Disable if validation has failed AND it has NOT been dismissed.
                      (validationResult && !validationResult.is_correct && !validationDismissed)
                    }
                  >
                    {isSaving ? (
                      <>
                        <span className={styles.spinner}></span>
                        Saving...
                      </>
                    ) : (
                      "💾 Save to Database"
                    )}
                  </button>
                </div>
              </div>

              {/* CUSTOM WORDS LIST FROM DATABASE */}
              {customWords.length > 0 && (
                <>
                  {/* The header is now outside the scrollable container */}
                  <h3 className={styles.customWordsHeader}>
                    Custom Words ({customWords.length})
                  </h3>
                  <div className={styles.customWordsContainer}>
                    <div className={styles.customList}>
                      {customWords.map((word, index) => (
                        <motion.div
                          key={word.id || index}
                          className={styles.wordItem}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <div className={styles.wordItemContent}>
                            <div className={styles.wordItemHeader}>
                              <span className={styles.wordText}>
                                {word.word}
                              </span>
                              <span className={styles.wordCategory}>
                                {word.category}
                              </span>
                            </div>
                            <div className={styles.wordItemDetails}>
                              <span className={styles.syllableBreakdown}>
                                {word.syllable_breakdown}
                              </span>
                              <span className={styles.syllableCounter}>
                                {word.syllable_count} syllable
                                {word.syllable_count !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>

                          <motion.button
                            className={styles.deleteButton}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => deleteCustomWord(word.id)}
                          >
                            ✕
                          </motion.button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className={styles.modalActions}>
                <motion.button
                  className={styles.saveButton}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setShowCustomWordModal(false);
                    resetCustomWordForm();
                  }}
                >
                  Done
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 👇 ADD THIS ENTIRE NEW MODAL BLOCK */}
      <AnimatePresence>
        {showSearchModal && (
          <div className={styles.modalOverlay}>
            <motion.div
              className={`${styles.modal} ${styles.searchModal}`}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
            >
              <div className={styles.modalHeader}>
                <h2>Search & Manage Database</h2>
                <motion.button
                  className={styles.closeButton}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowSearchModal(false)}
                >
                  ✕
                </motion.button>
              </div>

              {/* 👇 PASTE THE SEARCH PANEL CODE YOU CUT EARLIER RIGHT HERE */}
              {/* DATABASE SEARCH PANEL */}
              <div className={styles.searchPanel}>
                <div className={styles.searchHeader}>
                  <h3>Search Database</h3>
                </div>

                {/* Search Bar */}
                <div className={styles.searchBar}>
                  <input
                    type="text"
                    placeholder="Search by word..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch(1)}
                  />
                  <button onClick={() => handleSearch(1)}>
                    {searchIsLoading ? "..." : "🔍"}
                  </button>
                </div>

                {/* 👇 ADD THIS FILTERS BLOCK */}
                <div className={styles.searchFilters}>
                  <div className={styles.filterGroup}>
                    {categories.map((cat) => (
                      <label key={cat.id} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={searchFilters.categories.includes(cat.name)}
                          onChange={(e) =>
                            handleFilterChange(
                              "category",
                              cat.name,
                              e.target.checked
                            )
                          }
                        />{" "}
                        {cat.name}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Search Results */}
                <div className={styles.searchResults}>
                  {searchIsLoading ? (
                    <p>Loading...</p>
                  ) : searchError ? (
                    <p className={styles.searchError}>{searchError}</p>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((word) => (
                      <div key={word.id} className={styles.searchResultItem}>
                        <div className={styles.wordInfo}>
                          <span className={styles.wordText}>{word.word}</span>
                          <span className={styles.syllableBreakdown}>
                            {word.syllable_breakdown}
                          </span>
                        </div>
                        <div className={styles.wordActions}>
                          <span className={styles.wordCategory}>
                            {word.category}
                          </span>
                          {/* We will add Edit/Delete buttons here later */}
                          <button
                            className={styles.searchEditBtn}
                            onClick={() => handleStartEdit(word)}
                          >
                            ✏️
                          </button>

                          <button
                            className={styles.searchDeleteBtn}
                            onClick={() => handlePermanentDelete(word.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>No words found.</p>
                  )}
                </div>

                {/* 👇 ADD THIS PAGINATION BLOCK */}
                {searchTotalPages > 1 && (
                  <div className={styles.paginationControls}>
                    <button
                      onClick={() => handleSearch(searchCurrentPage - 1)}
                      disabled={searchCurrentPage <= 1}
                    >
                      &laquo; Prev
                    </button>
                    <span>
                      Page {searchCurrentPage} of {searchTotalPages}
                    </span>
                    <button
                      onClick={() => handleSearch(searchCurrentPage + 1)}
                      disabled={searchCurrentPage >= searchTotalPages}
                    >
                      Next &raquo;
                    </button>
                  </div>
                )}

                {/* We will add Pagination controls here later */}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditWordModal && editingWord && (
          <EditWordModal
            word={editingWord}
            onSave={handleUpdateWord}
            onClose={() => {
              setShowEditWordModal(false);
              setEditingWord(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SyllableConfigScreen;
