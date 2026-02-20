import { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { Mail, ChevronDown, Maximize2 } from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  text: string;
  read: boolean;
  timestamp: any;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  messages: Message[];
  bankBalance: number;
  studentName?: string;
  onMessageClick?: (senderId: string, senderName: string) => void;
  onFullscreenToggle?: () => void;
}

export const NotificationPanel = ({
  isOpen,
  onClose,
  onLogout,
  messages,
  bankBalance,
  studentName,
  onMessageClick,
  onFullscreenToggle
}: NotificationPanelProps) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const unreadMessages = messages.length;

  const formattedTime = time.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
  const date = time.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric'
  });

  return (
    <>
      {/* Collapsed Header */}
      {!isOpen && (
        <div className="h-12 bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-between px-6 border-b border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors" onClick={onClose}>
          <div className="flex items-center gap-4 flex-1">
            {unreadMessages > 0 && (
              <div className="flex items-center gap-2 bg-red-600 rounded-full px-3 py-1">
                <Mail size={16} className="text-white" />
                <span className="text-white text-sm font-semibold">{unreadMessages}</span>
              </div>
            )}
            <span className="text-gray-300 text-sm">{formattedTime}</span>
            <span className="text-gray-400 text-sm">{date}</span>
            <div className="ml-auto text-green-500 text-sm font-semibold">
              ${bankBalance.toFixed(2)}
            </div>
          </div>
          <ChevronDown size={20} className="text-gray-400" />
        </div>
      )}

      {/* Expanded Panel with Backdrop */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-30"
            onClick={onClose}
          />
          
          {/* Panel */}
          <div className="absolute top-0 left-0 right-0 bg-gray-900 border-b border-gray-700 shadow-lg z-40 animate-in slide-in-from-top">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Notifications</h2>
                  {studentName && <p className="text-sm text-gray-400 mt-1">Welcome, <span className="text-blue-400 font-semibold">{studentName}</span></p>}
                </div>
                <ChevronDown size={24} className="text-gray-400 cursor-pointer hover:text-gray-300" onClick={onClose} />
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-800 rounded-lg p-4 text-center">
                  <div className="text-gray-400 text-sm mb-1">Time</div>
                  <div className="text-white text-lg font-semibold">{formattedTime}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 text-center">
                  <div className="text-gray-400 text-sm mb-1">Date</div>
                  <div className="text-white text-lg font-semibold">{date}</div>
                </div>
                <div className="bg-green-900 bg-opacity-50 rounded-lg p-4 text-center">
                  <div className="text-gray-400 text-sm mb-1">Balance</div>
                  <div className="text-green-400 text-lg font-semibold">${bankBalance.toFixed(2)}</div>
                </div>
              </div>

              {/* New Mail Notifications */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Mail size={20} />
                  Messages ({unreadMessages})
                </h3>
                {unreadMessages > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {messages.map((msg) => (
                      <button
                        key={msg.senderId}
                        onClick={() => onMessageClick?.(msg.senderId, msg.senderName)}
                        className="w-full bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-3 hover:bg-opacity-50 transition-colors text-left"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-blue-200">{msg.senderName}</span>
                          <span className="text-xs text-gray-400">
                            {msg.timestamp?.toDate?.().toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit',
                              hour12: true 
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-blue-100 break-words">{msg.text}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">No new messages</div>
                )}
              </div>

              {/* Logout Button */}
              <div className="flex gap-3">
                <button
                  onClick={handleLogout}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
                >
                  Sign Out
                </button>
                {onFullscreenToggle && (
                  <button
                    onClick={onFullscreenToggle}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
                    title="Toggle Fullscreen"
                  >
                    <Maximize2 size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
