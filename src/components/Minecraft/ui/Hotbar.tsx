import React from 'react';
import { GameState } from '../types/GameTypes';

interface HotbarProps {
  gameState: GameState;
  onSelectTool: (tool: 'hand' | 'pickaxe' | 'axe' | 'shovel') => void;
}

const Hotbar: React.FC<HotbarProps> = ({ gameState, onSelectTool }) => {
  const toolIcons: Record<string, string> = {
    hand: '✋',
    pickaxe: '⛏️',
    axe: '🪓',
    shovel: '🗻',
  };

  const toolLabels: Record<string, string> = {
    hand: 'Hand',
    pickaxe: 'Pickaxe',
    axe: 'Axe',
    shovel: 'Shovel',
  };

  const tools = ['hand', 'pickaxe', 'axe', 'shovel'] as const;

  return (
    <div className="bg-black bg-opacity-80 text-white p-3 flex items-center justify-between">
      {/* Left side - Tools */}
      <div className="flex gap-2">
        {tools.map(tool => (
          <button
            key={tool}
            onClick={() => onSelectTool(tool)}
            className={`w-12 h-12 rounded text-lg flex items-center justify-center transition-all border-2 ${
              gameState.selectedTool === tool
                ? 'bg-yellow-500 border-yellow-700 scale-110'
                : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
            }`}
            title={toolLabels[tool]}
          >
            {toolIcons[tool]}
          </button>
        ))}
      </div>

      {/* Center - Inventory Items */}
      <div className="flex gap-1 flex-1 mx-4 justify-center">
        {gameState.inventory.slice(0, 5).map((item) => (
          <div
            key={item.id}
            className="w-12 h-12 bg-gray-700 border-2 border-gray-600 rounded flex flex-col items-center justify-center text-xs"
          >
            <div className="text-lg">{item.type === 'dirt' ? '🟫' : item.type === 'wood' ? '🟪' : '⬜'}</div>
            {item.quantity > 0 && <div className="text-yellow-300 font-bold text-xs">{item.quantity}</div>}
          </div>
        ))}
        {/* Empty slots */}
        {[...Array(Math.max(0, 5 - gameState.inventory.length))].map((_, idx) => (
          <div
            key={`empty-${idx}`}
            className="w-12 h-12 bg-gray-800 border-2 border-gray-600 rounded"
          />
        ))}
      </div>

      {/* Right side - Score */}
      <div className="text-right">
        <div className="text-xl font-bold text-yellow-300">Score: {gameState.score}</div>
        <div className="text-sm text-gray-400">Time: {Math.floor(gameState.timeElapsed)}s</div>
      </div>
    </div>
  );
};

export default Hotbar;
