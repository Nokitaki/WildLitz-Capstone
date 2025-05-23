import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import '../../styles/landing_page.css';
import LoadingOverlay from '../../components/overlays/LoadingOverlay';

// Import your Wildlitz images
import wildlitzStanding from '../../assets/img/wildlitz_standing.png';
import wildlitzWave from '../../assets/img/wildlitz_wave.png';
import wildlitzSincere from '../../assets/img/wildlitz_sincere.png';
import wildlitzReady from '../../assets/img/wildlitz_ready.png';
import wildlitzBook from '../../assets/img/wildlitz_book.png';

const wildlitzImages = {
  standing: wildlitzStanding,
  wave: wildlitzWave,
  sincere: wildlitzSincere,
  ready: wildlitzReady,
  book: wildlitzBook
};

const scenes = [
  {
    id: 1,
    image: wildlitzImages.wave,
    text: "Hi there, friend! 👋 I'm Wildlitz, your reading buddy!",
    showButton: false
  },
  {
    id: 2,
    image: wildlitzImages.book,
    text: "Welcome to WildLitz— a fun place to learn English through games!",
    showButton: false
  },
  {
    id: 3,
    image: wildlitzImages.sincere,
    text: "I'll be right here to help you every step of the way. Let's read together!",
    showButton: false
  },
  {
    id: 4,
    image: wildlitzImages.ready,
    text: "Tap 'Start Learning' below and let the reading fun begin! ✨📚",
    showButton: true
  }
];

function LandingPage() {
  const [loading, setLoading] = useState(false);
  const [currentScene, setCurrentScene] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();

  const handleNextScene = () => {
    if (currentScene < scenes.length - 1 && !isAnimating) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentScene(prev => prev + 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleStartLearning = () => {
    setLoading(true);
    setTimeout(() => {
      navigate('/home');
    }, 2000);
  };

  const handleSkip = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentScene(scenes.length - 1);
      setIsAnimating(false);
    }, 300);
  };

  const currentSceneData = scenes[currentScene];

  return (
    <>
      {loading && <LoadingOverlay isLoading={loading} />}
      
      <div className="conversational-landing">
        {/* Floating Background Elements */}
        <div className="floating-elements">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="floating-dot"
              animate={{
                x: [0, 100, 0],
                y: [0, -100, 0],
                rotate: [0, 360],
              }}
              transition={{
                duration: 8 + i * 2,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                left: `${10 + i * 15}%`,
                top: `${20 + i * 10}%`,
              }}
            />
          ))}
        </div>

        {/* Skip Button */}
        {currentScene < scenes.length - 1 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={handleSkip}
            className="skip-button"
          >
            Skip
          </motion.button>
        )}

        {/* Progress Bar */}
        <div className="progress-container">
          <motion.div
            className="progress-bar"
            initial={{ width: 0 }}
            animate={{ width: `${((currentScene + 1) / scenes.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Main Content */}
        <div className="scene-container">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScene}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 1.1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="scene-content"
              onClick={handleNextScene}
              style={{ cursor: currentScene < scenes.length - 1 ? 'pointer' : 'default' }}
            >
              {/* Text */}
              {currentSceneData.text && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="speech-bubble"
                >
                  <p className="speech-text">
                    {currentSceneData.text}
                  </p>
                  <div className="speech-tail"></div>
                </motion.div>
              )}

              {/* Character Image */}
              <div className="character-container">
                <img
                  src={currentSceneData.image}
                  alt="Wildlitz"
                  className="character-image"
                />
              </div>

              {/* Start Learning Button */}
              {currentSceneData.showButton && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartLearning();
                  }}
                  className="start-button"
                >
                  🚀 Start Learning
                </motion.button>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Tap to Continue Indicator */}
          {currentScene < scenes.length - 1 && (
            <motion.div
              className="tap-indicator"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              👆 Tap to continue
            </motion.div>
          )}

          {/* Decorative Stars */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="decorative-star"
              animate={{
                scale: [0.8, 1.2, 0.8],
                rotate: [0, 180, 360],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                delay: i * 0.5
              }}
              style={{
                left: `${15 + i * 20}%`,
                top: `${30 + (i % 2) * 40}%`,
              }}
            >
              ⭐
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}

export default LandingPage;