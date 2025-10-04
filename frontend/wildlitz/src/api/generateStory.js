// api/generateStory.js (or routes/generateStory.js)
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
  const puzzleWords = [];
  
  words.forEach((wordData, index) => {
    const { word, clue, definition } = wordData;
    
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
    title: `Vocabulary Puzzle`,
    size: { width: 10, height: 10 },
    grid: [],
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
    
    console.log('📚 Story generation request:', { theme, episodeCount, gradeLevel });
    
    // Validate inputs
    if (!theme || !Array.isArray(focusSkills) || !episodeCount) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }
    
    // Create the AI prompt
    const skillsText = focusSkills.join(', ');
    const charactersText = characterNames ? `using these character names: ${characterNames}` : '';
    
    // 🔥 IMPROVED PROMPT - More explicit about episode count
    const prompt = `Create EXACTLY ${episodeCount} episodes for a story for grade ${gradeLevel} students about a ${theme} theme. 
${charactersText}

CRITICAL: You MUST create exactly ${episodeCount} complete episodes. Do not create fewer.

Each episode should:
- Be 2-3 short paragraphs (100-150 words total)
- Be appropriate for grade ${gradeLevel} readers
- Include age-appropriate vocabulary focusing on ${skillsText}
- Include EXACTLY 5 vocabulary words that work well in a crossword puzzle
- Have 3 discussion questions for classroom conversation
- Continue the story from the previous episode

Format your response as a JSON object with this EXACT structure:
{
  "title": "Story Title",
  "description": "Brief description",
  "episodes": [
    {
      "title": "Episode 1 Title",
      "text": "Episode 1 text (2-3 paragraphs)...",
      "recap": "Brief summary of episode 1",
      "discussionQuestions": ["Question 1?", "Question 2?", "Question 3?"],
      "vocabularyWords": [
        {"word": "word1", "clue": "crossword clue", "definition": "kid-friendly definition"},
        {"word": "word2", "clue": "crossword clue", "definition": "kid-friendly definition"},
        {"word": "word3", "clue": "crossword clue", "definition": "kid-friendly definition"},
        {"word": "word4", "clue": "crossword clue", "definition": "kid-friendly definition"},
        {"word": "word5", "clue": "crossword clue", "definition": "kid-friendly definition"}
      ]
    }
  ]
}

REMEMBER: The episodes array MUST contain exactly ${episodeCount} episode objects! Create all ${episodeCount} episodes now.`;
    
    // 🔥 INCREASED max_tokens based on episode count
    const maxTokens = Math.max(3000, episodeCount * 1200 + 500);
    
    console.log(`🤖 Calling OpenAI with max_tokens: ${maxTokens} for ${episodeCount} episodes`);
    
    // Call OpenAI API
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          "role": "system", 
          "content": "You are an educational content creator. You ALWAYS follow instructions precisely and create the EXACT number of episodes requested. Each response must be valid JSON."
        },
        {
          "role": "user", 
          "content": prompt
        }
      ],
      temperature: 0.7,
      max_tokens: maxTokens
    });
    
    // Parse the response
    const responseText = completion.data.choices[0].message.content;
    console.log('📝 AI Response length:', responseText.length);
    
    let storyData;
    
    try {
      storyData = JSON.parse(responseText);
    } catch (error) {
      console.log('⚠️ JSON parse error, attempting to extract JSON...');
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        storyData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse story data from AI response');
      }
    }
    
    // 🔥 VALIDATE that we got the correct number of episodes
    if (!storyData.episodes || !Array.isArray(storyData.episodes)) {
      throw new Error('AI response does not contain episodes array');
    }
    
    console.log(`✅ AI generated ${storyData.episodes.length} episodes (requested ${episodeCount})`);
    
    if (storyData.episodes.length < episodeCount) {
      console.warn(`⚠️ AI only generated ${storyData.episodes.length} episodes instead of ${episodeCount}`);
    }
    
    // Generate crossword puzzles for each episode
    const storyAdventure = {
      id: `generated_${Date.now()}`,
      title: storyData.title,
      description: storyData.description,
      gradeLevel: `Grade ${gradeLevel}`,
      readingLevel: "Early Chapter Book",
      theme: theme,
      totalEpisodes: storyData.episodes.length,
      episodes: []
    };
    
    // Create puzzle data for each episode
    const puzzles = {};
    
    for (let i = 0; i < storyData.episodes.length; i++) {
      const episode = storyData.episodes[i];
      const episodeId = `${theme}_generated_ep${i+1}`;
      const puzzleId = `${episodeId}_puzzle`;
      
      console.log(`🧩 Creating puzzle ${i+1} for episode: ${episode.title}`);
      
      // Validate vocabulary words
      if (!episode.vocabularyWords || episode.vocabularyWords.length === 0) {
        console.warn(`⚠️ Episode ${i+1} has no vocabulary words, using defaults`);
        episode.vocabularyWords = [
          { word: "adventure", clue: "An exciting journey", definition: "An exciting or unusual experience" },
          { word: "explore", clue: "To discover new places", definition: "To travel through an area to learn about it" },
          { word: "journey", clue: "A long trip", definition: "Traveling from one place to another" },
          { word: "discover", clue: "To find something new", definition: "To find or learn something for the first time" },
          { word: "brave", clue: "Showing courage", definition: "Ready to face danger or difficulties" }
        ];
      }
      
      // Generate puzzle for this episode
      puzzles[puzzleId] = await generateCrosswordPuzzle(episode.vocabularyWords);
      
      // Add to story adventure
      storyAdventure.episodes.push({
        id: episodeId,
        episodeNumber: i + 1,
        title: episode.title,
        text: episode.text,
        recap: episode.recap || episode.text.substring(0, 100) + "...",
        discussionQuestions: episode.discussionQuestions || [
          "What happened in this episode?",
          "How do you think the characters felt?",
          "What do you think will happen next?"
        ],
        crosswordPuzzleId: puzzleId,
        vocabularyFocus: episode.vocabularyWords.map(w => w.word)
      });
    }
    
    console.log(`✅ Story generation complete! ${storyAdventure.episodes.length} episodes created`);
    console.log(`📚 Episode titles:`, storyAdventure.episodes.map(e => e.title));
    
    // Return both the story and puzzles
    res.json({
      story: storyAdventure,
      puzzles: puzzles
    });
    
  } catch (error) {
    console.error('❌ Error generating story:', error);
    res.status(500).json({ 
      message: 'Failed to generate story', 
      error: error.message,
      details: error.toString()
    });
  }
});

module.exports = router;