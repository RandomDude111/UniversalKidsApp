import React, { useEffect, useRef, useState } from 'react';

interface Level {
  number: number;
  path: string;
  images: {
    base: HTMLImageElement;
    collect: HTMLImageElement;
    color: HTMLImageElement;
    start: HTMLImageElement;
    glove: HTMLImageElement;
    win: HTMLImageElement;
    lose: HTMLImageElement;
  };
}

interface GameState {
  currentLevel: number;
  levelData: Level | null;
  gamePhase: 'playing' | 'won' | 'lost';
  armStartX: number;
  armStartY: number;
  armLength: number;
  anchors: Point[];
  itemCollected: boolean;
  itemPosition: Point;
}

interface Point {
  x: number;
  y: number;
}

const Handgrabber: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorImageDataCache = useRef<{
    levelNumber: number;
    imageData: ImageData;
    width: number;
    height: number;
  } | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    currentLevel: 1,
    levelData: null,
    gamePhase: 'playing',
    armStartX: 0,
    armStartY: 0,
    armLength: 0,
    anchors: [],
    itemCollected: false,
    itemPosition: { x: 0, y: 0 }
  });

  const [levels, setLevels] = useState<Level[]>([]);
  const [pointerPos, setPointerPos] = useState<Point>({ x: 0, y: 0 });
  const [levelScale, setLevelScale] = useState(1);
  const [levelOffset, setLevelOffset] = useState({ x: 0, y: 0 });
  const animationRef = useRef<number>();
  const lastPointerRef = useRef<Point | null>(null);
  const lastMoveRef = useRef<{ dx: number; dy: number } | null>(null);
  const gloveAngleRef = useRef<number>(0);

  // Load all levels from directory
  useEffect(() => {
    const loadLevels = async () => {
      try {
        const levelNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const loadedLevels: Level[] = [];

        const loadImage = (src: string, optional = false): Promise<HTMLImageElement | null> => {
          return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(optional ? null : img);
            img.src = src;
          });
        };

        // Load each level sequentially (keeps memory predictable)
        for (const num of levelNumbers) {
          const levelPad = String(num).padStart(3, '0');
          const levelPath = `/HandGrabber/Levels/${levelPad}/`;

          const [base, collect, color, start, glove, win, lose] = await Promise.all([
            loadImage(`${levelPath}base.png`),
            loadImage(`${levelPath}collect.png`),
            loadImage(`${levelPath}color.png`),
            loadImage(`${levelPath}start.png`),
            loadImage(`/HandGrabber/glove.png`, true), // optional
            loadImage(`${levelPath}win.png`),
            loadImage(`${levelPath}lose.png`),
          ]);

          // Ensure required assets are present
          if (base && collect && color && start && win && lose) {
            loadedLevels.push({
              number: num,
              path: levelPath,
              images: {
                base,
                collect,
                color,
                start,
                glove: glove || new Image(),
                win,
                lose,
              }
            });
          }
        }

        const sorted = loadedLevels.sort((a, b) => a.number - b.number);
        if (sorted.length > 0) setLevels(sorted);
      } catch (err) {
        console.error('Error loading levels:', err);
      }
    };

    loadLevels();
  }, []);

  // Initialize game when level changes
  useEffect(() => {
    if (levels.length === 0) return;

    const currentLevel = levels[gameState.currentLevel - 1];
    if (!currentLevel) return;

    // Determine start position from the level's start image and initialize pointer/arm
    const computeStart = () => {
      const startImg = currentLevel.images.start;
      if (!startImg || !startImg.complete || startImg.naturalWidth === 0) {
        const levelWidth = currentLevel.images.base.width;
        return { x: levelWidth / 2, y: currentLevel.images.base.height * 0.15 };
      }

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = startImg.width;
      tempCanvas.height = startImg.height;
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) return { x: 0, y: 0 };

      ctx.drawImage(startImg, 0, 0);
      const imageData = ctx.getImageData(0, 0, startImg.width, startImg.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        if (a > 200 && !(r > 240 && g > 240 && b > 240) && !(r < 15 && g < 15 && b < 15)) {
          const pixelIndex = i / 4;
          const x = pixelIndex % startImg.width;
          const y = Math.floor(pixelIndex / startImg.width);
          return { x, y };
        }
      }

      const levelWidth = currentLevel.images.base.width;
      return { x: levelWidth / 2, y: currentLevel.images.base.height * 0.15 };
    };

    const startPos = computeStart();

    // level initialized

    setGameState(prev => ({
      ...prev,
      levelData: currentLevel,
      gamePhase: 'playing',
      armStartX: startPos.x,
      armStartY: startPos.y,
      armLength: 0,
      anchors: [],
      itemCollected: false,
      itemPosition: { x: 0, y: 0 }
    }));

    // Initialize visible hand position to the start marker
    updatePointerPos(startPos);
  }, [gameState.currentLevel, levels]);

  // Calculate scale and offset to fit level to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState.levelData) return;

    const levelImages = gameState.levelData.images;
    const levelWidth = levelImages.base.width;
    const levelHeight = levelImages.base.height;

    const scaleX = canvas.width / levelWidth;
    const scaleY = canvas.height / levelHeight;
    const scale = Math.min(scaleX, scaleY);

    const offsetX = (canvas.width - levelWidth * scale) / 2;
    const offsetY = (canvas.height - levelHeight * scale) / 2;

    setLevelScale(scale);
    setLevelOffset({ x: offsetX, y: offsetY });
  }, [gameState.levelData, canvasRef.current?.width, canvasRef.current?.height]);

  // Convert screen coordinates to level coordinates
  const screenToLevelCoords = (screenX: number, screenY: number): Point => {
    if (!canvasRef.current) return { x: 0, y: 0 };

    const rect = canvasRef.current.getBoundingClientRect();
    const relX = screenX - rect.left;
    const relY = screenY - rect.top;

    return {
      x: (relX - levelOffset.x) / levelScale,
      y: (relY - levelOffset.y) / levelScale
    };
  };

  // Resize canvas to fit container for correct pointer coordinate mapping
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      // Keep backing store size consistent with displayed size
      canvas.width = Math.max(100, Math.floor(rect.width));
      canvas.height = Math.max(100, Math.floor(rect.height));
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [canvasRef.current]);

  // Centralized setter
  const updatePointerPos = (p: Point) => {
    // compute movement delta based on last pointer
    const prev = lastPointerRef.current ?? pointerPos;
    const dx = p.x - prev.x;
    const dy = p.y - prev.y;
    lastMoveRef.current = { dx, dy };
    lastPointerRef.current = p;
    setPointerPos(p);
  };

    // Get arm start position from start.png image
    const getStartPosition = (): Point => {
      if (!gameState.levelData) return { x: 0, y: 0 };

      const startImg = gameState.levelData.images.start;
      if (!startImg || !startImg.complete || startImg.naturalWidth === 0) {
        // Fallback to top center if start.png not available
        const levelWidth = gameState.levelData.images.base.width;
        return { x: levelWidth / 2, y: gameState.levelData.images.base.height * 0.15 };
      }

      // Create temporary canvas to read pixel data from start.png
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = startImg.width;
      tempCanvas.height = startImg.height;
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) return { x: 0, y: 0 };

      ctx.drawImage(startImg, 0, 0);

      // Scan for a non-white, non-black pixel (the marker indicating arm start)
      const imageData = ctx.getImageData(0, 0, startImg.width, startImg.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // Look for non-white, non-black pixels (any colored marker pixel)
        if (a > 200 && !(r > 240 && g > 240 && b > 240) && !(r < 15 && g < 15 && b < 15)) {
          const pixelIndex = i / 4;
          const x = pixelIndex % startImg.width;
          const y = Math.floor(pixelIndex / startImg.width);
          return { x, y };
        }
      }

      // Fallback if no marker found
      const levelWidth = gameState.levelData.images.base.width;
      return { x: levelWidth / 2, y: gameState.levelData.images.base.height * 0.15 };
    };

  // Get pixel color from color map at level coordinates (cached)
  const getColorAtPoint = (levelCoords: Point): { r: number; g: number; b: number } => {
    if (!gameState.levelData) return { r: 255, g: 255, b: 255 };

    const colorImg = gameState.levelData.images.color;
    if (!colorImg.complete || colorImg.naturalWidth === 0) return { r: 255, g: 255, b: 255 };

    const x = Math.floor(levelCoords.x);
    const y = Math.floor(levelCoords.y);

    if (x < 0 || y < 0 || x >= colorImg.width || y >= colorImg.height) {
      return { r: 255, g: 255, b: 255 };
    }

    // Check if we have cached image data for this level
    if (colorImageDataCache.current?.levelNumber !== gameState.currentLevel) {
      // Cache miss - load color image data
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = colorImg.width;
      tempCanvas.height = colorImg.height;
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) return { r: 255, g: 255, b: 255 };

      ctx.drawImage(colorImg, 0, 0);
      const imageData = ctx.getImageData(0, 0, colorImg.width, colorImg.height);

      colorImageDataCache.current = {
        levelNumber: gameState.currentLevel,
        imageData,
        width: colorImg.width,
        height: colorImg.height
      };
    }

    // Fast pixel lookup from cached data
    const cache = colorImageDataCache.current;
    const index = (y * cache.width + x) * 4;
    const data = cache.imageData.data;

    return { r: data[index], g: data[index + 1], b: data[index + 2] };
  };

  // Handle pointer/touch move — ONLY fires while pointer is down
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState.gamePhase !== 'playing') return;

    // Only update while dragging — return immediately if not
    if (!isDragging) {
      console.log('DEBUG: handlePointerMove called but isDragging=', isDragging);
      return;
    }

    const coords = screenToLevelCoords(e.clientX, e.clientY);
    updatePointerPos(coords);

    // Calculate arm from fixed start point
    if (gameState.levelData) {
      const startPos = getStartPosition();
      setGameState(prev => ({ ...prev, armStartX: startPos.x, armStartY: startPos.y }));

      checkArmCollision(startPos.x, startPos.y, coords.x, coords.y);
    }
  };

  // Touch fallback wrappers for environments where pointer events aren't available
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (gameState.gamePhase !== 'playing') return;
    const touch = e.touches[0];
    if (!touch) return;
    const coords = screenToLevelCoords(touch.clientX, touch.clientY);

    // Simulate pointer-down behavior: allow starting drag if near glove
    const gloveX = gameState.armStartX;
    const gloveY = gameState.armStartY;
    const dx = coords.x - gloveX;
    const dy = coords.y - gloveY;
    const distSq = dx * dx + dy * dy;

    const gloveImg = gameState.levelData?.images.glove;
    const GLOVE_SCALE = 0.15;
    let handRadius = 18;
    if (gloveImg && gloveImg.complete && gloveImg.naturalWidth > 0) {
      const scaledW = gloveImg.width * GLOVE_SCALE;
      const scaledH = gloveImg.height * GLOVE_SCALE;
      handRadius = Math.max(scaledW, scaledH) / 2;
    }

    if (distSq <= (handRadius + 6) * (handRadius + 6)) {
      setIsDragging(true);
      updatePointerPos(coords);
      lastPointerRef.current = coords;
      lastMoveRef.current = null;
      const startPos = getStartPosition();
      setGameState(prev => ({ ...prev, armStartX: startPos.x, armStartY: startPos.y }));
      checkArmCollision(startPos.x, startPos.y, coords.x, coords.y);
      e.preventDefault();
    }
  };

  const handleTouchMoveWrapper = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    if (!touch) return;
    const coords = screenToLevelCoords(touch.clientX, touch.clientY);
    updatePointerPos(coords);
    const startPos = getStartPosition();
    setGameState(prev => ({ ...prev, armStartX: startPos.x, armStartY: startPos.y }));
    checkArmCollision(startPos.x, startPos.y, coords.x, coords.y);
    e.preventDefault();
  };

  const handleTouchEndWrapper = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    const startPos = getStartPosition();
    updatePointerPos(startPos);
    lastPointerRef.current = null;
    lastMoveRef.current = null;
    setGameState(prev => ({ ...prev, anchors: [] }));
    if (gameState.itemCollected) setGameState(prev => ({ ...prev, gamePhase: 'won' }));
    e.preventDefault();
  };

  // Check if arm intersects with danger/goal zones and detect red wrap anchors
  const checkArmCollision = (startX: number, startY: number, endX: number, endY: number) => {
    // First, check and remove anchors with excessive bending angles (decouple)
    let updatedAnchors = [...(gameState.anchors || [])];
    
    // Remove anchors from the end if they have a sharp bend (> 100 degrees)
    while (updatedAnchors.length > 0) {
      const lastAnchorIndex = updatedAnchors.length - 1;
      const lastAnchor = updatedAnchors[lastAnchorIndex];
      
      // Get the previous point in the chain
      const prevPoint = lastAnchorIndex > 0 ? updatedAnchors[lastAnchorIndex - 1] : { x: startX, y: startY };
      const nextPoint = { x: endX, y: endY }; // current glove position
      
      // Calculate vectors
      const v1x = lastAnchor.x - prevPoint.x;
      const v1y = lastAnchor.y - prevPoint.y;
      const v2x = nextPoint.x - lastAnchor.x;
      const v2y = nextPoint.y - lastAnchor.y;
      
      // Calculate angle between vectors using atan2
      const angle1 = Math.atan2(v1y, v1x);
      const angle2 = Math.atan2(v2y, v2x);
      let angleDiff = angle2 - angle1;
      
      // Normalize angle to [-PI, PI]
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      
      // Convert to degrees
      const angleDegrees = Math.abs(angleDiff * 180 / Math.PI);
      
      // If angle is more than 100 degrees (sharp bend backwards), remove this anchor
      if (angleDegrees > 100) {
        updatedAnchors.pop();
      } else {
        break; // Stop checking if angle is acceptable
      }
    }
    
    // Update state if anchors changed
    if (updatedAnchors.length !== (gameState.anchors || []).length) {
      setGameState(prev => ({ ...prev, anchors: updatedAnchors }));
    }

    // Build polyline through existing anchors
    const pts: Point[] = [{ x: startX, y: startY }, ...updatedAnchors, { x: endX, y: endY }];

    // Reduce samples for segments after first anchor to improve performance
    const samplesPerSegment = pts.length > 2 ? 10 : 20;
    let goalTouched = false;
    let failTouched = false;
    let foundAnchor: Point | null = null;

    const isNearAnchor = (p: Point) => {
      const thresh = 12; // pixels in level-space
      return (gameState.anchors || []).some(a => {
        const dx = a.x - p.x;
        const dy = a.y - p.y;
        return dx * dx + dy * dy < thresh * thresh; // squared distance for speed
      });
    };

    outer: for (let s = 0; s < pts.length - 1; s++) {
      const a = pts[s];
      const b = pts[s + 1];

      for (let i = 0; i <= samplesPerSegment; i++) {
        const t = i / samplesPerSegment;
        const sampleX = a.x + (b.x - a.x) * t;
        const sampleY = a.y + (b.y - a.y) * t;

        const color = getColorAtPoint({ x: sampleX, y: sampleY });

        // Detect red = wrap/pivot (red > green and red > blue)
        if (color.r > color.g && color.r > color.b && color.r > 150) {
          // Candidate anchor point
          const candidate: Point = { x: Math.round(sampleX), y: Math.round(sampleY) };
          if (!isNearAnchor(candidate)) {
            foundAnchor = candidate;
            break outer; // add one anchor at a time
          }
        }

        // Green = goal/success (green > red and green > blue)
        if (color.g > color.r && color.g > color.b && color.g > 150) {
          goalTouched = true;
        }
        // Blue = fail zone (blue > red and blue > green)
        if (color.b > color.r && color.b > color.g && color.b > 150) {
          failTouched = true;
        }
      }
    }

    // If we found a new anchor, add it and stop (player must move again to continue)
    if (foundAnchor) {
      setGameState(prev => ({ ...prev, anchors: [...(prev.anchors || []), foundAnchor] }));
      return;
    }

    if (failTouched) {
      setGameState(prev => ({ ...prev, gamePhase: 'lost', itemCollected: false, itemPosition: { x: 0, y: 0 } }));
    } else if (goalTouched && !gameState.itemCollected) {
      // Item not collected yet - collect it
      setGameState(prev => ({ ...prev, itemCollected: true, itemPosition: { x: endX, y: endY } }));
    } else if (gameState.itemCollected) {
      // Item is collected - check if glove returned to start position
      const dx = endX - startX;
      const dy = endY - startY;
      const distToStart = Math.sqrt(dx * dx + dy * dy);
      const returnThreshold = 70; // pixels - larger area for forgiving returns

      if (distToStart < returnThreshold) {
        // Successfully returned item to start - level complete!
        setGameState(prev => ({ ...prev, gamePhase: 'won' }));
      }
    }
  };

  // Pointer down/up handlers to control dragging
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState.gamePhase !== 'playing') return;
    if (!canvasRef.current) return;

    const coords = screenToLevelCoords(e.clientX, e.clientY);

    // Start drag only if clicking near the visible glove
    // Glove is at armStartX/Y when idle, or pointerPos when dragging
    const gloveX = gameState.armStartX;
    const gloveY = gameState.armStartY;
    const dx = coords.x - gloveX;
    const dy = coords.y - gloveY;
    const distSq = dx * dx + dy * dy;

    // Compute clickable radius from glove image if available so hit area matches visual size
    const gloveImg = gameState.levelData?.images.glove;
    const GLOVE_SCALE = 0.15;
    let handRadius = 18;
    if (gloveImg && gloveImg.complete && gloveImg.naturalWidth > 0) {
      const scaledW = gloveImg.width * GLOVE_SCALE;
      const scaledH = gloveImg.height * GLOVE_SCALE;
      handRadius = Math.max(scaledW, scaledH) / 2;
    }

    if (distSq <= (handRadius + 6) * (handRadius + 6)) {
      setIsDragging(true);
      // start drag
      updatePointerPos(coords);
      lastPointerRef.current = coords;
      lastMoveRef.current = null;
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}

      // Update arm start and run collision for initial click
      const startPos = getStartPosition();
      setGameState(prev => ({ ...prev, armStartX: startPos.x, armStartY: startPos.y }));
      checkArmCollision(startPos.x, startPos.y, coords.x, coords.y);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDragging(false);
    // Reset pointer position to start when releasing drag and clear anchors
    const startPos = getStartPosition();
    updatePointerPos(startPos);
    lastPointerRef.current = null;
    lastMoveRef.current = null;
    setGameState(prev => ({ ...prev, anchors: [] }));
    // If item was collected and the glove snaps back to start, count as win
    if (gameState.itemCollected) {
      setGameState(prev => ({ ...prev, gamePhase: 'won' }));
    }
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) {}
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDragging(false);
    const startPos = getStartPosition();
    updatePointerPos(startPos);
    lastPointerRef.current = null;
    lastMoveRef.current = null;
    setGameState(prev => ({ ...prev, anchors: [] }));
    // If item was collected and the glove snaps back to start, count as win
    if (gameState.itemCollected) {
      setGameState(prev => ({ ...prev, gamePhase: 'won' }));
    }
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) {}
  };

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState.levelData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const images = gameState.levelData.images;

    const render = () => {
      // Clear canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Save context state
      ctx.save();

      // Translate to level offset
      ctx.translate(levelOffset.x, levelOffset.y);
      ctx.scale(levelScale, levelScale);

      // Draw base
      if (images.base.complete && images.base.naturalWidth > 0) {
        ctx.drawImage(images.base, 0, 0);
      }

      // Draw collect overlay (only if item not collected)
      if (!gameState.itemCollected && images.collect.complete && images.collect.naturalWidth > 0) {
        ctx.drawImage(images.collect, 0, 0);
      }

      // Draw arm (polyline from armStart through anchors to pointer)
      if (gameState.gamePhase === 'playing' && isDragging) {
        const pts: Point[] = [{ x: gameState.armStartX, y: gameState.armStartY }, ...(gameState.anchors || []), pointerPos];

        // Draw shadow/glow by drawing thicker translucent lines across segments
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.25)';
        ctx.lineWidth = 18;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) {
          const p = pts[i];
          if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();

        // Draw main arm
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) {
          const p = pts[i];
          if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();

        // Draw shoulder joint
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.arc(gameState.armStartX, gameState.armStartY, 8, 0, Math.PI * 2);
        ctx.fill();

        // Draw anchors
        ctx.fillStyle = '#FF4500';
        for (const a of gameState.anchors || []) {
          ctx.beginPath(); ctx.arc(a.x, a.y, 6, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 2; ctx.stroke();
        }
      }

      // Draw glove and debug info (only debug text for playing phase)
      if (gameState.gamePhase === 'playing') {
        // Debug text only during playing
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(`isDragging: ${isDragging}`, 20, 30);
        ctx.fillText(`glovePos: (${Math.round(gameState.armStartX)}, ${Math.round(gameState.armStartY)})`, 20, 50);
        ctx.fillText(`pointerPos: (${Math.round(pointerPos.x)}, ${Math.round(pointerPos.y)})`, 20, 70);
      }

      // Draw win overlay
      if (gameState.gamePhase === 'won' && images.win.complete && images.win.naturalWidth > 0) {
        ctx.globalAlpha = 0.95;
        ctx.drawImage(images.win, 0, 0);
        ctx.globalAlpha = 1;
      }

      // Draw lose overlay
      if (gameState.gamePhase === 'lost' && images.lose.complete && images.lose.naturalWidth > 0) {
        ctx.globalAlpha = 0.95;
        ctx.drawImage(images.lose, 0, 0);
        ctx.globalAlpha = 1;
      }

      // Draw glove and collected item on top of overlays (for visibility on win/lose screens)
      if (gameState.gamePhase === 'playing' || gameState.gamePhase === 'won') {
        // Draw collected item FIRST if collected (so glove appears on top)
        if (gameState.itemCollected && images.collect.complete && images.collect.naturalWidth > 0) {
          const itemDrawX = isDragging ? pointerPos.x : gameState.armStartX;
          const itemDrawY = isDragging ? pointerPos.y : gameState.armStartY;
          
          // Calculate offset from where item was collected
          const offsetX = itemDrawX - gameState.itemPosition.x;
          const offsetY = itemDrawY - gameState.itemPosition.y;
          
          // Draw full collect.png image starting at (0,0) but offset by glove movement
          ctx.globalAlpha = 0.95;
          ctx.drawImage(images.collect, offsetX, offsetY);
          ctx.globalAlpha = 1;
        }

        // Draw GLOVE ON TOP of item
        const gloveImg = images.glove;
        if (gloveImg && gloveImg.complete && gloveImg.naturalWidth > 0) {
          const drawX = isDragging ? pointerPos.x : gameState.armStartX;
          const drawY = isDragging ? pointerPos.y : gameState.armStartY;
          const scale = 0.15; // scale glove to 15% of original size
          const scaledWidth = gloveImg.width * scale;
          const scaledHeight = gloveImg.height * scale;

          // Compute desired angle from recent movement; keep smoothed angle when stationary
          const mv = lastMoveRef.current;
          const speed = mv ? Math.hypot(mv.dx, mv.dy) : 0;

          // Deadband: entirely ignore small movements so glove does not drift
          const deadband = 8.0; // pixels per update - increased for more stability
          // Speed at which we consider movement 'fast' (for full responsiveness)
          const speedForMax = 40; // pixels per pointer update (tuneable)

          // Previous (current) smoothed angle
          const prev = typeof gloveAngleRef.current === 'number' ? gloveAngleRef.current : 0;

          // If movement is not meaningful, don't change the angle at all
          if (!mv || speed <= deadband) {
            var angle = prev;
          } else {
            // Compute desired angle from movement and scale responsiveness by speed
            const desired = Math.atan2(mv.dy, mv.dx) + Math.PI / 2;
            const speedFactor = Math.min(1, speed / speedForMax);

            // Shortest angular difference
            let delta = desired - prev;
            while (delta > Math.PI) delta -= Math.PI * 2;
            while (delta < -Math.PI) delta += Math.PI * 2;

            // Alpha scales with speed: lower minimum for much smoother rotation
            const minAlpha = 0.06; // smaller smoothing factor -> smoother motion
            const maxAlpha = 0.6;
            const alpha = minAlpha + (maxAlpha - minAlpha) * speedFactor;

            // Allow larger per-frame delta at higher speeds, keep tighter clamp when slow
            const minMaxDelta = 0.08; // smaller clamp for less jumpiness
            const maxMaxDelta = 1.2; // radians
            const maxDelta = minMaxDelta + (maxMaxDelta - minMaxDelta) * speedFactor;

            if (delta > maxDelta) delta = maxDelta;
            if (delta < -maxDelta) delta = -maxDelta;

            gloveAngleRef.current = prev + delta * alpha;
            var angle = gloveAngleRef.current;
          }

          // Save context, translate to glove position, rotate, draw, restore
          ctx.save();
          ctx.translate(drawX, drawY);
          ctx.rotate(angle);
          ctx.drawImage(gloveImg, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
          ctx.restore();
        } else {
          // Fallback: simple circle if glove image not available
          ctx.fillStyle = '#FFD700';
          ctx.beginPath();
          ctx.arc(gameState.armStartX, gameState.armStartY, 18, 0, Math.PI * 2);
          ctx.fill();

          // Draw hand outline for better visibility
          ctx.strokeStyle = '#FFA500';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(gameState.armStartX, gameState.armStartY, 18, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      ctx.restore();

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, levelOffset, levelScale, pointerPos]);

  const handleNextLevel = () => {
    if (gameState.currentLevel < levels.length) {
      setGameState(prev => ({ ...prev, currentLevel: prev.currentLevel + 1, itemCollected: false, itemPosition: { x: 0, y: 0 } }));
    }
  };

  const handleRetry = () => {
    // Reset anchors and pointer state when retrying
    const startPos = getStartPosition();
    lastPointerRef.current = null;
    lastMoveRef.current = null;
    updatePointerPos(startPos);
    setGameState(prev => ({ ...prev, gamePhase: 'playing', anchors: [], itemCollected: false, itemPosition: { x: 0, y: 0 } }));
  };

  if (levels.length === 0) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-2xl font-bold mb-2">Loading levels...</div>
          <div className="text-gray-400">Make sure level images exist in /Handgrabber/Levels/</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black flex flex-col">
      {/* Level info */}
      <div className="px-6 py-4 bg-gray-900 border-b border-gray-700 flex items-center justify-between">
        <div className="text-white font-semibold">
          Level {gameState.currentLevel} of {levels.length}
        </div>
        <div className="text-gray-400 text-sm">
          {gameState.gamePhase === 'won' && '✓ Level Complete!'}
          {gameState.gamePhase === 'lost' && '✗ Try again'}
          {gameState.gamePhase === 'playing' && 'Grab the green zone...'}
        </div>
      </div>

      {/* Game canvas */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onPointerLeave={() => { setIsDragging(false); updatePointerPos({ x: -9999, y: -9999 }); }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMoveWrapper}
          onTouchEnd={handleTouchEndWrapper}
          className="cursor-auto"
          style={{ touchAction: 'none', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        />

        {/* Win/Lose overlay buttons */}
        {(gameState.gamePhase === 'won' || gameState.gamePhase === 'lost') && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
            <div className="flex gap-4">
              <button
                onClick={handleRetry}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry Level
              </button>
              {gameState.gamePhase === 'won' && gameState.currentLevel < levels.length && (
                <button
                  onClick={handleNextLevel}
                  className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                  Next Level
                </button>
              )}
              {gameState.gamePhase === 'won' && gameState.currentLevel === levels.length && (
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                >
                  All Levels Complete!
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom info */}
      <div className="px-6 py-4 bg-gray-900 border-t border-gray-700 text-gray-400 text-sm">
        <div>Move your cursor/finger to control the arm. Avoid blue zones and reach the green area to win.</div>
      </div>
    </div>
  );
};

export default Handgrabber;
