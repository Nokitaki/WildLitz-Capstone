// api/generateQuestions.js
const express = require('express');
const router = express.Router();
const { Configuration, OpenAIApi } = require("openai");

// Initialize OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Generate reading comprehension questions
router.post('/generate-questions', async (req, res) => {
  try {
    const { storyText, grade = 3, count = 3 } = req.body;
    
    if (!storyText) {
      return res.status(400).json({ message: 'Missing storyText parameter' });
    }
    
    // Create prompt for generating questions
    const prompt = `Generate ${count} reading comprehension questions for grade ${grade} students based on this story:
    
    "${storyText}"
    
    Make sure the questions:
    1. Include at least one factual question about the story
    2. Include at least one question that requires making inferences
    3. Are phrased in simple language appropriate for ${grade}rd grade students
    4. Can be answered based on information in the story
    5. Encourage critical thinking appropriate for this age group
    
    Format your response as a JSON array of questions:
    [
      {
        "question": "Question text here?",
        "type": "factual or inference",
        "expectedAnswerPoints": "Key points that a good answer should include"
      }
    ]`;
    
    // Call OpenAI API
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {"role": "system", "content": "You are an educational content creator specializing in creating engaging, age-appropriate reading comprehension questions for elementary school students."},
        {"role": "user", "content": prompt}
      ],
      temperature: 0.7,
      max_tokens: 1000
    });
    
    // Parse the response
    const responseText = completion.data.choices[0].message.content;
    let questions;
    
    try {
      questions = JSON.parse(responseText);
    } catch (error) {
      // Handle JSON parsing errors by extracting JSON from the response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse questions from AI response');
      }
    }
    
    res.json({ questions });
    
  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({ message: 'Failed to generate questions', error: error.message });
  }
});

module.exports = router;