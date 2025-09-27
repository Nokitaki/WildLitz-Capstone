# backend/wildlitz/scripts/update_image_urls.py
"""
Script to update all safari animal image URLs to use the new Supabase storage structure
Run this script to migrate existing database records to the new image URL format
"""

import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'wildlitz.settings')
django.setup()

from utils.supabase_client import supabase
from utils.image_utils import generate_animal_image_url
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def update_all_animal_image_urls():
    """
    Update all animal records in the database with new Supabase storage URLs
    """
    try:
        # Fetch all safari animals from the database
        logger.info("Fetching all safari animals from database...")
        response = supabase.table('safari_animals').select('*').execute()
        
        if not response.data:
            logger.warning("No animals found in database")
            return
        
        animals = response.data
        logger.info(f"Found {len(animals)} animals to update")
        
        updated_count = 0
        failed_count = 0
        
        for animal in animals:
            try:
                animal_id = animal['id']
                animal_name = animal['name']
                
                # Generate the new image URL
                new_image_url = generate_animal_image_url(animal_name)
                
                # Update the record in Supabase
                update_response = supabase.table('safari_animals').update({
                    'image_url': new_image_url
                }).eq('id', animal_id).execute()
                
                if update_response.data:
                    logger.info(f"✅ Updated {animal_name} (ID: {animal_id}) with URL: {new_image_url}")
                    updated_count += 1
                else:
                    logger.error(f"❌ Failed to update {animal_name} (ID: {animal_id})")
                    failed_count += 1
                    
            except Exception as e:
                logger.error(f"❌ Error updating {animal.get('name', 'Unknown')} (ID: {animal.get('id', 'Unknown')}): {str(e)}")
                failed_count += 1
        
        logger.info(f"🎉 Update completed! ✅ {updated_count} updated, ❌ {failed_count} failed")
        
    except Exception as e:
        logger.error(f"Error updating animal image URLs: {str(e)}")

def preview_url_changes():
    """
    Preview what the new URLs will look like without making changes
    """
    try:
        logger.info("Previewing URL changes...")
        response = supabase.table('safari_animals').select('id, name, image_url').execute()
        
        if not response.data:
            logger.warning("No animals found in database")
            return
        
        animals = response.data
        logger.info(f"Preview for {len(animals)} animals:")
        
        for animal in animals[:10]:  # Show first 10 as preview
            old_url = animal.get('image_url', 'None')
            new_url = generate_animal_image_url(animal['name'])
            
            logger.info(f"🔄 {animal['name']}:")
            logger.info(f"   Old: {old_url}")
            logger.info(f"   New: {new_url}")
            logger.info("   ---")
        
        if len(animals) > 10:
            logger.info(f"... and {len(animals) - 10} more animals")
            
    except Exception as e:
        logger.error(f"Error previewing URL changes: {str(e)}")

def validate_updated_urls():
    """
    Validate that all URLs have been updated correctly
    """
    try:
        logger.info("Validating updated URLs...")
        response = supabase.table('safari_animals').select('id, name, image_url').execute()
        
        if not response.data:
            logger.warning("No animals found in database")
            return
        
        animals = response.data
        valid_count = 0
        invalid_count = 0
        
        for animal in animals:
            expected_url = generate_animal_image_url(animal['name'])
            actual_url = animal.get('image_url')
            
            if actual_url == expected_url:
                valid_count += 1
            else:
                logger.warning(f"❌ {animal['name']}: Expected {expected_url}, Got {actual_url}")
                invalid_count += 1
        
        logger.info(f"Validation complete: ✅ {valid_count} valid, ❌ {invalid_count} invalid")
        
    except Exception as e:
        logger.error(f"Error validating URLs: {str(e)}")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Update safari animal image URLs')
    parser.add_argument('--preview', action='store_true', help='Preview changes without updating')
    parser.add_argument('--update', action='store_true', help='Update all image URLs')
    parser.add_argument('--validate', action='store_true', help='Validate updated URLs')
    
    args = parser.parse_args()
    
    if args.preview:
        preview_url_changes()
    elif args.update:
        update_all_animal_image_urls()
    elif args.validate:
        validate_updated_urls()
    else:
        print("Usage:")
        print("  python update_image_urls.py --preview    # Preview changes")
        print("  python update_image_urls.py --update     # Update all URLs")
        print("  python update_image_urls.py --validate   # Validate updated URLs")