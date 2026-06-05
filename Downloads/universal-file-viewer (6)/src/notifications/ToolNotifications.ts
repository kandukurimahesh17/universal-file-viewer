import { NotificationManager } from './NotificationManager';

export class ToolNotifications {
  /**
   * Compression outcomes.
   */
  static notifyCompressionSuccess(fileName: string, savedBytes?: number): void {
    const savings = savedBytes && savedBytes > 0 
      ? ` Saved ${(savedBytes / 1024).toFixed(1)} KB.` 
      : '';
    NotificationManager.success(`"${fileName}" successfully compressed!${savings}`);
  }

  static notifyCompressionError(fileName: string, errMsg: string): void {
    NotificationManager.error(`Compression failed for "${fileName}": ${errMsg}`);
  }

  /**
   * Formatting/Conversion outcomes.
   */
  static notifyConversionSuccess(fileName: string, fromExt: string, toExt: string): void {
    NotificationManager.success(`Successfully converted "${fileName}" from ${fromExt.toUpperCase()} to ${toExt.toUpperCase()}!`);
  }

  static notifyConversionError(fileName: string, errMsg: string): void {
    NotificationManager.error(`Conversion failed: ${errMsg}`);
  }

  static notifyZipCreated(zipName: string, fileCount: number): void {
    NotificationManager.success(`Successfully packed ${fileCount} converted items into "${zipName}"!`);
  }

  /**
   * File operations.
   */
  static notifyFileDeleted(fileName: string): void {
    NotificationManager.success(`"${fileName}" deleted successfully from workspace.`);
  }

  static notifyFileRenamed(oldName: string, newName: string): void {
    NotificationManager.success(`Renamed "${oldName}" to "${newName}"`);
  }

  static notifyZipExtracted(fileName: string, count: number): void {
    NotificationManager.success(`Extracted ${count} items from archive "${fileName}" Successfully.`);
  }

  /**
   * PDF utility operations.
   */
  static notifyPdfMerged(fileName: string, count: number): void {
    NotificationManager.success(`Created "${fileName}" by matching & merging ${count} PDF pages!`);
  }

  static notifyPdfSplit(fileName: string, parts: number): void {
    NotificationManager.success(`Split "${fileName}" into ${parts} documents successfully.`);
  }

  static notifyPdfWatermarked(fileName: string): void {
    NotificationManager.success(`Successfully embedded watermark into "${fileName}".`);
  }

  static notifyPdfProtected(fileName: string): void {
    NotificationManager.success(`Password security added successfully to "${fileName}".`);
  }

  static notifyPdfRepaired(fileName: string): void {
    NotificationManager.success(`Successfully scanned and repaired formatting on "${fileName}".`);
  }
}

export default ToolNotifications;
