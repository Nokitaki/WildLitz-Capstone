// api/generateStory.js
const express = require('express');
const router = express.Router();
const { Configuration, OpenAIApi } = require("openai");

// Initialize OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Helper function to create a crossword puzzle from vocabulary words
const generateCrosswordPuzzle = async (words) => {
  // This is a simplified version - a real implementation would use
  // an algorithm to create interlocking words
  const grid = [];
  const puzzleWords = [];
  
  // Process each word to create puzzle data
  words.forEach((wordData, index) => {
    const { word, clue, definition } = wordData;
    
    // In a real implementation, you would:
    // 1. Calculate word positions in the grid
    // 2. Create the crossword grid layout
    // 3. Determine which words cross with each other
    
    // For this example, we'll just add basic word data
    puzzleWords.push({
      direction: index % 2 === 0 ? "across" : "down",
      number: index + 1,
      clue: clue,
      answer: word.toUpperCase(),
      definition: definition,
      example: `Example sentence using the word ${word.toLowerCase()}.`
    });
  });
  
  return {
    size: { width: 10, height: 10 },
    grid: grid,
    words: puzzleWords
  };
};

// Generate story with AI
router.post('/generate-story', async (req, res) => {
  try {
    const { 
      theme, 
      focusSkills, 
      characterNames, 
      episodeCount,
      gradeLevel 
    } = req.body;
    
    // Validate inputs
    if (!theme || !Array.isArray(focusSkills) || !episodeCount) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }
    
    // Create the AI prompt
    const skillsText = focusSkills.join(', ');
    const charactersText = characterNames ? `using these character names: ${characterNames}` : '';
    
    const prompt = `Create a ${episodeCount}-episode story for grade ${gradeLevel} students about a ${theme} theme. 
    ${charactersText}
    
    Each episode should:
    - Be 3-4 paragraphs long
    - Be appropriate for ${gradeLevel}rd grade readers
    - Include age-appropriate vocabulary focusing on ${skillsText}
    - Include 5 vocabulary words that would work well in a crossword puzzle
    - Have 3-4 discussion questions for classroom conversation
    
    Format your response as a JSON object with the following structure:
    {
      "title": "Story Title",
      "description": "Brief description",
      "episodes": [
        {
          "title": "Episode Title",
          "text": "Episode text here...",
          "recap": "Brief summary of this episode",
          "discussionQuestions": ["Question 1", "Question 2", "Question 3"],
          "vocabularyWords": [
            {"word": "word1", "clue": "crossword clue", "definition": "kid-friendly definition"}
          ]
        }
      ]
    }`;
    
    // Call OpenAI API
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {"role": "system", "content": "You are an educational content creator specializing in creating engaging, age-appropriate stories for elementary school students."},
        {"role": "user", "content": prompt}
      ],
      temperature: 0.7,
      max_tokens: 2500
    });
    
    // Parse the response
    const responseText = completion.data.choices[0].message.content;
    let storyData;
    
    try {
      storyData = JSON.parse(responseText);
    } catch (error) {
      // Handle JSON parsing errors by extracting JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        storyData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse story data from AI response');
      }
    }
    
    // Generate crossword puzzles for each episode
    const storyAdventure = {
      id: `generated_${Date.now()}`,
      title: storyData.title,
      description: storyData.description,
      gradeLevel: `Grade ${gradeLevel}`,
      readingLevel: "Early Chapter Book",
      episodes: []
    };
    
    // Create puzzle data for each episode
    const puzzles = {};
    
    for (let i = 0; i < storyData.episodes.length; i++) {
      const episode = storyData.episodes[i];
      const episodeId = `${theme}_generated_ep${i+1}`;
      const puzzleId = `${episodeId}_puzzle`;
      
      // Generate puzzle for this episode
      puzzles[puzzleId] = await generateCrosswordPuzzle(episode.vocabularyWords);
      
      // Add to story adventure
      storyAdventure.episodes.push({
        id: episodeId,
        episodeNumber: i + 1,
        title: episode.title,
        text: episode.text,
        recap: episode.recap || episode.text.substring(0, 100) + "...",
        discussionQuestions: episode.discussionQuestions,
        crosswordPuzzleId: puzzleId,
        vocabularyFocus: episode.vocabularyWords.map(w => w.word)
      });
    }
    
    // Return both the story and puzzles
    res.json({
      story: storyAdventure,
      puzzles: puzzles
    });
    
  } catch (error) {
    console.error('Error generating story:', error);
    res.status(500).json({ message: 'Failed to generate story', error: error.message });
  }
});

module.exports = router;