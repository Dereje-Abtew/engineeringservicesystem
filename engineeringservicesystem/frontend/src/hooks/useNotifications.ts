import { useEffect, useState, useRef } from 'react';
import apiClient from '@/utils/api';
import { useAuthStore } from '@/store/store';

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  targetRoles: string[];
  recommendedUserIds: string[];
  createdAt: string;
  isRead: boolean;
  requestId?: number;
  branchId?: string;
}

export function useNotifications(pollIntervalMs = 15000) {
  const { user, token } = useAuthStore();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<number | null>(null);

  const fetchNotifications = async () => {
    // If not authenticated, avoid calling the API (prevents 401 console errors)
    const currentToken = useAuthStore.getState().token;
    const currentUser = useAuthStore.getState().user;
    if (!currentUser || !currentToken) {
      setItems([]);
      return;
    }

    try {
      setLoading(true);
      const res = await apiClient.get<NotificationItem[]>('/Notifications', { silent: true });
      // Server already filters by role/recommended, but double-check on client
      const filtered = (res || []).filter(n => {
        if (!currentUser) return false;
        const hasRole = (n.targetRoles || []).some(r => r?.toLowerCase() === (currentUser.role || '').toLowerCase());
        const recommended = (n.recommendedUserIds || []).includes(currentUser.id);
        return hasRole || recommended;
      });
      setItems(filtered);
    } catch (e) {
      // silent fail — don't spam user
      console.error('Failed to fetch notifications', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentToken = useAuthStore.getState().token;
    const currentUser = useAuthStore.getState().user;
    if (!currentUser || !currentToken) {
      setItems([]);
      return;
    }

    // initial fetch
    fetchNotifications();
    // set interval
    timerRef.current = window.setInterval(() => {
      fetchNotifications();
    }, pollIntervalMs) as unknown as number;

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [user?.id, user?.role, token]);

  const markAsRead = async (id: number) => {
    try {
      await apiClient.post(`/Notifications/${id}/mark-read`, {}, { silent: true } as any);
      setItems(prev => prev.map(i => i.id === id ? { ...i, isRead: true } : i));
    } catch (e) {
      console.error('Failed to mark notification read', e);
    }
  };

  const unreadCount = items.filter(i => !i.isRead).length;

  return { items, loading, fetchNotifications, markAsRead, unreadCount };
}
