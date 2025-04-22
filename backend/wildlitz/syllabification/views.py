# backend/wildlitz/syllabification/views.py
from django.http import JsonResponse 
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import random
from supabase import create_client
from django.conf import settings
import logging

# Import the AI service
from .services_ai import AIContentGenerator

logger = logging.getLogger(__name__)

# Create Supabase client using settings
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

# Initialize AI content generator
ai_generator = AIContentGenerator()

def get_syllabification_word_from_supabase(request):
    """Get a random word for syllabification practice from Supabase"""
    difficulty = request.GET.get('difficulty', 'medium')
    categories = request.GET.getlist('categories[]', [])  # Get categories as list
    exclude_words = request.GET.getlist('exclude[]', [])  # Get words to exclude
    
    try:
        # Use the table in the public schema
        query = supabase.table('syllable_words').select('*')
        
        # Apply difficulty filter
        if difficulty:
            query = query.eq('difficulty_level', difficulty)
        
        # Apply category filter if provided
        if categories:
            query = query.in_('category', categories)
        
        # Execute the query
        logger.info(f"Executing Supabase query with difficulty: {difficulty}, categories: {categories}")
        response = query.execute()
        
        # Check if we got any results
        words = response.data
        logger.info(f"Number of words found: {len(words) if words else 0}")
        
        if words and len(words) > 0:
            # Filter out excluded words
            if exclude_words:
                words = [w for w in words if w['word'] not in exclude_words]
            
            # If no words left after filtering, return all words (start over)
            if not words:
                logger.warning("All words have been used, starting over")
                response = query.execute()
                words = response.data
            
            # Get a random word
            word = random.choice(words)
            logger.info(f"Selected word: {word['word']}")
            
            # Generate a fun fact using AI
            fun_fact = ai_generator.generate_fun_fact(word['word'], word['category'])
            
            # Generate an intro message
            intro_message = ai_generator.generate_character_message(word['word'], 'intro', difficulty)
            
            return JsonResponse({
                'word': word['word'],
                'syllables': word['syllable_breakdown'],
                'count': word['syllable_count'],
                'category': word['category'],
                'image_url': word.get('image_url', ''),
                'fun_fact': fun_fact,
                'intro_message': intro_message
            })
        else:
            logger.warning("No words found matching criteria")
            return JsonResponse({'error': 'No words found with the specified criteria'}, status=404)
            
    except Exception as e:
        import traceback
        logger.error(f"Error fetching from Supabase: {str(e)}")
        logger.error(traceback.format_exc())  # Print the full traceback
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def check_syllable_answer(request):
    """Check syllable clapping answer and provide AI feedback"""
    try:
        data = json.loads(request.body)
        word = data.get('word')
        syllables = data.get('syllables')
        user_clap_count = data.get('clapCount')
        correct_count = data.get('correctCount')
        
        # Determine if answer is correct
        is_correct = user_clap_count == correct_count
        
        # Generate appropriate feedback message
        context = 'correct' if is_correct else 'incorrect'
        feedback_message = ai_generator.generate_character_message(word, context)
        
        return JsonResponse({
            'is_correct': is_correct,
            'feedback_message': feedback_message
        })
    
    except Exception as e:
        logger.error(f"Error checking syllable answer: {str(e)}")
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def get_syllable_pronunciation(request):
    """Get pronunciation guidance for a word and its syllables"""
    try:
        data = json.loads(request.body)
        word = data.get('word')
        syllable_breakdown = data.get('syllables')
        
        if not word or not syllable_breakdown:
            return JsonResponse({'error': 'Word and syllable breakdown are required'}, status=400)
        
        # Generate pronunciation guidance
        pronunciation_guide = ai_generator.generate_pronunciation_guide(word, syllable_breakdown)
        
        # Add a character message for the demo
        demo_message = ai_generator.generate_character_message(word, 'demo')
        pronunciation_guide['character_message'] = demo_message
        
        return JsonResponse(pronunciation_guide)
    
    except Exception as e:
        logger.error(f"Error generating pronunciation guidance: {str(e)}")
        return JsonResponse({'error': str(e)}, status=400)

# Add this endpoint to the urls.py file later
@csrf_exempt
@require_http_methods(["POST"])
def generate_ai_content(request):
    """General endpoint for generating various AI content"""
    try:
        data = json.loads(request.body)
        content_type = data.get('type')  # 'fun_fact', 'character_message', or 'pronunciation'
        word = data.get('word')
        category = data.get('category', '')
        context = data.get('context', 'intro')  # For character messages
        syllable_breakdown = data.get('syllables', '')
        
        if not word:
            return JsonResponse({'error': 'Word parameter is required'}, status=400)
        
        if content_type == 'fun_fact':
            content = ai_generator.generate_fun_fact(word, category)
        elif content_type == 'character_message':
            content = ai_generator.generate_character_message(word, context)
        elif content_type == 'pronunciation':
            content = ai_generator.generate_pronunciation_guide(word, syllable_breakdown)
        else:
            return JsonResponse({'error': 'Invalid content type'}, status=400)
        
        return JsonResponse({'content': content})
    
    except Exception as e:
        logger.error(f"Error generating AI content: {str(e)}")
        return JsonResponse({'error': str(e)}, status=400)

def get_word_batch(request):
    """Get a batch of words for syllabification practice with AI-generated content"""
    difficulty = request.GET.get('difficulty', 'medium')
    categories = request.GET.getlist('categories[]', [])  # Get categories as list
    count = int(request.GET.get('count', 10))  # Number of words to fetch
    
    try:
        # Log the input parameters for debugging
        logger.info(f"Batch request - Difficulty: {difficulty}, Categories: {categories}, Count: {count}")
        
        # Use the table in the public schema
        query = supabase.table('syllable_words').select('*')
        
        # Apply difficulty filter
        if difficulty:
            query = query.eq('difficulty_level', difficulty)
        
        # Apply category filter if provided and categories is not empty
        if categories and len(categories) > 0:
            # Try to find matching categories - some flexibility in naming
            db_categories = []
            for cat in categories:
                # Add the category as is (if it's an exact match)
                db_categories.append(cat)
                
                # Add potential variations (e.g., "School Supplies" might be stored as "SchoolSupplies" or "School_Supplies")
                if ' ' in cat:
                    db_categories.append(cat.replace(' ', ''))
                    db_categories.append(cat.replace(' ', '_'))
            
            # Apply the IN filter with all possible category variations
            query = query.in_('category', db_categories)
        
        # Execute the query
        logger.info(f"Executing Supabase batch query with params")
        response = query.execute()
        
        # Check if we got any results
        all_words = response.data
        logger.info(f"Number of words found: {len(all_words) if all_words else 0}")
        
        # If no words found with categories, try without category filter as fallback
        if not all_words or len(all_words) == 0:
            logger.warning(f"No words found with the specified categories. Falling back to difficulty only.")
            query = supabase.table('syllable_words').select('*')
            
            # Apply difficulty filter
            if difficulty:
                query = query.eq('difficulty_level', difficulty)
                
            response = query.execute()
            all_words = response.data
            logger.info(f"Fallback search found {len(all_words) if all_words else 0} words")
        
        if all_words and len(all_words) > 0:
            # Ensure we have unique words
            unique_words = []
            word_set = set()
            
            for word in all_words:
                if word['word'] not in word_set:
                    word_set.add(word['word'])
                    unique_words.append(word)
            
            logger.info(f"Filtered to {len(unique_words)} unique words (removed {len(all_words) - len(unique_words)} duplicates)")
            
            # If we don't have enough words, repeat some to meet the count
            if len(unique_words) < count:
                logger.warning(f"Not enough unique words ({len(unique_words)}), will duplicate some to meet count {count}")
                # Duplicate the words until we have enough
                while len(unique_words) < count:
                    unique_words.extend(unique_words[:count - len(unique_words)])
            
            # Randomly select the requested number of words
            selected_words = random.sample(unique_words, count)
            
            # Prepare the batch of words with AI-generated content
            words_with_content = []
            processed_words = set()  # Track words to ensure no duplicates
            
            for word in selected_words:
                # Skip if we've already processed this word
                if word['word'] in processed_words:
                    continue
                    
                processed_words.add(word['word'])
                
                # Generate AI content for each word
                fun_fact = ai_generator.generate_fun_fact(word['word'], word['category'])
                intro_message = ai_generator.generate_character_message(word['word'], 'intro', difficulty)
                
                words_with_content.append({
                    'word': word['word'],
                    'syllables': word['syllable_breakdown'],
                    'count': word['syllable_count'],
                    'category': word['category'],
                    'image_url': word.get('image_url', ''),
                    'fun_fact': fun_fact,
                    'intro_message': intro_message
                })
            
            logger.info(f"Returning {len(words_with_content)} words with AI-generated content")
            return JsonResponse({'words': words_with_content})
        else:
            logger.warning("No words found matching criteria")
            return JsonResponse({'error': 'No words found with the specified criteria'}, status=404)
            
    except Exception as e:
        import traceback
        logger.error(f"Error fetching word batch from Supabase: {str(e)}")
        logger.error(traceback.format_exc())  # Print the full traceback
        return JsonResponse({'error': str(e)}, status=500)
    
@csrf_exempt
@require_http_methods(["GET"])
def get_syllable_tip(request):
    """Get a random educational tip about syllables"""
    try:
        difficulty = request.GET.get('difficulty', 'medium')
        
        # Generate a syllable tip using the AI content generator
        tip = ai_generator.generate_syllable_tip(difficulty)
        
        return JsonResponse({'tip': tip})
    
    except Exception as e:
        logger.error(f"Error generating syllable tip: {str(e)}")
        return JsonResponse({'error': str(e)}, status=400)