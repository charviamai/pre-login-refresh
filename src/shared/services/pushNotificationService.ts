/**
 * Push Notification Service
 * 
 * Handles Web Push subscription and notification management.
 * Requires VAPID keys and backend integration for full functionality.
 */

import { apiClient } from '../utils/api-client';

// VAPID public key
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

type SubscriptionCallback = (subscription: PushSubscription | null) => void;

class PushNotificationService {
  private subscription: PushSubscription | null = null;
  private listeners: Set<SubscriptionCallback> = new Set();

  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && !!VAPID_PUBLIC_KEY;
  }
// ...
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const sub = subscription.toJSON();
      if (!sub.endpoint || !sub.keys?.auth || !sub.keys?.p256dh) {

        return;
      }
      
      await apiClient.post('/notifications/webpush/', {
        endpoint: sub.endpoint,
        auth_key: sub.keys.auth,
        p256dh_key: sub.keys.p256dh,
        user_agent: navigator.userAgent
      });

    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }

  private async removeSubscriptionFromServer(_subscription: PushSubscription): Promise<void> {
     // Optional: If we want to delete from server when user unsubscribes locally
     // Since endpoint is unique, we could delete by endpoint or just ignore
     // For now, let's try to delete if possible, but ModelViewSet expects ID for delete
     // We can just leave it as is or implement a custom delete-by-endpoint action later.
     // Or just log it.

  }

  /**
   * Get current permission status
   */
  getPermissionStatus(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {

      return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<PushSubscription | null> {
    if (!this.isSupported()) {

      return null;
    }

    const permission = await this.requestPermission();
    if (permission !== 'granted') {

      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
      }

      this.subscription = subscription;
      this.notifyListeners(subscription);
      
      // Send subscription to backend
      await this.sendSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      return true;
    }

    try {
      await this.subscription.unsubscribe();
      await this.removeSubscriptionFromServer(this.subscription);
      this.subscription = null;
      this.notifyListeners(null);
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  /**
   * Get current subscription
   */
  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.isSupported()) return null;

    try {
      const registration = await navigator.serviceWorker.ready;
      return await registration.pushManager.getSubscription();
    } catch (error) {
      console.warn('Failed to get push subscription:', error);
      return null;
    }
  }

  /**
   * Subscribe to subscription changes
   */
  onSubscriptionChange(callback: SubscriptionCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Show a local notification (for testing)
   */
  async showLocalNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.isSupported()) return;

    const permission = await this.requestPermission();
    if (permission !== 'granted') return;

    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: '/pwa-icon.svg',
      badge: '/pwa-icon.svg',
      ...options
    });
  }

  // ----- Private Methods -----

  private notifyListeners(subscription: PushSubscription | null): void {
    this.listeners.forEach(callback => callback(subscription));
  }



  private urlBase64ToUint8Array(base64String: string): ArrayBuffer {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray.buffer as ArrayBuffer;
  }
}

// Singleton instance
export const pushNotificationService = new PushNotificationService();
