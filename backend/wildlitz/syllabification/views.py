from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import random
from supabase import create_client
from django.conf import settings

# Create Supabase client using settings
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

def get_syllabification_word_from_supabase(request):
    """Get a random word for syllabification practice from Supabase"""
    difficulty = request.GET.get('difficulty', 'medium')
    categories = request.GET.getlist('categories[]', [])  # Get categories as list
    
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
        print(f"Executing Supabase query with difficulty: {difficulty}, categories: {categories}")
        response = query.execute()
        
        # Check if we got any results
        words = response.data
        print(f"Number of words found: {len(words) if words else 0}")
        
        if words and len(words) > 0:
            # Get a random word
            word = random.choice(words)
            print(f"Selected word: {word['word']}")
            return JsonResponse({
                'word': word['word'],
                'syllables': word['syllable_breakdown'],
                'count': word['syllable_count'],
                'category': word['category'],
                'image_url': word.get('image_url', '')
            })
        else:
            print("No words found matching criteria")
            return JsonResponse({'error': 'No words found with the specified criteria'}, status=404)
            
    except Exception as e:
        import traceback
        print(f"Error fetching from Supabase: {str(e)}")
        print(traceback.format_exc())  # Print the full traceback
        return JsonResponse({'error': str(e)}, status=500)