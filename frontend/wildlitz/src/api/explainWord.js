// api/explainWord.js
const express = require('express');
const router = express.Router();
const { Configuration, OpenAIApi } = require("openai");

// Initialize OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Explain a word in kid-friendly terms
router.post('/explain-word', async (req, res) => {
  try {
    const { word, storyContext, grade = 3 } = req.body;
    
    if (!word) {
      return res.status(400).json({ message: 'Missing word parameter' });
    }
    
    // Create a prompt based on the grade level
    const prompt = `Explain the word "${word}" in a way that's easy for a ${grade}rd grade student to understand.
    ${storyContext ? `The word appears in this context: "${storyContext}"` : ''}
    
    Format your response as a JSON object with:
    {
      "definition": "A simple, clear definition that a child would understand.",
      "example": "A simple sentence using the word.",
      "visualization": "A description of what the word looks like or reminds you of. This should help the student visualize the concept."
    }`;
    
    // Call OpenAI API
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {"role": "system", "content": "You are a friendly, helpful reading tutor for elementary school students. You explain words in simple, clear language with relatable examples."},
        {"role": "user", "content": prompt}
      ],
      temperature: 0.7,
      max_tokens: 300
    });
    
    // Parse the response
    const responseText = completion.data.choices[0].message.content;
    let wordData;
    
    try {
      wordData = JSON.parse(responseText);
    } catch (error) {
      // Handle JSON parsing errors by extracting JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        wordData = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback to a simple structure if parsing fails
        wordData = {
          definition: `The word "${word}" means something that ${responseText.substring(0, 100)}...`,
          example: `An example sentence would be: "The ${word} was very interesting."`,
          visualization: null
        };
      }
    }
    
    // Add a placeholder image URL
    // In a real app, this would use image generation or a database of educational images
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
    
    // Add the image URL
    wordData.visualization = placeholderIcons[category];
    
    res.json(wordData);
    
  } catch (error) {
    console.error('Error explaining word:', error);
    res.status(500).json({ message: 'Failed to explain word', error: error.message });
  }
});

module.exports = router;