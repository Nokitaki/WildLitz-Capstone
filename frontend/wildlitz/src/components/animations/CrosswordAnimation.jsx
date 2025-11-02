// src/components/animations/CrosswordAnimation.jsx - OPTIMIZED
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const CrosswordAnimation = () => {
  // 🔥 OPTIMIZATION: Memoize particles to prevent recreation on every render
  const particles = useMemo(() => 
    Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: Math.random() * 160,
      y: Math.random() * 160,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 2
    })), []
  );

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
        <pattern id="grid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
          <rect width="32" height="32" fill="white" stroke="#e0e0e0" strokeWidth="1"/>
        </pattern>
        
        {/* Simplified gradients without animation */}
        <linearGradient id="letterGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B9D" />
          <stop offset="100%" stopColor="#C644FC" />
        </linearGradient>
        
        <linearGradient id="letterGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ECDC4" />
          <stop offset="100%" stopColor="#556FB5" />
        </linearGradient>
        
        <linearGradient id="letterGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD93D" />
          <stop offset="100%" stopColor="#FF6B6B" />
        </linearGradient>

        {/* Simplified glow filter */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Reduced particle count */}
      {particles.map(p => (
        <motion.circle
          key={p.id}
          cx={p.x}
          cy={p.y}
          r={p.size}
          fill="url(#letterGradient1)"
          opacity="0.2"
          animate={{
            y: [p.y, p.y - 20, p.y],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut"
          }}
        />
      ))}
      
      {/* Simplified background ring */}
      <motion.rect
        x="5" y="5" width="150" height="150"
        fill="none"
        stroke="url(#letterGradient1)"
        strokeWidth="2"
        rx="12"
        opacity="0.3"
        animate={{
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Main Grid */}
      <rect x="10" y="10" width="140" height="140" fill="url(#grid)" rx="8"/>
      
      {/* Simplified cell highlights - No scale animation */}
      <motion.rect
        x="10" y="10" width="32" height="32"
        fill="rgba(255, 107, 157, 0.15)"
        rx="4"
        animate={{ opacity: [0, 0.4, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.rect
        x="42" y="10" width="32" height="32"
        fill="rgba(78, 205, 196, 0.15)"
        rx="4"
        animate={{ opacity: [0, 0.4, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
      />
      <motion.rect
        x="74" y="10" width="32" height="32"
        fill="rgba(255, 217, 61, 0.15)"
        rx="4"
        animate={{ opacity: [0, 0.4, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
      />
      <motion.rect
        x="106" y="10" width="32" height="32"
        fill="rgba(102, 126, 234, 0.15)"
        rx="4"
        animate={{ opacity: [0, 0.4, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
      />

      {/* Cell Numbers */}
      <text x="14" y="22" fontSize="7" fontWeight="bold" fill="#999">1</text>
      <text x="78" y="22" fontSize="7" fontWeight="bold" fill="#999">2</text>
      <text x="14" y="54" fontSize="7" fontWeight="bold" fill="#999">3</text>

      {/* Simplified Letters - Horizontal Word "WORD" */}
      <motion.text
        x="18" y="32"
        fontSize="20"
        fontWeight="900"
        fill="url(#letterGradient1)"
        filter="url(#glow)"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      >
        W
      </motion.text>
      
      <motion.text
        x="50" y="32"
        fontSize="20"
        fontWeight="900"
        fill="url(#letterGradient1)"
        filter="url(#glow)"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.3 }}
      >
        O
      </motion.text>
      
      <motion.text
        x="82" y="32"
        fontSize="20"
        fontWeight="900"
        fill="url(#letterGradient1)"
        filter="url(#glow)"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7, duration: 0.3 }}
      >
        R
      </motion.text>
      
      <motion.text
        x="114" y="32"
        fontSize="20"
        fontWeight="900"
        fill="url(#letterGradient1)"
        filter="url(#glow)"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.3 }}
      >
        D
      </motion.text>

      {/* Vertical Word "QUIZ" */}
      <motion.text
        x="82" y="64"
        fontSize="20"
        fontWeight="900"
        fill="url(#letterGradient2)"
        filter="url(#glow)"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.9, duration: 0.3 }}
      >
        U
      </motion.text>
      
      <motion.text
        x="82" y="96"
        fontSize="20"
        fontWeight="900"
        fill="url(#letterGradient2)"
        filter="url(#glow)"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.0, duration: 0.3 }}
      >
        I
      </motion.text>
      
      <motion.text
        x="82" y="128"
        fontSize="20"
        fontWeight="900"
        fill="url(#letterGradient2)"
        filter="url(#glow)"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.1, duration: 0.3 }}
      >
        Z
      </motion.text>

      {/* Horizontal Word "FUN" */}
      <motion.text
        x="18" y="64"
        fontSize="20"
        fontWeight="900"
        fill="url(#letterGradient3)"
        filter="url(#glow)"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.2, duration: 0.3 }}
      >
        F
      </motion.text>
      
      <motion.text
        x="50" y="64"
        fontSize="20"
        fontWeight="900"
        fill="url(#letterGradient3)"
        filter="url(#glow)"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.3, duration: 0.3 }}
      >
        U
      </motion.text>
      
      <motion.text
        x="82" y="64"
        fontSize="20"
        fontWeight="900"
        fill="url(#letterGradient3)"
        filter="url(#glow)"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.4, duration: 0.3 }}
      >
        N
      </motion.text>

      {/* Reduced sparkles - only 2 instead of 5 */}
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
          delay: 2,
          ease: "easeInOut"
        }}
      />
    </svg>
  );
};

export default CrosswordAnimation;