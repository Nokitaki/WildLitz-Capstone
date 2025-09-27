// frontend/wildlitz/src/utils/imageUtils.js
/**
 * Utility functions for handling animal images in the frontend
 */

// Base URL for Supabase storage
const SUPABASE_STORAGE_BASE_URL = "https://eixryunajxcthprajaxk.supabase.co/storage/v1/object/public/IMG/SoundSafariAnimals/";

/**
 * Generate the correct image URL for an animal
 * @param {string} animalName - Name of the animal
 * @returns {string} Complete URL to the animal image
 */
export const generateAnimalImageUrl = (animalName) => {
  if (!animalName) {
    return null;
  }
  
  // Convert animal name to lowercase and remove spaces/hyphens
  const cleanName = animalName.toLowerCase().replace(/\s+/g, '').replace(/-/g, '');
  
  // Generate the complete URL
  return `${SUPABASE_STORAGE_BASE_URL}${cleanName}.jpg`;
};

/**
 * Get a fallback image URL when animal images fail to load
 * @returns {string} URL to a generic animal placeholder
 */
export const getFallbackImageUrl = () => {
  return `${SUPABASE_STORAGE_BASE_URL}placeholder.jpg`;
};

/**
 * Ensure animal data has the correct image URL
 * @param {Object} animal - Animal data object
 * @returns {Object} Animal data with correct image URL
 */
export const ensureCorrectImageUrl = (animal) => {
  if (!animal || !animal.name) {
    return animal;
  }
  
  // Generate the correct URL based on the animal name
  const correctUrl = generateAnimalImageUrl(animal.name);
  
  // Update both image and image_url fields for compatibility
  return {
    ...animal,
    image: correctUrl,
    image_url: correctUrl
  };
};

/**
 * Process a list of animals to ensure they all have correct image URLs
 * @param {Array} animals - Array of animal objects
 * @returns {Array} Array of animals with correct image URLs
 */
export const processAnimalImages = (animals) => {
  if (!Array.isArray(animals)) {
    return animals;
  }
  
  return animals.map(ensureCorrectImageUrl);
};