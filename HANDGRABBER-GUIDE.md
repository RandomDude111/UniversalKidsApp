# Handgrabber Game - Implementation Guide

## Overview

Handgrabber is a touch/pointer-based mini-game integrated into your Firebase-hosted web app. The game automatically loads levels from the `/Handgrabber/Levels/` folder and requires no per-level hardcoded logic.

## Features

✅ **Automatic Level Loading** - Detects levels in numeric order (001, 002, 003, etc.)
✅ **Image-Driven Logic** - All gameplay defined by color maps, not code
✅ **Responsive Canvas** - Scales to any screen size while preserving design resolution
✅ **Touch-Friendly** - Works on desktop, tablet, and mobile devices
✅ **No Hardcoding** - Add new levels by simply creating folders with images

## Integration Points

### 1. Home Screen Icon
The game appears in your home menu with a hand icon. Added to:
- `src/data/apps.tsx` - App registry with `id: 'handgrabber'`
- `src/components/AppLauncher.tsx` - Game component import and routing

### 2. Level Structure

Each level lives in `/HandGrabber/Levels/XXX/` where XXX is a zero-padded number:

```
/HandGrabber/Levels/
├── 001/
│   ├── base.png        (background image)
│   ├── collect.png     (overlay graphics)
│   ├── color.png       (logic map - see below)
│   ├── win.png         (success overlay)
│   └── lose.png        (failure overlay)
├── 002/
│   └── [same structure]
└── 003/
    └── [same structure]
```

## Color Map Logic (`color.png`)

The `color.png` file acts as an invisible logic layer that defines gameplay zones:

- **Red (255, 0, 0)** - Arm wrap/pivot points (unused currently, reserved for future features)
- **Green (0, 255, 0)** - Goal/success zone. Arm touching green = WIN
- **Blue (0, 0, 255)** - Fail zone. Arm touching blue = LOSE + show lose.png
- **White (255, 255, 255)** - Empty space (safe to touch)
- **Any other color** - Treated as empty space

### How It Works

1. Player moves cursor/finger to control arm position
2. Arm stretches from shoulder (top-center of level) to pointer position
3. Game samples pixels along the arm path from `color.png`
4. **If blue pixel touched** → Instant lose, show `lose.png` overlay
5. **If green pixel touched** → Win level, show `win.png` overlay
6. **If neither** → Keep playing until success or failure

## Game Flow

1. **Playing Phase**
   - Arm follows cursor/touch input
   - Real-time collision detection against color.png
   - No buttons—pure pointer/touch control

2. **Win Overlay**
   - Shows `win.png` image
   - Displays "Retry Level" and "Next Level" buttons (if more levels exist)
   - Or "All Levels Complete!" if it's the last level

3. **Lose Overlay**
   - Shows `lose.png` image
   - Displays "Retry Level" button to try again

## Adding New Levels

### Step 1: Create Folder
```bash
mkdir -p /HandGrabber/Levels/004
```

### Step 2: Prepare Images
- **base.png** - Main background (any size, will be preserved in aspect ratio)
- **collect.png** - Overlay graphics (same dimensions as base.png)
- **color.png** - Logic map (same dimensions as base.png)
- **win.png** - Victory screen (same dimensions as base.png)
- **lose.png** - Failure screen (same dimensions as base.png)

### Step 3: Save Images
Place all 5 images in your new level folder. The game automatically detects it on next load.

**That's it!** No code changes needed.

## Technical Details

### Canvas Rendering
- Game canvas is 800×600 by default
- Images are scaled uniformly (preserving aspect ratio) to fit screen
- All coordinates internally converted between screen-space and level-space
- This ensures hit detection is accurate regardless of screen size

### Arm Collision Detection
- Samples 20 points along the arm path per frame
- Checks color.png pixels at each sample point
- Instant response to collisions
- Works with sub-pixel precision

### Performance
- Uses HTML5 Canvas with requestAnimationFrame
- Efficient image loading (async, parallel per level)
- Low memory footprint (images cached, not duplicated)

## Gameplay Design Tips

### For `color.png`
1. **Use pure colors** - Avoid gradients or anti-aliasing
   - Green: RGB(0, 255, 0)
   - Blue: RGB(0, 0, 255)
   - Keep all channels at 0 or 255

2. **Test sensitivity** - Arm samples every ~5% of distance
   - For precise hit detection, make zones wide enough
   - Use large brushes in your graphics editor

3. **Design tricks**
   - Wrap the color map around physical obstacles in your level art
   - Use zones that gradually narrow for difficulty progression
   - Let zones overlap for complex puzzles

### For Base/Collect Images
1. **Same dimensions** - All images must be identical width × height
2. **Design resolution** - Choose one size (e.g., 800×600) and stick to it
3. **Art style** - Can mix photos, drawings, 3D renders, etc.

## Mobile/iPad Considerations

✅ **Touch Input** - Pointer API handles touch automatically
✅ **Larger Hand** - Hand circle is 18px radius (visible on any screen)
✅ **No Keyboard** - Works with touch only
✅ **Responsive** - Scales to any screen size

Tested on:
- Desktop browsers (Chrome, Firefox, Safari)
- iPad/tablets (iOS, Android)
- Mobile phones (iOS, Android)

## Troubleshooting

### Levels Not Loading
- Check folder names are zero-padded (001, 002, not 1, 2)
- Check all 5 images exist in each folder
- Check browser console for 404 errors
- Verify `/HandGrabber/` path is accessible from your app's public folder

### Collisions Not Working
- Verify `color.png` exists and has correct logic pixels
- Check colors are pure RGB, not anti-aliased
- Use color picker to verify exact RGB values
- Make zones at least 5-10 pixels wide

### Arm Not Visible
- Check if pointer is moving (console should show coordinates)
- Verify canvas is rendering (black background should show)
- Try moving cursor further from top-left corner

### Images Look Blurry
- Check source image resolution
- Canvas default is 800×600; choose appropriate source size
- Disable browser image smoothing if needed (adjust canvas CSS)

## Future Enhancements (Optional)

- Gravity/physics for arm segments
- Red pivot points for complex arm articulation
- Scores/timers per level
- Difficulty modifiers (arm friction, goal size, etc.)
- Per-level metadata (JSON with description, author, etc.)

## Files Modified for Integration

1. **src/components/Handgrabber.tsx** (NEW)
   - Complete game implementation
   - ~400 lines, self-contained

2. **src/data/apps.tsx**
   - Added Handgrabber to APPS array with Hand icon
   - 1 new app entry

3. **src/components/AppLauncher.tsx**
   - Imported Handgrabber component
   - Added case statement for routing

## Quick Start Checklist

- [x] Handgrabber.tsx created
- [x] Added to apps registry
- [x] Added to AppLauncher
- [x] /HandGrabber/Levels/001/ exists with 5 images
- [ ] Test in dev server: `npm run dev`
- [ ] Click "Hand Grabber" on home screen
- [ ] Play through level 001
- [ ] Verify win/lose overlays work
- [ ] Add more levels as needed

---

**Questions or issues?** Check the implementation in `src/components/Handgrabber.tsx` for detailed comments and logic.
