// src/app/(app)/(notifications)/index.tsx
// Central de notificações in-app

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  IconSettings, IconBell, IconBellOff,
  IconBabyBottle, IconVaccine, IconChecklist, IconUsers,
  IconScale, IconCalendar, IconShoppingCart, IconInfoCircle,
  IconHeart, IconMoon, IconSeeding, IconSchool, IconTrophy,
  IconDeviceMobile, IconBellRinging, IconPill, IconDroplet,
  IconClock, IconSalad, IconYoga, IconBath, IconMoodKid,
  IconCalendarEvent,
} from '@tabler/icons-react-native';
import { useNotifications } from '@/hooks/useNotifications';
import { Notification, NotificationType } from '@/types/differential.types';
import { Colors } from '@/constants/theme';

// ─── Ícone por tipo de notificação ───────────────────────────────

const TYPE_ICONS: Record<NotificationType, React.ReactNode> = {
  // ── Bebê recém-nascido ──────────────────────────────────────
  next_feeding:            <IconBabyBottle   size={18} color={Colors.primary}   />,
  long_sleep_alert:        <IconMoon         size={18} color={Colors.secondary} />,
  diaper_overdue:          <IconSeeding      size={18} color={Colors.secondary} />,
  vaccine_reminder:        <IconVaccine      size={18} color={Colors.secondary} />,
  medication_reminder:     <IconPill         size={18} color="#e85555"          />,
  growth_checkup:          <IconCalendar     size={18} color={Colors.secondary} />,
  bath_reminder:           <IconBath         size={18} color={Colors.secondary} />,
  tummy_time_reminder:     <IconMoodKid      size={18} color={Colors.secondary} />,
  // ── Criança ─────────────────────────────────────────────────
  homework_due:            <IconSchool       size={18} color={Colors.secondary} />,
  school_event:            <IconCalendar     size={18} color={Colors.secondary} />,
  kids_points_milestone:   <IconTrophy       size={18} color={Colors.secondary} />,
  screen_time_limit:       <IconDeviceMobile size={18} color={Colors.secondary} />,
  kids_medication:         <IconPill         size={18} color="#e85555"          />,
  kids_activity_reminder:  <IconSchool       size={18} color={Colors.secondary} />,
  kids_sleep_time:         <IconMoon         size={18} color={Colors.secondary} />,
  kids_meal_time:          <IconSalad        size={18} color={Colors.secondary} />,
  // ── Adolescente ─────────────────────────────────────────────
  teen_curfew_alert:       <IconClock        size={18} color="#e85555"          />,
  teen_sleep_alert:        <IconMoon         size={18} color={Colors.secondary} />,
  teen_screen_limit:       <IconDeviceMobile size={18} color={Colors.secondary} />,
  teen_appointment:        <IconCalendar     size={18} color={Colors.secondary} />,
  teen_exam_reminder:      <IconSchool       size={18} color={Colors.secondary} />,
  // ── Casal ───────────────────────────────────────────────────
  couple_checkin_due:      <IconHeart        size={18} color="#e87a7a"          />,
  appreciation_received:   <IconHeart        size={18} color={Colors.secondary} />,
  mental_load_alert:       <IconScale        size={18} color={Colors.secondary} />,
  partner_task_done:       <IconChecklist    size={18} color={Colors.secondary} />,
  couple_date_reminder:    <IconCalendarEvent size={18} color="#e87a7a"         />,
  // ── Família ─────────────────────────────────────────────────
  task_assigned:           <IconChecklist    size={18} color={Colors.secondary} />,
  task_overdue:            <IconChecklist    size={18} color="#e85555"          />,
  family_invite:           <IconUsers        size={18} color={Colors.secondary} />,
  event_reminder:          <IconCalendar     size={18} color={Colors.secondary} />,
  shopping_added:          <IconShoppingCart size={18} color={Colors.secondary} />,
  shopping_list_ready:     <IconShoppingCart size={18} color={Colors.secondary} />,
  // ── Saúde ───────────────────────────────────────────────────
  parent_self_care:        <IconYoga         size={18} color={Colors.secondary} />,
  hydration_reminder:      <IconDroplet      size={18} color="#5b8dee"          />,
  postnatal_checkup:       <IconCalendar     size={18} color="#e85555"          />,
  system:                  <IconInfoCircle   size={18} color={Colors.muted}     />,
};

// ─── Item de notificação ─────────────────────────────────────────

function NotificationItem({
  notification,
  onPress,
}: {
  notification: Notification;
  onPress: () => void;
}) {
  const icon = TYPE_ICONS[notification.type] ?? <IconInfoCircle size={18} color={Colors.muted} />;
  const isUnread = !notification.read_at;
  const formattedTime = new Date(notification.created_at).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.itemRow, isUnread && styles.itemRowUnread]}
    >
      {/* Ícone */}
      <View style={styles.iconCircle}>
        {icon}
      </View>

      {/* Conteúdo */}
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text
            style={[styles.itemTitle, !isUnread && styles.itemTitleRead]}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          {isUnread && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.itemBody} numberOfLines={2}>
          {notification.body}
        </Text>
        <Text style={styles.itemTime}>{formattedTime}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Tela principal ──────────────────────────────────────────────

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh,
  } = useNotifications();

  return (
    <View style={styles.screen}>
      <View style={{ paddingTop: insets.top }} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notificações</Text>
          {unreadCount > 0 && (
            <Text style={styles.unreadLabel}>
              {unreadCount} não lida{unreadCount !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={markAllAsRead}
              style={styles.markAllBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.markAllText}>Marcar todas</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => router.push('/(app)/(notifications)/preferences')}
            style={styles.settingsBtn}
            activeOpacity={0.7}
            accessibilityLabel="Configurar preferências de notificação"
          >
            <IconSettings size={18} color={Colors.muted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading inicial */}
      {loading && notifications.length === 0 && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}

      {/* Erro */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Lista */}
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={Colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {!loading && notifications.length === 0 && (
          <View style={styles.emptyState}>
            <IconBellOff size={40} color={Colors.border} />
            <Text style={styles.emptyText}>
              Nenhuma notificação por enquanto. Quando houver novidades, você verá aqui.
            </Text>
          </View>
        )}

        {notifications.map(n => (
          <NotificationItem
            key={n.id}
            notification={n}
            onPress={() => {
              if (!n.read_at) markAsRead(n.id);
            }}
          />
        ))}

        {notifications.length > 0 && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {notifications.length} notificação{notifications.length !== 1 ? 'ões' : ''}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontFamily: 'Georgia',
    fontSize: 22,
    color: Colors.text,
  },
  unreadLabel: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markAllBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllText: {
    fontSize: 12,
    color: Colors.muted,
  },
  settingsBtn: {
    backgroundColor: Colors.bgCard,
    borderRadius: 8,
    padding: 8,
  },
  centered: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  errorBox: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  // NotificationItem
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemRowUnread: {
    backgroundColor: Colors.bgCard,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  iconEmoji: {
    fontSize: 18,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
    flex: 1,
  },
  itemTitleRead: {
    color: Colors.muted,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginLeft: 8,
  },
  itemBody: {
    fontSize: 12,
    color: Colors.muted,
    lineHeight: 17,
  },
  itemTime: {
    fontSize: 11,
    color: Colors.border,
    marginTop: 4,
  },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: Colors.border,
  },
});
