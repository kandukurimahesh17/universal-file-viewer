import { StorageAccess } from '../native/StorageAccess';
import { WorkspaceFile } from '../types/file';
import { AndroidStorage } from './AndroidStorage';

export class AndroidDownloads {
  static async listFiles(): Promise<WorkspaceFile[]> {
    const items = await StorageAccess.browseDownloads();
    return items.map(item => AndroidStorage.toWorkspaceFile(item));
  }

  static async listDocuments(): Promise<WorkspaceFile[]> {
    const items = await StorageAccess.browseDocuments();
    return items.map(item => AndroidStorage.toWorkspaceFile(item));
  }

  static async listPictures(): Promise<WorkspaceFile[]> {
    const items = await StorageAccess.browsePictures();
    return items.map(item => AndroidStorage.toWorkspaceFile(item));
  }

  static async listVideos(): Promise<WorkspaceFile[]> {
    const items = await StorageAccess.browseVideos();
    return items.map(item => AndroidStorage.toWorkspaceFile(item));
  }

  static async listAudio(): Promise<WorkspaceFile[]> {
    const items = await StorageAccess.browseAudio();
    return items.map(item => AndroidStorage.toWorkspaceFile(item));
  }
}

