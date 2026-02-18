
import { ArrowLeft, MessageCircle } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  class?: string;
  role?: string;
  status?: string;
}

interface UserProfileProps {
  user: User;
  onBack: () => void;
  onMessage: (user: User) => void;
}

export const UserProfile = ({ user, onBack, onMessage }: UserProfileProps) => {
  return (
    <div className="w-full h-full flex flex-col bg-black">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 px-4 py-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          title="Go back"
        >
          <ArrowLeft size={24} className="text-white" />
        </button>
        <h1 className="text-lg font-semibold text-white flex-1 text-center">User Profile</h1>
        <div className="w-10" />
      </div>

      {/* Profile Content */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-8">
        {/* Large Avatar */}
        <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-5xl mb-8">
          {user.name.charAt(0).toUpperCase()}
        </div>

        {/* User Info */}
        <div className="w-full max-w-md space-y-6">
          {/* Name */}
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <p className="text-gray-400 text-sm mb-1">Name</p>
            <p className="text-white text-lg font-semibold">{user.name}</p>
          </div>

          {/* Email */}
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <p className="text-gray-400 text-sm mb-1">Email</p>
            <p className="text-white text-sm break-all">{user.email}</p>
          </div>

          {/* Class */}
          {user.class && (
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <p className="text-gray-400 text-sm mb-1">Class</p>
              <p className="text-white">{user.class}</p>
            </div>
          )}

          {/* Role */}
          {user.role && (
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <p className="text-gray-400 text-sm mb-1">Role</p>
              <p className="text-white">{user.role}</p>
            </div>
          )}

          {/* Status */}
          {user.status && (
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <p className="text-gray-400 text-sm mb-1">Status</p>
              <p className="text-white">{user.status}</p>
            </div>
          )}

          {/* Message Button */}
          <button
            onClick={() => onMessage(user)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-lg transition-colors flex items-center justify-center gap-2 mt-8"
          >
            <MessageCircle size={20} />
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
};
