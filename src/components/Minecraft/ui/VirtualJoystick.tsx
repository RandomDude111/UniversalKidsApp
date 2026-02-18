import React, { useRef, useState } from 'react';

interface VirtualJoystickProps {
  onMove: (x: number) => void; // -1 (left) to 1 (right)
  size?: number;
}

const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove, size = 120 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stick, setStick] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const touchIdRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    touchIdRef.current = touch.identifier;
    setIsActive(true);
    updateStick(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchIdRef.current === null) return;

    let targetTouch: React.Touch | null = null;
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === touchIdRef.current) {
        targetTouch = e.touches[i];
        break;
      }
    }

    if (targetTouch) {
      updateStick(targetTouch.clientX, targetTouch.clientY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    let found = false;
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === touchIdRef.current) {
        found = true;
        break;
      }
    }

    if (!found) {
      touchIdRef.current = null;
      setIsActive(false);
      setStick({ x: 0, y: 0 });
      onMove(0);
    }
  };

  const updateStick = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;

    const maxDistance = size / 2 - 15; // Radius minus thumb size
    const distance = Math.sqrt(dx * dx + dy * dy);

    let newX = dx;
    let newY = dy;

    if (distance > maxDistance) {
      const angle = Math.atan2(dy, dx);
      newX = Math.cos(angle) * maxDistance;
      newY = Math.sin(angle) * maxDistance;
    }

    setStick({ x: newX, y: newY });

    // Send normalized x value (-1 to 1)
    const normalizedX = newX / maxDistance;
    onMove(normalizedX);
  };

  return (
    <div
      ref={containerRef}
      className="fixed bottom-20 left-4 touch-none select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        width: size,
        height: size,
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Outer circle background */}
      <div
        className={`absolute rounded-full transition-all ${
          isActive ? 'bg-blue-500' : 'bg-blue-400'
        }`}
        style={{
          width: size,
          height: size,
          opacity: 0.3,
        }}
      />

      {/* Inner stick/thumb */}
      <div
        className={`absolute rounded-full transition-all ${
          isActive ? 'bg-blue-600' : 'bg-blue-500'
        }`}
        style={{
          width: 30,
          height: 30,
          left: `calc(50% - 15px + ${stick.x}px)`,
          top: `calc(50% - 15px + ${stick.y}px)`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      />

      {/* Left indicator */}
      <div className="absolute left-1 top-1/2 transform -translate-y-1/2 text-white text-xs font-bold">
        ◄
      </div>

      {/* Right indicator */}
      <div className="absolute right-1 top-1/2 transform -translate-y-1/2 text-white text-xs font-bold">
        ►
      </div>
    </div>
  );
};

export default VirtualJoystick;
