import React, { useEffect, useRef, useState } from 'react';

interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'ground' | 'sky';
  decor?: Array<{ x: number; type: 'grass' | 'flower' | 'mushroom'; color?: string }>;
}

interface Item {
  x: number;
  y: number;
  val: string;
  collected: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  life: number;
  color: string;
  type: 'dust' | 'text' | 'star' | 'pop';
  text?: string;
  rotation?: number;
  size?: number;
  grav?: number;
  targetScale?: number;
  scale?: number;
}

interface Cloud {
  x: number;
  y: number;
  scale: number;
}

interface Hill {
  x: number;
  w: number;
  h: number;
  color: string;
}

interface WordRunnerProps {
  onClose?: () => void;
  teamColor?: string;
}

const TEAM_COLORS = [
  { name: 'Red', value: '#FF6B6B' },
  { name: 'Green', value: '#51CF66' },
  { name: 'Blue', value: '#4ECDC4' },
  { name: 'Yellow', value: '#FFE66D' },
  { name: 'Purple', value: '#A78BFA' },
  { name: 'Orange', value: '#FF9F43' },
];

const WordRunner: React.FC<WordRunnerProps> = ({ onClose, teamColor: initialTeamColor }) => {
  const [selectedTeamColor, setSelectedTeamColor] = useState<string | null>(initialTeamColor || null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runFramesRef = useRef<HTMLImageElement[]>([]);
  const jumpFramesRef = useRef<HTMLImageElement[]>([]);
  const spritesLoadedRef = useRef(false);

  const SPRITE_CONFIG = {
    frameRate: 8, // frames per sprite frame
  };

  const WORDS = ['HELLO', 'WORLD', 'RUNNER', 'GAME', 'APPLE', 'JUMP', 'STAR', 'LION', 'TIGER', 'BEAR', 'SPEED', 'FIRE', 'MAGIC', 'DANCE', 'MUSIC'];
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  const gameStateRef = useRef({
    active: false,
    width: 0,
    height: 0,
    frame: 0,
    frameId: 0,
    score: 0,
    timeLeft: 50,
    playerChar: '👦',
    currentWord: 'HELLO',
    currentTargetIndex: 0,
    jumpBuffer: 0,
    timeScale: 1.0,
    isStopping: false,
    lastBeep: 0,
    wordsCollectedCount: 0,
    defaultPlayerX: 100,
    spriteAnimFrame: 0,
    spriteFrameCounter: 0,
    
    player: { x: 100, y: 0, w: 100, h: 100, vy: 0, grounded: false, angle: 0 },
    platforms: [] as Platform[],
    items: [] as Item[],
    particles: [] as Particle[],
    clouds: [] as Cloud[],
    hills: [] as Hill[],
    _alphaWarnings: [] as string[],
    
    GRAVITY: 0.3,
    JUMP_FORCE: -13.3,
    SPEED: 7.6,
    START_TIME: 50,
    MAX_TIME: 150,
    TIME_BONUS: 15,
    TIME_PENALTY: 5,
    FLOOR_HEIGHT: 375,
    ITEM_SPAWN_RATE: 1,
    CORRECT_LETTER_RATE: 1,
    PLATFORM_LENGTH_MIN: 350,
    PLATFORM_LENGTH_MAX: 950,
    HOLE_WIDTH: 200,
    
    gameStarted: false,
    gameLost: false,
    gameWon: false,
    celebrating: false,
    readyDelay: 0,
    wordsCollected: [] as string[],
  });

  const [gameState, setGameState] = useState({
    started: false,
    lost: false,
    won: false,
    celebrating: false,
    score: 0,
    loading: true,
    teamColor: initialTeamColor || null as string | null,
  });

  const pickNewWord = () => {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    const state = gameStateRef.current;
    state.currentWord = word;
    state.currentTargetIndex = 0;
  };

  const spawnPlatform = (x: number, y: number, w: number, type: 'ground' | 'sky' = 'ground') => {
    const state = gameStateRef.current;
    const decor: Array<{ x: number; type: 'grass' | 'flower' | 'mushroom'; color?: string }> = [];
    const numDecor = Math.floor(w / 100);
    
    for (let i = 0; i < numDecor; i++) {
      const dx = Math.random() * (w - 20) + 10;
      const dtype = Math.random();
      
      if (dtype < 0.6) {
        decor.push({ x: dx, type: 'grass' });
      } else if (dtype < 0.8) {
        decor.push({ x: dx, type: 'flower', color: Math.random() < 0.5 ? '#FF4081' : '#FFD740' });
      } else {
        decor.push({ x: dx, type: 'mushroom' });
      }
    }
    
    const platformHeight = type === 'ground' ? 600 : 40;
    state.platforms.push({ x, y, w, h: platformHeight, type, decor });
  };

  const spawnCloud = (x: number) => {
    const state = gameStateRef.current;
    state.clouds.push({
      x,
      y: Math.random() * 200,
      scale: 0.5 + Math.random() * 0.5,
    });
  };

  const spawnHill = (x: number) => {
    const state = gameStateRef.current;
    state.hills.push({
      x,
      w: 300 + Math.random() * 200,
      h: 200 + Math.random() * 150,
      color: Math.random() < 0.5 ? '#81C784' : '#66BB6A',
    });
  };

  const spawnItem = (x: number, y: number, forceCorrect = false) => {
    const state = gameStateRef.current;
    if (state.currentTargetIndex >= state.currentWord.length) return;

    const targetChar = state.currentWord[state.currentTargetIndex];
    let val = targetChar;

    if (!forceCorrect && Math.random() >= state.CORRECT_LETTER_RATE) {
      do {
        val = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
      } while (state.currentWord.includes(val));
    }

    state.items.push({ x, y, val, collected: false });
  };

  const spawnFloatingText = (x: number, y: number, text: string, color: string) => {
    const state = gameStateRef.current;
    state.particles.push({
      x, y,
      text,
      color,
      vy: -1.5,
      life: 60,
      type: 'text',
    });
  };

  const spawnPopEffect = (x: number, y: number, color: string, isBig: boolean) => {
    const state = gameStateRef.current;
    const count = isBig ? 50 : 15;
    const speed = isBig ? 18 : 10;
    const sizeBase = isBig ? 10 : 5;

    for (let j = 0; j < count; j++) {
      state.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        grav: 0.5,
        life: 40,
        color,
        size: sizeBase + Math.random() * sizeBase,
        type: 'pop',
      });
    }
  };

  const collectItem = (item: Item) => {
    const state = gameStateRef.current;
    const currentTargetChar = state.currentWord[state.currentTargetIndex];

    if (item.val === currentTargetChar) {
      item.collected = true;
      state.score += 100;
      state.timeLeft += state.TIME_BONUS;
      state.timeScale = 0.2;
      setTimeout(() => {
        if (!state.isStopping) state.timeScale = 1.0;
      }, 500);

      spawnFloatingText(item.x, item.y, '+15s', '#00E676');
      spawnPopEffect(item.x, item.y, '#00E676', true);

      state.currentTargetIndex++;

      if (state.currentTargetIndex >= state.currentWord.length) {
        state.score += 500;
        state.wordsCollectedCount++;
        spawnFloatingText(state.player.x, state.player.y - 50, 'AWESOME!', '#FFD700');

        state.celebrating = true;
        setGameState(prev => ({ ...prev, celebrating: true }));

        setTimeout(() => {
          state.celebrating = false;
          if (state.wordsCollectedCount >= 1) {
            state.gameWon = true;
            setGameState(prev => ({ ...prev, won: true, score: state.score }));
          } else {
            pickNewWord();
          }
        }, 2000);
      }

      // Remove all duplicate instances of this letter from items
      const letterToRemove = currentTargetChar;
      state.items.forEach(i => {
        if (i.val === letterToRemove && !i.collected) {
          i.collected = true;
        }
      });
      return;
    }

    item.collected = true;
    state.timeLeft -= state.TIME_PENALTY;
    spawnFloatingText(item.x, item.y, '-2s', '#FF5252');
    spawnPopEffect(item.x, item.y, '#FF5252', false);
  };

  const spawnManager = () => {
    const state = gameStateRef.current;
    const lastGround = state.platforms.filter(p => p.type === 'ground');
    const lastPlat = lastGround[lastGround.length - 1];

    if (!lastPlat) return;

    if (lastPlat.x + lastPlat.w < state.width + 100) {
      const pattern = Math.random();
      const safeJumpHeight = 135;

      if (pattern < 0.4) {
        // SKY PLATFORM PATTERN
        const newY = lastPlat.y;
        const newW = state.PLATFORM_LENGTH_MIN + Math.random() * (state.PLATFORM_LENGTH_MAX - state.PLATFORM_LENGTH_MIN);

        if (Math.random() < state.ITEM_SPAWN_RATE) {
          const skyW = state.PLATFORM_LENGTH_MIN + Math.random() * 100;
          const skyY = Math.max(50, newY - safeJumpHeight);
          spawnPlatform(lastPlat.x + lastPlat.w + 100, skyY, skyW, 'sky');
        }

        if (Math.random() < state.ITEM_SPAWN_RATE) {
          spawnItem(lastPlat.x + lastPlat.w + newW / 2, newY - 60, false);
        }

        spawnPlatform(lastPlat.x + lastPlat.w, newY, newW, 'ground');
      } else if (pattern < 0.6) {
        // SIMPLE GAP
        const newW = state.PLATFORM_LENGTH_MIN + Math.random() * (state.PLATFORM_LENGTH_MAX - state.PLATFORM_LENGTH_MIN);
        spawnPlatform(lastPlat.x + lastPlat.w + state.HOLE_WIDTH, lastPlat.y, newW, 'ground');
      } else {
        // PIT WITH STEPPING STONES
        const pitWidth = state.HOLE_WIDTH * 5;
        const startX = lastPlat.x + lastPlat.w;
        const endX = startX + pitWidth;
        const groundY = lastPlat.y;

        spawnPlatform(endX, groundY, 1000, 'ground');

        const steps = 2;
        const stepSize = pitWidth / steps;
        for (let i = 1; i < steps; i++) {
          const platW = state.PLATFORM_LENGTH_MIN + Math.random() * 100;
          const platX = startX + i * stepSize - platW / 2;
          const platY = Math.max(80, groundY - safeJumpHeight + Math.random() * 40);
          spawnPlatform(platX, platY, platW, 'sky');
        }
      }
    }
  };

  const update = () => {
    const state = gameStateRef.current;
    if (!state.gameStarted || state.gameLost || state.gameWon || state.celebrating) return;

    if (state.readyDelay > 0) {
      state.readyDelay--;
      state.frame++;
      return;
    }

    state.frame++;
    state.timeLeft -= (1 / 60) * state.timeScale;

    // Update sprite animation frame
    state.spriteFrameCounter++;
    if (state.spriteFrameCounter >= SPRITE_CONFIG.frameRate) {
      state.spriteFrameCounter = 0;
      if (state.player.grounded) {
        // Running animation (8 frames)
        state.spriteAnimFrame = (state.spriteAnimFrame + 1) % 8;
      } else {
        // Jumping animation (5 frames)
        state.spriteAnimFrame = (state.spriteAnimFrame + 1) % 5;
      }
    }

    // Beeping at low time
    if (state.timeLeft <= 3.1 && state.timeLeft > 0) {
      const ceil = Math.ceil(state.timeLeft);
      if (ceil !== state.lastBeep) {
        state.lastBeep = ceil;
      }
    }

    // Stopping when time runs out
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      state.isStopping = true;
    }

    // Slow down time scale when stopping
    if (state.isStopping) {
      state.timeScale *= 0.95;
      if (state.timeScale < 0.05) {
        state.gameLost = true;
        setGameState({ started: true, lost: true, won: false, celebrating: false, score: state.score, loading: false, teamColor: selectedTeamColor });
        return;
      }
    }

    if (state.timeLeft > state.MAX_TIME) state.timeLeft = state.MAX_TIME;

    const effectiveSpeed = state.SPEED * state.timeScale;

    // Spawn clouds and hills
    if (state.frame % 100 === 0) spawnCloud(state.width + 50);
    state.clouds.forEach(c => (c.x -= effectiveSpeed * 0.1));
    state.clouds = state.clouds.filter(c => c.x > -200);

    if (state.hills.length < 3 || state.hills[state.hills.length - 1].x < state.width - 200) {
      spawnHill(state.width + 100);
    }
    state.hills.forEach(h => (h.x -= effectiveSpeed * 0.3));
    state.hills = state.hills.filter(h => h.x > -500);

    // Player Physics with time scale
    state.player.vy += state.GRAVITY * state.timeScale;
    state.player.y += state.player.vy * state.timeScale;

    // Player movement toward camera
    if (state.player.x < state.defaultPlayerX && !state.isStopping) {
      state.player.x += effectiveSpeed * 0.2;
    }

    state.player.grounded = false;

    // Collision Detection
    for (const platform of state.platforms) {
      if (
        state.player.x < platform.x + platform.w &&
        state.player.x + state.player.w > platform.x &&
        state.player.y < platform.y + platform.h &&
        state.player.y + state.player.h > platform.y
      ) {
        const prevFeetY = state.player.y + state.player.h - state.player.vy * state.timeScale;

        if (prevFeetY <= platform.y + 15 && state.player.vy >= 0) {
          state.player.grounded = true;
          state.player.vy = 0;
          state.player.y = platform.y - state.player.h;
        }
      }
    }

    // Jump Buffer
    if (state.jumpBuffer > 0) {
      state.jumpBuffer--;
      if (state.player.grounded) {
        state.player.vy = state.JUMP_FORCE;
        state.player.grounded = false;
        state.jumpBuffer = 0;
        state.spriteAnimFrame = 0; // Reset animation when jumping
        state.spriteFrameCounter = 0;
        // Spawn jump dust
        for (let i = 0; i < 5; i++) {
          state.particles.push({
            x: state.player.x + 25,
            y: state.player.y + 50,
            vx: (Math.random() - 0.5) * 4,
            vy: Math.random() * -2,
            life: 20,
            color: 'rgba(255,255,255,0.6)',
            type: 'dust',
          });
        }
      }
    }

    // Walking dust particles
    if (state.player.grounded) {
      if (state.frame % 8 === 0) {
        state.particles.push({
          x: state.player.x,
          y: state.player.y + 50,
          vx: -2,
          vy: -1,
          life: 15,
          color: 'rgba(255,255,255,0.4)',
          type: 'dust',
        });
      }
    }

    // Fall Death
    if (state.player.y > state.height) {
      state.gameLost = true;
      setGameState({ started: true, lost: true, won: false, celebrating: false, score: state.score, loading: false, teamColor: selectedTeamColor });
      return;
    }

    // Platform Movement
    state.platforms.forEach(p => (p.x -= effectiveSpeed));
    state.items.forEach(i => (i.x -= effectiveSpeed));
    state.platforms = state.platforms.filter(p => p.x + p.w > -100);
    state.items = state.items.filter(i => i.x > -100);

    // Particle update
    state.particles.forEach(p => {
      p.x += p.vx || 0;
      p.y += p.vy || 0;
      if (p.type === 'text') p.x -= effectiveSpeed;
      p.life--;
    });
    state.particles = state.particles.filter(p => p.life > 0);

    spawnManager();

    // Item Collection
    state.items.forEach(item => {
      if (!item.collected) {
        const dx = state.player.x + state.player.w / 2 - (item.x + 15);
        const dy = state.player.y + state.player.h / 2 - (item.y - 10);
        if (Math.sqrt(dx * dx + dy * dy) < 85) {
          collectItem(item);
        }
      }
    });
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const state = gameStateRef.current;
    
    ctx.clearRect(0, 0, state.width, state.height);
    // Ensure canvas drawing state is reset each frame to avoid accidental transparency
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // Diagnostic helper: record any unexpected canvas alpha changes
    const checkAlpha = (label: string) => {
      try {
        if (ctx.globalAlpha !== 1) {
          const msg = `Alpha ${ctx.globalAlpha} at ${label} (frame ${state.frame})`;
          state._alphaWarnings.push(msg);
          if (state._alphaWarnings.length > 200) state._alphaWarnings.shift();

          let el = document.getElementById('alpha-log') as HTMLPreElement | null;
          if (!el) {
            el = document.createElement('pre');
            el.id = 'alpha-log';
            el.style.position = 'fixed';
            el.style.right = '10px';
            el.style.top = '10px';
            el.style.zIndex = '9999';
            el.style.background = 'rgba(0,0,0,0.6)';
            el.style.color = 'white';
            el.style.padding = '8px';
            el.style.maxHeight = '50vh';
            el.style.overflow = 'auto';
            el.style.fontSize = '12px';
            document.body.appendChild(el);
          }
          el.textContent = state._alphaWarnings.slice(-20).join('\n');
          console.warn(msg);
        }
      } catch (e) {
        // ignore during server-side render or if document isn't available
      }
    };

    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, state.height);
    grad.addColorStop(0, '#29B6F6');
    grad.addColorStop(1, '#B3E5FC');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, state.width, state.height);

    // Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    state.clouds.forEach(c => {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.scale(c.scale, c.scale);
      ctx.beginPath();
      ctx.arc(0, 0, 40, 0, Math.PI * 2);
      ctx.arc(30, 10, 50, 0, Math.PI * 2);
      ctx.arc(70, 0, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    checkAlpha('afterClouds');

    // Hills
    state.hills.forEach(h => {
      ctx.fillStyle = h.color;
      ctx.beginPath();
      ctx.ellipse(h.x, state.height, h.w, h.h, 0, Math.PI, 0);
      ctx.fill();
    });
    checkAlpha('afterHills');

    // Platforms
    state.platforms.forEach(p => {
      // Brown platform body with rounded corners
      ctx.fillStyle = '#8D6E63';
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.w, p.h, 15);
      ctx.fill();

      // Green grass top with wavy edges
      ctx.fillStyle = '#66BB6A';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y + 18);
      
      // Draw wavy top edge
      for (let i = 0; i <= p.w; i += 16) {
        const waveHeight = 8;
        const controlX = Math.min(p.x + i + 8, p.x + p.w);
        const endX = Math.min(p.x + i + 16, p.x + p.w);
        ctx.quadraticCurveTo(controlX, p.y - waveHeight, endX, p.y + 3);
      }
      
      // Draw right edge
      ctx.lineTo(p.x + p.w, p.y + 18);
      ctx.lineTo(p.x + p.w, p.y + 20);
      ctx.lineTo(p.x, p.y + 20);
      ctx.closePath();
      ctx.fill();

      // Add darker shade for depth
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(p.x, p.y + 18, p.w, 2);

      // Draw platform decorations
      if (p.decor) {
        p.decor.forEach(d => {
          const drawX = p.x + d.x;
          const drawY = p.y - 5;
          
          if (d.type === 'grass') {
            ctx.strokeStyle = '#2E7D32';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(drawX, drawY);
            ctx.lineTo(drawX - 4, drawY - 10);
            ctx.moveTo(drawX, drawY);
            ctx.lineTo(drawX + 4, drawY - 8);
            ctx.stroke();
          } else if (d.type === 'flower') {
            // Stem
            ctx.strokeStyle = '#388E3C';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(drawX, drawY);
            ctx.lineTo(drawX, drawY - 12);
            ctx.stroke();
            // Petals
            ctx.fillStyle = d.color || '#FF1744';
            for (let j = 0; j < 5; j++) {
              const angle = (j / 5) * Math.PI * 2;
              const px = drawX + Math.cos(angle) * 4;
              const py = drawY - 14 + Math.sin(angle) * 4;
              ctx.beginPath();
              ctx.arc(px, py, 3, 0, Math.PI * 2);
              ctx.fill();
            }
            // Center
            ctx.fillStyle = '#FFEB3B';
            ctx.beginPath();
            ctx.arc(drawX, drawY - 14, 2, 0, Math.PI * 2);
            ctx.fill();
          } else if (d.type === 'mushroom') {
            // Mushroom cap
            ctx.fillStyle = '#EF5350';
            ctx.beginPath();
            ctx.arc(drawX, drawY - 8, 5, 0, Math.PI * 2);
            ctx.fill();
            // White spots
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(drawX - 2, drawY - 9, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(drawX + 2, drawY - 8, 1.5, 0, Math.PI * 2);
            ctx.fill();
            // Stem
            ctx.fillStyle = '#FFF9C4';
            ctx.fillRect(drawX - 1, drawY - 5, 2, 5);
          }
        });
      }
    });
    checkAlpha('afterPlatforms');

    // Items
    state.items.forEach(item => {
      if (!item.collected) {
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(item.x + 15, item.y - 10, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = 'black';
        ctx.font = 'bold 35px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(item.val, item.x + 15, item.y + 2);
      }
    });
    checkAlpha('afterItems');

    // Particles (non-text) — draw behind player so they don't dim the character
    state.particles.forEach(p => {
      if (p.type === 'text') return;
      ctx.save();
      // particle colors may include alpha in their string; ensure we don't leave global alpha changed
      ctx.globalAlpha = 1;
      if (p.type === 'pop') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size || 5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
    checkAlpha('afterParticles');

    // Player (draw after background particles so it's not visually dimmed)
    ctx.save();
    ctx.globalAlpha = 1;
    
    const spriteDrawStart = performance.now();
    
    // Draw sprite if loaded, otherwise fallback to emoji
    if (spritesLoadedRef.current && runFramesRef.current.length > 0 && jumpFramesRef.current.length > 0) {
      const isJumping = !state.player.grounded;
      const frames = isJumping ? jumpFramesRef.current : runFramesRef.current;
      const currentFrameImg = frames[state.spriteAnimFrame % frames.length];
      
      ctx.translate(state.player.x + state.player.w / 2, state.player.y + state.player.h / 2);
      ctx.rotate(state.player.angle);
      
      ctx.drawImage(
        currentFrameImg,
        -state.player.w / 2,
        -state.player.h / 2,
        state.player.w,
        state.player.h
      );
      
      const spriteDrawEnd = performance.now();
      const spriteDrawTime = spriteDrawEnd - spriteDrawStart;
      
      // Debug: show frame time and sprite draw time
      if (state.frame % 30 === 0) {
        console.log(`Frame: ${state.spriteAnimFrame}, Sprite draw: ${spriteDrawTime.toFixed(2)}ms, Jumping: ${isJumping}`);
      }
    } else {
      // Fallback to emoji if sprite isn't loaded
      ctx.translate(state.player.x + 25, state.player.y + 25);
      ctx.rotate(state.player.angle);
      ctx.font = '60px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(state.playerChar, 0, 20);
    }
    
    ctx.restore();
    checkAlpha('afterPlayer');

    // Text particles on top (floating labels)
    state.particles.forEach(p => {
      if (p.type !== 'text') return;
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.font = 'bold 30px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(p.text || '', p.x, p.y);
      ctx.restore();
    });

    // UI
    ctx.fillStyle = '#333';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${state.score}`, 20, 40);
    ctx.fillText(`Time: ${Math.ceil(state.timeLeft)}s`, 20, 70);
    ctx.fillText(`Word: ${state.currentWord}`, 20, 100);
  };

  const gameLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const frameStart = performance.now();
    const state = gameStateRef.current;

    update();
    draw(ctx);

    const frameEnd = performance.now();
    const frameTime = frameEnd - frameStart;
    
    // Log frame time every 10 frames during first 60 frames (5 seconds at 60fps)
    if (state.frame < 60 && state.frame % 10 === 0) {
      console.log(`[Frame ${state.frame}] Total: ${frameTime.toFixed(2)}ms (Budget: 16.67ms for 60fps)`);
    }

    gameStateRef.current.frameId = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Load individual sprite frames from run and jump folders in parallel
    const loadFrames = async () => {
      const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = src;
      });

      try {
        const runSrcs = Array.from({ length: 8 }, (_, i) => `/Assets/run/${i + 1}.png`);
        const jumpSrcs = Array.from({ length: 5 }, (_, i) => `/Assets/jump/${i + 1}.png`);

        // Start loading all images in parallel
        const [runFrames, jumpFrames] = await Promise.all([
          Promise.all(runSrcs.map(loadImage)),
          Promise.all(jumpSrcs.map(loadImage)),
        ]);

        // Convert to ImageBitmap for full hardware decode + better rendering performance
        try {
          const runBitmaps = await Promise.all(runFrames.map(img => createImageBitmap(img)));
          const jumpBitmaps = await Promise.all(jumpFrames.map(img => createImageBitmap(img)));

          runFramesRef.current = runBitmaps as any;
          jumpFramesRef.current = jumpBitmaps as any;
        } catch (bitmapErr) {
          // Fallback: use raw images if ImageBitmap fails
          console.warn('ImageBitmap conversion failed, using raw images', bitmapErr);
          runFramesRef.current = runFrames as any;
          jumpFramesRef.current = jumpFrames as any;
        }

        spritesLoadedRef.current = true;
        console.log(`Sprites loaded successfully: ${runFramesRef.current.length} run frames, ${jumpFramesRef.current.length} jump frames`);

        // Update state to show game is ready
        setGameState(prev => ({ ...prev, loading: false }));
      } catch (err) {
        console.warn('Failed to load sprite frames, using emoji fallback', err);
        spritesLoadedRef.current = false;
        setGameState(prev => ({ ...prev, loading: false }));
      }
    };

    loadFrames();

    const state = gameStateRef.current;
    state.width = canvas.offsetWidth;
    state.height = canvas.offsetHeight;
    canvas.width = state.width;
    canvas.height = state.height;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        state.jumpBuffer = 20;
      }
    };

    const handleClick = () => {
      state.jumpBuffer = 20;
    };

    window.addEventListener('keydown', handleKeyPress);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', handleClick);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('touchstart', handleClick);
    };
  }, []);

  const startGame = () => {
    if (!selectedTeamColor) {
      alert('Please select a team color before starting');
      return;
    }
    const state = gameStateRef.current;
    state.gameStarted = true;
    state.gameLost = false;
    state.gameWon = false;
    state.celebrating = false;
    state.score = 0;
    state.timeLeft = state.START_TIME;
    state.wordsCollectedCount = 0;
    state.wordsCollected = [];
    state.readyDelay = 2;
    state.defaultPlayerX = state.width * 0.15;
    state.platforms = [];
    state.items = [];
    state.particles = [];
    state.clouds = [];
    state.hills = [];

    for (let i = 0; i < 5; i++) spawnCloud(Math.random() * state.width);
    for (let i = 0; i < 3; i++) spawnHill(Math.random() * state.width);

    pickNewWord();
    spawnPlatform(0, state.height - state.FLOOR_HEIGHT, state.width * 1.5, 'ground');
    
    // Pre-spawn initial platforms and items to reduce perceived load time
    for (let i = 0; i < 8; i++) {
      spawnManager();
    }

    // Detect the first ground platform to place player correctly
    const firstGroundPlatform = state.platforms.find(p => p.type === 'ground');
    if (firstGroundPlatform) {
      state.player.y = firstGroundPlatform.y - state.player.h;
    } else {
      // Fallback if no platform found (shouldn't happen)
      state.player.y = state.height / 2;
    }
    
    state.player.x = state.defaultPlayerX;
    state.player.vy = 0;

    setGameState({ started: true, lost: false, won: false, celebrating: false, score: 0, loading: false, teamColor: selectedTeamColor });
    gameLoop();
  };

  const resetGame = () => {
    const state = gameStateRef.current;
    state.gameStarted = false;
    state.gameLost = false;
    state.gameWon = false;
    state.celebrating = false;
    setGameState({ started: false, lost: false, won: false, celebrating: false, score: 0, loading: false, teamColor: selectedTeamColor });
    if (state.frameId) cancelAnimationFrame(state.frameId);
  };

  return (
    <div className="w-full h-full bg-gradient-to-b from-blue-400 to-blue-200 flex flex-col relative">
      <canvas
        ref={canvasRef}
        className="flex-1 w-full"
        style={{ touchAction: 'none' }}
      />

      {gameState.loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg text-center">
            <h1 className="text-4xl font-bold mb-4">🏃 Word Runner</h1>
            <p className="text-lg mb-6">Loading game assets...</p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          </div>
        </div>
      )}

      {!gameState.started && !gameState.loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg text-center max-w-2xl">
            <h1 className="text-4xl font-bold mb-4">🏃 Word Runner</h1>
            <p className="text-lg mb-6">Collect letters to spell words!</p>
            
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-600 mb-4">Select Your Team Color</p>
              <div className="grid grid-cols-3 gap-3">
                {TEAM_COLORS.map((color) => {
                  const isSelected = selectedTeamColor === color.value;
                  return (
                    <button
                      key={color.value}
                      onClick={() => setSelectedTeamColor(color.value)}
                      className={`transition-all duration-200 rounded-lg p-4 font-semibold text-white border-2`}
                      style={{
                        backgroundColor: color.value,
                        borderColor: isSelected ? '#333' : '#ccc',
                        opacity: isSelected ? 1 : 0.5,
                        transform: isSelected ? 'scale(1.3)' : 'scale(0.75)',
                        boxShadow: isSelected ? `0 4px 12px ${color.value}80` : 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {color.name}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <button
              onClick={startGame}
              disabled={!selectedTeamColor}
              className={`${
                selectedTeamColor
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'bg-gray-300 cursor-not-allowed'
              } text-white px-8 py-3 rounded-lg font-bold text-lg`}
            >
              Start Game
            </button>
            <button
              onClick={onClose}
              className="mt-3 px-8 py-2 border border-gray-400 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              Exit
            </button>
          </div>
        </div>
      )}

      {gameState.lost && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-white p-8 rounded-lg text-center">
            <h1 className="text-4xl font-bold mb-4 text-red-500">Time's Up!</h1>
            <p className="text-xl mb-4">Final Score: {gameState.score}</p>
            <p className="text-lg mb-6">Words Collected: {gameStateRef.current.wordsCollectedCount}</p>
            <button
              onClick={() => {
                resetGame();
                startGame();
              }}
              className="bg-blue-500 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-blue-600 mr-3"
            >
              Try Again
            </button>
            <button
              onClick={() => {
                resetGame();
                onClose?.();
              }}
              className="bg-gray-500 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-600"
            >
              Exit
            </button>
          </div>
        </div>
      )}

      {gameState.won && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-white p-8 rounded-lg text-center" style={{ borderTop: `6px solid ${gameState.teamColor || '#4CAF50'}` }}>
            <h1 className="text-4xl font-bold mb-3 text-green-500">🎉 Congratulations!</h1>
            {gameState.teamColor && (
              <div className="mb-4 flex items-center justify-center gap-3">
                <div
                  className="w-8 h-8 rounded-full border-2 border-gray-300"
                  style={{ backgroundColor: gameState.teamColor }}
                />
                <span className="text-2xl font-bold" style={{ color: gameState.teamColor }}>
                  {TEAM_COLORS.find(c => c.value === gameState.teamColor)?.name} Team Wins!
                </span>
              </div>
            )}
            <p className="text-xl mb-2">Final Score: {gameState.score}</p>
            <p className="text-lg mb-6">Words Mastered: {gameStateRef.current.wordsCollectedCount}</p>
            <button
              onClick={() => {
                resetGame();
                setSelectedTeamColor(null);
              }}
              className="bg-blue-500 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-blue-600 mr-3"
            >
              Play Again
            </button>
            <button
              onClick={() => {
                resetGame();
                onClose?.();
              }}
              className="bg-gray-500 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-600"
            >
              Exit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WordRunner;
