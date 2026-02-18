# How to Add New Levels to Minecraft Game

## Quick Reference

### 1. Add Level Definition
Edit `src/components/Minecraft/levels/levelDefinitions.ts`:

```typescript
{
  id: 'level-6-my-level',
  name: 'My New Level',
  description: 'Description shown in launcher',
  storyText: 'The narrative players read before starting',
  worldSize: { width: 1200, height: 600 },
  initialBlocks: generateMyWorld(1200, 600),
  objectives: [
    {
      type: 'collect', // or 'place', 'read', 'sequence'
      target: 'apple',
      description: 'Collect 5 apples',
      completed: false,
      progress: { current: 0, total: 5 },
    }
  ],
  toolsAvailable: ['hand', 'pickaxe', 'axe', 'shovel'],
  timeLimit: 180, // optional, in seconds
  hints: [
    'Look for trees',
    'Use the axe on wood',
  ],
}
```

### 2. Create World Generation Function

```typescript
function generateMyWorld(width: number, height: number) {
  const blocks = [];
  const blockWidth = 32;
  const groundY = height - 100;

  // Create ground layer
  for (let x = 0; x < width; x += blockWidth) {
    blocks.push({ 
      x: x / blockWidth, 
      y: groundY / blockWidth, 
      type: 'grass', 
      collected: false 
    });
    blocks.push({ 
      x: x / blockWidth, 
      y: groundY / blockWidth + 1, 
      type: 'dirt', 
      collected: false 
    });
  }

  // Add custom structures, items, enemies, etc.
  // Example: Create a pyramid of blocks
  for (let layer = 0; layer < 5; layer++) {
    for (let i = 0; i < 5 - layer; i++) {
      blocks.push({
        x: (width / 2 / blockWidth) + i + layer,
        y: (groundY / blockWidth) - layer,
        type: 'stone',
        collected: false
      });
    }
  }

  return blocks;
}
```

### 3. Block Coordinate System
```
Grid coordinates: (x, y) where each cell is BLOCK_SIZE (32px)
- x increases to the right
- y increases downward
- Ground is typically at y = (height - 100) / BLOCK_SIZE

Example: Block at grid position (10, 15) renders at pixel position (320, 480)
```

## Objective Types

### Collect
Find and gather items:
```typescript
{
  type: 'collect',
  target: 'apple',
  description: 'Collect 6 apples',
  completed: false,
  progress: { current: 0, total: 6 }
}
```

### Place
Build or place blocks:
```typescript
{
  type: 'place',
  target: 'wood_shelter',
  description: 'Build a wooden shelter',
  completed: false
}
```

### Read
Complete story-based challenges:
```typescript
{
  type: 'read',
  target: 'understand_story',
  description: 'Read and understand the tale',
  completed: false
}
```

### Sequence
Perform actions in specific order:
```typescript
{
  type: 'sequence',
  target: ['dig', 'plant', 'water', 'harvest'],
  description: 'Follow the steps to farm',
  completed: false
}
```

## Block Types Available

```typescript
'dirt'    - Brown soil block
'grass'   - Green grass block
'stone'   - Gray stone block (needs pickaxe)
'wood'    - Brown wood (needs axe)
'leaves'  - Green leaf block (needs axe/hand)
'letter'  - Special block with letter (render custom)
'apple'   - Fruit block (collectible)
'air'     - Empty space (transparent)
```

## Tool System

Each tool breaks specific blocks:
```typescript
{
  hand:     ['dirt', 'leaves'],
  axe:      ['wood', 'leaves'],
  pickaxe:  ['stone'],
  shovel:   ['dirt', 'grass']
}
```

Extend in `GameEngine.ts` `breakBlock()` method:
```typescript
const toolBlockMatchMap: Record<string, string[]> = {
  hand: ['dirt', 'leaves', 'flower'],      // Add new block
  axe: ['wood', 'leaves', 'furniture'],     
  pickaxe: ['stone', 'gold', 'diamond'],    // Add rare blocks
  shovel: ['dirt', 'grass', 'sand'],
};
```

## Example: Letter-Based Level

```typescript
{
  id: 'level-spelling-cat',
  name: 'Spell CAT',
  description: 'Find letters to spell CAT',
  storyText: 'A curious cat is hiding! Find the letters C-A-T to reveal its secret.',
  worldSize: { width: 1200, height: 600 },
  initialBlocks: generateLetterWorld(1200, 600, 'CAT'),
  objectives: [
    {
      type: 'collect',
      target: ['C', 'A', 'T'],
      description: 'Find letters: C, A, T',
      completed: false,
      progress: { current: 0, total: 3 }
    }
  ],
  toolsAvailable: ['hand', 'pickaxe'],
  hints: ['Break the stone blocks', 'Each stone hides a letter']
}
```

Then create the world generator:
```typescript
function generateLetterWorld(width: number, height: number, word: string) {
  const blocks = [];
  const groundY = height - 100;

  // Ground layer
  for (let x = 0; x < width; x += 32) {
    blocks.push({ x: x/32, y: groundY/32, type: 'grass', collected: false });
  }

  // Hide letters in stone
  const letters = word.split('');
  letters.forEach((letter, i) => {
    const x = (width / 4) + (i * 100);
    const y = groundY - 100;
    
    // Surround with stone to hide
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        blocks.push({
          x: x/32 + dx,
          y: y/32 + dy,
          type: 'stone',
          collected: false,
          // Could extend to store letter data
        });
      }
    }
  });

  return blocks;
}
```

## Example: Farming Level

```typescript
{
  id: 'level-grow-corn',
  name: 'Grow Corn',
  description: 'Plant and grow 5 corn plants',
  storyText: 'The farmer needs help! Plant 5 corn seeds to grow a healthy crop.',
  worldSize: { width: 1200, height: 600 },
  initialBlocks: generateFarmland(1200, 600),
  objectives: [
    {
      type: 'place',
      target: 'corn_plant',
      description: 'Plant 5 corn seeds',
      completed: false,
      progress: { current: 0, total: 5 }
    }
  ],
  toolsAvailable: ['hand', 'shovel'],
  hints: ['Use shovel to prepare soil', 'Place seeds in farmland']
}
```

## Tips for Level Design

1. **Pacing**: Make early objectives easy, later ones harder
2. **Exploration**: Place items strategically to encourage exploration
3. **Storytelling**: Use narrative to create emotional connection
4. **Hints**: Provide 3+ hints for difficult levels
5. **Balance**: Mix different objective types
6. **Reachability**: Ensure all items are within reach (distance ≤ 3 blocks)
7. **Resources**: Provide enough blocks/items to complete objectives
8. **Time**: Adjust `timeLimit` based on level complexity

## Testing Your Level

1. Update `levelId` in MinecraftGame.tsx:
```typescript
const [currentLevelIndex, setCurrentLevelIndex] = useState(
  Math.max(0, MINECRAFT_LEVELS.findIndex(l => l.id === 'your-new-level'))
);
```

2. Run the game: `npm run dev`
3. Test all objectives
4. Verify tools work on intended blocks
5. Ensure story is clear and engaging

## Common Patterns

### Multi-Part Objectives
```typescript
objectives: [
  { type: 'collect', target: 'wood', description: 'Gather 10 wood', ... },
  { type: 'place', target: 'shelter', description: 'Build a shelter', ... },
  { type: 'collect', target: 'food', description: 'Collect food', ... }
]
```

### Cascading Challenges
```typescript
// Level forces player to: mine stone → craft tools → mine deeper
objectives: [
  { target: 'stone', description: 'Collect 5 stone' },
  { target: 'pickaxe', description: 'Craft a pickaxe' },
  { target: 'diamond', description: 'Mine deep diamonds' }
]
```

### Story-Driven
```typescript
storyText: `
Once upon a time, there was a kingdom in danger.
The ancient dragon hid treasures in three caves.
Find the three golden keys: KEY1, KEY2, KEY3.
Only then can you save the kingdom!
`
```

## Modifying Game Engine

To add new block types or mechanics, edit `src/components/Minecraft/GameEngine.ts`:

```typescript
// Add new tool matching
toolBlockMatchMap['drill'] = ['hardstone', 'crystal'];

// Add custom block interaction
if (block.type === 'portal') {
  this.teleportPlayer(block.x, block.y);
}
```

Happy level designing! 🎮
