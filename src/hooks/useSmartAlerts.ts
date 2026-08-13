// src/hooks/useSmartAlerts.ts
// Hook para gerenciar alertas inteligentes baseados em tempo real.
// Monitora registros do bebê, crianças e adolescentes e agenda notificações
// locais automáticas com intervalo configurável pelo usuário.

import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  requestNotificationPermission,
  scheduleRecurringAlert,
  scheduleNextFeedingAlert,
  scheduleLongSleepAlert,
  scheduleDiaperOverdueAlert,
  scheduleMedicationReminder,
  scheduleBathReminder,
  scheduleTummyTimeReminder,
  scheduleKidsMedicationAlert,
  scheduleKidsSleepAlert,
  scheduleKidsMealAlert,
  scheduleTeenCurfewAlert,
  scheduleTeenSleepAlert,
  scheduleTeenScreenLimitAlert,
  scheduleCoupleCheckinAlert,
  CoupleDateReminderAlert,
  scheduleParentSelfCareAlert,
  scheduleHydrationAlert,
  cancelAlert,
  cancelAllAlerts,
  getScheduledAlertTypes,
} from '@/services/notifications/localAlertService';
import {
  NotificationType,
  AlertConfig,
  DEFAULT_ALERT_INTERVALS,
  CONFIGURABLE_ALERT_TYPES,
} from '@/types/differential.types';
import { getLastBabyRecord } from '@/services/api';

// ─── Storage keys ─────────────────────────────────────────────

const STORAGE_KEY_CONFIGS  = 'ninho:smart_alert_configs_v2';
const STORAGE_KEY_BABY_ID  = 'ninho:smart_alert_baby_id';

// ─── Tipos ────────────────────────────────────────────────────

interface UseSmartAlertsState {
  configs: AlertConfig[];
  permissionGranted: boolean;
  scheduledTypes: NotificationType[];
  loading: boolean;
}

interface UseSmartAlertsActions {
  initialize: (opts?: InitOptions) => Promise<void>;
  updateConfig: (type: NotificationType, updates: Partial<AlertConfig>) => Promise<void>;
  rescheduleAll: (opts?: InitOptions) => Promise<void>;
  cancelAll: () => Promise<void>;
  getConfig: (type: NotificationType) => AlertConfig | undefined;
}

export interface InitOptions {
  babyId?:    string;
  babyName?:  string;
  kidName?:   string;
  teenName?:  string;
}

export type UseSmartAlertsResult = UseSmartAlertsState & UseSmartAlertsActions;

// ─── Defaults ─────────────────────────────────────────────────

function buildDefaultConfigs(): AlertConfig[] {
  return CONFIGURABLE_ALERT_TYPES.map(type => ({
    type,
    interval_minutes: DEFAULT_ALERT_INTERVALS[type] ?? 180,
    // Apenas mamada e hidratação ativas por padrão
    enabled: type === 'next_feeding' || type === 'hydration_reminder',
  }));
}

// ─── Hook ─────────────────────────────────────────────────────

export function useSmartAlerts(): UseSmartAlertsResult {
  const [configs, setConfigs]              = useState<AlertConfig[]>(buildDefaultConfigs);
  const [permissionGranted, setPermission]  = useState(false);
  const [scheduledTypes, setScheduled]     = useState<NotificationType[]>([]);
  const [loading, setLoading]              = useState(false);

  const optsRef = useRef<InitOptions>({});

  // ── Persistência ─────────────────────────────────────────

  const loadConfigs = useCallback(async (): Promise<AlertConfig[]> => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_CONFIGS);
      if (raw) {
        const parsed: AlertConfig[] = JSON.parse(raw);
        return buildDefaultConfigs().map(def => {
          const saved = parsed.find(p => p.type === def.type);
          return saved ?? def;
        });
      }
    } catch { /* usa padrão */ }
    return buildDefaultConfigs();
  }, []);

  const saveConfigs = useCallback(async (next: AlertConfig[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_CONFIGS, JSON.stringify(next));
    } catch { /* ignora */ }
  }, []);

  // ── Agendamento inteligente ──────────────────────────────

  async function minutesRemaining(
    babyId: string, recordType: string, interval: number
  ): Promise<number> {
    const last = await getLastBabyRecord(babyId, recordType);
    if (!last?.started_at) return interval;
    const elapsed = (Date.now() - new Date(last.started_at).getTime()) / 60000;
    const rem = interval - elapsed;
    return rem > 1 ? Math.round(rem) : 1;
  }

  const scheduleActiveAlerts = useCallback(async (
    activeConfigs: AlertConfig[],
    opts: InitOptions
  ) => {
    const { babyId, babyName, kidName, teenName } = opts;

    for (const cfg of activeConfigs) {
      if (!cfg.enabled || cfg.interval_minutes <= 0) {
        await cancelAlert(cfg.type);
        continue;
      }
      const mins = cfg.interval_minutes;

      try {
        switch (cfg.type) {
          // ── Bebê ──────────────────────────────────────────
          case 'next_feeding': {
            const delay = babyId
              ? await minutesRemaining(babyId, 'feeding', mins) : mins;
            await scheduleNextFeedingAlert(delay, babyName);
            break;
          }
          case 'long_sleep_alert': {
            const delay = babyId
              ? await minutesRemaining(babyId, 'sleep', mins) : mins;
            await scheduleLongSleepAlert(delay, babyName);
            break;
          }
          case 'diaper_overdue': {
            const delay = babyId
              ? await minutesRemaining(babyId, 'diaper', mins) : mins;
            await scheduleDiaperOverdueAlert(delay, babyName);
            break;
          }
          case 'medication_reminder':
            await scheduleMedicationReminder(mins, babyName);
            break;
          case 'bath_reminder':
            await scheduleBathReminder(mins, babyName);
            break;
          case 'tummy_time_reminder':
            await scheduleTummyTimeReminder(mins, babyName);
            break;

          // ── Criança ──────────────────────────────────────
          case 'kids_medication':
            await scheduleKidsMedicationAlert(mins, kidName);
            break;
          case 'kids_sleep_time':
            await scheduleKidsSleepAlert(mins, kidName);
            break;
          case 'kids_meal_time':
            await scheduleKidsMealAlert(mins, kidName);
            break;

          // ── Adolescente ───────────────────────────────────
          case 'teen_curfew_alert':
            await scheduleTeenCurfewAlert(mins, teenName);
            break;
          case 'teen_sleep_alert':
            await scheduleTeenSleepAlert(mins, teenName);
            break;
          case 'teen_screen_limit':
            await scheduleTeenScreenLimitAlert(mins, teenName);
            break;

          // ── Casal ─────────────────────────────────────────
          case 'couple_checkin_due':
            await scheduleCoupleCheckinAlert(mins);
            break;
          case 'couple_date_reminder':
            await CoupleDateReminderAlert(mins);
            break;

          // ── Saúde ─────────────────────────────────────────
          case 'parent_self_care':
            await scheduleParentSelfCareAlert(mins);
            break;
          case 'hydration_reminder':
            await scheduleHydrationAlert(mins);
            break;

          default:
            break;
        }
      } catch { /* ignora erro individual */ }
    }
  }, []);

  // ── Ações públicas ───────────────────────────────────────

  const initialize = useCallback(async (opts: InitOptions = {}) => {
    setLoading(true);
    try {
      optsRef.current = { ...optsRef.current, ...opts };
      if (opts.babyId) await AsyncStorage.setItem(STORAGE_KEY_BABY_ID, opts.babyId);

      const granted = await requestNotificationPermission();
      setPermission(granted);
      if (!granted) return;

      const loaded = await loadConfigs();
      setConfigs(loaded);
      await scheduleActiveAlerts(loaded, optsRef.current);

      const scheduled = await getScheduledAlertTypes();
      setScheduled(scheduled);
    } finally {
      setLoading(false);
    }
  }, [loadConfigs, scheduleActiveAlerts]);

  const updateConfig = useCallback(async (
    type: NotificationType, updates: Partial<AlertConfig>
  ) => {
    setConfigs(prev => {
      const next = prev.map(c => c.type === type ? { ...c, ...updates } : c);
      (async () => {
        await saveConfigs(next);
        await scheduleActiveAlerts(next, optsRef.current);
        setScheduled(await getScheduledAlertTypes());
      })();
      return next;
    });
  }, [saveConfigs, scheduleActiveAlerts]);

  const rescheduleAll = useCallback(async (opts: InitOptions = {}) => {
    optsRef.current = { ...optsRef.current, ...opts };
    await scheduleActiveAlerts(configs, optsRef.current);
    setScheduled(await getScheduledAlertTypes());
  }, [configs, scheduleActiveAlerts]);

  const cancelAll = useCallback(async () => {
    await cancelAllAlerts();
    setScheduled([]);
  }, []);

  const getConfig = useCallback((type: NotificationType) =>
    configs.find(c => c.type === type),
  [configs]);

  // ── Carregamento inicial ──────────────────────────────────

  useEffect(() => {
    (async () => {
      const loaded = await loadConfigs();
      setConfigs(loaded);
      const scheduled = await getScheduledAlertTypes();
      setScheduled(scheduled);

      // Restaura babyId salvo
      const savedBabyId = await AsyncStorage.getItem(STORAGE_KEY_BABY_ID);
      if (savedBabyId) optsRef.current = { ...optsRef.current, babyId: savedBabyId };
    })();
  }, [loadConfigs]);

  return {
    configs,
    permissionGranted,
    scheduledTypes,
    loading,
    initialize,
    updateConfig,
    rescheduleAll,
    cancelAll,
    getConfig,
  };
}
