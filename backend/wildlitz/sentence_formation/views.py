# sentence_formation/views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
import json
import openai
import time
from django.conf import settings
import random
import datetime
import logging
import traceback

# Import progress tracking
from api.models import UserProgress, UserActivity

# Configure logger
logger = logging.getLogger(__name__)

# Configure OpenAI API key from settings
openai.api_key = settings.OPENAI_API_KEY

def log_sentence_formation_activity(user, activity_type, question_data, user_answer, correct_answer, is_correct, time_spent, difficulty='medium', challenge_level='', learning_focus=''):
    """Helper function to log sentence formation activities"""
    try:
        if user.is_authenticated:
            UserActivity.objects.create(
                user=user,
                module='sentence_formation',
                activity_type=activity_type,
                question_data=question_data,
                user_answer=user_answer,
                correct_answer=correct_answer,
                is_correct=is_correct,
                time_spent=time_spent,
                difficulty=difficulty,
                challenge_level=challenge_level,
                learning_focus=learning_focus
            )
            
            # Update progress summary
            progress, created = UserProgress.objects.get_or_create(
                user=user,
                module='sentence_formation',
                difficulty=difficulty,
                defaults={
                    'total_attempts': 0,
                    'correct_answers': 0,
                    'accuracy_percentage': 0.0,
                    'average_time_per_question': 0.0
                }
            )
            progress.update_progress(is_correct, time_spent)
    except Exception as e:
        logger.error(f"Error logging sentence formation activity: {str(e)}")

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def test_endpoint(request):
    """Simple test endpoint to verify API connectivity"""
    return JsonResponse({"status": "success", "message": "API is working"})

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
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
        data = request.data
        theme = data.get('theme', 'jungle')
        focus_skills = data.get('focusSkills', ['sight-words'])
        character_names = data.get('characterNames', '')
        episode_count = min(int(data.get('episodeCount', 3)), 5)  # Limit to 5 episodes max
        grade_level = data.get('gradeLevel', 3)
        
        # Validate the OpenAI API key
        if not settings.OPENAI_API_KEY:
            logger.error("OpenAI API key is missing")
            return Response({
                'error': 'OpenAI API key is not configured'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
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
        - Focus on sight words and basic phonics patterns
        - Words should be 3-6 letters long
        - Avoid complex vocabulary or abstract concepts
        
        For each episode, provide:
        1. Episode number and title
        2. Story text (150-200 words, engaging and age-appropriate)
        3. Brief recap sentence
        4. 2-3 discussion questions
        5. List of vocabulary words that appear in the episode
        6. Simple crossword clues for each vocabulary word
        
        Return ONLY a valid JSON object in this exact format:
        {{
          "story": {{
            "id": "{story_id}",
            "title": "Story Title",
            "theme": "{theme}",
            "gradeLevel": {grade_level},
            "totalEpisodes": {episode_count},
            "episodes": [
              {{
                "id": "episode_1",
                "episodeNumber": 1,
                "title": "Episode Title",
                "text": "Story text that includes the vocabulary words naturally...",
                "recap": "Brief summary of the episode",
                "discussionQuestions": ["Question 1?", "Question 2?", "Question 3?"],
                "crosswordPuzzleId": "puzzle_1",
                "additionalPuzzleIds": [],
                "vocabularyFocus": ["word1", "word2", "word3", "word4", "word5"]
              }}
            ]
          }},
          "puzzles": {{
            "puzzle_1": {{
              "id": "puzzle_1",
              "title": "Episode 1 Crossword",
              "size": {{"width": 10, "height": 10}},
              "words": [
                {{
                  "direction": "across",
                  "number": 1,
                  "clue": "Age-appropriate clue for the word",
                  "answer": "WORD",
                  "definition": "Simple definition",
                  "example": "Example sentence using the word",
                  "cells": [{{"row": 0, "col": 0}}, {{"row": 0, "col": 1}}, {{"row": 0, "col": 2}}, {{"row": 0, "col": 3}}]
                }}
              ]
            }}
          }}
        }}
        """
        
        try:
            # Call OpenAI API with the updated interface
            response = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an educational content creator specializing in stories and puzzles for elementary school students. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=4000
            )
            
            # Get the response content
            response_content = response.choices[0].message.content
            logger.info("Raw GPT response received")
            
            try:
                # Try to parse the JSON response
                story_data = json.loads(response_content)
                logger.info("Successfully parsed GPT response as JSON")
                
                return Response(story_data)
                
            except json.JSONDecodeError as json_error:
                logger.warning(f"Failed to parse GPT response as JSON: {json_error}")
                # Try to extract JSON from the response if it's wrapped in other text
                import re
                json_match = re.search(r'{[\s\S]*}', response_content)
                if json_match:
                    try:
                        story_data = json.loads(json_match.group(0))
                        return Response(story_data)
                    except json.JSONDecodeError:
                        pass
                
                logger.error("Could not extract valid JSON from GPT response, falling back to default")
                # Fall back to default story
                return Response(create_fallback_story(theme, episode_count, grade_level, focus_skills))
                
        except Exception as openai_error:
            logger.error(f"OpenAI API error: {openai_error}")
            # Return a fallback story
            return Response(create_fallback_story(theme, episode_count, grade_level, focus_skills))
    
    except Exception as e:
        logger.error(f"Error in generate_story: {str(e)}")
        logger.error(traceback.format_exc())
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

def create_fallback_story(theme, episode_count, grade_level, focus_skills):
    """Create a fallback story if AI generation fails"""
    story_id = f"{theme}_fallback_{int(datetime.datetime.now().timestamp())}"
    
    # Grade 3 appropriate vocabulary
    grade3_vocab = [
        {"word": "RUN", "clue": "Move fast with your legs", "definition": "To move quickly on foot"},
        {"word": "BIG", "clue": "Not small", "definition": "Large in size"},
        {"word": "TREE", "clue": "Tall plant with leaves", "definition": "A tall woody plant"},
        {"word": "HELP", "clue": "Give aid to someone", "definition": "To assist or aid"},
        {"word": "JUMP", "clue": "Leap up high", "definition": "To spring up from the ground"},
        {"word": "LOOK", "clue": "Use your eyes", "definition": "To see or observe"},
        {"word": "PLAY", "clue": "Have fun", "definition": "To engage in games or activities"},
        {"word": "FIND", "clue": "Discover something", "definition": "To locate or discover"}
    ]
    
    fallback_story = {
        "story": {
            "id": story_id,
            "title": f"The Great {theme.capitalize()} Adventure",
            "theme": theme,
            "gradeLevel": grade_level,
            "totalEpisodes": episode_count,
            "episodes": []
        }
    }
    
    fallback_puzzles = {}
    
    for i in range(episode_count):
        episode_id = f"episode_{i+1}"
        puzzle_id = f"puzzle_{i+1}"
        
        episode_text = f"""The kids go to the {theme}. They can run and play there. They look for big things to see. 
They see many big and cool things. They find new places to play. It is so much fun to go and see new things!
The kids help each other. They jump and run all day. They look at everything. When they find something new, they play with it.
They see many big and cool things. They find new places to play. It is so much fun to go and see new things!"""
        
        fallback_story["story"]["episodes"].append({
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
    
    fallback_story["puzzles"] = fallback_puzzles
    return fallback_story

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
@api_view(['POST'])
@permission_classes([AllowAny])
def generate_crossword_clues(request):
    """
    Generate age-appropriate clues for a list of words using OpenAI GPT
    
    Expects JSON with:
    - words: list of words to generate clues for
    - theme: theme of the crossword/story
    - grade_level: target grade level
    """
    try:
        data = request.data
        words = data.get('words', [])
        theme = data.get('theme', 'general')
        grade_level = data.get('grade_level', 3)
        story_context = data.get('story_context', '')
        
        if not words:
            return Response({
                'error': 'No words provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
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
            
        return Response({
            'clues': clues
        })
    
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
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
        data = request.data
        correct_answer = data.get('correct_answer', '')
        theme = data.get('theme', 'general')
        grade_level = data.get('grade_level', 3)
        num_choices = data.get('num_choices', 3)
        
        if not correct_answer:
            return Response({
                'error': 'No correct_answer provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
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
        
        return Response({
            'choices': all_choices,
            'correct_answer': correct_answer
        })
    
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def generate_fallback_choices(word, theme, num=3):
    """Generate fallback choices if AI generation fails"""
    # Common word patterns based on rhyming or similar sounds
    word_patterns = {
        'treasure': ['pleasure', 'measure', 'feature', 'creature'],
        'path': ['bath', 'math', 'wrath', 'lath'],
        'map': ['cap', 'lap', 'gap', 'tap'],
        'tree': ['free', 'flee', 'three', 'bee'],
        'run': ['fun', 'sun', 'gun', 'bun'],
        'big': ['dig', 'fig', 'pig', 'wig'],
        'help': ['kelp', 'yelp', 'whelp'],
        'jump': ['bump', 'dump', 'pump', 'hump'],
        'look': ['book', 'cook', 'hook', 'took'],
        'play': ['clay', 'gray', 'pray', 'stay'],
        'find': ['bind', 'kind', 'mind', 'wind']
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
@api_view(['POST'])
@permission_classes([AllowAny])
def log_crossword_activity(request):
    """Log crossword puzzle completion and sentence building activity"""
    start_time = time.time()
    
    try:
        data = request.data
        activity_type = data.get('activity_type', 'crossword_completion')  # crossword_completion or sentence_building
        puzzle_data = data.get('puzzle_data', {})
        user_answers = data.get('user_answers', {})
        correct_answers = data.get('correct_answers', {})
        time_spent = data.get('time_spent', time.time() - start_time)
        difficulty = data.get('difficulty', 'medium')
        theme = data.get('theme', 'general')
        
        # Calculate correctness
        if activity_type == 'crossword_completion':
            total_words = len(correct_answers)
            correct_words = sum(1 for word, answer in user_answers.items() 
                              if answer.upper() == correct_answers.get(word, '').upper())
            is_correct = (correct_words / total_words) >= 0.7 if total_words > 0 else False
            
            challenge_level = 'crossword_puzzle'
            learning_focus = 'vocabulary_comprehension'
            
        elif activity_type == 'sentence_building':
            # For sentence building, check if sentence contains the target word properly
            sentence = user_answers.get('sentence', '')
            target_word = user_answers.get('target_word', '')
            
            # Basic validation: contains word, starts with capital, ends with punctuation
            contains_word = target_word.lower() in sentence.lower()
            starts_capital = len(sentence) > 0 and sentence[0].isupper()
            ends_punctuation = len(sentence) > 0 and sentence[-1] in '.!?'
            
            is_correct = contains_word and starts_capital and ends_punctuation
            challenge_level = 'sentence_construction'
            learning_focus = 'sentence_formation'
            
        else:
            is_correct = False
            challenge_level = 'general'
            learning_focus = 'reading_comprehension'
        
        # Log activity for authenticated users
        if request.user.is_authenticated:
            log_sentence_formation_activity(
                user=request.user,
                activity_type=activity_type,
                question_data={
                    'puzzle_data': puzzle_data,
                    'theme': theme,
                    'total_items': len(correct_answers) if activity_type == 'crossword_completion' else 1
                },
                user_answer=user_answers,
                correct_answer=correct_answers,
                is_correct=is_correct,
                time_spent=time_spent,
                difficulty=difficulty,
                challenge_level=challenge_level,
                learning_focus=learning_focus
            )
        
        response_data = {
            'logged': request.user.is_authenticated,
            'is_correct': is_correct,
            'feedback': 'Excellent work!' if is_correct else 'Keep practicing!'
        }
        
        # Add progress info for authenticated users
        if request.user.is_authenticated:
            try:
                progress = UserProgress.objects.get(
                    user=request.user,
                    module='sentence_formation',
                    difficulty=difficulty
                )
                response_data['progress'] = {
                    'total_attempts': progress.total_attempts,
                    'accuracy_percentage': progress.accuracy_percentage,
                    'correct_answers': progress.correct_answers
                }
            except UserProgress.DoesNotExist:
                pass
        
        return Response(response_data)
        
    except Exception as e:
        logger.error(f"Error logging crossword activity: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)