// src/pages/games/syllable/EditWordModal.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import styles from "../../../styles/games/syllable/SyllableConfigScreen.module.css";

const EditWordModal = ({ word, onSave, onClose }) => {
  // State for editable fields
  const [editedWord, setEditedWord] = useState({
    word: "",
    syllableBreakdown: "",
    syllableCount: 0,
    category: "",
  });

  // State for dismissing validation
  const [validationDismissed, setValidationDismissed] = useState(false);

  // State for validation
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  // State for saving
  const [isSaving, setIsSaving] = useState(false);

  // State for audio recording
  const [isRecordingFullWord, setIsRecordingFullWord] = useState(false);
  const [newFullWordAudio, setNewFullWordAudio] = useState(null);
  const [recordingSyllableIndex, setRecordingSyllableIndex] = useState(null);
  const [newSyllableAudios, setNewSyllableAudios] = useState({});
  const [mediaRecorder, setMediaRecorder] = useState(null);

  // Initialize form with word data when component mounts
  useEffect(() => {
    if (word) {
      setEditedWord({
        word: word.word || "",
        syllableBreakdown: word.syllable_breakdown || "",
        syllableCount: word.syllable_count || 0,
        category: word.category || "",
      });
    }
  }, [word]);

  // Handle syllable breakdown update
  const updateSyllableBreakdown = (value) => {
    const breakdown = value.trim();
    const count = breakdown ? breakdown.split("-").length : 0;

    setEditedWord((prev) => ({
      ...prev,
      syllableBreakdown: breakdown,
      syllableCount: count,
    }));

    // Reset validation when breakdown changes
    setValidationResult(null);
  };

  // AI Validation
  const handleValidateSyllables = async () => {
    if (!editedWord.word || !editedWord.syllableBreakdown) {
      return;
    }

    setIsValidating(true);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/syllabification/validate-syllable-structure/",
        {
          word: editedWord.word,
          syllable_breakdown: editedWord.syllableBreakdown,
        }
      );

      setValidationResult(response.data.validation);
    } catch (error) {
      console.error("Error validating syllables:", error);
      alert("Failed to validate syllables. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  // Auto-validate when both word and syllable breakdown are present
  useEffect(() => {
    const timer = setTimeout(() => {
      if (
        editedWord.word.trim() &&
        editedWord.syllableBreakdown.trim() &&
        editedWord.syllableCount > 0
      ) {
        handleValidateSyllables();
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [editedWord.word, editedWord.syllableBreakdown]);

  // Audio recording functions
  const startRecording = async (type, syllableIndex = null) => {
    try {
      // Request microphone with noise suppression
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
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
          setNewFullWordAudio({ blob: audioBlob, url: audioUrl });
          setIsRecordingFullWord(false);
        } else if (type === "syllable" && syllableIndex !== null) {
          setNewSyllableAudios((prev) => ({
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

  const deleteNewAudio = (type, syllableIndex = null) => {
    if (type === "fullWord") {
      if (newFullWordAudio?.url) {
        URL.revokeObjectURL(newFullWordAudio.url);
      }
      setNewFullWordAudio(null);
    } else if (type === "syllable" && syllableIndex !== null) {
      if (newSyllableAudios[syllableIndex]?.url) {
        URL.revokeObjectURL(newSyllableAudios[syllableIndex].url);
      }
      setNewSyllableAudios((prev) => {
        const updated = { ...prev };
        delete updated[syllableIndex];
        return updated;
      });
    }
  };

  // Handle save
  const handleSave = () => {
    // ✅ CHANGED: Allow saving if validation is dismissed
    if (!validationResult && !validationDismissed) {
      alert(
        "Please wait for syllable validation to complete, or dismiss it to proceed manually"
      );
      return;
    }

    // Pass edited data and new audio to parent
    onSave({
      ...editedWord,
      newFullWordAudio: newFullWordAudio,
      newSyllableAudios: newSyllableAudios,
    });
  };

  // Handle close with unsaved changes warning
  const handleClose = () => {
    // Check if there are unsaved changes
    const hasTextChanges =
      editedWord.word !== word?.word ||
      editedWord.syllableBreakdown !== word?.syllable_breakdown ||
      editedWord.category !== word?.category;

    const hasNewAudio =
      newFullWordAudio !== null || Object.keys(newSyllableAudios).length > 0;

    const hasUnsavedChanges = hasTextChanges || hasNewAudio;

    // If there are unsaved changes, ask for confirmation
    if (hasUnsavedChanges) {
      const confirmClose = window.confirm(
        "You have unsaved changes. Are you sure you want to close without saving?"
      );

      if (!confirmClose) {
        return; // Don't close
      }
    }

    // Clean up audio URLs
    if (newFullWordAudio?.url) {
      URL.revokeObjectURL(newFullWordAudio.url);
    }
    Object.values(newSyllableAudios).forEach((audio) => {
      if (audio?.url) {
        URL.revokeObjectURL(audio.url);
      }
    });

    onClose();
  };

  const categories = [
    "Animals",
    "Fruits",
    "Food",
    "Toys",
    "Clothes",
    "School Supplies",
    "Nature",
    "Everyday Words",
    "Everyday Objects", // ← ADD THIS LINE
  ];
  return (
    <div className={styles.modalOverlay}>
      <motion.div
        className={styles.modal}
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
      >
        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <h2>Edit Word in Database</h2>
          <motion.button
            className={styles.closeButton}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleClose}
          >
            ✕
          </motion.button>
        </div>

        <p
          style={{
            margin: "0 1.5rem 1rem",
            paddingTop: "0.5rem",
            fontSize: "0.9rem",
            color: "#666",
          }}
        >
          Verify and edit the word details. You can update spelling, syllable
          breakdown, category, and re-record pronunciations if needed.
        </p>

        {/* Form Content */}
        <div className={styles.wordForm}>
          {/* Current Word Info Display */}
          <div
            style={{
              backgroundColor: "#f0f4ff",
              padding: "1rem",
              borderRadius: "12px",
              marginBottom: "1.5rem",
              border: "2px solid #d0d9ff",
            }}
          >
            <h3
              style={{
                margin: "0 0 0.75rem 0",
                fontSize: "0.95rem",
                color: "#555",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              📋 Current Word Information
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "#666",
                    display: "block",
                  }}
                >
                  Original Word:
                </span>
                <strong style={{ fontSize: "1.1rem", color: "#333" }}>
                  {word?.word}
                </strong>
              </div>
              <div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "#666",
                    display: "block",
                  }}
                >
                  Original Syllables:
                </span>
                <strong style={{ fontSize: "1.1rem", color: "#333" }}>
                  {word?.syllable_breakdown}
                </strong>
              </div>
              <div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "#666",
                    display: "block",
                  }}
                >
                  Category:
                </span>
                <strong style={{ fontSize: "0.9rem", color: "#333" }}>
                  {word?.category}
                </strong>
              </div>
              <div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "#666",
                    display: "block",
                  }}
                >
                  Difficulty:
                </span>
                <strong style={{ fontSize: "0.9rem", color: "#333" }}>
                  {word?.difficulty_level || "N/A"}
                </strong>
              </div>
            </div>

            {/* Image Preview */}
            {word?.image_url && (
              <div style={{ marginTop: "1rem" }}>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "#666",
                    display: "block",
                    marginBottom: "0.5rem",
                  }}
                >
                  Current Image:
                </span>
                <div
                  style={{
                    width: "150px",
                    height: "150px",
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: "2px solid #ddd",
                  }}
                >
                  <img
                    src={word.image_url}
                    alt={word.word}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <hr
            style={{
              border: "none",
              borderTop: "1px solid #eee",
              margin: "1.5rem 0",
            }}
          />

          <h3
            style={{
              margin: "0 0 1rem 0",
              fontSize: "1rem",
              color: "#555",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            ✏️ Edit Word Details
          </h3>

          {/* WORD INPUT */}
          <div className={styles.formGroup}>
            <label htmlFor="edit-word">Word *</label>
            <input
              id="edit-word"
              type="text"
              value={editedWord.word}
              onChange={(e) =>
                setEditedWord({ ...editedWord, word: e.target.value })
              }
              className={styles.wordInput}
            />
          </div>

          {/* SYLLABLE BREAKDOWN INPUT */}
          <div className={styles.formGroup}>
            <label htmlFor="edit-syllable">
              Syllable Breakdown *
              <span className={styles.infoText}>
                (use hyphens: but-ter-fly)
              </span>
            </label>
            <div className={styles.syllableBreakdownGroup}>
              <input
                id="edit-syllable"
                type="text"
                value={editedWord.syllableBreakdown}
                onChange={(e) => updateSyllableBreakdown(e.target.value)}
                className={`${styles.wordInput} ${styles.syllableBreakdownInput}`}
              />
              <div className={styles.syllableCountBadge}>
                <span className={styles.count}>{editedWord.syllableCount}</span>
                <span className={styles.label}>syllables</span>
              </div>
            </div>
          </div>

          {/* AI VALIDATION SECTION */}
          <div className={styles.aiValidationSection}>
            {validationResult && (
              <div
                className={`${styles.validationResult} ${
                  validationResult.is_correct
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
          </div>

          {/* CATEGORY SELECT */}
          <div className={styles.formGroup}>
            <label htmlFor="edit-category">Category</label>
            <select
              id="edit-category"
              value={editedWord.category}
              onChange={(e) =>
                setEditedWord({ ...editedWord, category: e.target.value })
              }
              className={styles.categorySelect}
            >
              <option value="">Select category...</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* AUDIO PLAYBACK & RECORDING SECTION */}
          <div
            style={{
              backgroundColor: "#f0f4ff",
              padding: "1.5rem",
              borderRadius: "12px",
              marginTop: "1.5rem",
              border: "2px solid #d0d9ff",
            }}
          >
            <h3
              style={{
                margin: "0 0 1rem 0",
                fontSize: "1rem",
                color: "#555",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              🎧 Audio Pronunciation
            </h3>

            {/* Full Word Audio */}
            <div className={styles.audioRecordingSection}>
              <div className={styles.audioSectionTitle}>
                <span>🔊</span> Full Word Audio
              </div>

              {/* Show EXISTING audio */}
              {word?.full_word_audio_url && !newFullWordAudio && (
                <div style={{ marginBottom: "0.75rem" }}>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#666",
                      marginBottom: "0.3rem",
                      fontWeight: "bold",
                    }}
                  >
                    Current Recording:
                  </div>
                  <div className={styles.audioPreview}>
                    <audio
                      src={word.full_word_audio_url}
                      controls
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>
              )}

              {/* Show NEW recorded audio */}
              {newFullWordAudio && (
                <div style={{ marginBottom: "0.75rem" }}>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#4caf50",
                      marginBottom: "0.3rem",
                      fontWeight: "bold",
                    }}
                  >
                    ✓ New Recording:
                  </div>
                  <div className={styles.audioPreview}>
                    <audio
                      src={newFullWordAudio.url}
                      controls
                      style={{ flex: 1 }}
                    />
                    <button
                      className={styles.deleteAudioButton}
                      onClick={() => deleteNewAudio("fullWord")}
                      title="Delete new recording"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )}

              {/* Recording Controls */}
              <button
                className={`${styles.recordButton} ${
                  isRecordingFullWord ? styles.recording : ""
                }`}
                onClick={() => {
                  if (isRecordingFullWord) {
                    stopRecording();
                  } else {
                    startRecording("fullWord");
                  }
                }}
                disabled={recordingSyllableIndex !== null}
              >
                <span className={styles.micIcon}>🎤</span>
                {isRecordingFullWord
                  ? "⏹ Stop Recording"
                  : newFullWordAudio
                  ? "🔄 Re-record"
                  : "🎙️ Record New Audio"}
              </button>

              {!word?.full_word_audio_url && !newFullWordAudio && (
                <div
                  style={{
                    padding: "0.5rem",
                    backgroundColor: "#fff3cd",
                    borderRadius: "6px",
                    textAlign: "center",
                    fontSize: "0.75rem",
                    color: "#856404",
                    marginTop: "0.5rem",
                  }}
                >
                  ⚠️ No audio available - record one above
                </div>
              )}
            </div>

            {/* Individual Syllable Audio */}
            <div
              className={styles.audioRecordingSection}
              style={{ marginTop: "1.5rem" }}
            >
              <div className={styles.audioSectionTitle}>
                <span>🎵</span> Individual Syllable Audio
              </div>

              {(() => {
                // Get syllables from the EDITED word (not original)
                const syllables = editedWord.syllableBreakdown
                  .split("-")
                  .filter((s) => s.trim());

                if (syllables.length === 0) {
                  return (
                    <div
                      style={{
                        padding: "0.75rem",
                        backgroundColor: "#f5f5f5",
                        borderRadius: "8px",
                        textAlign: "center",
                        fontSize: "0.85rem",
                        color: "#666",
                      }}
                    >
                      Enter syllable breakdown to record individual syllables
                    </div>
                  );
                }

                return (
                  <div className={styles.syllableAudioGrid}>
                    {syllables.map((syllable, index) => {
                      // Check for existing audio from database
                      const originalSyllableAudios =
                        word?.syllable_audio_urls || [];
                      const hasOriginalAudio = originalSyllableAudios[index];

                      // Check for new recording
                      const hasNewAudio = newSyllableAudios[index];

                      return (
                        <div key={index} className={styles.syllableAudioItem}>
                          <div className={styles.syllableLabel}>{syllable}</div>

                          {/* Show EXISTING audio if no new recording */}
                          {hasOriginalAudio && !hasNewAudio && (
                            <div style={{ marginBottom: "0.5rem" }}>
                              <div
                                style={{
                                  fontSize: "0.7rem",
                                  color: "#666",
                                  marginBottom: "0.2rem",
                                }}
                              >
                                Current:
                              </div>
                              <audio
                                src={hasOriginalAudio}
                                controls
                                style={{ width: "100%", height: "28px" }}
                              />
                            </div>
                          )}

                          {/* Show NEW recording */}
                          {hasNewAudio && (
                            <div style={{ marginBottom: "0.5rem" }}>
                              <div
                                style={{
                                  fontSize: "0.7rem",
                                  color: "#4caf50",
                                  marginBottom: "0.2rem",
                                  fontWeight: "bold",
                                }}
                              >
                                ✓ New:
                              </div>
                              <div className={styles.audioPreview}>
                                <audio
                                  src={hasNewAudio.url}
                                  controls
                                  style={{ width: "100%", height: "28px" }}
                                />
                                <button
                                  className={styles.deleteAudioButton}
                                  onClick={() =>
                                    deleteNewAudio("syllable", index)
                                  }
                                  style={{ fontSize: "0.8rem" }}
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Recording Button */}
                          <button
                            className={`${styles.recordButton} ${
                              recordingSyllableIndex === index
                                ? styles.recording
                                : ""
                            }`}
                            onClick={() => {
                              if (recordingSyllableIndex === index) {
                                stopRecording();
                              } else {
                                startRecording("syllable", index);
                              }
                            }}
                            disabled={
                              isRecordingFullWord ||
                              (recordingSyllableIndex !== null &&
                                recordingSyllableIndex !== index)
                            }
                            style={{
                              width: "100%",
                              padding: "0.4rem 0.6rem",
                              fontSize: "0.75rem",
                            }}
                          >
                            <span className={styles.micIcon}>🎤</span>
                            {recordingSyllableIndex === index
                              ? "⏹ Stop"
                              : hasNewAudio
                              ? "🔄"
                              : "🎙️"}
                          </button>

                          {!hasOriginalAudio && !hasNewAudio && (
                            <div
                              style={{
                                fontSize: "0.65rem",
                                color: "#999",
                                textAlign: "center",
                                marginTop: "0.3rem",
                              }}
                            >
                              No audio
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Info Box */}
            <div
              style={{
                marginTop: "1rem",
                padding: "0.75rem",
                backgroundColor: "#e3f2fd",
                borderRadius: "8px",
                fontSize: "0.8rem",
                color: "#0d47a1",
                display: "flex",
                alignItems: "flex-start",
                gap: "0.5rem",
              }}
            >
              <span style={{ flexShrink: 0 }}>💡</span>
              <span>
                Click the microphone button to record. Recording will
                automatically stop after 5 seconds, or click "Stop" to end
                early. New recordings will replace old ones when you save.
              </span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className={styles.modalActions}>
          <button className={styles.clearButton} onClick={handleClose}>
            Cancel
          </button>
          <button
            className={styles.saveButton}
            onClick={handleSave}
            disabled={
              isSaving ||
              !editedWord.word ||
              !editedWord.syllableBreakdown ||
              (!validationResult && !validationDismissed)
            } // ✅ CHANGED
          >
            {isSaving ? (
              <>
                <span className={styles.spinner}></span>
                Saving...
              </>
            ) : (
              "💾 Save Changes"
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default EditWordModal;
