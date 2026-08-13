// tests/unit/mentalLoad.test.ts
// Testes de lógica pura das funções auxiliares de carga mental

import { describe, it, expect } from '@jest/globals';
import type {
  MentalLoadDayEntry,
  FamilyMentalLoadSummary,
  MemberLoadSummary,
} from '@/types/differential.types';

// ─── Funções auxiliares copiadas de history.tsx para teste ─────

/** Agrupa entradas por data */
function groupByDate(
  entries: MentalLoadDayEntry[]
): Record<string, MentalLoadDayEntry[]> {
  return entries.reduce(
    (acc, e) => {
      if (!acc[e.date]) acc[e.date] = [];
      acc[e.date].push(e);
      return acc;
    },
    {} as Record<string, MentalLoadDayEntry[]>
  );
}

/** Formata data YYYY-MM-DD para exibição */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/** Calcula pontos máximos para normalização de barras */
function calcMaxPoints(entries: MentalLoadDayEntry[]): number {
  return entries.reduce((max, e) => Math.max(max, e.points), 1);
}

/** Calcula largura percentual de uma barra */
function calcBarWidth(points: number, maxPoints: number): number {
  return Math.round((points / maxPoints) * 100);
}

/** Determina se o resumo está desequilibrado (diferença > 10%) */
function isImbalanced(summary: FamilyMentalLoadSummary): boolean {
  return !summary.is_balanced && summary.imbalance_percentage > 10;
}

/** Encontra o nome do membro mais ativo */
function getMostActiveName(summary: FamilyMentalLoadSummary): string | undefined {
  const member = summary.members.find(m => m.member_id === summary.most_active_member_id);
  return member?.member_name;
}

// ─── Fixtures ────────────────────────────────────────────────────

function makeEntry(overrides: Partial<MentalLoadDayEntry> = {}): MentalLoadDayEntry {
  return {
    date: '2024-06-01',
    member_id: 'member-1',
    points: 10,
    ...overrides,
  };
}

function makeMember(overrides: Partial<MemberLoadSummary> = {}): MemberLoadSummary {
  return {
    member_id: 'member-1',
    member_name: 'Joana Silva',
    total_points: 60,
    percentage: 60,
    activity_breakdown: {
      feeding_breast: 10,
      feeding_bottle: 10,
      diaper: 10,
      bath: 0,
      sleep_monitor: 10,
      medication: 0,
      appointment: 0,
      vaccine: 0,
      task_high: 10,
      task_medium: 10,
      task_low: 0,
      shopping_item: 0,
    },
    ...overrides,
  };
}

function makeSummary(overrides: Partial<FamilyMentalLoadSummary> = {}): FamilyMentalLoadSummary {
  return {
    family_id: 'family-1',
    period_start: '2024-05-25',
    period_end: '2024-06-01',
    members: [
      makeMember({ member_id: 'member-1', member_name: 'Joana', percentage: 60 }),
      makeMember({ member_id: 'member-2', member_name: 'Marcos', percentage: 40 }),
    ],
    is_balanced: false,
    imbalance_percentage: 20,
    most_active_member_id: 'member-1',
    least_active_member_id: 'member-2',
    ...overrides,
  };
}

// ─── Testes: groupByDate ─────────────────────────────────────────

describe('groupByDate', () => {
  it('retorna objeto vazio para lista vazia', () => {
    expect(groupByDate([])).toEqual({});
  });

  it('agrupa corretamente entradas do mesmo dia', () => {
    const entries = [
      makeEntry({ date: '2024-06-01', member_id: 'member-1', points: 5 }),
      makeEntry({ date: '2024-06-01', member_id: 'member-2', points: 8 }),
    ];
    const result = groupByDate(entries);
    expect(Object.keys(result)).toHaveLength(1);
    expect(result['2024-06-01']).toHaveLength(2);
  });

  it('separa entradas de dias diferentes', () => {
    const entries = [
      makeEntry({ date: '2024-06-01' }),
      makeEntry({ date: '2024-06-02' }),
      makeEntry({ date: '2024-06-03' }),
    ];
    const result = groupByDate(entries);
    expect(Object.keys(result)).toHaveLength(3);
  });

  it('preserva os dados originais dentro de cada grupo', () => {
    const entry = makeEntry({ date: '2024-06-01', member_id: 'x', points: 42 });
    const result = groupByDate([entry]);
    expect(result['2024-06-01'][0].points).toBe(42);
    expect(result['2024-06-01'][0].member_id).toBe('x');
  });

  it('mantém ordem de inserção dentro do mesmo dia', () => {
    const entries = [
      makeEntry({ date: '2024-06-01', member_id: 'a' }),
      makeEntry({ date: '2024-06-01', member_id: 'b' }),
      makeEntry({ date: '2024-06-01', member_id: 'c' }),
    ];
    const group = groupByDate(entries)['2024-06-01'];
    expect(group.map(e => e.member_id)).toEqual(['a', 'b', 'c']);
  });
});

// ─── Testes: calcMaxPoints ────────────────────────────────────────

describe('calcMaxPoints', () => {
  it('retorna 1 como mínimo em lista vazia (evita divisão por zero)', () => {
    expect(calcMaxPoints([])).toBe(1);
  });

  it('retorna 1 como mínimo quando todos os pontos são 0', () => {
    const entries = [makeEntry({ points: 0 }), makeEntry({ points: 0 })];
    expect(calcMaxPoints(entries)).toBe(1);
  });

  it('retorna o valor máximo da lista', () => {
    const entries = [
      makeEntry({ points: 5 }),
      makeEntry({ points: 42 }),
      makeEntry({ points: 17 }),
    ];
    expect(calcMaxPoints(entries)).toBe(42);
  });

  it('funciona com um único item', () => {
    expect(calcMaxPoints([makeEntry({ points: 99 })])).toBe(99);
  });
});

// ─── Testes: calcBarWidth ─────────────────────────────────────────

describe('calcBarWidth', () => {
  it('retorna 100 quando pontos igualam o máximo', () => {
    expect(calcBarWidth(50, 50)).toBe(100);
  });

  it('retorna 0 quando pontos são 0', () => {
    expect(calcBarWidth(0, 100)).toBe(0);
  });

  it('arredonda para inteiro', () => {
    // 1/3 * 100 = 33.33... → 33
    expect(calcBarWidth(1, 3)).toBe(33);
  });

  it('retorna 50 para metade do máximo', () => {
    expect(calcBarWidth(25, 50)).toBe(50);
  });

  it('não ultrapassa 100 mesmo com pontos iguais ao máximo', () => {
    expect(calcBarWidth(100, 100)).toBeLessThanOrEqual(100);
  });
});

// ─── Testes: isImbalanced ─────────────────────────────────────────

describe('isImbalanced', () => {
  it('retorna false quando está balanceado', () => {
    const summary = makeSummary({ is_balanced: true, imbalance_percentage: 5 });
    expect(isImbalanced(summary)).toBe(false);
  });

  it('retorna true quando desequilibrado acima de 10%', () => {
    const summary = makeSummary({ is_balanced: false, imbalance_percentage: 25 });
    expect(isImbalanced(summary)).toBe(true);
  });

  it('retorna false quando desequilíbrio é exatamente 10% (limiar)', () => {
    const summary = makeSummary({ is_balanced: false, imbalance_percentage: 10 });
    expect(isImbalanced(summary)).toBe(false);
  });

  it('retorna false quando desequilíbrio é 0', () => {
    const summary = makeSummary({ is_balanced: true, imbalance_percentage: 0 });
    expect(isImbalanced(summary)).toBe(false);
  });
});

// ─── Testes: getMostActiveName ────────────────────────────────────

describe('getMostActiveName', () => {
  it('retorna o nome do membro mais ativo', () => {
    const summary = makeSummary({ most_active_member_id: 'member-1' });
    expect(getMostActiveName(summary)).toBe('Joana');
  });

  it('retorna undefined quando membro não é encontrado na lista', () => {
    const summary = makeSummary({ most_active_member_id: 'inexistente' });
    expect(getMostActiveName(summary)).toBeUndefined();
  });

  it('funciona com múltiplos membros', () => {
    const summary = makeSummary({
      most_active_member_id: 'member-2',
    });
    expect(getMostActiveName(summary)).toBe('Marcos');
  });
});

// ─── Testes: formatDate ──────────────────────────────────────────

describe('formatDate', () => {
  it('retorna string não vazia para data válida', () => {
    const result = formatDate('2024-06-01');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('usa o T12:00:00 para evitar problema de fuso horário (não virar dia anterior)', () => {
    // Verificamos que o dia no resultado bate com o esperado
    const result = formatDate('2024-06-15');
    expect(result).toContain('15');
  });

  it('datas diferentes produzem strings diferentes', () => {
    const a = formatDate('2024-06-01');
    const b = formatDate('2024-06-02');
    expect(a).not.toBe(b);
  });
});
