import { LevelDefinition, Block } from '../types/GameTypes';

export const MINECRAFT_LEVELS: LevelDefinition[] = [
  {
    id: 'level-1-apple-pie',
    name: 'Apple Pie Adventure',
    description: 'Help the little girl make her apple pie!',
    storyText:
      "Once upon a time, a little girl wanted to bake an apple pie. She needed 6 apples for her recipe. Can you help her gather the apples by farming and building?",
    worldSize: { width: 1200, height: 600 },
    initialBlocks: generateFarmingWorld(1200, 600),
    objectives: [
      {
        type: 'collect',
        target: 'apple',
        description: 'Collect 6 apples to bake the pie',
        completed: false,
        progress: { current: 0, total: 6 },
      },
    ],
    toolsAvailable: ['hand', 'shovel', 'axe'],
    timeLimit: 180, // 3 minutes
    hints: [
      'Look for apple trees in the forest',
      'Use a shovel to dig and plant seeds',
      'Build structures to reach high places',
    ],
  },

  {
    id: 'level-2-letter-hunt',
    name: 'Letter Hunt: HELLO',
    description: 'Dig through the earth to find the letters spelling HELLO',
    storyText:
      'In an ancient cave, scattered letters spell out a magical word. Find all the letters H-E-L-L-O by breaking through stone and dirt!',
    worldSize: { width: 1200, height: 600 },
    initialBlocks: generateLetterMineWorld(1200, 600, 'HELLO'),
    objectives: [
      {
        type: 'collect',
        target: ['H', 'E', 'L', 'L', 'O'],
        description: 'Find all letters to spell HELLO',
        completed: false,
        progress: { current: 0, total: 5 },
      },
    ],
    toolsAvailable: ['hand', 'pickaxe', 'shovel'],
    timeLimit: 120,
    hints: ['Mine the stone to find hidden letters', 'Look at the color clues', 'Some letters need different tools'],
  },

  {
    id: 'level-3-word-builder',
    name: 'Word Builder: GARDEN',
    description: 'Build a garden and spell the word GARDEN with plants',
    storyText:
      'Plant different crops to spell the word GARDEN. Each crop represents a letter. Build the perfect garden layout!',
    worldSize: { width: 1200, height: 600 },
    initialBlocks: generatePlantingWorld(1200, 600),
    objectives: [
      {
        type: 'place',
        target: ['G', 'A', 'R', 'D', 'E', 'N'],
        description: 'Plant flowers to spell GARDEN',
        completed: false,
        progress: { current: 0, total: 6 },
      },
    ],
    toolsAvailable: ['hand', 'shovel'],
    timeLimit: 180,
    hints: ['Different plants look like different letters', 'Use the shovel to plant seeds', 'Plan your garden layout first'],
  },

  {
    id: 'level-4-treasure',
    name: 'Treasure Hunt: GOLD',
    description: 'Navigate through platforms and collect letters spelling GOLD',
    storyText: 'A pirate hid treasures across the islands. Follow the clues and collect the golden letters G-O-L-D!',
    worldSize: { width: 1400, height: 700 },
    initialBlocks: generateTreasureWorld(1400, 700),
    objectives: [
      {
        type: 'collect',
        target: ['G', 'O', 'L', 'D'],
        description: 'Collect golden letters to find the treasure',
        completed: false,
        progress: { current: 0, total: 4 },
      },
    ],
    toolsAvailable: ['hand', 'pickaxe'],
    timeLimit: 180,
    hints: ['Jump carefully across the islands', 'Some letters are hidden in caves', 'Mine the golden blocks to reveal letters'],
  },

  {
    id: 'level-5-reading-quest',
    name: 'Story Reading: The Forest',
    description: 'Read the story and complete the tasks',
    storyText:
      'Deep in the forest, there are 5 different animals. Find and build shelters for a BEAR, DEER, BIRD, WOLF, and FISH. Can you build a home for each one?',
    worldSize: { width: 1200, height: 600 },
    initialBlocks: generateBiomeWorld(1200, 600),
    objectives: [
      {
        type: 'place',
        target: 'bear_shelter',
        description: 'Build a shelter for the BEAR',
        completed: false,
      },
      {
        type: 'place',
        target: 'deer_shelter',
        description: 'Build a shelter for the DEER',
        completed: false,
      },
      {
        type: 'place',
        target: 'bird_shelter',
        description: 'Build a shelter for the BIRD',
        completed: false,
      },
      {
        type: 'place',
        target: 'wolf_shelter',
        description: 'Build a shelter for the WOLF',
        completed: false,
      },
      {
        type: 'place',
        target: 'fish_shelter',
        description: 'Build a shelter for the FISH',
        completed: false,
      },
    ],
    toolsAvailable: ['hand', 'axe', 'shovel'],
    timeLimit: 240,
    hints: ['Different animals need different homes', 'Read the clues carefully', 'Plan before you build'],
  },
];

// World generation functions
function generateFarmingWorld(width: number, height: number): Block[] {
  const blocks: Block[] = [];
  const blockSize = 32;
  const gridWidth = Math.ceil(width / blockSize);
  const gridHeight = Math.ceil(height / blockSize);
  const groundGridY = gridHeight - 4;

  // Create ground layer (grass on top, dirt below)
  for (let gridX = 0; gridX < gridWidth; gridX++) {
    blocks.push({ x: gridX, y: groundGridY, type: 'grass', collected: false });
    blocks.push({ x: gridX, y: groundGridY + 1, type: 'dirt', collected: false });
    blocks.push({ x: gridX, y: groundGridY + 2, type: 'dirt', collected: false });
  }

  // Add trees and apple trees scattered
  for (let i = 0; i < 6; i++) {
    const treeGridX = Math.floor(Math.random() * (gridWidth - 2)) + 1;
    const treeBaseY = groundGridY - 4;

    blocks.push({ x: treeGridX, y: treeBaseY + 3, type: 'wood', collected: false });
    blocks.push({ x: treeGridX, y: treeBaseY + 2, type: 'wood', collected: false });
    blocks.push({ x: treeGridX, y: treeBaseY + 1, type: 'wood', collected: false });
    blocks.push({ x: treeGridX, y: treeBaseY, type: 'wood', collected: false });

    // Leaves at top (rendered as apple)
    blocks.push({ x: treeGridX, y: treeBaseY - 1, type: 'leaves', collected: false });
    blocks.push({ x: treeGridX - 1, y: treeBaseY, type: 'leaves', collected: false });
    blocks.push({ x: treeGridX + 1, y: treeBaseY, type: 'leaves', collected: false });
  }

  return blocks;
}

function generateLetterMineWorld(width: number, height: number, word: string): Block[] {
  const blocks: Block[] = [];
  const blockSize = 32;
  const gridWidth = Math.ceil(width / blockSize);
  const gridHeight = Math.ceil(height / blockSize);
  const groundGridY = gridHeight - 4;

  // Create ground and surrounding stone/dirt
  for (let gridX = 0; gridX < gridWidth; gridX++) {
    blocks.push({ x: gridX, y: groundGridY, type: 'grass', collected: false });
    blocks.push({ x: gridX, y: groundGridY + 1, type: 'dirt', collected: false });
    blocks.push({ x: gridX, y: groundGridY + 2, type: 'dirt', collected: false });
  }

  // Add stone blocks with letters hidden inside
  const stoneStartGridX = Math.floor(gridWidth / 4);
  const stoneStartGridY = groundGridY - 10;

  for (let i = 0; i < word.length; i++) {
    const letterGridX = stoneStartGridX + i * 3;
    const letterGridY = stoneStartGridY + (i % 3);

    // Surround letter with stone blocks
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        blocks.push({
          x: letterGridX + dx,
          y: letterGridY + dy,
          type: 'stone',
          collected: false,
        });
      }
    }
  }

  return blocks;
}

function generatePlantingWorld(width: number, height: number): Block[] {
  const blocks: Block[] = [];
  const blockSize = 32;
  const gridWidth = Math.ceil(width / blockSize);
  const gridHeight = Math.ceil(height / blockSize);
  const groundGridY = gridHeight - 4;

  // Create farmland ground
  for (let gridX = 0; gridX < gridWidth; gridX++) {
    blocks.push({ x: gridX, y: groundGridY, type: 'grass', collected: false });
    blocks.push({ x: gridX, y: groundGridY + 1, type: 'dirt', collected: false });
    blocks.push({ x: gridX, y: groundGridY + 2, type: 'dirt', collected: false });
  }

  return blocks;
}

function generateTreasureWorld(_width: number, height: number): Block[] {
  const blocks: Block[] = [];
  const blockSize = 32;

  // Create island platforms at different heights
  const islands = [
    { gridX: 1, gridY: Math.floor((height - 150) / blockSize), gridW: 10 },
    { gridX: 15, gridY: Math.floor((height - 200) / blockSize), gridW: 8 },
    { gridX: 28, gridY: Math.floor((height - 180) / blockSize), gridW: 9 },
    { gridX: 42, gridY: Math.floor((height - 220) / blockSize), gridW: 5 },
  ];

  islands.forEach(island => {
    for (let gridX = island.gridX; gridX < island.gridX + island.gridW; gridX++) {
      blocks.push({ x: gridX, y: island.gridY, type: 'stone', collected: false });
      blocks.push({ x: gridX, y: island.gridY + 1, type: 'dirt', collected: false });
    }
  });

  // Add gold letter blocks on islands
  blocks.push({ x: 3, y: Math.floor((height - 250) / blockSize), type: 'stone', collected: false });
  blocks.push({ x: 17, y: Math.floor((height - 300) / blockSize), type: 'stone', collected: false });
  blocks.push({ x: 30, y: Math.floor((height - 280) / blockSize), type: 'stone', collected: false });
  blocks.push({ x: 44, y: Math.floor((height - 320) / blockSize), type: 'stone', collected: false });

  return blocks;
}

function generateBiomeWorld(width: number, height: number): Block[] {
  const blocks: Block[] = [];
  const blockSize = 32;
  const gridWidth = Math.ceil(width / blockSize);
  const gridHeight = Math.ceil(height / blockSize);
  const groundGridY = gridHeight - 4;

  // Forest biome with diverse terrain - create ground
  for (let gridX = 0; gridX < gridWidth; gridX++) {
    blocks.push({ x: gridX, y: groundGridY, type: 'grass', collected: false });
    blocks.push({ x: gridX, y: groundGridY + 1, type: 'dirt', collected: false });
    blocks.push({ x: gridX, y: groundGridY + 2, type: 'dirt', collected: false });
  }

  // Add trees for wood
  for (let i = 0; i < 8; i++) {
    const treeGridX = Math.floor(Math.random() * (gridWidth - 2)) + 1;
    const treeBaseGridY = groundGridY - 4;

    blocks.push({ x: treeGridX, y: treeBaseGridY + 2, type: 'wood', collected: false });
    blocks.push({ x: treeGridX, y: treeBaseGridY + 1, type: 'wood', collected: false });
    blocks.push({ x: treeGridX, y: treeBaseGridY, type: 'wood', collected: false });
    blocks.push({ x: treeGridX - 1, y: treeBaseGridY, type: 'leaves', collected: false });
    blocks.push({ x: treeGridX + 1, y: treeBaseGridY, type: 'leaves', collected: false });
  }

  return blocks;
}
