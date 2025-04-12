// soundSafariData.js - Mock data for the Sound Safari game

// Mock animals data with their sounds
export const ANIMALS_DATA = [
    { id: 1, name: 'Snake', hasSound: 's', image: '🐍' },
    { id: 2, name: 'Spider', hasSound: 's', image: '🕷️' },
    { id: 3, name: 'Squirrel', hasSound: 's', image: '🐿️' },
    { id: 4, name: 'Seal', hasSound: 's', image: '🦭' },
    { id: 5, name: 'Lion', hasSound: 'l', image: '🦁' },
    { id: 6, name: 'Tiger', hasSound: 't', image: '🐯' },
    { id: 7, name: 'Monkey', hasSound: 'm', image: '🐒' },
    { id: 8, name: 'Giraffe', hasSound: 'g', image: '🦒' },
    { id: 9, name: 'Penguin', hasSound: 'p', image: '🐧' },
    { id: 10, name: 'Elephant', hasSound: 'e', image: '🐘' },
    { id: 11, name: 'Zebra', hasSound: 'z', image: '🦓' },
    { id: 12, name: 'Frog', hasSound: 'f', image: '🐸' },
    { id: 13, name: 'Bear', hasSound: 'b', image: '🐻' },
    { id: 14, name: 'Whale', hasSound: 'w', image: '🐳' },
    { id: 15, name: 'Dolphin', hasSound: 'd', image: '🐬' },
    { id: 16, name: 'Koala', hasSound: 'k', image: '🐨' },
    { id: 17, name: 'Rabbit', hasSound: 'r', image: '🐰' },
    { id: 18, name: 'Dog', hasSound: 'd', image: '🐕' },
    { id: 19, name: 'Cat', hasSound: 'c', image: '🐱' },
    { id: 20, name: 'Pig', hasSound: 'p', image: '🐷' },
    { id: 21, name: 'Fox', hasSound: 'f', image: '🦊' },
    { id: 22, name: 'Wolf', hasSound: 'w', image: '🐺' },
    { id: 23, name: 'Horse', hasSound: 'h', image: '🐴' },
    { id: 24, name: 'Sheep', hasSound: 'sh', image: '🐑' },
    { id: 25, name: 'Goat', hasSound: 'g', image: '🐐' },
    { id: 26, name: 'Cow', hasSound: 'c', image: '🐄' },
    { id: 27, name: 'Chicken', hasSound: 'ch', image: '🐔' },
    { id: 28, name: 'Duck', hasSound: 'd', image: '🦆' },
    { id: 29, name: 'Mouse', hasSound: 'm', image: '🐁' },
    { id: 30, name: 'Rat', hasSound: 'r', image: '🐀' },
    { id: 31, name: 'Owl', hasSound: 'o', image: '🦉' },
    { id: 32, name: 'Eagle', hasSound: 'e', image: '🦅' }
  ];
  
  // Sound positions
  export const SOUND_POSITIONS = {
    beginning: 'beginning',
    middle: 'middle',
    ending: 'ending',
    anywhere: 'anywhere'
  };
  
  // Sound descriptions for help
  export const SOUND_DESCRIPTIONS = {
    's': 'Makes a hissing sound like a snake: "sss"',
    'm': 'Makes a humming sound with lips closed: "mmm"',
    't': 'Tap your tongue against the roof of your mouth: "t"',
    'b': 'Bring your lips together and release air: "b"',
    'p': 'Pop your lips with a puff of air: "p"',
    'l': 'Place your tongue behind your teeth and hum: "lll"',
    'z': 'Buzz like a bee: "zzz"',
    'f': 'Gently bite your lower lip and blow: "fff"',
    'g': 'Sound from the back of your throat: "g"',
    'k': 'Short sound from the back of your throat: "k"',
    'w': 'Round your lips like saying "oo": "w"',
    'd': 'Tap your tongue behind your teeth: "d"',
    'e': 'Open your mouth for "eh"',
    'r': 'Make a growling sound: "rrr"',
    'c': 'Make a "k" sound but softer: "c"',
    'h': 'Breathe out with your mouth open: "h"',
    'j': 'Make a buzzing sound with your tongue: "j"',
    'v': 'Bite your lower lip gently and hum: "vvv"',
    'n': 'Hum with your tongue touching the roof of your mouth: "nnn"',
    'sh': 'Make a quiet "shushing" sound: "sh"',
    'ch': 'Make a sneezing sound: "ch"',
    'th': 'Put your tongue between your teeth and breathe: "th"'
  };
  
  // Game difficulty levels
  export const DIFFICULTY_LEVELS = {
    easy: { 
      numAnimals: 6, 
      timeLimit: 60, 
      soundPositions: [SOUND_POSITIONS.beginning]
    },
    medium: { 
      numAnimals: 8, 
      timeLimit: 45, 
      soundPositions: [SOUND_POSITIONS.beginning, SOUND_POSITIONS.ending]
    },
    hard: { 
      numAnimals: 12, 
      timeLimit: 30, 
      soundPositions: [SOUND_POSITIONS.beginning, SOUND_POSITIONS.middle, SOUND_POSITIONS.ending]
    }
  };
  
  // Environment themes and their effects
  export const ENVIRONMENTS = {
    jungle: {
      backgroundColor: '#4caf50', // Green
      animalTypes: ['Snake', 'Monkey', 'Tiger', 'Frog', 'Elephant', 'Parrot']
    },
    savanna: {
      backgroundColor: '#ffc107', // Yellow
      animalTypes: ['Lion', 'Zebra', 'Giraffe', 'Elephant', 'Rhino', 'Gazelle']
    },
    ocean: {
      backgroundColor: '#2196f3', // Blue
      animalTypes: ['Dolphin', 'Whale', 'Seal', 'Shark', 'Fish', 'Octopus']
    },
    arctic: {
      backgroundColor: '#90caf9', // Light blue
      animalTypes: ['Penguin', 'Polar Bear', 'Seal', 'Walrus', 'Arctic Fox', 'Reindeer']
    }
  };
  
  // Example words for each sound target
  export const SOUND_EXAMPLES = {
    's': ['snake', 'sun', 'seal', 'spider', 'sock', 'star', 'strawberry'],
    'm': ['monkey', 'mouse', 'map', 'moon', 'mountain', 'milk', 'mango'],
    't': ['tiger', 'turtle', 'table', 'train', 'tooth', 'tent', 'tomato'],
    'b': ['bear', 'ball', 'boat', 'bee', 'banana', 'book', 'butterfly'],
    'p': ['penguin', 'pig', 'pan', 'pear', 'pencil', 'pizza', 'park'],
    'f': ['fox', 'fish', 'frog', 'flower', 'foot', 'fork', 'fan'],
    'l': ['lion', 'leaf', 'log', 'lamp', 'lemon', 'ladder', 'leg'],
    'z': ['zebra', 'zoo', 'zigzag', 'zero', 'zipper', 'zinc', 'zone'],
    'g': ['goat', 'giraffe', 'gift', 'game', 'garden', 'grape', 'gold'],
    'w': ['wolf', 'whale', 'water', 'web', 'window', 'wing', 'wagon'],
    'd': ['dog', 'dolphin', 'desk', 'door', 'duck', 'deer', 'drum'],
    'c': ['cat', 'cow', 'car', 'cake', 'candle', 'cave', 'corn'],
    'r': ['rabbit', 'rat', 'rain', 'rose', 'rope', 'rock', 'robot'],
    'h': ['horse', 'hat', 'hand', 'house', 'heart', 'honey', 'hammer']
  };
  
  // Teaching tips for each sound
  export const TEACHING_TIPS = {
    's': 'Have students pretend to be a snake and practice the "sss" sound while moving like a snake.',
    'm': 'Have students hum with lips closed, then feel the vibration on their lips with their fingers.',
    't': 'Practice tapping the tongue on the roof of the mouth, just behind the teeth.',
    'b': 'Let students feel the air puff on their hand when they make the "b" sound.',
    'p': 'Have students hold a small piece of paper in front of their mouth and watch it move when they make the "p" sound.',
    'l': 'Practice with tongue twisters like "Lily likes lovely lemons."',
    'z': 'Have students pretend to be bees buzzing with the "zzz" sound.',
    'f': 'Show students how to place their teeth gently on their bottom lip for the "f" sound.',
    'g': 'Have students feel their throat vibrate when they make the "g" sound.',
    'w': 'Practice rounding lips like blowing out a candle, but making a sound.',
    'd': 'Compare with "t" sound - "d" uses voice, "t" doesn\'t.',
    'c': 'Practice with words that use both hard "c" (cat) and soft "c" (city).',
    'r': 'Have students growl like a lion to practice the "r" sound.',
    'h': 'Let students feel their breath on their hand when they make the "h" sound.'
  };