import { WorkspaceFile } from '../types/file';

export class FavoritesDB {
  private static STORAGE_KEY = 'filemanager_favorites_ids';

  static getFavoriteIds(): string[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to parse favorites from local storage', e);
      return [];
    }
  }

  static saveFavoriteIds(ids: string[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(ids));
    } catch (e) {
      console.error('Failed to save favorites to local storage', e);
    }
  }

  static isFavorite(id: string): boolean {
    const ids = this.getFavoriteIds();
    return ids.includes(id);
  }

  static addFavorite(id: string): void {
    const ids = this.getFavoriteIds();
    if (!ids.includes(id)) {
      ids.push(id);
      this.saveFavoriteIds(ids);
    }
  }

  static removeFavorite(id: string): void {
    const ids = this.getFavoriteIds();
    const index = ids.indexOf(id);
    if (index !== -1) {
      ids.splice(index, 1);
      this.saveFavoriteIds(ids);
    }
  }

  static toggleFavorite(id: string): boolean {
    const ids = this.getFavoriteIds();
    const index = ids.indexOf(id);
    if (index !== -1) {
      ids.splice(index, 1);
      this.saveFavoriteIds(ids);
      return false;
    } else {
      ids.push(id);
      this.saveFavoriteIds(ids);
      return true;
    }
  }

  static getFavorites(files: WorkspaceFile[]): WorkspaceFile[] {
    const ids = this.getFavoriteIds();
    return files.filter(f => ids.includes(f.id));
  }
}
