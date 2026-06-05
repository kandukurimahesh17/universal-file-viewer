import { WorkspaceFile } from '../types/file';
import { Capacitor } from '@capacitor/core';

export class ViewerService {
  static async prepareFileForViewing(file: WorkspaceFile): Promise<WorkspaceFile> {
    if (file.category === 'code' || file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
      try {
        let finalBlob = (file.blob && file.blob instanceof Blob) ? file.blob : null;
        if (!finalBlob && file.uri) {
           const res = await fetch(Capacitor.convertFileSrc(file.uri));
           finalBlob = await res.blob();
           return {
             ...file,
             blob: finalBlob
           };
        }
      } catch(e) {
         console.warn("ViewerService content loading failed", e);
      }
    }
    return file;
  }
}

