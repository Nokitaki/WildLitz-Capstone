// src/services/crosswordService.js
import axios from 'axios';

// Base URL for the API
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Crossword service functions
const crosswordService = {
  // Generate clues for crossword words
  generateClues: async (words, theme, gradeLevel = 3, storyContext = '') => {
    const response = await axios.post(`${API_BASE_URL}/sentence_formation/generate-clues/`, {
      words,
      theme,
      grade_level: gradeLevel,
      story_context: storyContext
    });
    
    return response.data.clues;
  },
  
  // Generate answer choices for a word
  generateAnswerChoices: async (correctAnswer, theme, gradeLevel = 3, numChoices = 3) => {
    const response = await axios.post(`${API_BASE_URL}/sentence_formation/generate-choices/`, {
      correct_answer: correctAnswer,
      theme,
      grade_level: gradeLevel,
      num_choices: numChoices
    });
    
    return response.data.choices;
  },
  
  // Generate both clues and choices in one call
  generateCrosswordContent: async (words, theme, gradeLevel = 3, storyContext = '') => {
    const response = await axios.post(`${API_BASE_URL}/sentence_formation/generate-crossword-content/`, {
      words,
      theme,
      grade_level: gradeLevel,
      story_context: storyContext
    });
    
    return response.data;
  }
};

export default crosswordService;