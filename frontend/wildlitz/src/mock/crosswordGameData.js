// src/mock/crosswordGameData.js

// Theme definitions
export const THEMES = {
    animals: {
      name: 'Animals',
      description: 'Crossword puzzles about animals and wildlife'
    },
    space: {
      name: 'Space',
      description: 'Puzzles about planets, stars, and space exploration'
    },
    sports: {
      name: 'Sports',
      description: 'Puzzles featuring sports and athletic activities'
    }
  };
  
  // Crossword puzzles organized by theme
  export const CROSSWORD_PUZZLES = {
    animals: [
      {
        id: 'animals-easy-1',
        title: 'Animals Basic',
        difficulty: 'easy',
        wordCount: 5,
        size: { width: 5, height: 5 },
        // A simple 5x5 grid with TIGER down and FROG across
        grid: [
          { value: 'T', number: 1 }, { value: 'I', number: null }, { value: 'G', number: null }, { value: 'E', number: null }, { value: 'R', number: null },
          { value: 'F', number: 2 }, { value: null, number: null }, { value: null, number: null }, { value: null, number: null }, { value: null, number: null },
          { value: 'R', number: null }, { value: null, number: null }, { value: null, number: 3 }, { value: null, number: null }, { value: null, number: null },
          { value: 'O', number: null }, { value: null, number: null }, { value: null, number: 4 }, { value: null, number: null }, { value: null, number: null },
          { value: 'G', number: null }, { value: null, number: null }, { value: null, number: null }, { value: null, number: null }, { value: null, number: null }
        ],
        words: [
          {
            direction: 'down',
            number: 1,
            clue: 'Large striped wild cat',
            answer: 'TIGER',
            definition: 'A large wild cat with orange fur and black stripes',
            example: 'The tiger roared loudly in the jungle.',
            cells: [
              { row: 0, col: 0 },
              { row: 1, col: 0 },
              { row: 2, col: 0 },
              { row: 3, col: 0 },
              { row: 4, col: 0 }
            ]
          },
          {
            direction: 'across',
            number: 2,
            clue: 'Green amphibian that jumps',
            answer: 'FROG',
            definition: 'A small animal that jumps and lives near water',
            example: 'The frog jumped from lily pad to lily pad.',
            cells: [
              { row: 1, col: 0 },
              { row: 1, col: 1 },
              { row: 1, col: 2 },
              { row: 1, col: 3 }
            ]
          },
          {
            direction: 'across',
            number: 3,
            clue: 'Small water animal with shell',
            answer: 'TURTLE',
            definition: 'A reptile with a hard shell that lives in water or on land',
            example: 'The turtle slowly walked across the beach.',
            cells: [
              { row: 2, col: 2 },
              { row: 2, col: 3 },
              { row: 2, col: 4 },
              { row: 2, col: 5 },
              { row: 2, col: 6 },
              { row: 2, col: 7 }
            ]
          },
          {
            direction: 'down',
            number: 4,
            clue: 'Long-necked animal',
            answer: 'GIRAFFE',
            definition: 'A very tall African animal with a very long neck and legs',
            example: 'The giraffe stretched its long neck to reach the leaves at the top of the tree.',
            cells: [
              { row: 3, col: 2 },
              { row: 4, col: 2 },
              { row: 5, col: 2 },
              { row: 6, col: 2 },
              { row: 7, col: 2 },
              { row: 8, col: 2 },
              { row: 9, col: 2 }
            ]
          }
        ]
      },
      {
        id: 'animals-easy-2',
        title: 'Zoo Animals',
        difficulty: 'easy',
        wordCount: 6,
        size: { width: 8, height: 8 },
        grid: [], // Would contain actual grid data
        words: [
          {
            direction: 'across',
            number: 1,
            clue: 'Black and white bear from China',
            answer: 'PANDA',
            definition: 'A large black and white bear native to China that eats bamboo',
            example: 'The panda munched on bamboo shoots all day long.'
          },
          {
            direction: 'down',
            number: 2,
            clue: 'Tallest animal',
            answer: 'GIRAFFE',
            definition: 'A very tall African animal with a very long neck and legs',
            example: 'The giraffe stretched its long neck to reach the leaves at the top of the tree.'
          },
          {
            direction: 'across',
            number: 3,
            clue: 'King of the jungle',
            answer: 'LION',
            definition: 'A large wild cat with a mane around its neck',
            example: 'The lion roared loudly, showing its powerful teeth.'
          }
        ]
      }
    ],
    space: [
      {
        id: 'space-easy-1',
        title: 'Space Exploration',
        difficulty: 'easy',
        wordCount: 5,
        size: { width: 6, height: 6 },
        grid: [], // Would contain actual grid data
        words: [
          {
            direction: 'across',
            number: 1,
            clue: 'Earth\'s natural satellite',
            answer: 'MOON',
            definition: 'The natural satellite of Earth that reflects light from the sun',
            example: 'The moon shines brightly in the night sky.'
          },
          {
            direction: 'down',
            number: 2,
            clue: 'Center of our solar system',
            answer: 'SUN',
            definition: 'The star at the center of our solar system',
            example: 'The sun provides light and heat to Earth.'
          },
          {
            direction: 'across',
            number: 3,
            clue: 'A large celestial body that orbits the sun',
            answer: 'PLANET',
            definition: 'A large round object in space that moves around a star',
            example: 'Earth is a planet in our solar system.'
          }
        ]
      }
    ],
    sports: [
      {
        id: 'sports-easy-1',
        title: 'Ball Games',
        difficulty: 'easy',
        wordCount: 5,
        size: { width: 7, height: 7 },
        grid: [], // Would contain actual grid data
        words: [
          {
            direction: 'across',
            number: 1,
            clue: 'Game played with a round ball and net',
            answer: 'BASKETBALL',
            definition: 'A game played with a round ball that players try to throw into a high net',
            example: 'We played basketball during gym class today.'
          },
          {
            direction: 'down',
            number: 2,
            clue: 'Game played with a bat and ball',
            answer: 'BASEBALL',
            definition: 'A game played with a ball and bat between two teams of nine players',
            example: 'The baseball player hit the ball over the fence.'
          },
          {
            direction: 'across',
            number: 3,
            clue: 'Game played on ice with a puck',
            answer: 'HOCKEY',
            definition: 'A game played on ice where players use sticks to hit a puck',
            example: 'The hockey team scored three goals in the final period.'
          }
        ]
      }
    ]
  };