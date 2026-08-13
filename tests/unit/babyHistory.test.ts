// tests/unit/babyHistory.test.ts
// Lógica pura da tela de histórico do bebê (history.tsx)
// Testada inline sem React, sem Supabase

import { describe, it, expect } from '@jest/globals';
import type { BabyRecord } from '@/types';

// ─── Funções replicadas inline (copiam a implementação de history.tsx) ────────

const MONTHS_PT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

function fmtDuration(startIso: string, endIso?: string | null): string | null {
  if (!endIso) return null;
  const sec = Math.floor((new Date(endIso).getTime() - new Date(startIso).getTime()) / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h${m}min` : `${h}h`;
}

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dayLabel(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Hoje';
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
  return `${date.getDate()} de ${MONTHS_PT[date.getMonth()]}`;
}

function groupByDay(records: BabyRecord[]): { key: string; label: string; items: BabyRecord[] }[] {
  const map = new Map<string, BabyRecord[]>();
  for (const r of records) {
    const k = dayKey(r.started_at);
    const arr = map.get(k) ?? [];
    arr.push(r);
    map.set(k, arr);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, items]) => ({ key, label: dayLabel(key), items }));
}

const FEEDING_LABEL: Record<string, string> = {
  breast_left:  'seio esq.',
  breast_right: 'seio dir.',
  bottle:       'mamadeira',
  solid:        'sólido',
};

const DIAPER_LABEL: Record<string, string> = {
  pee:  'xixi',
  poo:  'cocô',
  both: 'xixi e cocô',
};

function recordSubtitle(record: BabyRecord): string {
  const parts: string[] = [];
  if (record.type === 'feeding' && record.feeding_type) {
    parts.push(FEEDING_LABEL[record.feeding_type] ?? record.feeding_type);
  }
  if (record.type === 'diaper' && record.diaper_type) {
    parts.push(DIAPER_LABEL[record.diaper_type] ?? record.diaper_type);
  }
  const dur = fmtDuration(record.started_at, record.ended_at);
  if (dur) parts.push(dur);
  if (record.notes) parts.push(record.notes);
  return parts.join(' · ');
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<BabyRecord> = {}): BabyRecord {
  return {
    id:           'rec-001',
    baby_id:      'baby-001',
    family_id:    'family-001',
    created_by:   'user-001',
    type:         'feeding',
    started_at:   new Date().toISOString(),
    ended_at:     null,
    feeding_type: null,
    diaper_type:  null,
    notes:        null,
    created_at:   new Date().toISOString(),
    ...overrides,
  } as BabyRecord;
}

// ─── fmtDuration ─────────────────────────────────────────────────────────────

describe('fmtDuration', () => {
  it('retorna null quando endIso é null', () => {
    expect(fmtDuration('2024-01-01T10:00:00Z', null)).toBeNull();
  });

  it('retorna null quando endIso é undefined', () => {
    expect(fmtDuration('2024-01-01T10:00:00Z', undefined)).toBeNull();
  });

  it('retorna segundos quando menos de 60s', () => {
    const start = new Date('2024-01-01T10:00:00Z');
    const end   = new Date('2024-01-01T10:00:45Z');
    expect(fmtDuration(start.toISOString(), end.toISOString())).toBe('45s');
  });

  it('retorna minutos quando menos de 60min', () => {
    const start = new Date('2024-01-01T10:00:00Z');
    const end   = new Date('2024-01-01T10:25:00Z');
    expect(fmtDuration(start.toISOString(), end.toISOString())).toBe('25min');
  });

  it('retorna horas sem minutos quando múltiplo exato', () => {
    const start = new Date('2024-01-01T08:00:00Z');
    const end   = new Date('2024-01-01T10:00:00Z');
    expect(fmtDuration(start.toISOString(), end.toISOString())).toBe('2h');
  });

  it('retorna horas e minutos restantes', () => {
    const start = new Date('2024-01-01T08:00:00Z');
    const end   = new Date('2024-01-01T09:30:00Z');
    expect(fmtDuration(start.toISOString(), end.toISOString())).toBe('1h30min');
  });
});

// ─── dayKey ──────────────────────────────────────────────────────────────────

describe('dayKey', () => {
  it('extrai chave YYYY-MM-DD corretamente', () => {
    expect(dayKey('2024-07-15T10:30:00Z')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('duas datas no mesmo dia produzem a mesma chave', () => {
    // Usa datas no horário local para evitar variação de fuso
    const d1 = new Date(); d1.setHours(8, 0, 0, 0);
    const d2 = new Date(); d2.setHours(22, 0, 0, 0);
    expect(dayKey(d1.toISOString())).toBe(dayKey(d2.toISOString()));
  });
});

// ─── dayLabel ────────────────────────────────────────────────────────────────

describe('dayLabel', () => {
  it('retorna "Hoje" para a data de hoje', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect(dayLabel(key)).toBe('Hoje');
  });

  it('retorna "Ontem" para a data de ontem', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const key = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    expect(dayLabel(key)).toBe('Ontem');
  });

  it('retorna dia e mês para datas anteriores', () => {
    const label = dayLabel('2024-06-15');
    expect(label).toBe('15 de jun');
  });
});

// ─── groupByDay ──────────────────────────────────────────────────────────────

describe('groupByDay', () => {
  it('retorna lista vazia para entrada vazia', () => {
    expect(groupByDay([])).toHaveLength(0);
  });

  it('agrupa registros do mesmo dia em um grupo', () => {
    const day = new Date(); day.setHours(8, 0, 0, 0);
    const r1 = makeRecord({ id: 'r1', started_at: new Date(day.getTime() + 1 * 60 * 60 * 1000).toISOString() });
    const r2 = makeRecord({ id: 'r2', started_at: new Date(day.getTime() + 3 * 60 * 60 * 1000).toISOString() });
    const groups = groupByDay([r1, r2]);
    expect(groups).toHaveLength(1);
    expect(groups[0].items).toHaveLength(2);
  });

  it('cria grupos separados para dias diferentes', () => {
    const today     = new Date(); today.setHours(10, 0, 0, 0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const r1 = makeRecord({ id: 'r1', started_at: today.toISOString() });
    const r2 = makeRecord({ id: 'r2', started_at: yesterday.toISOString() });
    const groups = groupByDay([r1, r2]);
    expect(groups).toHaveLength(2);
  });

  it('ordena grupos do mais recente para o mais antigo', () => {
    const today     = new Date(); today.setHours(10, 0, 0, 0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const r1 = makeRecord({ id: 'r1', started_at: yesterday.toISOString() });
    const r2 = makeRecord({ id: 'r2', started_at: today.toISOString() });
    const groups = groupByDay([r1, r2]);
    // Grupo mais recente (hoje) deve vir primeiro
    expect(dayLabel(groups[0].key)).toBe('Hoje');
    expect(dayLabel(groups[1].key)).toBe('Ontem');
  });
});

// ─── recordSubtitle ──────────────────────────────────────────────────────────

describe('recordSubtitle', () => {
  it('retorna string vazia para registro de sono sem ended_at e sem notas', () => {
    const r = makeRecord({ type: 'sleep', started_at: new Date().toISOString() });
    expect(recordSubtitle(r)).toBe('');
  });

  it('inclui feeding_type traduzido para mamada', () => {
    const r = makeRecord({ type: 'feeding', feeding_type: 'breast_left' });
    expect(recordSubtitle(r)).toContain('seio esq.');
  });

  it('inclui feeding_type mamadeira traduzido', () => {
    const r = makeRecord({ type: 'feeding', feeding_type: 'bottle' });
    expect(recordSubtitle(r)).toContain('mamadeira');
  });

  it('inclui diaper_type traduzido para troca', () => {
    const r = makeRecord({ type: 'diaper', diaper_type: 'poo' });
    expect(recordSubtitle(r)).toContain('cocô');
  });

  it('inclui duração quando ended_at está presente', () => {
    const start = new Date(); start.setMinutes(start.getMinutes() - 30);
    const end   = new Date();
    const r = makeRecord({
      type:       'sleep',
      started_at: start.toISOString(),
      ended_at:   end.toISOString(),
    });
    expect(recordSubtitle(r)).toContain('30min');
  });

  it('inclui notas quando presentes', () => {
    const r = makeRecord({ type: 'feeding', notes: 'obs importante' });
    expect(recordSubtitle(r)).toContain('obs importante');
  });

  it('concatena múltiplos campos com " · "', () => {
    const start = new Date(); start.setMinutes(start.getMinutes() - 15);
    const end   = new Date();
    const r = makeRecord({
      type:         'feeding',
      feeding_type: 'bottle',
      started_at:   start.toISOString(),
      ended_at:     end.toISOString(),
      notes:        'bem tranquilo',
    });
    const result = recordSubtitle(r);
    expect(result).toContain('mamadeira');
    expect(result).toContain('15min');
    expect(result).toContain('bem tranquilo');
    expect(result.split(' · ').length).toBe(3);
  });
});
