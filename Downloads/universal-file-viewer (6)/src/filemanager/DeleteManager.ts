import { WorkspaceFile } from '../types/file';
import { AndroidStorage } from '../integrations/AndroidStorage';

export class DeleteManager {
  static async deleteFile(file: WorkspaceFile): Promise<void> {
    await AndroidStorage.deleteFile(file);
  }

  static async deleteFiles(files: WorkspaceFile[]): Promise<void> {
    await Promise.all(files.map(f => this.deleteFile(f)));
  }
}

