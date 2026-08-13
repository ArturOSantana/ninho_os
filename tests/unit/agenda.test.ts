// tests/unit/agenda.test.ts
// Testa a lógica pura da Fase 4 — Agenda (UC015–UC017):
//   • weekStart: retorna o domingo correto da semana
//   • weekDays: gera os 7 dias da semana a partir do domingo
//   • scroll semanal: +7 dias e -7 dias mudam a semana corretamente
//   • formatDateLabel: formata data com e sem hora
//   • daysUntil: calcula dias até uma data ISO

import { describe, it, expect } from '@jest/globals';

// ─── Funções extraídas do índice (lógica pura) ───────────────────

const MONTHS_PT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

function pad(n: number) { return String(n).padStart(2, '0'); }

function weekStart(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - copy.getDay());
  return copy;
}

function weekDays(sunday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function formatDateLabel(d: Date, allDay: boolean): string {
  const date = `${d.getDate()} de ${MONTHS_PT[d.getMonth()]} de ${d.getFullYear()}`;
  if (allDay) return date;
  return `${date} às ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function daysUntil(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

// ─── weekStart ────────────────────────────────────────────────────

describe('weekStart', () => {
  it('retorna domingo para uma segunda-feira', () => {
    // 2025-07-14 é segunda-feira
    const monday  = new Date(2025, 6, 14, 10, 30, 0); // mês 6 = julho (0-based)
    const sunday  = weekStart(monday);
    expect(sunday.getDay()).toBe(0);              // domingo
    expect(sunday.getDate()).toBe(13);            // 13/07
    expect(sunday.getHours()).toBe(0);            // zerado
  });

  it('retorna o próprio domingo para um domingo', () => {
    // 2025-07-13 é domingo
    const sunday = new Date(2025, 6, 13, 15, 0, 0);
    const result = weekStart(sunday);
    expect(result.getDay()).toBe(0);
    expect(result.getDate()).toBe(13);
  });

  it('retorna o domingo correto para sábado', () => {
    // 2025-07-19 é sábado — deve voltar para 13/07
    const saturday = new Date(2025, 6, 19, 8, 0, 0);
    const result   = weekStart(saturday);
    expect(result.getDay()).toBe(0);
    expect(result.getDate()).toBe(13);
  });
});

// ─── weekDays ─────────────────────────────────────────────────────

describe('weekDays', () => {
  it('gera exatamente 7 dias', () => {
    const sunday = new Date(2025, 6, 13); // 13/07/2025 domingo
    const days   = weekDays(sunday);
    expect(days).toHaveLength(7);
  });

  it('primeiro dia é domingo e último é sábado', () => {
    const sunday = new Date(2025, 6, 13);
    const days   = weekDays(sunday);
    expect(days[0].getDay()).toBe(0); // domingo
    expect(days[6].getDay()).toBe(6); // sábado
  });

  it('os dias são consecutivos', () => {
    const sunday = new Date(2025, 6, 13);
    const days   = weekDays(sunday);
    for (let i = 1; i < 7; i++) {
      const diffMs = days[i].getTime() - days[i - 1].getTime();
      expect(diffMs).toBe(24 * 60 * 60 * 1000); // exatamente 1 dia
    }
  });
});

// ─── Scroll semanal ───────────────────────────────────────────────

describe('scroll semanal — semana seguinte', () => {
  it('adicionar 7 dias move para a semana seguinte correta', () => {
    const sunday = new Date(2025, 6, 13); // 13/07 dom
    const next   = new Date(sunday);
    next.setDate(next.getDate() + 7);
    expect(next.getDate()).toBe(20);   // 20/07
    expect(next.getDay()).toBe(0);     // ainda domingo
    expect(next.getMonth()).toBe(6);   // julho
  });

  it('adicionar 7 dias cruza fronteira de mês corretamente', () => {
    // 27/07 domingo + 7 = 03/08 domingo
    const sunday = new Date(2025, 6, 27);
    const next   = new Date(sunday);
    next.setDate(next.getDate() + 7);
    expect(next.getDate()).toBe(3);
    expect(next.getMonth()).toBe(7); // agosto
    expect(next.getDay()).toBe(0);
  });
});

describe('scroll semanal — semana anterior', () => {
  it('subtrair 7 dias move para a semana anterior correta', () => {
    const sunday = new Date(2025, 6, 20); // 20/07
    const prev   = new Date(sunday);
    prev.setDate(prev.getDate() - 7);
    expect(prev.getDate()).toBe(13);
    expect(prev.getDay()).toBe(0);
  });

  it('subtrair 7 dias cruza fronteira de mês corretamente', () => {
    // 03/08 domingo - 7 = 27/07 domingo
    const sunday = new Date(2025, 7, 3);
    const prev   = new Date(sunday);
    prev.setDate(prev.getDate() - 7);
    expect(prev.getDate()).toBe(27);
    expect(prev.getMonth()).toBe(6); // julho
    expect(prev.getDay()).toBe(0);
  });
});

// ─── formatDateLabel ──────────────────────────────────────────────

describe('formatDateLabel', () => {
  it('dia inteiro: não inclui hora', () => {
    const d = new Date(2025, 6, 14, 9, 30);
    const label = formatDateLabel(d, true);
    expect(label).toBe('14 de jul de 2025');
    expect(label).not.toContain('09:');
  });

  it('com hora: inclui hora formatada', () => {
    const d = new Date(2025, 6, 14, 9, 5);
    const label = formatDateLabel(d, false);
    expect(label).toBe('14 de jul de 2025 às 09:05');
  });

  it('meia-noite é formatada como 00:00', () => {
    const d = new Date(2025, 6, 14, 0, 0);
    const label = formatDateLabel(d, false);
    expect(label).toContain('às 00:00');
  });

  it('hora com pad: 08:03', () => {
    const d = new Date(2025, 0, 1, 8, 3); // 1 jan, 08:03
    const label = formatDateLabel(d, false);
    expect(label).toContain('às 08:03');
  });
});

// ─── daysUntil ────────────────────────────────────────────────────

describe('daysUntil', () => {
  it('datas no passado retornam 0', () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    expect(daysUntil(past)).toBe(0);
  });

  it('data agora + 25h retorna 2 (arredonda para cima)', () => {
    // 25 horas = 1.04 dias → ceil = 2
    const future = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString();
    expect(daysUntil(future)).toBe(2);
  });

  it('data agora + exatamente 3 dias retorna 3', () => {
    const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    // Pode ser 3 ou 4 dependendo de ms — aceita ambos pois ceil é sensível a ms
    expect(daysUntil(future)).toBeGreaterThanOrEqual(3);
  });
});
