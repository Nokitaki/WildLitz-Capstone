import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/Homepage.module.css';
import wildLitzLogo from '../../assets/img/logo/Wildlitz-logo.png';
import { motion } from 'framer-motion';

import GameTipsModal from '../../components/modals/GameTipsModal';
import AuthModal from '../../components/auth/AuthModal';

import tigerCharacter from '../../assets/img/visuals/tiger-controller.png'; // Make sure path is correct
import gameController from '../../assets/img/visuals/game-controller.png';

function HomePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  useEffect(() => {
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    document.body.style.height = 'auto';
    document.documentElement.style.height = 'auto';
    
    const root = document.getElementById('root');
    if (root) {
      root.style.height = 'auto';
      root.style.overflow = 'visible';
    }
  }, []);

  const handleLoginClick = () => {
    setAuthMode('login');
    setAuthModalOpen(true);
  };

  const handleSignUpClick = () => {
    setAuthMode('register');
    setAuthModalOpen(true);
  };

  const handleLogoutClick = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleAuthModalClose = () => {
    setAuthModalOpen(false);
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <div className={styles.container}>
      
      {/* --- Always-Floating Auth Buttons --- */}
      <div className={`${styles.authSection} ${styles.floatingAuth}`}>
        {isLoading ? (
          <div className={styles.loading}>Loading...</div>
        ) : isAuthenticated ? (
          <>
            <button onClick={handleProfileClick} className={styles.loginBtn}>
              Hi, {user?.first_name || 'Friend'}!
            </button>
            <button onClick={handleLogoutClick} className={styles.registerBtn}>
              Logout
            </button>
          </>
        ) : (
          <>
            <button onClick={handleLoginClick} className={styles.loginBtn}>
              Login
            </button>
            <button onClick={handleSignUpClick} className={styles.registerBtn}>
              Register
            </button>
          </>
        )}
      </div>

      <section className={styles.upperBody}>
              
        <header className={styles.header}>
          <div className={styles.logoContainer}>
            <img 
              src={wildLitzLogo} 
              alt="WildLitz Logo" 
              className={styles.logo} 
            />
            <h1 className={styles.logoText}>Wildlitz</h1>
          </div>
          
          <nav className={styles.nav}>
            <a href="#" className={styles.navLink}>Home</a>
            <a href="#about" className={styles.navLink}>About Us</a>
          </nav>
          
          {/* The third grid column is now an empty spacer */}
        </header>

        <section className={styles.heroSection}>
          <div className={styles.heroContent}>
            {/* --- Hero Images --- */}
            <img src={tigerCharacter} alt="Tiger Character" className={styles.tigerCharacter} />
            
            <div className={styles.heroText}>
              {/* --- Hero Title Text --- */}
              <h2 className={styles.heroTitle}>
                LEARN TO READ BY <br /> PLAYING GAMES
              </h2>
            </div>
            
            <img src={gameController} alt="Game Controller" className={styles.gameController} />
          </div>
        </section>

      </section>

      <section className={styles.midBody}></section>
      <section className={styles.lowerBody}></section>
      <section className={styles.bottomBodyFooter}></section>

      <GameTipsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onStartGame={() => {}}
        gameType={selectedGame}
      />
      <AuthModal
        isOpen={authModalOpen}
        onClose={handleAuthModalClose}
        defaultMode={authMode}
      />

    </div>
  );
}

export default HomePage;