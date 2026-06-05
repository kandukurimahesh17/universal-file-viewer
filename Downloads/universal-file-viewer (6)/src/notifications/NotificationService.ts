export type NotificationListener = (message: string, type: 'success' | 'error' | 'info') => void;

export class NotificationService {
  private static listeners = new Set<NotificationListener>();

  /**
   * Registers a callback listener to capture notification events.
   */
  static addListener(listener: NotificationListener) {
    this.listeners.add(listener);
  }

  /**
   * Removes a registered callback listener.
   */
  static removeListener(listener: NotificationListener) {
    this.listeners.delete(listener);
  }

  /**
   * Dispatches a notification of specified level to all listening visual providers.
   */
  static notify(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    if (!message) return;
    this.listeners.forEach(listener => {
      try {
        listener(message, type);
      } catch (e) {
        console.warn("Failed to fire notification callback handler:", e);
      }
    });
  }
}

export default NotificationService;
