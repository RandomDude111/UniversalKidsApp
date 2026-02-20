import React, { useState, useRef, useEffect } from 'react';

interface Match {
  wordIndex: number;
  gridIndex: number;
  player: 'red' | 'blue';
}

interface DragState {
  isActive: boolean;
  startPos: { x: number; y: number };
  currentPos: { x: number; y: number };
  sourceType: 'word' | 'grid' | null;
  sourceIndex: number | null;
}

interface EnglishTicTacToeProps {
  onClose?: () => void;
}

const EnglishTicTacToe: React.FC<EnglishTicTacToeProps> = ({ onClose }) => {
  const [currentPlayer, setCurrentPlayer] = useState<'red' | 'blue'>('red');
  const [matches, setMatches] = useState<Match[]>([]);
  const [winner, setWinner] = useState<'red' | 'blue' | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    isActive: false,
    startPos: { x: 0, y: 0 },
    currentPos: { x: 0, y: 0 },
    sourceType: null,
    sourceIndex: null,
  });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);

  // Sample data - can be changed later
  const gridImages = [
    '🍎', '🍌', '🍊',
    '🐶', '🐱', '🦁',
    '🌳', '🌸', '⭐'
  ];

  const words = ['Apple', 'Banana', 'Orange', 'Dog', 'Cat', 'Lion', 'Tree', 'Flower', 'Star'];

  // Draw the connection line
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    // Always clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Only draw if actively dragging
    if (dragState.isActive && dragState.sourceType && dragState.startPos.x !== 0) {
      const lineColor = currentPlayer === 'red' ? '#ff0080' : '#00d4ff';
      
      // Draw glowing line with double stroke for better visibility
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = lineColor;
      ctx.shadowBlur = 20;

      ctx.beginPath();
      ctx.moveTo(dragState.startPos.x, dragState.startPos.y);
      ctx.lineTo(dragState.currentPos.x, dragState.currentPos.y);
      ctx.stroke();

      // Draw glowing circle at cursor
      ctx.fillStyle = lineColor;
      ctx.shadowColor = lineColor;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(dragState.currentPos.x, dragState.currentPos.y, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [dragState, currentPlayer]);

  const handleWordMouseDown = (wordIndex: number, e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Can't select already matched word
    if (matches.some(m => m.wordIndex === wordIndex)) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    
    if (containerRect) {
      setDragState({
        isActive: true,
        startPos: {
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top + rect.height / 2,
        },
        currentPos: {
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top + rect.height / 2,
        },
        sourceIndex: wordIndex,
        sourceType: 'word',
      });
    }
  };

  const handleWordTouchStart = (wordIndex: number, e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Can't select already matched word
    if (matches.some(m => m.wordIndex === wordIndex)) return;

    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    
    if (containerRect) {
      setDragState({
        isActive: true,
        startPos: {
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top + rect.height / 2,
        },
        currentPos: {
          x: touch.clientX - containerRect.left,
          y: touch.clientY - containerRect.top,
        },
        sourceIndex: wordIndex,
        sourceType: 'word',
      });
      lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleGridMouseDown = (gridIndex: number, e: React.MouseEvent<HTMLDivElement>) => {
    // Can't select already matched grid
    if (matches.some(m => m.gridIndex === gridIndex)) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    
    if (containerRect) {
      setDragState({
        isActive: true,
        startPos: {
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top + rect.height / 2,
        },
        currentPos: {
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top + rect.height / 2,
        },
        sourceType: 'grid',
        sourceIndex: gridIndex,
      });
    }
  };

  const handleGridTouchStart = (gridIndex: number, e: React.TouchEvent<HTMLDivElement>) => {
    // Can't select already matched grid
    if (matches.some(m => m.gridIndex === gridIndex)) return;

    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    
    if (containerRect) {
      setDragState({
        isActive: true,
        startPos: {
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top + rect.height / 2,
        },
        currentPos: {
          x: touch.clientX - containerRect.left,
          y: touch.clientY - containerRect.top,
        },
        sourceType: 'grid',
        sourceIndex: gridIndex,
      });
      lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragState.isActive || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    setDragState(prev => ({
      ...prev,
      currentPos: {
        x: e.clientX - containerRect.left,
        y: e.clientY - containerRect.top,
      },
    }));
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!dragState.isActive || !containerRef.current) return;

    const touch = e.touches[0];
    const containerRect = containerRef.current.getBoundingClientRect();
    setDragState(prev => ({
      ...prev,
      currentPos: {
        x: touch.clientX - containerRect.left,
        y: touch.clientY - containerRect.top,
      },
    }));
    lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleMouseUp = () => {
    setDragState({
      isActive: false,
      startPos: { x: 0, y: 0 },
      currentPos: { x: 0, y: 0 },
      sourceType: null,
      sourceIndex: null,
    });
  };

  const handleTouchEnd = () => {
    setDragState({
      isActive: false,
      startPos: { x: 0, y: 0 },
      currentPos: { x: 0, y: 0 },
      sourceType: null,
      sourceIndex: null,
    });
    lastTouchRef.current = null;
  };

  const handleGridMouseUp = (gridIndex: number) => {
    if (!dragState.isActive || dragState.sourceType !== 'word' || dragState.sourceIndex === null) return;

    const matchedWord = matches.find(m => m.gridIndex === gridIndex);
    if (matchedWord) {
      setDragState({
        isActive: false,
        startPos: { x: 0, y: 0 },
        currentPos: { x: 0, y: 0 },
        sourceType: null,
        sourceIndex: null,
      });
      return;
    }

    // Add match
    const newMatch: Match = {
      wordIndex: dragState.sourceIndex,
      gridIndex: gridIndex,
      player: currentPlayer,
    };

    setMatches([...matches, newMatch]);
    setCurrentPlayer(currentPlayer === 'red' ? 'blue' : 'red');
    setDragState({
      isActive: false,
      startPos: { x: 0, y: 0 },
      currentPos: { x: 0, y: 0 },
      sourceIndex: null,
      sourceType: null,
    });
  };

  const handleGridTouchEnd = (gridIndex: number) => {
    if (!dragState.isActive || dragState.sourceType !== 'word' || dragState.sourceIndex === null) return;

    const matchedWord = matches.find(m => m.gridIndex === gridIndex);
    if (matchedWord) {
      setDragState({
        isActive: false,
        startPos: { x: 0, y: 0 },
        currentPos: { x: 0, y: 0 },
        sourceType: null,
        sourceIndex: null,
      });
      return;
    }

    // Add match
    const newMatch: Match = {
      wordIndex: dragState.sourceIndex,
      gridIndex: gridIndex,
      player: currentPlayer,
    };

    setMatches([...matches, newMatch]);
    setCurrentPlayer(currentPlayer === 'red' ? 'blue' : 'red');
    setDragState({
      isActive: false,
      startPos: { x: 0, y: 0 },
      currentPos: { x: 0, y: 0 },
      sourceIndex: null,
      sourceType: null,
    });
  };

  // Detect touchend location across the container (useful because touchend doesn't
  // reliably fire on the element under the finger if the touch started elsewhere)
  const handleContainerTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.changedTouches && e.changedTouches[0];
    const clientX = touch ? touch.clientX : lastTouchRef.current?.x;
    const clientY = touch ? touch.clientY : lastTouchRef.current?.y;

    if (clientX == null || clientY == null) {
      handleTouchEnd();
      return;
    }

    const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    if (el) {
      const gridEl = el.closest('[data-grid-index]') as HTMLElement | null;
      if (gridEl) {
        const idx = Number(gridEl.getAttribute('data-grid-index'));
        if (!Number.isNaN(idx)) {
          handleGridTouchEnd(idx);
          return;
        }
      }
      const wordEl = el.closest('[data-word-index]') as HTMLElement | null;
      if (wordEl) {
        const widx = Number(wordEl.getAttribute('data-word-index'));
        if (!Number.isNaN(widx) && dragState.sourceType === 'grid' && dragState.sourceIndex !== null) {
          // if touch ended over a word while dragging from grid, treat as a reverse match
          // (mirror behavior to grid->word if desired)
          // For now just reset drag state and return
          handleTouchEnd();
          return;
        }
      }
    }

    handleTouchEnd();
  };


  const getGridMatch = (gridIndex: number) => {
    return matches.find(m => m.gridIndex === gridIndex);
  };

  const getWordMatch = (wordIndex: number) => {
    return matches.find(m => m.wordIndex === wordIndex);
  };

  const checkWinner = (currentMatches: Match[]) => {
    // Winning combinations (3 in a row)
    const winConditions = [
      // Rows
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      // Columns
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      // Diagonals
      [0, 4, 8], [2, 4, 6]
    ];

    for (const condition of winConditions) {
      const [a, b, c] = condition;
      const matchA = currentMatches.find(m => m.gridIndex === a);
      const matchB = currentMatches.find(m => m.gridIndex === b);
      const matchC = currentMatches.find(m => m.gridIndex === c);

      if (matchA && matchB && matchC) {
        // All three positions are filled
        if (matchA.player === matchB.player && matchB.player === matchC.player) {
          return matchA.player; // Return the winner
        }
      }
    }
    return null;
  };

  // Check for winner after each move
  useEffect(() => {
    const gameWinner = checkWinner(matches);
    if (gameWinner) {
      setWinner(gameWinner);
    }
  }, [matches]);

  const handlePlayAgain = () => {
    setMatches([]);
    setWinner(null);
    setCurrentPlayer('red');
  };

  const handleExit = () => {
    if (onClose) {
      onClose();
    }
  };

  const playerColor = currentPlayer === 'red' ? '#ff0080' : '#00d4ff';


  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white p-6 overflow-hidden"
      style={{ userSelect: 'none', touchAction: 'none' }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleContainerTouchEnd}
    >
      {/* Game Title */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold" style={{ color: playerColor, textShadow: `0 0 20px ${playerColor}` }}>
          English Match
        </h2>
        <p className="text-sm mt-2" style={{ color: playerColor }}>
          {currentPlayer.toUpperCase()} Player's Turn
        </p>
      </div>

      <div className="flex gap-8 h-[calc(100%-120px)]">
        {/* Left side - Words */}
        <div className="flex flex-col justify-center gap-3 min-w-[150px]" style={{ userSelect: 'none' }}>
          {words.map((word, index) => {
            const match = getWordMatch(index);
            const isMatched = !!match;
            const matchColor = match?.player === 'red' ? '#ff0080' : '#00d4ff';

            return (
              <div
                key={index}
                data-word-index={index}
                onMouseDown={(e) => {
                  e.preventDefault();
                  !isMatched && handleWordMouseDown(index, e);
                }}
                onTouchStart={(e) => {
                  !isMatched && handleWordTouchStart(index, e);
                }}
                className={`p-3 rounded-lg font-bold cursor-move transition-all ${
                  isMatched ? 'opacity-40 cursor-default' : 'hover:scale-105'
                }`}
                style={{
                  color: matchColor,
                  backgroundColor: isMatched ? 'transparent' : `${playerColor}20`,
                  textShadow: `0 0 10px ${matchColor}`,
                  borderLeft: `3px solid ${matchColor}`,
                  opacity: isMatched ? 0.4 : 1,
                  userSelect: 'none',
                }}
                draggable={false}
              >
                {word}
              </div>
            );
          })}
        </div>

        {/* Center - 3x3 Grid */}
        <div className="flex-1 flex items-center justify-center">
          <div className="grid grid-cols-3 gap-4 aspect-square max-h-full max-w-lg">
            {gridImages.map((emoji, index) => {
              const match = getGridMatch(index);
              const isMatched = !!match;
              const matchColor = match?.player === 'red' ? '#ff0080' : '#00d4ff';

              return (
                <div
                  key={index}
                  data-grid-index={index}
                    onMouseDown={(e) => !isMatched && handleGridMouseDown(index, e)}
                  onMouseUp={() => handleGridMouseUp(index)}
                  onTouchStart={(e) => !isMatched && handleGridTouchStart(index, e)}
                  onTouchEnd={() => handleGridTouchEnd(index)}
                  className={`flex items-center justify-center text-5xl rounded-lg backdrop-blur-sm transition-all cursor-move min-h-24 min-w-24`}
                  style={{
                    backgroundColor: isMatched ? matchColor : `${playerColor}20`,
                    border: `2px solid ${matchColor}`,
                    boxShadow: isMatched ? `inset 0 0 20px ${matchColor}70` : `0 0 20px ${matchColor}70`,
                    opacity: 1,
                    cursor: isMatched ? 'default' : 'move',
                  }}
                >
                  {!isMatched && emoji}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right side - Matched pairs */}
        <div className="flex flex-col justify-center gap-3 min-w-[180px]">
          <h3 className="text-sm font-bold opacity-70">Matched</h3>
          {matches.map((match, index) => {
            const color = match.player === 'red' ? '#ff0080' : '#00d4ff';
            return (
              <div
                key={index}
                className="p-3 rounded text-xs flex items-center gap-2"
                style={{
                  color,
                  backgroundColor: `${color}20`,
                  border: `1px solid ${color}`,
                }}
              >
                <div className="text-2xl">{gridImages[match.gridIndex]}</div>
                <div className="font-semibold">{words[match.wordIndex]}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Canvas for drawing lines */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 9999,
          backgroundColor: 'transparent',
        }}
      />

      {/* Win Popup */}
      {winner && (
        <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
          <div className="bg-slate-900 border-2 rounded-lg p-8 text-center" style={{ borderColor: winner === 'red' ? '#ff0080' : '#00d4ff' }}>
            <h1 className="text-4xl font-bold mb-4" style={{ color: winner === 'red' ? '#ff0080' : '#00d4ff', textShadow: `0 0 20px ${winner === 'red' ? '#ff0080' : '#00d4ff'}` }}>
              🎉 Congratulations!
            </h1>
            <p className="text-2xl font-bold mb-8" style={{ color: winner === 'red' ? '#ff0080' : '#00d4ff' }}>
              {winner.toUpperCase()} Player Wins!
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handlePlayAgain}
                className="px-8 py-3 rounded-lg font-bold text-lg transition-all hover:scale-105"
                style={{
                  backgroundColor: winner === 'red' ? '#ff0080' : '#00d4ff',
                  color: '#000',
                }}
              >
                Play Again
              </button>
              <button
                onClick={handleExit}
                className="px-8 py-3 rounded-lg font-bold text-lg border-2 transition-all hover:scale-105"
                style={{
                  borderColor: winner === 'red' ? '#ff0080' : '#00d4ff',
                  color: winner === 'red' ? '#ff0080' : '#00d4ff',
                }}
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnglishTicTacToe;
