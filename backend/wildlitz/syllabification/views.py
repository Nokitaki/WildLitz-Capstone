# backend/wildlitz/syllabification/views.py
from django.http import JsonResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.request import Request # Needed for simulating request
import logging
import time
import json # Needed for simulating request body
import random # If you use random elements

# Import the AI service from the current app
from .services_ai import AIContentGenerator

# Import models and views from the api app (needed for logging)
from api.models import UserProgress, UserActivity # Import models if you need to reference them directly
from api.views import log_user_activity as api_log_user_activity # Import the logging function

# Import Supabase client if needed for other functions in this file
from django.conf import settings
from supabase import create_client, Client

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
            
            # Return word data with AI content AND AUDIO URLS
            word_data = {
                'word': selected_word['word'],
                'syllables': selected_word['syllable_breakdown'],
                'count': selected_word['syllable_count'],
                'category': selected_word['category'],
                'image_url': selected_word.get('image_url', ''),
                'full_word_audio_url': selected_word.get('full_word_audio_url'),
                'syllable_audio_urls': selected_word.get('syllable_audio_urls', []),
                'phonetic_guide': selected_word.get('phonetic_guide'),  # ✅ ADD THIS LINE
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
@permission_classes([AllowAny]) # Allows anyone to check, but logs only if authenticated
def check_syllable_answer(request):
    """Check syllable clap count against correct count with AI feedback"""
    start_time = time.time()
    try:
        data = request.data
        word_str = data.get('word')
        syllables = data.get('syllables')
        clap_count = int(data.get('clapCount', 0))
        correct_count = int(data.get('correctCount', 0))
        difficulty = data.get('difficulty', 'medium')

        if not word_str or not syllables:
            return Response({'error': 'Word and syllables are required'}, status=status.HTTP_400_BAD_REQUEST)

        is_correct = (clap_count == correct_count)

        # Generate AI feedback message
        ai_gen = AIContentGenerator()
        feedback_context = 'correct' if is_correct else 'incorrect'
        feedback_message = ai_gen.generate_character_message(word_str, feedback_context, difficulty)

        # Generate AI learning feedback
        learning_feedback = ai_gen.generate_learning_feedback(word_str, is_correct, correct_count, difficulty)

        end_time = time.time()
        time_spent = end_time - start_time # Note: Frontend calculation is usually more accurate

        # Log activity ONLY if user is authenticated
        if request.user.is_authenticated:
            try:
                # Prepare data for the central logging function
                log_data = {
                    'module': 'syllabification',
                    'activity_type': 'syllable_clapping',
                    'question_data': {'word': word_str, 'syllables': syllables, 'correct_count': correct_count},
                    'user_answer': {'clap_count': clap_count},
                    'correct_answer': {'clap_count': correct_count},
                    'is_correct': is_correct,
                    'time_spent': time_spent, # Ideally, get this from frontend request data
                    'difficulty': difficulty,
                    # Add other fields from api/models.py UserActivity if needed
                }

                # Simulate the request object needed by api_log_user_activity
                http_request = HttpRequest()
                http_request.method = 'POST'
                http_request.user = request.user # Pass the actual logged-in user
                http_request._body = json.dumps(log_data).encode('utf-8') # Simulate request body
                http_request.content_type = 'application/json'

                # Create a DRF Request object from the HttpRequest
                drf_request = Request(http_request)

                # Call the imported logging function from api.views
                api_log_user_activity(drf_request)

                logger.info(f"User {request.user.id} activity logged for '{word_str}'. Correct: {is_correct}")

            except Exception as log_e:
                logger.error(f"Failed to log activity for user {request.user.id}: {str(log_e)}")
                # Continue without failing the main request, but log the error

        return Response({
            'is_correct': is_correct,
            'feedback_message': feedback_message,
            'learning_feedback': learning_feedback,
            'correct_count': correct_count,
            'syllables': syllables.split('-')
        })

    except Exception as e:
        logger.error(f"Error in check_syllable_answer: {str(e)}")
        # Fallback response in case of any error
        clap_count = int(request.data.get('clapCount', 0))
        correct_count = int(request.data.get('correctCount', 0))
        is_correct = (clap_count == correct_count)
        return Response({
            'is_correct': is_correct,
            'feedback_message': "Good try!" if not is_correct else "Well done!",
            'learning_feedback': "Keep practicing to improve your syllable counting skills!",
            'correct_count': correct_count,
            'syllables': request.data.get('syllables', '').split('-')
        }, status=status.HTTP_200_OK) # Return OK even on internal error for graceful fallback

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
                
                # Append word data with AI content AND AUDIO URLS
                # Append word data with AI content AND AUDIO URLS
                words_with_content.append({
                    'word': word['word'],
                    'syllables': word['syllable_breakdown'],
                    'count': word['syllable_count'],
                    'category': word['category'],
                    'image_url': word.get('image_url', ''),
                    'full_word_audio_url': word.get('full_word_audio_url'),
                    'syllable_audio_urls': word.get('syllable_audio_urls', []),
                    'phonetic_guide': word.get('phonetic_guide'),  # ✅ ADD THIS LINE
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
                'is_custom': existing_word.get('is_custom', False),
                'created_by_name': existing_word.get('created_by_name', 'Unknown'),
                'usage_count': existing_word.get('usage_count', 0),
                'rating': float(existing_word.get('rating') or 0.0),
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
    FIXED: Uses direct database operations instead of RPC
    """
    try:
        # Get form data
        word = request.data.get('word', '').strip()
        syllable_breakdown = request.data.get('syllable_breakdown', '').strip()
        category = request.data.get('category', '').strip()
        difficulty_level = request.data.get('difficulty_level', '').strip()
        
        # Validate required fields
        if not word or not syllable_breakdown:
            return Response(
                {'error': 'Word and syllable_breakdown are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate difficulty_level is provided
        if not difficulty_level or difficulty_level not in ['easy', 'medium', 'hard']:
            return Response(
                {'error': 'Valid difficulty_level is required (easy, medium, or hard)'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate syllable count
        syllable_count = len(syllable_breakdown.split('-'))
        
        # AI: Validate syllable structure
        validation_result = ai_generator.validate_syllable_structure(word, syllable_breakdown)
        
        # AI: Suggest category if not provided
        if not category:
            category = 'Custom Words'
        
        # AI: Generate fun fact and intro message
        fun_fact = ai_generator.generate_fun_fact(word, category)
        intro_message = ai_generator.generate_character_message(word, 'intro', difficulty_level)
        
        # Generate phonetic guide
        phonetic_guide = ai_generator.generate_phonetic_guide(word, syllable_breakdown)
        
        # Handle file uploads
        image_url = None
        full_word_audio_url = None
        syllable_audio_urls = []
        upload_warnings = []
        
        # Upload image if provided
        if 'image' in request.FILES:
            from .services_ai import upload_file_to_supabase_storage
            image_file = request.FILES['image']
            image_filename = f"{word.lower().replace(' ', '_')}.{image_file.name.split('.')[-1]}"
            
            logger.info(f"Attempting to upload image: {image_filename}, Size: {image_file.size} bytes, Type: {image_file.content_type}")
            
            try:
                image_url = upload_file_to_supabase_storage(
                    image_file, 
                    'syllable-word-images', 
                    image_filename
                )
                logger.info(f"✅ Image uploaded successfully: {image_url}")
            except Exception as e:
                error_msg = f"Error uploading image '{image_filename}': {str(e)}"
                logger.error(error_msg)
                upload_warnings.append(f"Image upload failed: {str(e)}")
        
        # Upload full word audio if provided
        if 'full_word_audio' in request.FILES:
            from .services_ai import upload_file_to_supabase_storage
            audio_file = request.FILES['full_word_audio']
            audio_filename = f"{word.lower().replace(' ', '_')}_full.{audio_file.name.split('.')[-1]}"
            
            logger.info(f"Attempting to upload full word audio: {audio_filename}, Size: {audio_file.size} bytes, Type: {audio_file.content_type}")
            
            try:
                full_word_audio_url = upload_file_to_supabase_storage(
                    audio_file, 
                    'syllable-word-audio', 
                    audio_filename
                )
                logger.info(f"✅ Full word audio uploaded successfully: {full_word_audio_url}")
            except Exception as e:
                error_msg = f"Error uploading full word audio '{audio_filename}': {str(e)}"
                logger.error(error_msg)
                upload_warnings.append(f"Full word audio upload failed: {str(e)}")
        
        # Upload syllable audio files if provided
        syllables = syllable_breakdown.split('-')
        for idx in range(len(syllables)):
            field_name = f'syllable_audio_{idx}'
            if field_name in request.FILES:
                from .services_ai import upload_file_to_supabase_storage
                syllable_file = request.FILES[field_name]
                syllable_filename = f"{word.lower().replace(' ', '_')}_syl_{idx}.{syllable_file.name.split('.')[-1]}"
                
                logger.info(f"Attempting to upload syllable {idx} audio: {syllable_filename}, Size: {syllable_file.size} bytes")
                
                try:
                    syllable_url = upload_file_to_supabase_storage(
                        syllable_file, 
                        'syllable-word-audio', 
                        syllable_filename
                    )
                    syllable_audio_urls.append(syllable_url)
                    logger.info(f"✅ Syllable {idx} audio uploaded successfully: {syllable_url}")
                except Exception as e:
                    error_msg = f"Error uploading syllable audio {idx}: {str(e)}"
                    logger.error(error_msg)
                    upload_warnings.append(f"Syllable {idx} audio upload failed: {str(e)}")
        
        # Get user info if authenticated
        created_by = None
        created_by_name = 'Anonymous'
        if request.user.is_authenticated:
            created_by = str(request.user.id)
            created_by_name = request.user.username or request.user.email
        
        # 🔥 FIX: Use direct database insert instead of RPC
        # First, check if word already exists (case-insensitive)
        logger.info(f"Checking if word '{word}' already exists...")
        existing_check = supabase.table('syllable_words').select('id').ilike('word', word).execute()
        
        if existing_check.data and len(existing_check.data) > 0:
            logger.warning(f"Word '{word}' already exists with ID: {existing_check.data[0]['id']}")
            return Response(
                {
                    'error': f'Word "{word}" already exists in the database. Please use a different word or update the existing one.',
                    'existing_word_id': existing_check.data[0]['id']
                }, 
                status=status.HTTP_409_CONFLICT
            )
        
        # Prepare data for insert
        word_data = {
            'word': word.lower(),
            'syllable_breakdown': syllable_breakdown,
            'syllable_count': syllable_count,
            'difficulty_level': difficulty_level,
            'category': category,
            'image_url': image_url,
            'full_word_audio_url': full_word_audio_url,
            'syllable_audio_urls': syllable_audio_urls,
            'fun_fact': fun_fact,
            'intro_message': intro_message,
            'ai_suggested_category': category,
            'is_ai_validated': True,
            'ai_validation_result': validation_result,
            'phonetic_guide': phonetic_guide,
            'created_by': created_by,
            'created_by_name': created_by_name,
            'is_custom': True,
            'is_public': True,
            'rating': 0.0
        }
        
        # Insert into database
        logger.info(f"Inserting word '{word}' into database...")
        logger.info(f"Word data: word={word}, syllable_breakdown={syllable_breakdown}, syllable_count={syllable_count}")
        
        response = supabase.table('syllable_words').insert(word_data).execute()
        
        if response.data and len(response.data) > 0:
            created_word = response.data[0]
            logger.info(f"✅ Custom word created: {word} (ID: {created_word.get('id')}) by {created_by_name}")
            
            # Verify syllable_breakdown was saved
            saved_breakdown = created_word.get('syllable_breakdown')
            if saved_breakdown != syllable_breakdown:
                logger.error(f"⚠️ Syllable breakdown mismatch! Expected: '{syllable_breakdown}', Got: '{saved_breakdown}'")
            else:
                logger.info(f"✅ Syllable breakdown verified: '{saved_breakdown}'")
            
            response_data = {
                'success': True,
                'message': f'Custom word "{word}" created successfully!',
                'word': created_word,
                'validation': validation_result
            }
            
            if upload_warnings:
                response_data['warnings'] = upload_warnings
                logger.warning(f"⚠️ Word created with upload warnings: {upload_warnings}")
            
            return Response(response_data, status=status.HTTP_201_CREATED)
        else:
            logger.error("Failed to create word - no data returned")
            return Response(
                {'error': 'Failed to create word in database'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
    except Exception as e:
        logger.error(f"❌ Error creating custom word: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_custom_words(request):
    """
    Get custom words for the game
    Can filter by word IDs or get all public custom words
    FIXED: Uses direct database query instead of RPC
    """
    try:
        word_ids = request.GET.getlist('word_ids[]', [])
        
        logger.info(f"Fetching custom words. Filter: {word_ids if word_ids else 'all public'}")
        
        # Use direct query instead of RPC
        query = supabase.table('syllable_words').select('*')
        
        if word_ids:
            query = query.in_('id', word_ids)
        else:
            query = query.eq('is_public', True).eq('is_custom', True)
        
        response = query.execute()
        words = response.data if response.data else []
        
        logger.info(f"✅ Fetched {len(words)} custom words")
        
        if words and len(words) > 0:
            sample = words[0]
            logger.info(f"Sample: {sample.get('word')}, syllables: {sample.get('syllable_breakdown')}")
        
        return Response({
            'words': words,
            'count': len(words)
        })
        
    except Exception as e:
        logger.error(f"Error fetching custom words: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
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
        
        for word in words:
            validation_result = word.get('ai_validation_result', {})
            ratings_data = validation_result.get('ratings_data', {})
            word['rating_count'] = ratings_data.get('rating_count', 0)

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
@permission_classes([AllowAny])  # Change to IsAuthenticated if you want to protect it
def delete_custom_word(request, word_id):
    """
    Permanently delete a custom word from the database.
    FIXED: Proper response handling, storage cleanup, and error handling
    """
    try:
        # Validate UUID format
        logger.info(f"Attempting to delete word with ID: {word_id}")
        
        # First, get the word to check if it exists and to get file URLs for cleanup
        check_response = supabase.table('syllable_words').select('*').eq('id', word_id).execute()
        
        if not check_response.data or len(check_response.data) == 0:
            logger.warning(f"Word not found with ID: {word_id}")
            return Response(
                {'error': 'Word not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        word_data = check_response.data[0]
        word_name = word_data.get('word', 'unknown')
        logger.info(f"Found word to delete: '{word_name}' (ID: {word_id})")
        
        # 🧹 Delete associated storage files
        deleted_files = []
        failed_deletions = []
        
        try:
            # Delete image if exists
            image_url = word_data.get('image_url')
            if image_url:
                try:
                    # Extract filename from URL
                    # URL format: https://xxx.supabase.co/storage/v1/object/public/bucket-name/filename.ext
                    filename = image_url.split('/')[-1]
                    supabase.storage.from_('syllable-word-images').remove([filename])
                    deleted_files.append(f"image: {filename}")
                    logger.info(f"✅ Deleted image: {filename}")
                except Exception as e:
                    failed_deletions.append(f"image: {str(e)}")
                    logger.warning(f"⚠️ Failed to delete image: {str(e)}")
            
            # Delete full word audio if exists
            full_audio_url = word_data.get('full_word_audio_url')
            if full_audio_url:
                try:
                    filename = full_audio_url.split('/')[-1]
                    supabase.storage.from_('syllable-word-audio').remove([filename])
                    deleted_files.append(f"full audio: {filename}")
                    logger.info(f"✅ Deleted full word audio: {filename}")
                except Exception as e:
                    failed_deletions.append(f"full audio: {str(e)}")
                    logger.warning(f"⚠️ Failed to delete full word audio: {str(e)}")
            
            # Delete syllable audio files if exist
            syllable_audio_urls = word_data.get('syllable_audio_urls', [])
            if syllable_audio_urls and isinstance(syllable_audio_urls, list):
                for idx, audio_url in enumerate(syllable_audio_urls):
                    if audio_url:
                        try:
                            filename = audio_url.split('/')[-1]
                            supabase.storage.from_('syllable-word-audio').remove([filename])
                            deleted_files.append(f"syllable {idx} audio: {filename}")
                            logger.info(f"✅ Deleted syllable audio {idx}: {filename}")
                        except Exception as e:
                            failed_deletions.append(f"syllable {idx} audio: {str(e)}")
                            logger.warning(f"⚠️ Failed to delete syllable audio {idx}: {str(e)}")
        
        except Exception as e:
            logger.warning(f"⚠️ Error during storage cleanup: {str(e)}")
            # Continue with database deletion even if storage cleanup fails
        
        # 🗑️ Delete the word from database
        logger.info(f"Deleting word '{word_name}' from database...")
        delete_response = supabase.table('syllable_words').delete().eq('id', word_id).execute()
        
        # ✅ FIX: Proper success check for Supabase delete
        # Supabase delete returns the deleted rows OR an empty array on success
        # We need to check if there was NO ERROR, not if data exists
        # If we got here without an exception, the delete was successful
        
        logger.info(f"✅ Successfully deleted word '{word_name}' (ID: {word_id})")
        
        # Log storage cleanup results
        if deleted_files:
            logger.info(f"Storage files deleted: {', '.join(deleted_files)}")
        if failed_deletions:
            logger.warning(f"Storage deletions failed: {', '.join(failed_deletions)}")
        
        # Return success with optional warnings about storage cleanup
        response_data = {
            'message': f'Word "{word_name}" deleted successfully'
        }
        
        if failed_deletions:
            response_data['warnings'] = {
                'message': 'Word deleted but some storage files could not be removed',
                'failed_deletions': failed_deletions
            }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"❌ Error deleting word with ID {word_id}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        
        # Provide more detailed error information
        error_message = str(e)
        if 'UUID' in error_message or 'uuid' in error_message.lower():
            return Response(
                {'error': f'Invalid word ID format: {word_id}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response(
            {'error': f'Failed to delete word: {error_message}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
@csrf_exempt
@api_view(['PUT'])
@permission_classes([AllowAny])
def update_custom_word(request, word_id):
    """
    Update an existing custom word in the database.
    Now supports audio file uploads with proper merging.
    """
    try:
        data = request.data
        word = data.get('word', '').strip()
        syllable_breakdown = data.get('syllable_breakdown', '').strip()
        category = data.get('category', '').strip()
        difficulty_level = data.get('difficulty_level', '').strip()  # ✅ NEW: Get from requestddd

        if not word or not syllable_breakdown or not category:
            return Response(
                {'error': 'Word, syllable_breakdown, and category are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ NEW: Validate difficulty_level if provided (optional for backwards compatibility)
        if difficulty_level and difficulty_level not in ['easy', 'medium', 'hard']:
            return Response(
                {'error': 'Valid difficulty_level must be easy, medium, or hard'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Recalculate syllable count
        syllable_count = len(syllable_breakdown.split('-'))
        
        # ✅ REMOVED: Automatic difficulty calculation
        # difficulty_level is now taken from the request instead of being calculated

        # 🆕 NEW: Regenerate phonetic guide when syllable breakdown changes
        phonetic_guide = ai_generator.generate_phonetic_guide(word, syllable_breakdown)

        # Prepare the data for updating
        update_data = {
            'word': word,
            'syllable_breakdown': syllable_breakdown,
            'syllable_count': syllable_count,
            'category': category,
            'phonetic_guide': phonetic_guide,  # 🆕 NEW: Add phonetic guide
            'updated_at': 'now()'  # PostgreSQL function for current timestamp
        }
        
        # ✅ NEW: Only update difficulty_level if provided
        if difficulty_level:
            update_data['difficulty_level'] = difficulty_level

        # Handle new full word audio upload if provided
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
                logger.info(f"Uploaded new full word audio for word ID {word_id}")
            except Exception as e:
                logger.error(f"Error uploading full word audio: {str(e)}")

        # 🔹 IMPROVED SYLLABLE AUDIO MERGING LOGIC
        syllables = syllable_breakdown.split('-')

        # STEP 1: Get existing syllable audio URLs from database
        try:
            existing_word_response = supabase.table('syllable_words').select('syllable_audio_urls').eq('id', word_id).execute()
            if existing_word_response.data and len(existing_word_response.data) > 0:
                existing_syllable_urls = existing_word_response.data[0].get('syllable_audio_urls', [])
                # Ensure it's a list
                if not isinstance(existing_syllable_urls, list):
                    existing_syllable_urls = []
            else:
                existing_syllable_urls = []
        except Exception as e:
            logger.error(f"Error fetching existing syllable URLs: {str(e)}")
            existing_syllable_urls = []

        # STEP 2: Create a copy to preserve old URLs
        merged_syllable_urls = existing_syllable_urls.copy()

        # STEP 3: Ensure the array has enough slots for all syllables
        while len(merged_syllable_urls) < len(syllables):
            merged_syllable_urls.append(None)

        # STEP 4: Only replace syllables that were re-recorded
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
                    # Replace only this syllable's audio
                    merged_syllable_urls[idx] = syllable_url
                    logger.info(f"Uploaded new syllable audio {idx} for word ID {word_id}")
                except Exception as e:
                    logger.error(f"Error uploading syllable audio {idx}: {str(e)}")

        # Update the syllable_audio_urls in update_data
        update_data['syllable_audio_urls'] = merged_syllable_urls

        # Execute the update in Supabase
        response = supabase.table('syllable_words').update(update_data).eq('id', word_id).execute()

        if response.data and len(response.data) > 0:
            updated_word = response.data[0]
            logger.info(f"Successfully updated word: {word} (ID: {word_id})")
            return Response(updated_word, status=status.HTTP_200_OK)
        else:
            logger.warning(f"No word found with ID: {word_id}")
            return Response({'error': 'Word not found'}, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        logger.error(f"Error updating word {word_id}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])  # ← CHANGED: Now requires authentication
def rate_word(request, word_id):
    """
    Submit a rating for a word (1-5 stars).
    One rating per user - updates if already rated.
    """
    try:
        data = request.data
        new_rating = data.get('rating')
        
        # Get authenticated user ID
        user_id = str(request.user.id)
        
        # Validate rating value
        if not new_rating or not isinstance(new_rating, (int, float)):
            return Response(
                {'error': 'Rating must be a number between 1 and 5'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        new_rating = float(new_rating)
        if new_rating < 1 or new_rating > 5:
            return Response(
                {'error': 'Rating must be between 1 and 5'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get current word data
        response = supabase.table('syllable_words').select('rating, ai_validation_result').eq('id', word_id).execute()
        
        if not response.data or len(response.data) == 0:
            return Response({'error': 'Word not found'}, status=status.HTTP_404_NOT_FOUND)
        
        word_data = response.data[0]
        validation_result = word_data.get('ai_validation_result') or {}
        
        # Get or initialize ratings data structure
        ratings_data = validation_result.get('ratings_data', {})
        user_ratings = ratings_data.get('user_ratings', {})
        
        # Check if user already rated this word
        had_previous_rating = user_id in user_ratings
        previous_rating = user_ratings.get(user_id)
        
        # Update or add user's rating
        user_ratings[user_id] = new_rating
        
        # Calculate new average from all user ratings
        all_ratings = list(user_ratings.values())
        average_rating = sum(all_ratings) / len(all_ratings)
        
        # Update ratings data structure
        ratings_data['user_ratings'] = user_ratings
        ratings_data['rating_count'] = len(user_ratings)
        ratings_data['average'] = round(average_rating, 2)
        
        # Store back in validation_result
        validation_result['ratings_data'] = ratings_data
        
        # Update the word
        update_response = supabase.table('syllable_words').update({
            'rating': average_rating,
            'ai_validation_result': validation_result,
            'updated_at': 'now()'
        }).eq('id', word_id).execute()
        
        if update_response.data:
            action = "updated" if had_previous_rating else "submitted"
            logger.info(f"Rating {action} for word ID {word_id} by user {user_id}: {new_rating} (new average: {average_rating})")
            
            return Response({
                'success': True,
                'message': f'Rating {action} successfully',
                'new_average': round(average_rating, 2),
                'rating_count': len(user_ratings),
                'your_rating': new_rating,
                'previous_rating': previous_rating if had_previous_rating else None,
                'is_update': had_previous_rating
            }, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Failed to update rating'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except Exception as e:
        logger.error(f"Error rating word with ID {word_id}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_rating(request, word_id):
    """
    Check if the authenticated user has already rated this word.
    Returns their rating if they have, or indicates they haven't rated.
    """
    try:
        # Get authenticated user ID
        user_id = str(request.user.id)
        
        # Get word data with ratings
        response = supabase.table('syllable_words').select('ai_validation_result').eq('id', word_id).execute()
        
        if not response.data or len(response.data) == 0:
            return Response({'error': 'Word not found'}, status=status.HTTP_404_NOT_FOUND)
        
        word_data = response.data[0]
        validation_result = word_data.get('ai_validation_result') or {}
        ratings_data = validation_result.get('ratings_data', {})
        user_ratings = ratings_data.get('user_ratings', {})
        
        # Check if this user has rated
        if user_id in user_ratings:
            user_rating = user_ratings[user_id]
            logger.info(f"User {user_id} has rated word {word_id}: {user_rating}")
            return Response({
                'has_rated': True,
                'user_rating': user_rating
            })
        else:
            logger.info(f"User {user_id} has not rated word {word_id}")
            return Response({
                'has_rated': False,
                'user_rating': None
            })
        
    except Exception as e:
        logger.error(f"Error checking user rating for word {word_id}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def generate_phonetic_guide_endpoint(request):
    """
    Generate phonetic guide on-demand for words that don't have one
    """
    try:
        data = request.data
        word = data.get('word', '')
        syllable_breakdown = data.get('syllable_breakdown', '')
        
        if not word or not syllable_breakdown:
            return Response(
                {'error': 'Word and syllable_breakdown are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate phonetic guide
        phonetic_guide = ai_generator.generate_phonetic_guide(word, syllable_breakdown)
        
        return Response({
            'phonetic_guide': phonetic_guide
        })
    
    except Exception as e:
        logger.error(f"Error generating phonetic guide: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
