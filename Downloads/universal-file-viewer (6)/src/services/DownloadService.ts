import { WorkspaceFile } from '../types/file';
import { FileService } from './FileService';

export class DownloadService {
  static async downloadFromUrl(url: string): Promise<WorkspaceFile> {
    const cleanUrl = url.trim();
    if (!cleanUrl) throw new Error('URL cannot be empty');
    
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(cleanUrl)}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error('Failed to retrieve resource: network or CORS issue');
    const blob = await res.blob();
    
    let name = cleanUrl.split('/').pop()?.split('?')[0];
    if (!name || name.length === 0) name = 'downloaded_file';
    if (!name.includes('.')) {
       name += '.' + (blob.type.split('/')[1] || 'bin');
    }

    const newFile: WorkspaceFile = {
      id: 'file-' + Math.random().toString(36).substr(2, 9),
      name: name,
      path: '/' + name,
      category: FileService.getFileCategory(name, blob.type),
      size: blob.size,
      mimeType: blob.type,
      blob: blob,
      lastModified: Date.now(),
      isFavorite: false,
      isPinned: false
    };

    return newFile;
  }
}
