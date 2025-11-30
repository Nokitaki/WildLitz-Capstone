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
from django.conf import settings
import logging
from utils.supabase_client import supabase


# Import progress tracking
from api.models import UserProgress, UserActivity

logger = logging.getLogger(__name__)

# ============================================================
# EXCLUDED COMBINATIONS (Too few animals - only 2 each)
# ============================================================
EXCLUDED_COMBINATIONS = [
    ('w', 'ending'),      # w-ending: only 2 animals (Cow, Sparrow)
    ('b', 'ending'),      # b-ending: only 2 animals (Lamb, Cub)
    ('f', 'ending'),      # f-ending: only 2 animals (Wolf, Giraffe)
    ('z', 'beginning'),   # z-beginning: only 2 animals (Zebra, Zebu)
    ('z', 'ending'),
    ('c', 'ending'),
]

def is_combination_excluded(sound, position):
    """Check if a sound-position combination should be excluded from game rounds"""
    return (sound, position) in EXCLUDED_COMBINATIONS

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
    UPDATED: Lowered minimum to 2 to handle sparse database
    """
    requirements = {
        'easy': {
            'min_correct': 3,
            'total_animals': 6,
            'max_incorrect': 4
        },
        'medium': {
            'min_correct': 3,
            'total_animals': 8,
            'max_incorrect': 6
        },
        'hard': {
            'min_correct': 3,
            'total_animals': 12,
            'max_incorrect': 10
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

    # ✅ Check if this combination is excluded (too few animals)
    if sound_position and is_combination_excluded(target_sound, sound_position):
        logger.warning(f"⚠️ Excluded combination requested: {target_sound}-{sound_position}")
        return Response({
            'success': False,
            'error': f'Combination {target_sound}-{sound_position} is excluded (insufficient animals)',
            'animals': [],
            'excluded': True
        }, status=status.HTTP_400_BAD_REQUEST)
    
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

        # ============================================================
        # ✅ CRITICAL FIX: Validate position match for non-"anywhere" positions
        # This ensures backend and frontend agree on what's "correct"
        # ============================================================
        if sound_position and sound_position != 'anywhere':
            # Filter animals_found to ONLY include exact position matches
            position_matched_animals = [
                animal for animal in animals_found 
                if animal.get('sound_position') == sound_position
            ]
            
            # Log what we're doing
            original_count = len(animals_found)
            matched_count = len(position_matched_animals)
            
            if matched_count < original_count:
                logger.warning(
                    f"⚠️ POSITION VALIDATION: Filtered {original_count} animals down to {matched_count} "
                    f"that match position '{sound_position}'"
                )
                logger.warning(
                    f"   Excluded {original_count - matched_count} animals with sound '{target_sound}' "
                    f"but different positions"
                )
            
            # Use only position-matched animals
            animals_found = position_matched_animals

        # ============================================================
        # ✅ EMERGENCY: Accept ANY animals we found (even if < minimum)
        # ============================================================
        if len(animals_found) >= 1 and len(animals_found) < min_correct:
            logger.warning(
                f"⚠️ EMERGENCY: Only found {len(animals_found)} animals for sound='{target_sound}' "
                f"position='{sound_position}' (need {min_correct})"
            )
            logger.warning(f"🔄 Lowering minimum to {len(animals_found)} to avoid 404 error")
            min_correct = len(animals_found)
        
        # Final check - if STILL not enough correct animals after relaxing filters
        if len(animals_found) < min_correct:
            # ============================================================
            # ✅ FALLBACK: Switch to "anywhere" position if specific position fails
            # ============================================================
            logger.warning(
                f"⚠️ FALLBACK TRIGGERED: Insufficient animals for sound='{target_sound}' "
                f"position='{sound_position}' (found {len(animals_found)}, need {min_correct})"
            )
            logger.info(f"🔄 Attempting fallback to 'anywhere' position for sound='{target_sound}'")
            
            # Try to get animals with target sound at ANY position
            fallback_query = supabase.table('safari_animals').select('*')
            fallback_query = fallback_query.eq('target_sound', target_sound)
            
            if environment:
                fallback_query = fallback_query.eq('environment', environment)
            
            if difficulty != 'hard':
                fallback_query = fallback_query.eq('difficulty_level', difficulty)
            
            if exclude_ids:
                fallback_query = fallback_query.not_.in_('id', exclude_ids)
            
            fallback_response = fallback_query.execute()
            fallback_animals = fallback_response.data or []
            
            if len(fallback_animals) >= min_correct:
                logger.info(
                    f"✅ FALLBACK SUCCESS: Found {len(fallback_animals)} animals with sound '{target_sound}' "
                    f"at ANY position (switched from '{sound_position}')"
                )
                
                # Use fallback animals as "correct" animals
                animals_found = fallback_animals[:min_correct]
                strategy_used = f"fallback_anywhere_from_{sound_position}"
                
            else:
                # Even fallback failed - return error
                logger.error(
                    f"🚨 FALLBACK FAILED: Only found {len(fallback_animals)} animals with sound '{target_sound}' "
                    f"at ANY position (need {min_correct})"
                )
                logger.error(f"🚨 Database critically lacks animals for sound '{target_sound}'")
                
                return Response({
                    'success': False,
                    'animals': [],
                    'error': f'Insufficient animals in database. Found {len(fallback_animals)} with sound "{target_sound}" at any position, but need minimum {min_correct} for {difficulty} difficulty.',
                    'details': {
                        'target_sound': target_sound,
                        'requested_position': sound_position,
                        'fallback_attempted': 'anywhere',
                        'environment': environment,
                        'difficulty': difficulty,
                        'found_specific': len(animals_found),
                        'found_any': len(fallback_animals),
                        'required': min_correct
                    },
                    'suggestion': 'Add more animals to database or use "anywhere" position'
                }, status=status.HTTP_404_NOT_FOUND)
        
        logger.info(f"✅ Have {len(animals_found)} correct animals (minimum {min_correct} satisfied)")
        
        # ============================================================
        # ✅ UPDATED: Get incorrect animals (different sound)
        # Calculate how many incorrect animals we need based on difficulty
        # ============================================================
        num_correct = len(animals_found)
        num_incorrect_needed = total_animals - num_correct

        logger.info(f"📊 Composition: {num_correct} correct + {num_incorrect_needed} incorrect = {total_animals} total")

        try:
            all_phonemically_valid_query = supabase.table('safari_animals')\
                .select('name')\
                .eq('target_sound', target_sound)
            
            # Only apply position filter if not 'anywhere'
            if sound_position and sound_position != 'anywhere':
                all_phonemically_valid_query = all_phonemically_valid_query.eq('sound_position', sound_position)
            
            all_phonemically_valid_response = all_phonemically_valid_query.execute()
            
            if all_phonemically_valid_response.data:
                phonemically_valid_names = list(set([animal['name'] for animal in all_phonemically_valid_response.data]))
                logger.info(f"🚫 Excluding phonemically valid animal names from incorrect choices: {phonemically_valid_names}")
            else:
                phonemically_valid_names = []
                logger.warning("⚠️ No phonemically valid animals found in database")
                
        except Exception as e:
            logger.error(f"❌ Error fetching phonemically valid names: {str(e)}")
            phonemically_valid_names = []

        incorrect_query = supabase.table('safari_animals').select('*')
        incorrect_query = incorrect_query.neq('target_sound', target_sound)

        # ✅ FIX: Exclude phonemically valid animals (prevents confusion)
        if phonemically_valid_names:
            incorrect_query = incorrect_query.not_.in_('name', phonemically_valid_names)

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
        
        # Exclude the correct animals we already have (by NAME to avoid duplicates)
        if animals_found:
            correct_animal_names = [animal['name'] for animal in animals_found]
            incorrect_query = incorrect_query.not_.in_('name', correct_animal_names)
        
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

        # ✅ DEDUPLICATION: Remove any duplicate names (keep first occurrence)
        seen_names = set()
        deduplicated_animals = []
        for animal in all_animals:
            if animal['name'] not in seen_names:
                deduplicated_animals.append(animal)
                seen_names.add(animal['name'])

        # Use deduplicated list
        all_animals = deduplicated_animals

        logger.info(f"🔍 Deduplication: {len(all_animals)} unique animals after removing name duplicates")

        # Shuffle to mix correct and incorrect
        import random
        random.shuffle(all_animals)
        
        # Calculate actual counts after deduplication
        actual_incorrect_count = len(all_animals) - len(animals_found)

        logger.info(
            f"✅ GUARANTEED: Returning {len(animals_found)} correct (minimum {min_correct}) + {actual_incorrect_count} incorrect = {len(all_animals)} total animals")
        logger.info(f"📊 Strategy used: {strategy_used}")
        logger.info(f"🎯 Minimum requirement satisfied: {len(animals_found) >= min_correct}")

        return Response({
            'success': True,
            'animals': all_animals,
            'correct_count': len(animals_found),
            'incorrect_count': actual_incorrect_count,
            'total_count': len(all_animals),
            'min_correct_guaranteed': min_correct,
            'requirement_met': len(animals_found) >= min_correct,
            'fallback_used': strategy_used,
            'position_validated': sound_position != 'anywhere',
            'effective_position': sound_position if 'fallback_anywhere' not in strategy_used else 'anywhere'
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
    """Get a random sound for the game - only core sounds, excluding thin combinations"""
    # ✅ CORE SOUNDS ONLY
    CORE_SOUNDS = ['g', 'k', 'w', 'd', 'r', 'c', 'h', 's', 'm', 't', 'b', 'p', 'f', 'l', 'z']
    
    # Get the requested position (if specified by frontend)
    requested_position = request.GET.get('position', None)
    
    try:
        # Get all unique sounds from the database that are core sounds
        response = supabase.table('safari_animals').select('target_sound').execute()
        
        if response.data:
            unique_sounds = list(set([animal['target_sound'] for animal in response.data]))
            # ✅ Filter to only core sounds
            core_sounds_in_db = [s for s in unique_sounds if s in CORE_SOUNDS]
            
            # ✅ NEW: Filter out sounds that form excluded combinations
            if requested_position:
                valid_sounds = [
                    sound for sound in core_sounds_in_db 
                    if not is_combination_excluded(sound, requested_position)
                ]
                
                if valid_sounds:
                    random_sound = random.choice(valid_sounds)
                    logger.info(f"✅ Selected sound '{random_sound}' for position '{requested_position}' (excluded thin combinations)")
                    return JsonResponse({
                        'sound': random_sound,
                        'available_sounds': valid_sounds,
                        'excluded_combinations': len(core_sounds_in_db) - len(valid_sounds)
                    })
            
            # If no position specified or all sounds excluded, return any core sound
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
    Save a complete Sound Safari game session with rounds
    NEW STRUCTURE: Saves to sound_safari_sessions and sound_safari_rounds tables
    
    Expected data format:
    {
        "difficulty": "easy",
        "time_spent": 120,
        "completed": true,
        "rounds": [
            {
                "round_number": 1,
                "target_sound": "s",
                "sound_position": "beginning",
                "environment": "jungle",
                "correct": 4,
                "incorrect": 2,
                "total": 6,
                "time_spent": 30
            },
            ...
        ]
    }
    """
    try:
        data = request.data
        user = request.user
        
        # Check authentication status
        is_authenticated = user.is_authenticated
        user_email = user.email if is_authenticated else 'anonymous'
        
        logger.info(f"💾 Saving Sound Safari session for user: {user_email}")
        
        # Validate required fields
        if 'difficulty' not in data:
            return Response({
                'success': False,
                'error': 'Missing required field: difficulty'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if 'rounds' not in data or not data['rounds']:
            return Response({
                'success': False,
                'error': 'Missing required field: rounds (must contain at least one round)'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        rounds_data = data['rounds']
        
        # Calculate session totals from rounds
        total_correct = sum(r.get('correct', 0) for r in rounds_data)
        total_incorrect = sum(r.get('incorrect', 0) for r in rounds_data)
        total_animals = total_correct + total_incorrect
        success_rate = (total_correct / total_animals * 100) if total_animals > 0 else 0
        
        # Prepare session data
        session_data = {
            'user_email': user_email,
            'played_at': data.get('played_at') or 'now()',
            'difficulty': data['difficulty'],
            'total_correct': total_correct,
            'total_incorrect': total_incorrect,
            'success_rate': round(success_rate, 2),
            'time_spent': data.get('time_spent', 0),
            'completed': data.get('completed', True)
        }
        
        logger.info(f"📊 Session summary: {total_correct}/{total_animals} correct ({success_rate:.1f}%)")
        
        try:
            # Step 1: Insert session
            session_response = supabase.table('sound_safari_sessions')\
                .insert(session_data)\
                .execute()
            
            if not session_response.data:
                logger.error("❌ No session data returned from insert")
                return Response({
                    'success': False,
                    'error': 'Failed to create session'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            session_id = session_response.data[0]['session_id']
            logger.info(f"✅ Session created with ID: {session_id}")
            
            # Step 2: Insert all rounds
            rounds_to_insert = []
            for round_data in rounds_data:
                round_record = {
                    'session_id': session_id,
                    'round_number': round_data['round_number'],
                    'target_sound': round_data['target_sound'],
                    'sound_position': round_data['sound_position'],
                    'environment': round_data.get('environment', 'jungle'),
                    'correct': round_data['correct'],
                    'incorrect': round_data['incorrect'],
                    'total': round_data['total'],
                    'time_spent': round_data.get('time_spent', 0)
                }
                rounds_to_insert.append(round_record)
            
            rounds_response = supabase.table('sound_safari_rounds')\
                .insert(rounds_to_insert)\
                .execute()
            
            if not rounds_response.data:
                logger.warning("⚠️ No rounds data returned, but may have succeeded")
            else:
                logger.info(f"✅ {len(rounds_response.data)} rounds saved")
            
            return Response({
                'success': True,
                'message': 'Session and rounds saved successfully',
                'session_id': str(session_id),
                'rounds_saved': len(rounds_to_insert),
                'user_email': user_email
            }, status=status.HTTP_201_CREATED)
            
        except Exception as supabase_error:
            logger.error(f"❌ Supabase error: {str(supabase_error)}")
            return Response({
                'success': False,
                'error': f'Database error: {str(supabase_error)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    except Exception as e:
        logger.error(f"❌ Error saving Sound Safari session: {str(e)}")
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
    UPDATED: Returns ALL sessions (no limit) - pagination handled by frontend
    """
    try:
        user = request.user
        
        if not user.is_authenticated:
            return Response({
                'success': False,
                'error': 'User must be authenticated'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        logger.info(f"📊 Fetching ALL analytics for user: {user.email}")
        
        # ✅ UPDATED: Get ALL sessions (no limit)
        sessions_query = supabase.table('sound_safari_sessions')\
            .select('*')\
            .eq('user_email', user.email)\
            .order('played_at', desc=True)
        # ✅ REMOVED: .limit(limit)
        
        sessions_response = sessions_query.execute()
        sessions = sessions_response.data if sessions_response.data else []
        
        if sessions:
            total_sessions = len(sessions)
            total_correct = sum(s.get('total_correct', 0) for s in sessions)
            total_incorrect = sum(s.get('total_incorrect', 0) for s in sessions)
            avg_success = sum(s.get('success_rate', 0) for s in sessions) / total_sessions
            avg_time = sum(s.get('time_spent', 0) for s in sessions) / total_sessions
            
            # Get sound-specific performance from rounds
            rounds_query = supabase.table('sound_safari_rounds')\
                .select('target_sound, sound_position, correct, incorrect, total')\
                .in_('session_id', [s['session_id'] for s in sessions])
            
            rounds_response = rounds_query.execute()
            rounds = rounds_response.data if rounds_response.data else []
            
            # Calculate sound performance
            sound_stats = {}
            for round_data in rounds:
                sound = round_data.get('target_sound')
                position = round_data.get('sound_position')
                key = f"{sound}_{position}"
                
                if key not in sound_stats:
                    sound_stats[key] = {
                        'sound': sound,
                        'position': position,
                        'attempts': 0,
                        'correct': 0,
                        'total': 0
                    }
                
                sound_stats[key]['attempts'] += 1
                sound_stats[key]['correct'] += round_data.get('correct', 0)
                sound_stats[key]['total'] += round_data.get('total', 0)
            
            # Calculate success rates
            sound_performance = []
            for key, stats in sound_stats.items():
                success_rate = (stats['correct'] / stats['total'] * 100) if stats['total'] > 0 else 0
                sound_performance.append({
                    'sound': stats['sound'],
                    'position': stats['position'],
                    'attempts': stats['attempts'],
                    'success_rate': round(success_rate, 2),
                    'total_correct': stats['correct'],
                    'total_animals': stats['total']
                })
            
            sound_performance.sort(key=lambda x: x['success_rate'], reverse=True)
            
            aggregate_stats = {
                'total_sessions': total_sessions,
                'total_correct': total_correct,
                'total_incorrect': total_incorrect,
                'average_success_rate': round(avg_success, 2),
                'average_time_per_game': round(avg_time, 2)
            }
            
            logger.info(f"✅ Analytics fetched: {total_sessions} sessions")
        else:
            aggregate_stats = {
                'total_sessions': 0,
                'total_correct': 0,
                'total_incorrect': 0,
                'average_success_rate': 0,
                'average_time_per_game': 0
            }
            sound_performance = []
            logger.info(f"ℹ️ No sessions found for user: {user.email}")
        
        return Response({
            'success': True,
            'sessions': sessions,
            'sound_performance': sound_performance,
            'aggregate_stats': aggregate_stats,
            'total_sessions': len(sessions)
        })
    
    except Exception as e:
        logger.error(f"❌ Error fetching analytics: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['GET'])
@permission_classes([AllowAny])
def get_session_rounds(request, session_id):
    """
    Get all rounds for a specific session
    NEW ENDPOINT: For drilling down into session details
    
    Path param:
    - session_id: UUID of the session
    """
    try:
        user = request.user
        
        if not user.is_authenticated:
            return Response({
                'success': False,
                'error': 'User must be authenticated'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        logger.info(f"🔍 Fetching rounds for session: {session_id}")
        
        # Verify session belongs to user
        session_query = supabase.table('sound_safari_sessions')\
            .select('*')\
            .eq('session_id', session_id)\
            .eq('user_email', user.email)\
            .single()
        
        session_response = session_query.execute()
        
        if not session_response.data:
            return Response({
                'success': False,
                'error': 'Session not found or access denied'
            }, status=status.HTTP_404_NOT_FOUND)
        
        session = session_response.data
        
        # Get all rounds for this session
        rounds_query = supabase.table('sound_safari_rounds')\
            .select('*')\
            .eq('session_id', session_id)\
            .order('round_number', desc=False)
        
        rounds_response = rounds_query.execute()
        rounds = rounds_response.data if rounds_response.data else []
        
        logger.info(f"✅ Found {len(rounds)} rounds for session {session_id}")
        
        return Response({
            'success': True,
            'session': session,
            'rounds': rounds,
            'total_rounds': len(rounds)
        })
    
    except Exception as e:
        logger.error(f"❌ Error fetching session rounds: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)