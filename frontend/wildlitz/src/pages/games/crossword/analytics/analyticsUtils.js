// analyticsUtils.js - Helper functions for analytics dashboard

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
};

export const getDifficultyColor = (score) => {
  if (score >= 15) return '#f44336'; // Very Hard
  if (score >= 10) return '#ff9800'; // Hard
  if (score >= 5) return '#ffc107';  // Medium
  return '#4caf50'; // Easy
};

export const getDifficultyLabel = (score) => {
  if (score >= 15) return '🔥 Very Hard';
  if (score >= 10) return '⚠️ Hard';
  if (score >= 5) return '⚡ Medium';
  return '✅ Easy';
};

export const getWordLengthBadge = (wordLength) => {
  if (wordLength <= 3) return { text: 'Short', color: '#4caf50' };
  if (wordLength <= 5) return { text: 'Medium', color: '#ffc107' };
  if (wordLength <= 7) return { text: 'Long', color: '#ff9800' };
  return { text: 'Very Long', color: '#f44336' };
};

export const filterAndSortWords = (words, filterType) => {
  let sorted = [...words];
  
  switch (filterType) {
    case 'time':
      sorted.sort((a, b) => (b.avg_time_seconds || 0) - (a.avg_time_seconds || 0));
      break;
    case 'length':
      sorted.sort((a, b) => (b.word_length || b.word.length) - (a.word_length || a.word.length));
      break;
    case 'hints':
      sorted.sort((a, b) => (b.avg_hints || 0) - (a.avg_hints || 0));
      break;
    case 'difficulty':
      sorted.sort((a, b) => (b.difficulty_score || 0) - (a.difficulty_score || 0));
      break;
    default:
      sorted.sort((a, b) => (b.difficulty_score || 0) - (a.difficulty_score || 0));
  }
  
  return sorted.slice(0, 10);
};