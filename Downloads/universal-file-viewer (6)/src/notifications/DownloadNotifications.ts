import { NotificationManager } from './NotificationManager';

export class DownloadNotifications {
  /**
   * Fires notification indicating a download task has started.
   */
  static notifyDownloadStarted(fileName: string): void {
    NotificationManager.info(`Downloading "${fileName}" to the workspace...`);
  }

  /**
   * Fires notification when a download completes successfully.
   */
  static notifyDownloadSuccess(fileName: string, size?: number): void {
    const sizeStr = size ? ` (${(size / 1024).toFixed(1)} KB)` : '';
    NotificationManager.success(`Successfully downloaded "${fileName}"${sizeStr}!`);
  }

  /**
   * Fires notification detailing failure of a file download.
   */
  static notifyDownloadError(fileName: string, error?: string): void {
    const reason = error ? `: ${error}` : '';
    NotificationManager.error(`Failed to download "${fileName}"${reason}`);
  }
}

export default DownloadNotifications;
