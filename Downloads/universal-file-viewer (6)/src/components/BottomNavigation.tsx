import React from 'react';
import { Home, Folder, Star, Layers, Settings } from 'lucide-react';
import { NavPage } from '../core/NavigationManager';

interface BottomNavigationProps {
  currentNav: NavPage;
  setCurrentNav: (nav: NavPage) => void;
  isDark: boolean;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ currentNav, setCurrentNav, isDark }) => {
  return (
    <nav className={`absolute bottom-0 w-full flex items-center justify-around h-20 pb-safe z-30 shrink-0 ${isDark ? 'bg-[#1F1F1F]' : 'bg-[#F8F9FA]'}`}>
      {[
        { id: 'home', icon: Home, label: 'Home' },
        { id: 'files', icon: Folder, label: 'Files' },
        { id: 'starred', icon: Star, label: 'Favorite' },
        { id: 'tools', icon: Layers, label: 'Tools' },
        { id: 'settings', icon: Settings, label: 'Settings' }
      ].map(item => {
        const isActive = currentNav === item.id;
        return (
          <button key={item.id} onClick={() => setCurrentNav(item.id as NavPage)} className="flex flex-col items-center justify-center w-20 relative">
            <div className={`flex items-center justify-center w-16 h-8 rounded-full mb-1 transition-colors ${isActive ? (isDark ? 'bg-[#8AB4F8]/20' : 'bg-[#C2E7FF]') : 'bg-transparent'}`}>
              <item.icon className={`w-6 h-6 ${isActive ? (isDark ? 'text-[#8AB4F8]' : 'text-[#001D35] fill-current opacity-20') : (isDark ? 'text-[#9AA0A6]' : 'text-[#444746]')}`} style={isActive ? { fill: isDark ? 'auto' : '#001D35'} : {}} />
            </div>
            <span className={`text-[12px] font-medium ${isActive ? (isDark ? 'text-[#8AB4F8]' : 'text-[#001D35]') : (isDark ? 'text-[#9AA0A6]' : 'text-[#444746]')}`}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNavigation;
