// src/mock/storyData.js

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
      {
        id: "jungle_quest_ep2",
        episodeNumber: 2,
        title: "Into the Jungle",
        text: "The jungle was thick with tall trees and colorful flowers. Maya and Leo followed the path on their map carefully. Suddenly, they heard a loud roar! \"What was that?\" whispered Leo. A tiger appeared between the trees. Its orange fur had black stripes that helped it hide. The children stayed very still until the tiger walked away. \"That was close,\" said Maya. They continued their journey, even more careful now.",
        recap: "Maya and Leo enter the jungle and have a close encounter with a tiger. They learn they must be very careful in this wild place.",
        discussionQuestions: [
          "How did Maya and Leo feel when they heard the roar?",
          "How does a tiger's stripes help it in the jungle?",
          "What would you do if you saw a tiger in the wild?",
          "Why did Maya and Leo stay very still?"
        ],
        crosswordPuzzleId: "jungle_ep2_puzzle",
        vocabularyFocus: ["jungle", "tiger", "stripes", "roar", "careful"]
      },
      {
        id: "jungle_quest_ep3",
        episodeNumber: 3,
        title: "The River Crossing",
        text: "Maya and Leo reached a wide river blocking their path. According to the map, the treasure was on the other side. \"We need to build a bridge,\" said Leo. They gathered long branches and vines to create a simple bridge. It wasn't easy work! They tested each step carefully. The bridge swayed as they crossed, but it held their weight. On the other side, they found a stone with strange symbols. \"This must be a clue!\" Maya said excitedly.",
        recap: "Maya and Leo reach a river and build a bridge to cross it. On the other side, they find a stone with mysterious symbols.",
        discussionQuestions: [
          "How did Maya and Leo solve the problem of crossing the river?",
          "What materials did they use to build their bridge?",
          "Why was crossing the bridge difficult?",
          "What do you think the strange symbols might mean?"
        ],
        crosswordPuzzleId: "jungle_ep3_puzzle",
        vocabularyFocus: ["river", "bridge", "symbols", "weight", "clue"]
      }
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

// Crossword puzzles linked to story episodes
export const STORY_PUZZLES = {
  "jungle_ep1_puzzle": {
    id: "jungle_ep1_puzzle",
    title: "The Jungle Map",
    size: { width: 10, height: 10 },
    grid: [
      // Here would be the actual grid data
      // Simplifying for this example
    ],
    words: [
      {
        direction: "across",
        number: 1,
        clue: "What Maya and Leo found in the attic",
        answer: "MAP",
        definition: "A drawing of an area showing its main features",
        example: "They used a map to find their way through the forest."
      },
      {
        direction: "down",
        number: 2,
        clue: "What the map showed that led to treasure",
        answer: "PATH",
        definition: "A way or track made for walking",
        example: "They followed the path through the woods."
      },
      {
        direction: "across",
        number: 3,
        clue: "What Maya and Leo were looking for",
        answer: "TREASURE",
        definition: "A collection of valuable things",
        example: "The pirates buried their treasure on the island."
      },
      {
        direction: "down",
        number: 4,
        clue: "A tool that helps you find direction",
        answer: "COMPASS",
        definition: "A device with a needle that shows which way is north",
        example: "The hiker used a compass to find his way back to camp."
      },
      {
        direction: "across",
        number: 5,
        clue: "Maya and Leo's trip to find the treasure",
        answer: "JOURNEY",
        definition: "Traveling from one place to another, especially over a long distance",
        example: "Their journey to the mountains took three days."
      }
    ]
  },
  "jungle_ep2_puzzle": {
    id: "jungle_ep2_puzzle",
    title: "Jungle Animals",
    size: { width: 10, height: 10 },
    grid: [
      // Grid data would go here
    ],
    words: [
      {
        direction: "across",
        number: 1,
        clue: "A place with many trees and wild animals",
        answer: "JUNGLE",
        definition: "A tropical forest where trees and plants grow very closely together",
        example: "The jungle was full of colorful birds and insects."
      },
      {
        direction: "down",
        number: 2,
        clue: "A big cat with stripes",
        answer: "TIGER",
        definition: "A large wild cat with orange fur and black stripes",
        example: "The tiger silently stalked its prey through the tall grass."
      },
      {
        direction: "across",
        number: 3,
        clue: "The black lines on a tiger's orange fur",
        answer: "STRIPES",
        definition: "Long narrow bands of different color or texture",
        example: "The zebra's black and white stripes help it hide from predators."
      },
      {
        direction: "down",
        number: 4,
        clue: "The loud sound a tiger makes",
        answer: "ROAR",
        definition: "A deep, loud cry made by a lion or other big cat",
        example: "The lion's roar could be heard throughout the savanna."
      },
      {
        direction: "across",
        number: 5,
        clue: "Being full of attention to avoid danger",
        answer: "CAREFUL",
        definition: "Taking care to avoid potential danger, mishap, or harm",
        example: "Be careful when crossing the street."
      }
    ]
  },
  "jungle_ep3_puzzle": {
    id: "jungle_ep3_puzzle",
    title: "River Crossing",
    size: { width: 10, height: 10 },
    grid: [
      // Grid data would go here
    ],
    words: [
      {
        direction: "across",
        number: 1,
        clue: "A large natural stream of water",
        answer: "RIVER",
        definition: "A large natural flow of water that travels through the land",
        example: "They swam in the cool river on the hot summer day."
      },
      {
        direction: "down",
        number: 2,
        clue: "A structure built to cross a river",
        answer: "BRIDGE",
        definition: "A structure that is built over a river, road, or railway to allow people to cross",
        example: "They walked across the bridge to get to the other side of the canyon."
      },
      {
        direction: "across",
        number: 3,
        clue: "Strange marks that might have a meaning",
        answer: "SYMBOLS",
        definition: "Marks or characters that represent something else",
        example: "The ancient cave paintings contained symbols that represented animals and people."
      },
      {
        direction: "down",
        number: 4,
        clue: "How heavy something is",
        answer: "WEIGHT",
        definition: "How heavy a person or thing is",
        example: "The elephant's weight was too much for the small boat to carry."
      },
      {
        direction: "across",
        number: 5,
        clue: "A helpful hint that helps solve a mystery",
        answer: "CLUE",
        definition: "An object or piece of information that helps solve a problem or mystery",
        example: "The detective found an important clue at the scene of the crime."
      }
    ]
  },
  "space_ep1_puzzle": {
    id: "space_ep1_puzzle",
    title: "Space Adventure",
    size: { width: 10, height: 10 },
    grid: [
      // Grid data would go here
    ],
    words: [
      {
        direction: "across",
        number: 1,
        clue: "A school for special training",
        answer: "ACADEMY",
        definition: "A school for special training or a place where special subjects are taught",
        example: "She attended the music academy to learn piano."
      },
      {
        direction: "down",
        number: 2,
        clue: "Large round objects that orbit the sun",
        answer: "PLANETS",
        definition: "Large round objects in space that move around a star",
        example: "Earth is one of eight planets in our solar system."
      },
      {
        direction: "across",
        number: 3,
        clue: "A special task or journey",
        answer: "MISSION",
        definition: "An important task or job that someone is given to do",
        example: "The astronauts' mission was to repair the satellite."
      },
      {
        direction: "down",
        number: 4,
        clue: "Small pieces collected for study",
        answer: "SAMPLES",
        definition: "Small amounts of something that show what the whole is like",
        example: "The scientists collected rock samples from the mountain."
      },
      {
        direction: "across",
        number: 5,
        clue: "Related to the sun",
        answer: "SOLAR",
        definition: "Relating to or determined by the sun",
        example: "The solar panels collect energy from the sun."
      }
    ]
  }
};