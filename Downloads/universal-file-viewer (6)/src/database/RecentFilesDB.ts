import { WorkspaceFile } from '../App';

export interface RecentRecord {
  fileId: string;
  lastOpenedAt: number;
}

export class RecentFilesDB {
  private static STORAGE_KEY = 'filemanager_recent_records';
  private static DEFAULT_MAX_ITEMS = 50;

  static getRecentRecords(): RecentRecord[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to parse recent records from local storage', e);
      return [];
    }
  }

  static saveRecentRecords(records: RecentRecord[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.error('Failed to save recent records to local storage', e);
    }
  }

  static trackFile(id: string, maxItems: number = this.DEFAULT_MAX_ITEMS): void {
    let records = this.getRecentRecords();
    // Remove if already exists to update date and move to top
    records = records.filter(r => r.fileId !== id);
    // Add new record at the top
    records.unshift({
      fileId: id,
      lastOpenedAt: Date.now()
    });
    // Slice to maximum length
    if (records.length > maxItems) {
      records = records.slice(0, maxItems);
    }
    this.saveRecentRecords(records);
  }

  static removeRecent(id: string): void {
    let records = this.getRecentRecords();
    records = records.filter(r => r.fileId !== id);
    this.saveRecentRecords(records);
  }

  static clearRecent(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear recent records', e);
    }
  }

  static getRecentFiles(files: WorkspaceFile[], maxItems: number = this.DEFAULT_MAX_ITEMS): WorkspaceFile[] {
    const records = this.getRecentRecords();
    
    // Create quick lookup for lastOpenedAt
    const recordMap = new Map<string, number>();
    records.forEach(r => recordMap.set(r.fileId, r.lastOpenedAt));

    // Filter workspace files that are in the records and sort by the open date descending
    const recentFiles = files.filter(f => recordMap.has(f.id));
    
    // Sort
    recentFiles.sort((a, b) => {
      const timeA = recordMap.get(a.id) || 0;
      const timeB = recordMap.get(b.id) || 0;
      return timeB - timeA;
    });

    return recentFiles.slice(0, maxItems);
  }
}

