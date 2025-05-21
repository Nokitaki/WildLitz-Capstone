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
        
        # Create a more detailed prompt to include better clue generation
        prompt = f"""
        Create a {episode_count}-episode educational story for grade {grade_level} students with a {theme} theme.
        
        {character_names and f"Use these character names: {character_names}" or ""}
        
        Include vocabulary focusing on {', '.join(focus_skills)}.
        
        For each episode, provide 8-12 vocabulary words with age-appropriate definitions and examples.
        
        For each vocabulary word, create a challenging but age-appropriate crossword puzzle clue that gives a hint about the word without directly stating it. For example, instead of "Clue for map", create something like "Paper guide to find your way" for the word "map".
        
        Format as JSON:
        {{
          "title": "Story Title",
          "description": "Brief description",
          "episodes": [
            {{
              "title": "Episode Title",
              "text": "Episode text here...",
              "recap": "Brief summary",
              "discussionQuestions": ["Question 1", "Question 2", "Question 3"],
              "vocabularyWords": [
                {{
                  "word": "word1", 
                  "clue": "Cryptic, age-appropriate hint about the word", 
                  "definition": "kid-friendly definition"
                }},
                {{
                  "word": "word2", 
                  "clue": "Another hint about this word", 
                  "definition": "simple definition"
                }}
                // Include 8-12 vocabulary words per episode
              ]
            }}
            // Repeat for each episode
          ]
        }}
        """
        
        logger.info(f"Sending prompt to OpenAI: {prompt[:100]}...")
        
        try:
            # Call OpenAI API with timeout
            response = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an educational content creator specializing in creating engaging, age-appropriate stories and crossword puzzles for elementary school students."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2500  # Increased to accommodate more vocabulary words
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
                        vocab_words = [
                            {"word": "example", "clue": "Something that shows what something else is like", "definition": "A model or pattern"}
                        ]
                    
                    # Determine how many puzzles to create (3-5 per episode)
                    num_puzzles = min(5, max(3, len(vocab_words) // 3))
                    all_puzzle_ids = []
                    
                    # Create multiple puzzles with different vocabularies
                    for puzzle_idx in range(num_puzzles):
                        puzzle_id = f"{episode_id}_puzzle_{puzzle_idx+1}"
                        all_puzzle_ids.append(puzzle_id)
                        
                        # Distribute vocabulary words among puzzles
                        # For example, if we have 12 words and 4 puzzles, each gets 3 words
                        words_per_puzzle = max(3, len(vocab_words) // num_puzzles)
                        
                        # Calculate which words go in this puzzle
                        start_idx = puzzle_idx * words_per_puzzle
                        end_idx = min(start_idx + words_per_puzzle, len(vocab_words))
                        
                        # Get this puzzle's words
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
                return JsonResponse({
                    'error': 'Could not parse the generated story',
                    'details': str(json_error),
                    'story': {
                        "id": story_id,
                        "title": f"{theme.capitalize()} Adventure",
                        "description": f"A story about {theme}",
                        "gradeLevel": f"Grade {grade_level}",
                        "readingLevel": "Early Chapter Book",
                        "episodes": [{
                            "id": f"{story_id}_ep1",
                            "episodeNumber": 1,
                            "title": "The Adventure Begins",
                            "text": "Once upon a time in a magical land, a great adventure began. The heroes set out on a journey filled with excitement and learning.",
                            "recap": "The heroes begin their adventure.",
                            "discussionQuestions": ["What do you think will happen?", "Who is your favorite character?"],
                            "crosswordPuzzleId": f"{story_id}_ep1_puzzle_1",
                            "additionalPuzzleIds": [f"{story_id}_ep1_puzzle_2", f"{story_id}_ep1_puzzle_3"],
                            "vocabularyFocus": ["adventure", "journey", "magical", "heroes", "excitement"]
                        }]
                    },
                    'puzzles': {
                        f"{story_id}_ep1_puzzle_1": generate_simple_crossword([
                            {"word": "adventure", "clue": "An exciting trip or experience", "definition": "An unusual and exciting experience"},
                            {"word": "journey", "clue": "A trip from one place to another", "definition": "The act of traveling from one place to another"}
                        ], theme),
                        f"{story_id}_ep1_puzzle_2": generate_simple_crossword([
                            {"word": "magical", "clue": "Special, like in fairy tales", "definition": "Very special and exciting, as if created by magic"},
                            {"word": "heroes", "clue": "Brave people who do great things", "definition": "People who are admired for their courage or achievements"}
                        ], theme),
                        f"{story_id}_ep1_puzzle_3": generate_simple_crossword([
                            {"word": "excitement", "clue": "Feeling really happy and eager", "definition": "A feeling of great enthusiasm and eagerness"}
                        ], theme)
                    }
                })
                
        except Exception as openai_error:
            logger.error(f"OpenAI API error: {str(openai_error)}")
            return JsonResponse({
                'error': 'Failed to generate story using OpenAI',
                'details': str(openai_error)
            }, status=500)
            
    except Exception as e:
        logger.error(f"Error generating story: {str(e)}")
        logger.error(traceback.format_exc())
        return JsonResponse({
            'error': f'Failed to generate story: {str(e)}',
            'details': traceback.format_exc()
        }, status=500)

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