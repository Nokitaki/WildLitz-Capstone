export const EXCLUDED_COMBINATIONS = [
  ['w', 'ending'],
  ['b', 'ending'],
  ['f', 'ending'],
  ['z', 'beginning'],
  ['z', 'ending'],
  ['c', 'ending'],
];

export const EXCLUDED_ENVIRONMENT_COMBINATIONS = [
  ['g', 'middle', 'ocean'],
  ['d', 'middle', 'savanna'],
  ['w', 'middle', 'savanna'],
  ['p', 'middle', 'savanna'],
  ['h', 'middle', 'savanna'],
  ['c', 'middle', 'savanna'],
  ['d', 'anywhere', 'jungle'],
  ['k', 'anywhere', 'jungle'],
  ['p', 'anywhere', 'jungle'],
  ['r', 'anywhere', 'jungle'],
  ['m', 'middle', 'ocean'],
  ['g', 'ending', 'ocean'],
  ['l', 'middle', 'ocean'],
  ['f', 'beginning', 'arctic'],
  ['r', 'middle', 'ocean'],
  ['s', 'middle', 'ocean'],
];

export const CORE_SOUNDS = ['g', 'k', 'w', 'd', 'r', 'c', 'h', 's', 'm', 't', 'b', 'p', 'f', 'l', 'z'];

export const isExcludedCombination = (sound, position) => {
  return EXCLUDED_COMBINATIONS.some(
    ([excludedSound, excludedPosition]) => 
      sound === excludedSound && position === excludedPosition
  );
};

export const isExcludedEnvironmentCombination = (sound, position, environment) => {
  return EXCLUDED_ENVIRONMENT_COMBINATIONS.some(
    ([excludedSound, excludedPosition, excludedEnv]) => 
      sound === excludedSound && 
      position === excludedPosition && 
      environment === excludedEnv
  );
};

export const isCombinationExcluded = (sound, position, environment = null) => {
  if (isExcludedCombination(sound, position)) {
    return true;
  }
  
  if (environment && isExcludedEnvironmentCombination(sound, position, environment)) {
    return true;
  }
  
  return false;
};

export const getValidSoundsForPosition = (position) => {
  return CORE_SOUNDS.filter(sound => !isExcludedCombination(sound, position));
};

export const getValidSoundsForPositionAndEnvironment = (position, environment) => {
  return CORE_SOUNDS.filter(sound => 
    !isCombinationExcluded(sound, position, environment)
  );
};

export const getRandomValidSound = (position, usedSounds = [], environment = null) => {
  const validSounds = environment 
    ? getValidSoundsForPositionAndEnvironment(position, environment)
    : getValidSoundsForPosition(position);
    
  const availableSounds = validSounds.filter(sound => !usedSounds.includes(sound));
  
  if (availableSounds.length > 0) {
    return availableSounds[Math.floor(Math.random() * availableSounds.length)];
  }
  
  return validSounds.length > 0 
    ? validSounds[Math.floor(Math.random() * validSounds.length)]
    : 's'; 
};