import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/homepage.css';
import wildLitzLogo from '../../assets/img/wildlitz-logo.png';
import syllableClappingImg from '../../assets/img/syllable-clapping-game.jpg';
import soundSafariImg from '../../assets/img/sound-safari-game.jpg';
import vanishingGameImg from '../../assets/img/vanishing-game.jpg';
import crosswordGameImg from '../../assets/img/crossword-game.png';
import { motion } from 'framer-motion';
import GameTipsModal from '../../components/modals/GameTipsModal';

function HomePage() {
  const navigate = useNavigate();
  
  // State for managing modal visibility
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState('');

  // Function to handle game selection
  const handleGameSelect = (game) => {
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
                scale: 1.05,
                boxShadow: "0 15px 30px rgba(0,0,0,0.3)"
              }}
              onClick={() => handleGameSelect('syllable-clapping')}
            >
              <img src={syllableClappingImg} alt="Syllable Clapping Game" className="game-image" />
              <div className="game-info">
                <h3>Syllable Clapping Game</h3>
                <p>Syllabification</p>
                <motion.button 
                  className="play-button"
                  whileHover={{ 
                    scale: 1.08,
                    boxShadow: "0 8px 16px rgba(0,0,0,0.4)" 
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGameSelect('syllable-clapping');
                  }}
                >
                  Play Now
                </motion.button>
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
              <img src={soundSafariImg} alt="Sound Safari Game" className="game-image" />
              <div className="game-info">
                <h3>Sound Safari</h3>
                <p>Phonemics</p>
                <motion.button 
                  className="play-button"
                  whileHover={{ 
                    scale: 1.08,
                    boxShadow: "0 8px 16px rgba(0,0,0,0.4)" 
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGameSelect('sound-safari');
                  }}
                >
                  Play Now
                </motion.button>
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
              <img src={vanishingGameImg} alt="Vanishing Game" className="game-image" />
              <div className="game-info">
                <h3>Vanishing Game</h3>
                <p>Phonics</p>
                <motion.button 
                  className="play-button"
                  whileHover={{ 
                    scale: 1.08,
                    boxShadow: "0 8px 16px rgba(0,0,0,0.4)" 
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGameSelect('vanishing-game');
                  }}
                >
                  Play Now
                </motion.button>
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
              <img src={crosswordGameImg} alt="Crossword Puzzle Game" className="game-image" />
              <div className="game-info">
                <h3>Crossword Puzzle</h3>
                <p>Sentence Formation</p>
                <motion.button 
                  className="play-button"
                  whileHover={{ 
                    scale: 1.08,
                    boxShadow: "0 8px 16px rgba(0,0,0,0.4)" 
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGameSelect('crossword-puzzle');
                  }}
                >
                  Play Now
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Game Tips Modal */}
      <GameTipsModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        game={selectedGame}
        onStartGame={handleStartGame}
      />
    </div>
  );
}

export default HomePage;