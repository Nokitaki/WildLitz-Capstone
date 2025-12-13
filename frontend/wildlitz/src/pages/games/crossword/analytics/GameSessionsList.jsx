// GameSessionsList.jsx - COMPLETE VERSION WITH ALL FEATURES
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS } from '../../../../config/api';
import styles from '../../../../styles/games/crossword/analytics/GameSessionsList.module.css';

// Episode Filter Component
const EpisodeFilter = ({ episodes, selectedEpisode, onEpisodeChange }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '20px',
      padding: '16px',
      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
      borderRadius: '12px',
      border: '2px solid #e2e8f0'
    }}>
      <span style={{ fontWeight: '600', color: '#2d3748', fontSize: '14px' }}>
        📚 Filter by Episode:
      </span>
      <select 
        value={selectedEpisode}
        onChange={(e) => onEpisodeChange(e.target.value)}
        style={{
          padding: '8px 16px',
          borderRadius: '8px',
          border: '2px solid #e2e8f0',
          background: 'white',
          color: '#2d3748',
          fontWeight: '600',
          cursor: 'pointer',
          fontSize: '14px',
          minWidth: '150px'
        }}
      >
        <option value="all">📚 All Episodes</option>
        {episodes.map(ep => (
          <option key={ep} value={ep}>📚 Episode {ep}</option>
        ))}
      </select>
      
      {selectedEpisode !== 'all' && (
        <button
          onClick={() => onEpisodeChange('all')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: '#e2e8f0',
            color: '#64748b',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          Clear Filter
        </button>
      )}
    </div>
  );
};

// Word Performance Filters Component
const WordPerformanceFilters = ({ onFilterChange, onSortChange, activeFilter, sortBy }) => {
  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap',
      marginBottom: '20px',
      padding: '16px',
      background: 'rgba(102, 126, 234, 0.05)',
      borderRadius: '12px',
      border: '2px solid #e2e8f0'
    }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
        <button onClick={() => onFilterChange('all')} style={{
          padding: '8px 16px',
          borderRadius: '8px',
          border: 'none',
          background: activeFilter === 'all' ? '#667eea' : '#e2e8f0',
          color: activeFilter === 'all' ? 'white' : '#64748b',
          fontWeight: '600',
          cursor: 'pointer',
          fontSize: '13px'
        }}>
          📚 All Words
        </button>
        <button onClick={() => onFilterChange('hints')} style={{
          padding: '8px 16px',
          borderRadius: '8px',
          border: 'none',
          background: activeFilter === 'hints' ? '#f59e0b' : '#e2e8f0',
          color: activeFilter === 'hints' ? 'white' : '#64748b',
          fontWeight: '600',
          cursor: 'pointer',
          fontSize: '13px'
        }}>
          💡 With Hints
        </button>
        <button onClick={() => onFilterChange('slow')} style={{
          padding: '8px 16px',
          borderRadius: '8px',
          border: 'none',
          background: activeFilter === 'slow' ? '#4299e1' : '#e2e8f0',
          color: activeFilter === 'slow' ? 'white' : '#64748b',
          fontWeight: '600',
          cursor: 'pointer',
          fontSize: '13px'
        }}>
          ⏱️ Slow (&gt;15s)
        </button>
        <button onClick={() => onFilterChange('fast')} style={{
          padding: '8px 16px',
          borderRadius: '8px',
          border: 'none',
          background: activeFilter === 'fast' ? '#48bb78' : '#e2e8f0',
          color: activeFilter === 'fast' ? 'white' : '#64748b',
          fontWeight: '600',
          cursor: 'pointer',
          fontSize: '13px'
        }}>
          ⚡ Fast (&lt;5s)
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <select value={sortBy} onChange={(e) => onSortChange(e.target.value)} style={{
          padding: '8px 16px',
          borderRadius: '8px',
          border: '2px solid #e2e8f0',
          background: 'white',
          color: '#64748b',
          fontWeight: '600',
          cursor: 'pointer',
          fontSize: '13px'
        }}>
          <option value="episode">📚 Group by Episode</option>
          <option value="time-asc">⏱️ Time: Low → High</option>
          <option value="time-desc">⏱️ Time: High → Low</option>
          <option value="hints-asc">💡 Hints: Low → High</option>
          <option value="hints-desc">💡 Hints: High → Low</option>
          <option value="alphabetical">🔤 Alphabetical</option>
        </select>
      </div>
    </div>
  );
};

// Main Component
const GameSessionsList = ({ gameSessions }) => {
  const [expandedSession, setExpandedSession] = useState(null);
  const [showWordPerformance, setShowWordPerformance] = useState({});
  const [sessionWordPerformance, setSessionWordPerformance] = useState({});
  const [loadingWordPerf, setLoadingWordPerf] = useState({});
  const [selectedEpisodeFilter, setSelectedEpisodeFilter] = useState({});
  const [wordFilterMode, setWordFilterMode] = useState({});
  const [sortSettings, setSortSettings] = useState({});

  const toggleSessionExpansion = async (sessionId) => {
    const isExpanding = expandedSession !== sessionId;
    setExpandedSession(isExpanding ? sessionId : null);
    
    if (isExpanding && !sessionWordPerformance[sessionId]) {
      await fetchWordPerformance(sessionId);
    }
  };

  const fetchWordPerformance = async (sessionId) => {
    if (loadingWordPerf[sessionId] || sessionWordPerformance[sessionId]) return;
    
    setLoadingWordPerf(prev => ({ ...prev, [sessionId]: true }));
    try {
      console.log('🔍 Fetching word performance for session:', sessionId);
      const response = await fetch(`${API_ENDPOINTS.SENTENCE_FORMATION}/story/session/${sessionId}/`);
      const data = await response.json();
      
      console.log('📊 Word performance response:', data);
      
      if (data.success && data.word_stats && data.word_stats.length > 0) {
        setSessionWordPerformance(prev => ({
          ...prev,
          [sessionId]: data.word_stats
        }));
        console.log('✅ Loaded', data.word_stats.length, 'words');
      } else {
        console.warn('⚠️ No word stats found for session');
      }
    } catch (error) {
      console.error('❌ Error fetching word performance:', error);
    } finally {
      setLoadingWordPerf(prev => ({ ...prev, [sessionId]: false }));
    }
  };

  const toggleWordPerformance = (sessionId, e) => {
    e.stopPropagation();
    setShowWordPerformance(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
  };

  const getSessionEpisodes = (sessionId) => {
    const words = sessionWordPerformance[sessionId] || [];
    const episodes = [...new Set(words.map(w => w.episode_number || 1))].sort((a, b) => a - b);
    return episodes;
  };

  const getFilteredAndSortedWords = (sessionId) => {
    const allWords = sessionWordPerformance[sessionId] || [];
    if (allWords.length === 0) return [];
    
    const episodeFilter = selectedEpisodeFilter[sessionId];
    let filtered = allWords;
    
    if (episodeFilter && episodeFilter !== 'all') {
      filtered = allWords.filter(w => (w.episode_number || 1) === Number(episodeFilter));
    }
    
    const filterMode = wordFilterMode[sessionId] || 'all';
    switch (filterMode) {
      case 'hints':
        filtered = filtered.filter(w => (w.hints_used || 0) > 0);
        break;
      case 'slow':
        filtered = filtered.filter(w => (w.time_spent || 0) > 10);
        break;
      case 'fast':
        filtered = filtered.filter(w => (w.time_spent || 0) < 5);
        break;
      default:
        break;
    }
    
    const sort = sortSettings[sessionId] || 'episode';
    if (sort === 'time-asc') {
      filtered.sort((a, b) => (a.time_spent || 0) - (b.time_spent || 0));
    } else if (sort === 'time-desc') {
      filtered.sort((a, b) => (b.time_spent || 0) - (a.time_spent || 0));
    } else if (sort === 'hints-asc') {
      filtered.sort((a, b) => (a.hints_used || 0) - (b.hints_used || 0));
    } else if (sort === 'hints-desc') {
      filtered.sort((a, b) => (b.hints_used || 0) - (a.hints_used || 0));
    } else if (sort === 'alphabetical') {
      filtered.sort((a, b) => (a.word || '').localeCompare(b.word || ''));
    } else if (sort === 'episode') {
      filtered.sort((a, b) => (a.episode_number || 0) - (b.episode_number || 0));
    }
    
    return filtered;
  };

  const getWordsByEpisode = (sessionId) => {
    const words = getFilteredAndSortedWords(sessionId);
    const grouped = words.reduce((groups, word) => {
      const episode = word.episode_number || 1;
      if (!groups[episode]) groups[episode] = [];
      groups[episode].push(word);
      return groups;
    }, {});
    
    return Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b));
  };

  const getEpisodeStats = (sessionId, episodeNumber) => {
    const words = sessionWordPerformance[sessionId] || [];
    const episodeWords = words.filter(w => (w.episode_number || 1) === episodeNumber);
    
    if (episodeWords.length === 0) return { avgTime: 0, totalHints: 0 };
    
    const totalTime = episodeWords.reduce((sum, w) => sum + (w.time_spent || 0), 0);
    const totalHints = episodeWords.reduce((sum, w) => sum + (w.hints_used || 0), 0);
    
    return {
      avgTime: (totalTime / episodeWords.length).toFixed(1),
      totalHints: totalHints
    };
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
        <span className={styles.sessionCount}>{gameSessions.length} session{gameSessions.length !== 1 ? 's' : ''}</span>
      </div>

      <div className={styles.sessionsList}>
        {gameSessions.map((session, idx) => {
          const sessionId = session.session_id || session.id || `session-${idx}`;
          const isExpanded = expandedSession === sessionId;
          const isCompleted = session.is_completed || session.completion_percentage === 100;
          const wordPerfData = sessionWordPerformance[sessionId] || [];
          const filteredWords = getFilteredAndSortedWords(sessionId);
          const wordsByEpisode = getWordsByEpisode(sessionId);
          const sessionEpisodes = getSessionEpisodes(sessionId);
          const shouldGroupByEpisode = (sortSettings[sessionId] || 'episode') === 'episode';
          
          // DEBUG: Log session data
          console.log('🎮 Session data:', {
            sessionId,
            accuracy: session.accuracy_percentage,
            hints: session.total_hints_used,
            time: session.total_duration_seconds
          });
          
          return (
            <motion.div
              key={sessionId}
              className={`${styles.sessionCard} ${isExpanded ? styles.expanded : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ scale: 1.01 }}
            >
              <div className={styles.sessionHeader} onClick={() => toggleSessionExpansion(sessionId)}>
                <div className={styles.sessionInfo}>
                  <div className={styles.sessionTitle}>
                    <div className={styles.titleLeft}>
                      <span className={styles.storyName}>{session.story_title || 'Untitled Story'}</span>
                    </div>
                    <div className={styles.titleRight}>
                      <span className={styles.timestamp}>
                        <span>🕒</span>
                        {formatDate(session.created_at)}
                      </span>
                      <span className={`${styles.statusBadge} ${isCompleted ? styles.statusCompleted : styles.statusIncomplete}`}>
                        {isCompleted ? '✅ Completed' : '⭕ Incomplete'}
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
                        📚 {session.episodes_completed || 0}/{session.episode_count} Episode{session.episode_count !== 1 ? 's' : ''}
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
                </div>
              </div>

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
                      
                      {(session.total_words_solved > 0 || session.total_duration_seconds > 0) && (
                        <div className={styles.performanceStats}>
                          <div className={styles.statCard}>
                            <div className={styles.statIcon}>🎯</div>
                            <div className={styles.statValue}>
                              {Math.round(session.accuracy_percentage || 0)}%
                            </div>
                            <div className={styles.statLabel}>Accuracy</div>
                          </div>
                          
                          <div className={styles.statCard}>
                            <div className={styles.statIcon}>⏱️</div>
                            <div className={styles.statValue}>
                              {formatDuration(session.total_duration_seconds || 0)}
                            </div>
                            <div className={styles.statLabel}>Time Played</div>
                          </div>
                          
                          <div className={styles.statCard}>
                            <div className={styles.statIcon}>💡</div>
                            <div className={styles.statValue}>
                              {session.total_hints_used || 0}
                            </div>
                            <div className={styles.statLabel}>Hints Used</div>
                          </div>
                          
                          <div className={styles.statCard}>
                            <div className={styles.statIcon}>📈</div>
                            <div className={styles.statValue}>
                              {session.completion_percentage || 0}%
                            </div>
                            <div className={styles.statLabel}>Completion</div>
                          </div>
                        </div>
                      )}

                      <div className={styles.vocabularySection}>
                        <h5 className={styles.vocabularyHeader}>📖 Vocabulary Words</h5>
                        {session.vocabulary_words_learned && session.vocabulary_words_learned.length > 0 ? (
                          <div className={styles.vocabularyGrid}>
                            {session.vocabulary_words_learned.map((word, wordIdx) => (
                              <motion.div
                                key={wordIdx}
                                className={styles.vocabularyWord}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: wordIdx * 0.05 }}
                                whileHover={{ scale: 1.1 }}
                              >
                                {word}
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className={styles.emptyVocabulary}>
                            <div className={styles.emptyVocabularyIcon}>📚</div>
                            <p className={styles.emptyVocabularyText}>No vocabulary words recorded</p>
                          </div>
                        )}
                      </div>

                      javascript// In GameSessionsList.jsx - Replace the word performance section

{/* Word-by-Word Performance - HORIZONTAL CARDS */}
<div className={styles.wordPerformanceSection}>
  <div className={styles.wordPerformanceHeader} onClick={(e) => toggleWordPerformance(sessionId, e)}>
    <h5 className={styles.wordPerformanceTitle}>
      📊 Word-by-Word Performance
      {wordPerfData.length > 0 && (
        <span className={styles.wordCount}>({filteredWords.length} of {wordPerfData.length} words)</span>
      )}
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
        {loadingWordPerf[sessionId] ? (
          <div className={styles.loadingWordPerf}>
            <div className={styles.spinner}></div>
            <p>Loading word performance...</p>
          </div>
        ) : wordPerfData.length > 0 ? (
          <>
            {/* Filters */}
            {sessionEpisodes.length > 1 && (
              <EpisodeFilter
                episodes={sessionEpisodes}
                selectedEpisode={selectedEpisodeFilter[sessionId] || 'all'}
                onEpisodeChange={(episode) => {
                  setSelectedEpisodeFilter(prev => ({ ...prev, [sessionId]: episode }));
                }}
              />
            )}

            <WordPerformanceFilters
              activeFilter={wordFilterMode[sessionId] || 'all'}
              sortBy={sortSettings[sessionId] || 'episode'}
              onFilterChange={(filter) => {
                setWordFilterMode(prev => ({ ...prev, [sessionId]: filter }));
              }}
              onSortChange={(sort) => {
                setSortSettings(prev => ({ ...prev, [sessionId]: sort }));
              }}
            />

            {/* ✅ NEW: Horizontal Scrollable Cards */}
            <div className={styles.wordCardsContainer}>
              <div className={styles.wordCardsScroll}>
                {filteredWords.map((wordData, wordIdx) => (
                  <motion.div
                    key={wordIdx}
                    className={styles.wordPerformanceCard}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: wordIdx * 0.03 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                  >
                    {/* Word Name */}
                    <div className={styles.cardWordName}>
                      {wordData.word || 'Unknown'}
                    </div>

                    {/* Stats Grid */}
                    <div className={styles.cardStatsGrid}>
                      {/* Time */}
                      <div className={styles.cardStat}>
                        <div className={styles.cardStatIcon}>⏱️</div>
                        <div className={styles.cardStatValue} style={{
                          color: wordData.time_spent > 10 ? '#ef4444' : 
                                 wordData.time_spent > 5 ? '#f59e0b' : '#10b981'
                        }}>
                          {wordData.time_spent || 0}s
                        </div>
                        <div className={styles.cardStatLabel}>Time</div>
                      </div>

                      {/* Hints */}
                      <div className={styles.cardStat}>
                        <div className={styles.cardStatIcon}>💡</div>
                        <div className={styles.cardStatValue} style={{
                          color: wordData.hints_used > 2 ? '#ef4444' : 
                                 wordData.hints_used > 0 ? '#f59e0b' : '#10b981'
                        }}>
                          {wordData.hints_used || 0}
                        </div>
                        <div className={styles.cardStatLabel}>Hints</div>
                      </div>

                      {/* Episode */}
                      <div className={styles.cardStat}>
                        <div className={styles.cardStatIcon}>📚</div>
                        <div className={styles.cardStatValue} style={{ color: '#667eea' }}>
                          Ep. {wordData.episode_number || 1}
                        </div>
                        <div className={styles.cardStatLabel}>Episode</div>
                      </div>
                    </div>

                    {/* Performance Badge */}
                    <div className={styles.cardPerformanceBadge} style={{
                      background: wordData.hints_used === 0 && wordData.time_spent < 5 
                        ? 'linear-gradient(135deg, #10b981, #34d399)'
                        : wordData.hints_used > 2 || wordData.time_spent > 15
                        ? 'linear-gradient(135deg, #ef4444, #f87171)'
                        : 'linear-gradient(135deg, #f59e0b, #fbbf24)'
                    }}>
                      {wordData.hints_used === 0 && wordData.time_spent < 5 ? '🌟 Excellent' : 
                       wordData.hints_used > 2 || wordData.time_spent > 15 ? '📖 Practice More' : 
                       '👍 Good Job'}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Scroll Indicator */}
              {filteredWords.length > 3 && (
                <div className={styles.scrollIndicator}>
                  ← Scroll for more words →
                </div>
              )}
            </div>
          </>
        ) : (
          <div className={styles.emptyWordPerf}>
            <div className={styles.emptyIcon}>📊</div>
            <p>No detailed word performance data available</p>
            <p style={{ fontSize: '0.9rem', color: '#999', marginTop: '10px' }}>
              Word data is logged when you solve words during gameplay
            </p>
          </div>
        )}
      </motion.div>
    )}
  </AnimatePresence>
</div>
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