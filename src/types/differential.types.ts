// src/types/differential.types.ts
// Fase 6: Carga Mental, Notificações e IA Insights

import { UUID } from './common.types';

// ─── Carga Mental ──────────────────────────────────────────────

/** Tipo de atividade que gera pontos de carga mental */
export type MentalLoadActivityType =
  | 'feeding_breast'
  | 'feeding_bottle'
  | 'diaper'
  | 'bath'
  | 'sleep_monitor'
  | 'medication'
  | 'appointment'
  | 'vaccine'
  | 'task_high'
  | 'task_medium'
  | 'task_low'
  | 'shopping_item';

/** Pontos por tipo de atividade — centraliza o algoritmo */
export const MENTAL_LOAD_POINTS: Record<MentalLoadActivityType, number> = {
  feeding_breast:  3,
  feeding_bottle:  2,
  diaper:          1,
  bath:            2,
  sleep_monitor:   1,
  medication:      3,
  appointment:     5,
  vaccine:         4,
  task_high:       4,
  task_medium:     2,
  task_low:        1,
  shopping_item:   1,
};

/** Uma entrada de carga mental (atividade + responsável + pontos) */
export interface MentalLoadEntry {
  member_id: UUID;
  member_name: string;
  activity_type: MentalLoadActivityType;
  activity_id: UUID;
  points: number;
  recorded_at: string; // ISO 8601
}

/** Resumo de carga mental de um membro em um período */
export interface MemberLoadSummary {
  member_id: UUID;
  member_name: string;
  avatar_url?: string;
  total_points: number;
  percentage: number;           // 0-100
  activity_breakdown: Record<MentalLoadActivityType, number>; // points por tipo
}

/** Resultado completo do cálculo de equilíbrio da família */
export interface FamilyMentalLoadSummary {
  family_id: UUID;
  period_start: string;         // ISO 8601
  period_end: string;           // ISO 8601
  members: MemberLoadSummary[];
  is_balanced: boolean;         // true se diferença ≤ 10%
  imbalance_percentage: number; // diferença entre o maior e menor
  most_active_member_id: UUID;
  least_active_member_id: UUID;
}

/** Série temporal para o gráfico de histórico */
export interface MentalLoadDayEntry {
  date: string;             // YYYY-MM-DD
  member_id: UUID;
  points: number;
}

export type MentalLoadPeriod = 'week' | 'month';

/** Entrada de atividade para o histórico cronológico — UC029 */
export interface ActivityHistoryEntry {
  id: string;
  member_id: UUID;
  title: string;
  category: string;        // 'baby' | task.category
  occurred_at: string;     // ISO 8601 — usado para ordenação
  points: number;
  source: 'baby_record' | 'task';
}

/** Labels legíveis para tipos de registro do bebê */
export const BABY_RECORD_LABELS: Record<string, string> = {
  feeding:     'Alimentação',
  diaper:      'Troca de fralda',
  sleep:       'Sono',
  medication:  'Medicação',
  weight:      'Pesagem',
  height:      'Medição de altura',
  temperature: 'Temperatura',
  note:        'Nota',
};

// ─── Notificações ─────────────────────────────────────────────

export type NotificationType =
  // ─── Bebê recém-nascido ─────────────────────────────────────
  | 'next_feeding'             // muito tempo sem mamar (configurável)
  | 'long_sleep_alert'         // bebê dormindo há muito tempo
  | 'diaper_overdue'           // troca de fralda atrasada
  | 'vaccine_reminder'         // vacina próxima ou vencida
  | 'medication_reminder'      // hora do remédio do bebê
  | 'growth_checkup'           // consulta de crescimento agendada
  | 'bath_reminder'            // lembrete de banho
  | 'tummy_time_reminder'      // hora do barriguinha para baixo
  // ─── Criança (2-12 anos) ────────────────────────────────────
  | 'homework_due'             // tarefa escolar vencendo
  | 'school_event'             // evento escolar amanhã
  | 'kids_points_milestone'    // filho atingiu meta de pontos
  | 'screen_time_limit'        // limite de tela atingido
  | 'kids_medication'          // remédio da criança
  | 'kids_activity_reminder'   // atividade extracurricular hoje
  | 'kids_sleep_time'          // hora de dormir da criança
  | 'kids_meal_time'           // hora da refeição
  // ─── Adolescente ────────────────────────────────────────────
  | 'teen_curfew_alert'        // horário de chegar em casa se aproximando
  | 'teen_sleep_alert'         // adolescente acordado tarde da noite
  | 'teen_screen_limit'        // limite de tela do adolescente
  | 'teen_appointment'         // consulta médica / psicológica do adolescente
  | 'teen_exam_reminder'       // prova ou trabalho escolar amanhã
  // ─── Casal ──────────────────────────────────────────────────
  | 'couple_checkin_due'       // check-in semanal do casal pendente
  | 'appreciation_received'    // parceiro(a) enviou apreciação
  | 'mental_load_alert'        // divisão de tarefas desbalanceada
  | 'partner_task_done'        // parceiro(a) concluiu uma tarefa
  | 'couple_date_reminder'     // lembrete do date night agendado
  // ─── Família ────────────────────────────────────────────────
  | 'task_assigned'            // tarefa atribuída ao usuário
  | 'task_overdue'             // tarefa atrasada sem responsável
  | 'family_invite'            // convite para entrar na família
  | 'event_reminder'           // compromisso na agenda
  | 'shopping_added'           // item adicionado à lista de compras
  | 'shopping_list_ready'      // lista de compras confirmada pelo casal
  // ─── Saúde & bem-estar ──────────────────────────────────────
  | 'parent_self_care'         // lembrete de autocuidado dos pais
  | 'hydration_reminder'       // lembrete de hidratação (útil pós-parto)
  | 'postnatal_checkup'        // consulta pós-natal da mãe
  | 'system';                  // mensagens do sistema

export type NotificationStatus = 'unread' | 'read';

/** Notificação armazenada no banco */
export interface Notification {
  id: UUID;
  user_id: UUID;
  family_id: UUID;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>; // payload extra para deep link
  read_at: string | null;        // null = não lida
  created_at: string;
}

/** Token de push notification de um dispositivo */
export interface PushToken {
  id: UUID;
  user_id: UUID;
  token: string;       // Expo push token
  platform: 'ios' | 'android';
  created_at: string;
}

/** Preferências de notificação por tipo */
export interface NotificationPreference {
  id: UUID;
  user_id: UUID;
  type: NotificationType;
  push_enabled: boolean;
  in_app_enabled: boolean;
  quiet_hours_start?: string; // HH:MM (ex: "22:00")
  quiet_hours_end?: string;   // HH:MM (ex: "07:00")
  interval_minutes?: number;  // intervalo configurável (ex: mamada a cada 180 min)
  updated_at: string;
}

/** Input para atualizar preferência */
export interface UpdateNotificationPreferenceInput {
  push_enabled?: boolean;
  in_app_enabled?: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  interval_minutes?: number;
}

// ─── Configuração de alertas inteligentes ────────────────────

/** Config local para alertas baseados em tempo (agendados no dispositivo) */
export interface AlertConfig {
  type: NotificationType;
  /** Intervalo em minutos entre alertas. 0 = desativado */
  interval_minutes: number;
  enabled: boolean;
}

/** Tipos de alertas que podem ter intervalo configurável */
export const CONFIGURABLE_ALERT_TYPES: NotificationType[] = [
  // Bebê
  'next_feeding',
  'long_sleep_alert',
  'diaper_overdue',
  'medication_reminder',
  'bath_reminder',
  'tummy_time_reminder',
  // Criança
  'kids_medication',
  'kids_sleep_time',
  'kids_meal_time',
  // Adolescente
  'teen_curfew_alert',
  'teen_sleep_alert',
  'teen_screen_limit',
  // Casal
  'couple_checkin_due',
  'couple_date_reminder',
  // Saúde
  'parent_self_care',
  'hydration_reminder',
];

/** Intervalos padrão (em minutos) para cada tipo de alerta */
export const DEFAULT_ALERT_INTERVALS: Partial<Record<NotificationType, number>> = {
  // Bebê
  next_feeding:          180,   // 3h
  long_sleep_alert:      240,   // 4h
  diaper_overdue:        240,   // 4h
  medication_reminder:   480,   // 8h (padrão de 3x por dia)
  bath_reminder:         1440,  // 1x por dia
  tummy_time_reminder:   120,   // 2h
  // Criança
  kids_medication:       480,   // 8h
  kids_sleep_time:       1440,  // diário (horário fixo)
  kids_meal_time:        240,   // 4h
  // Adolescente
  teen_curfew_alert:     30,    // 30 min antes do curfew
  teen_sleep_alert:      1440,  // diário
  teen_screen_limit:     60,    // 1h após limite
  // Casal
  couple_checkin_due:    10080, // 1 semana
  couple_date_reminder:  20160, // 2 semanas
  // Saúde
  parent_self_care:      1440,  // diário
  hydration_reminder:    120,   // 2h
};

/**
 * Categoria de som para cada tipo de notificação.
 * O sistema usa sons diferentes para criar "personalidade" por categoria.
 */
export type NotificationSoundCategory =
  | 'gentle'    // suave — bebê dormindo, autocuidado
  | 'friendly'  // animado — pontos, conquistas, apreciação
  | 'urgent'    // urgente — curfew, medicação, vacina
  | 'default';  // padrão

export const NOTIFICATION_SOUND_CATEGORY: Partial<Record<NotificationType, NotificationSoundCategory>> = {
  // gentle — não assustar bebê dormindo
  next_feeding:          'gentle',
  long_sleep_alert:      'gentle',
  tummy_time_reminder:   'gentle',
  bath_reminder:         'gentle',
  hydration_reminder:    'gentle',
  parent_self_care:      'gentle',
  // urgent — precisa de ação rápida
  medication_reminder:   'urgent',
  kids_medication:       'urgent',
  vaccine_reminder:      'urgent',
  teen_curfew_alert:     'urgent',
  postnatal_checkup:     'urgent',
  teen_appointment:      'urgent',
  task_overdue:          'urgent',
  // friendly — positivo / social
  kids_points_milestone: 'friendly',
  appreciation_received: 'friendly',
  couple_date_reminder:  'friendly',
  partner_task_done:     'friendly',
  shopping_list_ready:   'friendly',
};

// ─── IA Insights ──────────────────────────────────────────────

export type InsightCategory =
  | 'sleep_pattern'
  | 'feeding_pattern'
  | 'mental_load'
  | 'task_overdue'
  | 'milestone'
  | 'routine_suggestion';

export type InsightSeverity = 'info' | 'warning' | 'positive';

/** Um insight gerado automaticamente por análise de padrões */
export interface AIInsight {
  id: string;          // gerado localmente (uuid v4)
  family_id: UUID;
  baby_id?: UUID;
  category: InsightCategory;
  severity: InsightSeverity;
  title: string;
  description: string;
  suggested_action?: string;
  generated_at: string;  // ISO 8601
  data_points?: number;  // quantidade de registros analisados
}

/** Resumo semanal gerado pela IA local */
export interface WeeklySummary {
  family_id: UUID;
  week_start: string;   // YYYY-MM-DD (segunda-feira)
  week_end: string;     // YYYY-MM-DD (domingo)
  total_feedings: number;
  total_diaper_changes: number;
  avg_sleep_hours: number;
  tasks_completed: number;
  tasks_pending: number;
  most_active_member: string;
  insights: AIInsight[];
}
