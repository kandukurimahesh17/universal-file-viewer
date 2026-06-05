import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { StorageAccess } from './StorageAccess';

export class FileAccess {
  // In-memory file storage for Web preview environment (allows simulating write/read/delete cleanly)
  private static webFiles: Record<string, { data: string; isBase64: boolean; mimeType: string }> = {};

  /**
   * Check if a file exists.
   */
  static async fileExists(path: string, directory?: Directory): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      const key = `${directory || 'default'}_${path}`;
      return !!this.webFiles[key];
    }

    try {
      await Filesystem.stat({
        path,
        directory
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Reads a file and returns its content as a UTF-8 text string.
   */
  static async readFileAsText(path: string, directory?: Directory): Promise<string> {
    if (!Capacitor.isNativePlatform()) {
      const key = `${directory || 'default'}_${path}`;
      if (this.webFiles[key]) {
        const file = this.webFiles[key];
        if (file.isBase64) {
          return atob(file.data);
        }
        return file.data;
      }
      throw new Error(`File content is unavailable for simulated or un-uploaded file ${path}. Real uploaded files must be used.`);
    }

    const result = await Filesystem.readFile({
      path,
      directory,
      encoding: Encoding.UTF8 // Ensures string content is returned
    });

    return typeof result.data === 'string' ? result.data : '';
  }

  /**
   * Reads a file and returns its content as a base64 string.
   */
  static async readFileAsBase64(path: string, directory?: Directory): Promise<string> {
    if (!Capacitor.isNativePlatform()) {
      const key = `${directory || 'default'}_${path}`;
      if (this.webFiles[key]) {
        const file = this.webFiles[key];
        if (file.isBase64) return file.data;
        return btoa(file.data);
      }
      throw new Error(`File content is unavailable for simulated or un-uploaded file ${path}. Real uploaded files must be used.`);
    }

    const result = await Filesystem.readFile({
      path,
      directory
      // No encoding parameter means base64 encoded data is returned
    });

    return typeof result.data === 'string' ? result.data : '';
  }

  /**
   * Reads a file and returns its contents as a standard Web API Blob.
   */
  static async readFileAsBlob(path: string, directory?: Directory, mimeType?: string): Promise<Blob> {
    const ext = path.split('.').pop()?.toLowerCase() || '';
    const resolvedMime = mimeType || StorageAccess.getMimeTypeByExtension(ext);

    if (!Capacitor.isNativePlatform()) {
      const key = `${directory || 'default'}_${path}`;
      if (this.webFiles[key]) {
        const file = this.webFiles[key];
        const data = file.isBase64 ? this.base64toBlob(file.data, file.mimeType) : new Blob([file.data], { type: file.mimeType });
        return data;
      }
      throw new Error(`File content is unavailable for simulated or un-uploaded file ${path}. Real uploaded files must be used.`);
    }

    const base64Data = await this.readFileAsBase64(path, directory);
    return this.base64toBlob(base64Data, resolvedMime);
  }

  /**
   * Writes text or base64 data to a file on the native storage.
   */
  static async writeFile(path: string, data: string, directory?: Directory, isBase64: boolean = false): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      const key = `${directory || 'default'}_${path}`;
      const ext = path.split('.').pop()?.toLowerCase() || '';
      const mime = StorageAccess.getMimeTypeByExtension(ext);
      this.webFiles[key] = {
        data,
        isBase64,
        mimeType: mime
      };
      return;
    }

    // Auto create directories if needed
    await Filesystem.writeFile({
      path,
      data,
      directory,
      encoding: isBase64 ? undefined : Encoding.UTF8,
      recursive: true
    });
  }

  /**
   * Writes a standard Web API Blob or File directly to the native filesystem.
   */
  static async writeBlob(path: string, blob: Blob, directory?: Directory): Promise<void> {
    const base64 = await this.blobToBase64(blob);
    await this.writeFile(path, base64, directory, true);
  }

  /**
   * Delete a file from the storage.
   */
  static async deleteFile(path: string, directory?: Directory): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      const key = `${directory || 'default'}_${path}`;
      delete this.webFiles[key];
      return;
    }

    await Filesystem.deleteFile({
      path,
      directory
    });
  }

  /**
   * Retrieves the metadata info of a single file.
   */
  static async getFileMetadata(path: string, directory?: Directory): Promise<{ size: number; lastModified?: number; uri: string }> {
    if (!Capacitor.isNativePlatform()) {
      const key = `${directory || 'default'}_${path}`;
      const hasAdded = this.webFiles[key];
      if (hasAdded) {
        return {
          size: hasAdded.data.length,
          lastModified: Date.now(),
          uri: `file://${path}`
        };
      }
      throw new Error(`File metadata is not available: ${path}. Make sure to upload the file first.`);
    }

    const stats = await Filesystem.stat({
      path,
      directory
    });

    return {
      size: stats.size,
      lastModified: stats.mtime,
      uri: stats.uri
    };
  }

  // --- Base64/Blob Conversion Utilities ---

  /**
   * Converts base64 string to a Web API Blob.
   */
  static base64toBlob(base64: string, mimeType: string = 'application/octet-stream'): Blob {
    let cleanBase64 = base64;
    // Strip headers if any
    if (base64.includes(';base64,')) {
      cleanBase64 = base64.split(';base64,')[1];
    }
    // Handle whitespace/newlines
    cleanBase64 = cleanBase64.replace(/\s/g, '');

    const byteCharacters = atob(cleanBase64);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    return new Blob(byteArrays, { type: mimeType });
  }

  /**
   * Converts a standard Web API Blob or File to base64 encoding.
   */
  static blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const base64 = reader.result.split(',')[1] || reader.result;
          resolve(base64);
        } else {
          reject(new Error('Failed to read blob as Base64 string'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }
}
