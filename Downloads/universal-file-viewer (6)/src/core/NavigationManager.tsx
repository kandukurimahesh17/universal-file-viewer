import React, { createContext, useContext, useState } from 'react';

export type NavPage = 'home' | 'files' | 'starred' | 'tools' | 'settings' | 'search';
export type OverlayType = 'none' | 'viewer' | 'tool_format' | 'tool_compress' | 'tool_compile' | 'file_info' | 'tool_merge' | 'tool_split' | 'tool_watermark';

export type NavigationContextType = {
  currentNav: NavPage;
  setCurrentNav: (nav: NavPage) => void;
  activeOverlay: OverlayType;
  setActiveOverlay: (overlay: OverlayType) => void;
  isViewerImmersive: boolean;
  setIsViewerImmersive: React.Dispatch<React.SetStateAction<boolean>>;
  openOverlay: (overlay: OverlayType) => void;
  closeOverlay: () => void;
};

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentNav, setCurrentNav] = useState<NavPage>('home');
  const [activeOverlay, setActiveOverlay] = useState<OverlayType>('none');
  const [isViewerImmersive, setIsViewerImmersive] = useState(false);

  const closeOverlay = () => {
    setActiveOverlay('none');
    if (window.history.state && window.history.state.overlay) {
       window.history.back();
    }
  };

  const openOverlay = (overlayName: OverlayType) => {
    setActiveOverlay(overlayName);
    window.history.pushState({ overlay: overlayName }, '');
  };

  return (
    <NavigationContext.Provider value={{ 
      currentNav, 
      setCurrentNav, 
      activeOverlay, 
      setActiveOverlay,
      isViewerImmersive,
      setIsViewerImmersive,
      openOverlay,
      closeOverlay
    }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationManager');
  }
  return context;
};

export default NavigationManager;

