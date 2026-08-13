// src/components/notifications/NotificationItem.tsx
// Item reutilizável para listas de notificações

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  IconBabyBottle, IconVaccine, IconChecklist, IconUsers,
  IconScale, IconCalendar, IconShoppingCart, IconInfoCircle,
  IconHeart, IconMoon, IconSeeding, IconSchool, IconTrophy,
  IconDeviceMobile, IconPill, IconDroplet, IconClock,
  IconSalad, IconYoga, IconBath, IconMoodKid, IconCalendarEvent,
} from '@tabler/icons-react-native';
import { Notification, NotificationType } from '@/types/differential.types';
import { Colors } from '@/constants/theme';

interface NotificationItemProps {
  notification: Notification;
  onPress?: () => void;
}

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

export function NotificationItem({ notification, onPress }: NotificationItemProps) {
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
      className={`px-4 py-4 flex-row items-start gap-3 ${
        isUnread ? 'bg-blue-50' : 'bg-white'
      }`}
    >
      <View className="w-10 h-10 rounded-full bg-white border border-gray-200 items-center justify-center mt-0.5">
        {icon}
      </View>
      <View className="flex-1">
        <View className="flex-row items-center justify-between mb-0.5">
          <Text
            className={`text-sm font-semibold flex-1 ${
              isUnread ? 'text-gray-900' : 'text-gray-600'
            }`}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          {isUnread && <View className="w-2 h-2 rounded-full bg-blue-500 ml-2" />}
        </View>
        <Text className="text-sm text-gray-500" numberOfLines={2}>
          {notification.body}
        </Text>
        <Text className="text-xs text-gray-400 mt-1">{formattedTime}</Text>
      </View>
    </TouchableOpacity>
  );
}
