# sentence_formation/views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import openai
from django.conf import settings
import random
import datetime
import logging
import traceback

# Configure logger
logger = logging.getLogger(__name__)

# Configure OpenAI API key from settings
openai.api_key = settings.OPENAI_API_KEY

@csrf_exempt
@require_http_methods(["POST"])
def test_endpoint(request):
    """Simple test endpoint to verify API connectivity"""
    return JsonResponse({"status": "success", "message": "API is working"})

@csrf_exempt
@require_http_methods(["POST"])
def generate_story(request):
    """
    Generate a story adventure with episodes and multiple crossword puzzles per episode
    
    Expects JSON with:
    - theme: theme of the story (e.g., 'jungle', 'space')
    - focusSkills: list of skills to focus on
    - characterNames: (optional) names of characters
    - episodeCount: number of episodes to generate
    - gradeLevel: target grade level
    """
    try:
        # Parse request data
        data = json.loads(request.body)
        theme = data.get('theme', 'jungle')
        focus_skills = data.get('focusSkills', ['sight-words'])
        character_names = data.get('characterNames', '')
        episode_count = min(int(data.get('episodeCount', 3)), 5)  # Limit to 5 episodes max
        grade_level = data.get('gradeLevel', 3)
        
        # Validate the OpenAI API key
        if not settings.OPENAI_API_KEY:
            logger.error("OpenAI API key is missing")
            return JsonResponse({
                'error': 'OpenAI API key is not configured'
            }, status=500)
            
        # Create a unique ID for this story
        story_id = f"{theme}_generated_{int(datetime.datetime.now().timestamp())}"
        
        # Create a more detailed prompt that ensures vocabulary words are used in the story text
        prompt = f"""
        Create a {episode_count}-episode educational story for grade {grade_level} students with a {theme} theme.
        
        {character_names and f"Use these character names: {character_names}" or ""}
        
        IMPORTANT REQUIREMENTS FOR GRADE 3 STUDENTS:
        1. Each episode should be 150-200 words long (appropriate reading length)
        2. Each episode must include 5-8 simple vocabulary words that focus on {', '.join(focus_skills)}
        3. ALL vocabulary words MUST appear naturally in the story text
        4. Use ONLY grade 3 appropriate vocabulary (3-6 letters, simple words)
        5. Each vocabulary word should appear at least once in the episode text where it's listed
        
        GRADE 3 VOCABULARY GUIDELINES:
        - Use simple, common words that 8-9 year olds know: run, jump, find, look, help, big, small, red, blue, tree, house, car, book, etc.
        - Avoid complex words longer than 6 letters
        - Use basic sight words and phonics words
        - Examples of good grade 3 words: cat, dog, run, big, red, tree, book, play, look, find, help, jump, walk, house, car, sun, fun, etc.
        - Examples of words TOO HARD for grade 3: exploration, magnificent, extraordinary, fascinating, mysterious, etc.
        
        For each vocabulary word, create a simple crossword puzzle clue that a grade 3 student can understand. For example:
        - "map" → "Paper that shows you where to go"
        - "run" → "Move very fast with your legs" 
        - "big" → "Very large, not small"
        - "tree" → "Tall plant with leaves and branches"
        
        Format as JSON:
        {{
          "title": "Story Title",
          "description": "Brief description",
          "episodes": [
            {{
              "title": "Episode Title",
              "text": "Episode text here that MUST include all the simple vocabulary words naturally in the story...",
              "recap": "Brief summary",
              "discussionQuestions": ["Question 1", "Question 2", "Question 3"],
              "vocabularyWords": [
                {{
                  "word": "simple_word", 
                  "clue": "Easy clue that grade 3 students can understand", 
                  "definition": "Very simple definition using easy words"
                }},
                {{
                  "word": "another_simple_word", 
                  "clue": "Another easy hint", 
                  "definition": "Simple definition"
                }}
                // Include 5-8 SIMPLE vocabulary words per episode that ALL appear in the episode text
              ]
            }}
            // Repeat for each episode
          ]
        }}
        
        CRITICAL: 
        - Only use words that grade 3 students (ages 8-9) can read and understand
        - Ensure every word in vocabularyWords actually appears in the episode text
        - Keep vocabulary simple: 3-6 letters, common everyday words
        """
        
        logger.info(f"Sending prompt to OpenAI: {prompt[:100]}...")
        
        try:
            # Call OpenAI API with timeout
            response = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an educational content creator specializing in creating engaging, age-appropriate stories and crossword puzzles for elementary school students. You MUST ensure that every vocabulary word you list actually appears in the story text."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=3000  # Increased to accommodate longer stories with vocabulary integration
            )
            
            # Parse the response
            content = response.choices[0].message.content
            logger.info(f"Received response from OpenAI: {content[:100]}...")
            
            # Try to parse JSON from the response
            try:
                import re
                # Look for JSON pattern in the content
                json_match = re.search(r'{[\s\S]*}', content)
                if json_match:
                    story_data = json.loads(json_match.group(0))
                else:
                    # Try to parse the entire content
                    story_data = json.loads(content)
                
                # Validate that we have required fields
                if "title" not in story_data or "episodes" not in story_data:
                    raise ValueError("Response is missing required fields: title and episodes")
                
                # Validate and clean vocabulary words to ensure they appear in the text
                for episode in story_data.get("episodes", []):
                    episode_text = episode.get("text", "").lower()
                    vocab_words = episode.get("vocabularyWords", [])
                    
                    # Filter vocabulary words to only include those that appear in the text
                    filtered_vocab = []
                    for word_data in vocab_words:
                        word = word_data.get("word", "").lower()
                        if word and word in episode_text:
                            filtered_vocab.append(word_data)
                        else:
                            logger.warning(f"Word '{word}' not found in episode text, excluding from vocabulary")
                    
                    # Update the episode with filtered vocabulary
                    episode["vocabularyWords"] = filtered_vocab
                    
                    # Ensure we have at least 3 words, add theme-appropriate words if needed
                    if len(filtered_vocab) < 3:
                        additional_words = get_theme_words(theme, episode_text, 3 - len(filtered_vocab))
                        episode["vocabularyWords"].extend(additional_words)
                
                # Create story adventure structure
                story_adventure = {
                    "id": story_id,
                    "title": story_data.get("title", f"{theme.capitalize()} Adventure"),
                    "description": story_data.get("description", f"A story about {theme}"),
                    "gradeLevel": f"Grade {grade_level}",
                    "readingLevel": "Early Chapter Book",
                    "episodes": []
                }
                
                # Create puzzle data for each episode
                puzzles = {}
                
                for i, episode in enumerate(story_data.get("episodes", [])):
                    episode_id = f"{story_id}_ep{i+1}"
                    
                    # Extract vocabulary words (with fallback)
                    vocab_words = episode.get("vocabularyWords", [])
                    if not vocab_words:
                        # Create some basic vocabulary words if none provided
                        vocab_words = get_fallback_vocabulary(theme, episode.get("text", ""))
                    
                    # Determine how many puzzles to create (2-4 per episode based on vocabulary count)
                    num_puzzles = min(4, max(2, len(vocab_words) // 3))
                    all_puzzle_ids = []
                    
                    # Create multiple puzzles with different vocabularies
                    for puzzle_idx in range(num_puzzles):
                        puzzle_id = f"{episode_id}_puzzle_{puzzle_idx+1}"
                        all_puzzle_ids.append(puzzle_id)
                        
                        # Distribute vocabulary words among puzzles
                        words_per_puzzle = max(3, len(vocab_words) // num_puzzles)
                        
                        # Calculate which words go in this puzzle
                        start_idx = puzzle_idx * words_per_puzzle
                        end_idx = min(start_idx + words_per_puzzle, len(vocab_words))
                        
                        # Get this puzzle's words
                        puzzle_vocab = vocab_words[start_idx:end_idx]
                        
                        # Ensure we have at least 3 words in each puzzle
                        if len(puzzle_vocab) < 3 and puzzle_idx == 0:
                            # For the first puzzle, include more words if available
                            end_idx = min(len(vocab_words), start_idx + 5)
                            puzzle_vocab = vocab_words[start_idx:end_idx]
                        
                        # Generate crossword puzzle for these words
                        puzzle = generate_simple_crossword(puzzle_vocab, theme)
                        puzzles[puzzle_id] = puzzle
                    
                    # Add to story adventure - use first puzzle as primary
                    primary_puzzle_id = all_puzzle_ids[0] if all_puzzle_ids else f"{episode_id}_puzzle"
                    additional_puzzle_ids = all_puzzle_ids[1:] if len(all_puzzle_ids) > 1 else []
                    
                    story_adventure["episodes"].append({
                        "id": episode_id,
                        "episodeNumber": i + 1,
                        "title": episode.get("title", f"Episode {i+1}"),
                        "text": episode.get("text", "Story text would go here..."),
                        "recap": episode.get("recap") or episode.get("text", "")[:100] + "...",
                        "discussionQuestions": episode.get("discussionQuestions", [
                            "What happened in this story?",
                            "Which character did you like the most?",
                            "What do you think will happen next?"
                        ]),
                        "crosswordPuzzleId": primary_puzzle_id,
                        "additionalPuzzleIds": additional_puzzle_ids,
                        "vocabularyFocus": [word.get("word", "") for word in vocab_words]
                    })
                
                # Return both the story and puzzles
                response_data = {
                    "story": story_adventure,
                    "puzzles": puzzles
                }
                
                # Validate response data can be serialized
                json.dumps(response_data)
                
                return JsonResponse(response_data)
            
            except json.JSONDecodeError as json_error:
                logger.error(f"JSON decode error: {str(json_error)}")
                logger.error(f"Content that failed to parse: {content}")
                
                # Return fallback response with error details
                return create_fallback_response(story_id, theme, episode_count, grade_level)
                
        except Exception as openai_error:
            logger.error(f"OpenAI API error: {str(openai_error)}")
            return create_fallback_response(story_id, theme, episode_count, grade_level)
            
    except Exception as e:
        logger.error(f"Error generating story: {str(e)}")
        logger.error(traceback.format_exc())
        return JsonResponse({
            'error': f'Failed to generate story: {str(e)}',
            'details': traceback.format_exc()
        }, status=500)

def get_theme_words(theme, episode_text, count_needed):
    """Get theme-appropriate words that might appear in the text - Grade 3 level"""
    theme_words = {
        'jungle': [
            {"word": "tree", "clue": "Tall plant with leaves", "definition": "A big plant with a trunk and leaves"},
            {"word": "green", "clue": "Color of grass", "definition": "The color of leaves and grass"},
            {"word": "big", "clue": "Very large", "definition": "Not small, very large"},
            {"word": "wild", "clue": "Not tame", "definition": "Living free in nature"},
            {"word": "leaf", "clue": "Green part of a tree", "definition": "The green parts that grow on trees"},
            {"word": "walk", "clue": "Move with your feet", "definition": "To move by putting one foot in front of the other"},
            {"word": "look", "clue": "Use your eyes to see", "definition": "To see something with your eyes"}
        ],
        'space': [
            {"word": "star", "clue": "Bright light in the sky", "definition": "A bright light you see in the night sky"},
            {"word": "moon", "clue": "Round thing in the night sky", "definition": "The round object that shines at night"},
            {"word": "fly", "clue": "Move through the air", "definition": "To move through the sky"},
            {"word": "up", "clue": "The opposite of down", "definition": "The direction toward the sky"},
            {"word": "far", "clue": "Not close", "definition": "A long way away"},
            {"word": "blue", "clue": "Color of the sky", "definition": "The color of the sky on a sunny day"},
            {"word": "ship", "clue": "Big boat", "definition": "A large boat that travels"}
        ],
        'ocean': [
            {"word": "water", "clue": "What fish swim in", "definition": "The wet stuff that fish live in"},
            {"word": "fish", "clue": "Animal that swims", "definition": "An animal that lives in water"},
            {"word": "blue", "clue": "Color of the sea", "definition": "The color of water and sky"},
            {"word": "wave", "clue": "Moving water", "definition": "Water that moves up and down"},
            {"word": "swim", "clue": "Move in water", "definition": "To move your body through water"},
            {"word": "boat", "clue": "Floats on water", "definition": "Something that carries people on water"},
            {"word": "sand", "clue": "Tiny rocks on the beach", "definition": "Small pieces of rock you find at the beach"}
        ],
        'farm': [
            {"word": "cow", "clue": "Animal that gives milk", "definition": "A big farm animal that makes milk"},
            {"word": "pig", "clue": "Pink farm animal", "definition": "A farm animal that likes mud"},
            {"word": "red", "clue": "Color of an apple", "definition": "The color of fire trucks"},
            {"word": "barn", "clue": "Big farm building", "definition": "A big building where animals live"},
            {"word": "egg", "clue": "What chickens lay", "definition": "Round white thing that chickens make"},
            {"word": "milk", "clue": "White drink from cows", "definition": "White liquid that comes from cows"},
            {"word": "feed", "clue": "Give food to animals", "definition": "To give food to someone or something"}
        ],
        'city': [
            {"word": "car", "clue": "Vehicle with four wheels", "definition": "Something people drive on roads"},
            {"word": "road", "clue": "Where cars drive", "definition": "A path for cars and trucks"},
            {"word": "tall", "clue": "Very high", "definition": "Going way up high"},
            {"word": "bus", "clue": "Big yellow vehicle", "definition": "A big vehicle that carries many people"},
            {"word": "shop", "clue": "Place to buy things", "definition": "A store where you buy things"},
            {"word": "park", "clue": "Green place to play", "definition": "A place with grass and trees to play"},
            {"word": "walk", "clue": "Move with your feet", "definition": "To move by stepping"}
        ],
        'fairytale': [
            {"word": "king", "clue": "Man who rules", "definition": "A man who is the boss of a kingdom"},
            {"word": "cat", "clue": "Pet that says meow", "definition": "A furry pet that purrs"},
            {"word": "big", "clue": "Very large", "definition": "Not small, very large"},
            {"word": "good", "clue": "Not bad", "definition": "Nice and right"},
            {"word": "help", "clue": "Give a hand", "definition": "To do something nice for someone"},
            {"word": "home", "clue": "Where you live", "definition": "The place where you live"},
            {"word": "kind", "clue": "Nice and caring", "definition": "Being nice to others"}
        ]
    }
    
    words = theme_words.get(theme, theme_words['jungle'])
    
    # Filter words that might actually appear in the text
    filtered_words = []
    episode_text_lower = episode_text.lower()
    
    for word_data in words:
        word = word_data["word"].lower()
        if word in episode_text_lower and len(filtered_words) < count_needed:
            filtered_words.append(word_data)
    
    return filtered_words

def get_fallback_vocabulary(theme, episode_text):
    """Generate fallback vocabulary if none provided - Grade 3 level"""
    return [
        {"word": "fun", "clue": "Having a good time", "definition": "When something makes you happy"},
        {"word": "find", "clue": "Look for and see", "definition": "To look for something and see it"},
        {"word": "go", "clue": "Move from here to there", "definition": "To move from one place to another"},
        {"word": "see", "clue": "Use your eyes", "definition": "To look at something with your eyes"},
        {"word": "run", "clue": "Move very fast", "definition": "To move your legs very fast"}
    ]

def create_fallback_response(story_id, theme, episode_count, grade_level):
    """Create a fallback response when AI generation fails - Grade 3 level"""
    fallback_story = {
        "id": story_id,
        "title": f"{theme.capitalize()} Fun",
        "description": f"A fun story about {theme}",
        "gradeLevel": f"Grade {grade_level}",
        "readingLevel": "Early Chapter Book",
        "episodes": []
    }
    
    fallback_puzzles = {}
    
    # Grade 3 appropriate vocabulary that includes the words in the text
    grade3_vocab = [
        {"word": "fun", "clue": "Having a good time", "definition": "When something makes you happy"},
        {"word": "go", "clue": "Move from here to there", "definition": "To move from one place to another"},
        {"word": "see", "clue": "Use your eyes to look", "definition": "To look at something with your eyes"},
        {"word": "big", "clue": "Very large", "definition": "Not small, very large"},
        {"word": "find", "clue": "Look for and see", "definition": "To look for something and see it"}
    ]
    
    # Create basic episodes
    for i in range(episode_count):
        episode_id = f"{story_id}_ep{i+1}"
        puzzle_id = f"{episode_id}_puzzle_1"
        
        # Episode text that includes the vocabulary words and is appropriate for grade 3
        episode_text = f"The kids go on a fun trip to the {theme}. They see many big and cool things. They find new places to play. It is so much fun to go and see new things!"
        
        fallback_story["episodes"].append({
            "id": episode_id,
            "episodeNumber": i + 1,
            "title": f"Episode {i+1}: Fun Times",
            "text": episode_text,
            "recap": f"The kids have fun in the {theme}.",
            "discussionQuestions": [
                "What did the kids see?",
                "Did they have fun?",
                "What would you like to see?"
            ],
            "crosswordPuzzleId": puzzle_id,
            "additionalPuzzleIds": [],
            "vocabularyFocus": [word["word"] for word in grade3_vocab]
        })
        
        # Create corresponding puzzle
        fallback_puzzles[puzzle_id] = generate_simple_crossword(grade3_vocab, theme)
    
    return JsonResponse({
        "story": fallback_story,
        "puzzles": fallback_puzzles
    })

def generate_simple_crossword(vocab_words, theme):
    """Generate a simple crossword puzzle from vocabulary words"""
    # Create a basic crossword structure
    words = []
    grid_cells = []
    
    # Get the words from vocab_words
    word_list = [word.get("word", "").upper() for word in vocab_words]
    
    # Calculate a simple grid layout - ensure it's large enough for all words
    grid_width = max(10, max([len(word) for word in word_list] + [0]) + 2)
    grid_height = max(10, len(word_list) * 2)
    
    # Process each vocabulary word
    for i, word_data in enumerate(vocab_words):
        word = word_data.get("word", "").upper()
        # Use the AI-generated clue directly, or generate a basic one if missing
        clue = word_data.get("clue", f"Something related to {theme}")
        definition = word_data.get("definition", f"A word related to {theme}")
        
        if not word:
            continue  # Skip empty words
            
        # In a real implementation, you would calculate proper grid positions
        # Here we're creating a simplified version with basic positioning
        direction = "across" if i % 2 == 0 else "down"
        
        # Basic cell calculations
        if direction == "across":
            start_row = i * 2
            start_col = 0
            cells = [{"row": start_row, "col": start_col + j} for j in range(len(word))]
        else:
            start_row = 0
            start_col = i * 2
            cells = [{"row": start_row + j, "col": start_col} for j in range(len(word))]
            
        # Add each cell to the grid
        grid_cells.extend(cells)
        
        # Add the word data
        words.append({
            "direction": direction,
            "number": i + 1,
            "clue": clue,
            "answer": word,
            "definition": definition,
            "example": f"Example sentence using the word {word.lower()}.",
            "cells": cells
        })
    
    # Create a basic puzzle structure
    return {
        "id": f"{theme}_crossword_{random.randint(1000, 9999)}",
        "title": f"{theme.capitalize()} Crossword",
        "size": {"width": grid_width, "height": grid_height},
        "words": words
    }


@csrf_exempt
@require_http_methods(["POST"])
def generate_crossword_clues(request):
    """
    Generate age-appropriate clues for a list of words using OpenAI GPT
    
    Expects JSON with:
    - words: list of words to generate clues for
    - theme: theme of the crossword/story
    - grade_level: target grade level
    """
    try:
        data = json.loads(request.body)
        words = data.get('words', [])
        theme = data.get('theme', 'general')
        grade_level = data.get('grade_level', 3)
        story_context = data.get('story_context', '')
        
        if not words:
            return JsonResponse({
                'error': 'No words provided'
            }, status=400)
        
        # Set up the prompt for GPT
        prompt = f"""
        Create age-appropriate clues for a {grade_level}rd grade crossword puzzle with a {theme} theme.
        
        For each word in this list, create a brief, clear, and cryptic clue that would help students guess the word without directly stating it:
        {', '.join(words)}
        
        Story context for reference:
        {story_context}
        
        Format your response as a JSON object where the keys are the words and the values are the clues.
        Example: {{"ocean": "Vast body of salt water that covers most of Earth", "shell": "Hard protective covering of sea creatures"}}
        """
        
        # Call OpenAI API
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an educational assistant creating age-appropriate crossword puzzles for elementary school students."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=800
        )
        
        content = response.choices[0].message.content
        
        # Try to parse JSON from the response
        try:
            # Extract JSON object if it's embedded in other text
            import re
            json_match = re.search(r'{[\s\S]*}', content)
            if json_match:
                clues = json.loads(json_match.group(0))
            else:
                # Try parsing the whole response
                clues = json.loads(content)
        except json.JSONDecodeError:
            # Fallback: Create better clues than just "A theme word"
            clues = {}
            for word in words:
                clues[word] = f"This {theme} word has {len(word)} letters and helps on adventures"
            
        return JsonResponse({
            'clues': clues
        })
    
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=500)

# views.py - improved generate_answer_choices
@csrf_exempt
@require_http_methods(["POST"])
def generate_answer_choices(request):
    """
    Generate plausible but incorrect answer choices for a crossword word
    
    Expects JSON with:
    - correct_answer: the correct word
    - theme: theme of the crossword/story
    - grade_level: target grade level
    - num_choices: number of wrong answers to generate
    """
    try:
        data = json.loads(request.body)
        correct_answer = data.get('correct_answer', '')
        theme = data.get('theme', 'general')
        grade_level = data.get('grade_level', 3)
        num_choices = data.get('num_choices', 3)
        
        if not correct_answer:
            return JsonResponse({
                'error': 'No correct_answer provided'
            }, status=400)
        
        # Set up the prompt for GPT with improved instructions
        prompt = f"""
        For a {grade_level}rd grade crossword puzzle with a {theme} theme, 
        generate {num_choices} plausible but incorrect answer choices for the word "{correct_answer}".
        
        The wrong answers MUST BE REAL WORDS that sound or look similar to "{correct_answer}", such as:
        1. Words with similar sounds (like "treasure"/"pleasure"/"feature")
        2. Words with similar spelling patterns
        3. Age-appropriate words that students might confuse with the right answer
        
        Wrong answers should:
        - Be the same length or very close to the same length as "{correct_answer}"
        - Be real English words that grade {grade_level} students might know
        - Be related to the theme or word meaning when possible
        - Be distinct from each other and from the correct answer
        
        Format your response as a JSON array of strings containing only the wrong answers.
        Example for "MAP": ["CAP", "LAP", "NAP"]
        """
        
        # Call OpenAI API
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an educational assistant creating age-appropriate crossword puzzles for elementary school students."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=400
        )
        
        content = response.choices[0].message.content
        
        # Try to parse JSON from the response
        try:
            # Extract JSON array if it's embedded in other text
            import re
            json_match = re.search(r'\[[\s\S]*\]', content)
            if json_match:
                wrong_answers = json.loads(json_match.group(0))
            else:
                # Try parsing the whole response
                wrong_answers = json.loads(content)
        except json.JSONDecodeError:
            # Fallback: Create better wrong answers based on patterns
            wrong_answers = generate_fallback_choices(correct_answer, theme, num_choices)
        
        # Include the correct answer in the shuffled array
        all_choices = wrong_answers[:num_choices]  # Ensure we only take needed number
        
        return JsonResponse({
            'choices': all_choices,
            'correct_answer': correct_answer
        })
    
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=500)

def generate_fallback_choices(word, theme, num=3):
    """Generate fallback choices if AI generation fails"""
    # Common word patterns table (similar to the JavaScript version)
    word_patterns = {
        'treasure': ['pleasure', 'measure', 'feature', 'creature'],
        'path': ['bath', 'math', 'wrath', 'lath'],
        'map': ['cap', 'lap', 'gap', 'tap'],
        # Add more patterns
    }
    
    # Check if word is in patterns
    if word.lower() in word_patterns:
        options = word_patterns[word.lower()]
        # Return a random subset
        import random
        return random.sample(options, min(num, len(options)))
    
    # Otherwise generate variations based on common patterns
    results = []
    
    # Try rhyming patterns
    if len(word) > 2:
        # Change first letter
        import string
        suffix = word[1:].lower()
        for letter in string.ascii_lowercase:
            if letter + suffix != word.lower() and len(results) < num:
                results.append(letter + suffix)
    
    # If still not enough, add words of same length
    common_words = {
        3: ['cat', 'dog', 'hat', 'hot', 'run', 'sit', 'sun', 'tag', 'pen'],
        4: ['book', 'look', 'took', 'time', 'play', 'jump', 'park', 'fish'],
        5: ['train', 'truck', 'water', 'house', 'table', 'plant', 'sheep'],
        6: ['garden', 'school', 'jungle', 'animal', 'planet', 'window'],
        7: ['teacher', 'student', 'weather', 'picture', 'dolphin', 'penguin'],
        8: ['elephant', 'dinosaur', 'computer', 'building', 'mountain'],
    }
    
    if len(word) in common_words and len(results) < num:
        options = common_words[len(word)]
        import random
        while len(results) < num and options:
            idx = random.randint(0, len(options) - 1)
            if options[idx].lower() != word.lower() and options[idx] not in results:
                results.append(options[idx])
            options.pop(idx)
    
    # Return upper case results for consistency
    return [r.upper() for r in results[:num]]

@csrf_exempt
@require_http_methods(["POST"])
def generate_crossword_content(request):
    """
    Generate both clues and answer choices in a single request
    
    Expects JSON with:
    - words: list of words to generate content for
    - theme: theme of the crossword/story
    - grade_level: target grade level
    - story_context: text of the story for context
    """
    try:
        data = json.loads(request.body)
        words = data.get('words', [])
        theme = data.get('theme', 'general')
        grade_level = data.get('grade_level', 3)
        story_context = data.get('story_context', '')
        
        if not words:
            return JsonResponse({
                'error': 'No words provided'
            }, status=400)
        
        # Generate clues for all words
        clues_prompt = f"""
        Create age-appropriate clues for a {grade_level}rd grade crossword puzzle with a {theme} theme.
        
        For each word in this list, create a brief, cryptic clue that would help students guess the word without directly stating it:
        {', '.join(words)}
        
        Story context for reference:
        {story_context}
        
        Format your response as a JSON object where the keys are the words and the values are the clues.
        Example: {{"ocean": "Vast body of salt water that covers most of Earth", "shell": "Hard protective covering of sea creatures"}}
        """
        
        clues_response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an educational assistant creating age-appropriate crossword puzzles for elementary school students."},
                {"role": "user", "content": clues_prompt}
            ],
            temperature=0.7,
            max_tokens=800
        )
        
        clues_content = clues_response.choices[0].message.content
        
        # Parse clues
        try:
            import re
            clues_match = re.search(r'{[\s\S]*}', clues_content)
            if clues_match:
                clues = json.loads(clues_match.group(0))
            else:
                clues = json.loads(clues_content)
        except json.JSONDecodeError:
            # Fallback for clues
            clues = {}
            for word in words:
                clues[word] = f"Find this {len(word)}-letter {theme} word"
        
        # Generate answer choices for each word
        choices = {}
        for word in words:
            try:
                # For each word, generate 3 wrong answers
                choices_prompt = f"""
                For a {grade_level}rd grade crossword puzzle with a {theme} theme, 
                generate 3 plausible but incorrect answer choices for the word "{word}".
                
                The wrong answers should:
                1. Be the same length or very close to the same length as "{word}"
                2. Be real, age-appropriate words that students might know
                3. Be related to the theme or word meaning when possible
                4. Be distinct from each other and from the correct answer
                
                Format your response as a JSON array of strings containing only the wrong answers.
                Example: ["RIVER", "LAKES", "SHORE"]
                """
                
                choices_response = openai.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are an educational assistant creating age-appropriate crossword puzzles for elementary school students."},
                        {"role": "user", "content": choices_prompt}
                    ],
                    temperature=0.7,
                    max_tokens=400
                )
                
                choices_content = choices_response.choices[0].message.content
                
                # Parse wrong answers
                import re
                choices_match = re.search(r'\[[\s\S]*\]', choices_content)
                if choices_match:
                    wrong_answers = json.loads(choices_match.group(0))
                else:
                    wrong_answers = json.loads(choices_content)
                
                # Shuffle and store
                import random
                all_choices = [word] + wrong_answers
                random.shuffle(all_choices)
                choices[word] = all_choices
                
            except Exception as word_error:
                # Fallback for this word
                import random
                import string
                
                # Create simple wrong answers
                wrong_answers = []
                for _ in range(3):
                    wrong = list(word)
                    # Change 1-2 characters
                    for _ in range(random.randint(1, 2)):
                        pos = random.randint(0, len(wrong) - 1)
                        wrong[pos] = random.choice(string.ascii_uppercase)
                    wrong_answer = ''.join(wrong)
                    if wrong_answer != word and wrong_answer not in wrong_answers:
                        wrong_answers.append(wrong_answer)
                
                # Add to choices
                all_choices = [word] + wrong_answers
                random.shuffle(all_choices)
                choices[word] = all_choices
        
        return JsonResponse({
            'clues': clues,
            'choices': choices
        })
        
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=500)