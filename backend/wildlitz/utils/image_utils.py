# backend/wildlitz/utils/image_utils.py
"""
Utility functions for handling image URLs in the WildLitz application
"""

from django.conf import settings

# Base URL for Supabase storage
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

def validate_image_url(url):
    """
    Validate if an image URL follows the expected Supabase storage pattern
    
    Args:
        url (str): URL to validate
    
    Returns:
        bool: True if URL is valid, False otherwise
    """
    if not url:
        return False
    
    return url.startswith(SUPABASE_STORAGE_BASE_URL) and url.endswith('.jpg')

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