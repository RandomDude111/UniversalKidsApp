import { useState } from 'react';
import { App, APPS } from '../data/apps';
import { X } from 'lucide-react';

interface AppDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLongPress: (app: App, x: number, y: number) => void;
  onOpenApp: (app: App) => void;
  homeScreenApps: string[];
}

export const AppDrawer = ({
  isOpen,
  onClose,
  onLongPress,
  onOpenApp,
  homeScreenApps
}: AppDrawerProps) => {
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [contextMenuShown, setContextMenuShown] = useState(false);

  const handleAppMouseDown = (app: App, e: React.MouseEvent) => {
    const timer = setTimeout(() => {
      onLongPress(app, e.clientX, e.clientY);
      setContextMenuShown(true);
    }, 500);
    setPressTimer(timer);
  };

  const handleAppMouseUp = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  const handleAppTouchStart = (app: App, e: React.TouchEvent) => {
    const timer = setTimeout(() => {
      const touch = e.touches[0];
      onLongPress(app, touch.clientX, touch.clientY);
      setContextMenuShown(true);
    }, 500);
    setPressTimer(timer);
  };

  const handleAppTouchEnd = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-30 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 p-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Apps</h2>
        <button
          onClick={() => {
            onClose();
            setContextMenuShown(false);
          }}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <X size={24} className="text-white" />
        </button>
      </div>

      {/* App Grid */}
      <div className="flex-1 overflow-y-auto bg-black p-6">
        <div className="grid grid-cols-4 gap-6">
          {APPS.map((app) => (
            <div
              key={app.id}
              onMouseDown={(e) => !app.comingSoon && handleAppMouseDown(app, e)}
              onMouseUp={handleAppMouseUp}
              onMouseLeave={handleAppMouseUp}
              onTouchStart={(e) => !app.comingSoon && handleAppTouchStart(app, e)}
              onTouchEnd={handleAppTouchEnd}
              onClick={() => !pressTimer && !contextMenuShown && !app.comingSoon && onOpenApp(app)}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl transition-transform duration-200 relative ${
                app.comingSoon 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'cursor-pointer active:scale-90 hover:scale-105'
              }`}
            >
              <div className={`${app.color} p-6 rounded-2xl text-white flex items-center justify-center`}>
                {app.icon}
              </div>
              <span className="text-gray-300 text-center text-sm font-medium break-words max-w-full">
                {app.name}
              </span>
              {app.comingSoon ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-xl">
                  <span className="text-white text-xs font-bold bg-gray-800 px-2 py-1 rounded">
                    Coming Soon
                  </span>
                </div>
              ) : (
                homeScreenApps.includes(app.id) && (
                  <div className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                    On Home
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Hint */}
      <div className="bg-gray-900 border-t border-gray-700 p-4 text-center text-gray-400 text-sm">
        Tap to open app • Long press to add/remove from home screen
      </div>
    </div>
  );
};
