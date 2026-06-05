import { WorkspaceFile } from '../types/file';
import { AndroidStorage } from '../integrations/AndroidStorage';

export class CopyManager {
  static async copyFile(file: WorkspaceFile): Promise<WorkspaceFile> {
    return await AndroidStorage.copyFile(file);
  }

  static async copyFiles(files: WorkspaceFile[]): Promise<WorkspaceFile[]> {
    return await Promise.all(files.map(f => this.copyFile(f)));
  }
}

