// SummaryScreen.jsx - Replace your existing file with this
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../../styles/games/crossword/SummaryScreen.module.css';

const SummaryScreen = ({ 
  solvedWords = [], 
  isStoryMode = false,
  storySegment = null,
  currentEpisode = 1,
  totalEpisodes = 1,
  hasNextEpisode = false,
  onPlayAgain,
  onReturnToMenu,
  theme = "adventure"
}) => {
  const [selectedWord, setSelectedWord] = useState(null);
  const [storyRating, setStoryRating] = useState(0);
  const [wordRatings, setWordRatings] = useState({});
  const [selectedActivity, setSelectedActivity] = useState(null);

  // Fun emojis for each word based on theme
  const getWordEmoji = (word) => {
    const emojiMap = {
      'adventure': '🗺️', 'explore': '🔍', 'brave': '🦁', 'mystery': '🔮',
      'treasure': '💎', 'journey': '🚶', 'discover': '⭐', 'friend': '🤝',
      'help': '🤲', 'run': '🏃', 'jump': '🦘', 'find': '🔎',
      'look': '👀', 'walk': '🚶', 'play': '🎮', 'learn': '📚'
    };
    return emojiMap[word.toLowerCase()] || '✨';
  };

  const achievements = [
    { icon: "🎯", title: "Word Master", description: `Solved ${solvedWords.length} words!` },
    { icon: "⚡", title: "Speed Star", description: "Fast learner!" },
    { icon: "🏆", title: "Champion", description: "Episode complete!" }
  ];

  const activities = [
    { 
      icon: "🎨", 
      title: "Draw Your Favorite Scene",
      action: "draw",
      gradient: "from-pink-400 to-purple-400"
    },
    { 
      icon: "🎭", 
      title: "Act Out a Word",
      action: "act",
      gradient: "from-blue-400 to-cyan-400"
    },
    { 
      icon: "✍️", 
      title: "Write Your Own Ending",
      action: "write",
      gradient: "from-green-400 to-emerald-400"
    },
    { 
      icon: "🎵", 
      title: "Make a Word Song",
      action: "sing",
      gradient: "from-orange-400 to-yellow-400"
    }
  ];

  const handleWordRating = (word, rating) => {
    setWordRatings({ ...wordRatings, [word]: rating });
  };

  const handleActivityClick = (action) => {
    setSelectedActivity(action);
    // Here you could trigger different actions based on the activity
    console.log(`Activity selected: ${action}`);
  };

  return (
    <div className={styles.summaryContainer} style={{ position: 'relative' }}>
      <div className={styles.summaryCard}>
        
        {/* ===== CELEBRATION HEADER ===== */}
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
          className={styles.celebrationHeader}
        >
          {/* Confetti Animation */}
          <div className={styles.confettiContainer}>
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 500, opacity: [0, 1, 0] }}
                transition={{ 
                  delay: i * 0.2, 
                  duration: 3, 
                  repeat: Infinity,
                  repeatDelay: 2 
                }}
                className={styles.confetti}
                style={{ left: `${Math.random() * 100}%` }}
              >
                {['⭐', '🎉', '✨', '🌟'][Math.floor(Math.random() * 4)]}
              </motion.div>
            ))}
          </div>
          
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={styles.trophyIcon}
          >
            🏆
          </motion.div>
          <h1 className={styles.celebrationTitle}>You're AMAZING!</h1>
          <p className={styles.celebrationSubtitle}>
            🎯 You learned {solvedWords.length} super words!
          </p>
        </motion.div>

        {/* ===== ACHIEVEMENT BADGES ===== */}
        <div className={styles.achievementsGrid}>
          {achievements.map((achievement, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: index * 0.2, type: "spring" }}
              className={styles.achievementBadge}
              whileHover={{ scale: 1.1 }}
            >
              <div className={styles.achievementIcon}>{achievement.icon}</div>
              <h3 className={styles.achievementTitle}>{achievement.title}</h3>
              <p className={styles.achievementDesc}>{achievement.description}</p>
            </motion.div>
          ))}
        </div>

        {/* ===== STORY RATING ===== */}
        {isStoryMode && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.storyRatingSection}
          >
            <h2 className={styles.ratingTitle}>
              🌟 How was today's story? 🌟
            </h2>
            <div className={styles.starRating}>
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  whileHover={{ scale: 1.3 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setStoryRating(star)}
                  className={styles.starButton}
                >
                  <span className={star <= storyRating ? styles.starFilled : styles.starEmpty}>
                    ⭐
                  </span>
                </motion.button>
              ))}
            </div>
            {storyRating > 0 && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={styles.ratingFeedback}
              >
                {storyRating === 5 ? "🎉 WOW! You LOVED it!" : 
                 storyRating === 4 ? "😊 That's great!" :
                 storyRating === 3 ? "👍 Pretty good!" :
                 "Thanks for sharing! 💜"}
              </motion.p>
            )}
          </motion.div>
        )}

        {/* ===== SUPER WORDS SECTION ===== */}
        <div className={styles.superWordsSection}>
          <h2 className={styles.superWordsTitle}>
            ✨ Your Super Words! ✨
          </h2>
          <div className={styles.wordsGrid}>
            {solvedWords.map((wordData, index) => (
              <motion.div
                key={index}
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.15 }}
                className={styles.wordCard}
                onClick={() => setSelectedWord(selectedWord === wordData.word ? null : wordData.word)}
                whileHover={{ scale: 1.03 }}
              >
                <div className={styles.wordCardContent}>
                  <motion.div 
                    className={styles.wordEmoji}
                    animate={{ rotate: selectedWord === wordData.word ? 360 : 0 }}
                  >
                    {getWordEmoji(wordData.word)}
                  </motion.div>
                  <div className={styles.wordInfo}>
                    <h3 className={styles.wordTitle}>{wordData.word}</h3>
                    <p className={styles.wordDefinition}>
                      {wordData.definition || "A super important word!"}
                    </p>
                  </div>
                  
                  {/* Heart rating for each word */}
                  <div className={styles.wordHearts}>
                    {[1, 2, 3].map((level) => (
                      <button
                        key={level}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWordRating(wordData.word, level);
                        }}
                        className={styles.heartButton}
                      >
                        <span className={level <= (wordRatings[wordData.word] || 0) ? styles.heartFilled : styles.heartEmpty}>
                          💜
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Activities section removed per user request */}

        {/* ===== ACTION BUTTONS ===== */}
        <div className={styles.actionButtonsContainer}>
          {hasNextEpisode && currentEpisode < totalEpisodes ? (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onPlayAgain}
              className={styles.nextEpisodeButton}
            >
              ▶️ Continue to Episode {currentEpisode + 1}!
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onReturnToMenu}
              className={styles.nextEpisodeButton}
            >
              🎮 Create New Story
            </motion.button>
          )}
          
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onReturnToMenu}
            className={styles.mainMenuButton}
          >
            🏠 Main Menu
          </motion.button>
        </div>

        {/* ===== MOTIVATIONAL FOOTER ===== */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={styles.motivationalFooter}
        >
          🌟 Keep being awesome! 🌟
        </motion.div>
      </div>
    </div>
  );
};

export default SummaryScreen;