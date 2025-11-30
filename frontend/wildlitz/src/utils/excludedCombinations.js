// frontend/wildlitz/src/utils/excludedCombinations.js
// Centralized excluded combinations - matches backend validation

// Sound-position combinations (excluded for ALL environments)
export const EXCLUDED_COMBINATIONS = [
  ['w', 'ending'],
  ['b', 'ending'],
  ['f', 'ending'],
  ['z', 'beginning'],
  ['z', 'ending'],
  ['c', 'ending'],
];

// Environment-specific exclusions (sound, position, environment)
export const EXCLUDED_ENVIRONMENT_COMBINATIONS = [
  ['g', 'middle', 'ocean'],  // g-middle works fine in jungle/savanna/arctic, just not ocean
];

export const CORE_SOUNDS = ['g', 'k', 'w', 'd', 'r', 'c', 'h', 's', 'm', 't', 'b', 'p', 'f', 'l', 'z'];

/**
 * Check if a sound-position combination is excluded (for all environments)
 */
export const isExcludedCombination = (sound, position) => {
  return EXCLUDED_COMBINATIONS.some(
    ([excludedSound, excludedPosition]) => 
      sound === excludedSound && position === excludedPosition
  );
};

/**
 * Check if a sound-position-environment combination is excluded
 */
export const isExcludedEnvironmentCombination = (sound, position, environment) => {
  return EXCLUDED_ENVIRONMENT_COMBINATIONS.some(
    ([excludedSound, excludedPosition, excludedEnv]) => 
      sound === excludedSound && 
      position === excludedPosition && 
      environment === excludedEnv
  );
};

/**
 * Check if a combination is excluded (checks both types)
 */
export const isCombinationExcluded = (sound, position, environment = null) => {
  // Check general exclusions first
  if (isExcludedCombination(sound, position)) {
    return true;
  }
  
  // Check environment-specific exclusions if environment is provided
  if (environment && isExcludedEnvironmentCombination(sound, position, environment)) {
    return true;
  }
  
  return false;
};

/**
 * Get valid sounds for a specific position
 */
export const getValidSoundsForPosition = (position) => {
  return CORE_SOUNDS.filter(sound => !isExcludedCombination(sound, position));
};

/**
 * Get valid sounds for a specific position and environment
 */
export const getValidSoundsForPositionAndEnvironment = (position, environment) => {
  return CORE_SOUNDS.filter(sound => 
    !isCombinationExcluded(sound, position, environment)
  );
};

/**
 * Get a random valid sound for a position, excluding already used sounds
 */
export const getRandomValidSound = (position, usedSounds = [], environment = null) => {
  const validSounds = environment 
    ? getValidSoundsForPositionAndEnvironment(position, environment)
    : getValidSoundsForPosition(position);
    
  const availableSounds = validSounds.filter(sound => !usedSounds.includes(sound));
  
  if (availableSounds.length > 0) {
    return availableSounds[Math.floor(Math.random() * availableSounds.length)];
  }
  
  // If all valid sounds used, pick any valid sound
  return validSounds.length > 0 
    ? validSounds[Math.floor(Math.random() * validSounds.length)]
    : 's'; // Ultimate fallback
};