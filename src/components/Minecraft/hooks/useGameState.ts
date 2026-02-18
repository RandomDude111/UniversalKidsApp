import { useRef, useState, useCallback, useEffect } from 'react';
import { MinecraftGameEngine } from '../GameEngine';
import { GameState, LevelDefinition } from '../types/GameTypes';

export const useGameState = (level: LevelDefinition, canvasWidth: number, canvasHeight: number) => {
  const engineRef = useRef<MinecraftGameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Initialize engine
  useEffect(() => {
    if (!engineRef.current && canvasWidth > 0 && canvasHeight > 0) {
      engineRef.current = new MinecraftGameEngine(level, canvasWidth, canvasHeight);
      setGameState(engineRef.current.getState());
    }
  }, [level, canvasWidth, canvasHeight]);

  // Update game
  const updateGame = useCallback((deltaTime?: number) => {
    if (!engineRef.current) return;
    engineRef.current.update(deltaTime);
    setGameState({ ...engineRef.current.getState() });
  }, []);

  // Input handlers
  const handleSetMovement = useCallback((left: boolean, right: boolean) => {
    if (engineRef.current) {
      engineRef.current.setPlayerMovement(left, right);
    }
  }, []);

  const handleJump = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.jump();
    }
  }, []);

  const handleBreakBlock = useCallback((gridX: number, gridY: number) => {
    if (engineRef.current) {
      engineRef.current.breakBlock(gridX, gridY);
    }
  }, []);

  const handleContinueBreakBlock = useCallback((gridX: number, gridY: number) => {
    if (engineRef.current) {
      engineRef.current.continueBreakBlock(gridX, gridY);
    }
  }, []);

  const handleStopBreakBlock = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.stopBreakBlock();
    }
  }, []);

  const handlePanCamera = useCallback((deltaX: number, deltaY: number) => {
    if (engineRef.current && gameState) {
      const state = engineRef.current.getState();
      state.cameraX -= deltaX;
      state.cameraY -= deltaY;
      
      // Clamp camera
      const maxWorldWidth = 30 * 32;
      state.cameraX = Math.max(0, Math.min(state.cameraX, maxWorldWidth - canvasWidth));
      state.cameraY = Math.max(0, Math.min(state.cameraY, canvasHeight - 100));
    }
  }, [gameState, canvasWidth]);

  const handlePlaceBlock = useCallback((gridX: number, gridY: number, blockType: string) => {
    if (engineRef.current) {
      engineRef.current.placeBlock(gridX, gridY, blockType);
      setGameState({ ...engineRef.current.getState() });
    }
  }, []);

  const handleSelectTool = useCallback((tool: 'hand' | 'pickaxe' | 'axe' | 'shovel') => {
    if (engineRef.current) {
      engineRef.current.selectTool(tool);
      setGameState({ ...engineRef.current.getState() });
    }
  }, []);

  return {
    gameState,
    updateGame,
    handleSetMovement,
    handleJump,
    handleBreakBlock,
    handleContinueBreakBlock,
    handleStopBreakBlock,
    handlePanCamera,
    handlePlaceBlock,
    handleSelectTool,
    isRunning,
    setIsRunning,
  };
};
