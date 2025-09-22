// New homepage layout with added games and sections
// latest update: 2025-09-23

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
import syllableGameCard from '../../assets/img/visuals/syllable-game-card.png';
import syllableGameCardRight from '../../assets/img/visuals/syllable-game-card-right.png';
// --- ADD THESE NEW IMPORTS ---
import fbIcon from '../../assets/img/visuals/fb-icon.png';
import xIcon from '../../assets/img/visuals/x-icon.png';
import instagramIcon from '../../assets/img/visuals/instagram-icon.png';
import tiktokIcon from '../../assets/img/visuals/tiktok-icon.png';

import bunnyVisual from '../../assets/img/visuals/bunny.png';
import bugsby1Visual from '../../assets/img/visuals/bugsby1.png';
import bugsby2Visual from '../../assets/img/visuals/bugsby2.png';
import coinGif from '../../assets/img/visuals/coin.gif';
import crossGif from '../../assets/img/visuals/cross.gif';

import syllableClappingGame from '../../assets/game/syllable-clapping-game.mp4';
import soundSafariGame from '../../assets/game/sound-safari-game.mp4';
import vanishingGame from '../../assets/game/vanishing-game.mp4';
import crosswordGame from '../../assets/game/crossword-game.png';

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

  const handleGameClick = (gameSlug) => {
    if (isAuthenticated) {
      navigate(`/games/${gameSlug}`);
    } else {
      handleLoginClick();
    }
  };

  const handleHowToPlayClick = (gameType) => {
    setSelectedGame(gameType);
    setModalOpen(true);
  };

  const handleStartGameFromModal = () => {
    setModalOpen(false);
    if (selectedGame) {
      handleGameClick(selectedGame);
    }
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
            <img src={tigerCharacter} alt="Tiger Character" className={styles.tigerCharacter} />
            <div className={styles.heroText}>
              <h2 className={styles.heroTitle}>
                LEARN TO READ BY <br /> PLAYING GAMES
              </h2>
            </div>
            <img src={gameController} alt="Game Controller" className={styles.gameController} />
          </div>
        </section>

      </section>

      {/* --- 2. REPLACE THE EMPTY MIDBODY SECTION WITH THIS --- */}
      <section className={styles.midBody}>
         <img src={bunnyVisual} alt="Bunny visual" className={styles.bunnyVisual} />

        <div className={styles.gameSelectionContainer}>
         
          {/* --- Syllable Clapping Game --- */}
          <div className={styles.gameEntry} key="game-1">
            <div 
              className={styles.gameImageContainer} 
              onClick={() => handleGameClick('syllable-clapping')}
            >
              <video src={syllableClappingGame} className={styles.gameVisual} autoPlay loop muted />
              <img src={syllableGameCard} alt="Game Card Frame" className={styles.gameFrameImage} />
            </div>
            <div className={styles.gameTextContent}>
              <h3 className={styles.gameTitle}>Syllable Clapping Game</h3>
              <p className={styles.gameDescription}>
                A fun, interactive game where kids clap out the syllables in words, helping them understand word structure and rhythm in a playful way.
              </p>
              <button 
                className={styles.playButton} 
                onClick={() => handleHowToPlayClick('syllable-clapping')}
              >
                How to Play
              </button>
            </div>
          </div>
          
          {/* --- Sound Safari Game --- */}
          <div className={styles.gameEntry} key="game-2">
            <div 
              className={styles.gameImageContainer} 
              onClick={() => handleGameClick('sound-safari')}
            >
              <video src={soundSafariGame} className={styles.gameVisual} autoPlay loop muted />
              <img src={syllableGameCardRight} alt="Second Game Card Frame" className={styles.gameFrameImage} />
            </div>
            <div className={styles.gameTextContent}>
              <h3 className={styles.gameTitle}>Sound Safari Game</h3>
              <img src={coinGif} alt="Animated coin" className={styles.coinVisual} />
              <p className={styles.gameDescription}>
                Embark on an auditory adventure! This game teaches phonetic awareness by identifying and distinguishing different sounds in a playful safari setting.
              </p>
              <button 
                className={styles.playButton} 
                onClick={() => handleHowToPlayClick('sound-safari')}
              >
                How to Play
              </button>
            </div>
          </div>

          {/* --- Vanishing Game --- */}
          <div className={styles.gameEntry} key="game-3">
            <div 
              className={styles.gameImageContainer} 
              onClick={() => handleGameClick('vanishing-game')}
            >
              <video src={vanishingGame} className={styles.gameVisual} autoPlay loop muted />
              <img src={syllableGameCard} alt="Game Card Frame" className={styles.gameFrameImage} />
            </div>
            <div className={styles.gameTextContent}>
              <h3 className={styles.gameTitle}>Vanishing Game</h3>
              <img src={crossGif} alt="Animated cross" className={styles.crossVisual} />
              <p className={styles.gameDescription}>
                A memory and phonics challenge where letters vanish from words, encouraging kids to recall letter sounds and spellings to complete the word.
              </p>
              <button 
                className={styles.playButton} 
                onClick={() => handleHowToPlayClick('vanishing-game')}
              >
                How to Play
              </button>
            </div>
          </div>

           {/* --- Crossword Game --- */}
          <div className={styles.gameEntry} key="game-4">
            <div 
              className={styles.gameImageContainer} 
              onClick={() => handleGameClick('crossword-puzzle')}
            >
              <img src={crosswordGame} alt="Crossword Game" className={styles.gameVisual} />
              <img src={syllableGameCardRight} alt="Fourth Game Card Frame" className={styles.gameFrameImage} />
            </div>
            <div className={styles.gameTextContent}>
              <h3 className={styles.gameTitle}>Crossword Game</h3>
              <p className={styles.gameDescription}>
                A classic puzzle with a phonics twist. Kids use letter sounds and clues to fill in the words, reinforcing vocabulary and spelling skills.
              </p>
              <button 
                className={styles.playButton} 
                onClick={() => handleHowToPlayClick('crossword-puzzle')}
              >
                How to Play
              </button>
            </div>
          </div>


        {/* --- ADD THE PROJECT PURPOSE SECTION HERE --- */}
        <div className={styles.purposeSection}>
            <img src={bugsby1Visual} alt="Pixel monster" className={styles.bugsby1Visual} />
            <img src={bugsby2Visual} alt="Pixel monster" className={styles.bugsby2Visual} />
          <h3 className={styles.purposeTitle}>Project Purpose</h3>

          <div className={styles.projectPurposeContainer}>
            <div className={styles.purposeImagePlaceholder}>
              {/* This div is the placeholder for your photo */}
            </div>
            <div className={styles.purposeTextContent}>
              <p className={styles.purposeDescription}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus id viverra elit. Aliquam molestie dui in cursus bibendum. Sed porta, felis id eleifend condimentum, metus sapien dapibus nibh, id vulputate neque ante vitae enim. Praesent nunc lorem, condimentum eget consectetur at, iaculis sed tortor.
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus id viverra elit. Aliquam molestie dui in cursus bibendum. Sed porta, felis id eleifend condimentum, metus sapien dapibus nibh, id vulputate neque ante vitae enim. Praesent nunc lorem, condimentum ege 
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus id viverra elit. Aliquam molestie dui in id vulputate neque ante vitae en
              </p>
            </div>
          </div>

          <p className={styles.purposeFullWidthText}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus id viverra elit. Aliquam molestie dui in cursus bibendum. Sed porta, felis id eleifend condimentum, metus sapien dapibus nibh, id vulputate neque ante vitae enim. Praesent nunc lorem, condimentum eget consectetur at, iaculis sed tortor. Maecenas ut suscipit lectus. Suspendisse varius lacus a dictum interdum. Nulla imperdiet mi id lacus volutpat interdum.
          </p>
        </div>

        </div>
      </section>

      {/* --- ADD THE "ABOUT US" CONTENT INSIDE lowerBody --- */}
      <section className={styles.lowerBody}>
        <div className={styles.aboutUsContainer}>
          <h3 className={styles.aboutUsTitle}>About Us</h3>
          <div className={styles.aboutUsImagePlaceholder}>
            {/* Placeholder for the "About Us" image or graphic */}
          </div>
          <p className={styles.aboutUsDescription}>
  We are a passionate team of educators, developers, and designers united by a single, core mission: to make learning to read an exciting and unforgettable adventure for every child. We believe that games are a uniquely powerful tool for education. Our approach is rooted in proven pedagogical principles, where foundational phonics and vocabulary are seamlessly woven into captivating gameplay that feels less like a lesson and more like a journey.
<br/><br/>
  Each experience is thoughtfully crafted to help build not just essential literacy skills, but also the confidence and curiosity that foster a genuine, lifelong love for learning. By blending imaginative worlds with robust technology, we're dedicated to transforming screen time into a constructive and joyful step on the path to becoming a confident, enthusiastic reader.
</p>
        </div>
      </section>

      {/* --- Footer Section --- */}
      <section className={styles.bottomBodyFooter}>
        <div className={styles.footerContainer}>
          <div className={styles.footerTop}>

            <div className={styles.footerColumn}>
              <img src={wildLitzLogo} alt="Wildlitz Logo" className={styles.footerLogo} />
              <label htmlFor="language" className={styles.footerLabel}>Language</label>
              <select id="language" name="language" className={styles.footerDropdown}>
                <option value="english">English</option>
              </select>
              <p className={styles.footerLabel}>Social</p>
              <div className={styles.footerSocials}>
                <a href="#"><img src={fbIcon} alt="Facebook" /></a>
                <a href="#"><img src={xIcon} alt="X" /></a>
                <a href="#"><img src={instagramIcon} alt="Instagram" /></a>
                <a href="#"><img src={tiktokIcon} alt="Tiktok" /></a>
              </div>
            </div>

            <div className={styles.footerColumn}>
              <h4>App & Year</h4>
              <p>© 2025 Wildlitz.</p>
              <p>All rights reserved.</p>
            </div>

            <div className={`${styles.footerColumn} ${styles.footerColumnNote}`}>
              <h4>Project Note</h4>
              <p>Helping young Filipino learners read faster and better through fun educational games.</p>
            </div>

            <div className={styles.footerColumn}>
              <h4>Navigation</h4>
              <a href="#">Home</a>
              <a href="#">About Us</a>
              <a href="#">Purpose</a>
            </div>

            <div className={styles.footerColumn}>
              <h4>Credits / Developers</h4>
              <p>Joel Chandler Pili</p>
              <p>Kenji Ermita</p>
              <p>Garvey Gene Sanjorjo</p>
              <p>Francis Kyle Lorenzana</p>
              <p>Spencer Nacario</p>
            </div>

            <div className={styles.footerColumn}>
              <h4>Contact and Support</h4>
              <a href="mailto:wildlitz.support@gmail.com">wildlitz.support@gmail.com</a>
              <p>0912-345-6789</p>
            </div>

          </div>
          <h2 className={styles.footerBrandNameLarge}>Wildlitz</h2>
        </div>
      </section>

      <GameTipsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onStartGame={handleStartGameFromModal}
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