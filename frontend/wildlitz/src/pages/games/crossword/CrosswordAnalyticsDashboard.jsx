// src/pages/games/crossword/CrosswordAnalyticsDashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import styles from '../../../styles/games/crossword/CrosswordAnalyticsDashboard.module.css';
import crosswordAnalyticsService from '../../../services/crosswordAnalyticsService'; // ✅ THIS WAS MISSING!
import { useAuth } from '../../../context/AuthContext';

const CrosswordAnalyticsDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth(); // ✅ ADD THIS LINE
  const [analytics, setAnalytics] = useState(null);
  const [gameSessions, setGameSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [user]); // ✅ ADD user as dependency

  const fetchAnalytics = async (retryCount = 0) => {
  try {
    setLoading(true);
    
    const userEmail = user?.email 
      ? user.email 
      : 'guest@wildlitz.com';
    
    console.log('📊 Fetching analytics for user:', userEmail, `(attempt ${retryCount + 1})`);
    
    // Add cache-busting parameter to prevent cached empty responses
    const timestamp = Date.now();
    const response = await fetch(
      `http://127.0.0.1:8000/api/sentence_formation/story/analytics/?user_email=${userEmail}&days=30&_t=${timestamp}`
    );
    const data = await response.json();
    
    console.log('📥 Analytics response:', data);
    
    if (data.success) {
      const sessionCount = data.analytics.recent_sessions?.length || 0;
      console.log('✅ Analytics loaded successfully');
      console.log('📊 Sessions found:', sessionCount);
      
      // If no sessions found and we haven't retried much, try again
      if (sessionCount === 0 && retryCount < 2) {
        console.log('⏳ No sessions found, retrying in 1 second...');
        setTimeout(() => {
          fetchAnalytics(retryCount + 1);
        }, 1000);
        return;
      }
      
      setAnalytics(data.analytics.summary);
      setGameSessions(data.analytics.recent_sessions || []);
    } else {
      console.log('⚠️ No analytics data yet');
      setError('No data available');
    }
  } catch (err) {
    console.error('❌ Analytics fetch error:', err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchAnalytics();
}, [user]);


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
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '20px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '20px'
          }}>📊</div>
          <p style={{ fontSize: '1.2rem', color: '#666' }}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics || gameSessions.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}>
        <motion.button
          onClick={() => navigate('/home')}
          style={{
            background: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 24px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '1rem',
            fontWeight: 600,
            marginBottom: '20px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
          }}
          whileHover={{ scale: 1.05, x: -5 }}
          whileTap={{ scale: 0.95 }}
        >
          <span>←</span>
          <span>Back to Games</span>
        </motion.button>

        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '60px 40px',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}>
          <span style={{ fontSize: '5rem' }}>📊</span>
          <h3 style={{ fontSize: '1.8rem', margin: '20px 0 10px', color: '#333' }}>No Data Yet</h3>
          <p style={{ color: '#666', fontSize: '1.1rem' }}>Analytics will appear after students start playing!</p>
          <button
            onClick={fetchAnalytics}
            style={{
              marginTop: '20px',
              padding: '12px 30px',
              background: '#9c27b0',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600
            }}
          >
            Try Again
          </button>
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
      {/* Back Button */}
      <motion.button
        onClick={() => navigate('/home')}
        style={{
          background: 'white',
          border: 'none',
          borderRadius: '12px',
          padding: '12px 24px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '1rem',
          fontWeight: 600,
          marginBottom: '20px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}
        whileHover={{ scale: 1.05, x: -5 }}
        whileTap={{ scale: 0.95 }}
      >
        <span>←</span>
        <span>Back to Games</span>
      </motion.button>

      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '30px',
        color: 'white'
      }}>
        <h2 style={{
          fontSize: '2.5rem',
          fontWeight: 700,
          margin: '0 0 10px 0'
        }}>
          📊 Classroom Analytics
        </h2>
        <p style={{
          fontSize: '1.1rem',
          opacity: 0.9
        }}>
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
        <motion.div
          whileHover={{ scale: 1.05 }}
          style={{
            background: 'white',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}
        >
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
            <h3 style={{
              fontSize: '2rem',
              fontWeight: 700,
              margin: '0 0 5px 0',
              color: '#333'
            }}>
              {analytics?.total_sessions || 0}
            </h3>
            <p style={{
              fontSize: '0.9rem',
              color: '#666',
              margin: 0,
              textTransform: 'uppercase',
              fontWeight: 500
            }}>
              Games Played
            </p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          style={{
            background: 'white',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}
        >
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
            <h3 style={{
              fontSize: '2rem',
              fontWeight: 700,
              margin: '0 0 5px 0',
              color: '#333'
            }}>
              {analytics?.total_words_solved || 0}
            </h3>
            <p style={{
              fontSize: '0.9rem',
              color: '#666',
              margin: 0,
              textTransform: 'uppercase',
              fontWeight: 500
            }}>
              Words Solved
            </p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          style={{
            background: 'white',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}
        >
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
            <h3 style={{
              fontSize: '2rem',
              fontWeight: 700,
              margin: '0 0 5px 0',
              color: '#333'
            }}>
              {analytics?.total_episodes_completed || 0}
            </h3>
            <p style={{
              fontSize: '0.9rem',
              color: '#666',
              margin: 0,
              textTransform: 'uppercase',
              fontWeight: 500
            }}>
              Episodes Completed
            </p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          style={{
            background: 'white',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}
        >
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
            <h3 style={{
              fontSize: '2rem',
              fontWeight: 700,
              margin: '0 0 5px 0',
              color: '#333'
            }}>
              {formatDuration(analytics?.avg_session_duration_seconds || 0)}
            </h3>
            <p style={{
              fontSize: '0.9rem',
              color: '#666',
              margin: 0,
              textTransform: 'uppercase',
              fontWeight: 500
            }}>
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
          margin: '0 0 25px 0',
          textAlign: 'center',
          paddingBottom: '15px',
          borderBottom: '3px solid #f0f0f0'
        }}>
          🎯 Game Sessions
        </h3>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {gameSessions.map((session, index) => (
            <motion.div
              key={session.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              style={{
                background: 'linear-gradient(to right, #f9f9f9, #ffffff)',
                borderRadius: '15px',
                padding: '25px',
                boxShadow: '0 3px 10px rgba(0,0,0,0.08)',
                borderLeft: '5px solid #9c27b0'
              }}
            >
              {/* Session Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                marginBottom: '15px',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    color: '#333',
                    margin: '0 0 5px 0'
                  }}>
                    {session.story_title || 'Untitled Story'}
                  </h4>
                  <div style={{
                    display: 'flex',
                    gap: '15px',
                    flexWrap: 'wrap',
                    marginTop: '8px'
                  }}>
                    <span style={{
                      background: '#e3f2fd',
                      color: '#1976d2',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: 600
                    }}>
                      {session.theme || 'Theme'}
                    </span>
                    <span style={{
                      background: '#f3e5f5',
                      color: '#7b1fa2',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: 600
                    }}>
                      {session.episodes_completed || 0}/{session.episode_count || 0} Episodes
                    </span>
                  </div>
                </div>
                
                <div style={{
                  textAlign: 'right',
                  minWidth: '200px'
                }}>
                  <div style={{
                    fontSize: '0.9rem',
                    color: '#666',
                    marginBottom: '5px'
                  }}>
                    🕐 {formatDate(session.created_at)}
                  </div>
                  {session.is_completed && (
                    <span style={{
                      background: '#4caf50',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: 600
                    }}>
                      ✓ Completed
                    </span>
                  )}
                </div>
              </div>

              {/* Session Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '15px',
                padding: '15px',
                background: '#fafafa',
                borderRadius: '10px',
                marginTop: '15px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: '#9c27b0'
                  }}>
                    {session.total_words_solved || 0}
                  </div>
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#666',
                    marginTop: '5px'
                  }}>
                    Words Solved
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: '#1976d2'
                  }}>
                    {formatDuration(session.total_duration_seconds || 0)}
                  </div>
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#666',
                    marginTop: '5px'
                  }}>
                    Time Played
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: '#ff9800'
                  }}>
                    {session.total_hints_used || 0}
                  </div>
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#666',
                    marginTop: '5px'
                  }}>
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
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#666',
                    marginTop: '5px'
                  }}>
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