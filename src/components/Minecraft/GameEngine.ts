import { Block, GameState, LevelDefinition, InventoryItem } from './types/GameTypes';

const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const PLAYER_SPEED = 5;
const BLOCK_SIZE = 32;

export class MinecraftGameEngine {
  private state: GameState;

  constructor(level: LevelDefinition, canvasWidth: number, canvasHeight: number) {
    // Generate larger world (2x canvas size for exploration)
    const BLOCK_SIZE = 32;
    const worldGridWidth = Math.max(Math.ceil(canvasWidth / BLOCK_SIZE) * 2, 30);
    const worldGridHeight = Math.ceil(canvasHeight / BLOCK_SIZE);
    const groundGridY = worldGridHeight - 4;
    
    // Create ground layer
    const groundBlocks: Block[] = [];
    for (let gridX = 0; gridX < worldGridWidth; gridX++) {
      groundBlocks.push({ x: gridX, y: groundGridY, type: 'grass', collected: false, breakProgress: 0 });
      groundBlocks.push({ x: gridX, y: groundGridY + 1, type: 'dirt', collected: false, breakProgress: 0 });
      groundBlocks.push({ x: gridX, y: groundGridY + 2, type: 'dirt', collected: false, breakProgress: 0 });
    }
    
    // Add trees scattered throughout
    for (let i = 0; i < 12; i++) {
      const treeGridX = Math.floor(Math.random() * (worldGridWidth - 2)) + 1;
      const treeBaseY = groundGridY - 4;

      groundBlocks.push({ x: treeGridX, y: treeBaseY + 3, type: 'wood', collected: false, breakProgress: 0 });
      groundBlocks.push({ x: treeGridX, y: treeBaseY + 2, type: 'wood', collected: false, breakProgress: 0 });
      groundBlocks.push({ x: treeGridX, y: treeBaseY + 1, type: 'wood', collected: false, breakProgress: 0 });
      groundBlocks.push({ x: treeGridX, y: treeBaseY, type: 'wood', collected: false, breakProgress: 0 });
      groundBlocks.push({ x: treeGridX, y: treeBaseY - 1, type: 'leaves', collected: false, breakProgress: 0 });
      groundBlocks.push({ x: treeGridX - 1, y: treeBaseY, type: 'leaves', collected: false, breakProgress: 0 });
      groundBlocks.push({ x: treeGridX + 1, y: treeBaseY, type: 'leaves', collected: false, breakProgress: 0 });
    }
    
    // Add some stone blocks for variety
    for (let i = 0; i < 15; i++) {
      const stoneGridX = Math.floor(Math.random() * (worldGridWidth - 2)) + 1;
      const stoneGridY = groundGridY + 1 + Math.floor(Math.random() * 2);
      groundBlocks.push({ x: stoneGridX, y: stoneGridY, type: 'stone', collected: false, breakProgress: 0 });
    }
    
    // Calculate proper starting position based on canvas height and ground position
    const playerStartY = groundGridY * BLOCK_SIZE - 40; // Player height is 40
    const playerStartX = Math.floor(worldGridWidth / 4) * BLOCK_SIZE; // Start 1/4 into the world
    
    this.state = {
      currentLevel: level,
      player: {
        x: playerStartX,
        y: playerStartY,
        width: 30,
        height: 40,
        velocityX: 0,
        velocityY: 0,
        isJumping: false,
        isGrounded: false,
        isMovingLeft: false,
        isMovingRight: false,
      },
      blocks: groundBlocks,
      inventory: this.initializeInventory(),
      particles: [],
      objectives: [...level.objectives],
      selectedTool: 'hand',
      gameActive: true,
      levelComplete: false,
      score: 0,
      timeElapsed: 0,
      canvasWidth,
      canvasHeight,
      cameraX: 0,
      cameraY: 0,
      breakingBlock: null,
      breakingProgress: 0,
    };
  }

  private initializeInventory(): InventoryItem[] {
    return [
      { id: 'dirt', type: 'dirt', quantity: 5 },
      { id: 'wood', type: 'wood', quantity: 3 },
      { id: 'stone', type: 'stone', quantity: 0 },
    ];
  }

  getState(): GameState {
    return this.state;
  }

  update(deltaTime: number = 1 / 60): void {
    if (!this.state.gameActive) return;

    this.state.timeElapsed += deltaTime;

    // Player movement
    this.updatePlayerMovement();

    // Physics
    this.updatePhysics();

    // Block collision
    this.updateBlockCollisions();

    // Update camera to follow player
    this.updateCamera();

    // Update block breaking progress
    this.updateBlockBreaking();

    // Particles
    this.updateParticles();

    // Objective tracking
    this.updateObjectives();
  }

  private updatePlayerMovement(): void {
    const player = this.state.player;

    if (player.isMovingLeft) {
      player.velocityX = -PLAYER_SPEED;
    } else if (player.isMovingRight) {
      player.velocityX = PLAYER_SPEED;
    } else {
      player.velocityX *= 0.85; // friction
    }

    player.x += player.velocityX;

    // Boundary check
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > this.state.canvasWidth) {
      player.x = this.state.canvasWidth - player.width;
    }
  }

  private updatePhysics(): void {
    const player = this.state.player;

    // Apply gravity
    player.velocityY += GRAVITY;
    player.y += player.velocityY;

    // Ground check
    player.isGrounded = false;
  }

  private updateBlockCollisions(): void {
    const player = this.state.player;

    for (const block of this.state.blocks) {
      if (block.type === 'air' || block.collected) continue;

      const blockPixelX = block.x * BLOCK_SIZE;
      const blockPixelY = block.y * BLOCK_SIZE;
      const blockPixelW = BLOCK_SIZE;
      const blockPixelH = BLOCK_SIZE;

      // Check collision
      if (
        player.x < blockPixelX + blockPixelW &&
        player.x + player.width > blockPixelX &&
        player.y < blockPixelY + blockPixelH &&
        player.y + player.height > blockPixelY
      ) {
        const prevFeetY = player.y - player.velocityY;

        // Landing on top
        if (prevFeetY + player.height <= blockPixelY + 10 && player.velocityY >= 0) {
          player.isGrounded = true;
          player.velocityY = 0;
          player.y = blockPixelY - player.height;
        }
      }
    }

    // Ground below canvas
    if (player.y + player.height >= this.state.canvasHeight) {
      player.isGrounded = true;
      player.velocityY = 0;
      player.y = this.state.canvasHeight - player.height;
    }
  }

  private updateParticles(): void {
    this.state.particles.forEach(p => {
      p.x += p.velocityX || 0;
      p.y += p.velocityY || 0;
      if (p.velocityY !== undefined) {
        p.velocityY += 0.3; // gravity on particles
      }
      p.life--;
    });

    this.state.particles = this.state.particles.filter(p => p.life > 0);
  }

  private updateObjectives(): void {
    for (const objective of this.state.objectives) {
      if (objective.completed) continue;

      if (objective.type === 'collect') {
        const target = Array.isArray(objective.target) ? objective.target[0] : objective.target;
        const collected = this.state.inventory.find(i => i.id === target);
        if (collected && collected.quantity > 0) {
          objective.completed = true;
          this.state.score += 100;
        }
      }
    }

    // Check if all objectives done
    if (this.state.objectives.every(o => o.completed)) {
      this.state.levelComplete = true;
      this.state.gameActive = false;
    }
  }

  private updateCamera(): void {
    const player = this.state.player;
    const targetCameraX = player.x - this.state.canvasWidth / 2;
    const targetCameraY = player.y - this.state.canvasHeight / 3;

    // Smooth camera follow
    this.state.cameraX += (targetCameraX - this.state.cameraX) * 0.1;
    this.state.cameraY += (targetCameraY - this.state.cameraY) * 0.1;

    // Clamp camera to world bounds
    const maxWorldWidth = 30 * BLOCK_SIZE; // Approximate max world width
    this.state.cameraX = Math.max(0, Math.min(this.state.cameraX, maxWorldWidth - this.state.canvasWidth));
    this.state.cameraY = Math.max(0, Math.min(this.state.cameraY, this.state.canvasHeight - 100));
  }

  private updateBlockBreaking(): void {
    if (!this.state.breakingBlock) return;

    // Get break time based on tool
    const breakTimes: Record<string, Record<string, number>> = {
      hand: { 'dirt': 25, 'grass': 25, 'leaves': 15, 'stone': 250 },
      pickaxe: { 'stone': 50, 'dirt': 250, 'grass': 250, 'leaves': 250 },
      axe: { 'wood': 30, 'leaves': 15, 'dirt': 250, 'grass': 250, 'stone': 250 },
      shovel: { 'dirt': 15, 'grass': 15, 'stone': 250, 'wood': 250, 'leaves': 250 },
    };

    const block = this.state.blocks.find(
      b => b.x === this.state.breakingBlock!.x && b.y === this.state.breakingBlock!.y
    );
    if (!block) {
      this.state.breakingBlock = null;
      return;
    }

    const breakTime = breakTimes[this.state.selectedTool]?.[block.type] || 100;
    this.state.breakingProgress += (1 / breakTime) * 100;

    if (this.state.breakingProgress >= 100) {
      // Block is fully broken
      block.collected = true;
      block.breakProgress = 0;
      this.addToInventory(block.type);
      this.spawnParticle(block.x * BLOCK_SIZE + BLOCK_SIZE / 2, block.y * BLOCK_SIZE + BLOCK_SIZE / 2, 'pop', block.type);
      this.state.score += 10;
      this.state.breakingBlock = null;
      this.state.breakingProgress = 0;
    } else {
      block.breakProgress = this.state.breakingProgress;
    }
  }

  // Input handling
  setPlayerMovement(left: boolean, right: boolean): void {
    this.state.player.isMovingLeft = left;
    this.state.player.isMovingRight = right;
  }

  jump(): void {
    if (this.state.player.isGrounded) {
      this.state.player.velocityY = JUMP_FORCE;
      this.state.player.isGrounded = false;
      this.spawnParticle(
        this.state.player.x + this.state.player.width / 2,
        this.state.player.y + this.state.player.height,
        'dust'
      );
    }
  }

  breakBlock(gridX: number, gridY: number): void {
    const block = this.state.blocks.find(b => b.x === gridX && b.y === gridY);
    if (!block || block.type === 'air' || block.collected) return;

    // Check if block is within reach (near player)
    const playerGridX = Math.floor(this.state.player.x / BLOCK_SIZE);
    const playerGridY = Math.floor(this.state.player.y / BLOCK_SIZE);
    const distance = Math.abs(gridX - playerGridX) + Math.abs(gridY - playerGridY);

    if (distance > 3) return; // Out of reach

    // Tool matching logic
    const toolBlockMatchMap: Record<string, string[]> = {
      hand: ['dirt', 'leaves', 'grass'],
      axe: ['wood', 'leaves'],
      pickaxe: ['stone'],
      shovel: ['dirt', 'grass'],
    };

    const canBreak = toolBlockMatchMap[this.state.selectedTool]?.includes(block.type);
    if (!canBreak) return;

    // Start breaking this block
    this.state.breakingBlock = { x: gridX, y: gridY };
    this.state.breakingProgress = 0;
  }

  continueBreakBlock(gridX: number, gridY: number): void {
    // If player is trying to break a different block, switch
    if (!this.state.breakingBlock || this.state.breakingBlock.x !== gridX || this.state.breakingBlock.y !== gridY) {
      this.breakBlock(gridX, gridY);
    }
  }

  stopBreakBlock(): void {
    if (this.state.breakingBlock) {
      const block = this.state.blocks.find(
        b => b.x === this.state.breakingBlock!.x && b.y === this.state.breakingBlock!.y
      );
      if (block) {
        block.breakProgress = 0;
      }
    }
    this.state.breakingBlock = null;
    this.state.breakingProgress = 0;
  }

  placeBlock(gridX: number, gridY: number, blockType: string): void {
    const existingBlock = this.state.blocks.find(b => b.x === gridX && b.y === gridY);
    if (existingBlock && existingBlock.type !== 'air') return;

    const invItem = this.state.inventory.find(i => i.id === blockType);
    if (!invItem || invItem.quantity <= 0) return;

    // Check reach
    const playerGridX = Math.floor(this.state.player.x / BLOCK_SIZE);
    const playerGridY = Math.floor(this.state.player.y / BLOCK_SIZE);
    const distance = Math.abs(gridX - playerGridX) + Math.abs(gridY - playerGridY);
    if (distance > 3) return;

    const newBlock: Block = {
      x: gridX,
      y: gridY,
      type: blockType as any,
      collected: false,
    };

    if (existingBlock) {
      existingBlock.type = blockType as any;
      existingBlock.collected = false;
    } else {
      this.state.blocks.push(newBlock);
    }

    invItem.quantity--;
    this.state.score += 5;
  }

  selectTool(tool: 'hand' | 'pickaxe' | 'axe' | 'shovel'): void {
    if (this.state.currentLevel.toolsAvailable.includes(tool)) {
      this.state.selectedTool = tool;
    }
  }

  private addToInventory(type: string): void {
    const existing = this.state.inventory.find(i => i.id === type);
    if (existing) {
      existing.quantity++;
    } else {
      this.state.inventory.push({
        id: type,
        type: type as any,
        quantity: 1,
      });
    }
  }

  private spawnParticle(x: number, y: number, type: 'dust' | 'text' | 'pop', color?: string): void {
    this.state.particles.push({
      x,
      y,
      velocityX: (Math.random() - 0.5) * 4,
      velocityY: Math.random() * -3,
      life: 30,
      color: color || '#888888',
      type,
    });
  }
}
