// Helper to safely load environment variables regardless of compiling environment
const getEnvVar = (key: string, fallback: string): string => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key] !== undefined) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {}
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) {}
  return fallback;
};

const getEnvBool = (key: string, fallback: boolean): boolean => {
  const val = getEnvVar(key, '');
  if (val === '') return fallback;
  return val === 'true';
};

export interface AdMobConfig {
  testMode: boolean;
  android: {
    appId: string;
    bannerAdId: string;
    interstitialAdId: string;
    rewardedAdId: string;
    appOpenAdId: string;
  };
  ios: {
    appId: string;
    bannerAdId: string;
    interstitialAdId: string;
    rewardedAdId: string;
    appOpenAdId: string;
  };
  frequencyCapping: {
    interstitialIntervalMs: number; // minimum time between interstitial showings
    rewardedIntervalMs: number;
    appOpenIntervalMs: number;
  };
}

export const AdSettings: AdMobConfig = {
  testMode: getEnvBool('VITE_ADMOB_TEST_MODE', true),
  android: {
    appId: getEnvVar('VITE_ADMOB_ANDROID_APP_ID', 'ca-app-pub-3940256099942544~3347511713'),
    bannerAdId: getEnvVar('VITE_ADMOB_ANDROID_BANNER_ID', 'ca-app-pub-3940256099942544/6300978111'),
    interstitialAdId: getEnvVar('VITE_ADMOB_ANDROID_INTERSTITIAL_ID', 'ca-app-pub-3940256099942544/1033173712'),
    rewardedAdId: getEnvVar('VITE_ADMOB_ANDROID_REWARDED_ID', 'ca-app-pub-3940256099942544/5224354917'),
    appOpenAdId: getEnvVar('VITE_ADMOB_ANDROID_APPOPEN_ID', 'ca-app-pub-3940256099942544/3419835294'),
  },
  ios: {
    appId: getEnvVar('VITE_ADMOB_IOS_APP_ID', 'ca-app-pub-3940256099942544~1458002511'),
    bannerAdId: getEnvVar('VITE_ADMOB_IOS_BANNER_ID', 'ca-app-pub-3940256099942544/2934735716'),
    interstitialAdId: getEnvVar('VITE_ADMOB_IOS_INTERSTITIAL_ID', 'ca-app-pub-3940256099942544/4411468910'),
    rewardedAdId: getEnvVar('VITE_ADMOB_IOS_REWARDED_ID', 'ca-app-pub-3940256099942544/1712485313'),
    appOpenAdId: getEnvVar('VITE_ADMOB_IOS_APPOPEN_ID', 'ca-app-pub-3940256099942544/5662855259'),
  },
  frequencyCapping: {
    interstitialIntervalMs: Number(getEnvVar('VITE_ADMOB_INTERSTITIAL_COOLDOWN_MS', '180000')),
    rewardedIntervalMs: Number(getEnvVar('VITE_ADMOB_REWARDED_COOLDOWN_MS', '900000')),
    appOpenIntervalMs: Number(getEnvVar('VITE_ADMOB_APPOPEN_COOLDOWN_MS', '1800000')),
  }
};

export default AdSettings;
