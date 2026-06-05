import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export interface StorageItem {
  id: string;
  name: string;
  path: string;
  uri: string;
  type: 'file' | 'directory';
  size: number;
  category: 'pdf' | 'doc' | 'xls' | 'ppt' | 'txt' | 'epub' | 'image' | 'audio' | 'video' | 'archive' | 'code' | 'other' | 'folder';
  mimeType: string;
  lastModified?: number;
  parentPath?: string;
  displaySize: string;
}

export class StorageAccess {
  /**
   * Request standard public storage permissions (compatible with Android 10-14).
   * On Android 13-14, storage permissions may check or manifest media permissions under the hood,
   * but Filesystem.requestPermissions() standardizes this check.
   */
  static async requestStoragePermission(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return true;
    }
    try {
      const check = await Filesystem.checkPermissions();
      if (check.publicStorage === 'granted') {
        return true;
      }
      const req = await Filesystem.requestPermissions();
      return req.publicStorage === 'granted';
    } catch (e) {
      console.error('Error requesting storage permission', e);
      return false;
    }
  }

  /**
   * Check if standard public storage permissions are granted.
   */
  static async hasStoragePermission(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return true;
    }
    try {
      const check = await Filesystem.checkPermissions();
      return check.publicStorage === 'granted';
    } catch (e) {
      console.error('Error checking storage permission', e);
      return false;
    }
  }

  /**
   * General browse utility for a specific Capacitor Directory.
   */
  static async browseDirectory(directory: Directory, path: string = ''): Promise<StorageItem[]> {
    if (!Capacitor.isNativePlatform()) {
      return this.getSimulatedFiles(directory, path);
    }

    try {
      const isGranted = await this.hasStoragePermission();
      if (!isGranted) {
        const req = await this.requestStoragePermission();
        if (!req) {
          console.warn('Storage permissions not granted for directory access');
          return [];
        }
      }

      const res = await Filesystem.readdir({
        directory,
        path
      });

      return res.files.map(f => {
        const ext = f.name.split('.').pop()?.toLowerCase() || '';
        const mimeType = this.getMimeTypeByExtension(ext);
        const category = this.getCategoryByExtension(ext, f.type);
        const displaySize = this.formatBytes(f.size || 0);

        return {
          id: `${directory}_${path ? path + '/' : ''}${f.name}`.replace(/\/\/+/g, '/'),
          name: f.name,
          path: path ? `${path}/${f.name}` : f.name,
          uri: f.uri,
          type: f.type,
          size: f.size || 0,
          category,
          mimeType,
          lastModified: f.mtime,
          parentPath: path,
          displaySize
        };
      });
    } catch (e) {
      console.error(`Error reading directory ${directory}/${path}:`, e);
      return [];
    }
  }

  /**
   * Browse Android Downloads directory.
   * Maps to ExternalStorage/Download with fallback.
   */
  static async browseDownloads(): Promise<StorageItem[]> {
    if (!Capacitor.isNativePlatform()) {
      return this.getSimulatedFilesForCategory('download');
    }

    const targets = [
      // @ts-ignore
      { directory: Directory.ExternalStorage || 'EXTERNAL_STORAGE', path: 'Download' },
      { directory: Directory.Documents, path: 'Download' },
      { directory: Directory.Documents, path: '' }
    ];

    for (const target of targets) {
      try {
        const items = await this.browseDirectory(target.directory as Directory, target.path);
        if (items && items.length > 0) {
          return items;
        }
      } catch (e) {
        console.debug(`Download path check failed at: ${target.directory}/${target.path}`);
      }
    }

    return [];
  }

  /**
   * Browse Documents directory.
   */
  static async browseDocuments(): Promise<StorageItem[]> {
    if (!Capacitor.isNativePlatform()) {
      return this.getSimulatedFilesForCategory('documents');
    }

    const targets = [
      { directory: Directory.Documents, path: '' },
      // @ts-ignore
      { directory: Directory.ExternalStorage || 'EXTERNAL_STORAGE', path: 'Documents' },
      // @ts-ignore
      { directory: Directory.ExternalStorage || 'EXTERNAL_STORAGE', path: 'Document' }
    ];

    for (const target of targets) {
      try {
        const items = await this.browseDirectory(target.directory as Directory, target.path);
        if (items && items.length > 0) {
          return items;
        }
      } catch (e) {
        console.debug(`Documents path check failed at: ${target.directory}/${target.path}`);
      }
    }

    return [];
  }

  /**
   * Browse Pictures directory.
   */
  static async browsePictures(): Promise<StorageItem[]> {
    if (!Capacitor.isNativePlatform()) {
      return this.getSimulatedFilesForCategory('pictures');
    }

    const targets = [
      // @ts-ignore
      { directory: Directory.ExternalStorage || 'EXTERNAL_STORAGE', path: 'Pictures' },
      // @ts-ignore
      { directory: Directory.ExternalStorage || 'EXTERNAL_STORAGE', path: 'DCIM' },
      // @ts-ignore
      { directory: Directory.ExternalStorage || 'EXTERNAL_STORAGE', path: 'DCIM/Camera' },
      { directory: Directory.Documents, path: 'Pictures' }
    ];

    for (const target of targets) {
      try {
        const items = await this.browseDirectory(target.directory as Directory, target.path);
        if (items && items.length > 0) {
          return items;
        }
      } catch (e) {
        console.debug(`Pictures path check failed at: ${target.directory}/${target.path}`);
      }
    }

    return [];
  }

  /**
   * Browse Videos directory.
   */
  static async browseVideos(): Promise<StorageItem[]> {
    if (!Capacitor.isNativePlatform()) {
      return this.getSimulatedFilesForCategory('videos');
    }

    const targets = [
      // @ts-ignore
      { directory: Directory.ExternalStorage || 'EXTERNAL_STORAGE', path: 'Movies' },
      // @ts-ignore
      { directory: Directory.ExternalStorage || 'EXTERNAL_STORAGE', path: 'DCIM/Camera' },
      // @ts-ignore
      { directory: Directory.ExternalStorage || 'EXTERNAL_STORAGE', path: 'Video' },
      // @ts-ignore
      { directory: Directory.ExternalStorage || 'EXTERNAL_STORAGE', path: 'Videos' }
    ];

    for (const target of targets) {
      try {
        const items = await this.browseDirectory(target.directory as Directory, target.path);
        if (items && items.length > 0) {
          return items;
        }
      } catch (e) {
        console.debug(`Videos path check failed at: ${target.directory}/${target.path}`);
      }
    }

    return [];
  }

  /**
   * Browse Audio directory.
   */
  static async browseAudio(): Promise<StorageItem[]> {
    if (!Capacitor.isNativePlatform()) {
      return this.getSimulatedFilesForCategory('audio');
    }

    const targets = [
      // @ts-ignore
      { directory: Directory.ExternalStorage || 'EXTERNAL_STORAGE', path: 'Music' },
      // @ts-ignore
      { directory: Directory.ExternalStorage || 'EXTERNAL_STORAGE', path: 'Audio' },
      // @ts-ignore
      { directory: Directory.ExternalStorage || 'EXTERNAL_STORAGE', path: 'Alarms' },
      // @ts-ignore
      { directory: Directory.ExternalStorage || 'EXTERNAL_STORAGE', path: 'Podcasts' }
    ];

    for (const target of targets) {
      try {
        const items = await this.browseDirectory(target.directory as Directory, target.path);
        if (items && items.length > 0) {
          return items;
        }
      } catch (e) {
        console.debug(`Audio path check failed at: ${target.directory}/${target.path}`);
      }
    }

    return [];
  }

  // --- Utility Helpers ---

  static getMimeTypeByExtension(ext: string): string {
    const map: Record<string, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      txt: 'text/plain',
      epub: 'application/epub+zip',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      bmp: 'image/bmp',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      m4a: 'audio/x-m4a',
      flac: 'audio/flac',
      mp4: 'video/mp4',
      mkv: 'video/x-matroska',
      avi: 'video/x-msvideo',
      mov: 'video/quicktime',
      webm: 'video/webm',
      zip: 'application/zip',
      rar: 'application/vnd.rar',
      '7z': 'application/x-7z-compressed',
      js: 'application/javascript',
      ts: 'application/typescript',
      html: 'text/html',
      css: 'text/css',
      json: 'application/json',
      xml: 'application/xml',
      csv: 'text/csv'
    };
    return map[ext] || 'application/octet-stream';
  }

  static getCategoryByExtension(ext: string, type: 'file' | 'directory'): 'pdf' | 'doc' | 'xls' | 'ppt' | 'txt' | 'epub' | 'image' | 'audio' | 'video' | 'archive' | 'code' | 'other' | 'folder' {
    if (type === 'directory') return 'folder';
    const extLower = ext.toLowerCase();

    if (extLower === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(extLower)) return 'doc';
    if (['xls', 'xlsx'].includes(extLower)) return 'xls';
    if (['ppt', 'pptx'].includes(extLower)) return 'ppt';
    if (extLower === 'txt') return 'txt';
    if (extLower === 'epub') return 'epub';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extLower)) return 'image';
    if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(extLower)) return 'audio';
    if (['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(extLower)) return 'video';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extLower)) return 'archive';
    if (['js', 'ts', 'tsx', 'html', 'css', 'json', 'xml', 'csv'].includes(extLower)) return 'code';

    return 'other';
  }

  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // --- Mock/Simulated Store For Web Browser Viewers ---

  private static getSimulatedFiles(directory: Directory, path: string): StorageItem[] {
    return [];
  }

  private static getSimulatedFilesForCategory(categoryKey: string): StorageItem[] {
    return [];
  }
}
