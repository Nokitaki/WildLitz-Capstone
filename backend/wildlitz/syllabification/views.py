# In syllabification/views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import random
from .services import ChatGPTService
from .models import SyllabificationWord
from django.views.decorators.http import require_http_methods
from django.http import HttpResponse
import re


# Service initialization
chatgpt_service = ChatGPTService()

def get_syllabification_word(request):
    """Get a random word for syllabification practice"""
    difficulty = request.GET.get('difficulty', 'medium')
    categories = request.GET.getlist('categories[]', [])  # Get categories as list
    
    # Base query
    words_query = SyllabificationWord.objects.filter(difficulty_level=difficulty)
    
    # Apply category filter if provided
    if categories:
        words_query = words_query.filter(category__in=categories)
    
    if words_query.exists():
        # Get a random word
        word = random.choice(words_query)
        return JsonResponse({
            'word': word.word,
            'syllables': word.syllable_breakdown,
            'count': word.syllable_count,
            'category': word.category  # Include category in the response
        })
    else:
        # Generate new word if none exist
        generated_words = chatgpt_service.generate_syllabification_words(
            difficulty, 
            1, 
            categories=categories  # Pass categories to the generation service
        )
        if generated_words:
            word_data = generated_words[0]
            # Save to database with category
            SyllabificationWord.objects.create(
                word=word_data['word'],
                syllable_breakdown=word_data['syllables'],
                syllable_count=word_data['count'],
                difficulty_level=difficulty,
                category=word_data.get('category', categories[0] if categories else 'General')
            )
            return JsonResponse(word_data)
        
        return JsonResponse({'error': 'Failed to generate word'}, status=500)

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
        is_custom = data.get('is_custom', False)
        provided_syllable_breakdown = data.get('syllable_breakdown')
        
        # If this is a custom word with provided syllable breakdown, use that directly
        if is_custom and provided_syllable_breakdown:
            syllable_breakdown = provided_syllable_breakdown
        else:
            # Find the word in the database - handle duplicates
            try:
                # Get the first matching word instead of assuming there's only one
                word_obj = SyllabificationWord.objects.filter(word=word).first()
                
                if word_obj:
                    syllable_breakdown = word_obj.syllable_breakdown
                elif provided_syllable_breakdown:
                    # Use the provided breakdown if word not found
                    syllable_breakdown = provided_syllable_breakdown
                else:
                    # Fallback syllabification if word not found and no breakdown provided
                    syllable_breakdown = '-'.join(word)
            except Exception as e:
                # Fallback syllabification if any error occurs
                print(f"Error finding word: {e}")
                if provided_syllable_breakdown:
                    syllable_breakdown = provided_syllable_breakdown
                else:
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
            categories = data.get('categories', [])  # Get categories from request
            
            # Try to get a word that wasn't used before and matches the categories
            words_query = SyllabificationWord.objects.filter(
                difficulty_level=difficulty
            ).exclude(word__in=previous_words)
            
            # Apply category filter if provided
            if categories:
                words_query = words_query.filter(category__in=categories)
            
            if words_query.exists():
                word = random.choice(words_query)
                challenge = {
                    'word': word.word,
                    'syllables': word.syllable_breakdown,
                    'count': word.syllable_count,
                    'category': word.category,  # Include category in the response
                    'hint': f"This word has {word.syllable_count} syllables"
                }
            else:
                # Generate new words if we've used all available ones
                generated_words = chatgpt_service.generate_syllabification_words(
                    difficulty, 
                    5, 
                    categories=categories  # Pass categories to the generation service
                )
                if generated_words:
                    for word_data in generated_words:
                        # Extract category from word data or use first selected category
                        category = word_data.get('category', categories[0] if categories else 'General')
                        SyllabificationWord.objects.create(
                            word=word_data['word'],
                            syllable_breakdown=word_data['syllables'],
                            syllable_count=word_data['count'],
                            difficulty_level=difficulty,
                            category=category
                        )
                    
                    word_data = generated_words[0]
                    challenge = {
                        'word': word_data['word'],
                        'syllables': word_data['syllables'],
                        'count': word_data['count'],
                        'category': word_data.get('category', categories[0] if categories else 'General'),
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
    """Convert text to speech and return audio data without storing files"""
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
    """Get pronunciation audio for a word without storing files"""
    if request.method == 'GET':
        word = request.GET.get('word')
        if not word:
            return JsonResponse({'error': 'Word parameter is required'}, status=400)
        
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
            
            # Find the word's syllable breakdown
            try:
                word_obj = SyllabificationWord.objects.get(word=word)
                syllable_breakdown = word_obj.syllable_breakdown
            except SyllabificationWord.DoesNotExist:
                # Default syllabification if word not found
                import pyphen
                dic = pyphen.Pyphen(lang='en_US')
                syllable_breakdown = dic.inserted(word)
            
            # Create audio for each syllable
            syllables = syllable_breakdown.split('-')
            result = {
                'word': word,
                'syllable_breakdown': syllable_breakdown,
                'complete_word_audio': chatgpt_service.text_to_speech(word),
                'syllables': []
            }
            
            for syllable in syllables:
                syllable_audio = chatgpt_service.text_to_speech(syllable)
                result['syllables'].append({
                    'syllable': syllable,
                    'audio': syllable_audio
                })
            
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


@csrf_exempt
def generate_syllabification_words(request):
    """API endpoint to generate new syllabification words using ChatGPT"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            difficulty = data.get('difficulty', 'medium')
            count = data.get('count', 10)
            categories = data.get('categories', [])  # Get categories from request
            previous_words = data.get('previous_words', [])  # Get previously used words to avoid duplicates
            
            # Get words from ChatGPT with category filtering
            generated_words = chatgpt_service.generate_syllabification_words(
                difficulty, 
                count,
                categories=categories  # Pass categories to the service
            )
            
            # Filter out any words that were already used
            if previous_words:
                generated_words = [word for word in generated_words if word['word'] not in previous_words]
            
            # Save to database for future use
            for word_data in generated_words:
                # Determine the category for the word
                category = word_data.get('category')
                if not category and categories:
                    # If word doesn't have a category but categories were specified,
                    # assign the first category from the request
                    category = categories[0]
                
                SyllabificationWord.objects.create(
                    word=word_data['word'],
                    syllable_breakdown=word_data['syllables'],
                    syllable_count=word_data['count'],
                    difficulty_level=difficulty,
                    category=category or 'General'  # Default to General if no category
                )
            
            return JsonResponse({'words': generated_words})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    return JsonResponse({'error': 'Only POST method is allowed'}, status=405)








@csrf_exempt
@require_http_methods(["POST"])
def analyze_word(request):
    """Analyze a word and return its category, syllable breakdown, and count"""
    try:
        data = json.loads(request.body)
        word = data.get('word')
        audio_data = data.get('audioData')  # This could be None for typed words
        
        if not word:
            return JsonResponse({'error': 'Word parameter is required'}, status=400)
        
        # Clean the word - remove any punctuation and extra spaces
        word = re.sub(r'[^\w\s]', '', word).strip().lower()
        
        # First try to get word information from the database
        try:
            word_obj = SyllabificationWord.objects.filter(word__iexact=word).first()
            if word_obj:
                # Return the existing word data
                return JsonResponse({
                    'word': word_obj.word,
                    'category': word_obj.category,
                    'syllable_breakdown': word_obj.syllable_breakdown,
                    'syllable_count': word_obj.syllable_count
                })
        except Exception as e:
            print(f"Error querying database: {e}")
        
        # If word not found in database, use ChatGPT to analyze it
        try:
            # Set up the prompt for ChatGPT
            prompt = f"""
            Analyze the English word "{word}" and provide the following information:
            1. The correct spelling (if the word appears to be misspelled)
            2. The most appropriate category from this list: Animals, Colors, Food Items, Action Words, Places, Feelings, Common Objects, Numbers, General
            3. The syllable breakdown with hyphens (e.g., "el-e-phant")
            4. The number of syllables
            
            Format your response as a JSON object with the keys: word, category, syllable_breakdown, syllable_count
            """
            
            response = chatgpt_service.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an educational assistant for syllabification analysis."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2
            )
            
            # Try to extract JSON from the response
            response_text = response.choices[0].message.content
            
            # Extract JSON
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            if start_idx >= 0 and end_idx > 0:
                json_str = response_text[start_idx:end_idx]
                result = json.loads(json_str)
            else:
                # If JSON extraction fails, use a simpler approach
                result = {
                    'word': word,
                    'category': _determine_category(word),
                    'syllable_breakdown': _generate_syllable_breakdown(word),
                    'syllable_count': _count_syllables(word)
                }
            
            # Store the analyzed word in the database for future use
            try:
                SyllabificationWord.objects.create(
                    word=result['word'],
                    syllable_breakdown=result['syllable_breakdown'],
                    syllable_count=result['syllable_count'],
                    category=result['category'],
                    is_ai_generated=True
                )
            except Exception as e:
                print(f"Error saving word to database: {e}")
            
            # Return the result
            return JsonResponse(result)
        
        except Exception as e:
            print(f"Error analyzing word with ChatGPT: {e}")
            # Fall back to basic analysis if ChatGPT fails
            result = {
                'word': word,
                'category': _determine_category(word),
                'syllable_breakdown': _generate_syllable_breakdown(word),
                'syllable_count': _count_syllables(word)
            }
            return JsonResponse(result)
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

# Helper functions for fallback word analysis

def _determine_category(word):
    """Simple category determination based on common word lists"""
    word = word.lower()
    
    # These are just example lists - you would expand these in a real implementation
    animal_words = ['cat', 'dog', 'bird', 'fish', 'lion', 'tiger', 'bear', 'elephant', 'zebra', 
                    'giraffe', 'monkey', 'turtle', 'snake', 'frog', 'mouse', 'rabbit']
    
    color_words = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'black', 'white', 
                   'pink', 'brown', 'gray', 'gold', 'silver', 'violet', 'indigo']
    
    food_words = ['apple', 'banana', 'orange', 'pizza', 'burger', 'rice', 'bread', 'cheese',
                  'pasta', 'soup', 'cake', 'candy', 'cookie', 'milk', 'water', 'juice']
    
    action_words = ['run', 'jump', 'walk', 'eat', 'sleep', 'play', 'write', 'read', 'dance',
                    'sing', 'swim', 'climb', 'talk', 'laugh', 'cry', 'smile']
    
    place_words = ['house', 'school', 'park', 'store', 'beach', 'mountain', 'city', 'country',
                  'room', 'building', 'garden', 'forest', 'river', 'lake', 'ocean']
    
    feeling_words = ['happy', 'sad', 'angry', 'scared', 'excited', 'tired', 'bored', 'surprised',
                     'calm', 'worried', 'proud', 'silly', 'shy', 'lonely']
    
    object_words = ['chair', 'table', 'desk', 'bed', 'door', 'window', 'book', 'pen', 'pencil',
                   'phone', 'computer', 'car', 'ball', 'toy', 'clock']
    
    number_words = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
                    'eleven', 'twelve', 'hundred', 'thousand', 'million', 'first', 'second']
    
    if word in animal_words:
        return 'Animals'
    elif word in color_words:
        return 'Colors'
    elif word in food_words:
        return 'Food Items'
    elif word in action_words:
        return 'Action Words'
    elif word in place_words:
        return 'Places'
    elif word in feeling_words:
        return 'Feelings'
    elif word in object_words:
        return 'Common Objects'
    elif word in number_words:
        return 'Numbers'
    
    # Default category
    return 'General'

def _count_syllables(word):
    """Improved syllable counting with special cases"""
    # Special cases dictionary
    special_cases = {
        "yellow": 2,
        "orange": 2,
        # Add other problematic words here
    }
    
    # Check if word is in special cases
    word = word.lower()
    if word in special_cases:
        return special_cases[word]
    
    # Regular syllable counting logic 
    vowels = 'aeiouy'
    count = 0
    prev_is_vowel = False
    
    for char in word:
        is_vowel = char in vowels
        if is_vowel and not prev_is_vowel:
            count += 1
        prev_is_vowel = is_vowel
    
    # Handle special cases
    if count == 0:
        count = 1  # Every word has at least one syllable
    
    # Handle silent e at the end
    if word.endswith('e') and len(word) > 2 and word[-2] not in vowels:
        count = max(1, count - 1)
    
    return count

def _generate_syllable_breakdown(word):
    """Generate a simple syllable breakdown"""
    syllable_count = _count_syllables(word)
    
    if syllable_count == 1 or len(word) <= 3:
        return word
    
    # Simple approach: try to break at vowel-consonant boundaries
    vowels = 'aeiouy'
    word = word.lower()
    result = []
    current = ""
    
    for i, char in enumerate(word):
        current += char
        
        # Try to break after vowel + consonant patterns
        if (i > 0 and 
            i < len(word) - 1 and 
            word[i-1] in vowels and 
            char not in vowels):
            
            # Don't break if the next char is also a consonant (unless it's the last character)
            if i < len(word) - 2 and word[i+1] not in vowels:
                continue
                
            result.append(current)
            current = ""
    
    # Add any remaining characters
    if current:
        result.append(current)
    
    # If we didn't get enough syllables, try a simpler approach
    if len(result) != syllable_count:
        # Divide word evenly by syllable count
        chars_per_syllable = len(word) // syllable_count
        result = []
        
        for i in range(syllable_count):
            start = i * chars_per_syllable
            end = start + chars_per_syllable if i < syllable_count - 1 else len(word)
            result.append(word[start:end])
    
    return "-".join(result)
