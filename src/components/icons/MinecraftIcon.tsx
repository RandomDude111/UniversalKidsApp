import React from 'react';

export const MinecraftIcon: React.FC<{ size?: number }> = ({ size = 32 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Create a Minecraft-style blocky icon */}
      {/* Green grass block */}
      <rect x="0" y="0" width="16" height="16" fill="#5D9B35" />
      {/* Brown dirt block */}
      <rect x="16" y="0" width="16" height="16" fill="#8B6F47" />
      {/* Stone block */}
      <rect x="0" y="16" width="16" height="16" fill="#A0A0A0" />
      {/* Wood block */}
      <rect x="16" y="16" width="16" height="16" fill="#6B4423" />
      
      {/* Add some contrast with darker outlines */}
      <rect x="0" y="0" width="16" height="16" fill="none" stroke="#2D7A1F" strokeWidth="0.5" />
      <rect x="16" y="0" width="16" height="16" fill="none" stroke="#6B5637" strokeWidth="0.5" />
      <rect x="0" y="16" width="16" height="16" fill="none" stroke="#808080" strokeWidth="0.5" />
      <rect x="16" y="16" width="16" height="16" fill="none" stroke="#4A2F17" strokeWidth="0.5" />
    </svg>
  );
};
