import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import LiveView from './components/LiveView';
import MediaView from './components/MediaView';
import { View } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.CHAT);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Render the active view
  const renderView = () => {
    switch (currentView) {
      case View.CHAT:
        return <ChatView />;
      case View.LIVE:
        return <LiveView />;
      case View.MEDIA:
        return <MediaView />;
      default:
        return <ChatView />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* Mobile Sidebar Toggle */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 bg-slate-800 p-2 rounded-lg text-white border border-slate-700 shadow-lg"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <i className={`fa-solid ${isSidebarOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
      </button>

      {/* Sidebar (Desktop + Mobile Overlay) */}
      <div className={`
        fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 md:relative md:transform-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar currentView={currentView} onViewChange={(view) => {
          setCurrentView(view);
          setIsSidebarOpen(false);
        }} />
      </div>

      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <main className="flex-1 h-full relative w-full">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
