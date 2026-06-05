import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export class DownloadManager {
  /**
   * Saves a base64 string or binary Blob natively to the local Android storage Downloads/Documents,
   * completely offline without server/browser proxies.
   */
  static async saveToDevice(fileName: string, base64Data: string): Promise<{ success: boolean; path?: string; uri?: string }> {
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents,
          recursive: true
        });
        return {
          success: true,
          path: `Documents/${fileName}`,
          uri: result.uri
        };
      } else {
        // Dev environment browser simulation
        return {
          success: true,
          path: `/Documents/${fileName}`,
          uri: `file:///simulated_root/Documents/${fileName}`
        };
      }
    } catch (error: any) {
      console.error('DownloadManager saveToDevice failed:', error);
      throw error;
    }
  }
}

export default DownloadManager;
