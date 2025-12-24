import React from 'react';
import { Home, Compass, BookOpen, Layers, CreditCard, Gift, Settings, Sparkles } from 'lucide-react';
import type { PageType, User } from '../types';

interface SidebarProps {
  activePage: PageType;
  setActivePage: (page: PageType) => void;
  user: User;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, user }) => {
  const menuItems = [
    { id: 'home' as PageType, icon: Home, label: 'Home' },
    { id: 'discover' as PageType, icon: Compass, label: 'Discover' },
    { id: 'library' as PageType, icon: BookOpen, label: 'Library' },
    { id: 'tech-stack' as PageType, icon: Layers, label: 'Tech Stack' },
    { id: 'subscriptions' as PageType, icon: CreditCard, label: 'Subscriptions' },
    { id: 'rewards' as PageType, icon: Gift, label: 'Rewards Hub' },
    { id: 'settings' as PageType, icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 pl-25 flex-shrink-0 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
            Flowva
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-1 transition-all ${
              activePage === item.id
                ? item.id === 'rewards'
                  ? 'bg-violet-50 text-violet-600'
                  : 'bg-gray-100 text-gray-900'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* User profile */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-fuchsia-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {user.email.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user.email.split('@')[0]}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
};