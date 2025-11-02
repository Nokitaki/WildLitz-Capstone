// New homepage layout with added games and sections
// latest update: 2025-09-23

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import styles from "../../styles/Homepage.module.css";
import wildLitzLogo from "../../assets/img/logo/Wildlitz-logo.png";
import { motion } from "framer-motion";

import GameTipsModal from "../../components/modals/GameTipsModal";
import AuthModal from "../../components/auth/AuthModal";

import tigerCharacter from "../../assets/img/visuals/tiger-controller.png"; // Make sure path is correct
import gameController from "../../assets/img/visuals/game-controller.png";
import syllableGameCard from "../../assets/img/visuals/syllable-game-card.png";
import syllableGameCardRight from "../../assets/img/visuals/syllable-game-card-right.png";
// --- ADD THESE NEW IMPORTS ---
import fbIcon from "../../assets/img/visuals/fb-icon.png";
import xIcon from "../../assets/img/visuals/x-icon.png";
import instagramIcon from "../../assets/img/visuals/instagram-icon.png";
import tiktokIcon from "../../assets/img/visuals/tiktok-icon.png";

import bunnyVisual from "../../assets/img/visuals/bunny.png";
import bugsby1Visual from "../../assets/img/visuals/bugsby1.png";
import bugsby2Visual from "../../assets/img/visuals/bugsby2.png";
import coinGif from "../../assets/img/visuals/coin.gif";
import crossGif from "../../assets/img/visuals/cross.gif";

import syllableClappingGame from "../../assets/game/syllable-clapping-game.mp4";
import soundSafariGame from "../../assets/game/sound-safari-game.mp4";
import vanishingGame from "../../assets/game/vanishing-game.mp4";
import crosswordGame from "../../assets/game/crossword-game.png";
import CrosswordAnimation from "../../components/animations/CrosswordAnimation";
import visualKids from "../../assets/img/visuals/visual_kids.jpg";
import wildlitzDevelopers from "../../assets/img/visuals/wildlitz_developers.jpg";

function HomePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState("");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  useEffect(() => {
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
    document.body.style.height = "auto";
    document.documentElement.style.height = "auto";

    const root = document.getElementById("root");
    if (root) {
      root.style.height = "auto";
      root.style.overflow = "visible";
    }
  }, []);

  const handleLoginClick = () => {
    setAuthMode("login");
    setAuthModalOpen(true);
  };

  const handleSignUpClick = () => {
    setAuthMode("register");
    setAuthModalOpen(true);
  };

  const handleLogoutClick = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleAuthModalClose = () => {
    setAuthModalOpen(false);
  };

  const handleProfileClick = () => {
    navigate("/profile");
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
              Hi, {user?.first_name || "Friend"}!
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
            <a href="#" className={styles.navLink}>
              Home
            </a>
            <a href="#about" className={styles.navLink}>
              About Us
            </a>
          </nav>

          {/* The third grid column is now an empty spacer */}
        </header>

        <section className={styles.heroSection}>
          <div className={styles.heroContent}>
            <img
              src={tigerCharacter}
              alt="Tiger Character"
              className={styles.tigerCharacter}
            />
            <div className={styles.heroText}>
              {/* prettier-ignore */}
              <h2 className={styles.heroTitle}>
                LETS PLAY &<br />{" "}
                <span style={{ marginLeft: "110px" }}>LEARN</span>
              </h2>
              <br />
              <p
                className={styles.gameDescription}
                style={{
                  textAlign: "center",
                  fontSize: "20px", // <--- Add this line
                }}
              >
                                Join on an exciting adventure! Master reading
                through super fun games <br />                that make learning
                feel like playtime! 🚀✨              {" "}
              </p>
            </div>
            <img
              src={gameController}
              alt="Game Controller"
              className={styles.gameController}
            />
          </div>
        </section>
      </section>

      {/* --- MIDBODY SECTION (Games and Our Mission) --- */}
      <section className={styles.midBody}>
        <img
          src={bunnyVisual}
          alt="Bunny visual"
          className={styles.bunnyVisual}
        />

        <div className={styles.gameSelectionContainer}>
          {/* --- Syllable Clapping Game --- (etc.) */}
          {/* ... (All 4 game entries are here) ... */}
          
          <div className={styles.gameEntry} key="game-1">
            <div
              className={styles.gameImageContainer}
              onClick={() => handleGameClick("syllable-clapping")}
            >
              <video
                src={syllableClappingGame}
                className={styles.gameVisual}
                autoPlay
                loop
                muted
              />
              <img
                src={syllableGameCard}
                alt="Game Card Frame"
                className={styles.gameFrameImage}
              />
            </div>
            <div className={styles.gameTextContent}>
              <h3 className={styles.gameTitle}>Syllable Clapping Game</h3>
              <p className={styles.gameDescription}>
                A fun, interactive game where kids clap out the syllables in
                words, helping them understand word structure and rhythm in a
                playful way.
              </p>
              <button
                className={styles.playButton}
                onClick={() => handleHowToPlayClick("syllable-clapping")}
              >
                How to Play
              </button>
            </div>
          </div>

          <div className={styles.gameEntry} key="game-2">
            <div
              className={styles.gameImageContainer}
              onClick={() => handleGameClick("sound-safari")}
            >
              <video
                src={soundSafariGame}
                className={styles.gameVisual}
                autoPlay
                loop
                muted
              />
              <img
                src={syllableGameCardRight}
                alt="Second Game Card Frame"
                className={styles.gameFrameImage}
              />
            </div>
            <div className={styles.gameTextContent}>
              <h3 className={styles.gameTitle}>Sound Safari Game</h3>
              <img
                src={coinGif}
                alt="Animated coin"
                className={styles.coinVisual}
              />
              <p className={styles.gameDescription}>
                Embark on an auditory adventure! This game teaches phonetic
                awareness by identifying and distinguishing different sounds in
                a playful safari setting.
              </p>
              <button
                className={styles.playButton}
                onClick={() => handleHowToPlayClick("sound-safari")}
              >
                How to Play
              </button>
            </div>
          </div>

          <div className={styles.gameEntry} key="game-3">
            <div
              className={styles.gameImageContainer}
              onClick={() => handleGameClick("vanishing-game")}
            >
              <video
                src={vanishingGame}
                className={styles.gameVisual}
                autoPlay
                loop
                muted
              />
              <img
                src={syllableGameCard}
                alt="Game Card Frame"
                className={styles.gameFrameImage}
              />
            </div>
            <div className={styles.gameTextContent}>
              <h3 className={styles.gameTitle}>Vanishing Game</h3>
              <img
                src={crossGif}
                alt="Animated cross"
                className={styles.crossVisual}
              />
              <p className={styles.gameDescription}>
                A memory and phonics challenge where letters vanish from words,
                encouraging kids to recall letter sounds and spellings to
                complete the word.
              </p>
              <button
                className={styles.playButton}
                onClick={() => handleHowToPlayClick("vanishing-game")}
              >
                How to Play
              </button>
            </div>
          </div>

          <div className={styles.gameEntry} key="game-4">
            <motion.div
              className={styles.gameImageContainer}
              onClick={() => handleGameClick("crossword-puzzle")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
                backgroundSize: "200% 200%",
                borderRadius: "20px",
                padding: "40px",
                minHeight: "320px",
                position: "relative",
                overflow: "hidden",
                boxShadow:
                  "0 20px 60px rgba(102, 126, 234, 0.4), inset 0 0 30px rgba(255, 255, 255, 0.1)",
                cursor: "pointer",
              }}
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "linear",
              }}
              whileHover={{
                scale: 1.02,
                boxShadow:
                  "0 25px 70px rgba(102, 126, 234, 0.5), inset 0 0 40px rgba(255, 255, 255, 0.15)",
              }}
            >
              {/* Floating orbs background */}
              <div
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  top: 0,
                  left: 0,
                  overflow: "hidden",
                  pointerEvents: "none",
                }}
              >
                <motion.div
                  style={{
                    position: "absolute",
                    width: "150px",
                    height: "150px",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)",
                    top: "-50px",
                    left: "-50px",
                  }}
                  animate={{
                    x: [0, 30, 0],
                    y: [0, -30, 0],
                    scale: [1, 1.1, 0.9, 1],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <motion.div
                  style={{
                    position: "absolute",
                    width: "200px",
                    height: "200px",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)",
                    bottom: "-80px",
                    right: "-80px",
                  }}
                  animate={{
                    x: [0, -30, 0],
                    y: [0, 20, 0],
                    scale: [1, 0.9, 1.1, 1],
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>

              {/* Main Animation Container */}
              <motion.div
                style={{
                  transform: "scale(1.5)",
                  position: "relative",
                  zIndex: 1,
                }}
                whileHover={{
                  scale: 1.6,
                  rotate: 3,
                  transition: { duration: 0.3, type: "spring", stiffness: 300 },
                }}
                whileTap={{ scale: 1.45 }}
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  y: {
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                }}
              >
                <CrosswordAnimation />
              </motion.div>

              <motion.img
                src={syllableGameCardRight}
                alt="Fourth Game Card Frame"
                className={styles.gameFrameImage}
                animate={{
                  scale: [1, 1.02, 1],
                  opacity: [1, 0.95, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>

            <div className={styles.gameTextContent}>
              <h3 className={styles.gameTitle}>Crossword Game</h3>
              <p className={styles.gameDescription}>
                A classic puzzle with a phonics twist. Kids use letter sounds
                and clues to fill in the words, reinforcing vocabulary and
                spelling skills.
              </p>
              <button
                className={styles.playButton}
                onClick={() => handleHowToPlayClick("crossword-puzzle")}
              >
                How to Play
              </button>
            </div>
          </div>

          {/* --- PROJECT PURPOSE SECTION (Our Mission) --- */}
          <div className={styles.purposeSection}>
            <img
              src={bugsby1Visual}
              alt="Pixel monster"
              className={styles.bugsby1Visual}
            />
            <img
              src={bugsby2Visual}
              alt="Pixel monster"
              className={styles.bugsby2Visual}
            />
            <h3 className={styles.purposeTitle}>Our Mission</h3>

            <div className={styles.projectPurposeContainer}>
              <div className={styles.purposeImagePlaceholder}>
                <img
                  src={visualKids}
                  alt="Kids learning and reading"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover", 
                    borderRadius: "20px",
                  }}
                />
              </div>
              <div className={styles.purposeTextContent}>
                <p className={styles.purposeDescription}>
                  WildLitz was born from a critical need: addressing the
                  literacy challenges faced by Filipino Grade 3 students. Many
                  young learners struggle with reading comprehension and
                  foundational literacy skills, and we recognized that
                  traditional teaching methods weren't reaching every child
                  effectively.
                  <br />
                  <br />
                  Our platform transforms reading education by combining proven
                  phonics-based instruction with engaging game mechanics. Each
                  activity is carefully designed around the five pillars of
                  literacy: phonemic awareness, phonics, fluency, vocabulary,
                  and comprehension.
                </p>
              </div>
            </div>

            <p className={styles.purposeFullWidthText}>
              Through colorful characters, interactive challenges, and immediate
              feedback, we make learning to read feel less like studying and
              more like an adventure. Every game is a step in a personalized
              learning journey, adapting to the student's pace and focusing on
              areas where they need the most practice. This dynamic approach
              ensures maximum engagement and retention. By consistently engaging
              with WildLitz, Grade 3 students develop the foundational
              skills—from recognizing phonemes to mastering complex
              comprehension—that they need to become confident, lifelong readers
              and succeed in their academic lives.
            </p>
            
            {/* --- INSERTED IMPACT GRID HERE --- */}
            <div className={styles.impactGrid}>
                <motion.div 
                    className={styles.impactCard}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className={styles.impactIcon}>🎯</div>
                    <h4>Evidence-Based Approach</h4>
                    <p>Built on research-proven methods that have helped millions of children learn to read effectively</p>
                </motion.div>
                <motion.div 
                    className={styles.impactCard}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                >
                    <div className={styles.impactIcon}>📚</div>
                    <h4>Phonics-Based Method</h4>
                    <p>Structured phonics curriculum focusing on letter-sound relationships and decoding skills</p>
                </motion.div>
                <motion.div 
                    className={styles.impactCard}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <div className={styles.impactIcon}>📊</div>
                    <h4>Track Your Progress</h4>
                    <p>Detailed analytics showing performance, time spent, and skills mastered over time</p>
                </motion.div>
            </div>
            {/* ------------------------------- */}

          </div>
        </div>
      </section>

      {/* --- LOWERBODY SECTION (About Us) --- */}
      <section className={styles.lowerBody}>
        <div className={styles.aboutUsContainer}>
          <h3 className={styles.aboutUsTitle}>About Us</h3>
          <div className={styles.aboutUsImagePlaceholder}>
            <img
              src={wildlitzDevelopers}
              alt="Wildlitz Development Team"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "20px",
              }}
            />
          </div>
          <p className={styles.aboutUsDescription}>
            We are a passionate team of educators, developers, and designers
            united by a single, core mission: to make learning to read an
            exciting and unforgettable adventure for every child. We believe
            that games are a uniquely powerful tool for education. Our approach
            is rooted in proven pedagogical principles, where foundational
            phonics and vocabulary are seamlessly woven into captivating
            gameplay that feels less like a lesson and more like a journey.
            <br />
            <br />
            Each experience is thoughtfully crafted to help build not just
            essential literacy skills, but also the confidence and curiosity
            that foster a genuine, lifelong love for learning. By blending
            imaginative worlds with robust technology, we're dedicated to
            transforming screen time into a constructive and joyful step on the
            path to becoming a confident, enthusiastic reader.
          </p>

          {/* --- INSERTED VALUE LIST HERE, INSIDE aboutUsContainer --- */}
          <motion.div
            className={styles.valuesList} /* Removed floating class for normal flow */
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className={styles.valueItem}>
                <span className={styles.valueIcon}>❤️</span>
                <span className={styles.valueText}>
                    <strong>Passion</strong> for education and child development
                </span>
            </div>
            <div className={styles.valueItem}>
                <span className={styles.valueIcon}>🎓</span>
                <span className={styles.valueText}>
                    <strong>Expertise</strong> in pedagogy and technology
                </span>
            </div>
            <div className={styles.valueItem}>
                <span className={styles.valueIcon}>🤝</span>
                <span className={styles.valueText}>
                    <strong>Commitment</strong> to Filipino learners' success
                </span>
            </div>
            <div className={styles.valueItem}>
                <span className={styles.valueIcon}>✨</span>
                <span className={styles.valueText}>
                    <strong>Innovation</strong> in educational game design
                </span>
            </div>
          </motion.div>
          {/* ------------------------------- */}

        </div>
      </section>

      {/* --- Footer Section --- */}
      <section className={styles.bottomBodyFooter}>
        <div className={styles.footerContainer}>
          <div className={styles.footerTop}>
            <div className={styles.footerColumn}>
              <img
                src={wildLitzLogo}
                alt="Wildlitz Logo"
                className={styles.footerLogo}
              />
              <label htmlFor="language" className={styles.footerLabel}>
                Language
              </label>
              <select
                id="language"
                name="language"
                className={styles.footerDropdown}
              >
                <option value="english">English</option>
              </select>
              <p className={styles.footerLabel}>Social</p>
              <div className={styles.footerSocials}>
                <a href="#">
                  <img src={fbIcon} alt="Facebook" />
                </a>
                <a href="#">
                  <img src={xIcon} alt="X" />
                </a>
                <a href="#">
                  <img src={instagramIcon} alt="Instagram" />
                </a>
                <a href="#">
                  <img src={tiktokIcon} alt="Tiktok" />
                </a>
              </div>
            </div>

            <div className={styles.footerColumn}>
              <h4>App & Year</h4>
              <p>© 2025 Wildlitz.</p>
              <p>All rights reserved.</p>
            </div>

            <div
              className={`${styles.footerColumn} ${styles.footerColumnNote}`}
            >
              <h4>Project Note</h4>
              <p>
                Helping young Filipino learners read faster and better through
                fun educational games.
              </p>
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
              <a href="mailto:wildlitz.support@gmail.com">
                wildlitz.support@gmail.com
              </a>
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