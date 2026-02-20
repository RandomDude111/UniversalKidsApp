import React from 'react';
import { Mail, RotateCw, Inbox, Calendar, DollarSign, Library, User, Radio, Gamepad2, Users, Book, Zap, Hand, BookOpen } from 'lucide-react';
import { MinecraftIcon } from '../components/icons/MinecraftIcon';

export interface App {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  comingSoon?: boolean;
  role?: 'student' | 'teacher';
}

export const APPS: App[] = [
  {
    id: 'tictactoe',
    name: 'Tic-Tac-Toe',
    icon: <RotateCw size={32} />,
    color: 'bg-blue-500'
  },
  {
    id: 'inbox',
    name: 'Inbox',
    icon: <Inbox size={32} />,
    color: 'bg-yellow-500'
  },
  {
    id: 'calendar',
    name: 'Calendar',
    icon: <Calendar size={32} />,
    color: 'bg-green-500'
  },
  {
    id: 'bank',
    name: 'Bank',
    icon: <DollarSign size={32} />,
    color: 'bg-purple-500'
  },
  {
    id: 'users',
    name: 'Users',
    icon: <Users size={32} />,
    color: 'bg-teal-500'
  },
  {
    id: 'profile',
    name: 'Profile',
    icon: <User size={32} />,
    color: 'bg-pink-500'
  },
  {
    id: 'live',
    name: 'Live',
    icon: <Radio size={32} />,
    color: 'bg-orange-500'
  },
  {
    id: 'game3',
    name: 'Game 3',
    icon: <Gamepad2 size={32} />,
    color: 'bg-lime-500'
  },
  {
    id: 'englishlanguage',
    name: 'English Game',
    icon: <Book size={32} />,
    color: 'bg-violet-500'
  },
  {
    id: 'wordrunner',
    name: 'Word Runner',
    icon: <Zap size={32} />,
    color: 'bg-amber-500'
  },
  {
    id: 'hangman',
    name: 'Hangman',
    icon: <Gamepad2 size={32} />, 
    color: 'bg-rose-500'
  },
  {
    id: 'teacher',
    name: 'Teacher',
    icon: <User size={32} />,
    color: 'bg-gray-700',
    role: 'teacher'
  },
  {
    id: 'handgrabber',
    name: 'Hand Grabber',
    icon: <Hand size={32} />,
    color: 'bg-yellow-600'
  },
  {
    id: 'voting',
    name: 'Voting',
    icon: <Radio size={32} />,
    color: 'bg-cyan-500'
  },
  {
    id: 'minecraft',
    name: 'Minecraft 2D',
    icon: <MinecraftIcon size={32} />,
    color: 'bg-emerald-600'
  },
  {
    id: 'homework',
    name: 'Homework',
    icon: <BookOpen size={32} />,
    color: 'bg-indigo-600'
  },
  // Teacher-only apps
  {
    id: 'teacher-live',
    name: 'Teacher Live',
    icon: <Radio size={32} />,
    color: 'bg-orange-500',
    role: 'teacher'
  },
  {
    id: 'teacher-students',
    name: 'Manage Students',
    icon: <Users size={32} />,
    color: 'bg-teal-500',
    role: 'teacher'
  },
  {
    id: 'teacher-funds',
    name: 'Teacher Funds',
    icon: <DollarSign size={32} />,
    color: 'bg-purple-500',
    role: 'teacher'
  },
  {
    id: 'teacher-classes',
    name: 'Manage Classes',
    icon: <BookOpen size={32} />,
    color: 'bg-green-500',
    role: 'teacher'
  },
  {
    id: 'teacher-scheduling',
    name: 'Scheduling',
    icon: <Calendar size={32} />,
    color: 'bg-yellow-500',
    role: 'teacher'
  },
  {
    id: 'teacher-games',
    name: 'Joint Games',
    icon: <Gamepad2 size={32} />,
    color: 'bg-pink-500',
    role: 'teacher'
  },
  {
    id: 'teacher-homework',
    name: 'Teacher Homework',
    icon: <BookOpen size={32} />,
    color: 'bg-indigo-700',
    role: 'teacher'
  },
  {
    id: 'teacher-forceapp',
    name: 'Force App',
    icon: <Radio size={32} />,
    color: 'bg-cyan-500',
    role: 'teacher'
  },
  {
    id: 'teacher-voting',
    name: 'Teacher Voting',
    icon: <Radio size={32} />,
    color: 'bg-cyan-700',
    role: 'teacher'
  },
  // Coming Soon
  {
    id: 'mail',
    name: 'Send Mail',
    icon: <Mail size={32} />,
    color: 'bg-red-500',
    comingSoon: true
  },
  {
    id: 'library',
    name: 'Library',
    icon: <Library size={32} />,
    color: 'bg-indigo-500',
    comingSoon: true
  },
  {
    id: 'game2',
    name: 'Game 2',
    icon: <Gamepad2 size={32} />,
    color: 'bg-cyan-500',
    comingSoon: true
  }
];

