import React, { createContext, useContext, useState } from 'react';

export type AdContextType = {
  isPremium: boolean;
  showRewardedAd: () => Promise<boolean>;
  showInterstitialAd: () => Promise<void>;
};

const AdContext = createContext<AdContextType | undefined>(undefined);

export const AdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPremium] = useState(false);

  const showRewardedAd = async () => {
    if (isPremium) return true;
    console.log('Showing rewarded ad...');
    return new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(true), 1500); // Simulate ad view
    });
  };
  
  const showInterstitialAd = async () => {
    if (isPremium) return;
    console.log('Showing interstitial ad...');
    return new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 1000);
    });
  };

  return (
    <AdContext.Provider value={{ isPremium, showRewardedAd, showInterstitialAd }}>
      {children}
    </AdContext.Provider>
  );
};

export const useAds = () => {
  const context = useContext(AdContext);
  if (!context) {
    throw new Error('useAds must be used within an AdProvider');
  }
  return context;
};

export default AdProvider;
