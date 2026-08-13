// src/types/productivity.types.ts

import { UUID } from './common.types';

// ─── Agenda ──────────────────────────────────────

export type EventCategory = 'appointment' | 'vaccine' | 'school' | 'personal' | 'other';

/** Frequência de repetição de evento */
export type EventRecurrence = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface FamilyEvent {
  id: UUID;
  family_id: UUID;
  title: string;
  description?: string;
  start_at: string;        // ISO 8601
  end_at?: string;         // ISO 8601
  all_day: boolean;
  category: EventCategory;
  recurrence?: EventRecurrence; // opcional — ausente = 'none'
  created_by: UUID;
  created_at: string;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  start_at: string;
  end_at?: string;
  all_day?: boolean;
  category?: EventCategory;
  recurrence?: EventRecurrence;
}

export interface UpdateEventInput extends Partial<CreateEventInput> {}

// ─── Tarefas ─────────────────────────────────────

export type TaskStatus   = 'pending' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

/** Frequência de repetição de tarefa (alinhada com EventRecurrence) */
export type TaskRecurrence = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Task {
  id: UUID;
  family_id: UUID;
  title: string;
  description?: string;
  assigned_to?: UUID;
  completed_by?: UUID;   // UC028/UC029 — quem concluiu
  completed_at?: string; // UC028/UC029 — quando foi concluída (ISO 8601)
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;   // ISO 8601
  recurrence?: TaskRecurrence; // opcional — ausente = 'none'
  points: number;
  category: string;
  created_by: UUID;
  created_at: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  assigned_to?: UUID;
  priority: TaskPriority;
  due_date?: string;
  category?: string;
  recurrence?: TaskRecurrence;
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  status?: TaskStatus;
  completed_by?: UUID | null;
  completed_at?: string | null;
}

// ─── Check-in Semanal ─────────────────────────────────────────

export interface WeeklyCheckin {
  id: UUID;
  family_id: UUID;
  member_id: UUID;  // profile.id
  week_start: string; // YYYY-MM-DD (segunda-feira)
  answers: Record<string, string>; // chave = pergunta, valor = resposta livre
  created_at: string;
  updated_at: string;
}

export interface UpsertWeeklyCheckinInput {
  week_start: string; // YYYY-MM-DD
  answers: Record<string, string>;
}

// ─── Compras ─────────────────────────────────────

export interface ShoppingItem {
  id: UUID;
  family_id: UUID;
  name: string;
  quantity?: number;
  unit?: string;
  category?: string;
  checked: boolean;
  added_by: UUID;
  checked_by?: UUID;
  created_at: string;
}

export interface CreateShoppingItemInput {
  name: string;
  quantity?: number;
  unit?: string;
  category?: string;
}

// ─── Filtros ─────────────────────────────────────

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigned_to?: UUID;
}

export interface EventFilters {
  from?: string; // ISO date
  to?: string;   // ISO date
  category?: EventCategory;
}

// ─── Labels / Utilitários ────────────────────────

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  appointment: 'Consulta',
  vaccine:     'Vacina',
  school:      'Escola',
  personal:    'Pessoal',
  other:       'Outro',
};


export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low:    'Baixa',
  medium: 'Média',
  high:   'Alta',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending:     'Pendente',
  in_progress: 'Em andamento',
  done:        'Concluída',
};
