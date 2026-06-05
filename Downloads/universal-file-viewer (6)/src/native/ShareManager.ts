import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export class ShareManager {
  /**
   * Share file with general sharing sheet natively on mobile or using standard navigator.share on web.
   */
  static async shareFile(fileName: string, blob: Blob, base64Data?: string): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      try {
        let cleanBase64 = base64Data;
        if (!cleanBase64) {
          cleanBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (typeof reader.result === 'string') {
                const res = reader.result.split(',')[1];
                resolve(res);
              } else {
                reject(new Error('Failed to read as Base64 string'));
              }
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }

        // Save to cache first to get a file URI
        const cacheFile = await Filesystem.writeFile({
          path: fileName,
          data: cleanBase64,
          directory: Directory.Cache
        });

        await Share.share({
          title: fileName,
          text: `Sharing ${fileName}`,
          url: cacheFile.uri
        });
        return true;
      } catch (err) {
        console.error('ShareManager error during native share:', err);
        return false;
      }
    } else if (navigator.share) {
      try {
        const file = new File([blob], fileName, { type: blob.type });
        await navigator.share({
          title: fileName,
          files: [file]
        });
        return true;
      } catch (err) {
        console.log('Share interaction aborted:', err);
        return false;
      }
    } else {
      console.warn('ShareManager: System sharing not supported on this platform');
      return false;
    }
  }
}

export default ShareManager;
