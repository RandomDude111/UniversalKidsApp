# Creating Color Maps for Handgrabber Levels

## Color Reference

| Color | RGB Value | Meaning | How to Use |
|-------|-----------|---------|-----------|
| 🟢 Green | `(0, 255, 0)` | **Goal Zone** | Where the arm needs to reach to win |
| 🔵 Blue | `(0, 0, 255)` | **Fail Zone** | Touching this = instant lose |
| 🔴 Red | `(255, 0, 0)` | **Pivot Points** | Reserved for future articulation (currently unused) |
| ⚪ White | `(255, 255, 255)` | **Safe Space** | Arm can move freely here |
| ⬛ Black | `(0, 0, 0)` | **Safe Space** | Same as white (no collision) |

## Creating a Color Map in Gimp

### 1. Setup
- Open GIMP
- Create new image with **same dimensions as base.png** (e.g., 800×600)
- Set foreground/background colors to pure colors

### 2. Setting Pure Colors
**Green Zone:**
- Windows → Dockable Dialogs → Colors
- HTML notation: `00ff00`
- Or use RGB sliders: R=0, G=255, B=0

**Blue Zone:**
- HTML notation: `0000ff`
- RGB sliders: R=0, G=0, B=255

### 3. Drawing Zones
- Use Paintbrush tool
- Use large brushes (100+ pixels) to avoid anti-aliasing issues
- **Do NOT use:**
  - Feather/soft brushes (creates gradients)
  - Anti-aliased selection tools
  - Transparency
  - Filters that blur

### 4. Safety Check
Before exporting:
- Fill entire canvas with white first
- Draw goal zones in green
- Draw fail zones in blue
- Check there are no other colors

### 5. Export as PNG
- File → Export As
- Format: PNG
- Click Export
- PNG Options:
  - ✓ Interlacing: OFF
  - ✓ Save background color: OFF
  - ✓ Save gamma: OFF
  - Compression level: 9 (doesn't affect colors)

## Alternative: Using Photoshop

### 1. New Image
- Create image matching your base.png size
- Set to RGB color mode

### 2. Set Foreground Colors
- Use Color Picker
- Input exact RGB values
- Green: R=0, G=255, B=0
- Blue: R=0, G=0, B=255

### 3. Use Selection Tools
- Use rectangular select or free select
- Fill with bucket tool (ensure it's set to "Fill Whole Selection")
- **Avoid:** Feather, anti-aliasing

### 4. Export
- File → Export As → PNG
- Options:
  - Color space: sRGB
  - Compression: Maximum
  - Interlace: None

## Alternative: Using Python (Programmatic)

```python
from PIL import Image, ImageDraw

# Create blank white image
width, height = 800, 600
img = Image.new('RGB', (width, height), color='white')
draw = ImageDraw.Draw(img)

# Draw goal zone (green rectangle)
# (x1, y1, x2, y2)
draw.rectangle([100, 100, 300, 200], fill=(0, 255, 0))

# Draw fail zone (blue circle)
# (x, y, radius)
draw.ellipse([400, 300, 500, 400], fill=(0, 0, 255))

# Save
img.save('color.png')
```

## Testing Your Color Map

### Quick Check Workflow
1. Create base.png, collect.png, and color.png with same dimensions
2. Export all as PNG
3. Load game level
4. Check "Developer Tools" (F12) → Console for any errors
5. Move cursor to green area → should auto-win
6. Move cursor to blue area → should auto-lose

### Common Issues

**"Game never detects collisions"**
- Check RGB values: use `(0, 255, 0)` not `(0, 254, 0)` or `(1, 254, 1)`
- Increase zone size (make rectangles/circles bigger)
- Enable your image editor's "Snap to Pixels" to avoid off-by-one errors

**"Colors look right but don't work"**
- Verify the image is actually PNG, not JPG converted to PNG
- Make sure colors aren't indexed (should be RGB/Truecolor)
- Re-export and try again

**"Anti-aliased edges cause weird behavior"**
- Use hard-edged brushes only
- Avoid soft/feathered selections
- Draw at 100% zoom
- Use straight lines and geometric shapes

## Example Level: Simple Grab

**Scenario:** Grab object in center, avoid obstacles on sides

```
Base Image:        Color Map:
┌─────────────┐    ┌─────────────┐
│             │    │ B     G   B │
│   object    │    │      ███    │
│             │    │ B     G   B │
└─────────────┘    └─────────────┘

B = Blue (fail zones on sides)
G = Green (goal in center)
```

## Example Level: Curved Path

**Scenario:** Navigate arm through winding path

```
Base Image:        Color Map:
┌─────────────┐    ┌─────────────┐
│   ╱╲        │    │   GGGBBB    │
│  ╱  ╲       │    │  GGGG BBB   │
│ ╱    ╲      │    │ GGGG   BBB  │
└─────────────┘    └─────────────┘
```

## Exporting Multiple Levels

**Quick bash script** to verify all levels have proper files:

```bash
#!/bin/bash
for dir in /path/to/HandGrabber/Levels/*/; do
  echo "Checking $(basename $dir)..."
  for file in base.png collect.png color.png win.png lose.png; do
    [ -f "$dir/$file" ] && echo "  ✓ $file" || echo "  ✗ $file MISSING"
  done
done
```

Run: `bash check_levels.sh`

## Pro Tips

1. **Start Simple** - First level should have large green zone, no blue
2. **Progressive Difficulty** - Narrow zones, add obstacles, longer paths
3. **Color Contrast** - Use bright colors for visibility in testing
4. **Backup Originals** - Keep PSD/XCXF files for editing later
5. **Version Control** - Name levels 001, 002, etc. for natural progression
6. **Test on Device** - iPad/mobile might feel different than desktop

---

**Still stuck?** Try the "Bucket Fill" approach:
1. Create white base layer
2. Use bucket fill (hard edges) to fill green and blue zones
3. Export straight to PNG
