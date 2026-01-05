import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../utils/api-client';

export interface UserNotification {
  id: string;
  notification_type: string;
  notification_type_display: string;
  title: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  priority_display: string;
  is_read: boolean;
  read_at: string | null;
  action_url: string;
  metadata: Record<string, unknown>;
  created_at: string;
  time_ago: string;
}

interface NotificationsResponse {
  count: number;
  results: UserNotification[];
}

interface UnreadCountResponse {
  unread_count: number;
}

/**
 * Hook to fetch and manage user notifications
 * 
 * Usage:
 * const { notifications, unreadCount, markAsRead, markAllAsRead, refresh, isLoading } = useNotifications();
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      // apiClient.get returns data directly (not axios response)
      const data = await apiClient.get<NotificationsResponse>('/notifications/me/');
      setNotifications(data.results || []);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      // apiClient.get returns data directly (not axios response)
      const data = await apiClient.get<UnreadCountResponse>('/notifications/me/unread-count/');
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await apiClient.post(`/notifications/me/${id}/read/`);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await apiClient.post('/notifications/me/read-all/');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await apiClient.delete(`/notifications/me/${id}/`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      // Update unread count if deleted notification was unread
      setNotifications(prev => {
        const deletedWasUnread = prev.find(n => n.id === id && !n.is_read);
        if (deletedWasUnread) {
          setUnreadCount(count => Math.max(0, count - 1));
        }
        return prev.filter(n => n.id !== id);
      });
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      await apiClient.post('/notifications/me/clear-all/');
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  // Initial fetch
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Polling every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchUnreadCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refresh,
  };
}

