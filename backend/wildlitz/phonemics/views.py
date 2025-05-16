#backend/wildlitz/phonemics/views.py
from django.http import JsonResponse 
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import random
from supabase import create_client
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

# Create Supabase client using settings
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

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
        
        # Transform data for frontend
        animals_data = []
        for animal in all_animals:
            animals_data.append({
                'id': animal['id'],
                'name': animal['name'],
                'hasSound': animal['target_sound'],
                'image': animal['image_url'] or f"🐾",  # Fallback to emoji if no image
                'soundPosition': animal['sound_position'],
                'environment': animal['environment']
            })
        
        return JsonResponse({
            'animals': animals_data,
            'correctAnimals': [{'id': a['id'], 'name': a['name'], 'hasSound': a['target_sound'], 'image': a['image_url']} for a in selected_correct],
            'incorrectAnimals': [{'id': a['id'], 'name': a['name'], 'hasSound': a['target_sound'], 'image': a['image_url']} for a in selected_incorrect],
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
@require_http_methods(["POST"])
def submit_game_results(request):
    """Submit game results and get feedback"""
    try:
        data = json.loads(request.body)
        selected_animals = data.get('selected_animals', [])
        correct_animals = data.get('correct_animals', [])
        target_sound = data.get('target_sound', '')
        
        # Calculate score
        correct_selected = [a for a in selected_animals if any(c['id'] == a['id'] for c in correct_animals)]
        incorrect_selected = [a for a in selected_animals if not any(c['id'] == a['id'] for c in correct_animals)]
        missed_animals = [a for a in correct_animals if not any(s['id'] == a['id'] for s in selected_animals)]
        
        score = (len(correct_selected) / len(correct_animals)) * 100 if correct_animals else 0
        
        # Generate feedback message
        if score >= 90:
            feedback = f"Excellent! You found {len(correct_selected)} out of {len(correct_animals)} animals with the '{target_sound}' sound!"
        elif score >= 70:
            feedback = f"Great job! You found {len(correct_selected)} out of {len(correct_animals)} animals with the '{target_sound}' sound."
        elif score >= 50:
            feedback = f"Good effort! You found {len(correct_selected)} out of {len(correct_animals)} animals. Keep practicing!"
        else:
            feedback = f"You found {len(correct_selected)} out of {len(correct_animals)} animals. Let's try again!"
        
        return JsonResponse({
            'score': round(score),
            'feedback': feedback,
            'correct_selected': correct_selected,
            'incorrect_selected': incorrect_selected,
            'missed_animals': missed_animals,
            'total_correct': len(correct_animals)
        })
        
    except Exception as e:
        logger.error(f"Error submitting game results: {str(e)}")
        return JsonResponse({'error': str(e)}, status=400)