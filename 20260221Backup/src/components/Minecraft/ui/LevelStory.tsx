import React, { useState } from 'react';
import { LevelDefinition } from '../types/GameTypes';

interface LevelStoryProps {
  level: LevelDefinition;
  onStart: () => void;
  onBack: () => void;
}

const LevelStory: React.FC<LevelStoryProps> = ({ level, onStart, onBack }) => {
  const [showStory, setShowStory] = useState(true);

  if (showStory) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-2xl mx-4 shadow-2xl">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-blue-600 mb-2">{level.name}</h1>
            <p className="text-lg text-gray-600 mb-4">{level.description}</p>
          </div>

          {level.storyText && (
            <div className="bg-blue-50 p-6 rounded-lg mb-6 border-l-4 border-blue-500">
              <p className="text-lg text-gray-800 leading-relaxed italic">{level.storyText}</p>
            </div>
          )}

          <div className="bg-yellow-50 p-4 rounded-lg mb-6 border border-yellow-300">
            <h3 className="font-bold text-yellow-800 mb-2">📋 Your Objectives:</h3>
            <ul className="space-y-2">
              {level.objectives.map((obj, idx) => (
                <li key={idx} className="text-gray-700 flex items-start">
                  <span className="mr-3">•</span>
                  <span>{obj.description}</span>
                </li>
              ))}
            </ul>
          </div>

          {level.hints && (
            <div className="bg-green-50 p-4 rounded-lg mb-6 border border-green-300">
              <h3 className="font-bold text-green-800 mb-2">💡 Hints:</h3>
              <ul className="space-y-1">
                {level.hints.map((hint, idx) => (
                  <li key={idx} className="text-gray-700 text-sm">
                    • {hint}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => setShowStory(false)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Let's Play! 🎮
            </button>
            <button
              onClick={onBack}
              className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-xl">
        <h2 className="text-2xl font-bold mb-4">Ready to Start?</h2>
        <p className="text-gray-600 mb-6">Level: {level.name}</p>
        <div className="flex gap-4">
          <button
            onClick={onStart}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            Start Game
          </button>
          <button
            onClick={() => setShowStory(true)}
            className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            Read Story Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default LevelStory;
