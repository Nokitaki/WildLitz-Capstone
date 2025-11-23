// GameSessionsList.jsx - ENHANCED VERSION with Word Performance
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../../../styles/games/crossword/analytics/GameSessionsList.module.css';

const GameSessionsList = ({ gameSessions }) => {
  const [expandedSession, setExpandedSession] = useState(null);
  const [showWordPerformance, setShowWordPerformance] = useState({});

  const toggleSessionExpansion = (sessionId) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
  };

  const toggleWordPerformance = (sessionId, e) => {
    e.stopPropagation();
    setShowWordPerformance(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  if (!gameSessions || gameSessions.length === 0) {
    return (
      <div className={styles.sessionsContainer}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>🎮</span>
          <h3 className={styles.sectionTitle}>Game Sessions</h3>
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📊</div>
          <p className={styles.emptyText}>No game sessions yet. Start playing to see your history!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.sessionsContainer}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionIcon}>🎮</span>
        <h3 className={styles.sectionTitle}>Game Sessions</h3>
      </div>

      <div className={styles.sessionsList}>
        {gameSessions.map((session, idx) => {
          const sessionId = session.session_id || session.id || `session-${idx}`;
          const isExpanded = expandedSession === sessionId;
          const isCompleted = session.is_completed || session.completion_percentage === 100;
          
          return (
            <motion.div
              key={sessionId}
              className={`${styles.sessionCard} ${isExpanded ? styles.expanded : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              {/* Clickable Header */}
              <div
                className={styles.sessionHeader}
                onClick={() => toggleSessionExpansion(sessionId)}
              >
                <div className={styles.sessionInfo}>
                  <div className={styles.sessionTitle}>
                    <div className={styles.titleLeft}>
                      <span>{session.story_title || 'Untitled Story'}</span>
                    </div>
                    <div className={styles.titleRight}>
                      <span className={styles.timestamp}>
                        <span>🕐</span>
                        {formatDate(session.created_at)}
                      </span>
                      <span className={`${styles.statusBadge} ${isCompleted ? styles.statusCompleted : styles.statusInProgress}`}>
                        {isCompleted ? '✅ Completed' : '⏸️ In Progress'}
                      </span>
                      <span className={`${styles.expandIcon} ${isExpanded ? styles.rotated : ''}`}>
                        ▼
                      </span>
                    </div>
                  </div>
                  
                  <div className={styles.sessionMeta}>
                    {session.theme && (
                      <span className={`${styles.storyTag} ${styles.themeTag}`}>
                        🌍 {session.theme}
                      </span>
                    )}
                    {session.episode_count && (
                      <span className={`${styles.storyTag} ${styles.episodeTag}`}>
                        📚 {session.episodes_completed || 0}/{session.episode_count} Episodes
                      </span>
                    )}
                    {session.focus_skills && session.focus_skills.length > 0 && (
                      session.focus_skills.slice(0, 2).map((skill, i) => (
                        <span key={i} className={`${styles.storyTag} ${styles.skillTag}`}>
                          🎯 {skill}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Expandable Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    className={styles.sessionDetails}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className={styles.detailsContent}>
                      {/* Story Information */}
                      <div className={styles.detailsHeader}>
                        <h5 className={styles.detailsTitle}>
                          📖 Story Details
                        </h5>
                      </div>

                      <div className={styles.storyTags}>
                        {session.theme && (
                          <span className={`${styles.storyTag} ${styles.themeTag}`}>
                            🎭 {session.theme}
                          </span>
                        )}
                        {session.episode_count && (
                          <span className={`${styles.storyTag} ${styles.episodeTag}`}>
                            📚 {session.episode_count} Episode{session.episode_count > 1 ? 's' : ''}
                          </span>
                        )}
                        {session.focus_skills && session.focus_skills.length > 0 && (
                          session.focus_skills.map((skill, i) => (
                            <span key={i} className={`${styles.storyTag} ${styles.skillTag}`}>
                              🎯 {skill}
                            </span>
                          ))
                        )}
                      </div>

                      {/* Performance Stats */}
                      {(session.total_words_solved > 0 || session.total_duration_seconds > 0) && (
                        <div className={styles.performanceStats}>
                          <div className={styles.statCard}>
                            <div className={styles.statValue}>{session.total_words_solved || 0}</div>
                            <div className={styles.statLabel}>Words Solved</div>
                          </div>
                          <div className={styles.statCard}>
                            <div className={styles.statValue}>{formatDuration(session.total_duration_seconds || 0)}</div>
                            <div className={styles.statLabel}>Time Played</div>
                          </div>
                          <div className={styles.statCard}>
                            <div className={styles.statValue}>{session.total_hints_used || 0}</div>
                            <div className={styles.statLabel}>Hints Used</div>
                          </div>
                          <div className={styles.statCard}>
                            <div className={styles.statValue}>{session.completion_percentage || 0}%</div>
                            <div className={styles.statLabel}>Completion</div>
                          </div>
                        </div>
                      )}

                      {/* Vocabulary Words */}
                      <div className={styles.vocabularySection}>
                        <h5 className={styles.vocabularyHeader}>
                          📖 Vocabulary Words
                        </h5>

                        {session.vocabulary_words_learned && session.vocabulary_words_learned.length > 0 ? (
                          <div className={styles.vocabularyGrid}>
                            {session.vocabulary_words_learned.map((word, wIdx) => (
                              <motion.div
                                key={wIdx}
                                className={styles.vocabularyWord}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: wIdx * 0.05 }}
                                whileHover={{ 
                                  scale: 1.05,
                                  transition: { duration: 0.2 }
                                }}
                              >
                                {word}
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className={styles.emptyVocabulary}>
                            <div className={styles.emptyVocabularyIcon}>🔭</div>
                            <p className={styles.emptyVocabularyText}>No vocabulary words recorded</p>
                          </div>
                        )}
                      </div>

                      {/* Word-by-Word Performance Toggle */}
                      {session.word_performance && session.word_performance.length > 0 && (
                        <div className={styles.wordPerformanceSection}>
                          <div 
                            className={styles.wordPerformanceHeader}
                            onClick={(e) => toggleWordPerformance(sessionId, e)}
                          >
                            <h5 className={styles.wordPerformanceTitle}>
                              📊 Word-by-Word Performance
                            </h5>
                            <span className={`${styles.wordPerformanceToggle} ${showWordPerformance[sessionId] ? styles.rotated : ''}`}>
                              ▼
                            </span>
                          </div>

                          <AnimatePresence>
                            {showWordPerformance[sessionId] && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <div className={styles.wordPerformanceGrid}>
                                  {session.word_performance.map((wordData, idx) => (
                                    <motion.div
                                      key={idx}
                                      className={styles.wordPerformanceCard}
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ delay: idx * 0.05 }}
                                    >
                                      <div className={styles.wordName}>
                                        {wordData.word || wordData.vocabulary_word}
                                      </div>
                                      <div className={styles.wordStats}>
                                        <div className={styles.wordStatBox}>
                                          <div className={styles.wordStatIcon}>⏱️</div>
                                          <div className={`${styles.wordStatValue} ${styles.timeValue}`}>
                                            {wordData.time_spent || wordData.avg_time_seconds || 0}s
                                          </div>
                                          <div className={styles.wordStatLabel}>Time</div>
                                        </div>
                                        <div className={styles.wordStatBox}>
                                          <div className={styles.wordStatIcon}>✅</div>
                                          <div className={`${styles.wordStatValue} ${styles.hintValue}`}>
                                            {wordData.hints_used || wordData.avg_hints || 0}
                                          </div>
                                          <div className={styles.wordStatLabel}>Hints</div>
                                        </div>
                                      </div>
                                      {(wordData.episode_number || wordData.episode) && (
                                        <div className={styles.wordEpisode}>
                                          📚 Ep. {wordData.episode_number || wordData.episode}
                                        </div>
                                      )}
                                    </motion.div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default GameSessionsList;