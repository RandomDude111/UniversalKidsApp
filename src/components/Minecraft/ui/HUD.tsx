import React from 'react';
import { GameState, InventoryItem } from '../types/GameTypes';

interface HUDProps {
  gameState: GameState;
  onSelectTool: (tool: 'hand' | 'pickaxe' | 'axe' | 'shovel') => void;
  selectedTool: string;
}

const HUD: React.FC<HUDProps> = ({ gameState, onSelectTool, selectedTool }) => {
  const getBlockIcon = (type: string): string => {
    const icons: Record<string, string> = {
      dirt: '🟫',
      grass: '🟩',
      stone: '⬜',
      wood: '🟪',
      leaves: '🟩',
      letter: '📝',
      apple: '🍎',
      air: '⬛',
    };
    return icons[type] || '❓';
  };


  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Top Left - Score & Objectives */}
      <div className="absolute top-4 left-4 pointer-events-auto">
        <div className="bg-black bg-opacity-75 text-white p-4 rounded-lg">
          <div className="text-2xl font-bold">Score: {gameState.score}</div>
          <div className="text-sm mt-2">
            <div className="text-yellow-300">
              Time: {Math.floor(gameState.timeElapsed)}s
            </div>
          </div>
        </div>
      </div>

      {/* Top Center - Objectives */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-auto">
        <div className="bg-black bg-opacity-75 text-white p-4 rounded-lg max-w-xs">
          <div className="font-bold text-lg mb-2">📋 Objectives</div>
          <div className="space-y-1 text-sm">
            {gameState.objectives.slice(0, 2).map((obj, idx) => (
              <div
                key={idx}
                className={obj.completed ? 'text-green-400 line-through' : 'text-white'}
              >
                <span>{obj.completed ? '✓' : '○'}</span> {obj.description}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Center - Tools */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-auto">
        <div className="bg-black bg-opacity-75 text-white p-3 rounded-lg flex gap-2">
          <button
            onClick={() => onSelectTool('hand')}
            className={`tool-btn p-3 rounded transition-all ${
              selectedTool === 'hand'
                ? 'bg-yellow-500 scale-110'
                : 'bg-gray-600 hover:bg-gray-500'
            }`}
            title="Hand - Break dirt and leaves"
          >
            ✋
          </button>
          {gameState.currentLevel.toolsAvailable.includes('pickaxe') && (
            <button
              onClick={() => onSelectTool('pickaxe')}
              className={`tool-btn p-3 rounded transition-all ${
                selectedTool === 'pickaxe'
                  ? 'bg-yellow-500 scale-110'
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
              title="Pickaxe - Mine stone"
            >
              ⛏️
            </button>
          )}
          {gameState.currentLevel.toolsAvailable.includes('axe') && (
            <button
              onClick={() => onSelectTool('axe')}
              className={`tool-btn p-3 rounded transition-all ${
                selectedTool === 'axe'
                  ? 'bg-yellow-500 scale-110'
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
              title="Axe - Chop wood and leaves"
            >
              🪓
            </button>
          )}
          {gameState.currentLevel.toolsAvailable.includes('shovel') && (
            <button
              onClick={() => onSelectTool('shovel')}
              className={`tool-btn p-3 rounded transition-all ${
                selectedTool === 'shovel'
                  ? 'bg-yellow-500 scale-110'
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
              title="Shovel - Dig dirt and grass"
            >
              🗻
            </button>
          )}
        </div>
      </div>

      {/* Bottom Left - Inventory */}
      <div className="absolute bottom-4 left-4 pointer-events-auto">
        <div className="bg-black bg-opacity-75 text-white p-4 rounded-lg max-w-xs">
          <div className="font-bold mb-2">🎒 Inventory</div>
          <div className="space-y-1 text-sm max-h-40 overflow-y-auto">
            {gameState.inventory
              .filter(item => item.quantity > 0)
              .map((item: InventoryItem) => (
                <div key={item.id} className="flex items-center justify-between">
                  <span>{getBlockIcon(item.type)}</span>
                  <span className="ml-2 flex-1 capitalize">{item.id}</span>
                  <span className="font-bold text-yellow-300">×{item.quantity}</span>
                </div>
              ))}
            {gameState.inventory.filter(item => item.quantity > 0).length === 0 && (
              <div className="text-gray-400 text-xs">Empty</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Right - Controls */}
      <div className="absolute bottom-4 right-4 pointer-events-auto">
        <div className="bg-black bg-opacity-75 text-white p-4 rounded-lg text-sm">
          <div className="font-bold mb-2">⌨️ Controls</div>
          <div className="space-y-1">
            <div>A/D - Move</div>
            <div>Space - Jump</div>
            <div>Click Block - Break</div>
            <div>R + Click - Place</div>
            <div className="text-xs text-gray-400 mt-2">
              ⛏️ Pickaxe breaks stone<br/>
              🪓 Axe chops wood<br/>
              ✋ Hand breaks leaves<br/>
              🗻 Shovel digs dirt
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HUD;
