import React from 'react';
import '../../styles/homepage.css';
import wildLitzLogo from '../../assets/img/wildlitz-logo.png';
import syllableClappingImg from '../../assets/img/syllable-clapping-game.jpg';
import soundSafariImg from '../../assets/img/sound-safari-game.jpg';
import vanishingGameImg from '../../assets/img/vanishing-game.jpg';
import crosswordGameImg from '../../assets/img/crossword-game.png';
import { motion } from 'framer-motion';

function HomePage() {
  return (
    <div className="home-container">
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
            Home
          </motion.a>
          <motion.a 
            href="#" 
            className="nav-item"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            About Us
          </motion.a>
          <motion.a 
            href="#" 
            className="nav-item"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Contact
          </motion.a>
        </nav>
      </header>

      <section className="main-content">
        <h2 className="section-title">ENGLISH READING</h2>
        <div className="content-card">
          <div className="games-container">
          <motion.div 
                className="game-card"
                whileHover={{ 
                    scale: 1.03,
                    boxShadow: "0 10px 20px rgba(0,0,0,0.2)"
                }}
                >
                <img src={syllableClappingImg} alt="Syllable Clapping Game" className="game-image" />
                <div className="game-info">
                <h3>Syllable Clapping Game</h3>
                    <p>Syllabification</p>
                    
                    <motion.button 
                    className="play-button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    >
                    Play
                    </motion.button>
                </div>
                </motion.div>
            
            <motion.div 
              className="game-card"
              whileHover={{ 
                scale: 1.03,
                boxShadow: "0 10px 20px rgba(0,0,0,0.2)"
              }}
            >
              <img src={soundSafariImg} alt="Sound Safari Game" className="game-image" />
              <div className="game-info">
              <h3>Sound Safari</h3>
                <p>Phonemics</p>
               
                <motion.button 
                  className="play-button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Play
                </motion.button>
              </div>
            </motion.div>
            
            <motion.div 
              className="game-card"
              whileHover={{ 
                scale: 1.03,
                boxShadow: "0 10px 20px rgba(0,0,0,0.2)"
              }}
            >
              <img src={vanishingGameImg} alt="Vanishing Game" className="game-image" />
              <div className="game-info">
                <h3>Vanishing Game</h3>
                <p>Phonics</p>
                <motion.button 
                  className="play-button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Play
                </motion.button>
              </div>
            </motion.div>
            
            <motion.div 
              className="game-card"
              whileHover={{ 
                scale: 1.03,
                boxShadow: "0 10px 20px rgba(0,0,0,0.2)"
              }}
            >
              <img src={crosswordGameImg} alt="Crossword Puzzle Game" className="game-image" />
              <div className="game-info">
                <h3>Crossword Puzzle</h3>
                <p>Sentence Formation</p>
                <motion.button 
                  className="play-button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Play
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;