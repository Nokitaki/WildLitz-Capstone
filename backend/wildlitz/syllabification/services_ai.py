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
        self.model = "gpt-4o"  # You can use gpt-4 for better results if available
    
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
                    f"Create a short, encouraging message introducing the word '{word}' for a syllable clapping game. IMPORTANT: Do NOT mention numbers or how many syllables. Max 100 characters.",
                    f"Write a brief, enthusiastic prompt for a child to identify syllables in '{word}'. CRITICAL: Do NOT reveal or hint at the number of syllables. Max 100 characters.",
                    f"Create an encouraging message for a syllable counting game with '{word}'. NEVER mention the syllable count or give numerical hints. Max 100 characters.",
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
            
            # Create system message based on context
            if context == 'intro':
                system_message = "You are a friendly, encouraging educational character speaking to elementary school children. CRITICAL: For intro messages, NEVER mention the number of syllables or give any numerical hints. Keep students guessing!"
            else:
                system_message = "You are a friendly, encouraging educational character speaking to elementary school children."
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_message},
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
    
    def validate_syllable_structure(self, word, syllable_breakdown):
        """
        AI validates if syllable breakdown is correct
        Returns: {
            'is_correct': bool,
            'confidence': float,
            'suggestion': str,
            'alternative_breakdown': str (if incorrect)
        }
        """
        try:
            prompt = f"""
            You are an expert in English phonetics. Validate the provided syllable breakdown against the word.

            Examples:
            1. Word: "butterfly", Teacher's breakdown: "but-ter-fly"
            - This is correct.
            - JSON Response: {{"is_correct": true, "confidence": 1.0, "suggestion": "The structure is correct.", "alternative_breakdown": null}}
            2. Word: "computer", Teacher's breakdown: "comp-uter"
            - This is incorrect.
            - JSON Response: {{"is_correct": false, "confidence": 0.9, "suggestion": "The middle syllable 'put' seems to be missing.", "alternative_breakdown": "com-put-er"}}

            ---
            Now, perform the validation for the following:

            Word: "{word}"
            Teacher's breakdown: "{syllable_breakdown}"

            Task:
            1. Is the Teacher's breakdown a correct way to syllabify the Word? (yes/no)
            2. What is your confidence level from 0.0 to 1.0?
            3. If it is incorrect, provide the correct breakdown.
            4. Provide a brief, helpful explanation (max 100 characters).

            Respond ONLY in the following JSON format:
            {{
                "is_correct": boolean,
                "confidence": number,
                "suggestion": "string",
                "alternative_breakdown": "string-or-null"
            }}
            """
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert in English phonetics and syllable structure. Validate syllable breakdowns accurately."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200,
                temperature=0.3  # Low temperature for consistency
            )
            
            response_text = response.choices[0].message.content.strip()
            
            # Parse JSON response
            try:
                # Extract JSON if embedded in other text
                start_idx = response_text.find('{')
                end_idx = response_text.rfind('}') + 1
                if start_idx >= 0 and end_idx > 0:
                    json_str = response_text[start_idx:end_idx]
                    result = json.loads(json_str)
                    
                    # ==========================================================
                    # Sanity Check to correct the AI's mistake
                    # If the AI says it's incorrect, but its suggestion is identical 
                    # to the user's input, we override the AI's judgment.
                    if (not result.get('is_correct') and
                            result.get('alternative_breakdown') and
                            syllable_breakdown.strip().lower() == result['alternative_breakdown'].strip().lower()):
                        
                        logger.warning(f"AI incorrectly flagged a correct breakdown for '{word}'. Overriding to 'is_correct: True'.")
                        result['is_correct'] = True
                        result['suggestion'] = "Syllable structure looks correct."
                    # ==========================================================

                    # Ensure all required fields exist
                    if 'is_correct' not in result:
                        result['is_correct'] = True
                    if 'confidence' not in result:
                        result['confidence'] = 0.5
                    if 'suggestion' not in result:
                        result['suggestion'] = "Syllable structure looks reasonable."
                    if 'alternative_breakdown' not in result:
                        result['alternative_breakdown'] = None
                    
                    return result
                
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing AI validation JSON: {response_text}")
            
            # Fallback if parsing fails
            return {
                'is_correct': True,
                'confidence': 0.5,
                'suggestion': "Unable to validate syllable structure accurately.",
                'alternative_breakdown': None
            }
            
        except Exception as e:
            logger.error(f"Error in AI syllable validation: {str(e)}")
            # Safe fallback
            return {
                'is_correct': True,
                'confidence': 0.5,
                'suggestion': "Validation service temporarily unavailable.",
                'alternative_breakdown': None
            }
        
    def suggest_category(self, word):
        """AI suggests appropriate category for a word"""
        try:
            prompt = f"""
            Categorize ONLY the word "{word}" into ONE category from this exact list:
            - Animals (for any living creatures: pets, wild animals, insects, birds, fish, etc.)
            - Fruits (for fruits only)
            - Food (for any food items, meals, snacks, drinks)
            - Clothes (for any wearable items, shoes, accessories)
            - School Supplies (for educational items: pencils, books, backpacks, etc.)
            - Nature (for plants, weather, natural phenomena, landscapes)
            - Everyday Objects (for common household items, tools, furniture, appliances)

            Examples:
            - "lion" → Animals
            - "elephant" → Animals
            - "butterfly" → Animals
            - "apple" → Fruits
            - "pizza" → Food
            - "shirt" → Clothes
            - "pencil" → School Supplies
            - "tree" → Nature
            - "chair" → Everyday Objects
            - "lamp" → Everyday Objects
            - "scissors" → Everyday Objects

            Respond with ONLY ONE category name from the list above.
            If "{word}" doesn't clearly fit any category, respond with "Custom Words".

            Word to categorize: {word}
            Category:
            """
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a precise categorization expert. Always choose the most appropriate category from the given list."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=10,
                temperature=0.1  # Low temperature for more consistent results
            )
            
            category = response.choices[0].message.content.strip()
            
            # ✅ THIS IS THE VALIDATION LIST - Must match exactly!
            valid_categories = [
                'Animals', 
                'Fruits', 
                'Food', 
                'Clothes', 
                'School Supplies', 
                'Nature', 
                'Everyday Objects'
            ]
            
            # Check if response contains any valid category
            for valid_cat in valid_categories:
                if valid_cat.lower() in category.lower():
                    return valid_cat
            
            # If no match, return Custom Words
            return None
            
        except Exception as e:
            logger.error(f"Error suggesting category: {str(e)}")
            return None
        
    def generate_syllable_breakdown(self, word):
        """AI generates a syllable breakdown for a given word."""
        try:
            prompt = f"""
            Analyze the word "{word}" and provide its most common syllable breakdown.
            
            Instructions:
            - Separate syllables with a single hyphen (-).
            - Do not include any explanations, introductory text, or punctuation.
            - Respond with ONLY the hyphenated word.
            
            Examples:
            - Input: "butterfly", Output: "but-ter-fly"
            - Input: "computer", Output: "com-put-er"
            - Input: "amazing", Output: "a-maz-ing"
            
            Word to break down: "{word}"
            """
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert in English phonetics. Your task is to provide accurate syllable breakdowns in a specific hyphenated format."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=50,
                temperature=0.2  # Low temperature for more predictable results
            )
            
            breakdown = response.choices[0].message.content.strip()
            # Clean up response to ensure it only contains allowed characters
            breakdown = ''.join(c for c in breakdown if c.isalpha() or c == '-')
            
            return breakdown
            
        except Exception as e:
            logger.error(f"Error generating syllable breakdown for '{word}': {str(e)}")
            return word # Fallback to the original word if AI fails
        
    def generate_learning_feedback(self, word, is_correct, syllable_count, difficulty='medium'):
        """
        Generate personalized learning feedback based on student performance
        """
        try:
            # Determine syllable category and strategies
            if syllable_count == 1:
                syllable_tips = {
                    'easy': "Short words with one beat are the easiest to identify!",
                    'medium': "Single-syllable words have just one vowel sound - listen for that beat!",
                    'hard': "One-syllable words are the building blocks of language - you're mastering the fundamentals!"
                }
            elif syllable_count == 2:
                syllable_tips = {
                    'easy': "Two-syllable words have two beats - try clapping: [first part] (clap) [second part] (clap)!",
                    'medium': "For 2-syllable words, find where the word naturally breaks - like 'ti-ger' or 'pen-cil'.",
                    'hard': "Two-syllable words often follow patterns - listen for the stress on the first or second syllable."
                }
            elif syllable_count == 3:
                syllable_tips = {
                    'easy': "Three syllables means three beats - count them slowly as you say the word!",
                    'medium': "Break 3-syllable words into smaller chunks - each chunk has one vowel sound.",
                    'hard': "Three-syllable words can be compound words or have prefixes/suffixes - look for those patterns!"
                }
            else:
                syllable_tips = {
                    'easy': f"{syllable_count} syllables is a long word - take your time and count each beat carefully!",
                    'medium': f"For long words with {syllable_count} syllables, break them into 2-syllable chunks first, then count.",
                    'hard': f"{syllable_count}-syllable words often combine familiar word parts - identify those chunks!"
                }
            
            tip = syllable_tips.get(difficulty, syllable_tips['medium'])
            
            # Build the prompt with STRICT requirements
            if is_correct:
                prompt = f"""Generate feedback for a student who CORRECTLY identified "{word}" as having {syllable_count} syllables.

    Word: "{word}"
    Syllables: {syllable_count}
    Difficulty: {difficulty}
    Result: CORRECT ✓

    YOU MUST follow this EXACT structure with DOUBLE LINE BREAKS between sections:

    1. PRAISE LINE (15-20 words):
    - Start with enthusiastic praise
    - State the word and syllable count
    - Add 1 emoji (🎉, ⭐, 🏆, ✨)

    [ADD \\n\\n HERE - DOUBLE LINE BREAK]

    2. EDUCATIONAL INSIGHT (15-20 words):
    - Explain the skill they're building
    - Be specific to {syllable_count}-syllable words

    [ADD \\n\\n HERE - DOUBLE LINE BREAK]

    3. LEARNING TIP with 💡 (20-25 words):
    - Start with "💡 Tip:"
    - Concrete technique: {tip}

    CRITICAL: You MUST include two newline characters (\\n\\n) between each section.
    Total: 50-65 words. Short sentences. Clear structure."""

            else:
                prompt = f"""Generate feedback for a student who INCORRECTLY guessed "{word}". Correct answer: {syllable_count} syllables.

    Word: "{word}"
    Actual syllables: {syllable_count}
    Difficulty: {difficulty}
    Result: NEEDS PRACTICE

    YOU MUST follow this EXACT structure with DOUBLE LINE BREAKS between sections:

    1. GENTLE CORRECTION (12-15 words):
    - Start warmly ("Nice try!", "Almost there!")
    - State correct syllable count
    - Add 1 emoji (💙, 🌟, 🎯)

    [ADD \\n\\n HERE - DOUBLE LINE BREAK]

    2. WHY IT'S TRICKY (12-15 words):
    - Explain the challenge
    - Validate difficulty

    [ADD \\n\\n HERE - DOUBLE LINE BREAK]

    3. HELPFUL STRATEGY with 💡 (20-25 words):
    - Start with "💡 Strategy:"
    - Actionable technique: {tip}

    CRITICAL: You MUST include two newline characters (\\n\\n) between each section.
    Total: 45-55 words. Short sentences. Never use "wrong" or "incorrect"."""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system", 
                        "content": "You are an encouraging elementary teacher. CRITICAL REQUIREMENT: You must separate each section with two newline characters (\\n\\n). Follow the structure exactly. Keep sentences short and clear."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                max_tokens=200,
                temperature=0.7
            )
            
            feedback = response.choices[0].message.content.strip()
            feedback = feedback.strip('"\'')
            
            logger.info(f"Generated learning feedback for '{word}': {feedback[:100]}...")
            
            return feedback
            
        except Exception as e:
            logger.error(f"Error generating learning feedback: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            
            # Better fallback messages with proper line breaks
            if is_correct:
                return f"""Excellent work! "{word}" has {syllable_count} syllable{'s' if syllable_count > 1 else ''}. 🎉

    You're developing strong syllable awareness! This is a key reading skill.

    💡 Tip: {syllable_tips.get(difficulty, syllable_tips['medium'])}"""
            else:
                return f"""Nice try! The word "{word}" has {syllable_count} syllable{'s' if syllable_count > 1 else ''}. 💙

    This is a common challenge - many students need practice with {syllable_count}-syllable words.

    💡 Strategy: {syllable_tips.get(difficulty, syllable_tips['medium'])}"""
            
    def generate_phonetic_guide(self, word, syllable_breakdown):
        """
        Generate phonetic guide with rhyming words and sound explanations
        
        Args:
            word: The word to analyze
            syllable_breakdown: Syllable breakdown (e.g., "but-ter-fly")
        
        Returns:
            Dictionary with phonetic breakdown, rhyming words, and sound explanations
        """
        try:
            prompt = f"""You are a phonetics expert helping elementary students learn pronunciation.

    Analyze the word "{word}" with syllables: {syllable_breakdown}

    Generate a phonetic guide in the following JSON structure:

    {{
    "phonetic_breakdown": "phonetic representation with hyphens",
    "rhyming_words": ["word1", "word2", "word3", "word4"],
    "sound_explanations": [
        {{
        "sound": "phoneme",
        "explanation": "Description with example word"
        }}
    ]
    }}

    Requirements:

    1. PHONETIC BREAKDOWN:
    - Break the word into individual phonemes/sounds (not just syllables)
    - Use simple phonetic notation that kids can understand
    - Separate with hyphens
    - Example: "pig" → "p-ih-g", "cat" → "k-a-t", "butterfly" → "b-uh-t-er-f-l-eye"

    2. RHYMING WORDS (4-5 words):
    - Must be real English words
    - Should rhyme with "{word}"
    - Use simple, kid-friendly words
    - Age-appropriate (no complex or inappropriate words)

    3. SOUND EXPLANATIONS:
    - One explanation per phoneme in the phonetic breakdown
    - Format: "As in the [first/middle/last] sound of [example word]"
    - Use common, simple example words
    - Keep explanations under 15 words each
    - Be specific about WHERE the sound appears (first, middle, last)

    Example 1:
    Word: "pig"
    {{
    "phonetic_breakdown": "p-ih-g",
    "rhyming_words": ["big", "dig", "wig", "fig"],
    "sound_explanations": [
        {{
        "sound": "p",
        "explanation": "As in the first sound of pen or pie."
        }},
        {{
        "sound": "ih",
        "explanation": "Short 'i' sound, as in the middle of ship or igloo."
        }},
        {{
        "sound": "g",
        "explanation": "As in the first sound of give or go."
        }}
    ]
    }}

    Example 2:
    Word: "cat"
    {{
    "phonetic_breakdown": "k-a-t",
    "rhyming_words": ["bat", "hat", "mat", "rat"],
    "sound_explanations": [
        {{
        "sound": "k",
        "explanation": "As in the first sound of kite or cup."
        }},
        {{
        "sound": "a",
        "explanation": "Short 'a' sound, as in the middle of apple or ant."
        }},
        {{
        "sound": "t",
        "explanation": "As in the first sound of top or toy."
        }}
    ]
    }}

    Now generate for "{word}":
    Return ONLY the JSON object, no additional text."""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a phonetics expert. Return ONLY valid JSON. No markdown, no code blocks, no additional text. Just pure JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=400,
                temperature=0.5  # Lower temperature for more consistent output
            )

            response_text = response.choices[0].message.content.strip()
            
            # Remove markdown code blocks if present
            if response_text.startswith('```'):
                response_text = response_text.split('```')[1]
                if response_text.startswith('json'):
                    response_text = response_text[4:]
                response_text = response_text.strip()
            
            # Parse JSON
            phonetic_data = json.loads(response_text)
            
            # Validate structure
            required_keys = ['phonetic_breakdown', 'rhyming_words', 'sound_explanations']
            for key in required_keys:
                if key not in phonetic_data:
                    raise ValueError(f"Missing required key: {key}")
            
            # Ensure rhyming_words is a list
            if not isinstance(phonetic_data['rhyming_words'], list):
                phonetic_data['rhyming_words'] = []
            
            # Ensure sound_explanations is a list of dicts
            if not isinstance(phonetic_data['sound_explanations'], list):
                phonetic_data['sound_explanations'] = []
            
            logger.info(f"Generated phonetic guide for '{word}': {phonetic_data['phonetic_breakdown']}")
            
            return phonetic_data
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error for phonetic guide: {str(e)}")
            logger.error(f"Response was: {response_text}")
            
            # Return basic fallback structure
            return {
                "phonetic_breakdown": syllable_breakdown,
                "rhyming_words": [],
                "sound_explanations": [
                    {
                        "sound": syllable_breakdown,
                        "explanation": f"Listen carefully to the sounds in '{word}'."
                    }
                ]
            }
            
        except Exception as e:
            logger.error(f"Error generating phonetic guide: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            
            # Return basic fallback structure
            return {
                "phonetic_breakdown": syllable_breakdown,
                "rhyming_words": [],
                "sound_explanations": [
                    {
                        "sound": syllable_breakdown,
                        "explanation": f"Listen carefully to the sounds in '{word}'."
                    }
                ]
            }

# ==========================================
# Helper Functions for File Upload
# ==========================================

def upload_file_to_supabase_storage(file, bucket_name, file_path):
    """
    Upload a file to Supabase Storage with improved error handling
    
    Args:
        file: Django UploadedFile object
        bucket_name: 'syllable-word-images' or 'syllable-word-audio'
        file_path: 'butterfly.jpg' or 'butterfly_full.mp3'
    
    Returns:
        public_url: Full public URL to the file
    """
    from django.conf import settings
    from supabase import create_client
    import logging
    
    logger = logging.getLogger(__name__)
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    
    try:
        # Read file content
        file_content = file.read()
        
        logger.info(f"📤 Uploading to bucket '{bucket_name}': {file_path}")
        logger.info(f"   File size: {len(file_content)} bytes")
        logger.info(f"   Content type: {file.content_type}")
        
        # ✅ IMPROVED: Validate file content
        if len(file_content) == 0:
            raise Exception("File is empty (0 bytes)")
        
        # ✅ IMPROVED: Handle content type properly
        content_type = file.content_type
        if not content_type:
            # Guess content type from extension
            extension = file_path.split('.')[-1].lower()
            content_type_map = {
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'png': 'image/png',
                'gif': 'image/gif',
                'webp': 'image/webp',
                'mp3': 'audio/mpeg',
                'wav': 'audio/wav',
                'webm': 'audio/webm',
                'm4a': 'audio/mp4',
            }
            content_type = content_type_map.get(extension, 'application/octet-stream')
            logger.info(f"   Guessed content type: {content_type}")
        
        # Upload to Supabase Storage
        response = supabase.storage.from_(bucket_name).upload(
            path=file_path,
            file=file_content,
            file_options={
                "content-type": content_type,
                "upsert": "true"  # Overwrite if exists
            }
        )
        
        logger.info(f"   Upload response: {response}")
        
        # Get public URL
        public_url = supabase.storage.from_(bucket_name).get_public_url(file_path)
        
        logger.info(f"✅ File uploaded successfully: {public_url}")
        return public_url
        
    except Exception as e:
        error_detail = f"Upload failed for {file_path} to {bucket_name}: {str(e)}"
        logger.error(f"❌ {error_detail}")
        logger.error(f"   Exception type: {type(e).__name__}")
        
        # ✅ NEW: More specific error messages
        if "bucket" in str(e).lower():
            raise Exception(f"Supabase bucket '{bucket_name}' not found or not accessible. Check bucket exists and has proper permissions.")
        elif "permission" in str(e).lower() or "unauthorized" in str(e).lower():
            raise Exception(f"Permission denied when uploading to '{bucket_name}'. Check Supabase storage policies.")
        elif "size" in str(e).lower():
            raise Exception(f"File size limit exceeded when uploading to '{bucket_name}'.")
        else:
            raise Exception(error_detail)