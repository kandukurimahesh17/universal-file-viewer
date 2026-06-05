import { Capacitor } from '@capacitor/core';
import { Filesystem } from '@capacitor/filesystem';

export class PermissionService {
  static async requestPermission(type: 'camera' | 'mic' | 'location' | 'storage'): Promise<boolean> {
    try {
      if (type === 'storage') {
        if (Capacitor.isNativePlatform()) {
          const status = await Filesystem.requestPermissions();
          return status.publicStorage === 'granted';
        }
        return true;
      } else if (type === 'camera') {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(t => t.stop());
          return true;
        }
        return false;
      } else if (type === 'mic') {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(t => t.stop());
          return true;
        }
        return false;
      } else if (type === 'location') {
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
          return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              () => resolve(true),
              () => resolve(false)
            );
          });
        }
        return false;
      }
      return false;
    } catch (e) {
      console.warn(`Permission request for ${type} failed`, e);
      return false;
    }
  }
}
