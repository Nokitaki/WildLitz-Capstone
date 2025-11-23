// ChallengingWordsSection.jsx - Top 10 challenging words with filters
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getDifficultyColor, 
  getDifficultyLabel, 
  getWordLengthBadge,
  filterAndSortWords 
} from './analyticsUtils';

const FilterButton = ({ filter, currentFilter, onClick }) => (
  <button
    onClick={() => onClick(filter.key)}
    style={{
      padding: '10px 20px',
      borderRadius: '10px',
      border: currentFilter === filter.key ? '2px solid #9c27b0' : '2px solid #e0e0e0',
      background: currentFilter === filter.key ? '#9c27b0' : 'white',
      color: currentFilter === filter.key ? 'white' : '#333',
      cursor: 'pointer',
      fontSize: '0.95rem',
      fontWeight: 600,
      transition: 'all 0.2s',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px'
    }}
    title={filter.desc}
  >
    <span>{filter.label}</span>
    <span style={{
      fontSize: '0.7rem',
      opacity: 0.8,
      fontWeight: 400
    }}>
      {filter.desc}
    </span>
  </button>
);

const WordCard = ({ wordStat, index }) => {
  const lengthBadge = getWordLengthBadge(wordStat.word_length || wordStat.word.length);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)',
        borderRadius: '12px',
        padding: '15px',
        border: '2px solid #e0e0e0',
        borderLeft: `4px solid ${getDifficultyColor(wordStat.difficulty_score)}`
      }}
    >
      {/* Rank Badge */}
      <div style={{
        position: 'absolute',
        top: '-10px',
        right: '10px',
        background: index < 3 ? 
          (index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32') : 
          '#9c27b0',
        color: 'white',
        width: '30px',
        height: '30px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.85rem',
        fontWeight: 'bold',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      }}>
        #{index + 1}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '8px'
      }}>
        <div style={{
          fontSize: '1.2rem',
          fontWeight: 700,
          color: '#333',
          textTransform: 'capitalize'
        }}>
          {wordStat.word}
        </div>
        <div style={{
          padding: '2px 8px',
          background: lengthBadge.color,
          color: 'white',
          borderRadius: '6px',
          fontSize: '0.7rem',
          fontWeight: 600
        }}>
          {lengthBadge.text}
        </div>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        fontSize: '0.85rem',
        color: '#666'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>⏱️ Avg Time:</span>
          <strong>{wordStat.avg_time_seconds || 0}s</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>💡 Avg Hints:</span>
          <strong>{wordStat.avg_hints || 0}</strong>
        </div>
        <div 
          style={{ display: 'flex', justifyContent: 'space-between' }}
          title="Number of times this word appeared in different episodes"
        >
          <span>📊 Appearances:</span>
          <strong>{wordStat.attempts || 1}</strong>
        </div>
      </div>

      <div style={{
        marginTop: '10px',
        padding: '6px 12px',
        background: getDifficultyColor(wordStat.difficulty_score),
        color: 'white',
        borderRadius: '6px',
        fontSize: '0.75rem',
        fontWeight: 600,
        textAlign: 'center'
      }}>
        {getDifficultyLabel(wordStat.difficulty_score)}
      </div>
    </motion.div>
  );
};

const ChallengingWordsSection = ({ wordPerformance }) => {
  const [showChallengingWords, setShowChallengingWords] = useState(false);
  const [wordFilter, setWordFilter] = useState('difficulty');

  const filters = [
    { key: 'difficulty', label: '🔥 Difficulty', desc: 'Overall difficulty score' },
    { key: 'time', label: '⏱️ Time', desc: 'Average time to solve' },
    { key: 'length', label: '📏 Length', desc: 'Word letter count' },
    { key: 'hints', label: '💡 Hints', desc: 'Average hints used' }
  ];

  const getFilterLabel = () => {
    switch (wordFilter) {
      case 'time': return 'Average Time';
      case 'length': return 'Word Length';
      case 'hints': return 'Hints Used';
      default: return 'Difficulty Score';
    }
  };

  if (!wordPerformance || wordPerformance.length === 0) return null;

  return (
    <div style={{
      background: 'white',
      borderRadius: '20px',
      padding: '30px',
      marginBottom: '30px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
    }}>
      <button
        onClick={() => setShowChallengingWords(!showChallengingWords)}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          padding: '0',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: showChallengingWords ? '20px' : '0'
        }}
      >
        <div>
          <h3 style={{
            fontSize: '1.8rem',
            fontWeight: 700,
            color: '#333',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textAlign: 'left'
          }}>
            🎯 Most Challenging Words (Top 10)
          </h3>
          {!showChallengingWords && (
            <p style={{ 
              color: '#666', 
              margin: '8px 0 0 0', 
              fontSize: '0.95rem',
              textAlign: 'left'
            }}>
              Words requiring most time, hints, or difficulty
            </p>
          )}
        </div>
        <span style={{
          fontSize: '1.5rem',
          transform: showChallengingWords ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease',
          color: '#9c27b0'
        }}>
          ▼
        </span>
      </button>

      <AnimatePresence>
        {showChallengingWords && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            {/* Filter Buttons */}
            <div style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '20px',
              flexWrap: 'wrap'
            }}>
              {filters.map(filter => (
                <FilterButton
                  key={filter.key}
                  filter={filter}
                  currentFilter={wordFilter}
                  onClick={setWordFilter}
                />
              ))}
            </div>

            <p style={{ 
              color: '#666', 
              marginBottom: '20px', 
              fontSize: '0.95rem' 
            }}>
              Sorted by: <strong>{getFilterLabel()}</strong>
            </p>

            {/* Word Cards Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '15px'
            }}>
              {filterAndSortWords(wordPerformance, wordFilter).map((wordStat, idx) => (
                <WordCard key={idx} wordStat={wordStat} index={idx} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChallengingWordsSection;