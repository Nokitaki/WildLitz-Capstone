# backend/wildlitz/syllabification/views.py
from django.http import JsonResponse 
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
import json
import random
from supabase import create_client
from django.conf import settings
import logging
import time

# Import the AI service
from .services_ai import AIContentGenerator

# Import progress tracking
from api.models import UserProgress, UserActivity

logger = logging.getLogger(__name__)

# Create Supabase client using settings
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

# Initialize AI content generator
ai_generator = AIContentGenerator()

def log_syllabification_activity(user, activity_type, question_data, user_answer, correct_answer, is_correct, time_spent, difficulty='medium'):
    """Helper function to log syllabification activities"""
    try:
        if user.is_authenticated:
            UserActivity.objects.create(
                user=user,
                module='syllabification',
                activity_type=activity_type,
                question_data=question_data,
                user_answer=user_answer,
                correct_answer=correct_answer,
                is_correct=is_correct,
                time_spent=time_spent,
                difficulty=difficulty,
                challenge_level='syllable_counting',
                learning_focus='syllable_awareness'
            )
            
            # Update progress summary
            progress, created = UserProgress.objects.get_or_create(
                user=user,
                module='syllabification',
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
        logger.error(f"Error logging syllabification activity: {str(e)}")

@api_view(['GET'])
@permission_classes([AllowAny])
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
            
            # If no words left after filtering, return error
            if not words:
                return JsonResponse({'error': 'No new words available with the specified criteria'}, status=404)
            
            # Select a random word
            selected_word = random.choice(words)
            logger.info(f"Selected word: {selected_word['word']}")
            
            # Generate AI content
            fun_fact = ai_generator.generate_fun_fact(selected_word['word'], selected_word['category'])
            intro_message = ai_generator.generate_character_message(selected_word['word'], 'intro', difficulty)
            
            # Return word data with AI content
            word_data = {
                'word': selected_word['word'],
                'syllables': selected_word['syllable_breakdown'],
                'count': selected_word['syllable_count'],
                'category': selected_word['category'],
                'image_url': selected_word.get('image_url', ''),
                'pronunciation_guide': selected_word.get('pronunciation_guide', selected_word['syllable_breakdown']),
                'fun_fact': fun_fact,
                'intro_message': intro_message
            }
            
            return JsonResponse(word_data)
        else:
            logger.warning("No words found matching criteria")
            return JsonResponse({'error': 'No words found with the specified criteria'}, status=404)
            
    except Exception as e:
        import traceback
        logger.error(f"Error fetching from Supabase: {str(e)}")
        logger.error(traceback.format_exc())  # Print the full traceback
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def check_syllable_answer(request):
    """Check syllable clapping answer and provide AI feedback with progress tracking"""
    start_time = time.time()
    
    try:
        data = request.data
        word = data.get('word')
        syllables = data.get('syllables')
        user_clap_count = data.get('clapCount')
        correct_count = data.get('correctCount')
        difficulty = data.get('difficulty', 'medium')
        
        # Determine if answer is correct
        is_correct = user_clap_count == correct_count
        
        # Calculate time spent (if provided)
        time_spent = data.get('timeSpent', time.time() - start_time)
        
        # Generate appropriate feedback message
        context = 'correct' if is_correct else 'incorrect'
        feedback_message = ai_generator.generate_character_message(word, context)
        
        # Log activity for authenticated users
        if request.user.is_authenticated:
            log_syllabification_activity(
                user=request.user,
                activity_type='syllable_clapping',
                question_data={
                    'word': word,
                    'syllables': syllables,
                    'correct_count': correct_count
                },
                user_answer={'clap_count': user_clap_count},
                correct_answer={'clap_count': correct_count},
                is_correct=is_correct,
                time_spent=time_spent,
                difficulty=difficulty
            )
        
        response_data = {
            'is_correct': is_correct,
            'feedback_message': feedback_message
        }
        
        # Add progress info for authenticated users
        if request.user.is_authenticated:
            try:
                progress = UserProgress.objects.get(
                    user=request.user,
                    module='syllabification',
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
        logger.error(f"Error checking syllable answer: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def get_syllable_pronunciation(request):
    """Get pronunciation guidance for a word and its syllables"""
    try:
        data = request.data
        word = data.get('word')
        syllable_breakdown = data.get('syllables')
        
        if not word or not syllable_breakdown:
            return Response({'error': 'Word and syllable breakdown are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate pronunciation guidance
        pronunciation_guide = ai_generator.generate_pronunciation_guide(word, syllable_breakdown)
        
        return Response({'pronunciation_guide': pronunciation_guide})
    
    except Exception as e:
        logger.error(f"Error generating pronunciation guide: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_word_batch(request):
    """Get a batch of words for syllabification practice from Supabase"""
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
                    'pronunciation_guide': word.get('pronunciation_guide', word['syllable_breakdown']),
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
@api_view(['GET'])
@permission_classes([AllowAny])
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

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def generate_ai_content(request):
    """Generate AI content for syllabification activities"""
    try:
        data = request.data
        content_type = data.get('type', 'fun_fact')
        word = data.get('word', '')
        category = data.get('category', 'General')
        difficulty = data.get('difficulty', 'medium')
        
        if content_type == 'fun_fact':
            content = ai_generator.generate_fun_fact(word, category)
        elif content_type == 'character_message':
            context = data.get('context', 'intro')
            content = ai_generator.generate_character_message(word, context, difficulty)
        elif content_type == 'syllable_tip':
            content = ai_generator.generate_syllable_tip(difficulty)
        elif content_type == 'category_suggestion':
            content = ai_generator.suggest_category(word)
        # 👇 ADD THIS NEW CONDITION
        elif content_type == 'syllable_breakdown_suggestion':
            content = ai_generator.generate_syllable_breakdown(word)
        else:
            return Response({'error': 'Invalid content type'}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({'content': content})
    
    except Exception as e:
        logger.error(f"Error generating AI content: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
# ==========================================
# NEW ENDPOINTS FOR CUSTOM WORDS
# ==========================================

@api_view(['GET'])
@permission_classes([AllowAny])
def check_word_exists(request):
    """
    Check if a word already exists in the database
    Returns existing word data if found
    """
    word = request.GET.get('word', '').strip()
    
    if not word:
        return Response({'error': 'Word parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Use RPC function to query wildlitz schema
        response = supabase.rpc('get_word_from_public', {'search_word': word}).execute()
        
        if response.data and len(response.data) > 0:
            existing_word = response.data[0]
            
            return Response({
                'exists': True,
                'word': {
                    'id': existing_word['id'],
                    'word': existing_word['word'],
                    'syllable_breakdown': existing_word['syllable_breakdown'],
                    'syllable_count': existing_word['syllable_count'],
                    'category': existing_word['category'],
                    'difficulty_level': existing_word['difficulty_level'],
                    'image_url': existing_word.get('image_url'),
                    'pronunciation_guide': existing_word.get('syllable_breakdown'),
                    'is_custom': existing_word.get('is_custom', False),
                    'created_by_name': existing_word.get('created_by_name', 'Unknown'),
                    'usage_count': existing_word.get('usage_count', 0),
                    'rating': float(existing_word.get('rating', 0.0)),
                    'fun_fact': existing_word.get('fun_fact'),
                    'intro_message': existing_word.get('intro_message')
                }
            })
        else:
            return Response({
                'exists': False,
                'message': f'Word "{word}" not found in database'
            })
            
    except Exception as e:
        logger.error(f"Error checking word existence: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def validate_syllable_structure(request):
    """
    Use AI to validate teacher's syllable breakdown
    """
    try:
        data = request.data
        word = data.get('word', '').strip()
        syllable_breakdown = data.get('syllable_breakdown', '').strip()
        
        if not word or not syllable_breakdown:
            return Response(
                {'error': 'Both word and syllable_breakdown are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Use AI to validate
        validation_result = ai_generator.validate_syllable_structure(word, syllable_breakdown)
        
        return Response({
            'validation': validation_result,
            'word': word,
            'submitted_breakdown': syllable_breakdown
        })
        
    except Exception as e:
        logger.error(f"Error validating syllable structure: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def create_custom_word(request):
    """
    Create a new custom word with optional image and audio uploads
    """
    try:
        # Get form data
        word = request.data.get('word', '').strip()
        syllable_breakdown = request.data.get('syllable_breakdown', '').strip()
        category = request.data.get('category', '').strip()
        
        # Validate required fields
        if not word or not syllable_breakdown:
            return Response(
                {'error': 'Word and syllable_breakdown are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate syllable count
        syllable_count = len(syllable_breakdown.split('-'))
        
        # Determine difficulty based on syllable count
        if syllable_count <= 2:
            difficulty_level = 'easy'
        elif syllable_count == 3:
            difficulty_level = 'medium'
        else:
            difficulty_level = 'hard'
        
        # AI: Validate syllable structure
        validation_result = ai_generator.validate_syllable_structure(word, syllable_breakdown)
        
        # AI: Suggest category if not provided
        if not category:
            category = 'Custom Words'
        
        # AI: Generate fun fact and intro message
        fun_fact = ai_generator.generate_fun_fact(word, category)
        intro_message = ai_generator.generate_character_message(word, 'intro', difficulty_level)
        
        # Handle file uploads
        image_url = None
        full_word_audio_url = None
        syllable_audio_urls = []
        
        # Upload image if provided
        if 'image' in request.FILES:
            from .services_ai import upload_file_to_supabase_storage
            image_file = request.FILES['image']
            image_filename = f"{word.lower().replace(' ', '_')}.{image_file.name.split('.')[-1]}"
            try:
                image_url = upload_file_to_supabase_storage(
                    image_file, 
                    'syllable-word-images', 
                    image_filename
                )
            except Exception as e:
                logger.error(f"Error uploading image: {str(e)}")
        
        # Upload full word audio if provided
        if 'full_word_audio' in request.FILES:
            from .services_ai import upload_file_to_supabase_storage
            audio_file = request.FILES['full_word_audio']
            audio_filename = f"{word.lower().replace(' ', '_')}_full.{audio_file.name.split('.')[-1]}"
            try:
                full_word_audio_url = upload_file_to_supabase_storage(
                    audio_file, 
                    'syllable-word-audio', 
                    audio_filename
                )
            except Exception as e:
                logger.error(f"Error uploading full word audio: {str(e)}")
        
        # Upload syllable audio files if provided
        syllables = syllable_breakdown.split('-')
        for idx in range(len(syllables)):
            field_name = f'syllable_audio_{idx}'
            if field_name in request.FILES:
                from .services_ai import upload_file_to_supabase_storage
                syllable_file = request.FILES[field_name]
                syllable_filename = f"{word.lower().replace(' ', '_')}_syl_{idx}.{syllable_file.name.split('.')[-1]}"
                try:
                    syllable_url = upload_file_to_supabase_storage(
                        syllable_file, 
                        'syllable-word-audio', 
                        syllable_filename
                    )
                    syllable_audio_urls.append(syllable_url)
                except Exception as e:
                    logger.error(f"Error uploading syllable audio {idx}: {str(e)}")
        
        # Get user info if authenticated
        created_by = None
        created_by_name = 'Anonymous'
        if request.user.is_authenticated:
            created_by = str(request.user.id)
            created_by_name = request.user.username or request.user.email
        
        # Use RPC function to insert into wildlitz schema
        response = supabase.rpc('insert_custom_word_to_public', {
            'p_word': word,
            'p_syllable_breakdown': syllable_breakdown,
            'p_syllable_count': syllable_count,
            'p_difficulty_level': difficulty_level,
            'p_category': category,
            'p_image_url': image_url,
            'p_full_word_audio_url': full_word_audio_url,
            'p_syllable_audio_urls': syllable_audio_urls,
            'p_fun_fact': fun_fact,
            'p_intro_message': intro_message,
            'p_ai_suggested_category': category,
            'p_is_ai_validated': True,
            'p_ai_validation_result': validation_result,
            'p_created_by': created_by,
            'p_created_by_name': created_by_name,
            'p_is_custom': True,
            'p_is_public': True
        }).execute()
        
        if response.data and len(response.data) > 0:
            created_word = response.data[0]
            logger.info(f"Custom word created: {word} by {created_by_name}")
            
            return Response({
                'success': True,
                'message': f'Custom word "{word}" created successfully!',
                'word': created_word,
                'validation': validation_result
            }, status=status.HTTP_201_CREATED)
        else:
            return Response(
                {'error': 'Failed to create word in database'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
    except Exception as e:
        logger.error(f"Error creating custom word: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_custom_words(request):
    """
    Get custom words for the game
    Can filter by word IDs or get all public custom words
    """
    try:
        word_ids = request.GET.getlist('word_ids[]', [])
        
        # Use RPC function to query wildlitz schema
        if word_ids:
            # Convert to proper format for PostgreSQL array
            response = supabase.rpc('get_custom_words_from_public', {'word_ids': word_ids}).execute()
        else:
            # Get all custom words (pass NULL)
            response = supabase.rpc('get_custom_words_from_public', {'word_ids': None}).execute()
        
        words = response.data if response.data else []
        
        return Response({
            'words': words,
            'count': len(words)
        })
        
    except Exception as e:
        logger.error(f"Error fetching custom words: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET'])
@permission_classes([AllowAny])
def search_words(request):
    """
    Search and filter words from the database with pagination.
    """
    try:
        # Get query parameters
        search_term = request.GET.get('q', '').strip()
        categories = request.GET.getlist('categories[]', [])
        has_audio = request.GET.get('has_audio', 'false').lower() == 'true'
        page = int(request.GET.get('page', 1))
        page_size = 10  # Words per page

        # Start building the Supabase query
        query = supabase.table('syllable_words').select('*', count='exact')

        # Apply filters
        if search_term:
            query = query.ilike('word', f'%{search_term}%')
        
        if categories:
            query = query.in_('category', categories)

        if has_audio:
            query = query.not_.is_('full_word_audio_url', 'null')

        # Apply pagination
        start_index = (page - 1) * page_size
        end_index = start_index + page_size - 1
        query = query.range(start_index, end_index)
        
        # ✅ ADD THIS LINE - Order alphabetically by word (A-Z)
        query = query.order('word', desc=False)

        # Execute the query
        response = query.execute()
        
        words = response.data if response.data else []
        total_count = response.count if response.count is not None else 0

        return Response({
            'results': words,
            'count': total_count,
            'page': page,
            'totalPages': (total_count + page_size - 1) // page_size
        })

    except Exception as e:
        logger.error(f"Error searching words: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@csrf_exempt
@api_view(['DELETE'])
@permission_classes([AllowAny]) # Or IsAuthenticated if you want to protect it
def delete_custom_word(request, word_id):
    """
    Permanently delete a custom word from the database.
    """
    try:
        # Use the table in the public schema and delete the word matching the ID
        response = supabase.table('syllable_words').delete().eq('id', word_id).execute()
        
        # Check if any data was returned (successful deletion)
        if response.data:
            logger.info(f"Successfully deleted word with ID: {word_id}")
            return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            logger.warning(f"Could not find word with ID: {word_id} to delete.")
            return Response({'error': 'Word not found'}, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        logger.error(f"Error deleting word with ID {word_id}: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@csrf_exempt
@api_view(['PUT'])
@permission_classes([AllowAny])
def update_custom_word(request, word_id):
    """
    Update an existing custom word in the database.
    Now supports audio file uploads.
    """
    try:
        data = request.data
        word = data.get('word', '').strip()
        syllable_breakdown = data.get('syllable_breakdown', '').strip()
        category = data.get('category', '').strip()

        if not word or not syllable_breakdown or not category:
            return Response(
                {'error': 'Word, syllable_breakdown, and category are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Recalculate syllable count and difficulty
        syllable_count = len(syllable_breakdown.split('-'))
        if syllable_count <= 2:
            difficulty_level = 'easy'
        elif syllable_count == 3:
            difficulty_level = 'medium'
        else:
            difficulty_level = 'hard'

        # Prepare the data for updating
        update_data = {
            'word': word,
            'syllable_breakdown': syllable_breakdown,
            'syllable_count': syllable_count,
            'category': category,
            'difficulty_level': difficulty_level
        }

        # Handle new audio uploads
        full_word_audio_url = None
        syllable_audio_urls = []

        # Upload new full word audio if provided
        if 'full_word_audio' in request.FILES:
            from .services_ai import upload_file_to_supabase_storage
            audio_file = request.FILES['full_word_audio']
            audio_filename = f"{word.lower().replace(' ', '_')}_full.{audio_file.name.split('.')[-1]}"
            try:
                full_word_audio_url = upload_file_to_supabase_storage(
                    audio_file, 
                    'syllable-word-audio', 
                    audio_filename
                )
                update_data['full_word_audio_url'] = full_word_audio_url
            except Exception as e:
                logger.error(f"Error uploading full word audio: {str(e)}")

        # Upload new syllable audio files if provided
        syllables = syllable_breakdown.split('-')
        for idx in range(len(syllables)):
            field_name = f'syllable_audio_{idx}'
            if field_name in request.FILES:
                from .services_ai import upload_file_to_supabase_storage
                syllable_file = request.FILES[field_name]
                syllable_filename = f"{word.lower().replace(' ', '_')}_syl_{idx}.{syllable_file.name.split('.')[-1]}"
                try:
                    syllable_url = upload_file_to_supabase_storage(
                        syllable_file, 
                        'syllable-word-audio', 
                        syllable_filename
                    )
                    syllable_audio_urls.append(syllable_url)
                except Exception as e:
                    logger.error(f"Error uploading syllable audio {idx}: {str(e)}")

        # If we have new syllable audios, update the field
        if syllable_audio_urls:
            update_data['syllable_audio_urls'] = syllable_audio_urls

        # Execute the update query on the public.syllable_words table
        response = supabase.table('syllable_words').update(update_data).eq('id', word_id).execute()

        if response.data:
            updated_word = response.data[0]
            logger.info(f"Successfully updated word with ID: {word_id}")
            return Response(updated_word, status=status.HTTP_200_OK)
        else:
            logger.warning(f"Could not find word with ID: {word_id} to update.")
            return Response({'error': 'Word not found'}, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        logger.error(f"Error updating word with ID {word_id}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)