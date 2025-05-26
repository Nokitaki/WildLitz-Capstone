// api/checkAnswer.js
const express = require('express');
const router = express.Router();
const { Configuration, OpenAIApi } = require("openai");

// Initialize OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Check and provide feedback on a student's answer
router.post('/check-answer', async (req, res) => {
  try {
    const { question, answer, storyText, grade = 3 } = req.body;
    
    if (!question || !answer) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }
    
    // Create prompt for checking the answer
    const prompt = `You are evaluating a ${grade}rd grade student's answer to a reading comprehension question.
    
    Story: "${storyText.substring(0, 500)}${storyText.length > 500 ? '...' : ''}"
    
    Question: "${question}"
    
    Student's answer: "${answer}"
    
    Please evaluate the answer and provide kid-friendly feedback. Be encouraging and specific about what the student did well, and offer gentle guidance if improvement is needed.
    
    Format your response as a JSON object:
    {
      "isCorrect": true or false (whether the answer generally addresses the question correctly),
      "feedback": "Your feedback to the student with specific praise and/or guidance",
      "suggestionIfWrong": "If the answer needs improvement, a hint or suggestion to help"
    }`;
    
    // Call OpenAI API
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {"role": "system", "content": "You are a kind, supportive elementary school teacher who gives encouraging feedback to students."},
        {"role": "user", "content": prompt}
      ],
      temperature: 0.7,
      max_tokens: 500
    });
    
    // Parse the response
    const responseText = completion.data.choices[0].message.content;
    let feedback;
    
    try {
      feedback = JSON.parse(responseText);
    } catch (error) {
      // Handle JSON parsing errors by extracting JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        feedback = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback to a simple structure if parsing fails
        feedback = {
          isCorrect: responseText.toLowerCase().includes('good job') || responseText.toLowerCase().includes('correct'),
          feedback: responseText.substring(0, 200),
          suggestionIfWrong: responseText.toLowerCase().includes('try') ? responseText.substring(responseText.toLowerCase().indexOf('try'), 100) : null
        };
      }
    }
    
    res.json(feedback);
    
  } catch (error) {
    console.error('Error checking answer:', error);
    res.status(500).json({ message: 'Failed to check answer', error: error.message });
  }
});

module.exports = router;