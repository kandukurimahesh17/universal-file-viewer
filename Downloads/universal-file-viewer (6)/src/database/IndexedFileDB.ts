export class IndexedFileDB {
  private static DB_NAME = 'filemanager_blobs_db';
  private static STORE_NAME = 'file_blobs';
  private static DB_VERSION = 1;

  private static openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open files database'));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME);
        }
      };
    });
  }

  static async saveFileBlob(id: string, blob: Blob): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.STORE_NAME, 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.put(blob, id);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(new Error(`Failed to save blob for file ${id}`));
        };
      });
    } catch (err) {
      console.error('[IndexedFileDB] Error saving blob:', err);
    }
  }

  static async getFileBlob(id: string): Promise<Blob | null> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.STORE_NAME, 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
          resolve(request.result || null);
        };

        request.onerror = () => {
          reject(new Error(`Failed to retrieve blob for file ${id}`));
        };
      });
    } catch (err) {
      console.error('[IndexedFileDB] Error getting blob:', err);
      return null;
    }
  }

  static async deleteFileBlob(id: string): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.STORE_NAME, 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(new Error(`Failed to delete blob for file ${id}`));
        };
      });
    } catch (err) {
      console.error('[IndexedFileDB] Error deleting blob:', err);
    }
  }
}
