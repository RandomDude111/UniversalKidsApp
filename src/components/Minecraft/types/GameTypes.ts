// Game Object Types
export interface Vector2 {
  x: number;
  y: number;
}

export interface Block {
  x: number;
  y: number;
  type: 'dirt' | 'grass' | 'stone' | 'wood' | 'leaves' | 'letter' | 'apple' | 'air';
  collected?: boolean;
  breakProgress?: number; // 0-100, for visual breaking effect
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityX: number;
  velocityY: number;
  isJumping: boolean;
  isGrounded: boolean;
  isMovingLeft: boolean;
  isMovingRight: boolean;
}

export interface Particle {
  x: number;
  y: number;
  velocityX?: number;
  velocityY?: number;
  life: number;
  color: string;
  type: 'dust' | 'text' | 'pop';
  text?: string;
  size?: number;
}

export interface InventoryItem {
  id: string;
  type: 'dirt' | 'grass' | 'stone' | 'wood' | 'leaves' | 'letter' | 'apple';
  quantity: number;
}

export interface LevelObjective {
  type: 'collect' | 'place' | 'read' | 'sequence';
  target: string | string[];
  description: string;
  completed: boolean;
  progress?: {
    current: number;
    total: number;
  };
}

export interface LevelDefinition {
  id: string;
  name: string;
  description: string;
  storyText?: string;
  worldSize: {
    width: number;
    height: number;
  };
  initialBlocks: Block[];
  objectives: LevelObjective[];
  toolsAvailable: ('hand' | 'pickaxe' | 'axe' | 'shovel')[];
  timeLimit?: number;
  hints?: string[];
}

export interface GameState {
  currentLevel: LevelDefinition;
  player: Player;
  blocks: Block[];
  inventory: InventoryItem[];
  particles: Particle[];
  objectives: LevelObjective[];
  selectedTool: 'hand' | 'pickaxe' | 'axe' | 'shovel';
  gameActive: boolean;
  levelComplete: boolean;
  score: number;
  timeElapsed: number;
  canvasWidth: number;
  canvasHeight: number;
  cameraX: number; // World offset for camera panning
  cameraY: number;
  breakingBlock: { x: number; y: number } | null; // Block currently being broken
  breakingProgress: number; // 0-100, duration depends on tool
}

export interface BlockTexture {
  type: string;
  color: string;
  pattern?: 'solid' | 'dots' | 'lines';
}
