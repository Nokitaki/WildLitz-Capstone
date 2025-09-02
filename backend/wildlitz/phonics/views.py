# phonics/views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
import json
import openai
import time
from django.conf import settings

# Import progress tracking
from api.models import UserProgress, UserActivity
import logging

logger = logging.getLogger(__name__)

def log_phonics_activity(user, activity_type, question_data, user_answer, correct_answer, is_correct, time_spent, difficulty='medium', challenge_level='', learning_focus=''):
    """Helper function to log phonics activities"""
    try:
        if user.is_authenticated:
            UserActivity.objects.create(
                user=user,
                module='phonics',
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
                module='phonics',
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
        logger.error(f"Error logging phonics activity: {str(e)}")

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def generate_vanishing_game_words(request):
    """
    Generate words for the vanishing game using AI based on the configuration
    """
    try:
        data = request.data
        challenge_level = data.get('challengeLevel', 'simple_words')
        learning_focus = data.get('learningFocus', 'short_vowels') 
        difficulty = data.get('difficulty', 'easy')
        word_count = data.get('wordCount', 10)
        
        # Set up OpenAI client
        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        
        # Create the AI prompt based on configuration
        prompt = create_word_generation_prompt(challenge_level, learning_focus, difficulty, word_count)
        
        # Generate words using OpenAI
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an educational content generator specializing in creating words for phonics learning games. Always respond with valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        # Parse AI response
        ai_content = response.choices[0].message.content
        
        try:
            # Try to parse as JSON
            words_data = json.loads(ai_content)
            formatted_words = format_word_response(words_data, challenge_level, learning_focus, difficulty)
        except json.JSONDecodeError:
            logger.warning("AI response wasn't valid JSON, using fallback words")
            formatted_words = get_fallback_words(challenge_level, learning_focus, difficulty, word_count)
        
        return Response({'words': formatted_words})
    
    except Exception as e:
        logger.error(f"Error in generate_vanishing_game_words: {str(e)}")
        # Return fallback words on any error
        fallback_words = get_fallback_words(
            data.get('challengeLevel', 'simple_words'),
            data.get('learningFocus', 'short_vowels'),
            data.get('difficulty', 'easy'),
            data.get('wordCount', 10)
        )
        return Response({'words': fallback_words})

@csrf_exempt  
@api_view(['POST'])
@permission_classes([AllowAny])
def text_to_speech_enhanced(request):
    """Enhanced text-to-speech endpoint with voice selection"""
    try:
        data = request.data
        text = data.get('text', '')
        voice = data.get('voice', 'happy')  # happy, serious, encouraging, etc.
        
        if not text:
            return Response({'error': 'Text is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Set up OpenAI client for TTS
        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        
        # Voice mapping
        voice_mapping = {
            'happy': 'alloy',
            'serious': 'echo', 
            'encouraging': 'nova',
            'calm': 'shimmer',
            'excited': 'fable',
            'default': 'alloy'
        }
        
        selected_voice = voice_mapping.get(voice, 'alloy')
        
        # Generate speech using OpenAI TTS
        response = client.audio.speech.create(
            model="tts-1",
            voice=selected_voice,
            input=text
        )
        
        # Convert to base64 for frontend
        import base64
        audio_data = base64.b64encode(response.content).decode('utf-8')
        
        return Response({
            'success': True,
            'audio_data': audio_data,
            'voice_used': selected_voice,
            'text': text
        })
    
    except Exception as e:
        logger.error(f"Error in text-to-speech: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def log_phonics_game_result(request):
    """Log the result of a phonics game attempt with progress tracking"""
    start_time = time.time()
    
    try:
        data = request.data
        word_data = data.get('wordData', {})
        user_recognized = data.get('userRecognized', False)
        time_spent = data.get('timeSpent', time.time() - start_time)
        challenge_level = data.get('challengeLevel', 'simple_words')
        learning_focus = data.get('learningFocus', 'short_vowels')
        difficulty = data.get('difficulty', 'medium')
        
        # Extract word information
        word = word_data.get('word', '')
        pattern = word_data.get('pattern', '')
        
        # Log activity for authenticated users
        if request.user.is_authenticated:
            log_phonics_activity(
                user=request.user,
                activity_type='vanishing_word_recognition',
                question_data={
                    'word': word,
                    'pattern': pattern,
                    'challenge_level': challenge_level,
                    'learning_focus': learning_focus
                },
                user_answer={'recognized': user_recognized},
                correct_answer={'word': word, 'pattern': pattern},
                is_correct=user_recognized,  # For phonics, recognition is considered correct
                time_spent=time_spent,
                difficulty=difficulty,
                challenge_level=challenge_level,
                learning_focus=learning_focus
            )
        
        response_data = {
            'logged': request.user.is_authenticated,
            'feedback': 'Great job!' if user_recognized else 'Keep practicing!'
        }
        
        # Add progress info for authenticated users
        if request.user.is_authenticated:
            try:
                progress = UserProgress.objects.get(
                    user=request.user,
                    module='phonics',
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
        logger.error(f"Error logging phonics game result: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

def create_word_generation_prompt(challenge_level, learning_focus, difficulty, word_count):
    """
    Create a detailed prompt for AI word generation with improved syllable breakdown
    """
    
    # Define what each learning focus means
    focus_descriptions = {
        'short_vowels': 'short vowel sounds (a as in cat, e as in bed, i as in sit, o as in hot, u as in sun)',
        'long_vowels': 'long vowel sounds (a as in cake, e as in feet, i as in bike, o as in rope, u as in cute)',
        'blends': 'consonant blends (bl, cr, fl, st, tr, etc.)',
        'digraphs': 'consonant digraphs (ch, sh, th, wh, ph, etc.)'
    }
    
    # Define challenge level descriptions
    level_descriptions = {
        'simple_words': 'single, simple words (3-6 letters)',
        'compound_words': 'compound words (two words combined like "sunflower" or "playground")',
        'phrases': 'short phrases (2-4 words like "red car" or "big blue sky")',
        'simple_sentences': 'simple complete sentences (5-8 words)'
    }
    
    # Adjust word complexity based on difficulty
    difficulty_notes = {
        'easy': 'Use simpler, more common words. Focus on basic vocabulary.',
        'medium': 'Use moderately challenging words. Mix common and less common vocabulary.',
        'hard': 'Use more challenging words. Include advanced vocabulary appropriate for the level.'
    }
    
    prompt = f"""
Generate {word_count} educational {level_descriptions[challenge_level]} that focus on {focus_descriptions[learning_focus]}.

Requirements:
- Challenge Level: {challenge_level}
- Learning Focus: {learning_focus}  
- Difficulty: {difficulty}
- {difficulty_notes[difficulty]}

CRITICAL SYLLABLE BREAKDOWN RULES:
1. Break syllables at natural speech boundaries
2. Keep consonant blends together (bl, cr, st, etc.)
3. Keep vowel teams together (ai, ea, ou, etc.)
4. Split between double consonants (but-ter, let-ter)
5. Keep prefixes and suffixes together when possible

Examples of CORRECT syllable breakdown:
- rainbow → rain-bow (NOT rai-nbow)
- elephant → el-e-phant
- butterfly → but-ter-fly
- playground → play-ground
- basketball → bas-ket-ball
- computer → com-pu-ter

For each word/phrase/sentence, you must:
1. Clearly identify the target phonics pattern
2. Specify where the pattern appears (beginning, middle, or ending)
3. Provide a simple phonics rule explanation
4. Break compound words and longer words into syllables using hyphens CORRECTLY
5. Count the syllables accurately
6. Categorize appropriately (Animals, Food, Colors, etc.)

Return ONLY a JSON object in this exact format:
{{
  "words": [
    {{
      "word": "example word/phrase/sentence",
      "pattern": "target pattern (like 'a', 'ch', 'st')",
      "patternPosition": "beginning|middle|ending",
      "phonicsRule": "Simple explanation of the phonics rule",
      "syllableBreakdown": "correct-syl-la-ble breakdown",
      "syllableCount": number,
      "category": "Animals|Colors|Food|Actions|Objects|General"
    }}
  ]
}}

Additional guidelines:
- For short vowels: Focus on CVC patterns (cat, bed, sit, etc.)
- For long vowels: Include silent e patterns and vowel teams
- For blends: Ensure the target blend is clearly present
- For digraphs: Make sure the digraph is prominent in the word
- For phrases: Each word should contain the target pattern
- For sentences: Include multiple instances of the target pattern
- Keep age-appropriate vocabulary (elementary school level)
- Ensure words are spelled correctly
- Make syllable breakdowns accurate and follow natural speech patterns
- Double-check syllable counts match the breakdown
"""
    
    return prompt

def format_word_response(words_data, challenge_level, learning_focus, difficulty):
    """
    Format and validate the word response from AI
    """
    formatted_words = []
    
    for word_item in words_data.get('words', []):
        word = word_item.get('word', '')
        syllable_breakdown = word_item.get('syllableBreakdown', word)
        syllable_count = word_item.get('syllableCount', 1)
        
        # Validate syllable breakdown
        validated_breakdown, validated_count = validate_syllable_breakdown(
            word, syllable_breakdown, syllable_count
        )
        
        formatted_word = {
            'word': word,
            'pattern': word_item.get('pattern', ''),
            'patternPosition': word_item.get('patternPosition', 'middle'),
            'phonicsRule': word_item.get('phonicsRule', ''),
            'syllableBreakdown': validated_breakdown,
            'syllableCount': validated_count,
            'category': word_item.get('category', 'General'),
            'challengeLevel': challenge_level,
            'learningFocus': learning_focus,
            'difficulty': difficulty,
            'isAiGenerated': True
        }
        formatted_words.append(formatted_word)
        
    return formatted_words

def validate_syllable_breakdown(word, syllable_breakdown, syllable_count):
    """
    Validate and potentially fix syllable breakdowns
    """
    if not syllable_breakdown or syllable_breakdown == word:
        return word, 1
    
    # Count actual syllables in breakdown
    syllables = syllable_breakdown.split('-')
    actual_count = len(syllables)
    
    # Join syllables back and compare with original word
    joined_word = ''.join(syllables).lower()
    original_word = word.lower().replace(' ', '')
    
    # If they don't match, use the original word
    if joined_word != original_word:
        return word, 1
    
    # Validate common patterns
    validated_breakdown = syllable_breakdown
    validated_count = actual_count
    
    # Common compound words and their correct breakdowns
    compound_fixes = {
        'rainbow': 'rain-bow',
        'playground': 'play-ground',
        'basketball': 'bas-ket-ball',
        'butterfly': 'but-ter-fly',
        'elephant': 'el-e-phant',
        'computer': 'com-pu-ter',
        'telephone': 'tel-e-phone',
        'newspaper': 'news-pa-per',
        'bedroom': 'bed-room',
        'sunshine': 'sun-shine',
        'football': 'foot-ball',
        'birthday': 'birth-day',
        'homework': 'home-work',
        'classroom': 'class-room',
        'toothbrush': 'tooth-brush'
    }
    
    # Check if word needs fixing
    if word.lower() in compound_fixes:
        validated_breakdown = compound_fixes[word.lower()]
        validated_count = len(validated_breakdown.split('-'))
    
    return validated_breakdown, validated_count

def get_fallback_words(challenge_level, learning_focus, difficulty, word_count):
    """
    Get fallback words when AI generation fails
    """
    fallback_sets = {
        'simple_words': {
            'short_vowels': [
                {'word': 'cat', 'pattern': 'a', 'patternPosition': 'middle', 'syllableBreakdown': 'cat', 'syllableCount': 1},
                {'word': 'bed', 'pattern': 'e', 'patternPosition': 'middle', 'syllableBreakdown': 'bed', 'syllableCount': 1},
                {'word': 'sit', 'pattern': 'i', 'patternPosition': 'middle', 'syllableBreakdown': 'sit', 'syllableCount': 1},
                {'word': 'hot', 'pattern': 'o', 'patternPosition': 'middle', 'syllableBreakdown': 'hot', 'syllableCount': 1},
                {'word': 'sun', 'pattern': 'u', 'patternPosition': 'middle', 'syllableBreakdown': 'sun', 'syllableCount': 1},
            ],
            'long_vowels': [
                {'word': 'cake', 'pattern': 'a_e', 'patternPosition': 'middle', 'syllableBreakdown': 'cake', 'syllableCount': 1},
                {'word': 'bike', 'pattern': 'i_e', 'patternPosition': 'middle', 'syllableBreakdown': 'bike', 'syllableCount': 1},
                {'word': 'rope', 'pattern': 'o_e', 'patternPosition': 'middle', 'syllableBreakdown': 'rope', 'syllableCount': 1},
                {'word': 'cute', 'pattern': 'u_e', 'patternPosition': 'middle', 'syllableBreakdown': 'cute', 'syllableCount': 1},
                {'word': 'feet', 'pattern': 'ee', 'patternPosition': 'middle', 'syllableBreakdown': 'feet', 'syllableCount': 1},
            ],
            'blends': [
                {'word': 'frog', 'pattern': 'fr', 'patternPosition': 'beginning', 'syllableBreakdown': 'frog', 'syllableCount': 1},
                {'word': 'stop', 'pattern': 'st', 'patternPosition': 'beginning', 'syllableBreakdown': 'stop', 'syllableCount': 1},
                {'word': 'clap', 'pattern': 'cl', 'patternPosition': 'beginning', 'syllableBreakdown': 'clap', 'syllableCount': 1},
                {'word': 'blue', 'pattern': 'bl', 'patternPosition': 'beginning', 'syllableBreakdown': 'blue', 'syllableCount': 1},
                {'word': 'drum', 'pattern': 'dr', 'patternPosition': 'beginning', 'syllableBreakdown': 'drum', 'syllableCount': 1},
            ],
            'digraphs': [
                {'word': 'ship', 'pattern': 'sh', 'patternPosition': 'beginning', 'syllableBreakdown': 'ship', 'syllableCount': 1},
                {'word': 'chat', 'pattern': 'ch', 'patternPosition': 'beginning', 'syllableBreakdown': 'chat', 'syllableCount': 1},
                {'word': 'this', 'pattern': 'th', 'patternPosition': 'beginning', 'syllableBreakdown': 'this', 'syllableCount': 1},
                {'word': 'fish', 'pattern': 'sh', 'patternPosition': 'ending', 'syllableBreakdown': 'fish', 'syllableCount': 1},
                {'word': 'much', 'pattern': 'ch', 'patternPosition': 'ending', 'syllableBreakdown': 'much', 'syllableCount': 1},
            ]
        }
    }
    
    # Get appropriate fallback words
    words = fallback_sets.get(challenge_level, {}).get(learning_focus, [])
    
    # Format fallback words
    formatted_words = []
    for i in range(min(word_count, len(words))):
        word_item = words[i % len(words)] if words else {'word': 'cat', 'pattern': 'a', 'patternPosition': 'middle', 'syllableBreakdown': 'cat', 'syllableCount': 1}
        
        formatted_word = {
            'word': word_item['word'],
            'pattern': word_item['pattern'],
            'patternPosition': word_item['patternPosition'],
            'phonicsRule': f"The '{word_item['pattern']}' sound as in '{word_item['word']}'",
            'syllableBreakdown': word_item['syllableBreakdown'],
            'syllableCount': word_item['syllableCount'],
            'category': 'General',
            'challengeLevel': challenge_level,
            'learningFocus': learning_focus,
            'isAiGenerated': False,
            'isFallback': True
        }
        formatted_words.append(formatted_word)
    
    return formatted_words