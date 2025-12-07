import os
import sys
import json
import django
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'wildlitz.settings')
django.setup()

from django.conf import settings
from supabase import create_client
import logging


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)


VALID_SOUNDS = ['g', 'k', 'w', 'd', 'r', 'c', 'h', 's', 'm', 't', 'b', 'p', 'f', 'l', 'z']
VALID_POSITIONS = ['beginning', 'middle', 'ending']
VALID_ENVIRONMENTS = ['jungle', 'savanna', 'ocean', 'arctic']
VALID_DIFFICULTIES = ['easy', 'medium', 'hard']


SUPABASE_STORAGE_BASE_URL = "https://eixryunajxcthprajaxk.supabase.co/storage/v1/object/public/IMG/SoundSafariAnimals/"

def generate_animal_image_url(animal_name):
    """Generate the correct Supabase storage URL for an animal image"""
    if not animal_name:
        return None
    

    clean_name = animal_name.lower().replace(' ', '').replace('-', '')
    

    image_url = f"{SUPABASE_STORAGE_BASE_URL}{clean_name}.png"
    return image_url


def validate_animal_data(animal):
    """
    Validate animal data structure and values.
    Returns (is_valid, error_message)
    """

    required_fields = ['name', 'target_sound', 'sound_position', 'environment', 'difficulty_level']
    for field in required_fields:
        if field not in animal:
            return False, f"Missing required field: {field}"
        if not animal[field]:
            return False, f"Empty value for field: {field}"
    

    if animal['target_sound'] not in VALID_SOUNDS:
        return False, f"Invalid target_sound '{animal['target_sound']}'. Must be one of: {', '.join(VALID_SOUNDS)}"
    

    if animal['sound_position'] not in VALID_POSITIONS:
        return False, f"Invalid sound_position '{animal['sound_position']}'. Must be one of: {', '.join(VALID_POSITIONS)}"
    

    if animal['environment'] not in VALID_ENVIRONMENTS:
        return False, f"Invalid environment '{animal['environment']}'. Must be one of: {', '.join(VALID_ENVIRONMENTS)}"
    

    if animal['difficulty_level'] not in VALID_DIFFICULTIES:
        return False, f"Invalid difficulty_level '{animal['difficulty_level']}'. Must be one of: {', '.join(VALID_DIFFICULTIES)}"
    
    return True, None


def check_duplicate(animal):
    """
    Check if an exact combination already exists in the database.
    Returns (exists, animal_id)
    """
    try:
        response = supabase.table('safari_animals').select('id').eq(
            'name', animal['name']
        ).eq(
            'target_sound', animal['target_sound']
        ).eq(
            'sound_position', animal['sound_position']
        ).eq(
            'environment', animal['environment']
        ).eq(
            'difficulty_level', animal['difficulty_level']
        ).execute()
        
        if response.data and len(response.data) > 0:
            return True, response.data[0]['id']
        return False, None
    except Exception as e:
        logger.error(f"Error checking duplicate: {str(e)}")
        return False, None


def add_animal_to_database(animal):
    """
    Add an animal to the Supabase database.
    Returns (success, message)
    """
    try:

        is_valid, error_msg = validate_animal_data(animal)
        if not is_valid:
            return False, f"Validation error: {error_msg}"
        

        is_duplicate, existing_id = check_duplicate(animal)
        if is_duplicate:
            return False, f"Already exists (ID: {existing_id})"
        

        image_url = generate_animal_image_url(animal['name'])
        

        animal_data = {
            'name': animal['name'],
            'target_sound': animal['target_sound'],
            'sound_position': animal['sound_position'],
            'environment': animal['environment'],
            'difficulty_level': animal['difficulty_level'],
            'image_url': image_url
        }
        

        response = supabase.table('safari_animals').insert(animal_data).execute()
        
        if response.data:
            return True, f"Successfully added (ID: {response.data[0]['id']})"
        else:
            return False, "Insert failed - no data returned"
            
    except Exception as e:
        return False, f"Error: {str(e)}"


def main():
    """Main function to process the JSON file and add animals"""
    

    json_file = BASE_DIR / 'scripts' / 'animals_to_add.json'
    
    if not json_file.exists():
        logger.error(f"❌ JSON file not found: {json_file}")
        logger.info(f"Please create the file at: {json_file}")
        return
    

    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            animals = json.load(f)
    except json.JSONDecodeError as e:
        logger.error(f"❌ Invalid JSON format: {str(e)}")
        return
    except Exception as e:
        logger.error(f"❌ Error reading file: {str(e)}")
        return
    
    if not isinstance(animals, list):
        logger.error("❌ JSON file must contain an array of animals")
        return
    
    if len(animals) == 0:
        logger.warning("⚠️  JSON file is empty - no animals to add")
        return
    

    logger.info(f"\n{'='*70}")
    logger.info(f"🦁 SAFARI ANIMALS BATCH ADD")
    logger.info(f"{'='*70}")
    logger.info(f"Found {len(animals)} animal(s) to process\n")
    
    results = {
        'success': [],
        'skipped': [],
        'failed': []
    }
    
    for idx, animal in enumerate(animals, 1):
        animal_name = animal.get('name', 'Unknown')
        logger.info(f"[{idx}/{len(animals)}] Processing: {animal_name}")
        
        success, message = add_animal_to_database(animal)
        
        if success:
            logger.info(f"  ✅ {message}")
            results['success'].append({
                'name': animal_name,
                'details': animal,
                'message': message
            })
        elif "Already exists" in message:
            logger.info(f"  ⏭️  {message}")
            results['skipped'].append({
                'name': animal_name,
                'details': animal,
                'message': message
            })
        else:
            logger.error(f"  ❌ {message}")
            results['failed'].append({
                'name': animal_name,
                'details': animal,
                'message': message
            })
        
        logger.info("")
    

    logger.info(f"\n{'='*70}")
    logger.info(f"📊 SUMMARY")
    logger.info(f"{'='*70}")
    logger.info(f"✅ Successfully added: {len(results['success'])}")
    logger.info(f"⏭️  Skipped (duplicates): {len(results['skipped'])}")
    logger.info(f"❌ Failed: {len(results['failed'])}")
    logger.info(f"{'='*70}\n")
    

    if results['failed']:
        logger.info("❌ FAILED ITEMS:")
        for item in results['failed']:
            logger.info(f"  - {item['name']}: {item['message']}")
        logger.info("")
    

    if results['success']:
        logger.info("✅ SUCCESSFULLY ADDED:")
        for item in results['success']:
            animal = item['details']
            logger.info(f"  - {animal['name']} ({animal['target_sound']}-{animal['sound_position']}, {animal['environment']}, {animal['difficulty_level']})")
        logger.info("")
    
    logger.info("🎉 Process complete!\n")


if __name__ == '__main__':
    main()