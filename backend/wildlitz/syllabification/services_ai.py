# backend/wildlitz/syllabification/services_ai.py
from openai import OpenAI
from django.conf import settings
import json
import random
import logging

logger = logging.getLogger(__name__)

class AIContentGenerator:
    """Service for generating AI content for syllabification game"""
    
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = "gpt-3.5-turbo"  # You can use gpt-4 for better results if available
    
    def generate_fun_fact(self, word, category):
        """Generate a fun, educational fact about a word"""
        try:
            # Add some variety with different prompt templates
            templates = [
                f"Share a short, fun, kid-friendly fact about '{word}' (which is a {category}). Keep it under 150 characters and make it educational.",
                f"Create a surprising and educational fact about '{word}' that would entertain a 3rd grade student. Maximum 150 characters.",
                f"What's something fascinating and educational about '{word}' that kids would enjoy learning? Keep it very brief (under 150 characters)."
            ]
            
            prompt = random.choice(templates)
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an educational assistant creating fun, brief facts for elementary school children."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=100,
                temperature=0.7
            )
            
            fun_fact = response.choices[0].message.content.strip()
            # Remove quotes if present
            fun_fact = fun_fact.strip('"\'')
            
            return fun_fact
            
        except Exception as e:
            logger.error(f"Error generating fun fact: {str(e)}")
            # Return a default fact if API call fails
            return f"Fun fact: {word} is in the category of {category}!"
    
    def generate_character_message(self, word, context, difficulty='medium'):
        """Generate a character message for speech bubbles"""
        try:
            # Context can be: 'intro', 'correct', 'incorrect', 'demo'
            context_prompts = {
                'intro': [
                    f"Create a short, encouraging message introducing the word '{word}' for a syllable clapping game. Max 100 characters.",
                    f"Write a brief, enthusiastic prompt for a child to identify syllables in '{word}'. Max 100 characters.",
                ],
                'correct': [
                    f"Create a short, celebratory message for correctly identifying that '{word}' has syllables. Max 100 characters.",
                    f"Write a brief, enthusiastic praise message for a child who correctly counted syllables. Max 100 characters.",
                    f"As a supportive character, congratulate the student on their correct syllable counting. Max 100 characters."
                ],
                'incorrect': [
                    f"Create a short, encouraging message after a student incorrectly counted syllables in '{word}'. Be supportive! Max 100 characters.",
                    f"Write a brief, supportive message for a child who needs another try at counting syllables. No discouragement. Max 100 characters.",
                    f"As a helpful character, gently encourage the student to try again with syllable counting. Max 100 characters."
                ],
                'demo': [
                    "Create a short, enthusiastic message introducing a syllable sound demonstration activity. Max 100 characters.",
                    "Write a brief, engaging invitation to explore syllable sounds in a word. Max 100 characters.",
                    "As a fun educational guide, introduce the syllable breakdown demonstration. Max 100 characters."
                ]
            }
            
            # Select a random prompt variation for the given context
            prompts = context_prompts.get(context, context_prompts['intro'])
            prompt = random.choice(prompts)
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a friendly, encouraging educational character speaking to elementary school children."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=60,
                temperature=0.7
            )
            
            message = response.choices[0].message.content.strip()
            # Remove quotes if present
            message = message.strip('"\'')
            
            return message
            
        except Exception as e:
            logger.error(f"Error generating character message: {str(e)}")
            # Return default messages based on context
            default_messages = {
                'intro': f"Listen to '{word}' and count the syllables!",
                'correct': "Great job! That's correct!",
                'incorrect': "Nice try! Listen again.",
                'demo': "Let's learn how to say each syllable!"
            }
            return default_messages.get(context, default_messages['intro'])
    
    def generate_pronunciation_guide(self, word, syllable_breakdown):
        """Generate pronunciation guidance for syllables"""
        try:
            syllables = syllable_breakdown.split('-')
            
            prompt = f"""
            Create a kid-friendly pronunciation guide for the word '{word}' (broken down as '{syllable_breakdown}').
            
            For each syllable:
            1. Describe how to pronounce it clearly in 1-2 sentences
            2. Provide a simple word that has a similar sound
            
            Also provide one overall tip for pronouncing the whole word.
            
            Format your response as JSON:
            {{
                "syllables": [
                    {{
                        "syllable": "first-syllable",
                        "pronunciation_guide": "brief explanation",
                        "similar_sound_word": "example word"
                    }},
                    ...more syllables...
                ],
                "full_pronunciation_tip": "overall tip for the word"
            }}
            """
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an educational language specialist helping young students with pronunciation."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.5
            )
            
            # Try to extract JSON from the response
            response_text = response.choices[0].message.content
            
            # Parse JSON
            try:
                # Extract JSON if embedded in other text
                start_idx = response_text.find('{')
                end_idx = response_text.rfind('}') + 1
                if start_idx >= 0 and end_idx > 0:
                    json_str = response_text[start_idx:end_idx]
                    return json.loads(json_str)
                
                return json.loads(response_text)
                
            except json.JSONDecodeError:
                # If JSON parsing fails, create a structured response manually
                logger.error(f"Error parsing JSON from pronunciation guide: {response_text}")
                
                # Fallback response structure
                result = {
                    "syllables": [],
                    "full_pronunciation_tip": f"Say the word '{word}' by pronouncing each syllable clearly."
                }
                
                for syllable in syllables:
                    result["syllables"].append({
                        "syllable": syllable,
                        "pronunciation_guide": f"Say '{syllable}' clearly.",
                        "similar_sound_word": "simple"
                    })
                
                return result
            
        except Exception as e:
            logger.error(f"Error generating pronunciation guide: {str(e)}")
            
            # Create a basic response if API call fails
            result = {
                "syllables": [],
                "full_pronunciation_tip": f"Say the word '{word}' by pronouncing each syllable clearly."
            }
            
            for syllable in syllables:
                result["syllables"].append({
                    "syllable": syllable,
                    "pronunciation_guide": f"Say '{syllable}' clearly.",
                    "similar_sound_word": "simple"
                })
            
            return result

def generate_syllable_tip(self, difficulty='medium'):
    """Generate a random educational tip about syllables"""
    try:
        # Create different tip templates based on difficulty
        tip_prompts = {
            'easy': [
                "Create a short, helpful tip (max 100 characters) for a young child learning to count syllables in easy 1-2 syllable words.",
                "Write a brief, encouraging tip about clapping syllables for kindergarten students. Keep it under 100 characters."
            ],
            'medium': [
                "Share a concise tip (max 100 characters) about identifying syllables in medium-difficulty words for elementary students.",
                "Create a short, helpful tip about syllable patterns in 2-3 syllable words. Keep it under 100 characters."
            ],
            'hard': [
                "Write a brief but helpful tip (max 100 characters) about breaking down complex multi-syllable words.",
                "Create a concise expert tip about syllable counting strategies for challenging words. Keep it under 100 characters."
            ]
        }
        
        # Select appropriate prompts or default to medium
        selected_prompts = tip_prompts.get(difficulty.lower(), tip_prompts['medium'])
        prompt = random.choice(selected_prompts)
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an educational expert helping children learn about syllables."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=60,
            temperature=0.7
        )
        
        tip = response.choices[0].message.content.strip()
        # Remove quotes if present
        tip = tip.strip('"\'')
        
        return tip
        
    except Exception as e:
        logger.error(f"Error generating syllable tip: {str(e)}")
        # Return a default tip if API call fails
        default_tips = {
            'easy': "Listen for the beat in each word - every beat is a syllable!",
            'medium': "Put your hand under your chin - each time your jaw drops is a syllable!",
            'hard': "Break long words into smaller chunks to count syllables more easily."
        }
        return default_tips.get(difficulty.lower(), default_tips['medium'])
