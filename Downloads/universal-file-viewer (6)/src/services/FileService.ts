import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { WorkspaceFile, FileCategory } from '../types/file';

export class FileService {
  static getFileCategory(name: string, mime: string): FileCategory {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    
    if (ext === 'pdf') return 'pdf';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'xls';
    if (['ppt', 'pptx'].includes(ext)) return 'ppt';
    if (['txt'].includes(ext)) return 'txt';
    if (['epub'].includes(ext)) return 'epub';
    if (['doc', 'docx', 'rtf'].includes(ext)) return 'doc';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext) || mime.startsWith('image/')) return 'image';
    if (['mp3', 'wav', 'aac', 'ogg', 'flac'].includes(ext) || mime.startsWith('audio/')) return 'audio';
    if (['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext) || mime.startsWith('video/')) return 'video';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
    if (['html', 'css', 'js', 'ts', 'json', 'xml', 'php', 'java', 'py', 'c', 'cpp', 'md', 'markdown'].includes(ext)) return 'code';
    
    return 'other';
  }

  static async performScan(): Promise<WorkspaceFile[]> {
    if (!Capacitor.isNativePlatform()) return [];
    try {
      const hasPerm = await Filesystem.checkPermissions();
      if (hasPerm.publicStorage !== 'granted') {
          const req = await Filesystem.requestPermissions();
          if (req.publicStorage !== 'granted') return [];
      }

      const dirsToScan = [
        { dir: Directory.Documents, path: '' },
        // @ts-ignore
        { dir: Directory.ExternalStorage || 'EXTERNAL_STORAGE', path: 'Download' }
      ];

      let scannedFiles: WorkspaceFile[] = [];
      const now = Date.now();
      let counter = 0;

      for (const target of dirsToScan) {
          try {
            const res = await Filesystem.readdir({ path: target.path, directory: target.dir });
            for (const f of res.files) {
                if (f.type === 'directory' || f.name.startsWith('.')) continue;
                const ext = f.name.split('.').pop()?.toLowerCase() || '';
                if (!['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) continue;

                scannedFiles.push({
                  id: 'scan-' + Math.random().toString(36).substr(2, 9) + counter++,
                  name: f.name,
                  path: f.uri || ('/' + f.name),
                  category: this.getFileCategory(f.name, ''),
                  size: f.size || 0,
                  mimeType: '',
                  uri: f.uri,
                  lastModified: now,
                  isFavorite: false,
                  isPinned: false
                });
            }
          } catch(e) {
            // ignore
          }
      }
      return scannedFiles;
    } catch(e) {
      console.warn("Auto-scan failed", e);
      return [];
    }
  }
}
