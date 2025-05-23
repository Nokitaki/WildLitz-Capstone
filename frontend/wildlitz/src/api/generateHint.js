// api/generateHint.js
const express = require('express');
const router = express.Router();
const { Configuration, OpenAIApi } = require("openai");

// Initialize OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Generate adaptive hints for crossword puzzles
router.post('/generate-hint', async (req, res) => {
  try {
    const { 
      word, 
      definition, 
      clue, 
      storyContext, 
      previousHints = [], 
      attemptCount = 0,
      grade = 3
    } = req.body;
    
    if (!word) {
      return res.status(400).json({ message: 'Missing word parameter' });
    }
    
    // Create prompt for generating hints
    const prompt = `Create a series of 3 progressive hints for a ${grade}rd grade student trying to solve a crossword puzzle with the word "${word}".
    
    Definition: ${definition || 'Not provided'}
    Clue in puzzle: ${clue || 'Not provided'}
    ${storyContext ? `Context from story: "${storyContext}"` : ''}
    Previous hints given: ${previousHints.length > 0 ? JSON.stringify(previousHints) : 'None'}
    Number of incorrect attempts: ${attemptCount}
    
    The hints should:
    1. Start with a gentle hint that gives a clue without giving away too much
    2. For the second hint, reveal the first letter of the word
    3. For the third hint, provide a clear description or example that makes the answer obvious
    
    Format your response as a JSON array of hints:
    [
      {
        "level": 1,
        "text": "First hint text here",
        "type": "clue"
      },
      {
        "level": 2,
        "text": "Second hint text here (including the first letter)",
        "type": "first_letter"
      },
      {
        "level": 3,
        "text": "Third hint text here (making the answer obvious)",
        "type": "obvious"
      }
    ]`;
    
    // Call OpenAI API
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {"role": "system", "content": "You are a helpful educational assistant who creates age-appropriate hints for elementary school students."},
        {"role": "user", "content": prompt}
      ],
      temperature: 0.7,
      max_tokens: 500
    });
    
    // Parse the response
    const responseText = completion.data.choices[0].message.content;
    let hints;
    
    try {
      hints = JSON.parse(responseText);
    } catch (error) {
      // Handle JSON parsing errors by extracting JSON from the response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        hints = JSON.parse(jsonMatch[0]);
      } else {
        // Create fallback hints if parsing fails
        hints = [
          {
            level: 1,
            text: `Think about this clue: ${clue || 'a word related to the story'}`,
            type: "clue"
          },
          {
            level: 2,
            text: `The word starts with the letter "${word[0].toUpperCase()}"`,
            type: "first_letter"
          },
          {
            level: 3,
            text: `The answer is ${word.length} letters long and means ${definition || 'something in the story'}`,
            type: "obvious"
          }
        ];
      }
    }
    
    // Add image URLs for visual hints (in a real app, these would be generated)
    const placeholderIcons = {
      animal: "https://cdn-icons-png.flaticon.com/512/1998/1998627.png",
      place: "https://cdn-icons-png.flaticon.com/512/854/854878.png",
      action: "https://cdn-icons-png.flaticon.com/512/2548/2548374.png",
      object: "https://cdn-icons-png.flaticon.com/512/3437/3437489.png",
      feeling: "https://cdn-icons-png.flaticon.com/512/742/742751.png",
      default: "https://cdn-icons-png.flaticon.com/512/3898/3898082.png"
    };
    
    // Determine the category (very simplified approach)
    let category = 'default';
    const lowerWord = word.toLowerCase();
    if (/cat|dog|bird|animal|tiger|lion|bear|fish/.test(lowerWord)) category = 'animal';
    if (/jump|run|play|throw|catch|swim|fly/.test(lowerWord)) category = 'action';
    if (/happy|sad|angry|scared|excited/.test(lowerWord)) category = 'feeling';
    if (/house|school|park|beach|mountain|jungle/.test(lowerWord)) category = 'place';
    if (/ball|book|car|toy|phone|computer/.test(lowerWord)) category = 'object';
    
    // Add visual hint to the last hint
    if (hints.length >= 3) {
      hints[2].imageUrl = placeholderIcons[category];
    }
    
    res.json({ hints });
    
  } catch (error) {
    console.error('Error generating hints:', error);
    res.status(500).json({ message: 'Failed to generate hints', error: error.message });
  }
});

module.exports = router;