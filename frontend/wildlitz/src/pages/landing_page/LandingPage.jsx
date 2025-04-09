import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../../styles/landing_page.css';
import backgroundVideo from '../../assets/videos/wildlitz-background.mp4';
import backgroundImage from '../../assets/img/wildlitz-background.jpg';
import LoadingOverlay from '../../components/overlays/LoadingOverlay';

function LandingPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGetStarted = () => {
    // Start loading animation
    setLoading(true);
    
    // Wait for loading animation to complete before navigating
    setTimeout(() => {
      navigate('/home');
    }, 3000); // Match this with your loading animation duration
  };

  return (
    <>
      {loading && <LoadingOverlay isLoading={loading} />}
      
      <div className="landing-container">
        <video autoPlay loop muted className="video-background" poster={backgroundImage}>
          <source src={backgroundVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        <div className="content">
          <h1>WildLitz</h1>
          <h2>A Gamified English Reading Platform with AI-Powered Learning</h2>
          <motion.button 
            className="cta-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGetStarted}
          >
            Get Started
          </motion.button>
        </div>
      </div>
    </>
  );
}

export default LandingPage;