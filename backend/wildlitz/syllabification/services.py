# backend/wildlitz/syllabification/services.py
from openai import OpenAI
from django.conf import settings
import os
import uuid
import base64

class ChatGPTService:
    """Service for interacting with ChatGPT API for syllabification features"""
    
    def __init__(self):
        print(f"API KEY: {settings.OPENAI_API_KEY[:5]}...")  # Debug: showing part of the API key
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
    
    def generate_syllabification_words(self, difficulty_level, count=10, categories=None):
        """Generate words for syllabification practice based on difficulty level and categories"""
        prompt = self._create_syllabification_prompt(difficulty_level, count, categories)
        print(f"API Key first 5 chars: {settings.OPENAI_API_KEY[:5]}...")  # Debug print
        print(f"Attempting to call OpenAI API with model: gpt-4o")  # Debug print
        try:
            response = self.client.chat.completions.create(
            model="gpt-4o",  # Using GPT-4o model
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
            # Fallback words if API fails - include category
            default_category = categories[0] if categories and len(categories) > 0 else "General"
            return [
            {"word": "apple", "syllables": "ap-ple", "count": 2, "category": "Food Items" if "foodItems" in categories else default_category},
            {"word": "banana", "syllables": "ba-na-na", "count": 3, "category": "Food Items" if "foodItems" in categories else default_category},
            {"word": "elephant", "syllables": "el-e-phant", "count": 3, "category": "Animals" if "animals" in categories else default_category}
        ]
    
    def _create_syllabification_prompt(self, difficulty_level, count, categories=None):
        """Create the prompt for syllabification word generation with category support"""
        difficulty_descriptions = {
            'easy': "1-2 syllables, simple consonant-vowel patterns",
            'medium': "2-3 syllables, common English words",
            'hard': "3-4 syllables, more complex words with consonant blends"
        }
        
        # Add category guidance to the prompt
        category_guidance = ""
        if categories and len(categories) > 0:
            category_list = ", ".join(categories)
            category_guidance = f"Only generate words from the following categories: {category_list}. Each word must belong to one of these categories."
        
        return f"""
        Generate {count} age-appropriate English words for Grade 3 Filipino students (8-9 years old) to practice syllabification.
        Difficulty level: {difficulty_level} ({difficulty_descriptions.get(difficulty_level, "common words")})
        {category_guidance}
        
        For each word, provide:
        1. The word itself
        2. The syllable breakdown (separated by hyphens)
        3. The number of syllables
        4. The category the word belongs to
        
        Format your response as a JSON array of objects with 'word', 'syllables', 'count', and 'category' keys.
        Example:
        [
            {{"word": "apple", "syllables": "ap-ple", "count": 2, "category": "Food Items"}},
            {{"word": "tiger", "syllables": "ti-ger", "count": 2, "category": "Animals"}}
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
    """Generate feedback for the syllable clapping exercise with respect for provided syllable breakdowns"""
    # Count syllables based on the breakdown provided
    correct_count = len(actual_syllables.split('-'))
    is_correct = user_clap_count == correct_count
    
    # For simple feedback, we can handle it without ChatGPT
    if is_correct:
        feedback = f"Great job! '{word}' has {correct_count} syllables: {actual_syllables}"
    else:
        feedback = f"Nice try! '{word}' actually has {correct_count} syllables: {actual_syllables}. Try saying the word slowly and listen for each part."
        
    # For more complex, personalized feedback, we can use ChatGPT
    if not is_correct and user_clap_count > 0:  # Only use API when needed
        prompt = f"""
        Generate encouraging feedback for a Grade 3 student who clapped {user_clap_count} times 
        for the word '{word}' which actually has {correct_count} syllables ({actual_syllables}).
        Keep the feedback positive, brief, and educational. 
        
        IMPORTANT: The syllable breakdown is EXACTLY '{actual_syllables}' with {correct_count} syllables.
        DO NOT count each letter as a syllable. A syllable typically contains a vowel sound.
        
        Include a tip about how to recognize syllables in similar words.
        """
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a supportive elementary school teacher helping students learn syllabification. Syllables are determined by vowel sounds, not by counting individual letters."},
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
    
def text_to_speech(self, text, voice="alloy"):
    """
    Convert text to speech using OpenAI's TTS API without saving files
    """
    try:
        # Call OpenAI TTS API
        response = self.client.audio.speech.create(
            model="tts-1", 
            voice=voice,
            input=text
        )
        
        # Convert the audio stream to base64 without saving to file
        import base64
        import io
        
        # Get the binary content
        buffer = io.BytesIO()
        for chunk in response.iter_bytes():
            buffer.write(chunk)
        buffer.seek(0)
        
        # Encode as base64
        encoded_audio = base64.b64encode(buffer.read()).decode('utf-8')
        
        return {
            'success': True,
            'audio_data': encoded_audio,
            'format': 'mp3',
            'word': text
        }
        
    except Exception as e:
        print(f"Error generating text-to-speech: {e}")
        return {
            'success': False,
            'error': str(e)
        }
    
    def pronounce_syllables(self, word, syllable_breakdown):
        """
        Generate audio for each syllable in a word and the complete word
        
        Parameters:
        - word: The complete word
        - syllable_breakdown: The word broken down into syllables (separated by hyphens)
        
        Returns:
        - Dictionary with audio data for each syllable and the complete word
        """
        try:
            result = {
                'word': word,
                'syllable_breakdown': syllable_breakdown,
                'complete_word_audio': {},
                'syllables': []
            }
            
            # Generate audio for the complete word
            complete_word_audio = self.text_to_speech(word, voice="nova")
            result['complete_word_audio'] = complete_word_audio
            
            # Generate audio for each syllable
            syllables = syllable_breakdown.split('-')
            for syllable in syllables:
                syllable_audio = self.text_to_speech(syllable, voice="nova")
                result['syllables'].append({
                    'syllable': syllable,
                    'audio': syllable_audio
                })
            
            return result
            
        except Exception as e:
            print(f"Error pronouncing syllables: {e}")
            return {
                'success': False,
                'error': str(e)
            }
        

def text_to_speech(self, text, voice="alloy"):
    """
    Convert text to speech using OpenAI's TTS API without saving files
    
    Parameters:
    - text: The text to convert to speech
    - voice: The voice to use (default: "alloy")
             Options: "alloy", "echo", "fable", "onyx", "nova", "shimmer"
    
    Returns:
    - Dictionary with audio data (base64 encoded) and format
    """
    try:
        # Call OpenAI TTS API
        response = self.client.audio.speech.create(
            model="tts-1", 
            voice=voice,
            input=text
        )
        
        # Convert the audio stream to base64 without saving to file
        import base64
        import io
        
        # Get the binary content
        buffer = io.BytesIO()
        for chunk in response.iter_bytes():
            buffer.write(chunk)
        buffer.seek(0)
        
        # Encode as base64
        encoded_audio = base64.b64encode(buffer.read()).decode('utf-8')
        
        return {
            'success': True,
            'audio_data': encoded_audio,
            'format': 'mp3',
            'word': text
        }
        
    except Exception as e:
        print(f"Error generating text-to-speech: {e}")
        return {
            'success': False,
            'error': str(e)
        }