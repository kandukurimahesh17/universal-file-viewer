import React from 'react';

interface LoadingScreenProps {
  isDark: boolean;
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ isDark, message = "Please wait..." }) => {
  return (
    <div className={`absolute inset-0 z-[100] flex flex-col items-center justify-center p-5 backdrop-blur-sm ${isDark ? 'bg-black/50 text-[#E3E3E3]' : 'bg-white/50 text-[#202124]'}`}>
      <div className={`p-6 rounded-3xl flex flex-col items-center justify-center shadow-xl border ${isDark ? 'bg-[#303134] border-[#3C4043]' : 'bg-white border-[#E8EAED]'}`}>
        <div className="w-8 h-8 border-4 border-[#1A73E8] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-medium text-[14px]">{message}</p>
      </div>
    </div>
  );
};

export default LoadingScreen;