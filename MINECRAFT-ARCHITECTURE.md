# 🎮 Minecraft 2D Game - Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         App Launcher (React)                        │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  AppLauncher.tsx - Routes apps to components               │   │
│  │  - Checks app.id === 'minecraft'                           │   │
│  │  - Renders: <MinecraftGame onClose={onClose} />            │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    MinecraftGame.tsx (Main)                         │
│                                                                      │
│  • Canvas setup & sizing                                            │
│  • Game loop (requestAnimationFrame)                                │
│  • Input handling (keyboard, mouse)                                 │
│  • Rendering (draw to canvas)                                       │
│  • Level progression                                                │
└─────────────────────────────────────────────────────────────────────┘
                   │                          │
                   ▼                          ▼
        ┌──────────────────┐      ┌──────────────────────┐
        │  useGameState    │      │   LevelStory.tsx     │
        │  (Custom Hook)   │      │   UI Component       │
        │                  │      │                      │
        │ • Initializes    │      │ • Story screen       │
        │   GameEngine     │      │ • Objectives         │
        │ • Manages state  │      │ • Hints              │
        │ • Action         │      │ • Start button       │
        │   callbacks      │      │                      │
        └──────────────────┘      └──────────────────────┘
                   │
                   ▼
        ┌──────────────────────────────────────────────┐
        │       GameEngine (Core Logic)                │
        │                                              │
        │  ┌────────────────────────────────────────┐ │
        │  │ State Management                       │ │
        │  │ - Player object                        │ │
        │  │ - Block grid                           │ │
        │  │ - Inventory items                      │ │
        │  │ - Objectives progress                  │ │
        │  │ - Particles                            │ │
        │  └────────────────────────────────────────┘ │
        │                                              │
        │  ┌────────────────────────────────────────┐ │
        │  │ Physics Engine                         │ │
        │  │ - Gravity (0.6 px/frame²)              │ │
        │  │ - Jump force (-12 px/frame)            │ │
        │  │ - Velocity calculations                │ │
        │  │ - Collision detection                  │ │
        │  │ - Block interaction bounds             │ │
        │  └────────────────────────────────────────┘ │
        │                                              │
        │  ┌────────────────────────────────────────┐ │
        │  │ Game Mechanics                         │ │
        │  │ - breakBlock()                         │ │
        │  │ - placeBlock()                         │ │
        │  │ - selectTool()                         │ │
        │  │ - updateObjectives()                   │ │
        │  │ - spawnParticle()                      │ │
        │  └────────────────────────────────────────┘ │
        │                                              │
        └──────────────────────────────────────────────┘
                   │
         ┌─────────┴──────────┐
         ▼                    ▼
    ┌─────────────┐   ┌──────────────────┐
    │ GameTypes   │   │ levelDefinitions │
    │ (TypeScript)│   │ (5 Levels)       │
    │             │   │                  │
    │ • Block     │   │ • Apple Pie      │
    │ • Player    │   │ • Letter Hunt    │
    │ • Particle  │   │ • Word Builder   │
    │ • GameState │   │ • Treasure Hunt  │
    │             │   │ • Forest Friends │
    └─────────────┘   └──────────────────┘
                             │
                             ▼
                   ┌──────────────────┐
                   │ World Generation │
                   │                  │
                   │ Functions create │
                   │ block grids for  │
                   │ each level       │
                   └──────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                          UI Components                               │
│                                                                      │
│  ┌──────────────┐              ┌──────────────────┐                │
│  │   HUD.tsx    │              │  LevelStory.tsx  │                │
│  │              │              │                  │                │
│  │ • Score      │              │ • Story text     │                │
│  │ • Time       │              │ • Objectives     │                │
│  │ • Objectives │              │ • Hints          │                │
│  │ • Inventory  │              │ • Buttons        │                │
│  │ • Tools      │              │                  │                │
│  │ • Controls   │              │                  │                │
│  └──────────────┘              └──────────────────┘                │
│                                                                      │
│  Render as overlays on canvas using fixed positioning              │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
                        ┌─────────────────┐
                        │   Input Events  │
                        │ (Keyboard/Mouse)│
                        └────────┬────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
            ┌──────────────┐          ┌──────────────┐
            │ Movement     │          │ Block Action │
            │ (A/D, Space) │          │ (Click)      │
            └────────┬─────┘          └────────┬─────┘
                     │                         │
                     ▼                         ▼
         ┌─────────────────────┐   ┌─────────────────────┐
         │ setPlayerMovement() │   │ breakBlock()        │
         │ jump()              │   │ placeBlock()        │
         └──────────┬──────────┘   └──────────┬──────────┘
                    │                         │
                    └────────┬────────────────┘
                             │
                        ┌────▼────────┐
                        │   update()  │
                        │  (physics)  │
                        └────┬────────┘
                             │
                ┌────────────┬────────────┐
                ▼            ▼            ▼
          ┌─────────┐  ┌─────────┐  ┌──────────┐
          │Movement │  │Collision│  │Objective │
          │Physics  │  │Detect   │  │Track     │
          └────┬────┘  └────┬────┘  └────┬─────┘
               │             │            │
               └─────────────┼────────────┘
                             │
                        ┌────▼───────┐
                        │ GameState  │
                        │  Updated   │
                        └────┬───────┘
                             │
                        ┌────▼────────┐
                        │   Draw()    │
                        │  (Render)   │
                        └────┬────────┘
                             │
                        ┌────▼────────┐
                        │   Canvas    │
                        │  Updated    │
                        └────────────┘
```

## File Dependency Graph

```
MinecraftGame.tsx
├── imports GameEngine.ts
│   ├── imports GameTypes.ts
│   ├── imports levelDefinitions.ts
│   │   └── imports GameTypes.ts
│   └── uses Block, Player, GameState types
├── imports useGameState.ts
│   └── imports GameEngine.ts
├── imports HUD.tsx
│   └── imports GameTypes.ts
├── imports LevelStory.tsx
│   └── imports GameTypes.ts
└── imports levelDefinitions.ts

AppLauncher.tsx
└── imports MinecraftGame.tsx

apps.tsx
└── (no imports, data only)
```

## Game Loop Flow

```
┌─────────────────────────────────────────────┐
│  requestAnimationFrame(gameLoop)            │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │ Input Processing                     │   │
│  │ - Read keysPressed ref               │   │
│  │ - Call handleSetMovement/Jump        │   │
│  └──────────────────┬───────────────────┘   │
│                     ▼                       │
│  ┌──────────────────────────────────────┐   │
│  │ Update Game State                    │   │
│  │ - updateGame() called                │   │
│  │ - Physics simulated (1/60s)          │   │
│  │ - Collision detected                 │   │
│  │ - Objectives checked                 │   │
│  └──────────────────┬───────────────────┘   │
│                     ▼                       │
│  ┌──────────────────────────────────────┐   │
│  │ Render to Canvas                     │   │
│  │ - Clear canvas                       │   │
│  │ - Draw blocks                        │   │
│  │ - Draw player                        │   │
│  │ - Draw particles                     │   │
│  │ - Set canvas.width/height            │   │
│  └──────────────────┬───────────────────┘   │
│                     ▼                       │
│  ┌──────────────────────────────────────┐   │
│  │ Next Frame                           │   │
│  │ - React state update triggered       │   │
│  │ - Component re-renders (UI only)     │   │
│  └──────────────────────────────────────┘   │
│                     │                       │
│                     └─► (repeat at 60fps)   │
└─────────────────────────────────────────────┘
```

## Block System

```
Block Grid (Example 1200×600 world)
┌─────────────────────────────────────────────────────────────────┐
│ Each block is BLOCK_SIZE (32px) in both directions              │
│                                                                  │
│  Grid position (0,0) ──► Pixel position (0,0)                  │
│  Grid position (10,5) ──► Pixel position (320,160)             │
│                                                                  │
│  Collision bounds:                                              │
│  Block at grid (x,y) occupies pixel area:                      │
│  [x*32, y*32] to [(x+1)*32, (y+1)*32]                         │
└─────────────────────────────────────────────────────────────────┘

Block Types Available:
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  'dirt'   → Brown (#8B6F47)    | Broken by hand/shovel         │
│  'grass'  → Green (#5D9B35)    | Broken by hand/shovel         │
│  'stone'  → Gray (#A0A0A0)     | Broken by pickaxe             │
│  'wood'   → Brown (#6B4423)    | Broken by axe                 │
│  'leaves' → Dark green (#2D8F2D) | Broken by axe/hand          │
│  'letter' → Gold (#FFD700)     | Special letter blocks         │
│  'apple'  → Red (#FF4444)      | Collectible items             │
│  'air'    → Transparent        | Empty space (not rendered)    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Performance Breakdown

```
Frame Time Budget: 16.67ms (for 60 FPS)

Typical Frame (Desktop):
├─ Input handling: <1ms
├─ Physics update: <2ms
│  ├─ Player movement
│  ├─ Gravity application
│  └─ Collision detection (all blocks)
├─ Particle update: <1ms
├─ Objective checking: <1ms
├─ Canvas rendering: <5ms
│  ├─ Clear canvas
│  ├─ Draw sky gradient
│  ├─ Draw all blocks
│  ├─ Draw player
│  └─ Draw particles
└─ React state update: <5ms
   └─ UI component re-render

Total: ~15ms ✅ (smooth 60fps)
```

## Level Progression Tree

```
                         ┌─ Not Started
                         │
Start App ──────────────┤
                         │
                         └─ Read Story

                              │
                              ▼
                         Play Level 1
                    Apple Pie Adventure
                              │
                    ┌─────────┴─────────┐
                    │                   │
            Complete ✅            Incomplete ❌
                    │                   │
                    ▼                   ▼
            Play Level 2          Play Again 🔄
          Letter Hunt HELLO
                    │
            ┌───────┴───────┐
            │               │
        Complete ✅    Incomplete ❌
            │               │
            ▼               ▼
        Play Level 3    Play Again
    Word Builder GARDEN
            │
        ┌───┴───┐
        │       │
    Complete Incomplete
        │       │
        ▼       ▼
    Level 4    Retry
  Treasure Hunt
        │
    ┌───┴───┐
    │       │
Complete Incomplete
    │       │
    ▼       ▼
  Level 5  Retry
 Forest Friends
    │
┌───┴────┐
│        │
Complete Incomplete
│        │
▼        ▼
END  Play Again
```

---

This comprehensive architecture enables:
- ✅ Smooth 60 FPS gameplay
- ✅ Responsive input handling
- ✅ Efficient state management
- ✅ Clear separation of concerns
- ✅ Easy extensibility for new features
