#backend/wildlitz/phonemics/views.py
from django.http import JsonResponse 
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime
from rest_framework.authentication import TokenAuthentication
import json
import random
import time
from supabase import create_client
from django.conf import settings
import logging

# Import progress tracking
from api.models import UserProgress, UserActivity

logger = logging.getLogger(__name__)

# Create Supabase client using settings
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

# Image utility functions for the new Supabase storage structure
SUPABASE_STORAGE_BASE_URL = "https://eixryunajxcthprajaxk.supabase.co/storage/v1/object/public/IMG/SoundSafariAnimals/"

def generate_animal_image_url(animal_name):
    """
    Generate the correct Supabase storage URL for an animal image
    
    Args:
        animal_name (str): Name of the animal (will be converted to lowercase)
    
    Returns:
        str: Complete URL to the animal image
    """
    if not animal_name:
        return None
    
    # Convert animal name to lowercase and remove spaces
    clean_name = animal_name.lower().replace(' ', '').replace('-', '')
    
    # Generate the complete URL
    image_url = f"{SUPABASE_STORAGE_BASE_URL}{clean_name}.jpg"
    
    return image_url

def get_fallback_image_url():
    """
    Get a fallback image URL for when animal images are not available
    
    Returns:
        str: URL to a generic animal placeholder image
    """
    return f"{SUPABASE_STORAGE_BASE_URL}placeholder.jpg"

def update_animal_image_url(animal_data):
    """
    Update animal data with the correct image URL
    
    Args:
        animal_data (dict): Animal data dictionary
    
    Returns:
        dict: Updated animal data with correct image URL
    """
    if isinstance(animal_data, dict) and 'name' in animal_data:
        animal_data['image_url'] = generate_animal_image_url(animal_data['name'])
        # Also set 'image' field for frontend compatibility
        animal_data['image'] = animal_data['image_url']
    
    return animal_data

def batch_update_animal_images(animals_list):
    """
    Update a list of animals with correct image URLs
    
    Args:
        animals_list (list): List of animal data dictionaries
    
    Returns:
        list: Updated list with correct image URLs
    """
    return [update_animal_image_url(animal) for animal in animals_list]

def log_phonemics_activity(user, activity_type, question_data, user_answer, correct_answer, is_correct, time_spent, difficulty='medium'):
    """Helper function to log phonemics activities"""
    try:
        if user.is_authenticated:
            UserActivity.objects.create(
                user=user,
                module='phonemics',
                activity_type=activity_type,
                question_data=question_data,
                user_answer=user_answer,
                correct_answer=correct_answer,
                is_correct=is_correct,
                time_spent=time_spent,
                difficulty=difficulty,
                challenge_level='sound_identification',
                learning_focus='phoneme_awareness'
            )
            
            # Update progress summary
            progress, created = UserProgress.objects.get_or_create(
                user=user,
                module='phonemics',
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
        logger.error(f"Error logging phonemics activity: {str(e)}")

def get_difficulty_requirements(difficulty):
    """
    Get the required number of correct and total animals for each difficulty level.
    Guarantees minimum 3 correct animals in every round.
    """
    requirements = {
        'easy': {
            'min_correct': 3,
            'total_animals': 6,
            'max_incorrect': 3
        },
        'medium': {
            'min_correct': 3,
            'total_animals': 8,
            'max_incorrect': 5
        },
        'hard': {
            'min_correct': 3,
            'total_animals': 12,
            'max_incorrect': 9
        }
    }
    return requirements.get(difficulty, requirements['easy'])

@api_view(['GET'])
@permission_classes([AllowAny])
def get_safari_animals_by_sound(request):
    """
    Get animals for a specific sound and difficulty from Supabase.
    Uses 20-level cascading fallback strategy to GUARANTEE animals are always returned.
    """
    target_sound = request.GET.get('sound', 's')
    difficulty = request.GET.get('difficulty', 'easy')
    environment = request.GET.get('environment', '')
    sound_position = request.GET.get('position', '')
    exclude_ids = request.GET.getlist('exclude[]', [])
    
    # ✅ CORE SOUNDS FILTER
    CORE_SOUNDS = ['g', 'k', 'w', 'd', 'r', 'c', 'h', 's', 'm', 't', 'b', 'p', 'f', 'l', 'z']
    
    if target_sound not in CORE_SOUNDS:
        logger.warning(f"Invalid sound requested: {target_sound}. Using 's' as fallback.")
        target_sound = 's'
    
    try:
        # ============================================================
        # STRATEGY: Try 20 different queries with decreasing specificity
        # until we find animals. This GUARANTEES we always return animals.
        # ============================================================
        
        animals_found = []
        strategy_used = ""
        
        # ----------------------------------------------------------
        # ATTEMPT 1: Exact match (sound + position + environment + difficulty)
        # ----------------------------------------------------------
        if len(animals_found) == 0 and sound_position and sound_position != 'anywhere' and environment:
            query = supabase.table('safari_animals').select('*')
            query = query.eq('target_sound', target_sound)
            query = query.eq('sound_position', sound_position)
            query = query.eq('environment', environment)
            if difficulty != 'hard':
                query = query.eq('difficulty_level', difficulty)
            if exclude_ids:
                query = query.not_.in_('id', exclude_ids)
            
            response = query.execute()
            animals_found = response.data or []
            if len(animals_found) > 0:
                strategy_used = "1_exact_match"
                logger.info(f"✅ Attempt 1 (Exact): Found {len(animals_found)} animals")
        
        # ----------------------------------------------------------
        # ATTEMPT 2: sound + position + environment (any difficulty)
        # ----------------------------------------------------------
        if len(animals_found) == 0 and sound_position and sound_position != 'anywhere' and environment:
            query = supabase.table('safari_animals').select('*')
            query = query.eq('target_sound', target_sound)
            query = query.eq('sound_position', sound_position)
            query = query.eq('environment', environment)
            if exclude_ids:
                query = query.not_.in_('id', exclude_ids)
            
            response = query.execute()
            animals_found = response.data or []
            if len(animals_found) > 0:
                strategy_used = "2_no_difficulty_filter"
                logger.info(f"✅ Attempt 2 (No difficulty): Found {len(animals_found)} animals")
        
        # ----------------------------------------------------------
        # ATTEMPT 3: sound + environment + difficulty (any position)
        # ----------------------------------------------------------
        if len(animals_found) == 0 and environment:
            query = supabase.table('safari_animals').select('*')
            query = query.eq('target_sound', target_sound)
            query = query.eq('environment', environment)
            if difficulty != 'hard':
                query = query.eq('difficulty_level', difficulty)
            if exclude_ids:
                query = query.not_.in_('id', exclude_ids)
            
            response = query.execute()
            animals_found = response.data or []
            if len(animals_found) > 0:
                strategy_used = "3_no_position_filter"
                logger.info(f"✅ Attempt 3 (No position): Found {len(animals_found)} animals")
        
        # ----------------------------------------------------------
        # ATTEMPT 4: sound + position + difficulty (any environment)
        # ----------------------------------------------------------
        if len(animals_found) == 0 and sound_position and sound_position != 'anywhere':
            query = supabase.table('safari_animals').select('*')
            query = query.eq('target_sound', target_sound)
            query = query.eq('sound_position', sound_position)
            if difficulty != 'hard':
                query = query.eq('difficulty_level', difficulty)
            if exclude_ids:
                query = query.not_.in_('id', exclude_ids)
            
            response = query.execute()
            animals_found = response.data or []
            if len(animals_found) > 0:
                strategy_used = "4_no_environment_filter"
                logger.info(f"✅ Attempt 4 (No environment): Found {len(animals_found)} animals")
        
        # ----------------------------------------------------------
        # ATTEMPT 5: sound + environment (any position, any difficulty)
        # ----------------------------------------------------------
        if len(animals_found) == 0 and environment:
            query = supabase.table('safari_animals').select('*')
            query = query.eq('target_sound', target_sound)
            query = query.eq('environment', environment)
            if exclude_ids:
                query = query.not_.in_('id', exclude_ids)
            
            response = query.execute()
            animals_found = response.data or []
            if len(animals_found) > 0:
                strategy_used = "5_sound_environment_only"
                logger.info(f"✅ Attempt 5 (Sound + environment): Found {len(animals_found)} animals")
        
        # ----------------------------------------------------------
        # ATTEMPT 6: sound + position (any environment, any difficulty)
        # ----------------------------------------------------------
        if len(animals_found) == 0 and sound_position and sound_position != 'anywhere':
            query = supabase.table('safari_animals').select('*')
            query = query.eq('target_sound', target_sound)
            query = query.eq('sound_position', sound_position)
            if exclude_ids:
                query = query.not_.in_('id', exclude_ids)
            
            response = query.execute()
            animals_found = response.data or []
            if len(animals_found) > 0:
                strategy_used = "6_sound_position_only"
                logger.info(f"✅ Attempt 6 (Sound + position): Found {len(animals_found)} animals")
        
        # ----------------------------------------------------------
        # ATTEMPT 7: sound + difficulty (any position, any environment)
        # ----------------------------------------------------------
        if len(animals_found) == 0:
            query = supabase.table('safari_animals').select('*')
            query = query.eq('target_sound', target_sound)
            if difficulty != 'hard':
                query = query.eq('difficulty_level', difficulty)
            if exclude_ids:
                query = query.not_.in_('id', exclude_ids)
            
            response = query.execute()
            animals_found = response.data or []
            if len(animals_found) > 0:
                strategy_used = "7_sound_difficulty_only"
                logger.info(f"✅ Attempt 7 (Sound + difficulty): Found {len(animals_found)} animals")
        
        # ----------------------------------------------------------
        # ATTEMPT 8: sound + jungle environment (any position, any difficulty)
        # ----------------------------------------------------------
        if len(animals_found) == 0:
            query = supabase.table('safari_animals').select('*')
            query = query.eq('target_sound', target_sound)
            query = query.eq('environment', 'jungle')
            if exclude_ids:
                query = query.not_.in_('id', exclude_ids)
            
            response = query.execute()
            animals_found = response.data or []
            if len(animals_found) > 0:
                strategy_used = "8_sound_jungle_only"
                logger.info(f"✅ Attempt 8 (Sound + jungle): Found {len(animals_found)} animals")
        
        # ----------------------------------------------------------
        # ATTEMPT 9: sound + savanna environment (any position, any difficulty)
        # ----------------------------------------------------------
        if len(animals_found) == 0:
            query = supabase.table('safari_animals').select('*')
            query = query.eq('target_sound', target_sound)
            query = query.eq('environment', 'savanna')
            if exclude_ids:
                query = query.not_.in_('id', exclude_ids)
            
            response = query.execute()
            animals_found = response.data or []
            if len(animals_found) > 0:
                strategy_used = "9_sound_savanna_only"
                logger.info(f"✅ Attempt 9 (Sound + savanna): Found {len(animals_found)} animals")
        
        # ----------------------------------------------------------
        # ATTEMPT 10: sound + ocean environment (any position, any difficulty)
        # ----------------------------------------------------------
        if len(animals_found) == 0:
            query = supabase.table('safari_animals').select('*')
            query = query.eq('target_sound', target_sound)
            query = query.eq('environment', 'ocean')
            if exclude_ids:
                query = query.not_.in_('id', exclude_ids)
            
            response = query.execute()
            animals_found = response.data or []
            if len(animals_found) > 0:
                strategy_used = "10_sound_ocean_only"
                logger.info(f"✅ Attempt 10 (Sound + ocean): Found {len(animals_found)} animals")
        
        # ----------------------------------------------------------
        # ATTEMPT 11: sound + arctic environment (any position, any difficulty)
        # ----------------------------------------------------------
        if len(animals_found) == 0:
            query = supabase.table('safari_animals').select('*')
            query = query.eq('target_sound', target_sound)
            query = query.eq('environment', 'arctic')
            if exclude_ids:
                query = query.not_.in_('id', exclude_ids)
            
            response = query.execute()
            animals_found = response.data or []
            if len(animals_found) > 0:
                strategy_used = "11_sound_arctic_only"
                logger.info(f"✅ Attempt 11 (Sound + arctic): Found {len(animals_found)} animals")
        
        # ----------------------------------------------------------
        # ATTEMPT 12: sound + beginning position (any environment, any difficulty)
        # ----------------------------------------------------------
        if len(animals_found) == 0:
            query = supabase.table('safari_animals').select('*')
            query = query.eq('target_sound', target_sound)
            query = query.eq('sound_position', 'beginning')
            if exclude_ids:
                query = query.not_.in_('id', exclude_ids)
            
            response = query.execute()
            animals_found = response.data or []
            if len(animals_found) > 0:
                strategy_used = "12_sound_beginning_only"
                logger.info(f"✅ Attempt 12 (Sound + beginning): Found {len(animals_found)} animals")
        
        # ----------------------------------------------------------
        # ATTEMPT 13: sound + middle position (any environment, any difficulty)
        # ----------------------------------------------------------
        if len(animals_found) == 0:
            query = supabase.table('safari_animals').select('*')
            query = query.eq('target_sound', target_sound)
            query = query.eq('sound_position', 'middle')
            if exclude_ids:
                query = query.not_.in_('id', exclude_ids)
            
            response = query.execute()
            animals_found = response.data or []
            if len(animals_found) > 0:
                strategy_used = "13_sound_middle_only"
                logger.info(f"✅ Attempt 13 (Sound + middle): Found {len(animals_found)} animals")
        
        # ----------------------------------------------------------
        # ATTEMPT 14: sound + ending position (any environment, any difficulty)
        # ----------------------------------------------------------
        if len(animals_found) == 0:
            query = supabase.table('safari_animals').select('*')
            query = query.eq('target_sound', target_sound)
            query = query.eq('sound_position', 'ending')
            if exclude_ids:
                query = query.not_.in_('id', exclude_ids)
            
            response = query.execute()
            animals_found = response.data or []
            if len(animals_found) > 0:
                strategy_used = "14_sound_ending_only"
                logger.info(f"✅ Attempt 14 (Sound + ending): Found {len(animals_found)} animals")
        
        # ----------------------------------------------------------
        # ATTEMPT 15: sound + easy difficulty (any position, any environment)
        # ----------------------------------------------------------
        if len(animals_found) == 0:
            query = supabase.table('safari_animals').select('*')
            query = query.eq('target_sound', target_sound)
            query = query.eq('difficulty_level', 'easy')
            if exclude_ids:
                query = query.not_.in_('id', exclude_ids)
            
            response = query.execute()
            animals_found = response.data or []
            if len(animals_found) > 0:
                strategy_used = "15_sound_easy_only"
                logger.info(f"✅ Attempt 15 (Sound + easy): Found {len(animals_found)} animals")
        
        # ----------------------------------------------------------
        # ATTEMPT 16: sound + medium difficulty (any position, any environment)
        # ----------------------------------------------------------
        if len(animals_found) == 0:
            query = supabase.table('safari_animals').select('*')
            query = query.eq('target_sound', target_sound)
            query = query.eq('difficulty_level', 'medium')
            if exclude_ids:
                query = query.not_.in_('id', exclude_ids)
            
            response = query.execute()
            animals_found = response.data or []
            if len(animals_found) > 0:
                strategy_used = "16_sound_medium_only"
                logger.info(f"✅ Attempt 16 (Sound + medium): Found {len(animals_found)} animals")
        
        # ----------------------------------------------------------
        # ATTEMPT 17: sound + hard difficulty (any position, any environment)
        # ----------------------------------------------------------
        if len(animals_found) == 0:
            query = supabase.table('safari_animals').select('*')
            query = query.eq('target_sound', target_sound)
            query = query.eq('difficulty_level', 'hard')
            if exclude_ids:
                query = query.not_.in_('id', exclude_ids)
            
            response = query.execute()
            animals_found = response.data or []
            if len(animals_found) > 0:
                strategy_used = "17_sound_hard_only"
                logger.info(f"✅ Attempt 17 (Sound + hard): Found {len(animals_found)} animals")
        
        # ----------------------------------------------------------
        # ATTEMPT 18: sound only with exclude_ids applied
        # ----------------------------------------------------------
        if len(animals_found) == 0:
            query = supabase.table('safari_animals').select('*')
            query = query.eq('target_sound', target_sound)
            if exclude_ids:
                query = query.not_.in_('id', exclude_ids)
            
            response = query.execute()
            animals_found = response.data or []
            if len(animals_found) > 0:
                strategy_used = "18_sound_only_with_exclusions"
                logger.info(f"✅ Attempt 18 (Sound only + exclusions): Found {len(animals_found)} animals")
        
        # ----------------------------------------------------------
        # ATTEMPT 19: sound only (ignore exclude_ids)
        # ----------------------------------------------------------
        if len(animals_found) == 0:
            query = supabase.table('safari_animals').select('*')
            query = query.eq('target_sound', target_sound)
            
            response = query.execute()
            animals_found = response.data or []
            if len(animals_found) > 0:
                strategy_used = "19_sound_only_no_exclusions"
                logger.warning(f"⚠️ Attempt 19 (Sound only, no exclusions): Found {len(animals_found)} animals")
        
        # ----------------------------------------------------------
        # ATTEMPT 20: ABSOLUTE FINAL FALLBACK - Get ANY animals (even different sound)
        # ----------------------------------------------------------
        if len(animals_found) == 0:
            query = supabase.table('safari_animals').select('*')
            if environment:
                query = query.eq('environment', environment)
            query = query.limit(10)
            
            response = query.execute()
            animals_found = response.data or []
            if len(animals_found) > 0:
                strategy_used = "20_any_animals_absolute_fallback"
                logger.error(f"🚨 Attempt 20 (ABSOLUTE FALLBACK - ANY ANIMALS): Found {len(animals_found)} animals")
        
        # ============================================================
        # ✅ NEW: GUARANTEE MINIMUM 3 CORRECT ANIMALS
        # ============================================================
        requirements = get_difficulty_requirements(difficulty)
        min_correct = requirements['min_correct']
        total_animals = requirements['total_animals']
        max_incorrect = requirements['max_incorrect']
        
        logger.info(f"📊 Requirements for {difficulty}: min_correct={min_correct}, total={total_animals}")
        logger.info(f"🔍 Found {len(animals_found)} correct animals initially")
        
        # Check if we have minimum correct animals
        if len(animals_found) < min_correct:
            logger.warning(f"⚠️ Only found {len(animals_found)} correct animals, need {min_correct}")
            
            # Try to get more correct animals by relaxing filters progressively
            additional_query = supabase.table('safari_animals').select('*')
            additional_query = additional_query.eq('target_sound', target_sound)
            
            # If position was specified and we don't have enough, try ANY position
            if sound_position and sound_position != 'anywhere':
                logger.info(f"🔄 Relaxing position filter to get more animals")
                # Don't filter by position
            
            # Exclude animals we already have
            if animals_found and len(animals_found) > 0:
                already_found_ids = [animal['id'] for animal in animals_found]
                additional_query = additional_query.not_.in_('id', already_found_ids)
            
            if exclude_ids:
                additional_query = additional_query.not_.in_('id', exclude_ids)
            
            additional_response = additional_query.execute()
            additional_animals = additional_response.data or []
            
            logger.info(f"🔄 Found {len(additional_animals)} additional animals")
            
            # Add animals until we reach minimum
            needed = min_correct - len(animals_found)
            if len(additional_animals) >= needed:
                animals_found.extend(additional_animals[:needed])
                logger.info(f"✅ Added {needed} animals, now have {len(animals_found)} correct")
            else:
                # Add all we found
                animals_found.extend(additional_animals)
                logger.warning(f"⚠️ Could only add {len(additional_animals)} more, total: {len(animals_found)}")
        
        # Final check - if STILL not enough correct animals after relaxing filters
        if len(animals_found) < min_correct:
            logger.error(f"🚨 CRITICAL: Only {len(animals_found)} correct animals found after all attempts!")
            logger.error(f"🚨 Database needs more animals for sound='{target_sound}' position='{sound_position}'")
            
            # Return error with detailed information
            return Response({
                'success': False,
                'animals': [],
                'error': f'Insufficient animals in database. Found {len(animals_found)} but need minimum {min_correct} for {difficulty} difficulty.',
                'details': {
                    'target_sound': target_sound,
                    'sound_position': sound_position,
                    'environment': environment,
                    'difficulty': difficulty,
                    'found': len(animals_found),
                    'required': min_correct
                },
                'fallback_used': strategy_used
            }, status=status.HTTP_404_NOT_FOUND)
        
        logger.info(f"✅ Have {len(animals_found)} correct animals (minimum {min_correct} satisfied)")
        
        # ============================================================
        # ✅ UPDATED: Get incorrect animals (different sound)
        # Calculate how many incorrect animals we need based on difficulty
        # ============================================================
        num_correct = len(animals_found)
        num_incorrect_needed = total_animals - num_correct
        
        logger.info(f"📊 Composition: {num_correct} correct + {num_incorrect_needed} incorrect = {total_animals} total")
        
        incorrect_query = supabase.table('safari_animals').select('*')
        incorrect_query = incorrect_query.neq('target_sound', target_sound)
        
        # Apply same filters based on which strategy worked for correct animals
        if strategy_used.startswith('1_') or strategy_used.startswith('2_'):
            # Attempts 1-2 had environment
            if environment:
                incorrect_query = incorrect_query.eq('environment', environment)
        elif strategy_used.startswith('3_') or strategy_used.startswith('7_'):
            # Attempts 3, 7 had difficulty
            if difficulty != 'hard':
                incorrect_query = incorrect_query.eq('difficulty_level', difficulty)
        elif strategy_used.startswith('8_'):
            incorrect_query = incorrect_query.eq('environment', 'jungle')
        elif strategy_used.startswith('9_'):
            incorrect_query = incorrect_query.eq('environment', 'savanna')
        elif strategy_used.startswith('10_'):
            incorrect_query = incorrect_query.eq('environment', 'ocean')
        elif strategy_used.startswith('11_'):
            incorrect_query = incorrect_query.eq('environment', 'arctic')
        
        # Exclude the correct animals we already have
        if animals_found:
            correct_animal_ids = [animal['id'] for animal in animals_found]
            incorrect_query = incorrect_query.not_.in_('id', correct_animal_ids)
        
        if exclude_ids and not strategy_used.startswith('19_'):
            incorrect_query = incorrect_query.not_.in_('id', exclude_ids)
        
        incorrect_response = incorrect_query.execute()
        incorrect_animals = incorrect_response.data or []
        
        logger.info(f"🔍 Found {len(incorrect_animals)} incorrect animals")
        
        # ✅ Select the exact number of incorrect animals needed
        if len(incorrect_animals) > num_incorrect_needed:
            import random
            incorrect_animals = random.sample(incorrect_animals, num_incorrect_needed)
            logger.info(f"✂️ Trimmed to {num_incorrect_needed} incorrect animals")
        elif len(incorrect_animals) < num_incorrect_needed:
            logger.warning(f"⚠️ Only have {len(incorrect_animals)} incorrect animals, need {num_incorrect_needed}")
            # This is OK - we'll just have fewer total animals than ideal
        
        # ============================================================
        # ✅ FINAL: Combine and return animals with guarantee verification
        # ============================================================
        all_animals = animals_found + incorrect_animals
        
        # Shuffle to mix correct and incorrect
        import random
        random.shuffle(all_animals)
        
        # Final verification log
        logger.info(f"✅ GUARANTEED: Returning {len(animals_found)} correct (minimum {min_correct}) + {len(incorrect_animals)} incorrect = {len(all_animals)} total animals")
        logger.info(f"📊 Strategy used: {strategy_used}")
        logger.info(f"🎯 Minimum requirement satisfied: {len(animals_found) >= min_correct}")
        
        return Response({
            'success': True,
            'animals': all_animals,
            'correct_count': len(animals_found),
            'incorrect_count': len(incorrect_animals),
            'total_count': len(all_animals),
            'min_correct_guaranteed': min_correct,
            'requirement_met': len(animals_found) >= min_correct,
            'fallback_used': strategy_used
        })
        
    except Exception as e:
        logger.error(f"Error fetching safari animals: {str(e)}")
        return Response({
            'success': False,
            'error': str(e),
            'animals': []
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_random_sound(request):
    """Get a random sound for the game - only core sounds"""
    # ✅ CORE SOUNDS ONLY
    CORE_SOUNDS = ['g', 'k', 'w', 'd', 'r', 'c', 'h', 's', 'm', 't', 'b', 'p', 'f', 'l', 'z']
    
    try:
        # Get all unique sounds from the database that are core sounds
        response = supabase.table('safari_animals').select('target_sound').execute()
        
        if response.data:
            unique_sounds = list(set([animal['target_sound'] for animal in response.data]))
            # ✅ Filter to only core sounds
            core_sounds_in_db = [s for s in unique_sounds if s in CORE_SOUNDS]
            
            if core_sounds_in_db:
                random_sound = random.choice(core_sounds_in_db)
                return JsonResponse({
                    'sound': random_sound,
                    'available_sounds': core_sounds_in_db
                })
        
        # ✅ Fallback to core sounds only
        return JsonResponse({
            'sound': random.choice(CORE_SOUNDS),
            'available_sounds': CORE_SOUNDS
        })
            
    except Exception as e:
        logger.error(f"Error getting random sound: {str(e)}")
        # ✅ Fallback to core sounds
        return JsonResponse({
            'sound': random.choice(CORE_SOUNDS),
            'available_sounds': CORE_SOUNDS
        })
            
    except Exception as e:
        logger.error(f"Error getting random sound: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_sound_examples(request):
    """Get example words for a specific sound"""
    sound = request.GET.get('sound', 's')
    
    try:
        # Get example animals with this sound
        query = supabase.table('safari_animals').select('name')
        query = query.eq('target_sound', sound)
        query = query.limit(6)
        
        response = query.execute()
        
        if response.data:
            examples = [animal['name'].lower() for animal in response.data]
        else:
            # Fallback examples
            examples = {
                's': ['snake', 'seal', 'spider', 'squirrel', 'shark', 'swan'],
                'm': ['monkey', 'mouse', 'meerkat', 'moose', 'mole', 'moth'],
                't': ['tiger', 'turtle', 'toucan', 'toad', 'turkey', 'termite'],
                'b': ['bear', 'butterfly', 'bee', 'buffalo', 'baboon', 'badger'],
                'p': ['penguin', 'pig', 'polar bear', 'panda', 'parrot', 'porcupine'],
                'f': ['fox', 'frog', 'fish', 'flamingo', 'ferret', 'falcon'],
                'l': ['lion', 'leopard', 'llama', 'lobster', 'lizard', 'lynx'],
                'z': ['zebra', 'zorilla', 'zander', 'zebu', 'zonkey', 'zorse'],
                'g': ['giraffe', 'gorilla', 'goat', 'gecko', 'goose', 'gazelle'],
                'w': ['whale', 'wolf', 'walrus', 'wombat', 'woodpecker', 'weasel'],
                'd': ['dolphin', 'dog', 'deer', 'duck', 'donkey', 'dragonfly'],
                'c': ['cat', 'cow', 'camel', 'chameleon', 'cheetah', 'cobra'],
                'r': ['rabbit', 'rhino', 'raccoon', 'robin', 'rat', 'rooster'],
                'h': ['horse', 'hippo', 'hamster', 'hawk', 'hedgehog', 'heron']
            }
            examples = examples.get(sound, ['animal', 'creature', 'beast'])
        
        return JsonResponse({
            'sound': sound,
            'examples': examples
        })
        
    except Exception as e:
        logger.error(f"Error getting sound examples: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def submit_game_results(request):
    """Submit game results and get feedback with progress tracking"""
    start_time = time.time()
    
    try:
        data = request.data
        selected_animals = data.get('selected_animals', [])
        correct_animals = data.get('correct_animals', [])
        target_sound = data.get('target_sound', '')
        difficulty = data.get('difficulty', 'medium')
        time_spent = data.get('time_spent', time.time() - start_time)
        
        # Calculate score
        correct_selected = [a for a in selected_animals if any(c['id'] == a['id'] for c in correct_animals)]
        incorrect_selected = [a for a in selected_animals if not any(c['id'] == a['id'] for c in correct_animals)]
        missed_animals = [a for a in correct_animals if not any(s['id'] == a['id'] for s in selected_animals)]
        
        score = (len(correct_selected) / len(correct_animals)) * 100 if correct_animals else 0
        is_correct = score >= 70  # Consider 70% or higher as correct
        
        # Generate feedback message
        if score >= 90:
            feedback = f"Excellent! You found {len(correct_selected)} out of {len(correct_animals)} animals with the '{target_sound}' sound!"
        elif score >= 70:
            feedback = f"Great job! You found {len(correct_selected)} out of {len(correct_animals)} animals with the '{target_sound}' sound."
        elif score >= 50:
            feedback = f"Good effort! You found {len(correct_selected)} out of {len(correct_animals)} animals. Keep practicing!"
        else:
            feedback = f"You found {len(correct_selected)} out of {len(correct_animals)} animals. Let's try again!"
        
        # Log activity for authenticated users
        if request.user.is_authenticated:
            log_phonemics_activity(
                user=request.user,
                activity_type='sound_safari_game',
                question_data={
                    'target_sound': target_sound,
                    'correct_animals': [{'id': a['id'], 'name': a['name']} for a in correct_animals],
                    'total_animals': len(selected_animals) + len(correct_animals) + len(missed_animals)
                },
                user_answer={'selected_animals': [{'id': a['id'], 'name': a['name']} for a in selected_animals]},
                correct_answer={'correct_animals': [{'id': a['id'], 'name': a['name']} for a in correct_animals]},
                is_correct=is_correct,
                time_spent=time_spent,
                difficulty=difficulty
            )
        
        response_data = {
            'score': round(score),
            'feedback': feedback,
            'correct_selected': correct_selected,
            'incorrect_selected': incorrect_selected,
            'missed_animals': missed_animals,
            'total_correct': len(correct_animals)
        }
        
        # Add progress info for authenticated users
        if request.user.is_authenticated:
            try:
                progress = UserProgress.objects.get(
                    user=request.user,
                    module='phonemics',
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
        logger.error(f"Error submitting game results: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def update_animal_images(request):
    """
    Utility endpoint to batch update animal image URLs
    This can be called to migrate existing animals to new image URL format
    """
    try:
        # Get all animals from the database
        response = supabase.table('safari_animals').select('*').execute()
        
        if not response.data:
            return Response({
                'success': False,
                'message': 'No animals found in database'
            }, status=status.HTTP_404_NOT_FOUND)
        
        animals = response.data
        updated_count = 0
        failed_updates = []
        
        for animal in animals:
            try:
                # Generate new image URL
                new_image_url = generate_animal_image_url(animal['name'])
                
                # Update the animal record
                update_response = supabase.table('safari_animals').update({
                    'image_url': new_image_url
                }).eq('id', animal['id']).execute()
                
                if update_response.data:
                    updated_count += 1
                    logger.info(f"Updated {animal['name']} with new image URL: {new_image_url}")
                else:
                    failed_updates.append(animal['name'])
                    
            except Exception as e:
                failed_updates.append(f"{animal['name']} (Error: {str(e)})")
                logger.error(f"Failed to update {animal['name']}: {str(e)}")
        
        return Response({
            'success': True,
            'message': f'Updated {updated_count} animal image URLs',
            'updated_count': updated_count,
            'total_animals': len(animals),
            'failed_updates': failed_updates
        })
        
    except Exception as e:
        logger.error(f"Error updating animal images: {str(e)}")
        return Response({
            'success': False,
            'error': str(e),
            'message': 'Failed to update animal images'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
# ==========================================
# SOUND SAFARI ANALYTICS ENDPOINTS
# ==========================================

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def save_safari_game_session(request):
    """
    Save a Sound Safari game session to Supabase
    Works for both authenticated and anonymous users
    """
    try:
        data = request.data
        user = request.user
        
        # Check authentication status
        is_authenticated = user.is_authenticated
        
        logger.info(f"Saving Sound Safari session")
        logger.info(f"User authenticated: {is_authenticated}")
        if is_authenticated:
            logger.info(f"User: {user.email} (ID: {user.id})")
        
        # Validate required fields
        required_fields = ['target_sound', 'difficulty']
        for field in required_fields:
            if not data.get(field):
                logger.error(f"Missing required field: {field}")
                return Response({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Use timezone-aware datetime
        current_time = datetime.now().isoformat()
        
        # Prepare session data for Supabase (WITHOUT user_id to avoid UUID error)
        session_data = {
            'user_email': user.email if is_authenticated else None,
            'timestamp': data.get('timestamp', current_time),
            'target_sound': str(data.get('target_sound')),
            'sound_position': str(data.get('sound_position', 'beginning')),
            'environment': str(data.get('environment', 'jungle')),
            'difficulty': str(data.get('difficulty')),
            'animals_shown': int(data.get('animals_shown', 0)),
            'correct_selections': int(data.get('correct_selections', 0)),
            'incorrect_selections': int(data.get('incorrect_selections', 0)),
            'success_rate': float(data.get('success_rate', 0.0)),
            'time_spent': int(data.get('time_spent', 0)),
            'completed': bool(data.get('completed', True))
        }
        
        logger.info(f"Prepared session data: {session_data}")
        
        # Insert into Supabase
        try:
            response = supabase.table('sound_safari_game_sessions').insert(session_data).execute()
            
            if response.data and len(response.data) > 0:
                session_id = response.data[0].get('session_id') or response.data[0].get('id')
                logger.info(f"Sound Safari session saved! Session ID: {session_id}")
                
                return Response({
                    'success': True,
                    'message': 'Game session saved successfully',
                    'session_id': str(session_id) if session_id else 'unknown',
                    'user_email': user.email if is_authenticated else None
                }, status=status.HTTP_201_CREATED)
            else:
                logger.error("No data returned from Supabase insert")
                return Response({
                    'success': False,
                    'error': 'No session data returned from database'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as supabase_error:
            logger.error(f"Supabase insert error: {str(supabase_error)}")
            return Response({
                'success': False,
                'error': f'Database error: {str(supabase_error)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    except Exception as e:
        logger.error(f"Error saving Sound Safari session: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_safari_user_analytics(request):
    """
    Get Sound Safari analytics for the current user
    
    Query params:
    - limit: number of sessions to return (default 20)
    """
    try:
        user = request.user
        
        if not user.is_authenticated:
            return Response({
                'success': False,
                'error': 'User must be authenticated'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        limit = int(request.GET.get('limit', 20))
        
        logger.info(f"Fetching Sound Safari analytics for user: {user.email}, limit: {limit}")
        
        # Get recent sessions from Supabase
        sessions_query = supabase.table('sound_safari_game_sessions')\
            .select('*')\
            .eq('user_email', user.email)\
            .order('timestamp', desc=True)\
            .limit(limit)
        
        sessions_response = sessions_query.execute()
        
        # Calculate aggregate stats
        sessions = sessions_response.data if sessions_response.data else []
        
        if sessions:
            total_sessions = len(sessions)
            total_animals = sum(s.get('animals_shown', 0) for s in sessions)
            total_correct = sum(s.get('correct_selections', 0) for s in sessions)
            avg_success = sum(s.get('success_rate', 0) for s in sessions) / total_sessions
            avg_time = sum(s.get('time_spent', 0) for s in sessions) / total_sessions
            
            # Get sound-specific performance
            sound_stats = {}
            for session in sessions:
                sound = session.get('target_sound')
                if sound:
                    if sound not in sound_stats:
                        sound_stats[sound] = {
                            'attempts': 0,
                            'correct': 0,
                            'total_animals': 0
                        }
                    sound_stats[sound]['attempts'] += 1
                    sound_stats[sound]['correct'] += session.get('correct_selections', 0)
                    sound_stats[sound]['total_animals'] += session.get('animals_shown', 0)
            
            # Calculate success rate per sound
            sound_performance = []
            for sound, stats in sound_stats.items():
                success_rate = (stats['correct'] / stats['total_animals'] * 100) if stats['total_animals'] > 0 else 0
                sound_performance.append({
                    'sound': sound,
                    'attempts': stats['attempts'],
                    'success_rate': round(success_rate, 2),
                    'total_correct': stats['correct']
                })
            
            sound_performance.sort(key=lambda x: x['success_rate'], reverse=True)
            
            aggregate_stats = {
                'total_sessions': total_sessions,
                'total_animals': total_animals,
                'total_correct': total_correct,
                'average_success_rate': round(avg_success, 2),
                'average_time_per_game': round(avg_time, 2)
            }
            
            logger.info(f"Analytics fetched successfully for {user.email}")
        else:
            aggregate_stats = {
                'total_sessions': 0,
                'total_animals': 0,
                'total_correct': 0,
                'average_success_rate': 0,
                'average_time_per_game': 0
            }
            sound_performance = []
            logger.info(f"No sessions found for user: {user.email}")
        
        return Response({
            'success': True,
            'sessions': sessions,
            'sound_performance': sound_performance,
            'aggregate_stats': aggregate_stats,
            'total_sessions': len(sessions)
        })
    
    except Exception as e:
        logger.error(f"Error fetching Sound Safari analytics: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)