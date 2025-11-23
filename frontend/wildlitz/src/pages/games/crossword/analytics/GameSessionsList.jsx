// GameSessionsList.jsx - COMPLETE FIX with Episode Dropdown & Accuracy
// ✅ Fixed ALL Issues:
// - Episode dropdown selector
// - Shows accuracy instead of puzzle words solved
// - Cumulative stats across all episodes
// - Average time per episode in word performance
// - Word performance filters and grouping

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS } from '../../../../config/api';
import styles from '../../../../styles/games/crossword/analytics/GameSessionsList.module.css';

// ✅ Episode Selector Component
const EpisodeSelector = ({ episodes, selectedEpisode, onEpisodeChange }) => {
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
        📚 Select Episode:
      </span>
      <select
        value={selectedEpisode}
        onChange={(e) => onEpisodeChange(e.target.value)}
        style={{
          padding: '10px 16px',
          borderRadius: '8px',
          border: '2px solid #667eea',
          background: 'white',
          color: '#2d3748',
          fontWeight: '600',
          cursor: 'pointer',
          fontSize: '14px',
          minWidth: '150px'
        }}
      >
        <option value="all">All Episodes</option>
        {episodes.map((ep) => (
          <option key={ep} value={ep}>
            Episode {ep}
          </option>
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
            fontSize: '13px',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => e.target.style.background = '#cbd5e1'}
          onMouseLeave={(e) => e.target.style.background = '#e2e8f0'}
        >
          Clear Filter
        </button>
      )}
    </div>
  );
};

// ✅ Word Performance Filters
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
        <button
          onClick={() => onFilterChange('all')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeFilter === 'all' ? '#667eea' : '#e2e8f0',
            color: activeFilter === 'all' ? 'white' : '#64748b',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s',
            fontSize: '13px'
          }}
        >
          All Words
        </button>
        <button
          onClick={() => onFilterChange('hints')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeFilter === 'hints' ? '#ed8936' : '#e2e8f0',
            color: activeFilter === 'hints' ? 'white' : '#64748b',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s',
            fontSize: '13px'
          }}
        >
          💡 With Hints
        </button>
        <button
          onClick={() => onFilterChange('slow')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeFilter === 'slow' ? '#4299e1' : '#e2e8f0',
            color: activeFilter === 'slow' ? 'white' : '#64748b',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s',
            fontSize: '13px'
          }}
        >
          ⏱️ Slow (&gt;10s)
        </button>
        <button
          onClick={() => onFilterChange('fast')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeFilter === 'fast' ? '#48bb78' : '#e2e8f0',
            color: activeFilter === 'fast' ? 'white' : '#64748b',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s',
            fontSize: '13px'
          }}
        >
          ⚡ Fast (&lt;5s)
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '2px solid #e2e8f0',
            background: 'white',
            color: '#64748b',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
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

const GameSessionsList = ({ gameSessions }) => {
  const [expandedSession, setExpandedSession] = useState(null);
  const [showWordPerformance, setShowWordPerformance] = useState({});
  const [sessionWordPerformance, setSessionWordPerformance] = useState({});
  const [loadingWordPerf, setLoadingWordPerf] = useState({});
  const [selectedEpisode, setSelectedEpisode] = useState({});  // ✅ Episode filter per session
  const [filterSettings, setFilterSettings] = useState({});
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
      const response = await fetch(`${API_ENDPOINTS.SENTENCE_FORMATION}/story/session/${sessionId}/`);
      const data = await response.json();
      
      if (data.success && data.word_stats && data.word_stats.length > 0) {
        setSessionWordPerformance(prev => ({
          ...prev,
          [sessionId]: data.word_stats
        }));
      }
    } catch (error) {
      console.error('Error fetching word performance:', error);
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

  // ✅ Get unique episodes for a session
  const getSessionEpisodes = (sessionId) => {
    const words = sessionWordPerformance[sessionId] || [];
    const episodes = [...new Set(words.map(w => w.episode_number || 1))].sort((a, b) => a - b);
    return episodes;
  };

  // ✅ Filter and sort logic with episode filtering
  const getFilteredAndSortedWords = (sessionId) => {
    const words = sessionWordPerformance[sessionId] || [];
    const filter = filterSettings[sessionId] || 'all';
    const sort = sortSettings[sessionId] || 'episode';
    const episodeFilter = selectedEpisode[sessionId] || 'all';

    // Apply episode filter
    let filtered = [...words];
    if (episodeFilter !== 'all') {
      filtered = filtered.filter(w => (w.episode_number || 1) === parseInt(episodeFilter));
    }

    // Apply other filters
    if (filter === 'hints') {
      filtered = filtered.filter(w => (w.hints_used || 0) > 0);
    } else if (filter === 'slow') {
      filtered = filtered.filter(w => (w.time_spent || 0) > 10);
    } else if (filter === 'fast') {
      filtered = filtered.filter(w => (w.time_spent || 0) < 5);
    }

    // Apply sorting
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

  // ✅ Group words by episode
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

  // ✅ Calculate average time per episode
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
          
          return (
            <motion.div
              key={sessionId}
              className={`${styles.sessionCard} ${isExpanded ? styles.expanded : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ scale: 1.01 }}
            >
              <div
                className={styles.sessionHeader}
                onClick={() => toggleSessionExpansion(sessionId)}
              >
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
                      {/* ✅ UPDATED Performance Stats with ACCURACY */}
                      {(session.total_words_solved > 0 || session.total_duration_seconds > 0) && (
                        <div className={styles.performanceStats}>
                          <div className={styles.statCard}>
                            <div className={styles.statIcon}>🎯</div>
                            <div className={styles.statValue}>
                              {session.accuracy_percentage || 0}%
                            </div>
                            <div className={styles.statLabel}>Accuracy</div>
                          </div>
                          
                          <div className={styles.statCard}>
                            <div className={styles.statIcon}>⏱️</div>
                            <div className={styles.statValue}>{formatDuration(session.total_duration_seconds || 0)}</div>
                            <div className={styles.statLabel}>Time Played</div>
                          </div>
                          
                          <div className={styles.statCard}>
                            <div className={styles.statIcon}>💡</div>
                            <div className={styles.statValue}>{session.total_hints_used || 0}</div>
                            <div className={styles.statLabel}>Hints Used</div>
                          </div>
                          
                          <div className={styles.statCard}>
                            <div className={styles.statIcon}>📈</div>
                            <div className={styles.statValue}>{session.completion_percentage || 0}%</div>
                            <div className={styles.statLabel}>Completion</div>
                          </div>
                        </div>
                      )}

                      {/* Word-by-Word Performance with Episode Selector */}
                      <div className={styles.wordPerformanceSection}>
                        <div 
                          className={styles.wordPerformanceHeader}
                          onClick={(e) => toggleWordPerformance(sessionId, e)}
                        >
                          <h5 className={styles.wordPerformanceTitle}>
                            📊 Word-by-Word Performance
                            {wordPerfData.length > 0 && (
                              <span className={styles.wordCount}>
                                ({filteredWords.length} of {wordPerfData.length} words)
                              </span>
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
                                  {/* ✅ EPISODE SELECTOR */}
                                  {sessionEpisodes.length > 1 && (
                                    <EpisodeSelector
                                      episodes={sessionEpisodes}
                                      selectedEpisode={selectedEpisode[sessionId] || 'all'}
                                      onEpisodeChange={(episode) => {
                                        setSelectedEpisode(prev => ({ ...prev, [sessionId]: episode }));
                                      }}
                                    />
                                  )}

                                  {/* Filters */}
                                  <WordPerformanceFilters
                                    activeFilter={filterSettings[sessionId] || 'all'}
                                    sortBy={sortSettings[sessionId] || 'episode'}
                                    onFilterChange={(filter) => {
                                      setFilterSettings(prev => ({ ...prev, [sessionId]: filter }));
                                    }}
                                    onSortChange={(sort) => {
                                      setSortSettings(prev => ({ ...prev, [sessionId]: sort }));
                                    }}
                                  />

                                  {/* Words Display */}
                                  {(sortSettings[sessionId] || 'episode') === 'episode' ? (
                                    // Grouped by episode view
                                    wordsByEpisode.map(([episode, words]) => {
                                      const stats = getEpisodeStats(sessionId, parseInt(episode));
                                      return (
                                        <div key={episode} style={{ marginBottom: '30px' }}>
                                          <div style={{
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            color: 'white',
                                            padding: '16px 20px',
                                            borderRadius: '12px',
                                            fontWeight: '700',
                                            fontSize: '16px',
                                            marginBottom: '16px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            flexWrap: 'wrap',
                                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                                          }}>
                                            <span>📚 Episode {episode}</span>
                                            <span style={{
                                              background: 'rgba(255,255,255,0.2)',
                                              padding: '4px 12px',
                                              borderRadius: '8px',
                                              fontSize: '13px',
                                              backdropFilter: 'blur(10px)'
                                            }}>
                                              {words.length} word{words.length !== 1 ? 's' : ''}
                                            </span>
                                            {/* ✅ AVERAGE TIME PER EPISODE */}
                                            <span style={{
                                              background: 'rgba(255,255,255,0.2)',
                                              padding: '4px 12px',
                                              borderRadius: '8px',
                                              fontSize: '13px',
                                              backdropFilter: 'blur(10px)'
                                            }}>
                                              ⏱️ Avg: {stats.avgTime}s
                                            </span>
                                            <span style={{
                                              marginLeft: 'auto',
                                              background: 'rgba(255,255,255,0.2)',
                                              padding: '4px 12px',
                                              borderRadius: '8px',
                                              fontSize: '13px',
                                              backdropFilter: 'blur(10px)'
                                            }}>
                                              💡 {stats.totalHints} hints
                                            </span>
                                          </div>
                                          <div className={styles.wordPerformanceGrid}>
                                            {words.map((wordData, idx) => (
                                              <motion.div
                                                key={idx}
                                                className={styles.wordPerformanceCard}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: idx * 0.03 }}
                                                whileHover={{ 
                                                  scale: 1.05,
                                                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                                                }}
                                              >
                                                <div className={styles.wordName}>
                                                  {wordData.word || 'Unknown'}
                                                </div>
                                                <div className={styles.wordStats}>
                                                  <div className={styles.wordStatBox}>
                                                    <div className={styles.wordStatIcon}>⏱️</div>
                                                    <div className={`${styles.wordStatValue} ${styles.timeValue}`}>
                                                      {Math.round(wordData.time_spent || 0)}s
                                                    </div>
                                                    <div className={styles.wordStatLabel}>Time</div>
                                                  </div>
                                                  <div className={styles.wordStatBox}>
                                                    <div className={styles.wordStatIcon}>💡</div>
                                                    <div className={`${styles.wordStatValue} ${styles.hintValue}`}>
                                                      {wordData.hints_used || 0}
                                                    </div>
                                                    <div className={styles.wordStatLabel}>Hints</div>
                                                  </div>
                                                </div>
                                                {wordData.is_correct && (
                                                  <div className={styles.correctBadge}>✅</div>
                                                )}
                                              </motion.div>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    })
                                  ) : (
                                    // Non-grouped view
                                    <div className={styles.wordPerformanceGrid}>
                                      {filteredWords.map((wordData, idx) => (
                                        <motion.div
                                          key={idx}
                                          className={styles.wordPerformanceCard}
                                          initial={{ opacity: 0, scale: 0.9 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          transition={{ delay: idx * 0.03 }}
                                          whileHover={{ 
                                            scale: 1.05,
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                                          }}
                                        >
                                          <div className={styles.wordName}>
                                            {wordData.word || 'Unknown'}
                                          </div>
                                          <div className={styles.wordStats}>
                                            <div className={styles.wordStatBox}>
                                              <div className={styles.wordStatIcon}>⏱️</div>
                                              <div className={`${styles.wordStatValue} ${styles.timeValue}`}>
                                                {Math.round(wordData.time_spent || 0)}s
                                              </div>
                                              <div className={styles.wordStatLabel}>Time</div>
                                            </div>
                                            <div className={styles.wordStatBox}>
                                              <div className={styles.wordStatIcon}>💡</div>
                                              <div className={`${styles.wordStatValue} ${styles.hintValue}`}>
                                                {wordData.hints_used || 0}
                                              </div>
                                              <div className={styles.wordStatLabel}>Hints</div>
                                            </div>
                                          </div>
                                          {wordData.episode_number && (
                                            <div className={styles.wordEpisode}>
                                              📚 Episode {wordData.episode_number}
                                            </div>
                                          )}
                                          {wordData.is_correct && (
                                            <div className={styles.correctBadge}>✅</div>
                                          )}
                                        </motion.div>
                                      ))}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className={styles.emptyWordPerf}>
                                  <div className={styles.emptyIcon}>📊</div>
                                  <p>No detailed word performance data available</p>
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