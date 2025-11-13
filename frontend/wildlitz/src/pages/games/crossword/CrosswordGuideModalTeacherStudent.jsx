// src/components/crossword/CrosswordGuideModalTeacherStudent.jsx
// VERSION with separate instructions for Teachers and Students

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import styles from './CrosswordGuideModal.module.css';

const CrosswordGuideModalTeacherStudent = ({ 
  onStart, 
  onSkip, 
  storyContext,
  userRole = 'student' // 'teacher' or 'student'
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Student Instructions
  const studentInstructions = [
    {
      icon: '📖',
      title: 'Read the Clues',
      description: 'Each clue helps you find a word from the story. Read them carefully!'
    },
    {
      icon: '🎯',
      title: 'Select a Clue',
      description: 'Click on any clue to see the answer choices for that word.'
    },
    {
      icon: '✅',
      title: 'Choose Your Answer',
      description: 'Pick the correct word from the multiple choice options.'
    },
    {
      icon: '🧩',
      title: 'Fill the Grid',
      description: 'Watch the word appear in the crossword grid when you get it right!'
    },
    {
      icon: '💡',
      title: 'Use Hints Wisely',
      description: 'If you\'re stuck, use a hint to reveal a letter in the word.'
    },
    {
      icon: '🎉',
      title: 'Complete All Words',
      description: 'Solve all the clues to finish the puzzle and continue the story!'
    }
  ];

  // Teacher Instructions
  const teacherInstructions = [
    {
      icon: '👀',
      title: 'Observe Student Progress',
      description: 'Watch how students approach each clue and track their problem-solving strategies.'
    },
    {
      icon: '💬',
      title: 'Guide, Don\'t Tell',
      description: 'Ask guiding questions rather than giving direct answers. Help them think critically.'
    },
    {
      icon: '📊',
      title: 'Monitor Comprehension',
      description: 'Check if students understand the story context and vocabulary being reinforced.'
    },
    {
      icon: '🎯',
      title: 'Track Hint Usage',
      description: 'Note when students use hints - it indicates areas where they need more support.'
    },
    {
      icon: '⏱️',
      title: 'Pace Appropriately',
      description: 'Allow students time to think. Don\'t rush them through the learning process.'
    },
    {
      icon: '🌟',
      title: 'Celebrate Success',
      description: 'Acknowledge correct answers and effort. Positive reinforcement boosts confidence!'
    }
  ];

  // Student Tips
  const studentTips = [
    'Start with the clues you know best',
    'Think about words from the story you just read',
    'Save your hints for the harder clues',
    'Take your time - there\'s no rush!'
  ];

  // Teacher Tips
  const teacherTips = [
    'Encourage students to read the story carefully before starting',
    'Have students explain their reasoning for each answer',
    'Use incorrect answers as teaching moments',
    'Connect vocabulary back to the story context',
    'Consider pairing struggling students with confident readers'
  ];

  const instructions = userRole === 'teacher' ? teacherInstructions : studentInstructions;
  const tips = userRole === 'teacher' ? teacherTips : studentTips;
  const title = userRole === 'teacher' ? 'Teacher Guide: Crossword Activity' : 'How to Play Crossword';

  const handleStart = () => {
    if (dontShowAgain) {
      localStorage.setItem(`wildlitz_crossword_guide_seen_${userRole}`, 'true');
    }
    onStart();
  };

  const handleSkip = () => {
    if (dontShowAgain) {
      localStorage.setItem(`wildlitz_crossword_guide_seen_${userRole}`, 'true');
    }
    onSkip();
  };

  return (
    <div className={styles.overlay}>
      <motion.div 
        className={styles.modal}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.iconContainer}>
            <span className={styles.mainIcon}>
              {userRole === 'teacher' ? '👨‍🏫' : '🧩'}
            </span>
          </div>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>
            {userRole === 'teacher' 
              ? 'Guide your students through this engaging literacy activity'
              : 'Let\'s solve this puzzle together and continue the adventure!'
            }
          </p>
        </div>

        {/* Instructions Grid */}
        <div className={styles.instructionsGrid}>
          {instructions.map((instruction, index) => (
            <motion.div
              key={index}
              className={styles.instructionCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={styles.stepNumber}>{index + 1}</div>
              <div className={styles.instructionIcon}>{instruction.icon}</div>
              <h3 className={styles.instructionTitle}>{instruction.title}</h3>
              <p className={styles.instructionDesc}>{instruction.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Tips Section */}
        <div className={styles.tipsSection}>
          <h3 className={styles.tipsTitle}>
            {userRole === 'teacher' ? '📝 Teaching Tips:' : '💫 Pro Tips:'}
          </h3>
          <ul className={styles.tipsList}>
            {tips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>

        {/* "Don't show again" Checkbox */}
        <div className={styles.checkboxContainer}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className={styles.checkbox}
            />
            <span>Don't show this guide again</span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className={styles.buttonContainer}>
          <motion.button
            className={styles.skipButton}
            onClick={handleSkip}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Skip Guide
          </motion.button>
          <motion.button
            className={styles.startButton}
            onClick={handleStart}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {userRole === 'teacher' ? 'Start Activity 🎓' : 'Start Puzzle! 🚀'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default CrosswordGuideModalTeacherStudent;


