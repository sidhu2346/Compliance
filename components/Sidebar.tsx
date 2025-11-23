import React from 'react';
import { View } from '../types';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const navItems = [
    { id: View.CHAT, label: 'Chat Assistant', icon: 'fa-message' },
    { id: View.LIVE, label: 'Live Voice', icon: 'fa-microphone-lines' },
    { id: View.MEDIA, label: 'Media Studio', icon: 'fa-image' },
  ];

  return (
    <div className="w-20 md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0 transition-all duration-300">
      <div className="p-6 flex items-center justify-center md:justify-start gap-3 border-b border-slate-800">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-red-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
          G
        </div>
        <span className="hidden md:block font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-red-400">
          Nexus
        </span>
      </div>

      <nav className="flex-1 py-6 flex flex-col gap-2 px-3">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group
              ${currentView === item.id 
                ? 'bg-gradient-to-r from-blue-600/20 to-blue-400/10 text-blue-400 border border-blue-500/30' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
          >
            <i className={`fa-solid ${item.icon} text-xl w-6 text-center ${currentView === item.id ? 'text-blue-400' : 'group-hover:text-white'}`}></i>
            <span className="hidden md:block font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-lg p-3 text-xs text-slate-500 text-center">
          <span className="hidden md:inline">Powered by Gemini 2.5</span>
          <span className="md:hidden">2.5</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
