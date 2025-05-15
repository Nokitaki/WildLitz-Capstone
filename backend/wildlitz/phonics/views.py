# Add this to phonics/views.py

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import openai
from django.conf import settings

@csrf_exempt
def generate_vanishing_game_words(request):
    """
    Generate words for the vanishing game using AI based on the configuration
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)
    
    try:
        data = json.loads(request.body)
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
            max_tokens=1500
        )
        
        # Parse the AI response
        ai_response = response.choices[0].message.content
        
        # Try to parse JSON response
        try:
            words_data = json.loads(ai_response)
            
            # Validate and format the response
            formatted_words = []
            for word_item in words_data.get('words', []):
                formatted_word = {
                    'word': word_item.get('word', ''),
                    'pattern': word_item.get('pattern', ''),
                    'patternPosition': word_item.get('patternPosition', 'middle'),
                    'phonicsRule': word_item.get('phonicsRule', ''),
                    'syllableBreakdown': word_item.get('syllableBreakdown', word_item.get('word', '')),
                    'syllableCount': word_item.get('syllableCount', 1),
                    'category': word_item.get('category', 'General'),
                    'challengeLevel': challenge_level,
                    'learningFocus': learning_focus,
                    'difficulty': difficulty,
                    'isAiGenerated': True
                }
                formatted_words.append(formatted_word)
                
            return JsonResponse({
                'success': True,
                'words': formatted_words,
                'count': len(formatted_words)
            })
            
        except json.JSONDecodeError:
            # If JSON parsing fails, try to extract words manually
            fallback_words = create_fallback_words(challenge_level, learning_focus, word_count)
            return JsonResponse({
                'success': True,
                'words': fallback_words,
                'count': len(fallback_words),
                'note': 'Used fallback word generation'
            })
        
    except Exception as e:
        print(f"Error generating words: {str(e)}")
        # Return fallback words in case of any error
        fallback_words = create_fallback_words(challenge_level, learning_focus, word_count)
        return JsonResponse({
            'success': True,
            'words': fallback_words,
            'count': len(fallback_words),
            'note': 'Used fallback due to error'
        })

def create_word_generation_prompt(challenge_level, learning_focus, difficulty, word_count):
    """
    Create a detailed prompt for AI word generation
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

For each word/phrase/sentence, you must:
1. Clearly identify the target phonics pattern
2. Specify where the pattern appears (beginning, middle, or ending)
3. Provide a simple phonics rule explanation
4. Break compound words and longer words into syllables using hyphens
5. Count the syllables correctly
6. Categorize appropriately (Animals, Food, Colors, etc.)

Return ONLY a JSON object in this exact format:
{{
  "words": [
    {{
      "word": "example word/phrase/sentence",
      "pattern": "target pattern (like 'a', 'ch', 'st')",
      "patternPosition": "beginning|middle|ending",
      "phonicsRule": "Simple explanation of the phonics rule",
      "syllableBreakdown": "syl-la-ble breakdown",
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
- Make syllable breakdowns accurate
"""
    
    return prompt

def create_fallback_words(challenge_level, learning_focus, word_count):
    """
    Create fallback words in case AI generation fails
    """
    fallback_sets = {
        'simple_words': {
            'short_vowels': [
                {'word': 'cat', 'pattern': 'a', 'patternPosition': 'middle', 'syllableBreakdown': 'cat', 'syllableCount': 1},
                {'word': 'bed', 'pattern': 'e', 'patternPosition': 'middle', 'syllableBreakdown': 'bed', 'syllableCount': 1},
                {'word': 'sit', 'pattern': 'i', 'patternPosition': 'middle', 'syllableBreakdown': 'sit', 'syllableCount': 1},
                {'word': 'dog', 'pattern': 'o', 'patternPosition': 'middle', 'syllableBreakdown': 'dog', 'syllableCount': 1},
                {'word': 'sun', 'pattern': 'u', 'patternPosition': 'middle', 'syllableBreakdown': 'sun', 'syllableCount': 1},
            ],
            'long_vowels': [
                {'word': 'cake', 'pattern': 'a', 'patternPosition': 'middle', 'syllableBreakdown': 'cake', 'syllableCount': 1},
                {'word': 'feet', 'pattern': 'e', 'patternPosition': 'middle', 'syllableBreakdown': 'feet', 'syllableCount': 1},
                {'word': 'bike', 'pattern': 'i', 'patternPosition': 'middle', 'syllableBreakdown': 'bike', 'syllableCount': 1},
                {'word': 'rope', 'pattern': 'o', 'patternPosition': 'middle', 'syllableBreakdown': 'rope', 'syllableCount': 1},
                {'word': 'cute', 'pattern': 'u', 'patternPosition': 'middle', 'syllableBreakdown': 'cute', 'syllableCount': 1},
            ],
            'blends': [
                {'word': 'stop', 'pattern': 'st', 'patternPosition': 'beginning', 'syllableBreakdown': 'stop', 'syllableCount': 1},
                {'word': 'flag', 'pattern': 'fl', 'patternPosition': 'beginning', 'syllableBreakdown': 'flag', 'syllableCount': 1},
                {'word': 'clip', 'pattern': 'cl', 'patternPosition': 'beginning', 'syllableBreakdown': 'clip', 'syllableCount': 1},
                {'word': 'trip', 'pattern': 'tr', 'patternPosition': 'beginning', 'syllableBreakdown': 'trip', 'syllableCount': 1},
                {'word': 'grab', 'pattern': 'gr', 'patternPosition': 'beginning', 'syllableBreakdown': 'grab', 'syllableCount': 1},
            ],
            'digraphs': [
                {'word': 'ship', 'pattern': 'sh', 'patternPosition': 'beginning', 'syllableBreakdown': 'ship', 'syllableCount': 1},
                {'word': 'chip', 'pattern': 'ch', 'patternPosition': 'beginning', 'syllableBreakdown': 'chip', 'syllableCount': 1},
                {'word': 'this', 'pattern': 'th', 'patternPosition': 'beginning', 'syllableBreakdown': 'this', 'syllableCount': 1},
                {'word': 'when', 'pattern': 'wh', 'patternPosition': 'beginning', 'syllableBreakdown': 'when', 'syllableCount': 1},
                {'word': 'fish', 'pattern': 'sh', 'patternPosition': 'ending', 'syllableBreakdown': 'fish', 'syllableCount': 1},
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