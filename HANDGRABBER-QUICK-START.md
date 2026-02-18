# Handgrabber Quick Reference

## 🚀 Launch Game
1. Click "Hand Grabber" icon on home screen
2. Level 001 auto-loads
3. Move cursor/finger to control arm
4. Reach green area to win

## 📁 Level Folder Structure
```
/HandGrabber/Levels/001/
├── base.png      (background)
├── collect.png   (overlay)
├── color.png     (logic map)
├── win.png       (victory)
└── lose.png      (failure)
```

## 🎨 Color Map Colors
| Color | RGB | Purpose |
|-------|-----|---------|
| 🟢 Green | `(0, 255, 0)` | Goal - reach to win |
| 🔵 Blue | `(0, 0, 255)` | Fail - touch to lose |
| ⚪ White | `(255, 255, 255)` | Safe space |
| 🔴 Red | `(255, 0, 0)` | Reserved (future) |

## ➕ Add New Level
1. Create: `/HandGrabber/Levels/002/`
2. Add 5 PNG images (same dimensions as 001)
3. Restart game
4. Done! Game auto-detects level 002

## 🔧 Files Modified
- `src/components/Handgrabber.tsx` (NEW)
- `src/data/apps.tsx` (Added app entry)
- `src/components/AppLauncher.tsx` (Added import + routing)

## 📚 Documentation
- **HANDGRABBER-GUIDE.md** - Complete guide
- **COLOR-MAP-GUIDE.md** - Image creation instructions
- **IMPLEMENTATION-SUMMARY.md** - Technical details

## 🎮 Game Controls
- **Desktop:** Move mouse
- **Tablet/iPad:** Move finger
- **Mobile:** Move finger
- **No keyboard needed** - pure pointer input

## ✅ Checklist to Test
- [ ] Run `npm run dev`
- [ ] Login
- [ ] Click "Hand Grabber"
- [ ] Arm follows your cursor
- [ ] Reach green → win
- [ ] Retry works
- [ ] Back to home works

## 🐛 Troubleshooting
**Level won't load:** Check folder names are `001`, `002`, etc. (zero-padded)
**Arm invisible:** Move cursor away from top-left corner
**No collision:** Verify color.png has pure RGB colors, not anti-aliased
**Blurry graphics:** Check source image resolution is large enough

## 🎯 Design Tips
1. Make goal zones **at least 50px wide**
2. Use **hard-edged brushes** (no feather/soft)
3. Start simple (large goal, no obstacles)
4. Test on tablet if possible
5. Keep all 5 images same dimensions

## 📞 Key Code Locations
- Game logic: `src/components/Handgrabber.tsx` line 1-461
- Home screen integration: `src/data/apps.tsx` line 85-90
- App routing: `src/components/AppLauncher.tsx` line 11, 2095-2096

## ⚙️ Customization
- **Arm color:** Change `'#FFD700'` in Handgrabber.tsx
- **Hand size:** Change `18` in circle arc calls
- **Sample resolution:** Modify `samples = 20` in checkArmCollision
- **Canvas size:** Change `width={800} height={600}` on canvas

---
**Status:** ✅ Ready to play!
