// src/components/animations/CrosswordAnimation.jsx
import React from 'react';
import { motion } from 'framer-motion';

const CrosswordAnimation = () => {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      padding: '10px'
    }}>
      {/* Animated background particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            width: `${Math.random() * 6 + 3}px`,
            height: `${Math.random() * 6 + 3}px`,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.3)',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      {/* Main Crossword Grid Container */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          position: 'relative',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '12px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3), 0 0 0 3px rgba(255, 255, 255, 0.5)',
        }}
      >
        {/* Crossword Grid */}
        <svg width="160" height="160" viewBox="0 0 160 160">
          {/* Grid Pattern */}
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <rect width="32" height="32" fill="white" stroke="#e0e0e0" strokeWidth="1"/>
            </pattern>
            <linearGradient id="letterGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#667eea" />
              <stop offset="100%" stopColor="#764ba2" />
            </linearGradient>
            <linearGradient id="letterGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f093fb" />
              <stop offset="100%" stopColor="#f5576c" />
            </linearGradient>
            <linearGradient id="letterGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4facfe" />
              <stop offset="100%" stopColor="#00f2fe" />
            </linearGradient>
          </defs>
          
          {/* Main Grid */}
          <rect x="10" y="10" width="140" height="140" fill="url(#grid)" rx="8"/>
          
          {/* Cell Highlights - Animated */}
          <motion.rect
            x="10" y="10" width="32" height="32"
            fill="rgba(102, 126, 234, 0.1)"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0 }}
          />
          <motion.rect
            x="42" y="10" width="32" height="32"
            fill="rgba(102, 126, 234, 0.1)"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
          />
          <motion.rect
            x="74" y="10" width="32" height="32"
            fill="rgba(102, 126, 234, 0.1)"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
          />
          <motion.rect
            x="106" y="10" width="32" height="32"
            fill="rgba(102, 126, 234, 0.1)"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
          />

          {/* Cell Numbers */}
          <text x="14" y="22" fontSize="7" fontWeight="bold" fill="#999">1</text>
          <text x="78" y="22" fontSize="7" fontWeight="bold" fill="#999">2</text>
          <text x="14" y="54" fontSize="7" fontWeight="bold" fill="#999">3</text>

          {/* Animated Letters - Horizontal Word "WORD" */}
          <motion.text
            x="18" y="32"
            fontSize="20"
            fontWeight="900"
            fill="url(#letterGradient1)"
            initial={{ opacity: 0, scale: 0, rotate: -180 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.5, duration: 0.4, type: 'spring', stiffness: 200 }}
          >
            W
          </motion.text>
          <motion.text
            x="50" y="32"
            fontSize="20"
            fontWeight="900"
            fill="url(#letterGradient1)"
            initial={{ opacity: 0, scale: 0, rotate: -180 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.7, duration: 0.4, type: 'spring', stiffness: 200 }}
          >
            O
          </motion.text>
          <motion.text
            x="82" y="32"
            fontSize="20"
            fontWeight="900"
            fill="url(#letterGradient1)"
            initial={{ opacity: 0, scale: 0, rotate: -180 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.9, duration: 0.4, type: 'spring', stiffness: 200 }}
          >
            R
          </motion.text>
          <motion.text
            x="114" y="32"
            fontSize="20"
            fontWeight="900"
            fill="url(#letterGradient1)"
            initial={{ opacity: 0, scale: 0, rotate: -180 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 1.1, duration: 0.4, type: 'spring', stiffness: 200 }}
          >
            D
          </motion.text>

          {/* Vertical Word "QUIZ" */}
          <motion.text
            x="82" y="64"
            fontSize="20"
            fontWeight="900"
            fill="url(#letterGradient2)"
            initial={{ opacity: 0, scale: 0, rotate: 180 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 1.3, duration: 0.4, type: 'spring', stiffness: 200 }}
          >
            U
          </motion.text>
          <motion.text
            x="82" y="96"
            fontSize="20"
            fontWeight="900"
            fill="url(#letterGradient2)"
            initial={{ opacity: 0, scale: 0, rotate: 180 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 1.5, duration: 0.4, type: 'spring', stiffness: 200 }}
          >
            I
          </motion.text>
          <motion.text
            x="82" y="128"
            fontSize="20"
            fontWeight="900"
            fill="url(#letterGradient2)"
            initial={{ opacity: 0, scale: 0, rotate: 180 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 1.7, duration: 0.4, type: 'spring', stiffness: 200 }}
          >
            Z
          </motion.text>

          {/* Horizontal Word "FUN" */}
          <motion.text
            x="18" y="64"
            fontSize="20"
            fontWeight="900"
            fill="url(#letterGradient3)"
            initial={{ opacity: 0, scale: 0, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 1.9, duration: 0.4, type: 'spring', stiffness: 200 }}
          >
            F
          </motion.text>
          <motion.text
            x="50" y="64"
            fontSize="20"
            fontWeight="900"
            fill="url(#letterGradient3)"
            initial={{ opacity: 0, scale: 0, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 2.1, duration: 0.4, type: 'spring', stiffness: 200 }}
          >
            U
          </motion.text>
          <motion.text
            x="82" y="64"
            fontSize="20"
            fontWeight="900"
            fill="url(#letterGradient3)"
            initial={{ opacity: 0, scale: 0, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 2.3, duration: 0.4, type: 'spring', stiffness: 200 }}
          >
            N
          </motion.text>

          {/* Success Checkmark Circle */}
          <motion.circle
            cx="135"
            cy="25"
            r="12"
            fill="url(#letterGradient3)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 2.5, duration: 0.5, type: 'spring', stiffness: 300 }}
          />
          <motion.path
            d="M 129 25 L 133 29 L 141 21"
            stroke="white"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 2.7, duration: 0.4 }}
          />
        </svg>

        {/* Floating Stars */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={`star-${i}`}
            style={{
              position: 'absolute',
              fontSize: '16px',
              left: `${20 + i * 30}%`,
              top: `${-10 + (i % 2) * 20}%`,
            }}
            animate={{
              y: [0, -15, 0],
              rotate: [0, 180, 360],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          >
            ⭐
          </motion.div>
        ))}

        {/* Bottom decoration */}
        <motion.div
          style={{
            position: 'absolute',
            bottom: '-5px',
            right: '-5px',
            fontSize: '28px',
          }}
          animate={{
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
          }}
        >
          🧩
        </motion.div>

        {/* Top left decoration */}
        <motion.div
          style={{
            position: 'absolute',
            top: '-8px',
            left: '-8px',
            fontSize: '20px',
          }}
          animate={{
            rotate: [0, -15, 15, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            delay: 0.5,
          }}
        >
          ✏️
        </motion.div>
      </motion.div>

      {/* Corner sparkles */}
      <motion.div
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          fontSize: '20px',
        }}
        animate={{
          scale: [0, 1.5, 0],
          rotate: [0, 180, 360],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
      >
        ✨
      </motion.div>

      <motion.div
        style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          fontSize: '20px',
        }}
        animate={{
          scale: [0, 1.5, 0],
          rotate: [0, -180, -360],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          delay: 1,
        }}
      >
        ✨
      </motion.div>
    </div>
  );
};

export default CrosswordAnimation;