# Handgrabber Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     User's Browser                          │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              App.tsx (Main Container)                │  │
│  │                                                      │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │            HomeScreen.tsx                      │ │  │
│  │  │                                                │ │  │
│  │  │  [Tic-Tac-Toe] [Word Runner] [Hand Grabber] ◄─┼─┼──→ CLICK
│  │  │  [Inbox]       [Hangman]     [Users]         │ │  │
│  │  │  ...                                          │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  │                       ▲                              │  │
│  │                       │ Back to Home                 │  │
│  │  ┌────────────────────┴─────────────────────────┐   │  │
│  │  │    AppLauncher.tsx (Router)                  │   │  │
│  │  │                                              │   │  │
│  │  │  switch(app.id) {                           │   │  │
│  │  │    case 'wordrunner': → <WordRunner />      │   │  │
│  │  │    case 'handgrabber': → <Handgrabber />  │◄──┼──┼─ Route
│  │  │    case 'inbox': → <Inbox />               │   │  │
│  │  │    ...                                      │   │  │
│  │  │  }                                          │   │  │
│  │  └──────────────────┬──────────────────────────┘   │  │
│  │                     │ Render selected game         │  │
│  │  ┌──────────────────▼──────────────────────────┐   │  │
│  │  │   Handgrabber.tsx (Game Engine)             │   │  │
│  │  │                                              │   │  │
│  │  │  ┌────────────────────────────────────────┐ │   │  │
│  │  │  │ Level Loader                           │ │   │  │
│  │  │  │ ├─ Detect /HandGrabber/Levels/001     │ │   │  │
│  │  │  │ ├─ Load 5 PNG images in parallel      │ │   │  │
│  │  │  │ ├─ Parse folder numbers (001, 002...)│ │   │  │
│  │  │  │ └─ Report status to UI                │ │   │  │
│  │  │  └────────────────────────────────────────┘ │   │  │
│  │  │                                              │   │  │
│  │  │  ┌────────────────────────────────────────┐ │   │  │
│  │  │  │ Canvas Renderer                        │ │   │  │
│  │  │  │ ├─ requestAnimationFrame loop (60fps) │ │   │  │
│  │  │  │ ├─ Scale images to fit screen         │ │   │  │
│  │  │  │ ├─ Draw base.png                      │ │   │  │
│  │  │  │ ├─ Draw collect.png overlay           │ │   │  │
│  │  │  │ ├─ Draw arm + hand                    │ │   │  │
│  │  │  │ └─ Draw win/lose overlay              │ │   │  │
│  │  │  └────────────────────────────────────────┘ │   │  │
│  │  │                                              │   │  │
│  │  │  ┌────────────────────────────────────────┐ │   │  │
│  │  │  │ Input Handler                         │ │   │  │
│  │  │  │ ├─ Listen to pointer/touch events    │ │   │  │
│  │  │  │ ├─ Convert screen → level coords    │ │   │  │
│  │  │  │ └─ Update pointer position           │ │   │  │
│  │  │  └────────────────────────────────────────┘ │   │  │
│  │  │                                              │   │  │
│  │  │  ┌────────────────────────────────────────┐ │   │  │
│  │  │  │ Collision Detection                   │ │   │  │
│  │  │  │ ├─ Sample arm path (20 points)       │ │   │  │
│  │  │  │ ├─ Read pixel from color.png         │ │   │  │
│  │  │  │ ├─ Green (0,255,0) → WIN            │ │   │  │
│  │  │  │ ├─ Blue (0,0,255) → LOSE            │ │   │  │
│  │  │  │ └─ White (255,255,255) → SAFE       │ │   │  │
│  │  │  └────────────────────────────────────────┘ │   │  │
│  │  │                                              │   │  │
│  │  │  ┌────────────────────────────────────────┐ │   │  │
│  │  │  │ UI State (Buttons, Overlays)          │ │   │  │
│  │  │  │ ├─ Playing: Show arm + instructions  │ │   │  │
│  │  │  │ ├─ Won: Show win.png + Next button   │ │   │  │
│  │  │  │ └─ Lost: Show lose.png + Retry btn  │ │   │  │
│  │  │  └────────────────────────────────────────┘ │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         │
         │ Loads images from
         ▼
┌─────────────────────────────────────────────────────────────┐
│              Firebase Cloud Storage / Public                │
│                                                             │
│  /HandGrabber/Levels/001/                                 │
│  ├─ base.png (800×600) ←─────────┐                        │
│  ├─ collect.png (800×600) ◄──────┼─ Same dimensions       │
│  ├─ color.png (800×600) ◄────────┤ (logic map)            │
│  ├─ win.png (800×600) ◄──────────┤                        │
│  └─ lose.png (800×600) ◄─────────┘                        │
│                                                             │
│  /HandGrabber/Levels/002/                                 │
│  ├─ base.png                                              │
│  ├─ collect.png                                           │
│  ├─ color.png                                             │
│  ├─ win.png                                               │
│  └─ lose.png                                              │
│                                                             │
│  /HandGrabber/Levels/003/                                 │
│  └─ ...                                                   │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow (One Frame)

```
┌─────────────────┐
│  Pointer Event  │  ← User moves mouse/finger
│  (x, y)         │
└────────┬────────┘
         │
         ▼
┌──────────────────────────┐
│ Canvas to Level Coords   │  Convert screen pixels to
│ screenToLevelCoords()    │  level coordinate space
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Arm Path Calculation     │  Line from shoulder (top-center)
│ (startX, startY)         │  to pointer position
│ → (pointerX, pointerY)   │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Collision Detection (20x)    │  Sample 20 points along arm
│ for t in [0, 1] by 0.05      │  Check color at each point
│   getColorAtPoint(lerp(t))   │
└────────┬─────────────────────┘
         │
    ┌────┴─────┬──────────┐
    │           │          │
    ▼           ▼          ▼
  BLUE        GREEN       WHITE
  (fail)      (goal)      (safe)
    │           │          │
    └───┬───┬───┘          │
        │   │              │
        ▼   ▼              │
    gamePhase.LOST    gamePhase.WON
        │               │
        │               │
        └─────┬─────────┘
              │
              ▼
    ┌─────────────────────────┐
    │ Render Frame            │
    │ 1. Clear canvas         │
    │ 2. Draw base.png        │
    │ 3. Draw collect.png     │
    │ 4. Draw arm + hand      │
    │ 5. Draw overlay (if won)│
    └─────────────────────────┘
              │
              ▼
    ┌─────────────────────────┐
    │ Display on Screen       │
    │ (requestAnimationFrame) │
    └─────────────────────────┘
```

## File Integration Map

```
src/
├── data/
│   └── apps.tsx ◄──── Add 'handgrabber' app entry
│                       Import Hand icon
│
├── components/
│   ├── AppLauncher.tsx ◄──── Import Handgrabber
│   │                         Add routing case
│   │
│   └── Handgrabber.tsx ◄────── NEW: Full game implementation
│                               461 lines, self-contained
│
└── [other components unchanged]

HandGrabber/
└── Levels/
    ├── 001/ ◄────── Already exists with 5 images
    │   ├── base.png
    │   ├── collect.png
    │   ├── color.png
    │   ├── win.png
    │   └── lose.png
    │
    ├── 002/ ◄────── Auto-detected when created
    │   └── [5 images]
    │
    └── 003/ ◄────── Auto-detected when created
        └── [5 images]

Public/
├── HANDGRABBER-GUIDE.md ◄─────── User documentation
├── COLOR-MAP-GUIDE.md ◄────────── Image creation guide
├── IMPLEMENTATION-SUMMARY.md ◄─── Technical details
├── HANDGRABBER-QUICK-START.md ◄─ Quick reference
├── FEATURE-CHECKLIST.md ◄─────── Feature verification
└── CHANGES.md ◄─────────────────── Change log
```

## State Transitions

```
┌──────────────┐
│              │
│  GameStart   │
│              │
└──────┬───────┘
       │
       │ Level loads
       │ All images ready
       │
       ▼
┌──────────────────┐
│                  │
│    PLAYING       │◄─────┐
│ (Arm follows)    │      │
│                  │      │ Retry button
└──────┬───┬───────┘      │
       │   │              │
    Blue Green            │
    touch touch           │
       │   │              │
       │   └──────────┐   │
       │              │   │
       ▼              ▼   │
    ┌──────┐    ┌──────┐  │
    │ LOST │    │ WON  │  │
    │      │    │      │  │
    └──┬───┘    └───┬──┘  │
       │            │     │
       │            └─────┤ Next Level
       │                  │ (if more levels)
       └──────────────────┘
              │
              │ Back to Home
              ▼
        ┌──────────────┐
        │ HomeScreen   │
        └──────────────┘
```

## Color Sampling Flow

```
┌─────────────────────────────────┐
│ Arm Path: (startX, startY) →    │
│           (endX, endY)           │
└────────────┬────────────────────┘
             │
             │ For each of 20 samples
             │
    ┌────────▼────────┐
    │ Calculate point │
    │ along line      │
    │ t = 0.0, 0.05,  │
    │ 0.10, ..., 1.0  │
    └────────┬────────┘
             │
    ┌────────▼────────────┐
    │ Level coords:       │
    │ (startX +           │
    │  t * (endX-startX), │
    │  startY +           │
    │  t * (endY-startY)) │
    └────────┬────────────┘
             │
    ┌────────▼───────────────┐
    │ Read pixel from        │
    │ color.png at (x, y)    │
    │                        │
    │ Create temp canvas     │
    │ Draw color.png to it   │
    │ getImageData(x, y, 1,1)│
    │ Extract [r, g, b]      │
    └────────┬───────────────┘
             │
    ┌────────▼────────────────┐
    │ Check color:            │
    │                         │
    │ if g > 200 && r<100 &&  │
    │    b < 100 → GOAL HIT   │
    │                         │
    │ if b > 200 && r<100 &&  │
    │    g < 100 → FAIL HIT   │
    │                         │
    │ else → CONTINUE         │
    └─────────────────────────┘
```

## Rendering Pipeline

```
Each Frame (60fps):

┌─────────────────────┐
│ requestAnimationFrame│
└──────────┬──────────┘
           │
    ┌──────▼──────┐
    │ Clear canvas│ ctx.fillStyle = '#000000'
    │ (black)     │ ctx.fillRect(0, 0, w, h)
    └──────┬──────┘
           │
    ┌──────▼──────────────┐
    │ Save canvas state   │ ctx.save()
    │ Apply transforms:   │ ctx.translate(offsetX, offsetY)
    │ - translate offset  │ ctx.scale(scale, scale)
    │ - scale to fit      │
    └──────┬──────────────┘
           │
    ┌──────▼───────────┐
    │ Draw base.png    │ Preloaded HTMLImageElement
    │ (background)     │
    └──────┬───────────┘
           │
    ┌──────▼────────────┐
    │ Draw collect.png  │ Overlay graphics
    │ (overlay)         │
    └──────┬────────────┘
           │
    ┌──────▼────────────────┐
    │ If PLAYING phase:    │
    │ - Draw arm (line)    │
    │ - Draw hand (circle) │
    │ - Draw shoulder (dot)│
    └──────┬────────────────┘
           │
    ┌──────▼────────────────┐
    │ If WON phase:        │
    │ Draw win.png overlay │ Semitransparent
    └──────┬────────────────┘
           │
    ┌──────▼────────────────┐
    │ If LOST phase:       │
    │ Draw lose.png overlay│ Semitransparent
    └──────┬────────────────┘
           │
    ┌──────▼──────────┐
    │ Restore canvas  │ ctx.restore()
    │ state           │
    └──────┬──────────┘
           │
    ┌──────▼──────────────┐
    │ Display rendered    │ Browser composites
    │ frame on screen     │ to actual display
    └─────────────────────┘
```

---

This architecture ensures:
- **Modularity** - Each component has a single responsibility
- **Scalability** - Add levels without code changes
- **Performance** - Efficient rendering and collision detection
- **Maintainability** - Clear separation of concerns
- **Extensibility** - Easy to add features (sound, physics, etc.)
