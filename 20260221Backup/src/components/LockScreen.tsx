import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

interface LockScreenProps {
  onAuthenticated: (uid: string, email: string) => void;
  onFullscreenToggle: () => void;
}

export const LockScreen = ({ onAuthenticated, onFullscreenToggle }: LockScreenProps) => {
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(new Date());
  const [swipeDistance, setSwipeDistance] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY);
    setSwipeDistance(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.targetTouches[0].clientY;
    const distance = touchStart - currentY;
    setSwipeDistance(Math.max(0, distance));
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setTouchEnd(e.changedTouches[0].clientY);
    
    // Swipe up detected (move from bottom to top) - lowered threshold to 50px
    if (touchStart - touchEnd > 50) {
      setShowLogin(true);
    }
    setSwipeDistance(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setTouchStart(e.clientY);
    setSwipeDistance(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons === 1) {
      const distance = touchStart - e.clientY;
      setSwipeDistance(Math.max(0, distance));
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setTouchEnd(e.clientY);
    
    // Swipe up detected (move from bottom to top)
    if (touchStart - e.clientY > 50) {
      setShowLogin(true);
    }
    setSwipeDistance(0);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Trigger fullscreen on successful login
      onFullscreenToggle();
      onAuthenticated(userCredential.user.uid, userCredential.user.email || email);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const formattedTime = time.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
  const date = time.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div
      className="w-full h-screen bg-gradient-to-b from-black to-gray-900 flex flex-col items-center justify-center touch-none select-none overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {!showLogin ? (
        <>
          {/* Lock Screen Display */}
          <div className="text-center flex-1 flex flex-col items-center justify-center">
            <div className="text-6xl font-light text-white mb-4">
              {formattedTime}
            </div>
            <div className="text-2xl text-gray-300">
              {date}
            </div>
          </div>

          {/* Swipe Up Indicator */}
          <div className="mb-20 text-center">
            <div className="text-gray-400 text-lg mb-4">Swipe up to unlock</div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-1 h-8 bg-gradient-to-b from-gray-400 to-transparent rounded-full animate-pulse"></div>
              {swipeDistance > 0 && (
                <div className="text-gray-500 text-sm mt-2">
                  {Math.round(swipeDistance)}px ↑
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Login Form */}
          <div className="w-full max-w-md px-8 bg-black bg-opacity-50 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-gray-700">
            <h1 className="text-3xl font-bold text-white mb-8 text-center">Sign In</h1>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-600 focus:border-blue-500 focus:outline-none transition"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-600 focus:border-blue-500 focus:outline-none transition"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-900 bg-opacity-50 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <button
              onClick={() => setShowLogin(false)}
              className="w-full mt-4 text-gray-400 hover:text-gray-300 text-sm transition"
            >
              Back
            </button>
          </div>
        </>
      )}
    </div>
  );
};
