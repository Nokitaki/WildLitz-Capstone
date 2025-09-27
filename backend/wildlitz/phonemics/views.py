#backend/wildlitz/phonemics/views.py
from django.http import JsonResponse 
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
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

@api_view(['GET'])
@permission_classes([AllowAny])
def get_safari_animals_by_sound(request):
    """Get animals for a specific sound and difficulty from Supabase"""
    target_sound = request.GET.get('sound', 's')
    difficulty = request.GET.get('difficulty', 'easy')
    environment = request.GET.get('environment', '')
    sound_position = request.GET.get('position', '')
    exclude_ids = request.GET.getlist('exclude[]', [])  # Animals to exclude
    
    try:
        # Build query for animals with the target sound
        correct_query = supabase.table('safari_animals').select('*')
        correct_query = correct_query.eq('target_sound', target_sound)
        correct_query = correct_query.eq('difficulty_level', difficulty)
        
        if environment:
            correct_query = correct_query.eq('environment', environment)
        
        if sound_position:
            correct_query = correct_query.eq('sound_position', sound_position)
            
        if exclude_ids:
            correct_query = correct_query.not_.in_('id', exclude_ids)
        
        # Get animals with correct sound
        correct_response = correct_query.execute()
        correct_animals = correct_response.data or []
        
        # Build query for animals without the target sound
        incorrect_query = supabase.table('safari_animals').select('*')
        incorrect_query = incorrect_query.neq('target_sound', target_sound)
        incorrect_query = incorrect_query.eq('difficulty_level', difficulty)
        
        if environment:
            incorrect_query = incorrect_query.eq('environment', environment)
            
        if exclude_ids:
            incorrect_query = incorrect_query.not_.in_('id', exclude_ids)
       
        # Get animals without the target sound
        incorrect_response = incorrect_query.execute()
        incorrect_animals = incorrect_response.data or []
        
        logger.info(f"Found {len(correct_animals)} correct and {len(incorrect_animals)} incorrect animals")
        
        # Update image URLs for all animals using new utility functions
        correct_animals = batch_update_animal_images(correct_animals)
        incorrect_animals = batch_update_animal_images(incorrect_animals)
        
        # Determine number of animals needed based on difficulty
        difficulty_settings = {
            'easy': {'total': 6, 'correct_min': 2, 'correct_max': 4},
            'medium': {'total': 8, 'correct_min': 3, 'correct_max': 5},
            'hard': {'total': 12, 'correct_min': 4, 'correct_max': 7}
        }
        
        settings_for_difficulty = difficulty_settings.get(difficulty, difficulty_settings['easy'])
        total_animals = settings_for_difficulty['total']
        correct_min = settings_for_difficulty['correct_min']
        correct_max = settings_for_difficulty['correct_max']
        
        # Determine how many correct animals to include
        num_correct = min(
            max(correct_min, min(correct_max, len(correct_animals))),
            len(correct_animals)
        )
        num_incorrect = min(total_animals - num_correct, len(incorrect_animals))
        
        # Randomly select animals
        selected_correct = random.sample(correct_animals, num_correct)
        selected_incorrect = random.sample(incorrect_animals, num_incorrect)
        
        # Combine and prepare response
        all_animals = selected_correct + selected_incorrect
        random.shuffle(all_animals)
        
        # Transform data for frontend with updated image URLs
        animals_data = []
        for animal in all_animals:
            animals_data.append({
                'id': animal['id'],
                'name': animal['name'],
                'hasSound': animal['target_sound'],
                'image': animal.get('image_url') or animal.get('image') or generate_animal_image_url(animal['name']) or "🐾",  # Updated with new URL generation
                'image_url': animal.get('image_url') or generate_animal_image_url(animal['name']),  # Ensure image_url is always present
                'soundPosition': animal['sound_position'],
                'environment': animal['environment']
            })
        
        # Update correct and incorrect animals data with new image URLs
        correct_animals_data = []
        for animal in selected_correct:
            correct_animals_data.append({
                'id': animal['id'], 
                'name': animal['name'], 
                'hasSound': animal['target_sound'], 
                'image': animal.get('image_url') or generate_animal_image_url(animal['name']),
                'image_url': animal.get('image_url') or generate_animal_image_url(animal['name'])
            })
        
        incorrect_animals_data = []
        for animal in selected_incorrect:
            incorrect_animals_data.append({
                'id': animal['id'], 
                'name': animal['name'], 
                'hasSound': animal['target_sound'], 
                'image': animal.get('image_url') or generate_animal_image_url(animal['name']),
                'image_url': animal.get('image_url') or generate_animal_image_url(animal['name'])
            })
        
        return JsonResponse({
            'animals': animals_data,
            'correctAnimals': correct_animals_data,
            'incorrectAnimals': incorrect_animals_data,
            'debug': {
                'total_correct_available': len(correct_animals),
                'total_incorrect_available': len(incorrect_animals),
                'selected_correct': num_correct,
                'selected_incorrect': num_incorrect
            }
        })
        
    except Exception as e:
        import traceback
        logger.error(f"Error fetching safari animals: {str(e)}")
        logger.error(traceback.format_exc())
        return JsonResponse({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_random_sound(request):
    """Get a random sound for the game"""
    try:
        # Get all unique sounds from the database
        response = supabase.table('safari_animals').select('target_sound').execute()
        
        if response.data:
            unique_sounds = list(set([animal['target_sound'] for animal in response.data]))
            random_sound = random.choice(unique_sounds)
            
            return JsonResponse({
                'sound': random_sound,
                'available_sounds': unique_sounds
            })
        else:
            # Fallback to predefined sounds if database is empty
            default_sounds = ['s', 'm', 't', 'b', 'p', 'f', 'l', 'z']
            return JsonResponse({
                'sound': random.choice(default_sounds),
                'available_sounds': default_sounds
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