// src/components/animations/CrosswordAnimation.jsx
// Enhanced with beautiful animations and effects
import React from 'react';
import { motion } from 'framer-motion';

const CrosswordAnimation = () => {
  // Generate floating particles
  const particles = [...Array(8)].map((_, i) => ({
    id: i,
    x: Math.random() * 160,
    y: Math.random() * 160,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 2
  }));

  return (
    <svg 
      width="160" 
      height="160" 
      viewBox="0 0 160 160"
      style={{ 
        filter: 'drop-shadow(0 10px 30px rgba(102, 126, 234, 0.4))',
        overflow: 'visible'
      }}
    >
      <defs>
        {/* Grid Pattern */}
        <pattern id="grid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
          <rect width="32" height="32" fill="white" stroke="#e0e0e0" strokeWidth="1"/>
        </pattern>
        
        {/* Enhanced Gradient Definitions with Animation */}
        <linearGradient id="letterGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B9D">
            <animate attributeName="stop-color" values="#FF6B9D;#FEC163;#FF6B9D" dur="3s" repeatCount="indefinite"/>
          </stop>
          <stop offset="100%" stopColor="#C644FC">
            <animate attributeName="stop-color" values="#C644FC;#F72585;#C644FC" dur="3s" repeatCount="indefinite"/>
          </stop>
        </linearGradient>
        
        <linearGradient id="letterGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ECDC4">
            <animate attributeName="stop-color" values="#4ECDC4;#44A0D8;#4ECDC4" dur="3s" repeatCount="indefinite"/>
          </stop>
          <stop offset="100%" stopColor="#556FB5">
            <animate attributeName="stop-color" values="#556FB5;#7161EF;#556FB5" dur="3s" repeatCount="indefinite"/>
          </stop>
        </linearGradient>
        
        <linearGradient id="letterGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD93D">
            <animate attributeName="stop-color" values="#FFD93D;#FF9A3D;#FFD93D" dur="3s" repeatCount="indefinite"/>
          </stop>
          <stop offset="100%" stopColor="#FF6B6B">
            <animate attributeName="stop-color" values="#FF6B6B;#FF4D4D;#FF6B6B" dur="3s" repeatCount="indefinite"/>
          </stop>
        </linearGradient>

        {/* Glow filter for letters */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Floating particles background */}
      {particles.map(p => (
        <motion.circle
          key={p.id}
          cx={p.x}
          cy={p.y}
          r={p.size}
          fill="url(#letterGradient1)"
          opacity="0.3"
          animate={{
            y: [p.y, p.y - 30, p.y],
            opacity: [0.3, 0.7, 0.3],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut"
          }}
        />
      ))}
      
      {/* Animated background glow ring */}
      <motion.rect
        x="5" y="5" width="150" height="150"
        fill="none"
        stroke="url(#letterGradient1)"
        strokeWidth="3"
        rx="12"
        opacity="0.5"
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Main Grid */}
      <rect x="10" y="10" width="140" height="140" fill="url(#grid)" rx="8"/>
      
      {/* Enhanced Cell Highlights - Animated with scale */}
      <motion.rect
        x="10" y="10" width="32" height="32"
        fill="rgba(255, 107, 157, 0.15)"
        rx="4"
        animate={{
          opacity: [0, 0.5, 0],
          scale: [0.95, 1.05, 0.95]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.rect
        x="42" y="10" width="32" height="32"
        fill="rgba(78, 205, 196, 0.15)"
        rx="4"
        animate={{
          opacity: [0, 0.5, 0],
          scale: [0.95, 1.05, 0.95]
        }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
      />
      <motion.rect
        x="74" y="10" width="32" height="32"
        fill="rgba(255, 217, 61, 0.15)"
        rx="4"
        animate={{
          opacity: [0, 0.5, 0],
          scale: [0.95, 1.05, 0.95]
        }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
      />
      <motion.rect
        x="106" y="10" width="32" height="32"
        fill="rgba(102, 126, 234, 0.15)"
        rx="4"
        animate={{
          opacity: [0, 0.5, 0],
          scale: [0.95, 1.05, 0.95]
        }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
      />

      {/* Cell Numbers */}
      <text x="14" y="22" fontSize="7" fontWeight="bold" fill="#999">1</text>
      <text x="78" y="22" fontSize="7" fontWeight="bold" fill="#999">2</text>
      <text x="14" y="54" fontSize="7" fontWeight="bold" fill="#999">3</text>

      {/* Animated Letters - Horizontal Word "WORD" with bounce */}
      <motion.text
        x="18" y="32"
        fontSize="20"
        fontWeight="900"
        fill="url(#letterGradient1)"
        filter="url(#glow)"
        initial={{ opacity: 0, scale: 0, rotate: -180 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ delay: 0.5, duration: 0.4, type: 'spring', stiffness: 200 }}
      >
        <motion.tspan
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          W
        </motion.tspan>
      </motion.text>
      
      <motion.text
        x="50" y="32"
        fontSize="20"
        fontWeight="900"
        fill="url(#letterGradient1)"
        filter="url(#glow)"
        initial={{ opacity: 0, scale: 0, rotate: -180 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ delay: 0.7, duration: 0.4, type: 'spring', stiffness: 200 }}
      >
        <motion.tspan
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.3, ease: "easeInOut" }}
        >
          O
        </motion.tspan>
      </motion.text>
      
      <motion.text
        x="82" y="32"
        fontSize="20"
        fontWeight="900"
        fill="url(#letterGradient1)"
        filter="url(#glow)"
        initial={{ opacity: 0, scale: 0, rotate: -180 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ delay: 0.9, duration: 0.4, type: 'spring', stiffness: 200 }}
      >
        <motion.tspan
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.6, ease: "easeInOut" }}
        >
          R
        </motion.tspan>
      </motion.text>
      
      <motion.text
        x="114" y="32"
        fontSize="20"
        fontWeight="900"
        fill="url(#letterGradient1)"
        filter="url(#glow)"
        initial={{ opacity: 0, scale: 0, rotate: -180 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ delay: 1.1, duration: 0.4, type: 'spring', stiffness: 200 }}
      >
        <motion.tspan
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.9, ease: "easeInOut" }}
        >
          D
        </motion.tspan>
      </motion.text>

      {/* Vertical Word "QUIZ" with side bounce */}
      <motion.text
        x="82" y="64"
        fontSize="20"
        fontWeight="900"
        fill="url(#letterGradient2)"
        filter="url(#glow)"
        initial={{ opacity: 0, scale: 0, rotate: 180 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ delay: 1.3, duration: 0.4, type: 'spring', stiffness: 200 }}
      >
        <motion.tspan
          animate={{ x: [0, 2, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          U
        </motion.tspan>
      </motion.text>
      
      <motion.text
        x="82" y="96"
        fontSize="20"
        fontWeight="900"
        fill="url(#letterGradient2)"
        filter="url(#glow)"
        initial={{ opacity: 0, scale: 0, rotate: 180 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ delay: 1.5, duration: 0.4, type: 'spring', stiffness: 200 }}
      >
        <motion.tspan
          animate={{ x: [0, 2, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: 0.3, ease: "easeInOut" }}
        >
          I
        </motion.tspan>
      </motion.text>
      
      <motion.text
        x="82" y="128"
        fontSize="20"
        fontWeight="900"
        fill="url(#letterGradient2)"
        filter="url(#glow)"
        initial={{ opacity: 0, scale: 0, rotate: 180 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ delay: 1.7, duration: 0.4, type: 'spring', stiffness: 200 }}
      >
        <motion.tspan
          animate={{ x: [0, 2, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: 0.6, ease: "easeInOut" }}
        >
          Z
        </motion.tspan>
      </motion.text>

      {/* Horizontal Word "FUN" with scale and rotate effect */}
      <motion.text
        x="18" y="64"
        fontSize="20"
        fontWeight="900"
        fill="url(#letterGradient3)"
        filter="url(#glow)"
        initial={{ opacity: 0, scale: 0, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 1.9, duration: 0.4, type: 'spring', stiffness: 200 }}
      >
        <motion.tspan
          animate={{ 
            scale: [1, 1.15, 1],
            rotate: [0, 5, 0]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          F
        </motion.tspan>
      </motion.text>
      
      <motion.text
        x="50" y="64"
        fontSize="20"
        fontWeight="900"
        fill="url(#letterGradient3)"
        filter="url(#glow)"
        initial={{ opacity: 0, scale: 0, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 2.1, duration: 0.4, type: 'spring', stiffness: 200 }}
      >
        <motion.tspan
          animate={{ 
            scale: [1, 1.15, 1],
            rotate: [0, -5, 0]
          }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.3, ease: "easeInOut" }}
        >
          U
        </motion.tspan>
      </motion.text>
      
      <motion.text
        x="82" y="64"
        fontSize="20"
        fontWeight="900"
        fill="url(#letterGradient3)"
        filter="url(#glow)"
        initial={{ opacity: 0, scale: 0, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 2.3, duration: 0.4, type: 'spring', stiffness: 200 }}
      >
        <motion.tspan
          animate={{ 
            scale: [1, 1.15, 1],
            rotate: [0, 5, 0]
          }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.6, ease: "easeInOut" }}
        >
          N
        </motion.tspan>
      </motion.text>

      {/* Sparkle effects in corners */}
      <motion.circle
        cx="26" cy="26"
        r="2"
        fill="#FFD700"
        animate={{
          scale: [0, 1.5, 0],
          opacity: [0, 1, 0]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          delay: 1,
          ease: "easeInOut"
        }}
      />
      <motion.circle
        cx="134" cy="26"
        r="2"
        fill="#FFD700"
        animate={{
          scale: [0, 1.5, 0],
          opacity: [0, 1, 0]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          delay: 1.5,
          ease: "easeInOut"
        }}
      />
      <motion.circle
        cx="26" cy="134"
        r="2"
        fill="#FFD700"
        animate={{
          scale: [0, 1.5, 0],
          opacity: [0, 1, 0]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          delay: 2,
          ease: "easeInOut"
        }}
      />
      <motion.circle
        cx="134" cy="134"
        r="2"
        fill="#FFD700"
        animate={{
          scale: [0, 1.5, 0],
          opacity: [0, 1, 0]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          delay: 2.5,
          ease: "easeInOut"
        }}
      />

      {/* Additional sparkle effects for more magic */}
      <motion.circle
        cx="80" cy="80"
        r="1.5"
        fill="#FFF"
        animate={{
          scale: [0, 2, 0],
          opacity: [0, 0.8, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          delay: 0.5,
          ease: "easeInOut"
        }}
      />
    </svg>
  );
};

export default CrosswordAnimation;