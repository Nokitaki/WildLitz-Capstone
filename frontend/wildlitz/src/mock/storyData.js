// src/mock/storyData.js
// This is a critical modification to ensure grid data includes row and col properties

export const STORY_ADVENTURES = {
  "jungle_quest": {
    title: "The Jungle Quest",
    description: "Join Maya and Leo as they explore a mysterious jungle and uncover its secrets!",
    gradeLevel: "Grade 3",
    readingLevel: "Early Chapter Book",
    episodes: [
      {
        id: "jungle_quest_ep1",
        episodeNumber: 1,
        title: "The Discovery",
        text: "Maya and Leo found an old map in their grandmother's attic. The map showed a hidden jungle path that led to a treasure. \"Do you think this treasure is real?\" asked Leo. Maya nodded excitedly. \"Let's find out!\" The next day, they packed their backpacks with water, snacks, and a compass. Their journey was about to begin!",
        recap: "Maya and Leo discover an old map in their grandmother's attic that leads to a treasure in the jungle. They prepare for their adventure.",
        discussionQuestions: [
          "What did Maya and Leo find in the attic?",
          "What items did they pack for their journey?",
          "Where do you think the story will take place?",
          "What do you think they might find in the jungle?"
        ],
        crosswordPuzzleId: "jungle_ep1_puzzle",
        vocabularyFocus: ["map", "treasure", "journey", "path", "compass"]
      },
      // Additional episodes...
    ]
  },
  "space_explorers": {
    title: "Space Explorers",
    description: "Follow Sam and Ava as they journey through the solar system on an incredible space adventure!",
    gradeLevel: "Grade 3",
    readingLevel: "Early Chapter Book",
    episodes: [
      {
        id: "space_ep1",
        episodeNumber: 1,
        title: "The Space Academy",
        text: "Sam and Ava were the youngest students at the Space Academy. They learned how to operate spaceships and identify all the planets in our solar system. Their teacher, Dr. Stellar, announced a special mission. \"We need brave explorers to collect samples from Mars,\" she said. Sam and Ava raised their hands immediately. This would be their first journey into space!",
        recap: "Sam and Ava are young students at the Space Academy who volunteer for a special mission to Mars.",
        discussionQuestions: [
          "What did Sam and Ava learn at the Space Academy?",
          "Why do you think they were chosen for the mission?",
          "What do you know about Mars?",
          "What might be challenging about visiting Mars?"
        ],
        crosswordPuzzleId: "space_ep1_puzzle",
        vocabularyFocus: ["academy", "planets", "mission", "samples", "solar"]
      },
      // More space episodes would be added here
    ]
  }
};

// Enhanced crossword puzzles with properly structured grid data
export const STORY_PUZZLES = {
  "jungle_ep1_puzzle": {
    id: "jungle_ep1_puzzle",
    title: "The Jungle Map",
    size: { width: 10, height: 10 },
    grid: [
      // Properly formatted grid with row/col properties
      // First row
      { row: 0, col: 0, value: 'M', number: 1 },
      { row: 0, col: 1, value: 'A', number: null },
      { row: 0, col: 2, value: 'P', number: null },
      { row: 0, col: 3, value: null, number: null },
      { row: 0, col: 4, value: null, number: null },
      { row: 0, col: 5, value: null, number: null },
      { row: 0, col: 6, value: null, number: null },
      { row: 0, col: 7, value: null, number: null },
      { row: 0, col: 8, value: null, number: null },
      { row: 0, col: 9, value: null, number: null },
      // Second row
      { row: 1, col: 0, value: null, number: null },
      { row: 1, col: 1, value: null, number: null },
      { row: 1, col: 2, value: 'P', number: 2 },
      { row: 1, col: 3, value: 'A', number: null },
      { row: 1, col: 4, value: 'T', number: null },
      { row: 1, col: 5, value: 'H', number: null },
      { row: 1, col: 6, value: null, number: null },
      { row: 1, col: 7, value: null, number: null },
      { row: 1, col: 8, value: null, number: null },
      { row: 1, col: 9, value: null, number: null },
      // Third row
      { row: 2, col: 0, value: null, number: null },
      { row: 2, col: 1, value: null, number: null },
      { row: 2, col: 2, value: null, number: null },
      { row: 2, col: 3, value: null, number: null },
      { row: 2, col: 4, value: 'T', number: 3 },
      { row: 2, col: 5, value: 'R', number: null },
      { row: 2, col: 6, value: 'E', number: null },
      { row: 2, col: 7, value: 'A', number: null },
      { row: 2, col: 8, value: 'S', number: null },
      { row: 2, col: 9, value: 'U', number: null },
      // Fourth row
      { row: 3, col: 0, value: null, number: null },
      { row: 3, col: 1, value: null, number: null },
      { row: 3, col: 2, value: null, number: null },
      { row: 3, col: 3, value: null, number: null },
      { row: 3, col: 4, value: null, number: null },
      { row: 3, col: 5, value: 'E', number: null },
      { row: 3, col: 6, value: null, number: null },
      { row: 3, col: 7, value: null, number: null },
      { row: 3, col: 8, value: null, number: null },
      { row: 3, col: 9, value: null, number: null },
      // Fifth row
      { row: 4, col: 0, value: 'C', number: 4 },
      { row: 4, col: 1, value: 'O', number: null },
      { row: 4, col: 2, value: 'M', number: null },
      { row: 4, col: 3, value: 'P', number: null },
      { row: 4, col: 4, value: 'A', number: null },
      { row: 4, col: 5, value: 'S', number: null },
      { row: 4, col: 6, value: 'S', number: null },
      { row: 4, col: 7, value: null, number: null },
      { row: 4, col: 8, value: null, number: null },
      { row: 4, col: 9, value: null, number: null },
      // Sixth row
      { row: 5, col: 0, value: null, number: null },
      { row: 5, col: 1, value: null, number: null },
      { row: 5, col: 2, value: null, number: null },
      { row: 5, col: 3, value: null, number: null },
      { row: 5, col: 4, value: null, number: null },
      { row: 5, col: 5, value: null, number: 5 },
      { row: 5, col: 6, value: 'J', number: null },
      { row: 5, col: 7, value: 'O', number: null },
      { row: 5, col: 8, value: 'U', number: null },
      { row: 5, col: 9, value: 'R', number: null },
      // Seventh row
      { row: 6, col: 0, value: null, number: null },
      { row: 6, col: 1, value: null, number: null },
      { row: 6, col: 2, value: null, number: null },
      { row: 6, col: 3, value: null, number: null },
      { row: 6, col: 4, value: null, number: null },
      { row: 6, col: 5, value: null, number: null },
      { row: 6, col: 6, value: null, number: null },
      { row: 6, col: 7, value: null, number: null },
      { row: 6, col: 8, value: null, number: null },
      { row: 6, col: 9, value: 'N', number: null },
      // Remaining rows (empty)
      ...Array(30).fill(null).map((_, index) => {
        const row = Math.floor(index / 10) + 7;
        const col = index % 10;
        return { row, col, value: null, number: null };
      })
    ],
    words: [
      {
        direction: "across",
        number: 1,
        clue: "What Maya and Leo found in the attic",
        answer: "MAP",
        definition: "A drawing of an area showing its main features",
        example: "They used a map to find their way through the forest.",
        cells: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 2 }
        ]
      },
      {
        direction: "across",
        number: 2,
        clue: "What the map showed that led to treasure",
        answer: "PATH",
        definition: "A way or track made for walking",
        example: "They followed the path through the woods.",
        cells: [
          { row: 1, col: 2 },
          { row: 1, col: 3 },
          { row: 1, col: 4 },
          { row: 1, col: 5 }
        ]
      },
      {
        direction: "across",
        number: 3,
        clue: "What Maya and Leo were looking for",
        answer: "TREASURE",
        definition: "A collection of valuable things",
        example: "The pirates buried their treasure on the island.",
        cells: [
          { row: 2, col: 4 },
          { row: 2, col: 5 },
          { row: 2, col: 6 },
          { row: 2, col: 7 },
          { row: 2, col: 8 },
          { row: 2, col: 9 },
          { row: 3, col: 5 },
          { row: 4, col: 5 }
        ]
      },
     {
  direction: "down",  // Make sure this is "down"
  number: 5,
  clue: "Maya and Leo's trip to find the treasure",
  answer: "JOURNEY",
  definition: "Traveling from one place to another, especially over a long distance",
  example: "Their journey to the mountains took three days.",
  cells: [
    { row: 5, col: 5 },  // J
    { row: 6, col: 5 },  // O
    { row: 7, col: 5 },  // U
    { row: 8, col: 5 },  // R
    { row: 9, col: 5 },  // N
    { row: 10, col: 5 }, // E
    { row: 11, col: 5 }  // Y
  ]
},
      {
        direction: "across",
        number: 5,
        clue: "Maya and Leo's trip to find the treasure",
        answer: "JOURNEY",
        definition: "Traveling from one place to another, especially over a long distance",
        example: "Their journey to the mountains took three days.",
        cells: [
          { row: 5, col: 5 },
          { row: 5, col: 6 },
          { row: 5, col: 7 },
          { row: 5, col: 8 },
          { row: 5, col: 9 },
          { row: 6, col: 9 },
          { row: 7, col: 9 }
        ]
      }
    ]
  },
  "space_ep1_puzzle": {
    id: "space_ep1_puzzle",
    title: "Space Adventure",
    size: { width: 10, height: 10 },
    grid: [
      // Properly formatted grid with row/col properties
      // First row
      { row: 0, col: 0, value: 'A', number: 1 },
      { row: 0, col: 1, value: 'C', number: null },
      { row: 0, col: 2, value: 'A', number: null },
      { row: 0, col: 3, value: 'D', number: null },
      { row: 0, col: 4, value: 'E', number: null },
      { row: 0, col: 5, value: 'M', number: null },
      { row: 0, col: 6, value: 'Y', number: null },
      { row: 0, col: 7, value: null, number: null },
      { row: 0, col: 8, value: null, number: null },
      { row: 0, col: 9, value: null, number: null },
      // Second row
      { row: 1, col: 0, value: null, number: null },
      { row: 1, col: 1, value: null, number: null },
      { row: 1, col: 2, value: null, number: null },
      { row: 1, col: 3, value: null, number: null },
      { row: 1, col: 4, value: null, number: null },
      { row: 1, col: 5, value: null, number: null },
      { row: 1, col: 6, value: null, number: null },
      { row: 1, col: 7, value: null, number: null },
      { row: 1, col: 8, value: null, number: null },
      { row: 1, col: 9, value: null, number: null },
      // Third row
      { row: 2, col: 0, value: null, number: null },
      { row: 2, col: 1, value: null, number: null },
      { row: 2, col: 2, value: 'M', number: 3 },
      { row: 2, col: 3, value: 'I', number: null },
      { row: 2, col: 4, value: 'S', number: null },
      { row: 2, col: 5, value: 'S', number: null },
      { row: 2, col: 6, value: 'I', number: null },
      { row: 2, col: 7, value: 'O', number: null },
      { row: 2, col: 8, value: 'N', number: null },
      { row: 2, col: 9, value: null, number: null },
      // Fourth row
      { row: 3, col: 0, value: null, number: null },
      { row: 3, col: 1, value: 'P', number: 2 },
      { row: 3, col: 2, value: 'L', number: null },
      { row: 3, col: 3, value: 'A', number: null },
      { row: 3, col: 4, value: 'N', number: null },
      { row: 3, col: 5, value: 'E', number: null },
      { row: 3, col: 6, value: 'T', number: null },
      { row: 3, col: 7, value: 'S', number: null },
      { row: 3, col: 8, value: null, number: null },
      { row: 3, col: 9, value: null, number: null },
      // Fifth row
      { row: 4, col: 0, value: null, number: null },
      { row: 4, col: 1, value: null, number: null },
      { row: 4, col: 2, value: null, number: null },
      { row: 4, col: 3, value: null, number: null },
      { row: 4, col: 4, value: null, number: null },
      { row: 4, col: 5, value: null, number: null },
      { row: 4, col: 6, value: null, number: null },
      { row: 4, col: 7, value: null, number: null },
      { row: 4, col: 8, value: null, number: null },
      { row: 4, col: 9, value: null, number: null },
      // Sixth row
      { row: 5, col: 0, value: 'S', number: 5 },
      { row: 5, col: 1, value: 'O', number: null },
      { row: 5, col: 2, value: 'L', number: null },
      { row: 5, col: 3, value: 'A', number: null },
      { row: 5, col: 4, value: 'R', number: null },
      { row: 5, col: 5, value: null, number: null },
      { row: 5, col: 6, value: null, number: null },
      { row: 5, col: 7, value: null, number: null },
      { row: 5, col: 8, value: null, number: null },
      { row: 5, col: 9, value: null, number: null },
      // Seventh row
      { row: 6, col: 0, value: 'A', number: null },
      { row: 6, col: 1, value: null, number: null },
      { row: 6, col: 2, value: null, number: null },
      { row: 6, col: 3, value: null, number: null },
      { row: 6, col: 4, value: null, number: null },
      { row: 6, col: 5, value: null, number: null },
      { row: 6, col: 6, value: null, number: null },
      { row: 6, col: 7, value: null, number: null },
      { row: 6, col: 8, value: null, number: null },
      { row: 6, col: 9, value: null, number: null },
      // Eighth row
      { row: 7, col: 0, value: 'M', number: null },
      { row: 7, col: 1, value: null, number: null },
      { row: 7, col: 2, value: null, number: null },
      { row: 7, col: 3, value: null, number: null },
      { row: 7, col: 4, value: null, number: 4 },
      { row: 7, col: 5, value: 'S', number: null },
      { row: 7, col: 6, value: 'A', number: null },
      { row: 7, col: 7, value: 'M', number: null },
      { row: 7, col: 8, value: 'P', number: null },
      { row: 7, col: 9, value: 'L', number: null },
      // Ninth row
      { row: 8, col: 0, value: 'P', number: null },
      { row: 8, col: 1, value: null, number: null },
      { row: 8, col: 2, value: null, number: null },
      { row: 8, col: 3, value: null, number: null },
      { row: 8, col: 4, value: null, number: null },
      { row: 8, col: 5, value: null, number: null },
      { row: 8, col: 6, value: null, number: null },
      { row: 8, col: 7, value: null, number: null },
      { row: 8, col: 8, value: null, number: null },
      { row: 8, col: 9, value: 'E', number: null },
      // Tenth row
      { row: 9, col: 0, value: 'L', number: null },
      { row: 9, col: 1, value: null, number: null },
      { row: 9, col: 2, value: null, number: null },
      { row: 9, col: 3, value: null, number: null },
      { row: 9, col: 4, value: null, number: null },
      { row: 9, col: 5, value: null, number: null },
      { row: 9, col: 6, value: null, number: null },
      { row: 9, col: 7, value: null, number: null },
      { row: 9, col: 8, value: null, number: null },
      { row: 9, col: 9, value: 'S', number: null }
    ],
    words: [
      {
        direction: "across",
        number: 1,
        clue: "A school for special training",
        answer: "ACADEMY",
        definition: "A school for special training or a place where special subjects are taught",
        example: "She attended the music academy to learn piano.",
        cells: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 2 },
          { row: 0, col: 3 },
          { row: 0, col: 4 },
          { row: 0, col: 5 },
          { row: 0, col: 6 }
        ]
      },
      {
        direction: "down",
        number: 2,
        clue: "Large round objects that orbit the sun",
        answer: "PLANETS",
        definition: "Large round objects in space that move around a star",
        example: "Earth is one of eight planets in our solar system.",
        cells: [
          { row: 3, col: 1 },
          { row: 3, col: 2 },
          { row: 3, col: 3 },
          { row: 3, col: 4 },
          { row: 3, col: 5 },
          { row: 3, col: 6 },
          { row: 3, col: 7 }
        ]
      },
      {
        direction: "across",
        number: 3,
        clue: "A special task or journey",
        answer: "MISSION",
        definition: "An important task or job that someone is given to do",
        example: "The astronauts' mission was to repair the satellite.",
        cells: [
          { row: 2, col: 2 },
          { row: 2, col: 3 },
          { row: 2, col: 4 },
          { row: 2, col: 5 },
          { row: 2, col: 6 },
          { row: 2, col: 7 },
          { row: 2, col: 8 }
        ]
      },
      {
        direction: "across",
        number: 4,
        clue: "Small pieces collected for study",
        answer: "SAMPLES",
        definition: "Small amounts of something that show what the whole is like",
        example: "The scientists collected rock samples from the mountain.",
        cells: [
          { row: 7, col: 5 },
          { row: 7, col: 6 },
          { row: 7, col: 7 },
          { row: 7, col: 8 },
          { row: 7, col: 9 },
          { row: 8, col: 9 },
          { row: 9, col: 9 }
        ]
      },
      {
        direction: "across",
        number: 5,
        clue: "Related to the sun",
        answer: "SOLAR",
        definition: "Relating to or determined by the sun",
        example: "The solar panels collect energy from the sun.",
        cells: [
          { row: 5, col: 0 },
          { row: 5, col: 1 },
          { row: 5, col: 2 },
          { row: 5, col: 3 },
          { row: 5, col: 4 }
        ]
      }
    ]
  }
};