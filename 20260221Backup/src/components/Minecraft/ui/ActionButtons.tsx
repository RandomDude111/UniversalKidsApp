import React, { useState } from 'react';

interface ActionButtonsProps {
  onJump: () => void;
  onBreak: () => void;
  onPlace: () => void;
  onSelectTool: (tool: 'hand' | 'pickaxe' | 'axe' | 'shovel') => void;
  selectedTool: string;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onJump,
  onBreak,
  onPlace,
  onSelectTool,
  selectedTool,
}) => {
  const [showToolMenu, setShowToolMenu] = useState(false);

  const tools: Array<'hand' | 'pickaxe' | 'axe' | 'shovel'> = ['hand', 'pickaxe', 'axe', 'shovel'];

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

  return (
    <div className="fixed bottom-20 right-4 flex flex-col gap-3 touch-none select-none">
      {/* Tool Selection Button */}
      <button
        className={`w-16 h-16 rounded-full font-bold text-2xl flex items-center justify-center transition-all active:scale-95 border-2 ${
          showToolMenu ? 'bg-yellow-400 border-yellow-600 text-yellow-900' : 'bg-yellow-500 border-yellow-700 text-yellow-900'
        }`}
        onTouchStart={() => setShowToolMenu(!showToolMenu)}
        title="Select Tool"
      >
        {toolIcons[selectedTool]}
      </button>

      {/* Tool Menu - appears above when active */}
      {showToolMenu && (
        <div className="flex flex-col gap-2 mb-2">
          {tools.map(tool => (
            <button
              key={tool}
              className={`w-14 h-14 rounded-full text-xl flex items-center justify-center transition-all active:scale-90 border-2 ${
                selectedTool === tool
                  ? 'bg-purple-600 border-purple-800 scale-110'
                  : 'bg-purple-500 border-purple-700 hover:bg-purple-600'
              }`}
              onTouchStart={() => {
                onSelectTool(tool);
                setShowToolMenu(false);
              }}
              title={toolLabels[tool]}
            >
              {toolIcons[tool]}
            </button>
          ))}
        </div>
      )}

      {/* Jump Button */}
      <button
        className="w-16 h-16 bg-green-500 hover:bg-green-600 border-2 border-green-700 text-2xl rounded-full font-bold active:scale-95 transition-all"
        onTouchStart={onJump}
        title="Jump"
      >
        ⬆️
      </button>

      {/* Break Block Button */}
      <button
        className="w-16 h-16 bg-red-500 hover:bg-red-600 border-2 border-red-700 text-2xl rounded-full font-bold active:scale-95 transition-all"
        onTouchStart={onBreak}
        title="Break Block"
      >
        💥
      </button>

      {/* Place Block Button */}
      <button
        className="w-16 h-16 bg-blue-500 hover:bg-blue-600 border-2 border-blue-700 text-2xl rounded-full font-bold active:scale-95 transition-all"
        onTouchStart={onPlace}
        title="Place Block"
      >
        🧱
      </button>

      {/* Info text */}
      <div className="text-white text-xs mt-2 text-center font-semibold">
        <div>Tool:</div>
        <div>{toolLabels[selectedTool]}</div>
      </div>
    </div>
  );
};

export default ActionButtons;
