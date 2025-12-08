

import React from 'react';

const AnalyticsCard = ({ gameData }) => {
 
  const calculateAccuracy = () => {
    const questionStats = gameData?.questionStats || {};
    const questions = Object.values(questionStats);
    
    if (questions.length === 0) return 0;
    
   
    const totalScore = questions.reduce((sum, q) => sum + (q.score || 0), 0);
    
   
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

