// src/types/kids.types.ts
// Módulo Filhos V2 — UC035–040

import { UUID } from './common.types';

// ─── UC035: Tarefas com pontos (reutiliza `tasks`) ────────────
// Tarefas de crianças são tasks com assigned_to = profile.id (role='child').
// Nenhum tipo novo necessário — apenas filtro por assigned_to.

/** Resumo de pontos de uma criança */
export interface KidPointsSummary {
  child_id: UUID;
  child_name: string;
  avatar_url?: string;
  total_points: number;    // pontos acumulados (tarefas concluídas)
  pending_tasks: number;
  completed_tasks: number;
}

// ─── UC036: Mesada ────────────────────────────────────────────
// Calculada a partir dos pontos. 1 ponto = R$ 0,10 por padrão.

export interface AllowanceConfig {
  points_per_real: number;   // quantos pontos valem R$ 1,00 (default: 10)
  reset_period: 'week' | 'month';
}

export interface AllowanceSummary {
  child_id: UUID;
  period_start: string;      // YYYY-MM-DD
  period_end: string;        // YYYY-MM-DD
  points_earned: number;
  allowance_cents: number;   // em centavos
}

// ─── UC037: Conquistas ────────────────────────────────────────
// badge_icon = nome do ícone Tabler (ex: 'star', 'medal', 'diamond').
// Nunca usar emoji — renderização inconsistente entre plataformas.

export interface ChildAchievement {
  id: UUID;
  family_id: UUID;
  child_id: UUID;
  title: string;
  description?: string;
  badge_icon: string;  // nome do ícone Tabler (ex: 'star', 'medal')
  points_at: number;   // pontos totais quando a conquista foi desbloqueada
  awarded_at: string;  // ISO 8601
}

export interface CreateAchievementInput {
  child_id: UUID;
  title: string;
  description?: string;
  badge_icon?: string;  // nome do ícone Tabler; default: 'star'
  points_at: number;
}

/** Marcos predefinidos de conquista por pontos acumulados */
export const ACHIEVEMENT_MILESTONES: Array<{
  points: number;
  title: string;
  icon: string;        // nome do ícone Tabler
  description: string;
}> = [
  { points: 10,  icon: 'star',         title: 'Primeira estrela', description: 'Concluiu as primeiras 10 tarefas com pontos!' },
  { points: 50,  icon: 'medal',        title: 'Prata',            description: 'Chegou a 50 pontos. Incrível!' },
  { points: 100, icon: 'trophy',       title: 'Ouro',             description: 'Cem pontos! Um verdadeiro campeão.' },
  { points: 200, icon: 'diamond',      title: 'Diamante',         description: 'Duzentos pontos. Nível máximo!' },
];

// ─── UC038: Agenda escolar ────────────────────────────────────
// Usa family_events com child_id + school_type preenchidos.

export type SchoolEventType = 'homework' | 'test' | 'meeting' | 'trip' | 'other';

export const SCHOOL_EVENT_LABELS: Record<SchoolEventType, string> = {
  homework: 'Tarefa de casa',
  test:     'Prova',
  meeting:  'Reunião',
  trip:     'Passeio',
  other:    'Outro',
};

/** Ícone Tabler correspondente a cada tipo de evento escolar */
export const SCHOOL_EVENT_ICON: Record<SchoolEventType, string> = {
  homework: 'notebook',
  test:     'clipboard-list',
  meeting:  'users',
  trip:     'bus',
  other:    'calendar',
};

/** family_event enriquecido com campos escolares */
export interface SchoolEvent {
  id: UUID;
  family_id: UUID;
  child_id: UUID;
  school_type: SchoolEventType;
  title: string;
  description?: string;
  start_at: string;    // ISO 8601
  end_at?: string;
  all_day: boolean;
  created_by: UUID;
  created_at: string;
}

export interface CreateSchoolEventInput {
  child_id: UUID;
  school_type: SchoolEventType;
  title: string;
  description?: string;
  start_at: string;
  end_at?: string;
  all_day?: boolean;
}

// ─── UC039: Tempo de tela ─────────────────────────────────────

export interface ScreenTimeLog {
  id: UUID;
  family_id: UUID;
  child_id: UUID;
  date: string;          // YYYY-MM-DD
  allowed_min: number;
  used_min: number;
  created_at: string;
  updated_at: string;
}

export interface UpsertScreenTimeInput {
  child_id: UUID;
  date?: string;          // defaults to today
  allowed_min?: number;
  used_min?: number;
}

export interface ScreenTimeStatus {
  date: string;
  allowed_min: number;
  used_min: number;
  remaining_min: number;
  percentage_used: number; // 0–100
  over_limit: boolean;
}

// ─── UC040: Login por PIN ─────────────────────────────────────
// O PIN é hash bcrypt armazenado em profiles.pin_hash.

export interface SetPinInput {
  child_profile_id: UUID;
  pin: string;           // 4–6 dígitos
}

export interface VerifyPinInput {
  child_profile_id: UUID;
  pin: string;
}

// ─── UC041: Alimentação diária da criança ─────────────────────

export type MealSlot = 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'other';
export type MealRating = 'great' | 'ok' | 'refused';

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'Café da manhã',
  lunch:     'Almoço',
  snack:     'Lanche',
  dinner:    'Jantar',
  other:     'Outro',
};

/** Ícone Tabler correspondente a cada refeição */
export const MEAL_SLOT_ICON: Record<MealSlot, string> = {
  breakfast: 'sun',
  lunch:     'bowl',
  snack:     'apple',
  dinner:    'moon',
  other:     'spoon',
};

export const MEAL_RATING_LABELS: Record<MealRating, string> = {
  great:   'Comeu bem',
  ok:      'Comeu pouco',
  refused: 'Recusou',
};

/** Ícone Tabler correspondente a cada avaliação de refeição */
export const MEAL_RATING_ICON: Record<MealRating, string> = {
  great:   'mood-happy',
  ok:      'mood-neutral',
  refused: 'mood-sad',
};

// Cores neutras para avaliação de refeição — nunca usar verde/vermelho (não é acusatório)
export const MEAL_RATING_COLOR: Record<MealRating, string> = {
  great:   '#e8720c', // primary — positivo
  ok:      '#FF9500', // warning — neutro
  refused: '#f5d9b0', // tertiary — observacional, não negativo
};

export interface ChildMeal {
  id: UUID;
  family_id: UUID;
  child_id: UUID;
  date: string;          // YYYY-MM-DD
  slot: MealSlot;
  description?: string;
  rating: MealRating;
  notes?: string;
  logged_by?: UUID;
  created_at: string;
}

export interface UpsertMealInput {
  child_id: UUID;
  date?: string;         // defaults to today
  slot: MealSlot;
  description?: string;
  rating: MealRating;
  notes?: string;
}

/** Resumo do dia alimentar — slots preenchidos e taxa de aceitação */
export interface DailyMealSummary {
  date: string;
  meals: ChildMeal[];
  total_slots: number;       // quantos slots foram registrados
  great_count: number;
  ok_count: number;
  refused_count: number;
}

// ─── UC042: Deveres e tarefas de casa ─────────────────────────

export interface ChildHomework {
  id: UUID;
  family_id: UUID;
  child_id: UUID;
  subject: string;
  description?: string;
  due_date: string;      // YYYY-MM-DD
  done: boolean;
  done_at?: string;
  reviewed_by?: UUID;
  reviewed_at?: string;
  created_by?: UUID;
  created_at: string;
  updated_at: string;
}

export interface CreateHomeworkInput {
  child_id: UUID;
  subject: string;
  description?: string;
  due_date: string;
}

export interface HomeworkDayGroup {
  due_date: string;
  items: ChildHomework[];
  pending_count: number;
  done_count: number;
}
