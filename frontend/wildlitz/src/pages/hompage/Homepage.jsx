// Enhanced homepage with light brown theme matching profile
// Latest update: 2025-10-30

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/Homepage.module.css';
import wildLitzLogo from '../../assets/img/logo/Wildlitz-logo.png';
import { motion } from 'framer-motion';

import GameTipsModal from '../../components/modals/GameTipsModal';
import AuthModal from '../../components/auth/AuthModal';

import tigerCharacter from '../../assets/img/visuals/tiger-controller.png';
import gameController from '../../assets/img/visuals/game-controller.png';
import syllableGameCard from '../../assets/img/visuals/syllable-game-card.png';
import syllableGameCardRight from '../../assets/img/visuals/syllable-game-card-right.png';
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
import CrosswordAnimation from '../../components/animations/CrosswordAnimation';

function HomePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  useEffect(() => {
    // Prevent double scrollbar by ensuring only body scrolls
    document.body.style.overflow = '';
    document.body.style.overflowX = 'hidden';
    document.documentElement.style.overflow = '';
    document.documentElement.style.overflowX = 'hidden';
    document.body.style.height = '';
    document.documentElement.style.height = '';
    
    const root = document.getElementById('root');
    if (root) {
      root.style.height = '';
      root.style.minHeight = '';
      root.style.overflow = '';
    }

    return () => {
      // Cleanup
      document.body.style.overflow = '';
      document.body.style.overflowX = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.overflowX = '';
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleHowToPlayClick = (gameId) => {
    setSelectedGame(gameId);
    setModalOpen(true);
  };

  const handleStartGameFromModal = (difficulty) => {
    setModalOpen(false);
    if (isAuthenticated) {
      navigate(`/games/${selectedGame}`, { state: { difficulty } });
    } else {
      setAuthMode('register');
      setAuthModalOpen(true);
    }
  };

  const handleAuthModalClose = () => {
    setAuthModalOpen(false);
  };

  const openAuthModal = (mode) => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <img src={wildLitzLogo} alt="Wildlitz Logo" className={styles.logo} />
          <h1 className={styles.logoText}>Wildlitz</h1>
        </div>
        
        <nav className={styles.nav}>
          <a href="#home" className={styles.navLink}>Home</a>
          <a href="#games" className={styles.navLink}>Games</a>
          <a href="#purpose" className={styles.navLink}>Purpose</a>
          <a href="#about" className={styles.navLink}>About Us</a>
        </nav>

        <div className={styles.authSection}>
          {isAuthenticated ? (
            <>
              <button onClick={() => navigate('/profile')} className={styles.profileBtn}>
                Profile
              </button>
              <button onClick={handleLogout} className={styles.logoutBtn}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button onClick={() => openAuthModal('login')} className={styles.loginBtn}>
                Login
              </button>
              <button onClick={() => openAuthModal('register')} className={styles.registerBtn}>
                Register
              </button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className={styles.upperBody}>
        <div className={styles.heroSection}>
          <motion.img 
            src={tigerCharacter} 
            alt="Tiger with Controller" 
            className={styles.tigerCharacter}
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          
          <div className={styles.heroText}>
            <motion.h2 
              className={styles.heroTitle}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              🎮  Let's Play & Learn! 
            </motion.h2>
            <motion.p 
              className={styles.heroSubtitle}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Join Grade 3 Filipino students on an exciting adventure! Master reading through super fun games that make learning feel like playtime! 🚀✨
            </motion.p>
          </div>
          
          <motion.img 
            src={gameController} 
            alt="Game Controller" 
            className={styles.gameController}
            animate={{ 
              rotate: [0, 5, -5, 0],
              y: [0, -10, 0]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </section>

      {/* Games Section */}
      <section id="games" className={styles.midBody}>
        <div className={styles.gameSelectionContainer}>
          
          {/* Syllable Clapping Game */}
          <div className={styles.gameEntry}>
            <div className={styles.gameTextContent}>
              <h3 className={styles.gameTitle}>👏 Syllable Clapping Game 🎵</h3>
              <p className={styles.gameDescription}>
                Break words into beats! Listen, clap along, and become a syllable master through rhythm and sound. Can you clap the perfect beat? 🎶
              </p>
              <button 
                className={styles.playButton} 
                onClick={() => handleHowToPlayClick('syllable-clapping')}
              >
                Let's Clap! 🎉
              </button>
            </div>
            <motion.div 
              className={styles.gameImageContainer}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <video 
                className={styles.gameVisual} 
                src={syllableClappingGame} 
                autoPlay 
                loop 
                muted 
              />
              <motion.img 
                src={syllableGameCard} 
                alt="First Game Card Frame" 
                className={styles.gameFrameImage}
                animate={{
                  scale: [1, 1.02, 1],
                  opacity: [1, 0.95, 1]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          </div>

          {/* Sound Safari Game */}
          <div className={styles.gameEntry}>
            <div className={styles.gameTextContent}>
              <h3 className={styles.gameTitle}>🦁 Sound Safari Expedition! 🔊</h3>
              <p className={styles.gameDescription}>
                Embark on a wild phonics adventure! Hunt for letter sounds, match them to words, and discover the amazing building blocks of reading! 🗺️✨
              </p>
              <button 
                className={styles.playButton} 
                onClick={() => handleHowToPlayClick('sound-safari')}
              >
                Start Safari! 🚀
              </button>
            </div>
            <motion.div 
              className={styles.gameImageContainer}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <video 
                className={styles.gameVisual} 
                src={soundSafariGame} 
                autoPlay 
                loop 
                muted 
              />
              <motion.img 
                src={syllableGameCardRight} 
                alt="Second Game Card Frame" 
                className={styles.gameFrameImage}
                animate={{
                  scale: [1, 1.02, 1],
                  rotate: [0, 1, -1, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          </div>

          {/* Vanishing Vowels Game */}
          <div className={styles.gameEntry}>
            <div className={styles.gameTextContent}>
              <h3 className={styles.gameTitle}>✨ Vanishing game 🔍</h3>
              <p className={styles.gameDescription}>
                Crack the code and solve the puzzle! Missing letters need your help - can you fill in the blanks and reveal the hidden words? Become a word detective! 🕵️
              </p>
              <button 
                className={styles.playButton} 
                onClick={() => handleHowToPlayClick('vanishing-game')}
              >
                Solve Mysteries! 🎯
              </button>
            </div>
            <motion.div 
              className={styles.gameImageContainer}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <video 
                className={styles.gameVisual} 
                src={vanishingGame} 
                autoPlay 
                loop 
                muted 
              />
              <motion.img 
                src={syllableGameCard} 
                alt="Third Game Card Frame" 
                className={styles.gameFrameImage}
                animate={{
                  scale: [1, 1.03, 1],
                  y: [0, -5, 0]
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          </div>

          {/* Crossword Game */}
          <div className={styles.gameEntry}>
            <div className={styles.gameTextContent}>
              <h3 className={styles.gameTitle}>🧩 Word Puzzle Challenge! 🌟</h3>
              <p className={styles.gameDescription}>
                Become a word master! Use letter sounds and clever clues to crack the crossword puzzle. Can you fill in all the words and win? 🏆
              </p>
              <button 
                className={styles.playButton} 
                onClick={() => handleHowToPlayClick('crossword-puzzle')}
              >
                Take Challenge! 💪
              </button>
            </div>
            <motion.div 
              className={styles.gameImageContainer}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <motion.div
                  style={{ 
                    transform: 'scale(1.5)', 
                    position: 'relative',
                    zIndex: 1
                  }}
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    y: {
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }
                  }}
                >
                  <CrosswordAnimation />
                </motion.div>
              </div>
              <motion.img 
                src={syllableGameCardRight} 
                alt="Fourth Game Card Frame" 
                className={styles.gameFrameImage}
                animate={{
                  scale: [1, 1.02, 1],
                  opacity: [1, 0.95, 1]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          </div>

          {/* Project Purpose Section */}
          <div id="purpose" className={styles.purposeSection}>
            <motion.img 
              src={bugsby1Visual} 
              alt="Pixel monster" 
              className={styles.bugsby1Visual}
              animate={{ x: [0, 10, 0], rotate: [0, 5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.img 
              src={bugsby2Visual} 
              alt="Pixel monster" 
              className={styles.bugsby2Visual}
              animate={{ x: [0, -10, 0], rotate: [0, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            
            <motion.h3 
              className={styles.purposeTitle}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              Our Mission
            </motion.h3>

            <div className={styles.projectPurposeContainer}>
              <motion.div 
                className={styles.purposeImagePlaceholder}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <div className={styles.purposeImageContent}>
                  <motion.div 
                    className={styles.statsCard}
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className={styles.statNumber}>Grade 3</div>
                    <div className={styles.statLabel}>Our primary focus - helping Grade 3 Filipino students master reading</div>
                  </motion.div>
                  <motion.div 
                    className={styles.statsCard}
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className={styles.statNumber}>4 Games</div>
                    <div className={styles.statLabel}>Engaging phonics-based games designed by educators</div>
                  </motion.div>
                </div>
              </motion.div>
              
              <motion.div 
                className={styles.purposeTextContent}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <p className={styles.purposeDescription}>
                  <span className={styles.highlightText}>WildLitz</span> was born from a critical need: addressing the literacy challenges faced by Filipino Grade 3 students. Many young learners struggle with reading comprehension and foundational literacy skills, and we recognized that traditional teaching methods weren't reaching every child effectively.
                  <br/><br/>
                  Our platform transforms reading education by combining proven <strong>phonics-based instruction</strong> with engaging game mechanics. Each activity is carefully designed around the five pillars of literacy: <strong>phonemic awareness, phonics, fluency, vocabulary, and comprehension</strong>.
                  <br/><br/>
                  Through colorful characters, interactive challenges, and immediate feedback, we make learning to read feel less like studying and more like an adventure—helping Grade 3 students develop the foundational skills they need to become confident, lifelong readers.
                </p>
              </motion.div>
            </div>

            <motion.div 
              className={styles.purposeFullWidthText}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className={styles.impactGrid}>
                <div className={styles.impactCard}>
                  <div className={styles.impactIcon}>🎯</div>
                  <h4>Evidence-Based Approach</h4>
                  <p>Built on research-proven methods that have helped millions of children learn to read effectively</p>
                </div>
                <div className={styles.impactCard}>
                  <div className={styles.impactIcon}>📚</div>
                  <h4>Phonics-Based Method</h4>
                  <p>Structured phonics curriculum focusing on letter-sound relationships and decoding skills</p>
                </div>
               
                <div className={styles.impactCard}>
                  <div className={styles.impactIcon}>📊</div>
                  <h4>Track Your Progress</h4>
                  <p>Detailed analytics showing performance, time spent, and skills mastered over time</p>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className={styles.lowerBody}>
        <motion.div 
          className={styles.aboutUsContainer}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.h3 
            className={styles.aboutUsTitle}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            About Us
          </motion.h3>
          
          <div className={styles.aboutUsContent}>
            <motion.div 
              className={styles.aboutUsImagePlaceholder}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className={styles.teamVisualization}>
                <div className={styles.teamCircle}>
                  <span className={styles.teamEmoji}>👨‍💻</span>
                </div>
                <div className={styles.teamCircle}>
                  <span className={styles.teamEmoji}>👩‍🎨</span>
                </div>
                <div className={styles.teamCircle}>
                  <span className={styles.teamEmoji}>👨‍🏫</span>
                </div>
                <div className={styles.teamCircle}>
                  <span className={styles.teamEmoji}>👩‍💻</span>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className={styles.aboutUsTextContainer}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <p className={styles.aboutUsDescription}>
                We are a passionate team of <strong>educators, developers, and designers</strong> united by a single mission: to make learning to read an exciting and unforgettable adventure for every Filipino child.
                <br/><br/>
                We believe that games are a uniquely powerful tool for education. Our approach is rooted in <strong>proven pedagogical principles</strong>, where foundational phonics and vocabulary are seamlessly woven into captivating gameplay that feels less like a lesson and more like a journey.
                <br/><br/>
                Each experience is thoughtfully crafted to help build not just essential literacy skills, but also the <strong>confidence and curiosity</strong> that foster a genuine, lifelong love for learning. By blending imaginative worlds with robust technology, we're dedicated to transforming screen time into a constructive and joyful step on the path to becoming a confident, enthusiastic reader.
              </p>
              
              <div className={styles.valuesList}>
                <div className={styles.valueItem}>
                  <span className={styles.valueIcon}>❤️</span>
                  <span className={styles.valueText}><strong>Passion</strong> for education and child development</span>
                </div>
                <div className={styles.valueItem}>
                  <span className={styles.valueIcon}>🎓</span>
                  <span className={styles.valueText}><strong>Expertise</strong> in pedagogy and technology</span>
                </div>
                <div className={styles.valueItem}>
                  <span className={styles.valueIcon}>🤝</span>
                  <span className={styles.valueText}><strong>Commitment</strong> to Filipino learners' success</span>
                </div>
                <div className={styles.valueItem}>
                  <span className={styles.valueIcon}>✨</span>
                  <span className={styles.valueText}><strong>Innovation</strong> in educational game design</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Footer Section */}
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
              <a href="#home">Home</a>
              <a href="#games">Games</a>
              <a href="#purpose">Purpose</a>
              <a href="#about">About Us</a>
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
        game={selectedGame}
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