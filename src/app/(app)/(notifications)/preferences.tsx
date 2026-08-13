// src/app/(app)/(notifications)/preferences.tsx
// Configuração de preferências de notificação (in-app + push)

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  IconChevronLeft,
  IconBabyBottle,
  IconVaccine,
  IconChecklist,
  IconUsers,
  IconScale,
  IconCalendar,
  IconShoppingCart,
  IconHeart,
  IconMoon,
  IconSeeding,
  IconSchool,
  IconTrophy,
  IconDeviceMobile,
  IconBellRinging,
} from '@tabler/icons-react-native';
import { useRouter as _useRouter } from 'expo-router';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationType } from '@/types/differential.types';
import { Colors } from '@/constants/theme';

// ─── Definição de grupos e tipos ─────────────────────────────

interface NotifTypeDef {
  type: NotificationType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface NotifGroup {
  title: string;
  items: NotifTypeDef[];
}

const NOTIFICATION_GROUPS: NotifGroup[] = [
  {
    title: '🍼 Bebê',
    items: [
      {
        type: 'next_feeding',
        label: 'Lembrete de mamada',
        description: 'Avisa quando estiver na hora de alimentar',
        icon: <IconBabyBottle size={18} color={Colors.primary} />,
      },
      {
        type: 'long_sleep_alert',
        label: 'Bebê dormindo há muito tempo',
        description: 'Alerta quando o sono ultrapassa o tempo configurado',
        icon: <IconMoon size={18} color={Colors.secondary} />,
      },
      {
        type: 'diaper_overdue',
        label: 'Hora da troca de fralda',
        description: 'Lembra quando está na hora de trocar',
        icon: <IconSeeding size={18} color={Colors.secondary} />,
      },
      {
        type: 'vaccine_reminder',
        label: 'Vacinas',
        description: 'Alertas sobre vacinas próximas ou vencidas',
        icon: <IconVaccine size={18} color={Colors.secondary} />,
      },
    ],
  },
  {
    title: '💑 Casal',
    items: [
      {
        type: 'couple_checkin_due',
        label: 'Check-in do casal',
        description: 'Lembrete periódico para se conectar com o(a) parceiro(a)',
        icon: <IconHeart size={18} color="#e87a7a" />,
      },
      {
        type: 'appreciation_received',
        label: 'Apreciação recebida',
        description: 'Quando seu(sua) parceiro(a) enviar uma mensagem de carinho',
        icon: <IconHeart size={18} color={Colors.secondary} />,
      },
      {
        type: 'mental_load_alert',
        label: 'Carga mental desbalanceada',
        description: 'Alerta quando a divisão de tarefas estiver desproporcional',
        icon: <IconScale size={18} color={Colors.secondary} />,
      },
      {
        type: 'partner_task_done',
        label: 'Parceiro(a) concluiu tarefa',
        description: 'Notifica quando uma tarefa for concluída pelo parceiro',
        icon: <IconChecklist size={18} color={Colors.secondary} />,
      },
    ],
  },
  {
    title: '👧 Filhos',
    items: [
      {
        type: 'homework_due',
        label: 'Tarefa escolar vencendo',
        description: 'Avisa antes que uma tarefa escolar vença',
        icon: <IconSchool size={18} color={Colors.secondary} />,
      },
      {
        type: 'screen_time_limit',
        label: 'Limite de tela atingido',
        description: 'Quando o filho atingir o limite diário de tela',
        icon: <IconDeviceMobile size={18} color={Colors.secondary} />,
      },
      {
        type: 'school_event',
        label: 'Evento escolar amanhã',
        description: 'Lembretes de eventos e reuniões da escola',
        icon: <IconCalendar size={18} color={Colors.secondary} />,
      },
      {
        type: 'kids_points_milestone',
        label: 'Meta de pontos atingida',
        description: 'Quando um filho atingir uma nova conquista ou meta',
        icon: <IconTrophy size={18} color={Colors.secondary} />,
      },
    ],
  },
  {
    title: '🏠 Família',
    items: [
      {
        type: 'task_assigned',
        label: 'Tarefa atribuída a você',
        description: 'Quando uma tarefa for delegada para você',
        icon: <IconChecklist size={18} color={Colors.secondary} />,
      },
      {
        type: 'family_invite',
        label: 'Convite de família',
        description: 'Convites para participar de uma família',
        icon: <IconUsers size={18} color={Colors.secondary} />,
      },
      {
        type: 'event_reminder',
        label: 'Compromisso na agenda',
        description: 'Lembretes de consultas, vacinas e eventos',
        icon: <IconCalendar size={18} color={Colors.secondary} />,
      },
      {
        type: 'shopping_added',
        label: 'Lista de compras',
        description: 'Quando um item for adicionado à lista',
        icon: <IconShoppingCart size={18} color={Colors.secondary} />,
      },
    ],
  },
];

// ─── Item de preferência ─────────────────────────────────────

function PreferenceItem({
  icon,
  label,
  description,
  type,
  preferences,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  type: NotificationType;
  preferences: ReturnType<typeof useNotifications>['preferences'];
  onToggle: (type: NotificationType, field: 'push_enabled' | 'in_app_enabled', value: boolean) => void;
}) {
  const pref        = preferences.find(p => p.type === type);
  const pushEnabled = pref?.push_enabled ?? true;
  const inAppEnabled = pref?.in_app_enabled ?? true;

  return (
    <View style={styles.prefItem}>
      <View style={styles.prefRow}>
        <View style={styles.prefEmoji}>{icon}</View>
        <View style={styles.prefContent}>
          <Text style={styles.prefLabel}>{label}</Text>
          <Text style={styles.prefDesc}>{description}</Text>
          <View style={styles.switchRow}>
            <View style={styles.switchGroup}>
              <Switch
                value={pushEnabled}
                onValueChange={v => onToggle(type, 'push_enabled', v)}
                trackColor={{ true: Colors.primary, false: Colors.border }}
                thumbColor={Colors.text}
                style={styles.switchScale}
                accessibilityLabel={`Notificação push para ${label}`}
              />
              <Text style={styles.switchLabel}>Push</Text>
            </View>
            <View style={styles.switchGroup}>
              <Switch
                value={inAppEnabled}
                onValueChange={v => onToggle(type, 'in_app_enabled', v)}
                trackColor={{ true: Colors.primary, false: Colors.border }}
                thumbColor={Colors.text}
                style={styles.switchScale}
                accessibilityLabel={`Notificação in-app para ${label}`}
              />
              <Text style={styles.switchLabel}>In-app</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Tela principal ──────────────────────────────────────────

export default function NotificationPreferencesScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { preferences, loading, updatePreference } = useNotifications();

  const handleToggle = async (
    type: NotificationType,
    field: 'push_enabled' | 'in_app_enabled',
    value: boolean
  ) => {
    await updatePreference(type, { [field]: value });
  };

  return (
    <View style={styles.screen}>
      <View style={{ paddingTop: insets.top }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityLabel="Voltar"
        >
          <IconChevronLeft size={22} color={Colors.muted} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Preferências</Text>
          <Text style={styles.headerSub}>Configure suas notificações</Text>
        </View>
      </View>

      {loading && preferences.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Atalho para alertas inteligentes */}
          <TouchableOpacity
            style={styles.smartAlertsBanner}
            onPress={() => router.push('/(app)/(notifications)/smart-alerts')}
            activeOpacity={0.8}
          >
            <IconBellRinging size={18} color={Colors.primary} />
            <View style={styles.smartAlertsText}>
              <Text style={styles.smartAlertsTitle}>Alertas Inteligentes</Text>
              <Text style={styles.smartAlertsDesc}>
                Configure lembretes de mamada, fralda e check-in do casal com horários automáticos
              </Text>
            </View>
            <IconChevronLeft
              size={16}
              color={Colors.muted}
              style={{ transform: [{ rotate: '180deg' }] }}
            />
          </TouchableOpacity>

          {/* Intro */}
          <View style={styles.introBanner}>
            <Text style={styles.introText}>
              Controle quais notificações você quer receber. Alterações são salvas automaticamente.
            </Text>
          </View>

          {/* Grupos */}
          {NOTIFICATION_GROUPS.map(group => (
            <View key={group.title}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              {group.items.map(item => (
                <PreferenceItem
                  key={item.type}
                  icon={item.icon}
                  label={item.label}
                  description={item.description}
                  type={item.type}
                  preferences={preferences}
                  onToggle={handleToggle}
                />
              ))}
            </View>
          ))}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}

// ─── Estilos ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: 'Georgia',
    fontSize: 20,
    color: Colors.text,
  },
  headerSub: {
    fontSize: 11,
    color: Colors.muted,
    marginTop: 1,
  },
  centered: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  smartAlertsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  smartAlertsText: {
    flex: 1,
  },
  smartAlertsTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  smartAlertsDesc: {
    fontSize: 11,
    color: Colors.muted,
    lineHeight: 16,
  },
  introBanner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  introText: {
    fontSize: 12,
    color: Colors.muted,
    lineHeight: 18,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.muted,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  prefItem: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  prefEmoji: {
    fontSize: 22,
    marginTop: 2,
  },
  prefContent: {
    flex: 1,
  },
  prefLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  prefDesc: {
    fontSize: 11,
    color: Colors.muted,
    marginBottom: 12,
    lineHeight: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  switchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchScale: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  switchLabel: {
    fontSize: 12,
    color: Colors.muted,
  },
});
