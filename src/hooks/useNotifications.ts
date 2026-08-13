// src/hooks/useNotifications.ts
// Fase 6 — Notificações in-app e push

import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationService } from '@/services/notifications/notificationService';
import { Notification, NotificationPreference, NotificationType, UpdateNotificationPreferenceInput } from '@/types/differential.types';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyContext';

interface UseNotificationsState {
  notifications: Notification[];
  preferences: NotificationPreference[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

interface UseNotificationsActions {
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  updatePreference: (type: NotificationType, updates: UpdateNotificationPreferenceInput) => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

export type UseNotificationsResult = UseNotificationsState & UseNotificationsActions;

export function useNotifications(): UseNotificationsResult {
  const { user } = useAuth();
  const { family } = useFamily();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Referência da subscription Realtime para cancelar no unmount
  const subscriptionRef = useRef<ReturnType<typeof notificationService.subscribeToNotifications> | null>(null);

  const loadData = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [notifs, prefs, count] = await Promise.all([
        notificationService.listNotifications(userId),
        notificationService.getPreferences(userId),
        notificationService.countUnread(userId),
      ]);
      setNotifications(notifs);
      setPreferences(prefs);
      setUnreadCount(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  }, []);

  // Carrega dados iniciais e subscreve Realtime
  useEffect(() => {
    if (!user?.id) return;

    loadData(user.id);

    // Realtime: quando chegar nova notificação, adiciona ao topo da lista
    subscriptionRef.current = notificationService.subscribeToNotifications(
      user.id,
      (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    );

    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  }, [user?.id, loadData]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao marcar como lida');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    try {
      await notificationService.markAllAsRead(user.id);
      const readAt = new Date().toISOString();
      setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? readAt })));
      setUnreadCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao marcar todas como lidas');
    }
  }, [user?.id]);

  const updatePreference = useCallback(
    async (type: NotificationType, updates: UpdateNotificationPreferenceInput) => {
      if (!user?.id) return;
      try {
        const updated = await notificationService.updatePreference(user.id, type, updates);
        setPreferences(prev =>
          prev.some(p => p.type === type)
            ? prev.map(p => (p.type === type ? updated : p))
            : [...prev, updated]
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao atualizar preferência');
      }
    },
    [user?.id]
  );

  const refresh = useCallback(async () => {
    if (user?.id) await loadData(user.id);
  }, [user?.id, loadData]);

  const clearError = useCallback(() => setError(null), []);

  return {
    notifications,
    preferences,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    updatePreference,
    refresh,
    clearError,
  };
}
