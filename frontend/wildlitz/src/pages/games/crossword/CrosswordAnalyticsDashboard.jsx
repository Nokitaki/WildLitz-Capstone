// Updated CrosswordAnalyticsDashboard.jsx with Back Button Fix and Additional Details

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

const CrosswordAnalyticsDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [gameSessions, setGameSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
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