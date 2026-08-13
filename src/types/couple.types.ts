// src/types/couple.types.ts
// Módulo Casal V2 — UC031–034

import { UUID } from './common.types';

// ─── UC031: Apreciação rápida ─────────────────────────────────

export interface CoupleAppreciation {
  id: UUID;
  family_id: UUID;
  from_member: UUID;
  to_member: UUID;
  message: string;      // max 280 chars
  emoji?: string;
  created_at: string;   // ISO 8601
}

export interface CreateAppreciationInput {
  to_member: UUID;
  message: string;
  emoji?: string;
}

// ─── UC032: Check-in emocional ────────────────────────────────

export type MoodLevel = 'terrible' | 'bad' | 'ok' | 'good' | 'great';

export const MOOD_LABELS: Record<MoodLevel, string> = {
  terrible: 'Muito ruim',
  bad:      'Ruim',
  ok:       'Ok',
  good:     'Bem',
  great:    'Ótimo',
};

export const MOOD_EMOJI: Record<MoodLevel, string> = {
  terrible: '😩',
  bad:      '😔',
  ok:       '😐',
  good:     '🙂',
  great:    '😄',
};

export interface CoupleCheckin {
  id: UUID;
  family_id: UUID;
  member_id: UUID;
  mood: MoodLevel;
  note?: string;
  checked_at: string;   // YYYY-MM-DD
  created_at: string;   // ISO 8601
}

export interface UpsertCoupleCheckinInput {
  mood: MoodLevel;
  note?: string;
  checked_at?: string;  // defaults to today
}

// Estado do casal no dia (par de check-ins)
export interface DailyMoodSummary {
  date: string;         // YYYY-MM-DD
  member_a?: CoupleCheckin;
  member_b?: CoupleCheckin;
}

// ─── UC033: Janela livre ──────────────────────────────────────
// Calculado em runtime — sem tabela própria.
// A sugestão de janela é derivada dos family_events do dia.

export interface FreeWindowSuggestion {
  date: string;           // YYYY-MM-DD
  start_time: string;     // HH:MM (24h)
  end_time: string;       // HH:MM (24h)
  duration_min: number;
}

// ─── UC034: Divisão de gastos ─────────────────────────────────

export type ExpenseSplitMode = 'equal' | 'custom' | 'one_pays';

export const EXPENSE_SPLIT_LABELS: Record<ExpenseSplitMode, string> = {
  equal:    'Divisão igual',
  custom:   'Percentual personalizado',
  one_pays: 'Um paga tudo',
};

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  food:          'Alimentação',
  health:        'Saúde',
  transport:     'Transporte',
  entertainment: 'Lazer',
  home:          'Casa',
  kids:          'Crianças',
  other:         'Outros',
};

export interface CoupleExpense {
  id: UUID;
  family_id: UUID;
  title: string;
  amount_cents: number;     // valor em centavos (R$ = amount_cents / 100)
  category: string;
  paid_by: UUID;
  split_mode: ExpenseSplitMode;
  paid_by_pct?: number;     // 0–100 (apenas quando split_mode = 'custom')
  notes?: string;
  expense_date: string;     // YYYY-MM-DD
  settled: boolean;
  created_at: string;       // ISO 8601
}

export interface CreateExpenseInput {
  title: string;
  amount_cents: number;
  category?: string;
  split_mode?: ExpenseSplitMode;
  paid_by_pct?: number;
  notes?: string;
  expense_date?: string;
}

export interface UpdateExpenseInput extends Partial<CreateExpenseInput> {
  settled?: boolean;
}

/** Resumo do balanço entre os dois membros do casal */
export interface ExpenseBalance {
  total_cents: number;
  member_a_paid_cents: number;
  member_b_paid_cents: number;
  member_a_owes_cents: number;  // negativo = deve receber
  member_b_owes_cents: number;
  is_balanced: boolean;
}
