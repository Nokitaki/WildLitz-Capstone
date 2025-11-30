// frontend/wildlitz/src/utils/excludedCombinations.js
// Centralized excluded combinations - matches backend validation

export const EXCLUDED_COMBINATIONS = [
  ['w', 'ending'],
  ['b', 'ending'],
  ['f', 'ending'],
  ['z', 'beginning'],
  ['z', 'ending'],
  ['c', 'ending'],
];

export const CORE_SOUNDS = ['g', 'k', 'w', 'd', 'r', 'c', 'h', 's', 'm', 't', 'b', 'p', 'f', 'l', 'z'];

/**
 * Check if a sound-position combination is excluded
 */
export const isExcludedCombination = (sound, position) => {
  return EXCLUDED_COMBINATIONS.some(
    ([excludedSound, excludedPosition]) => 
      sound === excludedSound && position === excludedPosition
  );
};

/**
 * Get valid sounds for a specific position
 */
export const getValidSoundsForPosition = (position) => {
  return CORE_SOUNDS.filter(sound => !isExcludedCombination(sound, position));
};

/**
 * Get a random valid sound for a position, excluding already used sounds
 */
export const getRandomValidSound = (position, usedSounds = []) => {
  const validSounds = getValidSoundsForPosition(position);
  const availableSounds = validSounds.filter(sound => !usedSounds.includes(sound));
  
  if (availableSounds.length > 0) {
    return availableSounds[Math.floor(Math.random() * availableSounds.length)];
  }
  
  // If all valid sounds used, pick any valid sound
  return validSounds.length > 0 
    ? validSounds[Math.floor(Math.random() * validSounds.length)]
    : 's'; // Ultimate fallback
};