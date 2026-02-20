import React, { useRef, useEffect, useState } from 'react';
import { useGameState } from './hooks/useGameState';
import { MINECRAFT_LEVELS } from './levels/levelDefinitions';
import LevelStory from './ui/LevelStory';
import VirtualJoystick from './ui/VirtualJoystick';
import Hotbar from './ui/Hotbar';
import { Block } from './types/GameTypes';

interface MinecraftGameProps {
  onClose?: () => void;
  levelId?: string;
}

const BLOCK_SIZE = 32;
const TILE_COLORS: Record<string, string> = {
  dirt: '#8B6F47',
  grass: '#5D9B35',
  stone: '#A0A0A0',
  wood: '#6B4423',
  leaves: '#2D8F2D',
  letter: '#FFD700',
  apple: '#FF4444',
  air: 'transparent',
};

const MinecraftGame: React.FC<MinecraftGameProps> = ({ onClose, levelId = 'level-1-apple-pie' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [currentLevelIndex, setCurrentLevelIndex] = useState(
    Math.max(0, MINECRAFT_LEVELS.findIndex(l => l.id === levelId))
  );
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [won, setWon] = useState(false);
  
  const currentLevel = MINECRAFT_LEVELS[currentLevelIndex];
  const { 
    gameState, 
    updateGame, 
    handleSetMovement, 
    handleJump, 
    handleBreakBlock,
    handleStopBreakBlock,
    handlePanCamera,
    handleSelectTool 
  } = useGameState(currentLevel, canvasSize.width, canvasSize.height);

  const keysPressed = useRef({ a: false, d: false, space: false });
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const longClickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLongClickRef = useRef(false);

  // Canvas setup
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.parentElement?.getBoundingClientRect();
        if (rect) {
          setCanvasSize({
            width: rect.width,
            height: rect.height,
          });
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Game loop
  useEffect(() => {
    if (!gameStarted || !canvasRef.current || gameEnded) return;

    const gameLoop = () => {
      updateGame();

      // Check for game end conditions
      if (gameState?.levelComplete) {
        setGameEnded(true);
        setWon(true);
      }

      requestAnimationFrame(gameLoop);
    };

    const loopId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(loopId);
  }, [gameStarted, gameEnded, gameState?.levelComplete, updateGame]);

  // Touch input handling for joystick movement
  const handleJoystickMove = (x: number) => {
    const movingLeft = x < -0.2;
    const movingRight = x > 0.2;
    handleSetMovement(movingLeft, movingRight);
  };

  // Keyboard support for desktop testing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'a') {
        keysPressed.current.a = true;
        handleSetMovement(true, keysPressed.current.d);
      }
      if (key === 'd') {
        keysPressed.current.d = true;
        handleSetMovement(keysPressed.current.a, true);
      }
      if (key === ' ') {
        e.preventDefault();
        handleJump();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'a') {
        keysPressed.current.a = false;
        handleSetMovement(false, keysPressed.current.d);
      }
      if (key === 'd') {
        keysPressed.current.d = false;
        handleSetMovement(keysPressed.current.a, false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleSetMovement, handleJump]);

  // Canvas touch and mouse handling
  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !gameState) return;

    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    isLongClickRef.current = false;

    // Set up long click timer
    longClickTimeoutRef.current = setTimeout(() => {
      if (!canvasRef.current || !gameState || !touchStartRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const clickX = touchStartRef.current.x - rect.left + gameState.cameraX;
      const clickY = touchStartRef.current.y - rect.top + gameState.cameraY;

      const gridX = Math.floor(clickX / BLOCK_SIZE);
      const gridY = Math.floor(clickY / BLOCK_SIZE);

      isLongClickRef.current = true;
      handleBreakBlock(gridX, gridY);
    }, 300); // 300ms for long click
  };

  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!gameState || !touchStartRef.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    // If moved more than 10px, cancel long click
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      if (longClickTimeoutRef.current) {
        clearTimeout(longClickTimeoutRef.current);
        longClickTimeoutRef.current = null;
      }
      handleStopBreakBlock();

      // Pan the camera
      handlePanCamera(deltaX * 0.5, deltaY * 0.5);
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleCanvasTouchEnd = () => {
    if (longClickTimeoutRef.current) {
      clearTimeout(longClickTimeoutRef.current);
      longClickTimeoutRef.current = null;
    }

    if (isLongClickRef.current) {
      // Long click was held, keep breaking
      if (gameState && gameState.breakingBlock) {
        // Continue breaking the same block
      }
    } else {
      // Short tap, continue breaking if we're still on a block
      if (gameState && gameState.breakingBlock) {
        // Will be updated by continuous gesture, or stop
      }
    }

    touchStartRef.current = null;
  };

  // Render game
  const renderGame = (ctx: CanvasRenderingContext2D, state: any) => {
    if (!state) return;

    // Clear canvas
    ctx.fillStyle = '#87CEEB'; // Sky blue
    ctx.fillRect(0, 0, state.canvasWidth, state.canvasHeight);

    // Draw blocks with camera offset
    state.blocks.forEach((block: Block) => {
      if (block.collected) return;

      const x = block.x * BLOCK_SIZE - state.cameraX;
      const y = block.y * BLOCK_SIZE - state.cameraY;

      // Only draw blocks within view
      if (x + BLOCK_SIZE < 0 || x > state.canvasWidth || y + BLOCK_SIZE < 0 || y > state.canvasHeight) {
        return;
      }

      ctx.fillStyle = TILE_COLORS[block.type] || '#999999';
      ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);

      // Block border
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, BLOCK_SIZE, BLOCK_SIZE);

      // Draw breaking progress if block is being broken
      if (block.breakProgress && block.breakProgress > 0 && block.breakProgress < 100) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(x, y, BLOCK_SIZE * (1 - block.breakProgress / 100), BLOCK_SIZE);
      }

      // Draw emoji for certain block types
      if (block.type === 'apple') {
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🍎', x + BLOCK_SIZE / 2, y + BLOCK_SIZE - 5);
      } else if (block.type === 'letter' && 'letter' in block) {
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#000';
        ctx.fillText((block as any).letter || '?', x + BLOCK_SIZE / 2, y + BLOCK_SIZE - 5);
      }
    });

    // Draw player with camera offset
    const player = state.player;
    const playerScreenX = player.x - state.cameraX;
    const playerScreenY = player.y - state.cameraY;

    ctx.fillStyle = '#FF9900';
    ctx.fillRect(playerScreenX, playerScreenY, player.width, player.height);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(playerScreenX, playerScreenY, player.width, player.height);

    // Draw player eyes
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(playerScreenX + 8, playerScreenY + 10, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(playerScreenX + 22, playerScreenY + 10, 3, 0, Math.PI * 2);
    ctx.fill();

    // Draw particles with camera offset
    state.particles.forEach((p: any) => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / 30;
      ctx.beginPath();
      ctx.arc(p.x - state.cameraX, p.y - state.cameraY, p.size || 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  };

  // Draw function with RAF
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    renderGame(ctx, gameState);
  }, [gameState, canvasSize]);

  return (
    <div className="w-full h-full bg-gray-900 flex flex-col">
      {/* Game Canvas */}
      <div className="flex-1 relative bg-gradient-to-b from-sky-300 to-sky-100 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onTouchStart={handleCanvasTouchStart}
          onTouchMove={handleCanvasTouchMove}
          onTouchEnd={handleCanvasTouchEnd}
        />

        {/* UI Overlays */}
        {gameStarted && gameState && !gameEnded && (
          <>
            {/* Touch Controls - Virtual Joystick (Left) */}
            <VirtualJoystick onMove={handleJoystickMove} size={120} />

            {/* Touch Controls - Jump Button (Right) */}
            <button
              className="fixed bottom-20 right-4 w-16 h-16 bg-green-500 hover:bg-green-600 border-2 border-green-700 text-2xl rounded-full font-bold active:scale-95 transition-all touch-none"
              onTouchStart={handleJump}
              title="Jump"
            >
              ⬆️
            </button>
          </>
        )}

        {/* Level Story Screen */}
        {!gameStarted && <LevelStory level={currentLevel} onStart={() => setGameStarted(true)} onBack={onClose || (() => {})} />}

        {/* End Game Screen */}
        {gameEnded && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 text-center">
              <div className="text-4xl mb-4">{won ? '🎉' : '😢'}</div>
              <h2 className="text-3xl font-bold mb-2">{won ? 'Level Complete!' : 'Game Over'}</h2>
              {gameState && <p className="text-xl text-gray-600 mb-6">Score: {gameState.score}</p>}
              <div className="flex gap-4 justify-center flex-wrap">
                <button
                  onClick={() => {
                    setGameStarted(false);
                    setGameEnded(false);
                    setWon(false);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                  Play Again
                </button>
                {won && currentLevelIndex < MINECRAFT_LEVELS.length - 1 && (
                  <button
                    onClick={() => {
                      setCurrentLevelIndex(currentLevelIndex + 1);
                      setGameStarted(false);
                      setGameEnded(false);
                      setWon(false);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                  >
                    Next Level
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                  Exit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hotbar at bottom */}
      {gameStarted && gameState && !gameEnded && (
        <Hotbar gameState={gameState} onSelectTool={handleSelectTool} />
      )}

      {/* Bottom Info Bar */}
      <div className="bg-gray-800 text-white p-2 text-center text-sm">
        {currentLevel.name} • {gameStarted ? (gameEnded ? 'Game Ended' : 'Playing...') : 'Ready to start'}
      </div>
    </div>
  );
};

export default MinecraftGame;
