import { Plus, Minus } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface AppContextMenuProps {
  position: { x: number; y: number };
  onAddToHome: () => void;
  onRemoveFromHome: () => void;
  onClose: () => void;
  isOnHome: boolean;
}

export const AppContextMenu = ({
  position,
  onAddToHome,
  onRemoveFromHome,
  onClose,
  isOnHome
}: AppContextMenuProps) => {
  const handlerRef = useRef<((e: MouseEvent) => void) | null>(null);

  useEffect(() => {
    console.log('🔴 AppContextMenu mounted at position:', position);
    
    // Delay the outside click handler so it doesn't immediately close
    const timer = setTimeout(() => {
      console.log('🟡 Outside click handler registering after 100ms delay');
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        
        // Use closest() to check if the click is on the menu or any child
        const isInside = target.closest('[data-context-menu]') !== null;
        
        console.log('🔵 Click detected - target:', target?.tagName, target?.className, 'isInside:', isInside);
        
        if (!isInside) {
          console.log('🟢 Closing menu - click was outside');
          onClose();
        } else {
          console.log('🟢✅ Click was inside menu - staying open');
        }
      };
      handlerRef.current = handleClickOutside;
      document.addEventListener('click', handleClickOutside);
    }, 100);
    
    return () => {
      console.log('🔴 AppContextMenu unmounting');
      clearTimeout(timer);
      if (handlerRef.current) {
        document.removeEventListener('click', handlerRef.current);
      }
    };
  }, [onClose]);

  return (
    <div
      data-context-menu
      className="fixed bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
      onClick={(e) => {
        console.log('🟠 Menu button clicked');
        e.stopPropagation();
      }}
    >
      <div className="min-w-max">
        {!isOnHome ? (
          <button
            onClick={() => {
              console.log('✅ Add to Home clicked');
              onAddToHome();
            }}
            className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-2 border-b border-gray-700 last:border-0"
          >
            <Plus size={18} />
            Add to Home Screen
          </button>
        ) : (
          <button
            onClick={() => {
              console.log('✅ Remove from Home clicked');
              onRemoveFromHome();
            }}
            className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-2 border-b border-gray-700 last:border-0"
          >
            <Minus size={18} />
            Remove from Home Screen
          </button>
        )}
      </div>
    </div>
  );};