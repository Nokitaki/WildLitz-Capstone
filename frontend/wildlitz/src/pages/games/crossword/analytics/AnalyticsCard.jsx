// ✅ UPDATE AnalyticsCard.jsx or wherever accuracy is displayed

import React from 'react';

const AnalyticsCard = ({ gameData }) => {
  // ✅ NEW: Calculate accuracy from question stats
  const calculateAccuracy = () => {
    const questionStats = gameData?.questionStats || {};
    const questions = Object.values(questionStats);
    
    if (questions.length === 0) return 0;
    
    // Sum up all scores
    const totalScore = questions.reduce((sum, q) => sum + (q.score || 0), 0);
    
    // Calculate percentage
    const accuracy = (totalScore / (questions.length * 100)) * 100;
    
    return Math.round(accuracy * 10) / 10;
  };

  const accuracy = calculateAccuracy();

  return (
    <div className="analytics-card">
      <div className="accuracy-section">
        <div className="icon">🎯</div>
        <div className="value">{accuracy}%</div>
        <div className="label">ACCURACY</div>
      </div>
      
      {/* Show breakdown */}
      <div className="accuracy-breakdown">
        <p className="breakdown-title">Question Performance:</p>
        <ul>
          {Object.entries(gameData?.questionStats || {}).map(([word, stats]) => (
            <li key={word}>
              <strong>{word}</strong>: {stats.attempts} {stats.attempts === 1 ? 'try' : 'tries'} 
              - <span style={{color: stats.score >= 70 ? 'green' : stats.score >= 50 ? 'orange' : 'red'}}>
                {stats.score}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AnalyticsCard;

// ✅ Accuracy Formula Reference:
// - First try correct:  100%
// - Second try correct:  50%
// - Third try correct:   25%
// - Fourth+ try:          0%
// 
// Example: 10 questions
// - 7 correct on first try  = 7 × 100% = 700
// - 2 correct on second try = 2 × 50%  = 100
// - 1 correct on third try  = 1 × 25%  = 25
// Total = 825 / 1000 = 82.5%