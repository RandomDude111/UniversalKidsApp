import { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { Search, Filter } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  class?: string;
  role?: string;
  status?: string;
}

interface UsersListProps {
  onSelectUser: (user: User) => void;
}

export const UsersList = ({ onSelectUser }: UsersListProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const q = query(usersCollection);
        const snapshot = await getDocs(q);
        
        const usersList: User[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as Omit<User, 'id'>
        }));
        
        setUsers(usersList);
        setFilteredUsers(usersList);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Apply filters whenever search or filter criteria change
  useEffect(() => {
    let results = users;

    if (searchTerm) {
      results = results.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (classFilter) {
      results = results.filter(user => user.class === classFilter);
    }

    if (roleFilter) {
      results = results.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(results);
  }, [searchTerm, classFilter, roleFilter, users]);

  const uniqueClasses = Array.from(new Set(users.map(u => u.class).filter(Boolean)));
  const uniqueRoles = Array.from(new Set(users.map(u => u.role).filter(Boolean)));

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-white">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-black">
      {/* Search Bar */}
      <div className="bg-gray-900 p-4 border-b border-gray-700">
        <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
          <Search size={20} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 p-4 border-b border-gray-700 space-y-3">
        <div className="flex gap-2">
          <Filter size={18} className="text-gray-400 mt-2" />
          <span className="text-gray-300 text-sm font-medium mt-2">Filters:</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Class Filter */}
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-gray-700 text-white text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Classes</option>
            {uniqueClasses.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-gray-700 text-white text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Roles</option>
            {uniqueRoles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredUsers.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">No users found</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-6">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => onSelectUser(user)}
                className="flex flex-col items-center gap-3 p-4 rounded-xl cursor-pointer transition-transform duration-200 active:scale-90 hover:scale-105"
              >
                {/* User Avatar */}
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-center">
                  <p className="text-gray-300 text-sm font-medium truncate max-w-full">
                    {user.name}
                  </p>
                  {user.class && (
                    <p className="text-gray-500 text-xs">{user.class}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
