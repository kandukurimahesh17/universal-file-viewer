import { StorageAccess, StorageItem } from '../native/StorageAccess';
import { FileAccess } from '../native/FileAccess';
import { WorkspaceFile, FileCategory } from '../types/file';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export class AndroidStorage {
  static toWorkspaceFile(item: StorageItem): WorkspaceFile {
    return {
      id: item.id,
      name: item.name,
      path: item.path,
      category: item.category,
      size: item.size,
      mimeType: item.mimeType,
      uri: item.uri,
      lastModified: item.lastModified,
      isDirectory: item.type === 'directory',
    };
  }

  static async listFiles(directory: Directory, path: string = ''): Promise<WorkspaceFile[]> {
    const items = await StorageAccess.browseDirectory(directory, path);
    return items.map(this.toWorkspaceFile);
  }

  static async openFile(file: WorkspaceFile): Promise<Blob> {
    // Determine the directory based on path if needed, or fallback. It's tricky to map uri back to directory
    // but in capacitor we usually use uri directly if possible, or path + directory
    // Since we are reading, if it has a real blob (e.g. from picker), return it
    if (file.blob && file.blob instanceof Blob) {
      return file.blob;
    }
    
    // We can use FileAccess.readFileAsBlob(file.path, undefined, file.mimeType) if it's an absolute path
    // Let's rely on FileAccess logic
    return await FileAccess.readFileAsBlob(file.uri || file.path, undefined, file.mimeType);
  }

  static async deleteFile(file: WorkspaceFile): Promise<void> {
    await FileAccess.deleteFile(file.uri || file.path);
  }

  static async renameFile(file: WorkspaceFile, newName: string): Promise<WorkspaceFile> {
    if (!Capacitor.isNativePlatform()) {
       // mock rename
       return { ...file, name: newName, path: newName };
    }
    const pathParts = (file.uri || file.path).split('/');
    pathParts.pop();
    const newPath = `${pathParts.join('/')}/${newName}`;
    
    await Filesystem.rename({
      from: file.uri || file.path,
      to: newPath
    });
    
    return { ...file, name: newName, path: newPath, id: newPath };
  }

  static async copyFile(file: WorkspaceFile, destinationDir?: Directory): Promise<WorkspaceFile> {
     if (!Capacitor.isNativePlatform()) {
       return { ...file, id: file.id + '_copy', name: `Copy of ${file.name}` };
     }
     
     const newName = `copy_${Date.now()}_${file.name}`;
     const pathParts = (file.uri || file.path).split('/');
     pathParts.pop();
     const newPath = `${pathParts.join('/')}/${newName}`;

     await Filesystem.copy({
       from: file.uri || file.path,
       to: newPath,
     });

     return { ...file, id: newPath, name: newName, path: newPath };
  }

  static async moveFile(file: WorkspaceFile, newParentPath: string): Promise<WorkspaceFile> {
    if (!Capacitor.isNativePlatform()) {
       return { ...file, path: `${newParentPath}/${file.name}` };
    }

    const newPath = `${newParentPath}/${file.name}`;
    await Filesystem.rename({
      from: file.uri || file.path,
      to: newPath
    });

    return { ...file, path: newPath, id: newPath };
  }
}

