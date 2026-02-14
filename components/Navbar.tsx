
import React from 'react';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <div>
            <span className="text-2xl font-black tracking-tighter text-white block leading-none">GEAR VAULT</span>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Pro Audio Catalog</span>
          </div>
        </div>
        
        <div className="hidden md:flex items-center space-x-6">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Digital Archive v1.0</span>
          <div className="h-4 w-[1px] bg-slate-800"></div>
          <a href="https://www.soundhouse.co.jp/" target="_blank" className="text-xs font-bold text-slate-400 hover:text-white transition-colors">Sound House</a>
          <a href="https://www.sweetwater.com/" target="_blank" className="text-xs font-bold text-slate-400 hover:text-white transition-colors">Sweetwater</a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
