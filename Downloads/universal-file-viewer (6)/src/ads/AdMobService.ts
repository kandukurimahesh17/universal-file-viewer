import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  BannerAdPosition,
  BannerAdSize,
  BannerAdPluginEvents,
  InterstitialAdPluginEvents,
  RewardAdPluginEvents,
  AdMobRewardItem
} from '@capacitor-community/admob';
import { AdSettings } from './AdSettings';

// Safe environmental helper to avoid TS or execution crashes in mixed Vite/Node environments
const getEnvVar = (key: string, fallback: string): string => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {}
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) {}
  return fallback;
};

type AdMobEvent = 'bannerLoaded' | 'bannerFailedToLoad' | 'interstitialLoaded' | 'interstitialDismissed' | 'rewardEarned' | 'rewardDismissed' | 'appOpenLoaded' | 'appOpenDismissed';
type AdMobListener = (data?: any) => void;

export class AdMobService {
  private static isInitialized = false;
  private static initializedPromise: Promise<void> | null = null;
  
  // Ready states for each ad format
  private static isBannerReady = false;
  private static isInterstitialReady = false;
  private static isRewardedReady = false;
  private static isAppOpenReady = false;

  // Active capping trackers (timestamps in ms)
  private static lastInterstitialTime = 0;
  private static lastRewardedTime = 0;
  private static lastAppOpenTime = 0;

  // Web fallback elements
  private static activeMockBanner: HTMLElement | null = null;
  private static activeMockOverlay: HTMLElement | null = null;

  // Event listeners registry
  private static listeners: Record<AdMobEvent, AdMobListener[]> = {
    bannerLoaded: [],
    bannerFailedToLoad: [],
    interstitialLoaded: [],
    interstitialDismissed: [],
    rewardEarned: [],
    rewardDismissed: [],
    appOpenLoaded: [],
    appOpenDismissed: []
  };

  /**
   * Subscribe to AdMob service lifetime events
   */
  public static addListener(event: AdMobEvent, callback: AdMobListener) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  /**
   * Remove ad listeners
   */
  public static removeListener(event: AdMobEvent, callback: AdMobListener) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  private static triggerEvent(event: AdMobEvent, data?: any) {
    console.log(`[AdMobService Event] ${event}`, data || '');
    const list = this.listeners[event];
    if (list) {
      list.forEach(cb => {
        try {
          cb(data);
        } catch (e) {
          console.error(`Error in AdMobListener callback for ${event}:`, e);
        }
      });
    }
  }

  /**
   * Initialize AdMob for both Android/iOS Native platforms and Web platforms
   */
  public static async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    if (this.initializedPromise) {
      return this.initializedPromise;
    }

    this.initializedPromise = (async () => {
      const isNative = Capacitor.isNativePlatform();
      console.log(`[AdMobService] Initializing. Platform: ${Capacitor.getPlatform()}, IsNative: ${isNative}, TestMode: ${AdSettings.testMode}`);

      if (isNative) {
        try {
          await AdMob.initialize({
            initializeForTesting: AdSettings.testMode,
            testingDevices: []
          });

          // Setup native listeners for background events
          AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
            this.isBannerReady = true;
            this.triggerEvent('bannerLoaded');
          });

          AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (err) => {
            this.isBannerReady = false;
            this.triggerEvent('bannerFailedToLoad', err);
          });

          AdMob.addListener(InterstitialAdPluginEvents.Loaded, () => {
            this.isInterstitialReady = true;
            this.triggerEvent('interstitialLoaded');
          });

          AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
            this.isInterstitialReady = false;
            this.triggerEvent('interstitialDismissed');
          });

          AdMob.addListener(RewardAdPluginEvents.Loaded, () => {
            this.isRewardedReady = true;
            this.triggerEvent('rewardEarned');
          });

          AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: AdMobRewardItem) => {
            this.triggerEvent('rewardEarned', reward);
          });

          AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
            this.isRewardedReady = false;
            this.triggerEvent('rewardDismissed');
          });

          console.log('[AdMobService] Native AdMob SDK Initialized successfully');
        } catch (error) {
          console.error('[AdMobService] Failed to initialize native AdMob SDK. Falling back to Mock.', error);
        }
      } else {
        console.log('[AdMobService] Running in Web environment. Using visual ad emulators.');
      }

      this.isInitialized = true;
    })();

    return this.initializedPromise;
  }

  /**
   * Request user consent information and display GDPR consent flow forms
   */
  public static async requestConsentFlow(): Promise<{ status: string; canShowAds: boolean }> {
    await this.initialize();
    const isNative = Capacitor.isNativePlatform();
    console.log(`[AdMobService] requestConsentFlow() started. IsNative: ${isNative}`);

    if (isNative) {
      try {
        // Request existing consent status info
        const info = await AdMob.requestConsentInfo();
        console.log('[AdMobService] Consent info received:', info);

        // If a consent form is available and status is required or not determined, show the form
        if (info.isConsentFormAvailable && info.status === 'REQUIRED') {
          console.log('[AdMobService] Consent form is available and required. Presenting form.');
          const result = await AdMob.showConsentForm();
          console.log('[AdMobService] Consent form finished with result:', result);
          return {
            status: result.status,
            canShowAds: result.canRequestAds
          };
        }

        return {
          status: info.status,
          canShowAds: info.canRequestAds
        };
      } catch (err) {
        console.error('[AdMobService] Consent flow failed or interrupted:', err);
        return { status: 'UNKNOWN', canShowAds: true }; // Fallback to displaying ads
      }
    } else {
      // High-fidelity web/browser mock consent simulation
      return this.showMockConsentOverlay();
    }
  }

  /**
   * Checks if an ad format can be loaded based on frequency capping limit rules
   */
  private static checkFrequencyCap(type: 'interstitial' | 'rewarded' | 'appOpen'): boolean {
    const now = Date.now();
    let interval = 0;
    let lastTime = 0;

    if (type === 'interstitial') {
      interval = AdSettings.frequencyCapping.interstitialIntervalMs;
      lastTime = this.lastInterstitialTime;
    } else if (type === 'rewarded') {
      interval = AdSettings.frequencyCapping.rewardedIntervalMs;
      lastTime = this.lastRewardedTime;
    } else {
      interval = AdSettings.frequencyCapping.appOpenIntervalMs;
      lastTime = this.lastAppOpenTime;
    }

    const elapsed = now - lastTime;
    if (elapsed < interval) {
      const remainingSec = Math.ceil((interval - elapsed) / 1000);
      console.warn(`[AdMobService] Frequency cap active for ${type}. Cooldown is active. Wait ${remainingSec}s before another trigger.`);
      return false;
    }

    return true;
  }

  /**
   * Load Banner Ad
   */
  public static async loadBanner(): Promise<boolean> {
    await this.initialize();
    console.log('[AdMobService] loadBanner() called');
    this.isBannerReady = true;
    this.triggerEvent('bannerLoaded');
    return true;
  }

  /**
   * Show Banner Ad at designated position
   */
  public static async showBanner(options?: {
    position?: 'TOP_CENTER' | 'CENTER' | 'BOTTOM_CENTER';
    size?: 'BANNER' | 'LARGE_BANNER' | 'ADAPTIVE_BANNER';
  }): Promise<void> {
    await this.initialize();
    const position = options?.position || 'BOTTOM_CENTER';
    const size = options?.size || 'BANNER';

    console.log(`[AdMobService] showBanner(position: ${position}, size: ${size})`);

    const isNative = Capacitor.isNativePlatform();
    if (isNative) {
      let adId = AdSettings.android.bannerAdId;
      if (Capacitor.getPlatform() === 'ios') {
        adId = AdSettings.ios.bannerAdId;
      }

      // Read from production overrides if testMode is false
      if (!AdSettings.testMode) {
        adId = getEnvVar('VITE_ADMOB_BANNER_ID', adId);
      }

      try {
        await AdMob.showBanner({
          adId: adId,
          adSize: BannerAdSize[size as keyof typeof BannerAdSize] || BannerAdSize.BANNER,
          position: BannerAdPosition[position as keyof typeof BannerAdPosition] || BannerAdPosition.BOTTOM_CENTER,
          margin: 0,
          isTesting: AdSettings.testMode
        });
        this.isBannerReady = true;
      } catch (err) {
        console.error('[AdMobService] Error showing native banner ad:', err);
        this.triggerEvent('bannerFailedToLoad', err);
        this.showMockBanner(position, size);
      }
    } else {
      this.showMockBanner(position, size);
    }
  }

  /**
   * Hide and collapse currently visible Banner Ads
   */
  public static async hideBanner(): Promise<void> {
    await this.initialize();
    console.log('[AdMobService] hideBanner()');
    
    if (Capacitor.isNativePlatform()) {
      try {
        await AdMob.hideBanner();
      } catch (err) {
        console.error('[AdMobService] Error hiding native banner:', err);
      }
    }
    
    this.removeMockBanner();
  }

  /**
   * Load Interstitial Ad
   */
  public static async loadInterstitial(): Promise<boolean> {
    await this.initialize();
    console.log('[AdMobService] loadInterstitial() called');

    if (!this.checkFrequencyCap('interstitial')) {
      return false;
    }

    const isNative = Capacitor.isNativePlatform();
    if (isNative) {
      let adId = AdSettings.android.interstitialAdId;
      if (Capacitor.getPlatform() === 'ios') {
        adId = AdSettings.ios.interstitialAdId;
      }

      if (!AdSettings.testMode) {
        adId = getEnvVar('VITE_ADMOB_INTERSTITIAL_ID', adId);
      }

      try {
        await AdMob.prepareInterstitial({
          adId: adId,
          isTesting: AdSettings.testMode
        });
        this.isInterstitialReady = true;
        this.triggerEvent('interstitialLoaded');
        return true;
      } catch (err) {
        console.error('[AdMobService] Error preparing native interstitial:', err);
        this.isInterstitialReady = false;
        return false;
      }
    } else {
      this.isInterstitialReady = true;
      this.triggerEvent('interstitialLoaded');
      return true;
    }
  }

  /**
   * Show Interstitial Ad to player/user
   */
  public static async showInterstitial(): Promise<void> {
    await this.initialize();
    console.log('[AdMobService] showInterstitial()');

    if (!this.isInterstitialReady) {
      console.warn('[AdMobService] Interstitial Ad was not prepared or loaded. Attempting to load one now.');
      const success = await this.loadInterstitial();
      if (!success) return;
    }

    if (!this.checkFrequencyCap('interstitial')) {
      return;
    }

    this.lastInterstitialTime = Date.now();
    this.isInterstitialReady = false;

    if (Capacitor.isNativePlatform()) {
      try {
        await AdMob.showInterstitial();
      } catch (err) {
        console.error('[AdMobService] Error displaying native interstitial, showing mock fallback:', err);
        this.showMockInterstitial();
      }
    } else {
      this.showMockInterstitial();
    }
  }

  /**
   * Load Rewarded Video Ad
   */
  public static async loadRewarded(): Promise<boolean> {
    await this.initialize();
    console.log('[AdMobService] loadRewarded() called');

    if (!this.checkFrequencyCap('rewarded')) {
      return false;
    }

    const isNative = Capacitor.isNativePlatform();
    if (isNative) {
      let adId = AdSettings.android.rewardedAdId;
      if (Capacitor.getPlatform() === 'ios') {
        adId = AdSettings.ios.rewardedAdId;
      }

      if (!AdSettings.testMode) {
        adId = getEnvVar('VITE_ADMOB_REWARDED_ID', adId);
      }

      try {
        await AdMob.prepareRewardVideoAd({
          adId: adId,
          isTesting: AdSettings.testMode
        });
        this.isRewardedReady = true;
        return true;
      } catch (err) {
        console.error('[AdMobService] Error preparing native rewarded video ad:', err);
        this.isRewardedReady = false;
        return false;
      }
    } else {
      this.isRewardedReady = true;
      return true;
    }
  }

  /**
   * Show Rewarded Video Ad and return earned reward state
   */
  public static async showRewarded(): Promise<AdMobRewardItem | null> {
    await this.initialize();
    console.log('[AdMobService] showRewarded()');

    if (!this.isRewardedReady) {
      console.warn('[AdMobService] Rewarded Ad was not loaded. Attempting auto-load.');
      const success = await this.loadRewarded();
      if (!success) return null;
    }

    if (!this.checkFrequencyCap('rewarded')) {
      return null;
    }

    this.lastRewardedTime = Date.now();
    this.isRewardedReady = false;

    if (Capacitor.isNativePlatform()) {
      try {
        const reward = await AdMob.showRewardVideoAd();
        this.triggerEvent('rewardEarned', reward);
        return reward;
      } catch (err) {
        console.error('[AdMobService] Exception playing native rewarded reward video. Launching fallback mock video.', err);
        return this.showMockRewardedModal();
      }
    } else {
      return this.showMockRewardedModal();
    }
  }

  /**
   * Load App Open Ad
   */
  public static async loadAppOpen(): Promise<boolean> {
    await this.initialize();
    console.log('[AdMobService] loadAppOpen() called');

    if (!this.checkFrequencyCap('appOpen')) {
      return false;
    }

    const isNative = Capacitor.isNativePlatform();
    if (isNative) {
      let adId = AdSettings.android.appOpenAdId;
      if (Capacitor.getPlatform() === 'ios') {
        adId = AdSettings.ios.appOpenAdId;
      }

      if (!AdSettings.testMode) {
        adId = getEnvVar('VITE_ADMOB_APP_OPEN_ID', adId);
      }

      // App Open Ads are full-screen overlays presented on app startup or foreground trigger.
      // In @capacitor-community/admob, App Open is loaded similarly to robust Full-screen Interstitials.
      try {
        await AdMob.prepareInterstitial({
          adId: adId,
          isTesting: AdSettings.testMode
        });
        this.isAppOpenReady = true;
        this.triggerEvent('appOpenLoaded');
        return true;
      } catch (err) {
        console.error('[AdMobService] Error pre-loading native App Open Ad:', err);
        this.isAppOpenReady = false;
        return false;
      }
    } else {
      this.isAppOpenReady = true;
      this.triggerEvent('appOpenLoaded');
      return true;
    }
  }

  /**
   * Show startup App Open Ad overlay
   */
  public static async showAppOpen(): Promise<void> {
    await this.initialize();
    console.log('[AdMobService] showAppOpen() called');

    if (!this.isAppOpenReady) {
      console.warn('[AdMobService] App Open Ad not loaded. Loading now.');
      const success = await this.loadAppOpen();
      if (!success) return;
    }

    if (!this.checkFrequencyCap('appOpen')) {
      return;
    }

    this.lastAppOpenTime = Date.now();
    this.isAppOpenReady = false;

    if (Capacitor.isNativePlatform()) {
      try {
        await AdMob.showInterstitial();
        this.triggerEvent('appOpenDismissed');
      } catch (e) {
        console.error('[AdMobService] Error rendering App Open native interstitial. Launching backup mock open.', e);
        this.showMockAppOpenOverlay();
      }
    } else {
      this.showMockAppOpenOverlay();
    }
  }

  // ==========================================
  // HIGH-FIDELITY INTERACTIVE WEB EMULATION
  // ==========================================

  private static showMockBanner(position: string, size: string) {
    this.removeMockBanner();

    const bannerContainer = document.createElement('div');
    this.activeMockBanner = bannerContainer;
    bannerContainer.id = 'admob-mock-banner';
    
    // Position classes
    let positionClasses = 'bottom-0 left-0 right-0 border-t';
    if (position === 'TOP_CENTER') {
      positionClasses = 'top-0 left-1/2 -translate-x-1/2 rounded-b-xl border';
    } else if (position === 'CENTER') {
      positionClasses = 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl border';
    } else { // BOTTOM_CENTER
      positionClasses = 'bottom-0 left-1/2 -translate-x-1/2 rounded-t-xl border-t border-x';
    }

    // Size calculation
    let sizeStyle = 'width: 320px; height: 50px;';
    if (size === 'LARGE_BANNER') {
      sizeStyle = 'width: 320px; height: 100px;';
    } else if (size === 'MEDIUM_RECTANGLE') {
      sizeStyle = 'width: 300px; height: 250px;';
    } else if (size === 'LEADERBOARD') {
      sizeStyle = 'width: 728px; height: 90px; max-width: 95vw;';
    } else if (size === 'ADAPTIVE_BANNER') {
      sizeStyle = 'width: 100%; max-width: 468px; height: 60px;';
    }

    bannerContainer.className = `fixed z-[9999] bg-slate-900 border-slate-700 shadow-2xl flex flex-col justify-between overflow-hidden transition-all duration-300 font-sans p-1 text-white select-none ${positionClasses}`;
    bannerContainer.style.cssText += sizeStyle;

    bannerContainer.innerHTML = `
      <div class="flex items-center justify-between px-2 py-0.5 text-[8px] bg-slate-950/60 font-mono tracking-wider uppercase text-gray-400">
        <span class="flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          AdMob Mock Banner
        </span>
        <button id="admob-mock-banner-close" class="cursor-pointer hover:text-white transition p-0.5" title="Dismiss Banner">
          ✕
        </button>
      </div>
      <div class="flex-1 flex items-center justify-center gap-3 px-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900">
        <div class="flex flex-col text-left">
          <span class="text-xs font-semibold text-indigo-200">AdMob Premium Dev Partner</span>
          <span class="text-[9px] text-gray-300 line-clamp-1">Implement seamless test networks instantly inside your apps!</span>
        </div>
        <button id="admob-mock-banner-click" class="ml-auto bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-bold px-2 py-1 rounded shadow cursor-pointer whitespace-nowrap">
          Learn More
        </button>
      </div>
    `;

    document.body.appendChild(bannerContainer);

    // Bind mock operations
    const closeBtn = document.getElementById('admob-mock-banner-close');
    if (closeBtn) {
      closeBtn.onclick = (e) => {
        e.stopPropagation();
        this.hideBanner();
      };
    }

    const clickBtn = document.getElementById('admob-mock-banner-click');
    if (clickBtn) {
      clickBtn.onclick = () => {
        alert('Mock Banner Action Clicked! Simulated outbound advertiser visit triggered.');
      };
    }
  }

  private static removeMockBanner() {
    if (this.activeMockBanner) {
      try {
        if (this.activeMockBanner.parentNode) {
          this.activeMockBanner.parentNode.removeChild(this.activeMockBanner);
        }
      } catch (e) {}
      this.activeMockBanner = null;
    }
  }

  private static showMockInterstitial() {
    this.removeMockOverlay();

    const overlay = document.createElement('div');
    this.activeMockOverlay = overlay;
    overlay.id = 'admob-mock-overlay';
    overlay.className = 'fixed inset-0 z-[10000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 font-sans text-white select-none';

    overlay.innerHTML = `
      <div class="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
        
        <!-- Header status -->
        <div class="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-950 font-mono text-[10px] tracking-wide text-gray-400">
          <span class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
            AdMob Interstitial Simulation
          </span>
          <button id="admob-mock-interstitial-close" class="text-xs hover:text-white transition cursor-pointer p-1">
            ✕ Close
          </button>
        </div>

        <!-- Promo Banner -->
        <div class="h-36 bg-[linear-gradient(135deg,rgba(99,102,241,0.2)_0%,rgba(168,85,247,0.2)_100%)] flex items-center justify-center p-4 border-b border-slate-800/50">
          <svg class="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>

        <!-- Content details -->
        <div class="p-6 flex flex-col items-center text-center">
          <h2 class="text-lg font-bold text-slate-100 tracking-tight">Vibrant Game World Inc</h2>
          <p class="text-xs text-slate-400 mt-2 mb-6">Experience cutting-edge 3D physics inside your browser with stunning multiplayer support. Download the app today on Play Store!</p>
          
          <button id="admob-mock-interstitial-cta" class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition cursor-pointer">
            Play Now
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Listeners
    const closeBtn = document.getElementById('admob-mock-interstitial-close');
    if (closeBtn) {
      closeBtn.onclick = () => {
        this.removeMockOverlay();
        this.triggerEvent('interstitialDismissed');
      };
    }

    const ctaBtn = document.getElementById('admob-mock-interstitial-cta');
    if (ctaBtn) {
      ctaBtn.onclick = () => {
        alert('Navigating to sponsored advertiser download link!');
      };
    }
  }

  private static showMockRewardedModal(): Promise<AdMobRewardItem> {
    this.removeMockOverlay();

    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      this.activeMockOverlay = overlay;
      overlay.id = 'admob-mock-overlay';
      overlay.className = 'fixed inset-0 z-[10000] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 font-sans text-white select-none';

      let count = 5;

      overlay.innerHTML = `
        <div class="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
          
          <!-- Header status -->
          <div class="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-950 font-mono text-[10px] tracking-wide text-gray-400">
            <span class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              Rewarded Video Simulation
            </span>
            <span id="admob-mock-rewarded-timer" class="font-bold text-amber-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
              Reward in ${count}s
            </span>
          </div>

          <!-- Promo Video Canvas Area -->
          <div class="h-44 bg-slate-950 flex flex-col items-center justify-center p-4 border-b border-slate-800 relative">
            <div id="admob-mock-rewarded-progress" class="absolute bottom-0 left-0 h-1 bg-rose-500 transition-all duration-1000" style="width: 0%"></div>
            
            <span class="text-xs text-rose-400 font-semibold tracking-wider uppercase mb-1">Simulated Sponsor Video</span>
            <span class="text-[10px] text-gray-400 mb-4 font-mono tracking-tighter">ca-app-pub-3940256099942544/5224354917</span>
            
            <div class="w-12 h-12 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin flex items-center justify-center">
              <span id="admob-mock-video-clock" class="text-xs font-bold text-rose-400 font-mono">${count}</span>
            </div>
          </div>

          <!-- Content details -->
          <div class="p-5 flex flex-col items-center text-center">
            <h2 class="text-sm font-semibold text-slate-100">Unlock Premium Tools Pack</h2>
            <p class="text-xs text-slate-400 mt-1 mb-5">By looking at this 5 second ad showcase, you will instantly earn a complimentary +10 Bonus Credits booster.</p>
            
            <div class="flex gap-3 w-full">
              <button id="admob-mock-rewarded-skip" class="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-2.5 px-3 rounded-lg border border-slate-700 transition cursor-pointer">
                Skip Ad
              </button>
              <button id="admob-mock-rewarded-claim" class="flex-1 bg-neutral-700 text-neutral-400 text-xs font-bold py-2.5 px-3 rounded-lg shadow cursor-not-allowed whitespace-nowrap" disabled>
                Claim (Waiting...)
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      const updateProgress = () => {
        const progressPct = ((5 - count) / 5) * 100;
        const bar = document.getElementById('admob-mock-rewarded-progress');
        if (bar) bar.style.width = `${progressPct}%`;
        const clock = document.getElementById('admob-mock-video-clock');
        if (clock) clock.innerText = `${count}`;
      };

      const intervalId = setInterval(() => {
        count--;
        const timerLabel = document.getElementById('admob-mock-rewarded-timer');
        if (timerLabel) {
          timerLabel.innerText = count > 0 ? `Reward in ${count}s` : 'Reward Ready! ✓';
        }
        
        updateProgress();

        if (count <= 0) {
          clearInterval(intervalId);
          // Unlock buttons
          const skipBtn = document.getElementById('admob-mock-rewarded-skip');
          if (skipBtn) {
            skipBtn.innerText = 'Close';
          }
          const claimBtn = document.getElementById('admob-mock-rewarded-claim') as HTMLButtonElement | null;
          if (claimBtn) {
            claimBtn.disabled = false;
            claimBtn.className = 'flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold py-2.5 px-3 rounded-lg shadow-lg shadow-emerald-500/20 active:scale-95 transition cursor-pointer';
            claimBtn.innerText = 'Claim Premium Pack';
          }
        }
      }, 1000);

      // Listeners
      const skipBtn = document.getElementById('admob-mock-rewarded-skip');
      if (skipBtn) {
        skipBtn.onclick = () => {
          clearInterval(intervalId);
          this.removeMockOverlay();
          this.triggerEvent('rewardDismissed');
          // @ts-ignore
          resolve({ type: 'coins', amount: 0 }); // Skip yields 0 reward
        };
      }

      const claimBtn = document.getElementById('admob-mock-rewarded-claim');
      if (claimBtn) {
        claimBtn.onclick = () => {
          clearInterval(intervalId);
          this.removeMockOverlay();
          const earned = { type: 'PremiumCredits', amount: 10 };
          this.triggerEvent('rewardEarned', earned);
          resolve(earned);
        };
      }
    });
  }

  private static showMockAppOpenOverlay() {
    this.removeMockOverlay();

    const overlay = document.createElement('div');
    this.activeMockOverlay = overlay;
    overlay.id = 'admob-mock-overlay';
    overlay.className = 'fixed inset-0 z-[10000] bg-slate-950 flex items-center justify-center p-6 font-sans text-white select-none';

    overlay.innerHTML = `
      <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col relative animate-in fade-in-50 duration-300">
        
        <!-- TOP AD LABEL -->
        <div class="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-950 font-mono text-[9px] tracking-widest text-emerald-400 font-bold uppercase">
          <span>● ADMOB APP OPEN AD TEST SIMULATION</span>
          <span>ca-app-pub-3940256099942544/3419835294</span>
        </div>

        <div class="p-8 flex flex-col items-center">
          <!-- Logo frame -->
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-rose-500 flex items-center justify-center shadow-xl shadow-indigo-500/10 mb-6">
            <span class="text-2xl font-black italic">DF</span>
          </div>

          <h1 class="text-xl font-bold tracking-tight text-white mb-2">DocuForge Pro App</h1>
          <p class="text-xs text-slate-400 text-center max-w-xs leading-relaxed mb-8">
            Create, compile, protect and read your critical ePubs and PDFs with zero hassle. Experience the complete portable documents toolbox.
          </p>

          <!-- Fake Loading Bar -->
          <div class="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mb-8">
            <div class="h-full bg-gradient-to-r from-indigo-500 to-rose-500 animate-[pulse_2s_infinite]" style="width: 100%"></div>
          </div>

          <button id="admob-mock-appopen-skip" class="w-full bg-white hover:bg-slate-100 text-slate-950 text-xs font-bold py-3 px-6 rounded-xl transition-all shadow-lg active:scale-98 cursor-pointer text-center">
            Continue to Application
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const skipBtn = document.getElementById('admob-mock-appopen-skip');
    if (skipBtn) {
      skipBtn.onclick = () => {
        this.removeMockOverlay();
        this.triggerEvent('appOpenDismissed');
      };
    }
  }

  private static showMockConsentOverlay(): Promise<{ status: string; canShowAds: boolean }> {
    this.removeMockOverlay();

    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      this.activeMockOverlay = overlay;
      overlay.id = 'admob-mock-overlay';
      overlay.className = 'fixed inset-0 z-[10001] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans text-white select-none';

      overlay.innerHTML = `
        <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
          
          <!-- Google Consent Badge Header -->
          <div class="flex items-center gap-1.5 px-6 py-4 border-b border-slate-800 bg-slate-950 text-xs text-gray-400">
            <svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 16px; height: 16px;">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span class="font-bold uppercase tracking-wider font-mono text-[10px]">Google Privacy & Consent Manager</span>
          </div>

          <!-- Main message content -->
          <div class="p-6">
            <h2 class="text-base font-bold text-slate-100 tracking-tight leading-tight">We value your privacy</h2>
            <p class="text-xs text-slate-400 mt-2.5 leading-relaxed">
              We and our advertising partners use cookies and devices identifiers to present personalized advertisements, optimize ad performance, and collect analytics to improve your overall experience.
            </p>
            <p class="text-[11px] text-zinc-500 mt-3 leading-relaxed">
              By clicking "Consent", you agree to personalized advertising and telemetry. You can change your choices at any time in the app settings.
            </p>
          </div>

          <!-- Action operations -->
          <div class="px-6 pb-6 pt-2 flex flex-col gap-2">
            <button id="admob-mock-consent-accept" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-3 px-4 rounded-xl shadow transition cursor-pointer">
              Consent (Turn on Personalized Ads)
            </button>
            <div class="flex gap-2">
              <button id="admob-mock-consent-reject" class="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-2.5 px-3 rounded-xl border border-slate-700 transition cursor-pointer">
                Manage Options
              </button>
              <button id="admob-mock-consent-deny" class="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-2.5 px-3 rounded-xl border border-slate-700 transition cursor-pointer">
                Deny & Non-Personalized Ads
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      const acceptBtn = document.getElementById('admob-mock-consent-accept');
      if (acceptBtn) {
        acceptBtn.onclick = () => {
          this.removeMockOverlay();
          resolve({ status: 'OBTAINED', canShowAds: true });
        };
      }

      const rejectBtn = document.getElementById('admob-mock-consent-reject');
      if (rejectBtn) {
        rejectBtn.onclick = () => {
          this.removeMockOverlay();
          alert('Opened consent customization panel. Defaulting to customizable options.');
          resolve({ status: 'OBTAINED', canShowAds: true });
        };
      }

      const denyBtn = document.getElementById('admob-mock-consent-deny');
      if (denyBtn) {
        denyBtn.onclick = () => {
          this.removeMockOverlay();
          resolve({ status: 'NOT_REQUIRED', canShowAds: true });
        };
      }
    });
  }

  private static removeMockOverlay() {
    if (this.activeMockOverlay) {
      try {
        if (this.activeMockOverlay.parentNode) {
          this.activeMockOverlay.parentNode.removeChild(this.activeMockOverlay);
        }
      } catch (e) {}
      this.activeMockOverlay = null;
    }
  }
}
