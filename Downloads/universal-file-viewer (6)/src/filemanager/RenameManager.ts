import { WorkspaceFile } from '../types/file';
import { AndroidStorage } from '../integrations/AndroidStorage';

export class RenameManager {
  static async renameFile(file: WorkspaceFile, newName: string): Promise<WorkspaceFile> {
    return await AndroidStorage.renameFile(file, newName);
  }
}

