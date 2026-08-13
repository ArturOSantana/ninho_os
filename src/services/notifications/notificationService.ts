// src/services/notifications/notificationService.ts
// Fase 6 — Notificações in-app e push

import { supabase } from '@/lib/supabase';
import {
  Notification,
  NotificationPreference,
  NotificationType,
  UpdateNotificationPreferenceInput,
} from '@/types/differential.types';
import { UUID } from '@/types/common.types';

/**
 * Notification Service
 * Gerencia notificações in-app e tokens de push do Expo.
 * As notificações push são enviadas via Edge Function do Supabase
 * (não diretamente no cliente para evitar exposição de credenciais).
 */
export const notificationService = {
  /**
   * Listar notificações do usuário (mais recentes primeiro)
   */
  async listNotifications(userId: UUID, limit = 50): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return (data ?? []) as Notification[];
  },

  /**
   * Contar notificações não lidas
   */
  async countUnread(userId: UUID): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null);

    if (error) throw new Error(error.message);
    return count ?? 0;
  },

  /**
   * Marcar notificação como lida
   */
  async markAsRead(notificationId: UUID): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) throw new Error(error.message);
  },

  /**
   * Marcar todas as notificações do usuário como lidas
   */
  async markAllAsRead(userId: UUID): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null);

    if (error) throw new Error(error.message);
  },

  /**
   * Registrar (ou atualizar) token de push do Expo para este dispositivo
   */
  async registerPushToken(
    userId: UUID,
    token: string,
    platform: 'ios' | 'android'
  ): Promise<void> {
    const { error } = await supabase.from('push_tokens').upsert(
      {
        user_id: userId,
        token,
        platform,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,token' }
    );

    if (error) throw new Error(error.message);
  },

  /**
   * Remover token de push (logout ou desativação)
   */
  async removePushToken(userId: UUID, token: string): Promise<void> {
    const { error } = await supabase
      .from('push_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('token', token);

    if (error) throw new Error(error.message);
  },

  /**
   * Buscar preferências de notificação do usuário
   */
  async getPreferences(userId: UUID): Promise<NotificationPreference[]> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return (data ?? []) as NotificationPreference[];
  },

  /**
   * Atualizar preferência de um tipo de notificação
   */
  async updatePreference(
    userId: UUID,
    type: NotificationType,
    updates: UpdateNotificationPreferenceInput
  ): Promise<NotificationPreference> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert(
        {
          user_id: userId,
          type,
          ...updates,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,type' }
      )
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as NotificationPreference;
  },

  /**
   * Criar notificação in-app para um usuário
   * (normalmente chamado por Edge Functions, mas disponível para uso interno)
   */
  async createInAppNotification(
    userId: UUID,
    familyId: UUID,
    type: NotificationType,
    title: string,
    body: string,
    extraData?: Record<string, string>
  ): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        family_id: familyId,
        type,
        title,
        body,
        data: extraData ?? null,
        read_at: null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Notification;
  },

  /**
   * Subscrever notificações em tempo real via Supabase Realtime
   * Retorna a subscription para que o caller possa cancelar depois
   */
  subscribeToNotifications(
    userId: UUID,
    onNew: (notification: Notification) => void
  ) {
    const channelId = `notifications:${userId}:${Math.random().toString(36).substring(2, 9)}`;
    return supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        payload => {
          onNew(payload.new as Notification);
        }
      )
      .subscribe();
  },
};
