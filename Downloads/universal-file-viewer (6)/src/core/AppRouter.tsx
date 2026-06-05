import React from 'react';
import { useNavigation } from './NavigationManager';

export const AppRouter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Here we would conditionally render based on currentNav once refactored.
  // For now, we will just render children to keep it compatible with existing App.tsx logic.
  return <>{children}</>;
};

export default AppRouter;
