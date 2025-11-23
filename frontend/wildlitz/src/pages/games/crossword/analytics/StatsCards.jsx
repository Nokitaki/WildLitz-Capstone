// StatsCards.jsx - Statistics overview cards
import React from 'react';
import { motion } from 'framer-motion';
import { formatDuration } from '../analytics/analyticsUtils';

const StatCard = ({ icon, value, label, gradient }) => (
  <motion.div 
    whileHover={{ scale: 1.05 }} 
    style={{
      background: 'white',
      borderRadius: '15px',
      padding: '25px',
      boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '20px'
    }}
  >
    <div style={{
      background: gradient,
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.8rem'
    }}>
      {icon}
    </div>
    <div>
      <h3 style={{ 
        fontSize: '2rem', 
        fontWeight: 700, 
        margin: '0 0 5px 0', 
        color: '#333' 
      }}>
        {value}
      </h3>
      <p style={{ 
        fontSize: '0.9rem', 
        color: '#666', 
        margin: 0, 
        textTransform: 'uppercase', 
        fontWeight: 500 
      }}>
        {label}
      </p>
    </div>
  </motion.div>
);

const StatsCards = ({ analytics }) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
      marginBottom: '30px'
    }}>
      <StatCard
        icon="🎮"
        value={analytics?.total_sessions || 0}
        label="Games Played"
        gradient="linear-gradient(135deg, #667eea, #764ba2)"
      />
      
      <StatCard
        icon="📚"
        value={analytics?.total_words_solved || 0}
        label="Words Mastered"
        gradient="linear-gradient(135deg, #f093fb, #f5576c)"
      />
      
      <StatCard
        icon="📖"
        value={analytics?.total_episodes_completed || 0}
        label="Episodes Completed"
        gradient="linear-gradient(135deg, #4facfe, #00f2fe)"
      />
      
      <StatCard
        icon="⏱️"
        value={formatDuration(analytics?.avg_session_duration_seconds || 0)}
        label="Avg Time/Game"
        gradient="linear-gradient(135deg, #fa709a, #fee140)"
      />
    </div>
  );
};

export default StatsCards;