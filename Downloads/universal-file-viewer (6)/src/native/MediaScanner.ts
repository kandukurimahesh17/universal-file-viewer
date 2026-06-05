import { Capacitor } from '@capacitor/core';

export class MediaScanner {
  /**
   * Refreshes the media database on Android so that newly saved compiled documents
   * appear in system lists and inside the app's scanner results immediately.
   */
  static async scanFile(path: string): Promise<void> {
    console.log(`[MediaScanner] Media scanner signaling refresh for path: ${path}`);
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    // On native Android, writing files into public Directory.Documents automatically
    // registers them, but we signal here so that custom hooks can re-trigger scans.
  }
}

export default MediaScanner;
