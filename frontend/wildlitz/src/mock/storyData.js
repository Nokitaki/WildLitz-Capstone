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
        vocabularyFocus: ["map", "path", "treasure", "journey", "compass"]
      }
    ]
  }
};

// Improved grid that fills the entire game area properly
export const STORY_PUZZLES = {
  "jungle_ep1_puzzle": {
    id: "jungle_ep1_puzzle",
    title: "The Jungle Map",
    size: { width: 7, height: 7 },
    words: [
      // ACROSS words
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
        number: 4,
        clue: "Instrument that shows directions",
        answer: "COMPASS",
        definition: "A device that shows which direction is north, south, east, and west",
        example: "They used a compass to find their way through the forest.",
        cells: [
          { row: 3, col: 0 },
          { row: 3, col: 1 },
          { row: 3, col: 2 },
          { row: 3, col: 3 },
          { row: 3, col: 4 },
          { row: 3, col: 5 },
          { row: 3, col: 6 }
        ]
      },
      // DOWN words
      {
        direction: "down",
        number: 2,
        clue: "What the map showed that led to treasure",
        answer: "PATH",
        definition: "A way or track made for walking",
        example: "They followed the path through the woods.",
        cells: [
          { row: 0, col: 2 },
          { row: 1, col: 2 },
          { row: 2, col: 2 },
          { row: 3, col: 2 }
        ]
      },
      {
        direction: "down",
        number: 3,
        clue: "What Maya and Leo were looking for",
        answer: "TREASURE",
        definition: "A collection of valuable things",
        example: "The pirates buried their treasure on the island.",
        cells: [
          { row: 0, col: 4 },
          { row: 1, col: 4 },
          { row: 2, col: 4 },
          { row: 3, col: 4 },
          { row: 4, col: 4 },
          { row: 5, col: 4 },
          { row: 6, col: 4 }
        ]
      },
      {
        direction: "down",
        number: 5,
        clue: "Maya and Leo's trip to find the treasure",
        answer: "JOURNEY",
        definition: "Traveling from one place to another, especially over a long distance",
        example: "Their journey to the mountains took three days.",
        cells: [
          { row: 0, col: 6 },
          { row: 1, col: 6 },
          { row: 2, col: 6 },
          { row: 3, col: 6 },
          { row: 4, col: 6 },
          { row: 5, col: 6 },
          { row: 6, col: 6 }
        ]
      }
    ]
  }
};