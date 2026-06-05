import React, { createContext, useContext, useState, useEffect } from 'react';
import { NotificationService } from '../notifications/NotificationService';

export type Notification = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
};

export type NotificationContextType = {
  notifications: Notification[];
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  useEffect(() => {
    const bridgeNotification = (msg: string, level: 'success' | 'error' | 'info') => {
      showNotification(msg, level);
    };
    NotificationService.addListener(bridgeNotification);
    return () => {
      NotificationService.removeListener(bridgeNotification);
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, showNotification }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className={`px-4 py-3 rounded-xl shadow-lg text-white pointer-events-auto text-sm font-medium transition-all ${n.type === 'error' ? 'bg-red-500' : n.type === 'success' ? 'bg-[#1E8E3E]' : 'bg-[#1A73E8]'}`}>
            {n.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationProvider;
