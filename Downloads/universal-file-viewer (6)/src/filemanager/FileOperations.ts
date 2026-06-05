import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { WorkspaceFile } from '../App';
import { NotificationManager } from '../notifications/NotificationManager';
import { ToolNotifications } from '../notifications/ToolNotifications';

export class FileOperations {
  static async deleteFile(
    files: WorkspaceFile[],
    id: string,
    urlCache: React.MutableRefObject<{ [key: string]: string }>
  ): Promise<WorkspaceFile[]> {
    const file = files.find(f => f.id === id);
    if (!file) return files;

    ToolNotifications.notifyFileDeleted(file.name);

    if (Capacitor.isNativePlatform() && (file.uri || file.path)) {
      try {
        const { DeleteManager } = await import('./DeleteManager');
        await DeleteManager.deleteFile(file as any);
      } catch (err) {
        console.error("Failed to delete native file", err);
      }
    }

    if (urlCache.current[id]) {
      URL.revokeObjectURL(urlCache.current[id]);
      delete urlCache.current[id];
    }

    return files.filter(f => f.id !== id);
  }

  static toggleFavorite(files: WorkspaceFile[], id: string): WorkspaceFile[] {
    return files.map(f => (f.id === id ? { ...f, isFavorite: !f.isFavorite } : f));
  }

  static togglePin(files: WorkspaceFile[], id: string): WorkspaceFile[] {
    return files.map(f => (f.id === id ? { ...f, isPinned: !f.isPinned } : f));
  }

  static async renameFile(files: WorkspaceFile[], id: string): Promise<WorkspaceFile[]> {
    const file = files.find(f => f.id === id);
    if (!file) return files;

    const newName = prompt('Enter new file name:', file.name);
    if (newName && newName.trim() !== '') {
      const oldName = file.name;
      let updatedFile = { ...file, name: newName.trim() };

      if (Capacitor.isNativePlatform() && (file.uri || file.path)) {
        try {
          const { RenameManager } = await import('./RenameManager');
          const nativeRenamed = await RenameManager.renameFile(file as any, newName.trim());
          updatedFile = { ...updatedFile, ...nativeRenamed } as unknown as WorkspaceFile;
        } catch (err) {
          console.error("Failed to rename native file", err);
        }
      }

      ToolNotifications.notifyFileRenamed(oldName, updatedFile.name);
      return files.map(f => (f.id === id ? updatedFile : f));
    }
    return files;
  }

  static async shareFile(file: WorkspaceFile): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        const reader = new FileReader();
        reader.readAsDataURL(file.blob as Blob);
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          const base64Content = base64data.split(',')[1];
          const savedFile = await Filesystem.writeFile({
            path: file.name,
            data: base64Content,
            directory: Directory.Cache,
          });
          await Share.share({
            title: file.name,
            url: savedFile.uri,
          });
        };
      } catch (err) {
        console.error("Capacitor share failed", err);
      }
    } else if (navigator.share && file.blob instanceof File) {
      try {
        await navigator.share({
          title: file.name,
          files: [file.blob as File],
        });
      } catch (err) {
        console.log("Share failed", err);
      }
    } else {
      NotificationManager.error("Sharing not supported on this browser/file.");
    }
  }

  static async downloadBlob(blob: Blob, name: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        await Filesystem.requestPermissions();
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          const base64Content = base64data.split(',')[1];
          await Filesystem.writeFile({
            path: name,
            data: base64Content,
            // @ts-ignore
            directory: Directory.Downloads || 'DOWNLOADS',
          });
          NotificationManager.success("Saved to Downloads successfully!");
        };
      } catch (e) {
        console.error(e);
        NotificationManager.error("Failed to save. Storage permission might be denied.");
      }
    } else {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = name;
      link.click();
      URL.revokeObjectURL(link.href);
    }
  }
}
