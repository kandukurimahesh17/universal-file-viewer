import { WorkspaceFile } from '../types/file';
import { AndroidStorage } from '../integrations/AndroidStorage';

export class MoveManager {
  static async moveFile(file: WorkspaceFile, destParentPath: string): Promise<WorkspaceFile> {
    return await AndroidStorage.moveFile(file, destParentPath);
  }

  static async moveFiles(files: WorkspaceFile[], destParentPath: string): Promise<WorkspaceFile[]> {
    return await Promise.all(files.map(f => this.moveFile(f, destParentPath)));
  }
}
