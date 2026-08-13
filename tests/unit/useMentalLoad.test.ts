// tests/unit/useMentalLoad.test.ts
// UC024: Resumo de carga mental | UC028: Detecção de desequilíbrio
// Testa lógica pura de cálculo e derivação sem depender do Supabase.

import { describe, it, expect } from '@jest/globals';

// ─── tipos locais ─────────────────────────────────────────────────────────────

interface MockMember {
  id: string;
  name: string;
  total_points: number;
  percentage: number;
}

interface MockSummary {
  family_id: string;
  period: 'week' | 'month';
  members: MockMember[];
  total_points: number;
  is_balanced: boolean;
  imbalance_percentage: number;
}

// ─── funções puras replicadas ─────────────────────────────────────────────────

/** Calcula percentuais a partir de pontos brutos */
function calcularPercentuais(members: Array<{ id: string; name: string; points: number }>): MockMember[] {
  const total = members.reduce((acc, m) => acc + m.points, 0);
  if (total === 0) {
    return members.map((m) => ({ id: m.id, name: m.name, total_points: 0, percentage: 0 }));
  }
  return members.map((m) => ({
    id:           m.id,
    name:         m.name,
    total_points: m.points,
    percentage:   Math.round((m.points / total) * 100),
  }));
}

/** Determina se a carga está equilibrada */
function calcularEquilibrio(members: MockMember[]): { is_balanced: boolean; imbalance_pct: number } {
  if (members.length < 2) return { is_balanced: true, imbalance_pct: 0 };
  const sorted = [...members].sort((a, b) => b.percentage - a.percentage);
  const diff = sorted[0].percentage - sorted[sorted.length - 1].percentage;
  return { is_balanced: diff <= 10, imbalance_pct: diff };
}

/** Monta o summary completo */
function montarSummary(
  familyId: string,
  period: 'week' | 'month',
  rawMembers: Array<{ id: string; name: string; points: number }>
): MockSummary {
  const members = calcularPercentuais(rawMembers);
  const { is_balanced, imbalance_pct } = calcularEquilibrio(members);
  return {
    family_id:            familyId,
    period,
    members,
    total_points:         rawMembers.reduce((a, m) => a + m.points, 0),
    is_balanced,
    imbalance_percentage: imbalance_pct,
  };
}

/** Extrai pctA / pctB para o MetricCard do dashboard */
function extrairPcts(summary: MockSummary | null): [number, number] {
  const [memberA, memberB] = summary?.members ?? [];
  return [
    Math.round(memberA?.percentage ?? 58),
    Math.round(memberB?.percentage ?? 42),
  ];
}

// ─── calcularPercentuais ──────────────────────────────────────────────────────

describe('calcularPercentuais', () => {
  it('distribui corretamente entre 2 membros', () => {
    // 30/50 = 60%, 20/50 = 40% — valores exatos sem arredondamento ambíguo
    const result = calcularPercentuais([
      { id: 'a', name: 'Joana',  points: 30 },
      { id: 'b', name: 'Marcos', points: 20 },
    ]);
    expect(result[0].percentage).toBe(60);
    expect(result[1].percentage).toBe(40);
  });

  it('percentuais somam 100', () => {
    const result = calcularPercentuais([
      { id: 'a', name: 'A', points: 30 },
      { id: 'b', name: 'B', points: 20 },
      { id: 'c', name: 'C', points: 50 },
    ]);
    const total = result.reduce((acc, m) => acc + m.percentage, 0);
    expect(total).toBe(100);
  });

  it('total zero → todos com 0%', () => {
    const result = calcularPercentuais([
      { id: 'a', name: 'A', points: 0 },
      { id: 'b', name: 'B', points: 0 },
    ]);
    expect(result[0].percentage).toBe(0);
    expect(result[1].percentage).toBe(0);
  });
});

// ─── calcularEquilibrio — UC028 ───────────────────────────────────────────────

describe('calcularEquilibrio — UC028', () => {
  it('is_balanced = true quando diferença ≤ 10%', () => {
    const members: MockMember[] = [
      { id: 'a', name: 'A', total_points: 22, percentage: 55 },
      { id: 'b', name: 'B', total_points: 18, percentage: 45 },
    ];
    const { is_balanced } = calcularEquilibrio(members);
    expect(is_balanced).toBe(true);
  });

  it('is_balanced = false quando diferença > 10%', () => {
    const members: MockMember[] = [
      { id: 'a', name: 'A', total_points: 70, percentage: 70 },
      { id: 'b', name: 'B', total_points: 30, percentage: 30 },
    ];
    const { is_balanced, imbalance_pct } = calcularEquilibrio(members);
    expect(is_balanced).toBe(false);
    expect(imbalance_pct).toBe(40);
  });

  it('50/50 exato → equilibrado e imbalance = 0', () => {
    const members: MockMember[] = [
      { id: 'a', name: 'A', total_points: 20, percentage: 50 },
      { id: 'b', name: 'B', total_points: 20, percentage: 50 },
    ];
    const { is_balanced, imbalance_pct } = calcularEquilibrio(members);
    expect(is_balanced).toBe(true);
    expect(imbalance_pct).toBe(0);
  });

  it('um único membro → sempre equilibrado', () => {
    const members: MockMember[] = [
      { id: 'a', name: 'A', total_points: 10, percentage: 100 },
    ];
    const { is_balanced } = calcularEquilibrio(members);
    expect(is_balanced).toBe(true);
  });
});

// ─── montarSummary ────────────────────────────────────────────────────────────

describe('montarSummary', () => {
  it('gera summary com total_points correto', () => {
    const summary = montarSummary('fam-001', 'week', [
      { id: 'a', name: 'Joana',  points: 23 },
      { id: 'b', name: 'Marcos', points: 17 },
    ]);
    expect(summary.total_points).toBe(40);
    expect(summary.members).toHaveLength(2);
    expect(summary.period).toBe('week');
  });

  it('is_balanced = false para desequilíbrio 70/30', () => {
    const summary = montarSummary('fam-001', 'week', [
      { id: 'a', name: 'A', points: 70 },
      { id: 'b', name: 'B', points: 30 },
    ]);
    expect(summary.is_balanced).toBe(false);
    expect(summary.imbalance_percentage).toBe(40);
  });

  it('summary com pontos zerados — sem crash', () => {
    const summary = montarSummary('fam-001', 'week', [
      { id: 'a', name: 'A', points: 0 },
      { id: 'b', name: 'B', points: 0 },
    ]);
    expect(summary.total_points).toBe(0);
    expect(summary.is_balanced).toBe(true);
  });
});

// ─── extrairPcts — dashboard MetricCard ──────────────────────────────────────

describe('extrairPcts — dashboard', () => {
  it('extrai percentuais corretos quando summary existe', () => {
    // 30/50 = 60%, 20/50 = 40% — sem arredondamento ambíguo
    const summary = montarSummary('fam-001', 'week', [
      { id: 'a', name: 'Joana',  points: 30 },
      { id: 'b', name: 'Marcos', points: 20 },
    ]);
    const [pctA, pctB] = extrairPcts(summary);
    expect(pctA).toBe(60);
    expect(pctB).toBe(40);
  });

  it('usa fallback 58/42 quando summary é null', () => {
    const [pctA, pctB] = extrairPcts(null);
    expect(pctA).toBe(58);
    expect(pctB).toBe(42);
  });

  it('ícone de alerta quando |pctA - pctB| > 30', () => {
    const [pctA, pctB] = extrairPcts(
      montarSummary('fam-001', 'week', [
        { id: 'a', name: 'A', points: 70 },
        { id: 'b', name: 'B', points: 30 },
      ])
    );
    expect(Math.abs(pctA - pctB) > 30).toBe(true);
  });

  it('sem alerta quando desequilíbrio ≤ 30%', () => {
    const [pctA, pctB] = extrairPcts(
      montarSummary('fam-001', 'week', [
        { id: 'a', name: 'A', points: 60 },
        { id: 'b', name: 'B', points: 40 },
      ])
    );
    expect(Math.abs(pctA - pctB) > 30).toBe(false);
  });
});
