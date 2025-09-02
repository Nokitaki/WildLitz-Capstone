import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/homepage.css';
import wildLitzLogo from '../../assets/img/wildlitz-logo.png';
import { motion } from 'framer-motion';
import GameTipsModal from '../../components/modals/GameTipsModal';
import AuthModal from '../../components/auth/AuthModal';

// Import the animation components
import VanishingGameAnimation from '../../components/animations/VanishingGameAnimation';
import SoundSafariAnimation from '../../components/animations/SoundSafariAnimation';
import CrosswordAnimation from '../../components/animations/CrosswordAnimation';
import SyllableClappingAnimation from '../../components/animations/SyllableClappingAnimation';

function HomePage() {
  // Force scrolling styles
  useEffect(() => {
    document.body.style.overflow = "auto";
    document.body.style.height = "auto";
    document.documentElement.style.overflow = "auto";
    document.documentElement.style.height = "auto";
    
    return () => {
      document.body.style.overflow = "";
      document.body.style.height = "";
      document.documentElement.style.overflow = "";
      document.documentElement.style.height = "";
    };
  }, []);
  
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  
  // State for managing modal visibility
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  // Add console logs to debug
  console.log('HomePage Debug Info:');
  console.log('- isAuthenticated:', isAuthenticated);
  console.log('- user:', user);
  console.log('- isLoading:', isLoading);
  console.log('- authModalOpen:', authModalOpen);

  // Function to handle game selection
  const handleGameSelect = (game) => {
    console.log('Game selected:', game);
    setSelectedGame(game);
    setModalOpen(true);
  };

  // Function to handle starting the actual game
  const handleStartGame = () => {
    setModalOpen(false);
    
    // Navigate to the appropriate game page based on selection
    switch(selectedGame) {
      case 'syllable-clapping':
        navigate('/games/syllable-clapping');
        break;
      case 'sound-safari':
        navigate('/games/sound-safari');
        break;
      case 'vanishing-game':
        navigate('/games/vanishing-game');
        break;
      case 'crossword-puzzle':
        navigate('/games/crossword-puzzle');
        break;
      default:
        console.log('No game selected');
    }
  };

  // Auth handlers with debug logs
  const handleLoginClick = () => {
    console.log('Login button clicked!');
    setAuthMode('login');
    setAuthModalOpen(true);
    console.log('Auth modal should be open now, authModalOpen:', true);
  };

  const handleSignUpClick = () => {
    console.log('Sign Up button clicked!');
    setAuthMode('register');
    setAuthModalOpen(true);
    console.log('Auth modal should be open now, authModalOpen:', true);
  };

  const handleLogoutClick = async () => {
    console.log('Logout button clicked!');
    try {
      await logout();
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleAuthModalClose = () => {
    console.log('Auth modal closing...');
    setAuthModalOpen(false);
  };

  const handleProfileClick = () => {
    console.log('Profile clicked - navigating to profile page');
    navigate('/profile');
  };

  return (
    <div className="home-container" style={{ overflow: "auto", height: "auto", minHeight: "100vh" }}>
      <header className="navbar">
        <div className="logo-container">
          <img src={wildLitzLogo} alt="WildLitz Logo" className="logo" />
          <h1 className="logo-text">WildLitz</h1>
        </div>
        
        <nav className="navigation">
          <motion.a 
            href="#" 
            className="nav-item active"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="nav-icon">🏠</span>
            Home
          </motion.a>
          <motion.a 
            href="#" 
            className="nav-item"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="nav-icon">📖</span>
            About Us
          </motion.a>
          <motion.a 
            href="#" 
            className="nav-item"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="nav-icon">📞</span>
            Contact
          </motion.a>

          {/* Authentication Section with Debug */}
          {isLoading ? (
            <div className="nav-item auth-loading">
              <span className="nav-icon">⏳</span>
              Loading...
            </div>
          ) : isAuthenticated ? (
            // Logged in state
            <>
              <motion.div 
                className="nav-item user-greeting"
                whileHover={{ scale: 1.05 }}
                onClick={handleProfileClick}
                style={{ cursor: 'pointer' }}
              >
                <span className="nav-icon">👋</span>
                Hi, {user?.first_name || 'Friend'}!
              </motion.div>
              <motion.button 
                className="nav-item logout-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogoutClick}
              >
                <span className="nav-icon">🚪</span>
                Logout
              </motion.button>
            </>
          ) : (
            // Not logged in state - WITH DEBUG
            <>
              <motion.button 
                className="nav-item login-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLoginClick}
                style={{ cursor: 'pointer' }}
              >
                <span className="nav-icon">🔐</span>
                Login
              </motion.button>
              <motion.button 
                className="nav-item signup-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSignUpClick}
                style={{ cursor: 'pointer' }}
              >
                <span className="nav-icon">🌟</span>
                Sign Up
              </motion.button>
            </>
          )}
        </nav>
      </header>

      <section className="main-content">
        <h2 className="section-title">ENGLISH READING</h2>
        <div className="content-card">
          {/* User Progress Section - Show only when authenticated */}
          {isAuthenticated && (
            <motion.div 
              className="user-progress-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="progress-title">
                🎯 Welcome back, {user?.first_name}! Ready to continue learning?
              </h3>
              <div className="progress-stats">
                <div className="stat-item">
                  <span className="stat-icon">📈</span>
                  <span className="stat-label">Progress Tracking Active</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">🏆</span>
                  <span className="stat-label">Achievements Unlocked</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">📊</span>
                  <span className="stat-label">Analytics Available</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Call to Action for Non-Authenticated Users */}
          {!isAuthenticated && (
            <motion.div 
              className="cta-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="cta-title">
                🚀 Want to track your progress and unlock achievements?
              </h3>
              <div className="cta-buttons">
                <motion.button 
                  className="cta-btn primary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSignUpClick}
                >
                  <span className="btn-icon">🌟</span>
                  Create Free Account
                </motion.button>
                <motion.button 
                  className="cta-btn secondary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLoginClick}
                >
                  <span className="btn-icon">🔐</span>
                  Already have an account?
                </motion.button>
              </div>
            </motion.div>
          )}

          <div className="games-container">
            <motion.div 
              className="game-card"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 15px 30px rgba(0,0,0,0.3)"
              }}
              onClick={() => handleGameSelect('syllable-clapping')}
            >
              <SyllableClappingAnimation />
              <div className="game-info">
                <h3>Syllable Clapping Game</h3>
                <p>Syllabification</p>
                <button className="play-button">
                  Play Now
                </button>
              </div>
            </motion.div>

            <motion.div 
              className="game-card"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 15px 30px rgba(0,0,0,0.3)"
              }}
              onClick={() => handleGameSelect('sound-safari')}
            >
              <SoundSafariAnimation />
              <div className="game-info">
                <h3>Sound Safari Game</h3>
                <p>Phoneme Identification</p>
                <button className="play-button">
                  Play Now
                </button>
              </div>
            </motion.div>

            <motion.div 
              className="game-card"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 15px 30px rgba(0,0,0,0.3)"
              }}
              onClick={() => handleGameSelect('vanishing-game')}
            >
              <VanishingGameAnimation />
              <div className="game-info">
                <h3>Vanishing Game</h3>
                <p>Speed Reading</p>
                <button className="play-button">
                  Play Now
                </button>
              </div>
            </motion.div>

            <motion.div 
              className="game-card"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 15px 30px rgba(0,0,0,0.3)"
              }}
              onClick={() => handleGameSelect('crossword-puzzle')}
            >
              <CrosswordAnimation />
              <div className="game-info">
                <h3>Crossword Puzzle</h3>
                <p>Vocabulary Building</p>
                <button className="play-button">
                  Play Now
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Game Tips Modal */}
      <GameTipsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onStartGame={handleStartGame}
        gameType={selectedGame}
      />

      {/* Authentication Modal WITH DEBUG */}
      {console.log('Rendering AuthModal with isOpen:', authModalOpen)}
      <AuthModal
        isOpen={authModalOpen}
        onClose={handleAuthModalClose}
        defaultMode={authMode}
      />
    </div>
  );
}

export default HomePage;