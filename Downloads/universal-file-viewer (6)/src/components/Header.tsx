import React from 'react';
import { Search } from 'lucide-react';
import { NavPage } from '../core/NavigationManager';

interface HeaderProps {
  currentNav: NavPage;
  setCurrentNav: (nav: NavPage) => void;
  isDark: boolean;
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentNav, setCurrentNav, isDark, onMenuClick }) => {
  return (
    <header className={`${isDark ? 'bg-[#1F1F1F]' : 'bg-[#F8F9FA]'} px-5 py-4 flex items-center justify-between shrink-0 transition-colors z-20`}>
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className={`w-10 h-10 -ml-1 rounded-full flex gap-1 items-center justify-center cursor-pointer transition-all active:scale-95 outline-none ${
            isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
          }`}
          title="Open menu"
        >
          <div className={`w-8 h-8 rounded-full flex gap-1 items-center justify-center font-black ${isDark ? 'bg-gray-800' : 'bg-white shadow-xs border border-black/5'}`}>
             <div className="w-1.5 h-1.5 rounded-full bg-[#4285F4]" />
             <div className="w-1.5 h-1.5 rounded-full bg-[#EA4335]" />
             <div className="w-1.5 h-1.5 rounded-full bg-[#FBBC05]" />
             <div className="w-1.5 h-1.5 rounded-full bg-[#34A853]" />
          </div>
        </button>
        <h1 className="text-[20px] font-medium tracking-tight" style={{fontFamily: "'Google Sans', 'Inter', sans-serif"}}>
          {currentNav === 'home' && 'Workspace'}
          {currentNav === 'files' && 'My Files'}
          {currentNav === 'starred' && 'Favorites'}
          {currentNav === 'tools' && 'Utilities'}
          {currentNav === 'settings' && 'Settings'}
          {currentNav === 'search' && 'Search'}
        </h1>
      </div>
      <div className="flex items-center gap-1.5">
        {currentNav !== 'search' && (
          <button 
            onClick={() => setCurrentNav('search')}
            className={`p-2 rounded-full cursor-pointer hover:bg-black/5 active:scale-95 transition-all ${
              isDark ? 'text-[#9AA0A6] hover:bg-white/10 hover:text-white' : 'text-[#5F6368] hover:text-[#202124]'
            }`}
            title="Search documents and content"
          >
            <Search className="w-5.5 h-5.5" />
          </button>
        )}
        <div 
          onClick={() => setCurrentNav('settings')} 
          className="w-9 h-9 rounded-full bg-[#4285F4] text-white flex items-center justify-center font-bold text-sm shadow-md cursor-pointer active:scale-95 transition-transform"
        >
          M
        </div>
      </div>
    </header>
  );
};

export default Header;
