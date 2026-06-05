import React from 'react';
import { 
  Home, Folder, Clock, Star, Download, Search, Wrench, Settings, X, Moon, Sun, File 
} from 'lucide-react';
import { NavPage } from '../core/NavigationManager';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentNav: NavPage;
  setCurrentNav: (nav: NavPage) => void;
  categoryFilter: string;
  setCategoryFilter: (filter: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentNav,
  setCurrentNav,
  categoryFilter,
  setCategoryFilter,
  isDark,
  onToggleTheme
}) => {
  // Map our Sidebar item selections to navigation state
  const menuItems = [
    { id: 'home', icon: Home, label: 'Home', targetNav: 'home' as NavPage, targetCat: 'all' },
    { id: 'files', icon: Folder, label: 'Files', targetNav: 'files' as NavPage, targetCat: 'all' },
    { id: 'recent', icon: Clock, label: 'Recent', targetNav: 'files' as NavPage, targetCat: 'recent' },
    { id: 'favorites', icon: Star, label: 'Favorites', targetNav: 'starred' as NavPage, targetCat: 'all' },
    { id: 'downloads', icon: Download, label: 'Downloads', targetNav: 'files' as NavPage, targetCat: 'downloads' },
    { id: 'search', icon: Search, label: 'Search', targetNav: 'search' as NavPage, targetCat: 'all' },
    { id: 'tools', icon: Wrench, label: 'Tools', targetNav: 'tools' as NavPage, targetCat: 'all' },
    { id: 'settings', icon: Settings, label: 'Settings', targetNav: 'settings' as NavPage, targetCat: 'all' }
  ];

  const handleItemClick = (item: typeof menuItems[0]) => {
    setCurrentNav(item.targetNav);
    setCategoryFilter(item.targetCat);
    onClose();
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className={`absolute inset-0 bg-black/40 backdrop-blur-[1px] z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar container */}
      <div 
        className={`absolute top-0 left-0 bottom-0 z-55 w-[280px] max-w-[85vw] flex flex-col transition-transform duration-300 ease-in-out shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          isDark ? 'bg-[#1F1F1F] text-[#E3E3E3]' : 'bg-[#FFFFFF] text-[#202124]'
        }`}
        style={{ fontFamily: "'Google Sans', 'Inter', sans-serif" }}
      >
        {/* Header section identical to the screenshot */}
        <div className="p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* Blue icon circle with white file icon */}
            <div className="w-11 h-11 rounded-full bg-[#1A73E8] flex items-center justify-center shadow-sm select-none">
              <File className="w-5.5 h-5.5 text-white fill-current opacity-95" />
            </div>
            <div className="flex flex-col">
              <span className={`text-[17px] font-bold tracking-tight leading-tight ${isDark ? 'text-white' : 'text-[#202124]'}`}>
                File Viewer
              </span>
              <span className={`text-[12px] opacity-75 mt-0.5 font-medium ${isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>
                Universal
              </span>
            </div>
          </div>

          <button 
            onClick={onClose}
            className={`p-2 rounded-full cursor-pointer transition-colors active:scale-95 ${
              isDark ? 'hover:bg-white/5 text-[#9AA0A6] hover:text-white' : 'hover:bg-black/5 text-[#5F6368] hover:text-[#202124]'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Custom styled light divider */}
        <div className={`h-px w-full shrink-0 ${isDark ? 'bg-[#303134]' : 'bg-[#E8EAED]'}`} />

        {/* Scrollable menu list with customized spacing and active items matching the screenshot */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 select-none">
          {menuItems.map(item => {
            // Determine active state
            const isNavActive = currentNav === item.targetNav;
            const isCatActive = item.targetNav === 'files' ? categoryFilter === item.targetCat : true;
            const isActive = isNavActive && isCatActive;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`w-full flex items-center gap-4 px-4 py-3 cursor-pointer rounded-full transition-all text-left font-semibold text-[14px] select-none ${
                  isActive
                    ? (isDark 
                        ? 'bg-[#8AB4F8]/10 text-[#8AB4F8] font-bold shadow-xs' 
                        : 'bg-[#E8F0FE] text-[#1A73E8] font-bold')
                    : (isDark 
                        ? 'text-[#9AA0A6] hover:bg-white/5 hover:text-[#E3E3E3]' 
                        : 'text-[#3C4043] hover:bg-[#F1F3F4] hover:text-[#202124]')
                }`}
              >
                <item.icon className={`w-5 h-5 ${
                  isActive 
                    ? (isDark ? 'text-[#8AB4F8]' : 'text-[#1A73E8]') 
                    : (isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]')
                }`} />
                <span className="flex-1">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Footer section with divider and light/dark mode lunar toggle */}
        <div className={`h-px w-full shrink-0 ${isDark ? 'bg-[#303134]' : 'bg-[#E8EAED]'}`} />

        <div className="p-4 flex items-center justify-end shrink-0 select-none">
          <button
            onClick={onToggleTheme}
            className={`p-2.5 rounded-full cursor-pointer transition-all active:scale-95 ${
              isDark 
                ? 'hover:bg-white/5 text-[#FBBC05]' 
                : 'hover:bg-black/5 text-[#5F6368]'
            }`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="w-5.5 h-5.5" /> : <Moon className="w-5.5 h-5.5" />}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
