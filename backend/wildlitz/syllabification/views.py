# In syllabification/views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import random
from .services import ChatGPTService
from .models import SyllabificationWord
from django.views.decorators.http import require_http_methods

# Service initialization
chatgpt_service = ChatGPTService()

@csrf_exempt
def generate_syllabification_words(request):
    """API endpoint to generate new syllabification words using ChatGPT"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            difficulty = data.get('difficulty', 'medium')
            count = data.get('count', 10)
            
            # Get words from ChatGPT
            generated_words = chatgpt_service.generate_syllabification_words(difficulty, count)
            
            # Save to database for future use
            for word_data in generated_words:
                SyllabificationWord.objects.create(
                    word=word_data['word'],
                    syllable_breakdown=word_data['syllables'],
                    syllable_count=word_data['count'],
                    difficulty_level=difficulty
                )
            
            return JsonResponse({'words': generated_words})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    return JsonResponse({'error': 'Only POST method is allowed'}, status=405)

def get_syllabification_word(request):
    """Get a random word for syllabification practice"""
    difficulty = request.GET.get('difficulty', 'medium')
    
    # Try to get from database first
    words = SyllabificationWord.objects.filter(difficulty_level=difficulty)
    
    if words.exists():
        # Get a random word
        word = random.choice(words)
        return JsonResponse({
            'word': word.word,
            'syllables': word.syllable_breakdown,
            'count': word.syllable_count
        })
    else:
        # Generate new word if none exist
        generated_words = chatgpt_service.generate_syllabification_words(difficulty, 1)
        if generated_words:
            word_data = generated_words[0]
            # Save to database
            SyllabificationWord.objects.create(
                word=word_data['word'],
                syllable_breakdown=word_data['syllables'],
                syllable_count=word_data['count'],
                difficulty_level=difficulty
            )
            return JsonResponse(word_data)
        
        return JsonResponse({'error': 'Failed to generate word'}, status=500)
    
@csrf_exempt
@require_http_methods(["POST"])
def check_syllable_clapping(request):
    """Check if the user clapped the correct number of times for a word"""
    try:
        data = json.loads(request.body)
        word = data.get('word')
        user_clap_count = data.get('clap_count')
        
        # Find the word in the database - MODIFIED to handle duplicates
        try:
            # Get the first matching word instead of assuming there's only one
            word_obj = SyllabificationWord.objects.filter(word=word).first()
            
            if word_obj:
                syllable_breakdown = word_obj.syllable_breakdown
            else:
                # Fallback syllabification if word not found
                syllable_breakdown = '-'.join(word)
        except Exception as e:
            # Fallback syllabification if any error occurs
            print(f"Error finding word: {e}")
            syllable_breakdown = '-'.join(word)
        
        # Get feedback from ChatGPT service
        feedback = chatgpt_service.generate_syllable_clapping_feedback(
            word, syllable_breakdown, user_clap_count
        )
        
        return JsonResponse(feedback)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@csrf_exempt
def generate_new_challenge(request):
    """Generate a new syllabification word challenge"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            difficulty = data.get('difficulty', 'medium')
            previous_words = data.get('previous_words', [])
            
            # Try to get a word that wasn't used before
            words = SyllabificationWord.objects.filter(
                difficulty_level=difficulty
            ).exclude(word__in=previous_words)
            
            if words.exists():
                word = random.choice(words)
                challenge = {
                    'word': word.word,
                    'syllables': word.syllable_breakdown,
                    'count': word.syllable_count,
                    'hint': f"This word has {word.syllable_count} syllables"
                }
            else:
                # Generate new words if we've used all available ones
                generated_words = chatgpt_service.generate_syllabification_words(difficulty, 5)
                if generated_words:
                    for word_data in generated_words:
                        SyllabificationWord.objects.create(
                            word=word_data['word'],
                            syllable_breakdown=word_data['syllables'],
                            syllable_count=word_data['count'],
                            difficulty_level=difficulty
                        )
                    
                    word_data = generated_words[0]
                    challenge = {
                        'word': word_data['word'],
                        'syllables': word_data['syllables'],
                        'count': word_data['count'],
                        'hint': f"This word has {word_data['count']} syllables"
                    }
                else:
                    return JsonResponse({'error': 'Failed to generate new words'}, status=500)
            
            return JsonResponse({'challenge': challenge})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    return JsonResponse({'error': 'Only POST method is allowed'}, status=405)



    
def get_syllable_sounds(request):
    """Get detailed explanation of syllable sounds for a word"""
    word = request.GET.get('word')
    if not word:
        return JsonResponse({'error': 'Word parameter is required'}, status=400)
    
    try:
        # Find the word in the database
        word_obj = SyllabificationWord.objects.get(word=word)
        syllable_breakdown = word_obj.syllable_breakdown
    except SyllabificationWord.DoesNotExist:
        # Default syllabification if word not found
        import pyphen
        dic = pyphen.Pyphen(lang='en_US')
        syllable_breakdown = dic.inserted(word)
    
    # Get explanation from ChatGPT service
    explanation = chatgpt_service.generate_syllable_sound_explanation(
        word, syllable_breakdown
    )
    
    return JsonResponse(explanation)
    