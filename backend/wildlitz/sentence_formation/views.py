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
from supabase import create_client
from datetime import datetime, timedelta
import traceback
# Import progress tracking
from api.models import UserProgress, UserActivity

# Configure logger
logger = logging.getLogger(__name__)

# Configure OpenAI API key from settings
openai.api_key = settings.OPENAI_API_KEY


supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

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
    Generate an educational story using OpenAI GPT with improved focus skill matching
    """
    try:
        # Parse request data
        data = request.data
        theme = data.get('theme', 'jungle')
        focus_skills = data.get('focusSkills', ['sight-words'])
        character_names = data.get('characterNames', '')
        episode_count = min(int(data.get('episodeCount', 3)), 5)
        grade_level = data.get('gradeLevel', 3)
        
        logger.info(f"📚 Story generation request: theme={theme}, skills={focus_skills}, episodes={episode_count}")
        
        # Validate the OpenAI API key
        if not settings.OPENAI_API_KEY:
            logger.error("OpenAI API key is missing")
            return Response({
                'error': 'OpenAI API key is not configured'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        # Create a unique ID for this story
        story_id = f"{theme}_generated_{int(datetime.now().timestamp())}"
        
        # Calculate max_tokens dynamically
        max_tokens = max(3000, episode_count * 1200 + 500)
        
        # Get vocabulary guidance for selected focus skills
        vocab_guidance = get_vocabulary_guidance(focus_skills)
        
        logger.info(f"📝 Generating with focus skills: {focus_skills}")
        
        # IMPROVED PROMPT with specific vocabulary guidance
        prompt = f"""
        Create EXACTLY {episode_count} complete episodes for an educational story for grade {grade_level} students with a {theme} theme.
        
        {character_names and f"Use these character names: {character_names}" or ""}
        
        CRITICAL: You MUST create all {episode_count} episodes. Do not create fewer episodes than requested!
        
        ================================
        FOCUS SKILLS VOCABULARY REQUIREMENTS:
        ================================
        The vocabulary words MUST match these focus skills:
        {vocab_guidance['detailed_guidance']}
        
        VOCABULARY SELECTION RULES:
        1. Select 5-7 vocabulary words PER EPISODE that match the focus skills above
        2. ONLY use words that fit the focus skill categories
        3. Words must be 3-6 letters long (grade 3 appropriate)
        4. Each vocabulary word MUST appear naturally in the story text
        5. Words should be simple enough for 8-9 year olds to understand
        
        EXAMPLE VOCABULARY WORDS YOU CAN USE:
        {', '.join(vocab_guidance['example_words'][:30])}
        
        ================================
        STORY REQUIREMENTS:
        ================================
        For EACH episode:
        - 150-200 words total (appropriate reading length)
        - Engaging narrative with the vocabulary words used naturally
        - The vocabulary words should be integral to the story, not forced
        
        For EACH of the {episode_count} episodes, provide:
        1. Episode number and title
        2. Story text (150-200 words) that naturally includes the vocabulary words
        3. Brief recap sentence
        4. 2-3 discussion questions
        5. List of vocabulary words (5-7 words that match the focus skills)
        6. Simple crossword clues for each vocabulary word
        
        Return ONLY a valid JSON object in this exact format:
        {{
          "story": {{
            "id": "{story_id}",
            "title": "Story Title",
            "theme": "{theme}",
            "gradeLevel": {grade_level},
            "totalEpisodes": {episode_count},
            "focusSkills": {json.dumps(focus_skills)},
            "episodes": [
              {{
                "id": "episode_1",
                "episodeNumber": 1,
                "title": "Episode Title",
                "text": "Story text that naturally uses the vocabulary words...",
                "recap": "Brief summary",
                "discussionQuestions": ["Question 1?", "Question 2?"],
                "crosswordPuzzleId": "puzzle_1",
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
                  "clue": "Simple grade 3 clue",
                  "answer": "WORD",
                  "definition": "Kid-friendly definition",
                  "example": "Example sentence",
                  "cells": [{{"row": 0, "col": 0}}]
                }}
              ]
            }}
          }}
        }}
        """
        
        try:
            # Call OpenAI API
            response = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system", 
                        "content": "You are an expert educational content creator for elementary students. You always create vocabulary that matches the specified focus skills perfectly."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                max_tokens=max_tokens,
                temperature=0.7
            )
            
            response_content = response.choices[0].message.content.strip()
            logger.info(f"✅ Received response from OpenAI (length: {len(response_content)})")
            
            # Parse the JSON response
            try:
                story_data = json.loads(response_content)
                
                # Validate that we got the right number of episodes
                episodes_received = len(story_data.get('story', {}).get('episodes', []))
                if episodes_received < episode_count:
                    logger.warning(f"⚠️ Generated only {episodes_received} episodes, expected {episode_count}")
                
                return Response(story_data)
                
            except json.JSONDecodeError as json_error:
                logger.error(f"JSON parsing error: {json_error}")
                # Try to extract JSON
                import re
                json_match = re.search(r'{[\s\S]*}', response_content)
                if json_match:
                    try:
                        story_data = json.loads(json_match.group(0))
                        return Response(story_data)
                    except json.JSONDecodeError:
                        pass
                
                # Fall back to default story
                logger.info("Falling back to default story")
                return Response(create_improved_fallback_story(theme, episode_count, grade_level, focus_skills))
                
        except Exception as openai_error:
            logger.error(f"OpenAI API error: {openai_error}")
            logger.error(traceback.format_exc())
            return Response(create_improved_fallback_story(theme, episode_count, grade_level, focus_skills))
    
    except Exception as e:
        logger.error(f"Error in generate_story: {str(e)}")
        logger.error(traceback.format_exc())
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


def create_improved_fallback_story(theme, episode_count, grade_level, focus_skills):
    """Create a fallback story with vocabulary matching the focus skills"""
    
    story_id = f"{theme}_fallback_{int(datetime.now().timestamp())}"
    
    # Get appropriate vocabulary based on focus skills
    all_vocab = []
    for skill in focus_skills:
        if skill in FOCUS_SKILL_VOCABULARY:
            all_vocab.extend(FOCUS_SKILL_VOCABULARY[skill]['examples'][:5])
    
    # If no vocabulary found, use default action verbs
    if not all_vocab:
        all_vocab = ['run', 'jump', 'look', 'find', 'help', 'walk', 'play']
    
    # Create vocabulary list with crossword data
    vocab_list = []
    for word in all_vocab[:7]:  # Limit to 7 words
        vocab_list.append({
            "word": word.upper(),
            "clue": f"A word for grade {grade_level}",
            "definition": f"A {grade_level}rd grade word"
        })
    
    fallback_story = {
        "story": {
            "id": story_id,
            "title": f"The Great {theme.capitalize()} Adventure",
            "theme": theme,
            "gradeLevel": grade_level,
            "totalEpisodes": episode_count,
            "focusSkills": focus_skills,
            "episodes": []
        },
        "puzzles": {}
    }
    
    for i in range(episode_count):
        episode_id = f"episode_{i+1}"
        puzzle_id = f"puzzle_{i+1}"
        
        # Create story text using the vocabulary words
        vocab_words = [v['word'].lower() for v in vocab_list]
        episode_text = f"""The kids {vocab_words[0]} to the {theme}. They {vocab_words[1]} and {vocab_words[2]} around. 
They {vocab_words[3]} so many cool things! They {vocab_words[4]} each other all day. 
It is fun to {vocab_words[5]} and {vocab_words[6]}!"""
        
        fallback_story["story"]["episodes"].append({
            "id": episode_id,
            "episodeNumber": i + 1,
            "title": f"Episode {i+1}: Fun Times",
            "text": episode_text,
            "recap": f"The kids have adventures in the {theme}.",
            "discussionQuestions": [
                "What did the kids do?",
                "Did they have fun?",
                "What would you do?"
            ],
            "crosswordPuzzleId": puzzle_id,
            "vocabularyFocus": vocab_words
        })
        
        # Create puzzle
        fallback_story["puzzles"][puzzle_id] = generate_simple_crossword(vocab_list, theme)
    
    return fallback_story

def generate_simple_crossword(vocab_words, theme):
    """Generate a simple crossword puzzle from vocabulary words"""
    words = []
    
    for i, word_data in enumerate(vocab_words):
        word = word_data.get("word", "").upper()
        clue = word_data.get("clue", f"Something related to {theme}")
        definition = word_data.get("definition", f"A word related to {theme}")
        
        if not word:
            continue
            
        direction = "across" if i % 2 == 0 else "down"
        
        if direction == "across":
            start_row = i * 2
            start_col = 0
            cells = [{"row": start_row, "col": start_col + j} for j in range(len(word))]
        else:
            start_row = 0
            start_col = i * 2
            cells = [{"row": start_row + j, "col": start_col} for j in range(len(word))]
            
        words.append({
            "direction": direction,
            "number": i + 1,
            "clue": clue,
            "answer": word,
            "definition": definition,
            "example": f"Example sentence using the word {word.lower()}.",
            "cells": cells
        })
    
    grid_width = max(10, max([len(word) for word in [w.get("answer", "") for w in words]] + [0]) + 2)
    grid_height = max(10, len(words) * 2)
    
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


@csrf_exempt
@api_view(['GET'])
@permission_classes([AllowAny])
def get_crossword_analytics(request):
    """
    Get basic analytics for crossword game sessions
    Teachers can see: total games played, words solved, accuracy, time spent
    """
    try:
        # Get all crossword-related activities
        crossword_activities = UserActivity.objects.filter(
            module='sentence_formation',
            activity_type__in=['crossword_word_solved', 'crossword_game_completed']
        )
        
        # Basic stats
        total_games = crossword_activities.filter(activity_type='crossword_game_completed').count()
        total_words_attempted = crossword_activities.filter(activity_type='crossword_word_solved').count()
        correct_words = crossword_activities.filter(
            activity_type='crossword_word_solved',
            is_correct=True
        ).count()
        
        # Calculate accuracy
        accuracy = (correct_words / total_words_attempted * 100) if total_words_attempted > 0 else 0
        
        # Calculate average time per game
        completed_games = crossword_activities.filter(activity_type='crossword_game_completed')
        total_time = sum([game.time_spent for game in completed_games], 0)
        avg_time_per_game = (total_time / total_games) if total_games > 0 else 0
        
        # Get recent activities (last 10)
        recent_activities = crossword_activities.order_by('-timestamp')[:10].values(
            'activity_type',
            'is_correct',
            'time_spent',
            'timestamp',
            'question_data'
        )
        
        # Most solved words
        word_stats = {}
        for activity in crossword_activities.filter(activity_type='crossword_word_solved'):
            word = activity.question_data.get('word', 'Unknown')
            if word not in word_stats:
                word_stats[word] = {'attempts': 0, 'correct': 0}
            word_stats[word]['attempts'] += 1
            if activity.is_correct:
                word_stats[word]['correct'] += 1
        
        # Convert to list and sort by attempts
        popular_words = [
            {
                'word': word,
                'attempts': stats['attempts'],
                'correct': stats['correct'],
                'accuracy': (stats['correct'] / stats['attempts'] * 100) if stats['attempts'] > 0 else 0
            }
            for word, stats in word_stats.items()
        ]
        popular_words.sort(key=lambda x: x['attempts'], reverse=True)
        top_words = popular_words[:10]
        
        return JsonResponse({
            'success': True,
            'analytics': {
                'total_games_played': total_games,
                'total_words_attempted': total_words_attempted,
                'total_correct_words': correct_words,
                'overall_accuracy': round(accuracy, 1),
                'average_time_per_game': round(avg_time_per_game, 1),
                'recent_activities': list(recent_activities),
                'top_words': top_words
            }
        })
        
    except Exception as e:
        logger.error(f"Error fetching crossword analytics: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def log_crossword_activity(request):
    """
    Log crossword game activity
    Call this when: 1) A word is solved, 2) A game is completed
    """
    try:
        data = request.data
        
        # Create activity record
        activity = UserActivity.objects.create(
            user=request.user if request.user.is_authenticated else User.objects.get(id=1),  # Use guest user if not authenticated
            module='sentence_formation',
            activity_type=data.get('activity_type'),  # 'crossword_word_solved' or 'crossword_game_completed'
            question_data=data.get('question_data', {}),
            user_answer=data.get('user_answer', {}),
            correct_answer=data.get('correct_answer', {}),
            is_correct=data.get('is_correct', False),
            time_spent=data.get('time_spent', 0),
            difficulty=data.get('difficulty', 'medium'),
            challenge_level=data.get('challenge_level', ''),
            learning_focus=data.get('learning_focus', '')
        )
        
        return JsonResponse({
            'success': True,
            'activity_id': activity.id,
            'message': 'Activity logged successfully'
        })
        
    except Exception as e:
        logger.error(f"Error logging crossword activity: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)
    
    # ==================== ADD THESE TO THE END OF YOUR views.py FILE ====================

# STORY GENERATOR ANALYTICS VIEWS
# Add these 6 functions at the very end of your sentence_formation/views.py

@api_view(['POST'])
@permission_classes([AllowAny])
def create_story_session(request):
    """Create a new story game session"""
    try:
        data = request.data
        user_email = data.get('user_email', 'guest@wildlitz.com')
        user_id = data.get('user_id')
        
        session_data = {
            'user_id': user_id,
            'user_email': user_email,
            'story_id': data.get('story_id'),
            'story_title': data.get('story_title'),
            'theme': data.get('theme'),
            'focus_skills': data.get('focus_skills', []),
            'episode_count': data.get('episode_count', 0),
            'character_names': data.get('character_names', ''),
            'current_episode': 1,
            'metadata': data.get('metadata', {})
        }
        
        response = supabase.table('story_game_sessions').insert(session_data).execute()
        
        if response.data:
            logger.info(f"Story session created: {response.data[0]['id']}")
            return Response({
                'success': True,
                'session_id': response.data[0]['id'],
                'session': response.data[0]
            }, status=status.HTTP_201_CREATED)
        else:
            logger.error("Failed to create session - no data returned")
            return Response({
                'error': 'Failed to create session'
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Error creating story session: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([AllowAny])
def update_story_session(request, session_id):
    """Update an existing story game session"""
    try:
        data = request.data
        update_data = {}
        
        # Update fields if provided
        if 'episodes_completed' in data:
            update_data['episodes_completed'] = data['episodes_completed']
        if 'current_episode' in data:
            update_data['current_episode'] = data['current_episode']
        if 'total_words_solved' in data:
            update_data['total_words_solved'] = data['total_words_solved']
        if 'total_puzzles_completed' in data:
            update_data['total_puzzles_completed'] = data['total_puzzles_completed']
        if 'total_hints_used' in data:
            update_data['total_hints_used'] = data['total_hints_used']
        if 'average_time_per_word' in data:
            update_data['average_time_per_word'] = data['average_time_per_word']
        if 'story_reading_time_seconds' in data:
            update_data['story_reading_time_seconds'] = data['story_reading_time_seconds']
        if 'vocabulary_words_learned' in data:
            update_data['vocabulary_words_learned'] = data['vocabulary_words_learned']
        if 'reading_coach_interactions' in data:
            update_data['reading_coach_interactions'] = data['reading_coach_interactions']
        if 'is_completed' in data:
            update_data['is_completed'] = data['is_completed']
            if data['is_completed']:
                update_data['session_end'] = datetime.now().isoformat()
        if 'completion_percentage' in data:
            update_data['completion_percentage'] = data['completion_percentage']
        if 'total_duration_seconds' in data:
            update_data['total_duration_seconds'] = data['total_duration_seconds']
        if 'metadata' in data:
            update_data['metadata'] = data['metadata']
        
        response = supabase.table('story_game_sessions').update(update_data).eq('id', session_id).execute()
        
        if response.data:
            logger.info(f"Story session updated: {session_id}")
            return Response({
                'success': True,
                'session': response.data[0]
            })
        else:
            logger.warning(f"Session not found: {session_id}")
            return Response({
                'error': 'Session not found'
            }, status=status.HTTP_404_NOT_FOUND)
            
    except Exception as e:
        logger.error(f"Error updating story session: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def log_story_activity(request):
    """Log a story game activity"""
    try:
        data = request.data
        user_email = data.get('user_email', 'guest@wildlitz.com')
        time_spent = data.get('time_spent_seconds', 0)
        time_spent_int = int(round(time_spent)) if time_spent else 0


        activity_data = {
            'session_id': data.get('session_id'),
            'user_id': data.get('user_id'),
            'user_email': user_email,
            'activity_type': data.get('activity_type'),
            'episode_number': data.get('episode_number'),
            'puzzle_id': data.get('puzzle_id'),
            'word_data': data.get('word_data', {}),
            'user_answer': data.get('user_answer'),
            'is_correct': data.get('is_correct', False),
            'time_spent_seconds': time_spent_int,  
            'hint_count': data.get('hint_count', 0)
        }
        
        response = supabase.table('story_game_activities').insert(activity_data).execute()
        
        if response.data:
            logger.info(f"Activity logged: {data.get('activity_type')}")
            return Response({
                'success': True,
                'activity_id': response.data[0]['id']
            }, status=status.HTTP_201_CREATED)
        else:
            logger.error("Failed to log activity")
            return Response({
                'error': 'Failed to log activity'
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Error logging story activity: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_story_analytics(request):
    """Get analytics for story game sessions"""
    try:
        user_email = request.GET.get('user_email', 'guest@wildlitz.com')
        user_id = request.GET.get('user_id')
        days = int(request.GET.get('days', 30))
        limit = int(request.GET.get('limit', 100))
        
        logger.info(f"Fetching analytics - user_email: {user_email}, days: {days}")
        
        # Build query
        query = supabase.table('story_game_sessions').select('*')
        
        if user_email:
            logger.info(f"🔎 Filtering by user_email: {user_email}")
            query = query.eq('user_email', user_email)
        elif user_id:
            logger.info(f"🔎 Filtering by user_id: {user_id}")
            query = query.eq('user_id', user_id)
        
        query = query.order('created_at', desc=True).limit(limit)
        
        response = query.execute()
        sessions = response.data if response.data else []
        
        logger.info(f"Found {len(sessions)} sessions for user_email: {user_email}")
        
        # Helper functions - MUST BE DEFINED FIRST
        def safe_int(value, default=0):
            """Safely convert value to int, handling None and other edge cases"""
            if value is None:
                return default
            try:
                return int(value)
            except (ValueError, TypeError):
                return default
        
        def safe_float(value, default=0.0):
            """Safely convert value to float, handling None and other edge cases"""
            if value is None:
                return default
            try:
                return float(value)
            except (ValueError, TypeError):
                return default
        
        # Calculate aggregate statistics with proper None handling
        total_sessions = len(sessions)
        completed_sessions = len([s for s in sessions if s.get('is_completed', False)])
        
        # ✅ FIX: Use safe_int for ALL numeric operations
        total_episodes_completed = sum(safe_int(s.get('episodes_completed'), 0) for s in sessions)
        total_words_solved = sum(safe_int(s.get('total_words_solved'), 0) for s in sessions)
        total_time_spent = sum(safe_int(s.get('total_duration_seconds'), 0) for s in sessions)
        
        # Theme distribution
        theme_counts = {}
        for session in sessions:
            theme = session.get('theme', 'unknown')
            theme_counts[theme] = theme_counts.get(theme, 0) + 1
        
        # Skills distribution
        skill_counts = {}
        for session in sessions:
            skills = session.get('focus_skills', []) or []  # ✅ Handle None
            for skill in skills:
                if skill:  # ✅ Make sure skill is not None
                    skill_counts[skill] = skill_counts.get(skill, 0) + 1
        
        # Average metrics with safe division
        avg_completion_rate = round((completed_sessions / total_sessions * 100), 2) if total_sessions > 0 else 0
        avg_episodes_per_session = round((total_episodes_completed / total_sessions), 2) if total_sessions > 0 else 0
        avg_words_per_session = round((total_words_solved / total_sessions), 2) if total_sessions > 0 else 0
        avg_session_duration = round((total_time_spent / total_sessions), 2) if total_sessions > 0 else 0
        
        logger.info(f"📊 Analytics calculated: {total_sessions} sessions, {total_episodes_completed} episodes, {total_words_solved} words")
        
        return Response({
            'success': True,
            'analytics': {
                'summary': {
                    'total_sessions': total_sessions,
                    'completed_sessions': completed_sessions,
                    'total_episodes_completed': total_episodes_completed,
                    'total_words_solved': total_words_solved,
                    'total_time_spent_seconds': total_time_spent,
                    'avg_completion_rate': avg_completion_rate,
                    'avg_episodes_per_session': avg_episodes_per_session,
                    'avg_words_per_session': avg_words_per_session,
                    'avg_session_duration_seconds': avg_session_duration
                },
                'distributions': {
                    'themes': theme_counts,
                    'skills': skill_counts
                },
                'recent_sessions': sessions[:10]
            }
        })
        
    except Exception as e:
        logger.error(f"Error fetching story analytics: {str(e)}")
        logger.error(f"Full traceback: {traceback.format_exc()}")  # ✅ ADD THIS for better debugging
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['GET'])
@permission_classes([AllowAny])
def get_session_details(request, session_id):
    """Get detailed information about a specific session including all activities"""
    try:
        # Get session data
        session_response = supabase.table('story_game_sessions').select('*').eq('id', session_id).execute()
        
        if not session_response.data:
            logger.warning(f"Session not found: {session_id}")
            return Response({
                'error': 'Session not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        session = session_response.data[0]
        
        # Get all activities for this session
        activities_response = supabase.table('story_game_activities').select('*').eq('session_id', session_id).order('created_at').execute()
        
        activities = activities_response.data if activities_response.data else []
        
        # Separate word_solved activities from game_completed
        word_activities = [a for a in activities if a.get('activity_type') == 'word_solved']
        completion_activities = [a for a in activities if a.get('activity_type') == 'game_completed']
        
        # Calculate word-level stats
        word_stats = []
        for activity in word_activities:
            word_data = activity.get('word_data', {})
            word_stats.append({
                'word': word_data.get('word', 'Unknown'),
                'time_spent': activity.get('time_spent_seconds', 0),
                'hints_used': activity.get('hint_count', 0),
                'episode_number': activity.get('episode_number', 1),
                'is_correct': activity.get('is_correct', True),
                'created_at': activity.get('created_at')
            })
        
        logger.info(f"Session details retrieved: {session_id}")
        
        return Response({
            'success': True,
            'session': session,
            'activities': activities,
            'word_activities': word_activities,
            'word_stats': word_stats,
            'total_activities': len(activities),
            'total_words': len(word_activities)
        })
        
    except Exception as e:
        logger.error(f"Error fetching session details: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    



@api_view(['GET'])
@permission_classes([AllowAny])
def get_word_performance(request):
    """Get aggregated word performance across all sessions for a user"""
    try:
        user_email = request.GET.get('user_email', 'guest@wildlitz.com')
        
        # Get all word_solved activities for this user
        activities_response = supabase.table('story_game_activities').select('*').eq('user_email', user_email).eq('activity_type', 'word_solved').execute()
        
        activities = activities_response.data if activities_response.data else []
        
        # Aggregate by word
        word_performance = {}
        for activity in activities:
            word_data = activity.get('word_data', {})
            word = word_data.get('word', 'Unknown')
            
            if word not in word_performance:
                word_performance[word] = {
                    'word': word,
                    'total_attempts': 0,
                    'total_time': 0,
                    'total_hints': 0,
                    'correct_attempts': 0
                }
            
            word_performance[word]['total_attempts'] += 1
            word_performance[word]['total_time'] += activity.get('time_spent_seconds', 0)
            word_performance[word]['total_hints'] += activity.get('hint_count', 0)
            if activity.get('is_correct', False):
                word_performance[word]['correct_attempts'] += 1
        
        # Calculate averages and sort by difficulty (time + hints)
        word_list = []
        for word, stats in word_performance.items():
            avg_time = stats['total_time'] / stats['total_attempts'] if stats['total_attempts'] > 0 else 0
            avg_hints = stats['total_hints'] / stats['total_attempts'] if stats['total_attempts'] > 0 else 0
            accuracy = (stats['correct_attempts'] / stats['total_attempts'] * 100) if stats['total_attempts'] > 0 else 0
            difficulty_score = avg_time + (avg_hints * 5)  # Weighted difficulty
            
            word_list.append({
                'word': word,
                'attempts': stats['total_attempts'],
                'avg_time': round(avg_time, 1),
                'avg_hints': round(avg_hints, 1),
                'accuracy': round(accuracy, 1),
                'difficulty_score': round(difficulty_score, 1)
            })
        
        # Sort by difficulty (hardest first)
        word_list.sort(key=lambda x: x['difficulty_score'], reverse=True)
        
        return Response({
            'success': True,
            'words': word_list,
            'total_unique_words': len(word_list)
        })
        
    except Exception as e:
        logger.error(f"Error fetching word performance: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_story_session(request, session_id):
    """Delete a story game session"""
    try:
        response = supabase.table('story_game_sessions').delete().eq('id', session_id).execute()
        
        logger.info(f"Session deleted: {session_id}")
        
        return Response({
            'success': True,
            'message': 'Session deleted successfully'
        })
        
    except Exception as e:
        logger.error(f"Error deleting story session: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
FOCUS_SKILL_VOCABULARY = {
    'sight-words': {
        'description': 'Common words that students should recognize by sight',
        'examples': ['the', 'and', 'was', 'said', 'for', 'are', 'his', 'they', 'have', 'from', 
                    'one', 'had', 'been', 'many', 'some', 'time', 'very', 'when', 'your', 'what',
                    'there', 'their', 'would', 'make', 'like', 'could', 'into', 'than', 'them'],
        'instruction': 'Use high-frequency sight words from the Dolch or Fry word lists for grade 3'
    },
    'phonics-sh': {
        'description': 'Words containing the SH sound',
        'examples': ['ship', 'fish', 'shop', 'wish', 'push', 'rush', 'shell', 'shut', 'shin', 
                    'shed', 'brush', 'crash', 'flash', 'fresh', 'sharp'],
        'instruction': 'Use simple 3-6 letter words with the "sh" sound at the beginning or end'
    },
    'phonics-ch': {
        'description': 'Words containing the CH sound',
        'examples': ['chip', 'chat', 'chop', 'rich', 'much', 'lunch', 'bench', 'catch', 'check',
                    'chest', 'chin', 'branch', 'crunch', 'teach'],
        'instruction': 'Use simple 3-6 letter words with the "ch" sound at the beginning or end'
    },
    'long-vowels': {
        'description': 'Words with long vowel sounds (a, e, i, o, u)',
        'examples': ['cake', 'make', 'bike', 'ride', 'rope', 'home', 'cute', 'tune', 'tree', 
                    'seed', 'rain', 'play', 'boat', 'snow', 'pie', 'light'],
        'instruction': 'Use words with clear long vowel patterns (CVCe, vowel teams)'
    },
    'compound-words': {
        'description': 'Two words joined together to make a new word',
        'examples': ['sunlight', 'backpack', 'cupcake', 'rainbow', 'bedroom', 'baseball', 
                    'airplane', 'playground', 'popcorn', 'butterfly', 'outside', 'inside'],
        'instruction': 'Use simple compound words made from familiar grade 3 words'
    },
    'action-verbs': {
        'description': 'Action words that describe what someone or something does',
        'examples': ['run', 'jump', 'swim', 'climb', 'play', 'walk', 'look', 'find', 'help', 
                    'push', 'pull', 'throw', 'catch', 'kick', 'dance', 'sing', 'laugh', 'sleep',
                    'eat', 'drink', 'read', 'write', 'draw', 'build', 'dive', 'reach', 'grab'],
        'instruction': 'Use simple present tense action verbs that a grade 3 student can act out'
    }
}

def get_vocabulary_guidance(focus_skills):
    """Generate detailed vocabulary guidance based on selected focus skills"""
    guidance_parts = []
    all_examples = []
    
    for skill in focus_skills:
        if skill in FOCUS_SKILL_VOCABULARY:
            skill_data = FOCUS_SKILL_VOCABULARY[skill]
            guidance_parts.append(
                f"\n- {skill.upper()}: {skill_data['description']}\n"
                f"  {skill_data['instruction']}\n"
                f"  Examples: {', '.join(skill_data['examples'][:10])}"
            )
            all_examples.extend(skill_data['examples'])
    
    return {
        'detailed_guidance': '\n'.join(guidance_parts),
        'example_words': list(set(all_examples))  # Remove duplicates
    }





@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def explain_word(request):
    """
    Generate kid-friendly word explanations using GPT for Reading Helper
    """
    try:
        data = json.loads(request.body)
        word = data.get('word', '').strip()
        grade_level = data.get('grade_level', 3)
        context = data.get('context', '')
        
        if not word:
            return JsonResponse({
                'success': False,
                'error': 'Word parameter is required'
            }, status=400)
        
        logger.info(f"Explaining word '{word}' for grade {grade_level}")
        
        # Create a detailed prompt for GPT
        context_info = f'\n\nThe word appears in this context: "{context}"' if context else ''
        
        prompt = f"""You are a friendly elementary school reading teacher explaining vocabulary to a grade {grade_level} student.

Explain the word "{word}" in a clear, simple way that a {grade_level}rd grade student would understand.{context_info}

Provide your response in this EXACT JSON format:
{{
  "definition": "A clear, simple definition using everyday language",
  "example": "A simple sentence using the word that a child would understand",
  "part_of_speech": "noun/verb/adjective/adverb/etc",
  "syllables": "word broken into syllables with hyphens (e.g. tem-ple)",
  "synonyms": ["similar word 1", "similar word 2", "similar word 3"]
}}

Rules:
- Definition must be 1-2 sentences, using simple words
- Example sentence must be relatable to a child's life
- Part of speech must be lowercase (noun, verb, adjective, etc.)
- Syllables must use hyphens to separate (e.g. "ad-ven-ture")
- Provide 2-4 synonyms that are also simple words
- Make it engaging and fun!"""

        try:
            # Call OpenAI API
            response = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert elementary school reading teacher who explains vocabulary in simple, engaging ways for children."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=300
            )
            
            # Parse the GPT response
            gpt_response = response.choices[0].message.content.strip()
            logger.info(f"GPT response for '{word}': {gpt_response[:100]}...")
            
            # Try to extract JSON from the response
            try:
                # Remove markdown code blocks if present
                if '```json' in gpt_response:
                    gpt_response = gpt_response.split('```json')[1].split('```')[0].strip()
                elif '```' in gpt_response:
                    gpt_response = gpt_response.split('```')[1].split('```')[0].strip()
                
                word_data = json.loads(gpt_response)
                
                # Validate required fields
                required_fields = ['definition', 'example', 'part_of_speech', 'syllables']
                for field in required_fields:
                    if field not in word_data:
                        raise ValueError(f'Missing required field: {field}')
                
                # Ensure synonyms is a list
                if 'synonyms' not in word_data or not isinstance(word_data['synonyms'], list):
                    word_data['synonyms'] = []
                
                logger.info(f"Successfully explained word '{word}'")
                
                return JsonResponse({
                    'success': True,
                    'definition': word_data['definition'],
                    'example': word_data['example'],
                    'part_of_speech': word_data['part_of_speech'],
                    'syllables': word_data['syllables'],
                    'synonyms': word_data['synonyms']
                })
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse GPT JSON response: {gpt_response}")
                logger.error(f"JSON Error: {str(e)}")
                
                # Fallback: Create a basic response from the text
                return JsonResponse({
                    'success': True,
                    'definition': f"{word.capitalize()} is a word used in the story.",
                    'example': f'The word "{word}" helps us understand what is happening.',
                    'part_of_speech': 'word',
                    'syllables': word,
                    'synonyms': []
                })
                
        except Exception as e:
            logger.error(f"OpenAI API error for word '{word}': {str(e)}")
            logger.error(traceback.format_exc())
            
            # Return a basic fallback response
            return JsonResponse({
                'success': True,
                'definition': f"The word '{word}' appears in the story and has special meaning.",
                'example': f'You can learn about "{word}" by reading the story carefully.',
                'part_of_speech': 'word',
                'syllables': word,
                'synonyms': []
            })
            
    except json.JSONDecodeError:
        logger.error("Invalid JSON in request body")
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON in request body'
        }, status=400)
    except Exception as e:
        logger.error(f"Unexpected error in explain_word: {str(e)}")
        logger.error(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)