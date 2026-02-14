
import React, { useState } from 'react';
import Navbar from './components/Navbar';
import EquipmentView from './components/EquipmentView';
import ManageView from './components/ManageView';
import ChatView from './components/ChatView';
import ImageView from './components/ImageView';
import VoiceView from './components/VoiceView';

type ViewType = 'all' | 'Microphone' | 'Preamp/Interface/Amp' | 'Speaker' | 'Headphone' | 'Earphone' | 'manage' | 'chat' | 'image' | 'voice';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeView) {
      case 'manage': return <ManageView />;
      case 'chat': return <ChatView />;
      case 'image': return <ImageView />;
      case 'voice': return <VoiceView />;
      default: return <EquipmentView filterCategory={activeView === 'all' ? undefined : activeView} />;
    }
  };

  const handleMenuClick = (id: ViewType) => {
    setActiveView(id);
    setIsSidebarOpen(false); // モバイルでクリックしたら閉じる
  };

  const menuItems = [
    { id: 'all', label: 'All Archive', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { id: 'Microphone', label: 'Microphones', icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z' },
    { id: 'Preamp/Interface/Amp', label: 'Preamps / AIF', icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z' },
    { id: 'Speaker', label: 'Speakers', icon: 'M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z' },
    { id: 'Headphone', label: 'Headphones', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'Earphone', label: 'Earphones', icon: 'M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 11zm12 0c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 11z' },
  ];

  const adminItems = [
    { id: 'manage', label: 'Archive Manager', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  ];

  const labItems = [
    { id: 'chat', label: 'AI Assistant', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
    { id: 'image', label: 'Visual Lab', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'voice', label: 'Voice Lab', icon: 'M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z' },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-slate-900 border-r border-slate-800 flex flex-col z-[70] transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 h-full overflow-y-auto no-scrollbar">
          <div className="flex items-center space-x-3 mb-10">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <span className="text-xl font-black tracking-tighter text-white">GEAR VAULT</span>
          </div>

          <div className="space-y-1">
            <p className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">Inventory</p>
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id as any)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  activeView === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                <span className="text-sm font-bold">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-8 space-y-1">
            <p className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">Management</p>
            {adminItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id as any)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  activeView === item.id ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                <span className="text-sm font-bold">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-8 space-y-1">
            <p className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">AI Labs</p>
            {labItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id as any)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  activeView === item.id ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                <span className="text-sm font-bold">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="mt-auto p-8 border-t border-slate-800">
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Version 2.5.1 Build</p>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 text-slate-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="lg:hidden flex items-center space-x-2">
                <span className="text-lg font-black tracking-tighter text-white">GEAR VAULT</span>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Digital Archive</span>
              <div className="h-4 w-[1px] bg-slate-800"></div>
              <a href="https://www.soundhouse.co.jp/" target="_blank" className="text-xs font-bold text-slate-400 hover:text-white transition-colors">Sound House</a>
              <a href="https://www.sweetwater.com/" target="_blank" className="text-xs font-bold text-slate-400 hover:text-white transition-colors">Sweetwater</a>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/5 rounded-full blur-[120px]"></div>
          </div>
          <div className="h-full relative z-10">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
