/**
 * API Error Toast Integration
 * 
 * This module provides a way to show toast notifications for API errors
 * without creating circular dependencies between api-client and ToastContext.
 * 
 * The api-client dispatches events, and this module listens and shows toasts.
 */

import { useEffect } from 'react';
import { useToast } from '../context/ToastContext';

/**
 * Hook to integrate API errors with toast notifications
 * 
 * Call this once in App.tsx to enable automatic toast notifications for API errors
 */
export function useApiErrorToasts() {
  const { showToast } = useToast();

  useEffect(() => {
    // Listen for API error events
    const handleApiError = (event: Event) => {
      const customEvent = event as CustomEvent<{
        status: number;
        message?: string;
      }>;

      const { status, message } = customEvent.detail;

      // Show appropriate toast based on status code
      switch (status) {
        case 401:
          showToast('Session expired. Please login again.', 'error');
          break;
        case 403:
          showToast('You don\'t have permission to perform this action.', 'error');
          break;
        case 404:
          showToast(message || 'Resource not found.', 'error');
          break;
        case 429:
          showToast('Too many requests. Please slow down.', 'warning');
          break;
        case 500:
        case 502:
        case 503:
          showToast('Server error. Please try again later.', 'error');
          break;
        default:
          if (status >= 400) {
            showToast(message || 'An error occurred. Please try again.', 'error');
          }
      }
    };

    // Listen for network errors
    const handleNetworkError = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string }>;
      const message = customEvent.detail?.message;

      if (!navigator.onLine) {
        showToast('You\'re offline. Your changes will sync when you reconnect.', 'info');
      } else {
        showToast(message || 'Network error. Please check your connection.', 'error');
      }
    };

    // Listen for offline queue events
    const handleOfflineQueued = () => {
      showToast('Saved! Will sync when you\'re back online.', 'success', { duration: 3000 });
    };

    // Listen for successful sync
    const handleSyncSuccess = () => {
      showToast('All changes synced successfully!', 'success');
    };

    window.addEventListener('api:error', handleApiError);
    window.addEventListener('api:network-error', handleNetworkError);
    window.addEventListener('api:offline-queued', handleOfflineQueued);
    window.addEventListener('offline-sync:success', handleSyncSuccess);

    return () => {
      window.removeEventListener('api:error', handleApiError);
      window.removeEventListener('api:network-error', handleNetworkError);
      window.removeEventListener('api:offline-queued', handleOfflineQueued);
      window.removeEventListener('offline-sync:success', handleSyncSuccess);
    };
  }, [showToast]);
}

/**
 * Dispatch API error event from api-client
 * 
 * Call this from the api-client error interceptor
 */
export function dispatchApiError(status: number, message?: string) {
  window.dispatchEvent(new CustomEvent('api:error', {
    detail: { status, message }
  }));
}

/**
 * Dispatch network error event from api-client
 */
export function dispatchNetworkError(message?: string) {
  window.dispatchEvent(new CustomEvent('api:network-error', {
    detail: { message }
  }));
}

/**
 * Dispatch success toast
 * Helper function for components to show success messages
 */
export function showSuccessToast(message: string) {
  window.dispatchEvent(new CustomEvent('app:success-toast', {
    detail: { message }
  }));
}
