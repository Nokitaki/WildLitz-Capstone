# In syllabification/views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import random
from .services import ChatGPTService
from .models import SyllabificationWord
from django.views.decorators.http import require_http_methods
from django.http import HttpResponse

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


# New TTS endpoints

@csrf_exempt
@require_http_methods(["POST"])
def text_to_speech(request):
    """Convert text to speech and return audio data"""
    try:
        data = json.loads(request.body)
        text = data.get('text')
        voice = data.get('voice', 'nova')  # Default voice suitable for children
        
        if not text:
            return JsonResponse({'error': 'Text parameter is required'}, status=400)
        
        # Get audio from OpenAI TTS
        tts_response = chatgpt_service.text_to_speech(text, voice)
        
        return JsonResponse(tts_response)
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
@require_http_methods(["GET", "POST"])
def pronounce_word(request):
    """Get pronunciation audio for a word"""
    if request.method == 'GET':
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
        
        # Generate audio using TTS
        tts_response = chatgpt_service.text_to_speech(word)
        
        return JsonResponse({
            'word': word,
            'audio': tts_response
        })
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            word = data.get('word')
            
            if not word:
                return JsonResponse({'error': 'Word parameter is required'}, status=400)
            
            # Find the word and its syllable breakdown
            try:
                word_obj = SyllabificationWord.objects.get(word=word)
                syllable_breakdown = word_obj.syllable_breakdown
            except SyllabificationWord.DoesNotExist:
                # Default syllabification if word not found
                import pyphen
                dic = pyphen.Pyphen(lang='en_US')
                syllable_breakdown = dic.inserted(word)
            
            # Generate audio for the word and its syllables
            result = chatgpt_service.pronounce_syllables(word, syllable_breakdown)
            
            return JsonResponse(result)
        
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
        



def test_tts(request):
    """Simple test view for Text-to-Speech functionality"""
    word = request.GET.get('word', 'apple')
    
    # Get audio from the TTS service
    tts_response = chatgpt_service.text_to_speech(word)
    
    if tts_response.get('success', False):
        # Create a simple HTML response with an audio player
        audio_url = tts_response.get('audio_url')
        base64_audio = tts_response.get('audio_data')
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>TTS Test for "{word}"</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }}
                h1 {{ color: #4a4a4a; }}
                .word {{ font-size: 32px; margin: 20px 0; color: #2c3e50; }}
                .player {{ margin: 20px 0; }}
                button {{ 
                    background-color: #3498db; 
                    color: white; 
                    border: none; 
                    padding: 10px 20px; 
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 16px;
                }}
                button:hover {{ background-color: #2980b9; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>TTS Test Page</h1>
                <div class="word">{word}</div>
                
                <div class="player">
                    <h3>Play using URL (backend file):</h3>
                    <audio controls>
                        <source src="{audio_url}" type="audio/mp3">
                        Your browser does not support the audio element.
                    </audio>
                </div>
                
                <div class="player">
                    <h3>Play using Base64 data:</h3>
                    <audio controls>
                        <source src="data:audio/mp3;base64,{base64_audio}" type="audio/mp3">
                        Your browser does not support the audio element.
                    </audio>
                </div>
                
                <div>
                    <h3>Test another word:</h3>
                    <form action="" method="get">
                        <input type="text" name="word" placeholder="Enter a word" value="{word}">
                        <button type="submit">Generate Audio</button>
                    </form>
                </div>
            </div>
        </body>
        </html>
        """
        
        return HttpResponse(html_content)
    else:
        error_message = tts_response.get('error', 'Unknown error')
        return HttpResponse(f"<h1>Error generating TTS</h1><p>{error_message}</p>", status=500)
    



def test_tts(request):
    """Simple test view for Text-to-Speech functionality"""
    word = request.GET.get('word', 'apple')
    method = request.GET.get('method', 'both')  # 'openai', 'gtts', or 'both'
    
    # Results containers
    openai_response = None
    gtts_response = None
    
    # Try OpenAI TTS if requested
    if method in ['openai', 'both']:
        try:
            openai_response = chatgpt_service.text_to_speech(word)
        except Exception as e:
            openai_response = {'success': False, 'error': str(e)}
    
    # Try gTTS if requested
    if method in ['gtts', 'both']:
        try:
            gtts_response = chatgpt_service.text_to_speech_fallback(word)
        except Exception as e:
            gtts_response = {'success': False, 'error': str(e)}
    
    # Create the HTML response
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>TTS Test for "{word}"</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 20px; }}
            .container {{ max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }}
            h1, h2 {{ color: #4a4a4a; }}
            .word {{ font-size: 32px; margin: 20px 0; color: #2c3e50; }}
            .player {{ margin: 20px 0; padding: 15px; border: 1px solid #eee; border-radius: 4px; }}
            .success {{ background-color: #d4edda; border-color: #c3e6cb; }}
            .error {{ background-color: #f8d7da; border-color: #f5c6cb; }}
            button {{ 
                background-color: #3498db; 
                color: white; 
                border: none; 
                padding: 10px 20px; 
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
                margin-right: 10px;
            }}
            button:hover {{ background-color: #2980b9; }}
            input[type="text"] {{ 
                padding: 8px; 
                border: 1px solid #ddd; 
                border-radius: 4px; 
                width: 200px;
                margin-right: 10px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>TTS Test Page</h1>
            <div class="word">{word}</div>
            
            <div class="method-select">
                <h3>Select TTS Method:</h3>
                <form action="" method="get">
                    <input type="hidden" name="word" value="{word}">
                    <button type="submit" name="method" value="openai">OpenAI Only</button>
                    <button type="submit" name="method" value="gtts">Google TTS Only</button>
                    <button type="submit" name="method" value="both">Both Methods</button>
                </form>
            </div>
    """
    
    # Add OpenAI results if available
    if openai_response:
        result_class = "success" if openai_response.get('success', False) else "error"
        html_content += f"""
            <h2>OpenAI TTS Results:</h2>
            <div class="player {result_class}">
        """
        
        if openai_response.get('success', False):
            audio_url = openai_response.get('audio_url')
            base64_audio = openai_response.get('audio_data')
            html_content += f"""
                <h3>Play using URL (backend file):</h3>
                <audio controls>
                    <source src="{audio_url}" type="audio/mp3">
                    Your browser does not support the audio element.
                </audio>
                
                <h3>Play using Base64 data:</h3>
                <audio controls>
                    <source src="data:audio/mp3;base64,{base64_audio}" type="audio/mp3">
                    Your browser does not support the audio element.
                </audio>
            """
        else:
            error_message = openai_response.get('error', 'Unknown error')
            html_content += f"""
                <h3>Error with OpenAI TTS:</h3>
                <p>{error_message}</p>
            """
        
        html_content += "</div>"
    
    # Add gTTS results if available
    if gtts_response:
        result_class = "success" if gtts_response.get('success', False) else "error"
        html_content += f"""
            <h2>Google TTS Results:</h2>
            <div class="player {result_class}">
        """
        
        if gtts_response.get('success', False):
            audio_url = gtts_response.get('audio_url')
            base64_audio = gtts_response.get('audio_data')
            html_content += f"""
                <h3>Play using URL (backend file):</h3>
                <audio controls>
                    <source src="{audio_url}" type="audio/mp3">
                    Your browser does not support the audio element.
                </audio>
                
                <h3>Play using Base64 data:</h3>
                <audio controls>
                    <source src="data:audio/mp3;base64,{base64_audio}" type="audio/mp3">
                    Your browser does not support the audio element.
                </audio>
            """
        else:
            error_message = gtts_response.get('error', 'Unknown error')
            html_content += f"""
                <h3>Error with Google TTS:</h3>
                <p>{error_message}</p>
            """
        
        html_content += "</div>"
    
    # Add the form to test another word
    html_content += f"""
            <div>
                <h3>Test another word:</h3>
                <form action="" method="get">
                    <input type="text" name="word" placeholder="Enter a word" value="{word}">
                    <input type="hidden" name="method" value="{method}">
                    <button type="submit">Generate Audio</button>
                </form>
            </div>
        </div>
    </body>
    </html>
    """
    
    return HttpResponse(html_content)