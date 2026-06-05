import { WorkspaceFile } from '../types/file';
import { FileService } from './FileService';

export class ZipService {
  static async extractZip(file: WorkspaceFile): Promise<WorkspaceFile[]> {
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();
    
    let blob = file.blob;
    if (!blob && file.uri) {
      const { Capacitor } = await import('@capacitor/core');
      const res = await fetch(Capacitor.convertFileSrc(file.uri));
      blob = await res.blob();
    }
    
    if (!blob) {
      throw new Error("No file content for ZIP extraction");
    }

    const contents = await zip.loadAsync(blob);
    const extractedFiles: WorkspaceFile[] = [];
    const now = Date.now();
    let counter = 0;
    
    for (const [path, zipObj] of Object.entries(contents.files)) {
      if (!zipObj.dir) {
        const fileBlob = await zipObj.async('blob');
        const name = path.split('/').pop() || path;
        extractedFiles.push({
          id: 'file-' + Math.random().toString(36).substr(2, 9) + (counter++),
          name: name,
          path: path,
          category: FileService.getFileCategory(name, fileBlob.type),
          size: fileBlob.size,
          mimeType: fileBlob.type || 'application/octet-stream',
          blob: fileBlob,
          lastModified: now,
          isFavorite: false,
          isPinned: false
        });
      }
    }
    
    return extractedFiles;
  }

  static async createZip(files: { name: string; blob: Blob }[]): Promise<Blob> {
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();

    for (const file of files) {
      zip.file(file.name, file.blob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    return zipBlob;
  }
}

