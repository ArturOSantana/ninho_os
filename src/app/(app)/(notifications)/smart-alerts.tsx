// src/app/(app)/(notifications)/smart-alerts.tsx
// Tela de configuração de alertas inteligentes baseados em tempo
// Cobre bebê, criança, adolescente, casal e saúde.
// Cada alerta tem: toggle on/off, presets rápidos, campo personalizado.

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  IconChevronLeft,
  IconBabyBottle,
  IconMoon,
  IconSeeding,
  IconPill,
  IconDroplet,
  IconHeart,
  IconBellRinging,
  IconInfoCircle,
  IconCheck,
  IconSchool,
  IconDeviceMobile,
  IconUsers,
  IconClock,
  IconSalad,
  IconYoga,
  IconBath,
  IconMoodKid,
  IconCoffee,
  IconCalendarEvent,
} from '@tabler/icons-react-native';
import { useSmartAlerts } from '@/hooks/useSmartAlerts';
import { NotificationType, AlertConfig, NotificationSoundCategory, NOTIFICATION_SOUND_CATEGORY } from '@/types/differential.types';
import { Colors } from '@/constants/theme';

// ─── Sons por categoria ───────────────────────────────────────

const SOUND_BADGE: Record<NotificationSoundCategory, { label: string; color: string }> = {
  urgent:   { label: 'Urgente 🔴',     color: '#e85555' },
  friendly: { label: 'Comemorativo 🎉', color: '#4caf50' },
  gentle:   { label: 'Suave 🔵',       color: '#5b8dee' },
  default:  { label: 'Padrão',         color: Colors.muted },
};

// ─── Definição de grupos de alertas ──────────────────────────

interface AlertDef {
  type: NotificationType;
  label: string;
  description: string;
  icon: React.ReactNode;
  minInterval: number;
  maxInterval: number;
  presets: { label: string; value: number }[];
}

interface AlertGroup {
  title: string;
  subtitle: string;
  items: AlertDef[];
}

const ALERT_GROUPS: AlertGroup[] = [
  {
    title: '🍼 Bebê recém-nascido',
    subtitle: 'Lembretes para os primeiros meses de vida',
    items: [
      {
        type: 'next_feeding',
        label: 'Hora de amamentar',
        description: 'Avisa com base na última mamada registrada. Som suave para não assustar.',
        icon: <IconBabyBottle size={20} color={Colors.primary} />,
        minInterval: 30, maxInterval: 480,
        presets: [
          { label: '1h', value: 60 },
          { label: '1h30', value: 90 },
          { label: '2h', value: 120 },
          { label: '3h', value: 180 },
          { label: '4h', value: 240 },
        ],
      },
      {
        type: 'long_sleep_alert',
        label: 'Bebê dormindo demais',
        description: 'Alerta quando o bebê ultrapassa o tempo de sono esperado. Importante para RN.',
        icon: <IconMoon size={20} color={Colors.secondary} />,
        minInterval: 60, maxInterval: 600,
        presets: [
          { label: '2h', value: 120 },
          { label: '3h', value: 180 },
          { label: '4h', value: 240 },
          { label: '5h', value: 300 },
        ],
      },
      {
        type: 'diaper_overdue',
        label: 'Hora de trocar a fralda',
        description: 'Calcula com base na última troca registrada.',
        icon: <IconSeeding size={20} color={Colors.secondary} />,
        minInterval: 60, maxInterval: 480,
        presets: [
          { label: '2h', value: 120 },
          { label: '3h', value: 180 },
          { label: '4h', value: 240 },
        ],
      },
      {
        type: 'medication_reminder',
        label: 'Remédio do bebê',
        description: 'Lembrete de medicação com som de alta prioridade.',
        icon: <IconPill size={20} color="#e85555" />,
        minInterval: 120, maxInterval: 1440,
        presets: [
          { label: '6h', value: 360 },
          { label: '8h', value: 480 },
          { label: '12h', value: 720 },
        ],
      },
      {
        type: 'bath_reminder',
        label: 'Banho do bebê',
        description: 'Lembrete diário para o banho relaxante.',
        icon: <IconBath size={20} color={Colors.secondary} />,
        minInterval: 720, maxInterval: 2880,
        presets: [
          { label: '1x/dia', value: 1440 },
          { label: '2x/dia', value: 720 },
        ],
      },
      {
        type: 'tummy_time_reminder',
        label: 'Barriguinha para baixo',
        description: 'Exercício essencial para fortalecer pescoço e músculos do RN.',
        icon: <IconMoodKid size={20} color={Colors.secondary} />,
        minInterval: 60, maxInterval: 480,
        presets: [
          { label: '1h', value: 60 },
          { label: '2h', value: 120 },
          { label: '3h', value: 180 },
        ],
      },
    ],
  },
  {
    title: '👧 Crianças (2–12 anos)',
    subtitle: 'Rotinas e cuidados para crianças em idade escolar',
    items: [
      {
        type: 'kids_medication',
        label: 'Remédio da criança',
        description: 'Lembrete de medicação com som urgente.',
        icon: <IconPill size={20} color="#e85555" />,
        minInterval: 120, maxInterval: 1440,
        presets: [
          { label: '6h', value: 360 },
          { label: '8h', value: 480 },
          { label: '12h', value: 720 },
        ],
      },
      {
        type: 'kids_meal_time',
        label: 'Hora da refeição',
        description: 'Lembrete para preparar a refeição das crianças.',
        icon: <IconSalad size={20} color={Colors.secondary} />,
        minInterval: 120, maxInterval: 720,
        presets: [
          { label: '3h', value: 180 },
          { label: '4h', value: 240 },
          { label: '5h', value: 300 },
        ],
      },
      {
        type: 'kids_sleep_time',
        label: 'Hora de dormir',
        description: 'Inicia a rotina do sono. Avisa antes para dar tempo de escovar os dentes.',
        icon: <IconMoon size={20} color={Colors.secondary} />,
        minInterval: 720, maxInterval: 2880,
        presets: [
          { label: '20h', value: 1200 },
          { label: '21h', value: 1260 },
          { label: '1x/dia', value: 1440 },
        ],
      },
    ],
  },
  {
    title: '🧑 Adolescentes (13+)',
    subtitle: 'Combinados e limites saudáveis para os adolescentes',
    items: [
      {
        type: 'teen_curfew_alert',
        label: 'Horário de chegar em casa',
        description: 'Avisa quando falta pouco para o horário combinado de retorno.',
        icon: <IconClock size={20} color="#e85555" />,
        minInterval: 15, maxInterval: 120,
        presets: [
          { label: '15min', value: 15 },
          { label: '30min', value: 30 },
          { label: '1h',    value: 60 },
        ],
      },
      {
        type: 'teen_sleep_alert',
        label: 'Adolescente acordado tarde',
        description: 'Lembrete noturno para dormir em dia de semana.',
        icon: <IconMoon size={20} color={Colors.secondary} />,
        minInterval: 720, maxInterval: 2880,
        presets: [
          { label: '22h', value: 1320 },
          { label: '23h', value: 1380 },
          { label: '1x/dia', value: 1440 },
        ],
      },
      {
        type: 'teen_screen_limit',
        label: 'Limite de tela',
        description: 'Avisa quando o adolescente ultrapassou o tempo combinado de celular.',
        icon: <IconDeviceMobile size={20} color={Colors.secondary} />,
        minInterval: 30, maxInterval: 240,
        presets: [
          { label: '30min', value: 30 },
          { label: '1h',    value: 60 },
          { label: '2h',    value: 120 },
        ],
      },
    ],
  },
  {
    title: '💑 Casal',
    subtitle: 'Momentos e conexão entre os dois',
    items: [
      {
        type: 'couple_checkin_due',
        label: 'Check-in semanal',
        description: 'Lembrete periódico para conversar sobre como os dois estão se sentindo.',
        icon: <IconHeart size={20} color="#e87a7a" />,
        minInterval: 1440, maxInterval: 20160,
        presets: [
          { label: '3 dias', value: 4320 },
          { label: '1 sem',  value: 10080 },
          { label: '2 sem',  value: 20160 },
        ],
      },
      {
        type: 'couple_date_reminder',
        label: 'Date night',
        description: 'Lembrete para vocês dois terem um momento especial juntos.',
        icon: <IconCalendarEvent size={20} color="#e87a7a" />,
        minInterval: 10080, maxInterval: 40320,
        presets: [
          { label: '1 sem',  value: 10080 },
          { label: '2 sem',  value: 20160 },
          { label: '1 mês',  value: 43200 },
        ],
      },
    ],
  },
  {
    title: '🧘 Saúde & Bem-estar',
    subtitle: 'Cuidado com quem cuida',
    items: [
      {
        type: 'hydration_reminder',
        label: 'Lembrete de hidratação',
        description: 'Especialmente importante durante a amamentação e pós-parto.',
        icon: <IconDroplet size={20} color="#5b8dee" />,
        minInterval: 60, maxInterval: 360,
        presets: [
          { label: '1h', value: 60 },
          { label: '2h', value: 120 },
          { label: '3h', value: 180 },
        ],
      },
      {
        type: 'parent_self_care',
        label: 'Autocuidado dos pais',
        description: 'Um lembrete diário para dedicar ao menos alguns minutos a si mesmo(a).',
        icon: <IconYoga size={20} color={Colors.secondary} />,
        minInterval: 720, maxInterval: 2880,
        presets: [
          { label: '2x/dia', value: 720 },
          { label: '1x/dia', value: 1440 },
        ],
      },
    ],
  },
];

// ─── Componente de item de alerta ─────────────────────────────

function AlertConfigItem({
  def,
  config,
  onToggle,
  onIntervalChange,
}: {
  def: AlertDef;
  config: AlertConfig;
  onToggle: (type: NotificationType, enabled: boolean) => void;
  onIntervalChange: (type: NotificationType, minutes: number) => void;
}) {
  const [inputValue, setInputValue] = useState(
    String(config.interval_minutes >= 60
      ? Math.round(config.interval_minutes / 60)
      : config.interval_minutes)
  );
  const [inputMode, setInputMode] = useState(false);

  const soundCat = NOTIFICATION_SOUND_CATEGORY[def.type] ?? 'default';
  const badge    = SOUND_BADGE[soundCat];

  const hoursDisplay = (mins: number) => {
    if (mins < 60)  return `${mins}min`;
    if (mins % 60 === 0) return `${mins / 60}h`;
    return `${Math.floor(mins / 60)}h${mins % 60}min`;
  };

  const handleCustomInput = useCallback(() => {
    const hours = parseFloat(inputValue.replace(',', '.'));
    if (isNaN(hours) || hours <= 0) {
      Alert.alert('Valor inválido', 'Informe um número válido (ex: 2 ou 2.5)');
      setInputValue(String(Math.round(config.interval_minutes / 60)));
      return;
    }
    const mins = Math.round(hours * 60);
    if (mins < def.minInterval) {
      Alert.alert('Muito curto', `Mínimo: ${hoursDisplay(def.minInterval)}.`);
      return;
    }
    if (mins > def.maxInterval) {
      Alert.alert('Muito longo', `Máximo: ${hoursDisplay(def.maxInterval)}.`);
      return;
    }
    setInputMode(false);
    onIntervalChange(def.type, mins);
  }, [inputValue, config.interval_minutes, def, onIntervalChange]);

  return (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <View style={styles.itemIconWrap}>{def.icon}</View>
        <View style={styles.itemTextWrap}>
          <View style={styles.itemTitleRow}>
            <Text style={styles.itemLabel}>{def.label}</Text>
            <View style={[styles.soundBadge, { borderColor: badge.color }]}>
              <Text style={[styles.soundBadgeText, { color: badge.color }]}>
                {badge.label}
              </Text>
            </View>
          </View>
          <Text style={styles.itemDesc}>{def.description}</Text>
        </View>
        <Switch
          value={config.enabled}
          onValueChange={v => onToggle(def.type, v)}
          trackColor={{ true: Colors.primary, false: Colors.border }}
          thumbColor={Colors.text}
          style={styles.switchScale}
          accessibilityLabel={`Ativar: ${def.label}`}
        />
      </View>

      {config.enabled && (
        <View style={styles.intervalSection}>
          <Text style={styles.intervalLabel}>
            Intervalo: <Text style={styles.intervalValue}>
              {hoursDisplay(config.interval_minutes)}
            </Text>
          </Text>

          <View style={styles.presetsRow}>
            {def.presets.map(p => (
              <TouchableOpacity
                key={p.value}
                style={[
                  styles.presetBtn,
                  config.interval_minutes === p.value && styles.presetBtnActive,
                ]}
                onPress={() => onIntervalChange(def.type, p.value)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.presetText,
                  config.interval_minutes === p.value && styles.presetTextActive,
                ]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.presetBtn, inputMode && styles.presetBtnActive]}
              onPress={() => setInputMode(v => !v)}
              activeOpacity={0.7}
            >
              <Text style={[styles.presetText, inputMode && styles.presetTextActive]}>
                Outro
              </Text>
            </TouchableOpacity>
          </View>

          {inputMode && (
            <View style={styles.customRow}>
              <TextInput
                style={styles.customInput}
                value={inputValue}
                onChangeText={setInputValue}
                keyboardType="decimal-pad"
                placeholder="Ex: 2.5"
                placeholderTextColor={Colors.muted}
                returnKeyType="done"
                onSubmitEditing={handleCustomInput}
                accessibilityLabel="Horas personalizadas"
              />
              <Text style={styles.customUnit}>horas</Text>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleCustomInput}
                activeOpacity={0.8}
                accessibilityLabel="Confirmar"
              >
                <IconCheck size={16} color={Colors.text} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Tela principal ──────────────────────────────────────────

export default function SmartAlertsScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();

  const { configs, permissionGranted, loading, initialize, updateConfig } = useSmartAlerts();

  const handleToggle = useCallback(async (type: NotificationType, nextEnabled: boolean) => {
    if (nextEnabled && !permissionGranted) await initialize();
    await updateConfig(type, { enabled: nextEnabled });
  }, [permissionGranted, initialize, updateConfig]);

  const handleIntervalChange = useCallback(async (type: NotificationType, minutes: number) => {
    await updateConfig(type, { interval_minutes: minutes });
  }, [updateConfig]);

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
          <Text style={styles.headerTitle}>Alertas Inteligentes</Text>
          <Text style={styles.headerSub}>Lembretes baseados no que acontece em casa</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Banner de permissão */}
          {!permissionGranted && (
            <TouchableOpacity
              style={styles.permissionBanner}
              onPress={() => initialize()}
              activeOpacity={0.8}
            >
              <IconBellRinging size={18} color={Colors.secondary} />
              <Text style={styles.permissionText}>
                Toque aqui para permitir notificações e ativar os alertas.
              </Text>
            </TouchableOpacity>
          )}

          {/* Legenda de sons */}
          <View style={styles.soundLegend}>
            <Text style={styles.legendTitle}>Sons por urgência:</Text>
            <View style={styles.legendRow}>
              {(Object.entries(SOUND_BADGE) as [NotificationSoundCategory, typeof SOUND_BADGE[NotificationSoundCategory]][]).map(([, badge]) => (
                <View key={badge.label} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: badge.color }]} />
                  <Text style={styles.legendText}>{badge.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Info */}
          <View style={styles.introBanner}>
            <IconInfoCircle size={13} color={Colors.muted} />
            <Text style={styles.introText}>
              Alertas inteligentes calculam o tempo com base no último registro — sem horário fixo. Reagendam automaticamente ao registrar novas atividades.
            </Text>
          </View>

          {/* Grupos de alertas */}
          {ALERT_GROUPS.map(group => (
            <View key={group.title}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupTitle}>{group.title}</Text>
                <Text style={styles.groupSub}>{group.subtitle}</Text>
              </View>

              {group.items.map(def => {
                const cfg = configs.find(c => c.type === def.type);
                if (!cfg) return null;
                return (
                  <AlertConfigItem
                    key={def.type}
                    def={def}
                    config={cfg}
                    onToggle={handleToggle}
                    onIntervalChange={handleIntervalChange}
                  />
                );
              })}
            </View>
          ))}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

// ─── Estilos ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    fontFamily: 'Georgia',
    fontSize: 20,
    color: Colors.text,
  },
  headerSub: { fontSize: 11, color: Colors.muted, marginTop: 1 },
  centered: { alignItems: 'center', paddingVertical: 48 },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 16,
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  permissionText: { flex: 1, fontSize: 12, color: Colors.secondary, lineHeight: 18 },
  soundLegend: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  legendTitle: { fontSize: 10, color: Colors.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: Colors.muted },
  introBanner: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  introText: { flex: 1, fontSize: 11, color: Colors.muted, lineHeight: 17 },
  groupHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    backgroundColor: Colors.bg,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  groupSub: { fontSize: 11, color: Colors.muted },
  // AlertConfigItem
  item: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  itemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  itemTextWrap: { flex: 1 },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 3,
  },
  itemLabel: { fontSize: 13, fontWeight: '500', color: Colors.text },
  soundBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  soundBadgeText: { fontSize: 9, fontWeight: '600' },
  itemDesc: { fontSize: 11, color: Colors.muted, lineHeight: 16 },
  switchScale: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
    marginTop: 2,
  },
  intervalSection: { marginTop: 12, paddingLeft: 48 },
  intervalLabel: { fontSize: 11, color: Colors.muted, marginBottom: 8 },
  intervalValue: { color: Colors.primary, fontWeight: '600' },
  presetsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  presetBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  presetBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.bgCard,
  },
  presetText: { fontSize: 12, color: Colors.muted },
  presetTextActive: { color: Colors.primary, fontWeight: '500' },
  customRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  customInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.text,
    width: 80,
    backgroundColor: Colors.bgCard,
  },
  customUnit: { fontSize: 12, color: Colors.muted },
  confirmBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 8,
  },
});
