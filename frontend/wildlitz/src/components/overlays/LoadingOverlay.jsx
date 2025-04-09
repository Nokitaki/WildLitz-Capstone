import React from 'react';
import { motion } from 'framer-motion';
import '../../styles/loading_overlay.css';
import wildLitzLogo from '../../assets/img/wildlitz-logo.png';

function LoadingOverlay({ isLoading }) {
  return (
    <motion.div 
      className="loading-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="loading-content">
        <motion.div 
          className="logo-container"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <img src={wildLitzLogo} alt="WildLitz Logo" className="loading-logo" />
          <h1>WildLitz</h1>
        </motion.div>
        <motion.div className="loading-progress-container">
          <motion.div 
            className="loading-progress-bar"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 2.5 }}
          />
        </motion.div>
        <p>Loading your adventure...</p>
      </div>
    </motion.div>
  );
}

export default LoadingOverlay;