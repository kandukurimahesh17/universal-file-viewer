import React, { createContext, useContext, useState } from 'react';

export type AppPermissions = {
  camera: boolean;
  mic: boolean;
  location: boolean;
  storage: boolean;
  internet: boolean;
};

export type PermissionContextType = {
  perms: AppPermissions;
  setPerms: React.Dispatch<React.SetStateAction<AppPermissions>>;
  requestPermission: (type: keyof AppPermissions) => Promise<void>;
};

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [perms, setPerms] = useState<AppPermissions>({
    camera: false,
    mic: false,
    location: false,
    storage: true, 
    internet: true
  });

  const requestPermission = async (type: keyof AppPermissions) => {
    // In a real implementation this would trigger native/browser permission dialogs
    console.log(`Requesting permission: ${type}`);
    setPerms(p => ({ ...p, [type]: true }));
  };

  return (
    <PermissionContext.Provider value={{ perms, setPerms, requestPermission }}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

export default PermissionProvider;
