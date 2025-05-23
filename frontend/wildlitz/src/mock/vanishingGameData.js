// src/mock/vanishingGameData.js

/**
 * Mock data for the Vanishing Game
 * Includes word sets, phonics patterns, and difficulty levels
 */

// Phonics patterns reference for teachers
export const PHONICS_PATTERNS = {
    short_vowels: {
      a: {
        description: "The short 'a' sound as in 'cat', 'hat', 'bat'",
        examples: ["cat", "hat", "mat", "bat", "pat", "sad", "bad", "dad", "mad", "rag"]
      },
      e: {
        description: "The short 'e' sound as in 'bed', 'red', 'fed'",
        examples: ["bed", "red", "fed", "led", "wed", "pet", "met", "get", "set", "wet"]
      },
      i: {
        description: "The short 'i' sound as in 'big', 'pig', 'fig'",
        examples: ["big", "pig", "fig", "dig", "wig", "bit", "hit", "sit", "fit", "lit"]
      },
      o: {
        description: "The short 'o' sound as in 'hot', 'pot', 'lot'",
        examples: ["hot", "pot", "lot", "dot", "got", "hop", "mop", "top", "pop", "cop"]
      },
      u: {
        description: "The short 'u' sound as in 'bug', 'mug', 'rug'",
        examples: ["bug", "mug", "rug", "dug", "tug", "but", "cut", "hut", "nut", "shut"]
      }
    },
    long_vowels: {
      a: {
        description: "The long 'a' sound as in 'cake', 'make', 'take'",
        examples: ["cake", "make", "take", "rake", "lake", "made", "fade", "wade", "bake", "sake"]
      },
      e: {
        description: "The long 'e' sound as in 'meet', 'feet', 'peek'",
        examples: ["meet", "feet", "peek", "seek", "week", "keep", "deep", "beep", "sleep", "steep"]
      },
      i: {
        description: "The long 'i' sound as in 'five', 'nine', 'ride'",
        examples: ["five", "nine", "ride", "side", "hide", "bike", "like", "hike", "time", "lime"]
      },
      o: {
        description: "The long 'o' sound as in 'hope', 'rope', 'note'",
        examples: ["hope", "rope", "note", "vote", "tote", "bone", "cone", "tone", "home", "dome"]
      },
      u: {
        description: "The long 'u' sound as in 'cube', 'tube', 'use'",
        examples: ["cube", "tube", "use", "mule", "fume", "cute", "mute", "flute", "rule", "dune"]
      }
    },
    blends: {
      bl: {
        description: "The 'bl' blend as in 'blue', 'black', 'blow'",
        examples: ["blue", "black", "blow", "blade", "block", "blink", "blank", "blend", "blast", "blot"]
      },
      cl: {
        description: "The 'cl' blend as in 'clap', 'cling', 'clock'",
        examples: ["clap", "cling", "clock", "clip", "club", "clam", "clan", "cliff", "class", "clear"]
      },
      fl: {
        description: "The 'fl' blend as in 'fly', 'floor', 'flag'",
        examples: ["fly", "floor", "flag", "flip", "flop", "float", "flow", "flush", "flesh", "flame"]
      },
      gl: {
        description: "The 'gl' blend as in 'glow', 'glad', 'glue'",
        examples: ["glow", "glad", "glue", "glass", "glide", "glob", "gloom", "glare", "glow", "globe"]
      },
      pl: {
        description: "The 'pl' blend as in 'play', 'plus', 'plan'",
        examples: ["play", "plus", "plan", "plate", "plot", "plug", "planet", "plum", "place", "plank"]
      },
      sl: {
        description: "The 'sl' blend as in 'slow', 'sled', 'slip'",
        examples: ["slow", "sled", "slip", "slide", "slam", "slap", "sleep", "slime", "slot", "slice"]
      }
    },
    digraphs: {
      ch: {
        description: "The 'ch' digraph as in 'chat', 'chip', 'chop'",
        examples: ["chat", "chip", "chop", "chin", "chug", "check", "chest", "chain", "champ", "chess"]
      },
      sh: {
        description: "The 'sh' digraph as in 'ship', 'shop', 'shut'",
        examples: ["ship", "shop", "shut", "shed", "shell", "shape", "shade", "shift", "shelf", "shoot"]
      },
      th: {
        description: "The 'th' digraph as in 'thin', 'thick', 'thank'",
        examples: ["thin", "thick", "thank", "think", "thud", "thumb", "thump", "thing", "third", "thrift"]
      },
      wh: {
        description: "The 'wh' digraph as in 'when', 'what', 'which'",
        examples: ["when", "what", "which", "where", "why", "while", "wheel", "whip", "whiff", "whale"]
      },
      ph: {
        description: "The 'ph' digraph as in 'phone', 'photo', 'graph'",
        examples: ["phone", "photo", "graph", "phase", "phrase", "phonics", "physics", "phantom", "dolphin", "elephant"]
      }
    }
  };
  
  // Word sets by challenge level and learning focus
  export const WORD_SETS = {
    simple_words: {
      short_vowels: [
        { word: "cat", pattern: "a", patternPosition: "middle", phonicsRule: "Short vowel 'a' makes the sound like in 'apple'" },
        { word: "bed", pattern: "e", patternPosition: "middle", phonicsRule: "Short vowel 'e' makes the sound like in 'egg'" },
        { word: "pig", pattern: "i", patternPosition: "middle", phonicsRule: "Short vowel 'i' makes the sound like in 'igloo'" },
        { word: "dog", pattern: "o", patternPosition: "middle", phonicsRule: "Short vowel 'o' makes the sound like in 'octopus'" },
        { word: "sun", pattern: "u", patternPosition: "middle", phonicsRule: "Short vowel 'u' makes the sound like in 'umbrella'" },
        { word: "hat", pattern: "a", patternPosition: "middle", phonicsRule: "Short vowel 'a' makes the sound like in 'apple'" },
        { word: "pen", pattern: "e", patternPosition: "middle", phonicsRule: "Short vowel 'e' makes the sound like in 'egg'" },
        { word: "sit", pattern: "i", patternPosition: "middle", phonicsRule: "Short vowel 'i' makes the sound like in 'igloo'" },
        { word: "fox", pattern: "o", patternPosition: "middle", phonicsRule: "Short vowel 'o' makes the sound like in 'octopus'" },
        { word: "bug", pattern: "u", patternPosition: "middle", phonicsRule: "Short vowel 'u' makes the sound like in 'umbrella'" }
      ],
      long_vowels: [
        { word: "cake", pattern: "a", patternPosition: "middle", phonicsRule: "Long vowel 'a' makes the name of the letter, as in 'acorn'" },
        { word: "feet", pattern: "e", patternPosition: "middle", phonicsRule: "Long vowel 'e' makes the name of the letter, as in 'equal'" },
        { word: "bike", pattern: "i", patternPosition: "middle", phonicsRule: "Long vowel 'i' makes the name of the letter, as in 'island'" },
        { word: "rope", pattern: "o", patternPosition: "middle", phonicsRule: "Long vowel 'o' makes the name of the letter, as in 'open'" },
        { word: "tune", pattern: "u", patternPosition: "middle", phonicsRule: "Long vowel 'u' makes the name of the letter, as in 'unicorn'" },
        { word: "game", pattern: "a", patternPosition: "middle", phonicsRule: "Long vowel 'a' makes the name of the letter, as in 'acorn'" },
        { word: "seed", pattern: "e", patternPosition: "middle", phonicsRule: "Long vowel 'e' makes the name of the letter, as in 'equal'" },
        { word: "kite", pattern: "i", patternPosition: "middle", phonicsRule: "Long vowel 'i' makes the name of the letter, as in 'island'" },
        { word: "bone", pattern: "o", patternPosition: "middle", phonicsRule: "Long vowel 'o' makes the name of the letter, as in 'open'" },
        { word: "cute", pattern: "u", patternPosition: "middle", phonicsRule: "Long vowel 'u' makes the name of the letter, as in 'unicorn'" }
      ],
      blends: [
        { word: "stop", pattern: "st", patternPosition: "beginning", phonicsRule: "The blend 'st' combines the 's' and 't' sounds" },
        { word: "frog", pattern: "fr", patternPosition: "beginning", phonicsRule: "The blend 'fr' combines the 'f' and 'r' sounds" },
        { word: "clip", pattern: "cl", patternPosition: "beginning", phonicsRule: "The blend 'cl' combines the 'c' and 'l' sounds" },
        { word: "drop", pattern: "dr", patternPosition: "beginning", phonicsRule: "The blend 'dr' combines the 'd' and 'r' sounds" },
        { word: "snap", pattern: "sn", patternPosition: "beginning", phonicsRule: "The blend 'sn' combines the 's' and 'n' sounds" },
        { word: "flag", pattern: "fl", patternPosition: "beginning", phonicsRule: "The blend 'fl' combines the 'f' and 'l' sounds" },
        { word: "swim", pattern: "sw", patternPosition: "beginning", phonicsRule: "The blend 'sw' combines the 's' and 'w' sounds" },
        { word: "plan", pattern: "pl", patternPosition: "beginning", phonicsRule: "The blend 'pl' combines the 'p' and 'l' sounds" },
        { word: "trip", pattern: "tr", patternPosition: "beginning", phonicsRule: "The blend 'tr' combines the 't' and 'r' sounds" },
        { word: "grab", pattern: "gr", patternPosition: "beginning", phonicsRule: "The blend 'gr' combines the 'g' and 'r' sounds" }
      ],
      digraphs: [
        { word: "shop", pattern: "sh", patternPosition: "beginning", phonicsRule: "The digraph 'sh' makes a single sound like when you say 'shh'" },
        { word: "chip", pattern: "ch", patternPosition: "beginning", phonicsRule: "The digraph 'ch' makes a single sound like in 'choo-choo'" },
        { word: "this", pattern: "th", patternPosition: "beginning", phonicsRule: "The digraph 'th' makes a single sound with your tongue between your teeth" },
        { word: "when", pattern: "wh", patternPosition: "beginning", phonicsRule: "The digraph 'wh' makes a sound like blowing air" },
        { word: "fish", pattern: "sh", patternPosition: "ending", phonicsRule: "The digraph 'sh' makes a single sound like when you say 'shh'" },
        { word: "rich", pattern: "ch", patternPosition: "ending", phonicsRule: "The digraph 'ch' makes a single sound like in 'choo-choo'" },
        { word: "bath", pattern: "th", patternPosition: "ending", phonicsRule: "The digraph 'th' makes a single sound with your tongue between your teeth" },
        { word: "photo", pattern: "ph", patternPosition: "beginning", phonicsRule: "The digraph 'ph' makes the 'f' sound" },
        { word: "shell", pattern: "sh", patternPosition: "beginning", phonicsRule: "The digraph 'sh' makes a single sound like when you say 'shh'" },
        { word: "that", pattern: "th", patternPosition: "beginning", phonicsRule: "The digraph 'th' makes a single sound with your tongue between your teeth" }
      ]
    },
    compound_words: {
      short_vowels: [
        { word: "sunhat", pattern: "u", patternPosition: "first", phonicsRule: "Short vowel 'u' makes the sound like in 'umbrella'" },
        { word: "batbox", pattern: "a", patternPosition: "first", phonicsRule: "Short vowel 'a' makes the sound like in 'apple'" },
        { word: "bedmat", pattern: "e", patternPosition: "first", phonicsRule: "Short vowel 'e' makes the sound like in 'egg'" },
        { word: "pigpen", pattern: "i", patternPosition: "first", phonicsRule: "Short vowel 'i' makes the sound like in 'igloo'" },
        { word: "hotdog", pattern: "o", patternPosition: "first", phonicsRule: "Short vowel 'o' makes the sound like in 'octopus'" }
      ],
      long_vowels: [
        { word: "daytime", pattern: "a", patternPosition: "first", phonicsRule: "Long vowel 'a' makes the name of the letter, as in 'acorn'" },
        { word: "beehive", pattern: "e", patternPosition: "first", phonicsRule: "Long vowel 'e' makes the name of the letter, as in 'equal'" },
        { word: "nightlight", pattern: "i", patternPosition: "first", phonicsRule: "Long vowel 'i' makes the name of the letter, as in 'island'" },
        { word: "snowman", pattern: "o", patternPosition: "first", phonicsRule: "Long vowel 'o' makes the name of the letter, as in 'open'" },
        { word: "bluebird", pattern: "u", patternPosition: "first", phonicsRule: "Long vowel 'u' makes the name of the letter, as in 'unicorn'" }
      ],
      blends: [
        { word: "stopwatch", pattern: "st", patternPosition: "first", phonicsRule: "The blend 'st' combines the 's' and 't' sounds" },
        { word: "frogpond", pattern: "fr", patternPosition: "first", phonicsRule: "The blend 'fr' combines the 'f' and 'r' sounds" },
        { word: "classroom", pattern: "cl", patternPosition: "first", phonicsRule: "The blend 'cl' combines the 'c' and 'l' sounds" },
        { word: "grassland", pattern: "gr", patternPosition: "first", phonicsRule: "The blend 'gr' combines the 'g' and 'r' sounds" },
        { word: "spotlight", pattern: "sp", patternPosition: "first", phonicsRule: "The blend 'sp' combines the 's' and 'p' sounds" }
      ],
      digraphs: [
        { word: "shipyard", pattern: "sh", patternPosition: "first", phonicsRule: "The digraph 'sh' makes a single sound like when you say 'shh'" },
        { word: "checkmark", pattern: "ch", patternPosition: "first", phonicsRule: "The digraph 'ch' makes a single sound like in 'choo-choo'" },
        { word: "thinktank", pattern: "th", patternPosition: "first", phonicsRule: "The digraph 'th' makes a single sound with your tongue between your teeth" },
        { word: "whiteboard", pattern: "wh", patternPosition: "first", phonicsRule: "The digraph 'wh' makes a sound like blowing air" },
        { word: "phonebook", pattern: "ph", patternPosition: "first", phonicsRule: "The digraph 'ph' makes the 'f' sound" }
      ]
    },
    phrases: {
      short_vowels: [
        { word: "red pen", pattern: "e", patternPosition: "first", phonicsRule: "Short vowel 'e' makes the sound like in 'egg'" },
        { word: "big cat", pattern: "i", patternPosition: "first", phonicsRule: "Short vowel 'i' makes the sound like in 'igloo'" },
        { word: "hot sun", pattern: "o", patternPosition: "first", phonicsRule: "Short vowel 'o' makes the sound like in 'octopus'" },
        { word: "fun run", pattern: "u", patternPosition: "first", phonicsRule: "Short vowel 'u' makes the sound like in 'umbrella'" },
        { word: "sad dad", pattern: "a", patternPosition: "first", phonicsRule: "Short vowel 'a' makes the sound like in 'apple'" }
      ],
      long_vowels: [
        { word: "late game", pattern: "a", patternPosition: "first", phonicsRule: "Long vowel 'a' makes the name of the letter, as in 'acorn'" },
        { word: "green tree", pattern: "e", patternPosition: "first", phonicsRule: "Long vowel 'e' makes the name of the letter, as in 'equal'" },
        { word: "night light", pattern: "i", patternPosition: "first", phonicsRule: "Long vowel 'i' makes the name of the letter, as in 'island'" },
        { word: "cold snow", pattern: "o", patternPosition: "first", phonicsRule: "Long vowel 'o' makes the name of the letter, as in 'open'" },
        { word: "cute mule", pattern: "u", patternPosition: "first", phonicsRule: "Long vowel 'u' makes the name of the letter, as in 'unicorn'" }
      ],
      blends: [
        { word: "stop sign", pattern: "st", patternPosition: "first", phonicsRule: "The blend 'st' combines the 's' and 't' sounds" },
        { word: "frog jump", pattern: "fr", patternPosition: "first", phonicsRule: "The blend 'fr' combines the 'f' and 'r' sounds" },
        { word: "blue sky", pattern: "bl", patternPosition: "first", phonicsRule: "The blend 'bl' combines the 'b' and 'l' sounds" },
        { word: "slow train", pattern: "sl", patternPosition: "first", phonicsRule: "The blend 'sl' combines the 's' and 'l' sounds" },
        { word: "great day", pattern: "gr", patternPosition: "first", phonicsRule: "The blend 'gr' combines the 'g' and 'r' sounds" }
      ],
      digraphs: [
        { word: "ship sail", pattern: "sh", patternPosition: "first", phonicsRule: "The digraph 'sh' makes a single sound like when you say 'shh'" },
        { word: "chin up", pattern: "ch", patternPosition: "first", phonicsRule: "The digraph 'ch' makes a single sound like in 'choo-choo'" },
        { word: "thin ice", pattern: "th", patternPosition: "first", phonicsRule: "The digraph 'th' makes a single sound with your tongue between your teeth" },
        { word: "when asked", pattern: "wh", patternPosition: "first", phonicsRule: "The digraph 'wh' makes a sound like blowing air" },
        { word: "phone call", pattern: "ph", patternPosition: "first", phonicsRule: "The digraph 'ph' makes the 'f' sound" }
      ]
    },
    simple_sentences: {
      short_vowels: [
        { word: "The cat sat on the mat.", pattern: "a", patternPosition: "multiple", phonicsRule: "Short vowel 'a' makes the sound like in 'apple'" },
        { word: "The red hen is in the pen.", pattern: "e", patternPosition: "multiple", phonicsRule: "Short vowel 'e' makes the sound like in 'egg'" },
        { word: "Jim did fix his big toy.", pattern: "i", patternPosition: "multiple", phonicsRule: "Short vowel 'i' makes the sound like in 'igloo'" },
        { word: "The dog got on top of the log.", pattern: "o", patternPosition: "multiple", phonicsRule: "Short vowel 'o' makes the sound like in 'octopus'" },
        { word: "The bug hid under the rug.", pattern: "u", patternPosition: "multiple", phonicsRule: "Short vowel 'u' makes the sound like in 'umbrella'" }
      ],
      long_vowels: [
        { word: "Jane made a cake for the game.", pattern: "a", patternPosition: "multiple", phonicsRule: "Long vowel 'a' makes the name of the letter, as in 'acorn'" },
        { word: "We need to feed the sheep.", pattern: "e", patternPosition: "multiple", phonicsRule: "Long vowel 'e' makes the name of the letter, as in 'equal'" },
        { word: "Mike likes to ride his bike.", pattern: "i", patternPosition: "multiple", phonicsRule: "Long vowel 'i' makes the name of the letter, as in 'island'" },
        { word: "Joe goes home to the boat.", pattern: "o", patternPosition: "multiple", phonicsRule: "Long vowel 'o' makes the name of the letter, as in 'open'" },
        { word: "The blue cube is cute.", pattern: "u", patternPosition: "multiple", phonicsRule: "Long vowel 'u' makes the name of the letter, as in 'unicorn'" }
      ],
      blends: [
        { word: "Stop at the black flag.", pattern: "st", patternPosition: "first", phonicsRule: "The blend 'st' combines the 's' and 't' sounds" },
        { word: "The frog jumps from the bridge.", pattern: "fr", patternPosition: "first", phonicsRule: "The blend 'fr' combines the 'f' and 'r' sounds" },
        { word: "Please clean the classroom.", pattern: "cl", patternPosition: "middle", phonicsRule: "The blend 'cl' combines the 'c' and 'l' sounds" },
        { word: "The train slows down the track.", pattern: "tr", patternPosition: "first", phonicsRule: "The blend 'tr' combines the 't' and 'r' sounds" },
        { word: "Grab the green grapes.", pattern: "gr", patternPosition: "multiple", phonicsRule: "The blend 'gr' combines the 'g' and 'r' sounds" }
      ],
      digraphs: [
        { word: "She sells shells by the seashore.", pattern: "sh", patternPosition: "multiple", phonicsRule: "The digraph 'sh' makes a single sound like when you say 'shh'" },
        { word: "The child checks the chicken.", pattern: "ch", patternPosition: "multiple", phonicsRule: "The digraph 'ch' makes a single sound like in 'choo-choo'" },
        { word: "Think about the path.", pattern: "th", patternPosition: "multiple", phonicsRule: "The digraph 'th' makes a single sound with your tongue between your teeth" },
        { word: "Where is the white whale?", pattern: "wh", patternPosition: "multiple", phonicsRule: "The digraph 'wh' makes a sound like blowing air" },
        { word: "The photo is on the phone.", pattern: "ph", patternPosition: "multiple", phonicsRule: "The digraph 'ph' makes the 'f' sound" }
      ]
    }
  };
  
  // Difficulty levels configuration
  export const DIFFICULTY_LEVELS = {
    easy: {
      numAnimals: 6,
      timeLimit: 60,
      soundPositions: ['beginning'],
      vanishSpeed: 5 // seconds
    },
    medium: {
      numAnimals: 8,
      timeLimit: 45,
      soundPositions: ['beginning', 'middle'],
      vanishSpeed: 4 // seconds
    },
    hard: {
      numAnimals: 12,
      timeLimit: 30,
      soundPositions: ['beginning', 'middle', 'ending'],
      vanishSpeed: 3 // seconds
    }
  };
  
  // Environment configurations
  export const ENVIRONMENTS = {
    classroom: {
      name: "Classroom",
      description: "A friendly classroom setting with educational elements",
      backgroundColor: "#e3f2fd",
      themeElements: ["desk", "book", "pencil", "apple", "backpack"]
    },
    jungle: {
      name: "Jungle",
      description: "A wild jungle setting with tropical elements",
      backgroundColor: "#e8f5e9",
      themeElements: ["tree", "vine", "flower", "leaf", "river"]
    },
    ocean: {
      name: "Ocean",
      description: "An underwater ocean setting with marine elements",
      backgroundColor: "#bbdefb",
      themeElements: ["fish", "coral", "bubble", "seaweed", "shell"]
    },
    space: {
      name: "Space",
      description: "An outer space setting with celestial elements",
      backgroundColor: "#e1bee7",
      themeElements: ["star", "planet", "rocket", "alien", "moon"]
    }
  };