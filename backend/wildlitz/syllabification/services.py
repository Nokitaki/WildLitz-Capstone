# backend/wildlitz/syllabification/services.py
from openai import OpenAI
from django.conf import settings

class ChatGPTService:
    """Service for interacting with ChatGPT API for syllabification features"""
    
    def __init__(self):
        print(f"API KEY: {settings.OPENAI_API_KEY[:5]}...")  # Debug: showing part of the API key
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
    
    def generate_syllabification_words(self, difficulty_level, count=10):
        """Generate words for syllabification practice based on difficulty level"""
        prompt = self._create_syllabification_prompt(difficulty_level, count)
        print(f"API Key first 5 chars: {settings.OPENAI_API_KEY[:5]}...")  # Debug print
        print(f"Attempting to call OpenAI API with model: gpt-4o")  # Debug print
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",  # Update to use the GPT-4o model
                messages=[
                    {"role": "system", "content": "You are an educational assistant that generates age-appropriate content for Grade 3 Filipino students learning English syllabification."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            print("OpenAI API call successful!")
            # Parse the response to extract words and their syllable breakdowns
            return self._parse_syllabification_response(response.choices[0].message.content)
        except Exception as e:
            print(f"Error calling OpenAI API: {e}")
            # Fallback words if API fails
            return [
                {"word": "apple", "syllables": "ap-ple", "count": 2},
                {"word": "banana", "syllables": "ba-na-na", "count": 3},
                {"word": "elephant", "syllables": "el-e-phant", "count": 3}
            ]

    
    def _create_syllabification_prompt(self, difficulty_level, count):
        """Create the prompt for syllabification word generation"""
        difficulty_descriptions = {
            'easy': "1-2 syllables, simple consonant-vowel patterns",
            'medium': "2-3 syllables, common English words",
            'hard': "3-4 syllables, more complex words with consonant blends"
        }
        
        return f"""
        Generate {count} age-appropriate English words for Grade 3 Filipino students (8-9 years old) to practice syllabification.
        Difficulty level: {difficulty_level} ({difficulty_descriptions.get(difficulty_level, "common words")})
        
        For each word, provide:
        1. The word itself
        2. The syllable breakdown (separated by hyphens)
        3. The number of syllables
        
        Format your response as a JSON array of objects with 'word', 'syllables', and 'count' keys.
        Example:
        [
            {{"word": "apple", "syllables": "ap-ple", "count": 2}},
            {{"word": "banana", "syllables": "ba-na-na", "count": 3}}
        ]
        """
    
    def _parse_syllabification_response(self, response_text):
        """Parse the JSON response from ChatGPT"""
        import json
        try:
            # Try to extract JSON from the response if it contains other text
            start_idx = response_text.find('[')
            end_idx = response_text.rfind(']') + 1
            if start_idx >= 0 and end_idx > 0:
                json_str = response_text[start_idx:end_idx]
                return json.loads(json_str)
            return json.loads(response_text)
        except json.JSONDecodeError:
            # Fallback if the response isn't valid JSON
            print(f"Failed to parse JSON response: {response_text}")
            return [{"word": "fallback", "syllables": "fall-back", "count": 2}]
    
    def generate_syllable_clapping_feedback(self, word, actual_syllables, user_clap_count):
        """Generate feedback for the syllable clapping exercise"""
        correct_count = len(actual_syllables.split('-'))
        is_correct = user_clap_count == correct_count
        
        # For simple feedback, we can handle it without ChatGPT
        if is_correct:
            feedback = f"Great job! '{word}' has {correct_count} syllables: {actual_syllables}"
        else:
            feedback = f"Not quite! '{word}' has {correct_count} syllables: {actual_syllables}"
            
        # For more complex, personalized feedback, we can use ChatGPT
        if not is_correct and user_clap_count > 0:  # Only use API when needed
            prompt = f"""
            Generate encouraging feedback for a Grade 3 student who clapped {user_clap_count} times 
            for the word '{word}' which actually has {correct_count} syllables ({actual_syllables}).
            Keep the feedback positive, brief, and educational. Include a tip about how to recognize
            syllables in similar words.
            """
            
            try:
                response = self.client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a supportive elementary school teacher helping students learn syllabification."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7,
                    max_tokens=200
                )
                
                feedback = response.choices[0].message.content.strip()
            except Exception as e:
                print(f"Error calling OpenAI API for feedback: {e}")
                # Use the simple feedback if API fails
        
        return {
            'is_correct': is_correct,
            'correct_count': correct_count,
            'user_count': user_clap_count,
            'word': word,
            'syllable_breakdown': actual_syllables,
            'feedback': feedback
        }
    
    def generate_syllable_sound_explanation(self, word, syllable_breakdown):
        """Generate a detailed explanation of syllable sounds for a word"""
        prompt = f"""
        Create a detailed, educational explanation of the syllable sounds in the word '{word}' 
        (broken down as '{syllable_breakdown}') for Grade 3 students.
        
        For each syllable:
        1. Describe how to pronounce it clearly
        2. Explain the vowel and consonant sounds involved
        3. Provide a simple, age-appropriate word that has a similar sound
        
        Format your response as a JSON object with the following structure:
        {{
            "word": "{word}",
            "syllables": [
                {{
                    "syllable": "first-syllable",
                    "pronunciation_guide": "explanation of how to say it",
                    "similar_sound_word": "example word",
                    "phonetic_components": "brief explanation of sounds"
                }},
                ...more syllables...
            ],
            "full_pronunciation_tip": "overall tip for pronouncing the whole word"
        }}
        """
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an educational language specialist helping young students understand syllable sounds."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            # Try to extract JSON from the response
            import json
            response_text = response.choices[0].message.content
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            if start_idx >= 0 and end_idx > 0:
                json_str = response_text[start_idx:end_idx]
                return json.loads(json_str)
            return json.loads(response_text)
        except Exception as e:
            print(f"Error in syllable sound explanation: {e}")
            # Fallback if the response isn't valid JSON or API fails
            syllables = syllable_breakdown.split('-')
            fallback_data = {
                "word": word,
                "syllables": [
                    {
                        "syllable": syllable,
                        "pronunciation_guide": f"Say '{syllable}' clearly",
                        "similar_sound_word": "example",
                        "phonetic_components": "vowels and consonants"
                    } for syllable in syllables
                ],
                "full_pronunciation_tip": f"Say the word '{word}' by pronouncing each syllable clearly."
            }
            return fallback_data