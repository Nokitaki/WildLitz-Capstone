// Updated CrosswordAnalyticsDashboard.jsx with Back Button Fix and Additional Details

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

const CrosswordAnalyticsDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [gameSessions, setGameSessions] = useState([]);
  const [wordPerformance, setWordPerformance] = useState([]);
  const [expandedSession, setExpandedSession] = useState(null);
  const [sessionActivities, setSessionActivities] = useState({});
  const [loading, setLoading] = useState(true);
  const [showChallengingWords, setShowChallengingWords] = useState(false);
  useEffect(() => {
    fetchAnalytics();
    fetchWordPerformance();
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const userEmail = user?.email || 'guest@wildlitz.com';
      
      const response = await fetch(
        `http://127.0.0.1:8000/api/sentence_formation/story/analytics/?user_email=${userEmail}&days=30`
      );
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.analytics.summary);
        setGameSessions(data.analytics.recent_sessions || []);
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWordPerformance = async () => {
    try {
      const userEmail = user?.email || 'guest@wildlitz.com';
      
      const response = await fetch(
        `http://127.0.0.1:8000/api/sentence_formation/story/word-performance/?user_email=${userEmail}`
      );
      const data = await response.json();
      
      if (data.success) {
        setWordPerformance(data.words || []);
      }
    } catch (err) {
      console.error('Word performance fetch error:', err);
    }
  };

  const fetchSessionActivities = async (sessionId) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/sentence_formation/story/session/${sessionId}/`
      );
      const data = await response.json();
      
      if (data.success) {
        setSessionActivities(prev => ({
          ...prev,
          [sessionId]: data.word_stats || []
        }));
      }
    } catch (err) {
      console.error('Session activities fetch error:', err);
    }
  };

  const toggleSessionExpansion = (sessionId) => {
    if (expandedSession === sessionId) {
      setExpandedSession(null);
    } else {
      setExpandedSession(sessionId);
      if (!sessionActivities[sessionId]) {
        fetchSessionActivities(sessionId);
      }
    }
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

  const getDifficultyColor = (score) => {
    if (score >= 15) return '#f44336'; // Very Hard (red)
    if (score >= 10) return '#ff9800'; // Hard (orange)
    if (score >= 5) return '#ffc107';  // Medium (yellow)
    return '#4caf50'; // Easy (green)
  };

  const getWordLengthBadge = (wordLength) => {
  if (wordLength <= 3) return { text: 'Short', color: '#4caf50' };
  if (wordLength <= 5) return { text: 'Medium', color: '#ffc107' };
  if (wordLength <= 7) return { text: 'Long', color: '#ff9800' };
  return { text: 'Very Long', color: '#f44336' };
};

  const getDifficultyLabel = (score) => {
    if (score >= 15) return '🔥 Very Hard';
    if (score >= 10) return '⚠️ Hard';
    if (score >= 5) return '⚡ Medium';
    return '✅ Easy';
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📊</div>
          <p style={{ fontSize: '1.2rem', color: '#666' }}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      {/* FIXED BACK BUTTON - Now with white background and visible text */}
      <motion.button
        onClick={() => navigate('/home')}
        initial={{
          backgroundColor: '#ffffff',
          color: '#764ba2'
        }}
        style={{
          border: '2px solid #764ba2',
          borderRadius: '12px',
          padding: '14px 28px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '16px',
          fontWeight: 600,
          marginBottom: '20px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
        }}
        whileHover={{ 
          scale: 1.05, 
          x: -5,
          backgroundColor: '#764ba2',
          color: '#ffffff'
        }}
        whileTap={{ scale: 0.95 }}
      >
        <span style={{ fontSize: '20px' }}>←</span>
        <span>Back to Games</span>
      </motion.button>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '30px', color: 'white' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0 0 10px 0' }}>
          📊 Classroom Analytics
        </h2>
        <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
          Track student progress at a glance
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {/* Games Played */}
        <motion.div whileHover={{ scale: 1.05 }} style={{
          background: 'white',
          borderRadius: '15px',
          padding: '25px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem'
          }}>
            🎮
          </div>
          <div>
            <h3 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 5px 0', color: '#333' }}>
              {analytics?.total_sessions || 0}
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#666', margin: 0, textTransform: 'uppercase', fontWeight: 500 }}>
              Games Played
            </p>
          </div>
        </motion.div>

        {/* Words Solved */}
        <motion.div whileHover={{ scale: 1.05 }} style={{
          background: 'white',
          borderRadius: '15px',
          padding: '25px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #f093fb, #f5576c)',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem'
          }}>
            📝
          </div>
          <div>
            <h3 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 5px 0', color: '#333' }}>
              {analytics?.total_words_solved || 0}
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#666', margin: 0, textTransform: 'uppercase', fontWeight: 500 }}>
              Words Solved
            </p>
          </div>
        </motion.div>

        {/* Episodes Completed */}
        <motion.div whileHover={{ scale: 1.05 }} style={{
          background: 'white',
          borderRadius: '15px',
          padding: '25px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem'
          }}>
            📚
          </div>
          <div>
            <h3 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 5px 0', color: '#333' }}>
              {analytics?.total_episodes_completed || 0}
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#666', margin: 0, textTransform: 'uppercase', fontWeight: 500 }}>
              Episodes Completed
            </p>
          </div>
        </motion.div>

        {/* Avg Time */}
        <motion.div whileHover={{ scale: 1.05 }} style={{
          background: 'white',
          borderRadius: '15px',
          padding: '25px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #fa709a, #fee140)',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem'
          }}>
            ⏱️
          </div>
          <div>
            <h3 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 5px 0', color: '#333' }}>
              {formatDuration(analytics?.avg_session_duration_seconds || 0)}
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#666', margin: 0, textTransform: 'uppercase', fontWeight: 500 }}>
              Avg Time/Game
            </p>
          </div>
        </motion.div>
      </div>

      {/* Most Challenging Words Section */}
      {wordPerformance.length > 0 && (
  <div style={{
    background: 'white',
    borderRadius: '20px',
    padding: '30px',
    marginBottom: '30px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
  }}>
    <button
      onClick={() => setShowChallengingWords(!showChallengingWords)}
      style={{
        width: '100%',
        background: 'transparent',
        border: 'none',
        padding: '0',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: showChallengingWords ? '20px' : '0'
      }}
    >
      <div>
        <h3 style={{
          fontSize: '1.8rem',
          fontWeight: 700,
          color: '#333',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          textAlign: 'left'
        }}>
          🎯 Most Challenging Words (Top 10)
        </h3>
        {!showChallengingWords && (
          <p style={{ 
            color: '#666', 
            margin: '8px 0 0 0', 
            fontSize: '0.95rem',
            textAlign: 'left'
          }}>
            Words that required the most time and hints to solve
          </p>
        )}
      </div>
      <span style={{
        fontSize: '1.5rem',
        transform: showChallengingWords ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.3s ease',
        color: '#9c27b0'
      }}>
        ▼
      </span>
    </button>

    <AnimatePresence>
      {showChallengingWords && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          style={{ overflow: 'hidden' }}
        >
          <p style={{ 
            color: '#666', 
            marginBottom: '20px', 
            fontSize: '0.95rem' 
          }}>
            Words that required the most time and hints to solve
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '15px'
          }}>
            {wordPerformance.slice(0, 10).map((wordStat, idx) => {
              const lengthBadge = getWordLengthBadge(wordStat.word_length || wordStat.word.length);
              
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  style={{
                    background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)',
                    borderRadius: '12px',
                    padding: '15px',
                    border: '2px solid #e0e0e0',
                    borderLeft: `4px solid ${getDifficultyColor(wordStat.difficulty_score)}`
                  }}
                >
                  {/* Rank Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '10px',
                    background: idx < 3 ? 
                      (idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : '#CD7F32') : 
                      '#9c27b0',
                    color: 'white',
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}>
                    #{idx + 1}
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      color: '#333',
                      textTransform: 'capitalize'
                    }}>
                      {wordStat.word}
                    </div>
                    <div style={{
                      padding: '2px 8px',
                      background: lengthBadge.color,
                      color: 'white',
                      borderRadius: '10px',
                      fontSize: '0.65rem',
                      fontWeight: 600
                    }}>
                      {wordStat.word.length}L
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5px',
                    fontSize: '0.85rem',
                    color: '#666'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>⏱️ Avg Time:</span>
                      <strong>{wordStat.avg_time}s</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>💡 Avg Hints:</span>
                      <strong>{wordStat.avg_hints}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>🎯 Accuracy:</span>
                      <strong style={{ 
                        color: wordStat.accuracy >= 80 ? '#4caf50' : '#ff9800' 
                      }}>
                        {wordStat.accuracy}%
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>📊 Attempts:</span>
                      <strong>{wordStat.attempts}</strong>
                    </div>
                  </div>

                  <div style={{
                    marginTop: '10px',
                    padding: '6px 12px',
                    background: getDifficultyColor(wordStat.difficulty_score),
                    color: 'white',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textAlign: 'center'
                  }}>
                    {getDifficultyLabel(wordStat.difficulty_score)}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
)}

      {/* Game Sessions */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '30px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
      }}>
        <h3 style={{
          fontSize: '1.8rem',
          fontWeight: 700,
          color: '#333',
          marginBottom: '25px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          🎯 Game Sessions
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {gameSessions.map((session, index) => (
            <motion.div
              key={session.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              style={{
                border: '2px solid #e0e0e0',
                borderRadius: '15px',
                padding: '20px',
                background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)',
                borderLeft: '5px solid #9c27b0'
              }}
            >
              {/* Session Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '15px'
              }}>
                <div>
                  <h4 style={{
                    fontSize: '1.3rem',
                    fontWeight: 700,
                    color: '#333',
                    margin: '0 0 10px 0'
                  }}>
                    {session.story_title || 'Untitled Adventure'}
                  </h4>
                  
                  {/* Theme and Episodes */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{
                      background: '#e3f2fd',
                      color: '#1976d2',
                      padding: '5px 12px',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: 600
                    }}>
                      {session.theme || 'adventure'}
                    </span>
                    <span style={{
                      background: '#f3e5f5',
                      color: '#9c27b0',
                      padding: '5px 12px',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: 600
                    }}>
                      {session.episodes_completed || 0}/{session.episode_count || 0} Episodes
                    </span>
                    
                    {/* NEW: Display Focused Skills */}
                    {session.focus_skills && session.focus_skills.length > 0 && (
                      <span style={{
                        background: '#fff3e0',
                        color: '#f57c00',
                        padding: '5px 12px',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: 600
                      }}>
                        🎯 {session.focus_skills.join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '0.8rem',
                    color: '#666',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    justifyContent: 'flex-end'
                  }}>
                    🕐 {formatDate(session.created_at || session.session_start)}
                  </div>
                  {session.is_completed && (
                    <span style={{
                      background: '#4caf50',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      marginTop: '5px',
                      display: 'inline-block'
                    }}>
                      ✓ Completed
                    </span>
                  )}
                </div>
              </div>

              {/* NEW: Vocabulary Words Used */}
              {session.vocabulary_words_learned && session.vocabulary_words_learned.length > 0 && (
                <div style={{
                  background: '#f5f5f5',
                  borderRadius: '10px',
                  padding: '15px',
                  marginBottom: '15px'
                }}>
                  <h5 style={{
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: '#555',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    📖 Vocabulary Words
                  </h5>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    {session.vocabulary_words_learned.map((word, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: 'white',
                          color: '#333',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          border: '1px solid #ddd'
                        }}
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* NEW: Word-by-Word Performance (Expandable) */}
              <div style={{
                
                background: '#f9f9f9',
                borderRadius: '10px',
                padding: '15px',
                marginBottom: '15px'
              }}>
                <button
                  onClick={() => toggleSessionExpansion(session.id)}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    padding: '0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: '#555',
                    marginBottom: expandedSession === session.id ? '15px' : '0'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📊 Word-by-Word Performance
                  </span>
                  <span style={{
                    fontSize: '1.2rem',
                    transform: expandedSession === session.id ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease'
                  }}>
                    ▼
                  </span>
                </button>

                <AnimatePresence>
  {expandedSession === session.id && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      style={{ overflow: 'hidden' }}
    >
      {/* ✅ NEW CODE STARTS HERE */}
      {sessionActivities[session.id] && sessionActivities[session.id].length > 0 ? (
        <div style={{
          marginTop: '15px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '12px'
        }}>
          {sessionActivities[session.id].map((wordStat, idx) => (
            <div
              key={idx}
              style={{
                background: wordStat.hints_used > 0 ? '#fff3cd' : '#d4edda',
                borderLeft: `4px solid ${wordStat.hints_used > 0 ? '#ffc107' : '#28a745'}`,
                padding: '12px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              {/* Word Title */}
              <div style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: '#333',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {wordStat.word}
              </div>

              {/* Stats Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                fontSize: '0.85rem'
              }}>
                {/* Time Spent */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '8px',
                  background: 'rgba(255,255,255,0.7)',
                  borderRadius: '6px'
                }}>
                  <span style={{ fontSize: '1.3rem' }}>⏱️</span>
                  <span style={{ 
                    fontSize: '1.2rem', 
                    fontWeight: 700,
                    color: '#667eea' 
                  }}>
                    {wordStat.time_spent}s
                  </span>
                  <span style={{ 
                    color: '#666',
                    fontSize: '0.75rem',
                    marginTop: '2px'
                  }}>
                    Time
                  </span>
                </div>

                {/* Hints Used */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '8px',
                  background: wordStat.hints_used > 0 
                    ? 'rgba(255, 193, 7, 0.2)' 
                    : 'rgba(40, 167, 69, 0.2)',
                  borderRadius: '6px',
                  border: wordStat.hints_used > 0 
                    ? '2px solid #ffc107' 
                    : '2px solid #28a745'
                }}>
                  <span style={{ fontSize: '1.3rem' }}>
                    {wordStat.hints_used > 0 ? '💡' : '✅'}
                  </span>
                  <span style={{ 
                    fontSize: '1.4rem', 
                    fontWeight: 900,
                    color: wordStat.hints_used > 0 ? '#ff9800' : '#28a745'
                  }}>
                    {wordStat.hints_used}
                  </span>
                  <span style={{ 
                    color: '#666',
                    fontSize: '0.75rem',
                    marginTop: '2px'
                  }}>
                    {wordStat.hints_used === 1 ? 'Hint' : 'Hints'}
                  </span>
                </div>
              </div>

              {/* Episode Badge */}
              <div style={{
                marginTop: '8px',
                fontSize: '0.7rem',
                color: '#666',
                textAlign: 'center',
                padding: '4px',
                background: 'rgba(0,0,0,0.05)',
                borderRadius: '4px'
              }}>
                📖 Ep. {wordStat.episode_number}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '20px',
          color: '#999',
          fontStyle: 'italic'
        }}>
          {sessionActivities[session.id] ? 'No word data available' : 'Loading word details...'}
        </div>
      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Session Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '15px',
                padding: '15px',
                background: '#fafafa',
                borderRadius: '10px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#9c27b0' }}>
                    {session.total_words_solved || 0}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '5px' }}>
                    Words Solved
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1976d2' }}>
                    {formatDuration(session.total_duration_seconds || 0)}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '5px' }}>
                    Time Played
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ff9800' }}>
                    {session.total_hints_used || 0}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '5px' }}>
                    Hints Used
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: (session.completion_percentage || 0) >= 80 ? '#4caf50' : '#ff5722'
                  }}>
                    {Math.round(session.completion_percentage || 0)}%
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '5px' }}>
                    Completion
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CrosswordAnalyticsDashboard;