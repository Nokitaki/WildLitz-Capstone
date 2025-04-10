import React from 'react';
import { motion } from 'framer-motion';

const AudioLoadingIndicator = ({ isPlaying }) => {
  return (
    <div className="audio-loading-indicator">
      {isPlaying && (
        <div className="sound-wave">
          {[1, 2, 3, 4].map((bar) => (
            <motion.div
              key={bar}
              className="sound-bar"
              animate={{
                height: ['10px', '15px', '25px', '15px', '10px'],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: bar * 0.1,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AudioLoadingIndicator;