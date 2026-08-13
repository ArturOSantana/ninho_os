// src/services/notifications/localAlertService.ts
// Serviço de alertas locais agendados via expo-notifications.
// Responsável por: solicitar permissão, agendar, cancelar e listar alertas locais.
//
// NOTA: usa lazy-import para evitar que o módulo expo-notifications seja
// carregado no boot (o SDK 53 lança erro no Expo Go ao registrar push tokens
// automaticamente durante a inicialização do módulo).

import { Platform } from 'react-native';
import {
  NotificationType,
  NotificationSoundCategory,
  NOTIFICATION_SOUND_CATEGORY,
} from '@/types/differential.types';

// ─── Lazy-loader ─────────────────────────────────────────────

type ExpoNotificationsModule = typeof import('expo-notifications');

let _module: ExpoNotificationsModule | null = null;
let _handlerConfigured = false;

async function getNotifications(): Promise<ExpoNotificationsModule> {
  if (!_module) {
    _module = await import('expo-notifications');
  }
  if (!_handlerConfigured) {
    _module.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    _handlerConfigured = true;
  }
  return _module;
}

// ─── Canais Android por categoria de som ─────────────────────
// No Android, canais diferentes permitem sons e vibração distintos por tipo.

const CHANNEL_DEFS: Record<NotificationSoundCategory, {
  id: string;
  name: string;
  vibration: number[];
  importance: 'max' | 'high' | 'default';
}> = {
  urgent: {
    id: 'ninho_urgent',
    name: 'Ninho — Urgente',
    vibration: [0, 500, 200, 500, 200, 500],
    importance: 'max',
  },
  friendly: {
    id: 'ninho_friendly',
    name: 'Ninho — Comemorações',
    vibration: [0, 100, 50, 100],
    importance: 'high',
  },
  gentle: {
    id: 'ninho_gentle',
    name: 'Ninho — Suave',
    vibration: [0, 200],
    importance: 'default',
  },
  default: {
    id: 'ninho_alerts',
    name: 'Alertas do Ninho',
    vibration: [0, 250, 250, 250],
    importance: 'high',
  },
};

/** Prefixo usado para identificar alertas agendados pelo Ninho */
export const ALERT_ID_PREFIX = 'ninho_alert_';

/** Retorna a categoria de som de um tipo, com fallback 'default' */
function soundCategory(type: NotificationType): NotificationSoundCategory {
  return NOTIFICATION_SOUND_CATEGORY[type] ?? 'default';
}

/** Cria todos os canais Android (idempotente) */
async function ensureAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const Notifications = await getNotifications();
  for (const ch of Object.values(CHANNEL_DEFS)) {
    const importance = ch.importance === 'max'
      ? Notifications.AndroidImportance.MAX
      : ch.importance === 'high'
        ? Notifications.AndroidImportance.HIGH
        : Notifications.AndroidImportance.DEFAULT;

    await Notifications.setNotificationChannelAsync(ch.id, {
      name: ch.name,
      importance,
      vibrationPattern: ch.vibration,
      sound: 'default',
      enableLights: true,
      lightColor: '#e8720c',
    });
  }
}

/** Retorna o channelId correto para um tipo no Android */
function channelId(type: NotificationType): string {
  return CHANNEL_DEFS[soundCategory(type)].id;
}

// ─── Permissões ───────────────────────────────────────────────

/**
 * Solicita permissão para enviar notificações.
 * Retorna true se concedida, false caso contrário.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  await ensureAndroidChannels();
  const Notifications = await getNotifications();
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ─── Agendamento ─────────────────────────────────────────────

export interface ScheduleAlertOptions {
  type: NotificationType;
  title: string;
  body: string;
  /** Intervalo em minutos até o próximo disparo */
  intervalMinutes: number;
  data?: Record<string, string>;
}

/**
 * Agenda (ou reagenda) um alerta recorrente local.
 * Aplica automaticamente o canal e som correto para o tipo.
 */
export async function scheduleRecurringAlert(opts: ScheduleAlertOptions): Promise<string> {
  await cancelAlert(opts.type);
  await ensureAndroidChannels();
  const Notifications = await getNotifications();

  const identifier = await Notifications.scheduleNotificationAsync({
    identifier: `${ALERT_ID_PREFIX}${opts.type}`,
    content: {
      title: opts.title,
      body: opts.body,
      data: { type: opts.type, ...(opts.data ?? {}) },
      sound: 'default',
      ...(Platform.OS === 'android' && { channelId: channelId(opts.type) }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: opts.intervalMinutes * 60,
      repeats: true,
    },
  });

  return identifier;
}

/**
 * Agenda um alerta único (dispara uma vez após `delayMinutes`).
 */
export async function scheduleOneTimeAlert(opts: {
  type: NotificationType;
  title: string;
  body: string;
  delayMinutes: number;
  data?: Record<string, string>;
}): Promise<string> {
  await cancelAlert(opts.type);
  await ensureAndroidChannels();
  const Notifications = await getNotifications();

  const identifier = await Notifications.scheduleNotificationAsync({
    identifier: `${ALERT_ID_PREFIX}${opts.type}`,
    content: {
      title: opts.title,
      body: opts.body,
      data: { type: opts.type, ...(opts.data ?? {}) },
      sound: 'default',
      ...(Platform.OS === 'android' && { channelId: channelId(opts.type) }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: opts.delayMinutes * 60,
      repeats: false,
    },
  });

  return identifier;
}

// ─── Cancelamento ─────────────────────────────────────────────

export async function cancelAlert(type: NotificationType): Promise<void> {
  const Notifications = await getNotifications();
  await Notifications.cancelScheduledNotificationAsync(`${ALERT_ID_PREFIX}${type}`);
}

export async function cancelAllAlerts(): Promise<void> {
  const Notifications = await getNotifications();
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const ninhoAlerts = scheduled.filter(n => n.identifier.startsWith(ALERT_ID_PREFIX));
  await Promise.all(
    ninhoAlerts.map(n => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

// ─── Consulta ─────────────────────────────────────────────────

export async function getScheduledAlertTypes(): Promise<NotificationType[]> {
  const Notifications = await getNotifications();
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled
    .filter(n => n.identifier.startsWith(ALERT_ID_PREFIX))
    .map(n => n.identifier.replace(ALERT_ID_PREFIX, '') as NotificationType);
}

export async function isAlertScheduled(type: NotificationType): Promise<boolean> {
  const types = await getScheduledAlertTypes();
  return types.includes(type);
}

// ─── Helpers por categoria ───────────────────────────────────
// Cada helper usa a mensagem certa, emoji e canal de som correto.

// ── Bebê ──────────────────────────────────────────────────────

export async function scheduleNextFeedingAlert(
  intervalMinutes: number, babyName?: string
): Promise<void> {
  const name = babyName ?? 'o bebê';
  const msgs = [
    `${name} deve estar com fominha! Já faz ${fmt(intervalMinutes)} desde a última mamada.`,
    `Hora da mamada de ${name} — o corpinho precisa de energia. 🤍`,
    `Já faz ${fmt(intervalMinutes)} desde a última vez que ${name} mamou. Tudo bem?`,
  ];
  await scheduleRecurringAlert({
    type: 'next_feeding',
    title: '🍼 Hora de amamentar',
    body: msgs[Math.floor(Math.random() * msgs.length)],
    intervalMinutes,
  });
}

export async function scheduleLongSleepAlert(
  intervalMinutes: number, babyName?: string
): Promise<void> {
  const name = babyName ?? 'o bebê';
  const msgs = [
    `${name} está dormindo há mais de ${fmt(intervalMinutes)}. Vale conferir! 😴`,
    `Soninho longo de ${name}! Tudo bem? Às vezes acordar para mamar é importante.`,
    `${fmt(intervalMinutes)} de sono para ${name}. Que descansinho! Mas dá uma espiada lá. 💙`,
  ];
  await scheduleRecurringAlert({
    type: 'long_sleep_alert',
    title: '😴 Bebê dormindo há muito tempo',
    body: msgs[Math.floor(Math.random() * msgs.length)],
    intervalMinutes,
  });
}

export async function scheduleDiaperOverdueAlert(
  intervalMinutes: number, babyName?: string
): Promise<void> {
  const name = babyName ?? 'o bebê';
  const msgs = [
    `Já faz ${fmt(intervalMinutes)} desde a última troca de ${name}. Hora de checar! 🧷`,
    `${name} pode precisar de uma troca — já passou ${fmt(intervalMinutes)}. 😄`,
    `Lembrete de fraldinha para ${name}! ${fmt(intervalMinutes)} desde a última troca.`,
  ];
  await scheduleRecurringAlert({
    type: 'diaper_overdue',
    title: '🧷 Hora de trocar a fralda',
    body: msgs[Math.floor(Math.random() * msgs.length)],
    intervalMinutes,
  });
}

export async function scheduleMedicationReminder(
  intervalMinutes: number, babyName?: string, medicationName?: string
): Promise<void> {
  const name = babyName ?? 'o bebê';
  const med  = medicationName ? `"${medicationName}"` : 'o remédio';
  const msgs = [
    `Está na hora de dar ${med} para ${name}. Não esqueça! 💊`,
    `Hora da medicação de ${name}: ${med}. Saúde em dia! 💙`,
    `Lembrete: ${med} para ${name} agora.`,
  ];
  await scheduleRecurringAlert({
    type: 'medication_reminder',
    title: '💊 Hora do remédio',
    body: msgs[Math.floor(Math.random() * msgs.length)],
    intervalMinutes,
  });
}

export async function scheduleBathReminder(
  intervalMinutes: number, babyName?: string
): Promise<void> {
  const name = babyName ?? 'o bebê';
  const msgs = [
    `Que tal um banho relaxante em ${name}? Faz bem para o corpinho e acalma! 🛁`,
    `Hora do banho de ${name}! Aquela água quentinha vai deixar tudo mais calmo. 🚿`,
    `Banho de ${name} na fila! Um ritual que todo bebê ama. 🛁`,
  ];
  await scheduleRecurringAlert({
    type: 'bath_reminder',
    title: '🛁 Hora do banho',
    body: msgs[Math.floor(Math.random() * msgs.length)],
    intervalMinutes,
  });
}

export async function scheduleTummyTimeReminder(
  intervalMinutes: number, babyName?: string
): Promise<void> {
  const name = babyName ?? 'o bebê';
  const msgs = [
    `Coloque ${name} de barriguinha para baixo por alguns minutinhos — faz bem para o pescoço! 🤸`,
    `Tummy time de ${name}! Aquele exercício que parece simples mas é super importante. 💪`,
    `${name} precisa de uns minutinhos de barriga para baixo. Supervise e aproveite para interagir! 😍`,
  ];
  await scheduleRecurringAlert({
    type: 'tummy_time_reminder',
    title: '🤸 Barriguinha para baixo',
    body: msgs[Math.floor(Math.random() * msgs.length)],
    intervalMinutes,
  });
}

// ── Criança ───────────────────────────────────────────────────

export async function scheduleKidsMedicationAlert(
  intervalMinutes: number, kidName?: string, medicationName?: string
): Promise<void> {
  const name = kidName ?? 'a criança';
  const med  = medicationName ? `"${medicationName}"` : 'o remédio';
  const msgs = [
    `Não esquece: ${med} para ${name} agora! 💊`,
    `Hora da medicação de ${name}: ${med}. Saúde em primeiro lugar! 💙`,
    `${med} para ${name} — já está na hora!`,
  ];
  await scheduleRecurringAlert({
    type: 'kids_medication',
    title: '💊 Remédio da criança',
    body: msgs[Math.floor(Math.random() * msgs.length)],
    intervalMinutes,
  });
}

export async function scheduleKidsSleepAlert(
  intervalMinutes: number, kidName?: string
): Promise<void> {
  const name = kidName ?? 'os filhos';
  const msgs = [
    `Está quase na hora de ${name} ir dormir. Hora de começar a rotina: banho, escova, história! 🌙`,
    `${name} precisa de descanso! Comece a desacelerar — apaga a TV e acalma o ritmo. 💤`,
    `Hora de dormir se aproximando para ${name}. Uma boa noite de sono faz toda a diferença! 🌙`,
  ];
  await scheduleRecurringAlert({
    type: 'kids_sleep_time',
    title: '🌙 Hora de dormir',
    body: msgs[Math.floor(Math.random() * msgs.length)],
    intervalMinutes,
  });
}

export async function scheduleKidsMealAlert(
  intervalMinutes: number, kidName?: string
): Promise<void> {
  const name = kidName ?? 'os filhos';
  const msgs = [
    `Está na hora de preparar a refeição de ${name}. O corpinho precisa de combustível! 🍽️`,
    `${name} deve estar com fome — hora de comer! O que vai ser hoje? 😋`,
    `Refeição de ${name} chegando! Aproveite para tornar o momento agradável. 🥗`,
  ];
  await scheduleRecurringAlert({
    type: 'kids_meal_time',
    title: '🍽️ Hora da refeição',
    body: msgs[Math.floor(Math.random() * msgs.length)],
    intervalMinutes,
  });
}

// ── Adolescente ───────────────────────────────────────────────

export async function scheduleTeenCurfewAlert(
  intervalMinutes: number, teenName?: string
): Promise<void> {
  const name = teenName ?? 'o adolescente';
  const msgs = [
    `${name} precisa chegar em casa em ${fmt(intervalMinutes)}. Já mandou mensagem? ⏰`,
    `Faltam ${fmt(intervalMinutes)} para ${name} chegar. Envie um lembrete carinhoso! 📱`,
    `Atenção: horário de ${name} chegando em ${fmt(intervalMinutes)}. Tudo certo? ⏰`,
  ];
  await scheduleRecurringAlert({
    type: 'teen_curfew_alert',
    title: '⏰ Horário de chegar em casa',
    body: msgs[Math.floor(Math.random() * msgs.length)],
    intervalMinutes,
  });
}

export async function scheduleTeenSleepAlert(
  intervalMinutes: number, teenName?: string
): Promise<void> {
  const name = teenName ?? 'o adolescente';
  const msgs = [
    `${name} ainda está acordado(a). Uma boa noite começa agora. 🌙`,
    `Hora de descansar! ${name}, amanhã precisa de energia. 💤`,
    `Já passou da hora — ${name} merece uma boa noite de sono. 🌙`,
  ];
  await scheduleRecurringAlert({
    type: 'teen_sleep_alert',
    title: '🌙 Hora de descansar',
    body: msgs[Math.floor(Math.random() * msgs.length)],
    intervalMinutes,
  });
}

export async function scheduleTeenScreenLimitAlert(
  intervalMinutes: number, teenName?: string
): Promise<void> {
  const name = teenName ?? 'o adolescente';
  const msgs = [
    `${name} ultrapassou o limite de tela combinado. Que tal uma pausa? 📱`,
    `Celular de lado por hoje! ${name} chegou no limite — hora de desconectar. 🙂`,
    `Hora de conversar sobre o tempo de tela com ${name}. Com calma e diálogo! 💬`,
  ];
  await scheduleRecurringAlert({
    type: 'teen_screen_limit',
    title: '📱 Limite de tela',
    body: msgs[Math.floor(Math.random() * msgs.length)],
    intervalMinutes,
  });
}

// ── Casal ─────────────────────────────────────────────────────

export async function scheduleCoupleCheckinAlert(
  intervalMinutes: number
): Promise<void> {
  const msgs = [
    'Que tal 5 minutinhos só de vocês dois hoje? Um check-in rápido faz toda a diferença. 💑',
    'Como você está se sentindo? Reserve um momento para conversar com seu(sua) parceiro(a). 🤍',
    'Semana corrida? Mesmo assim, um abraço e uma conversa rápida renovam tudo. 💑',
  ];
  await scheduleRecurringAlert({
    type: 'couple_checkin_due',
    title: '💑 Check-in do casal',
    body: msgs[Math.floor(Math.random() * msgs.length)],
    intervalMinutes,
  });
}

export async function CoupleDateReminderAlert(
  intervalMinutes: number
): Promise<void> {
  const msgs = [
    'Vocês programaram um momento especial juntos. Não deixem escapar! 🌹',
    'Date night chegando! Uma noite só para vocês dois — já planejaram o que vai fazer? 🥂',
    'Lembrete de amor: vocês merecem esse tempo juntos. Aproveitem! 💛',
  ];
  await scheduleRecurringAlert({
    type: 'couple_date_reminder',
    title: '🌹 Date night',
    body: msgs[Math.floor(Math.random() * msgs.length)],
    intervalMinutes,
  });
}

// ── Saúde / Bem-estar ─────────────────────────────────────────

export async function scheduleParentSelfCareAlert(
  intervalMinutes: number
): Promise<void> {
  const msgs = [
    'Cuidar de você é tão importante quanto cuidar da família. Reserve um tempinho hoje. 🧘',
    'Você não consegue cuidar de ninguém estando no limite. Respira, descansa um pouquinho. 💙',
    'Autocuidado não é egoísmo — é necessidade. O que você vai fazer por você hoje? 🌿',
  ];
  await scheduleRecurringAlert({
    type: 'parent_self_care',
    title: '🧘 Seu momento',
    body: msgs[Math.floor(Math.random() * msgs.length)],
    intervalMinutes,
  });
}

export async function scheduleHydrationAlert(
  intervalMinutes: number
): Promise<void> {
  const msgs = [
    'Beba água agora! Especialmente importante durante a amamentação. 💧',
    'Hidratação em dia! Um copo de água agora faz bem para você e para o bebê. 💙',
    'Para tudo por um segundo e bebe água. Seu corpo agradece! 💧',
  ];
  await scheduleRecurringAlert({
    type: 'hydration_reminder',
    title: '💧 Hora de se hidratar',
    body: msgs[Math.floor(Math.random() * msgs.length)],
    intervalMinutes,
  });
}

// ─── Utilitários ──────────────────────────────────────────────

function fmt(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h${m}min`;
}

/** @deprecated use fmt() */
export function formatInterval(minutes: number): string {
  return fmt(minutes);
}
