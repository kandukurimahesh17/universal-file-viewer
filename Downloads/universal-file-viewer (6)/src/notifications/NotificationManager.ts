import { NotificationService } from './NotificationService';

export class NotificationManager {
  /**
   * Fires a success visual notification.
   */
  static success(message: string): void {
    NotificationService.notify(message, 'success');
  }

  /**
   * Fires an error visual notification.
   */
  static error(message: string): void {
    NotificationService.notify(message, 'error');
  }

  /**
   * Fires a neutral or diagnostic information notification.
   */
  static info(message: string): void {
    NotificationService.notify(message, 'info');
  }
}

export default NotificationManager;
