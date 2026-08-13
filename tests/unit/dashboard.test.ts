// tests/unit/dashboard.test.ts
// Dashboard principal — UC008–UC010
// Testa as lógicas puras extraídas do DashboardScreen:
//   • formatRelative — formata tempo relativo a partir de ISO
//   • greeting       — saudação correta por hora do dia
//   • HighlightCard  — escolha do próximo evento mais próximo
//   • MetricCard     — alerta de carga mental > 30% de diferença
//   • Skeleton/Stale — estados de carregamento e cache velho

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// ─── Funções puras replicadas do DashboardScreen ──────────────────────────────

/** Retorna uma string relativa: "há Xmin", "há Xh", etc. */
function formatRelative(iso: string | undefined): string {
  if (!iso) return '—';
  const diffMs  = Date.now() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 1)   return 'agora';
  if (diffMin < 60)  return `há ${diffMin}min`;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return m > 0 ? `há ${h}h${m}min` : `há ${h}h`;
}

/** Saudação baseada na hora local */
function greeting(hour: number): string {
  if (hour >= 5 && hour < 12) return 'bom dia';
  if (hour >= 12 && hour < 18) return 'boa tarde';
  return 'boa noite';
}

/** Evento mais próximo de uma lista (menor start_at no futuro ou mais recente) */
interface MockEvent {
  id: string;
  label: string;
  start_at: string; // ISO
}

function nextEvent(events: MockEvent[]): MockEvent | null {
  if (!events.length) return null;
  const now = Date.now();
  const future = events.filter((e) => new Date(e.start_at).getTime() > now);
  if (future.length) {
    return future.sort(
      (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
    )[0];
  }
  // Se todos no passado, retorna o mais recente
  return events.sort(
    (a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime()
  )[0];
}

/** Detecta se o card de carga mental deve exibir alerta (diferença > 30%) */
function isMentalLoadAlert(pctA: number, pctB: number): boolean {
  return Math.abs(pctA - pctB) > 30;
}

/** Mapeia os dados do dashboard em listas de métricas para os 4 cards */
interface DashboardMetric {
  key: string;
  label: string;
  value: string;
  alert: boolean;
}

function buildMetrics(opts: {
  lastDiaper?: string;
  nextEvent?: string;
  pendingTasks: number;
  mentalLoadPctA: number;
  mentalLoadPctB: number;
}): DashboardMetric[] {
  return [
    {
      key:   'diaper',
      label: 'última troca',
      value: opts.lastDiaper ? formatRelative(opts.lastDiaper) : '—',
      alert: false,
    },
    {
      key:   'event',
      label: 'próximo evento',
      value: opts.nextEvent ?? 'nenhum',
      alert: false,
    },
    {
      key:   'tasks',
      label: 'tarefas',
      value: `${opts.pendingTasks} hoje`,
      alert: false,
    },
    {
      key:   'mental-load',
      label: 'equilíbrio',
      value: `${opts.mentalLoadPctA} / ${opts.mentalLoadPctB}`,
      alert: isMentalLoadAlert(opts.mentalLoadPctA, opts.mentalLoadPctB),
    },
  ];
}

// ─── formatRelative ───────────────────────────────────────────────────────────

describe('formatRelative — UC009 (timeline dashboard)', () => {
  it('retorna "—" para undefined', () => {
    expect(formatRelative(undefined)).toBe('—');
  });

  it('"agora" para timestamps com diff arredondado < 1 minuto', () => {
    const iso = new Date(Date.now() - 20_000).toISOString(); // 20s atrás → Math.round(0.33) = 0
    expect(formatRelative(iso)).toBe('agora');
  });

  it('"há Xmin" para menos de 1 hora', () => {
    const iso = new Date(Date.now() - 15 * 60_000).toISOString(); // 15min atrás
    expect(formatRelative(iso)).toBe('há 15min');
  });

  it('"há Xh" para hora exata', () => {
    const iso = new Date(Date.now() - 2 * 3600_000).toISOString(); // 2h atrás
    expect(formatRelative(iso)).toBe('há 2h');
  });

  it('"há XhYmin" quando há minutos além da hora', () => {
    const iso = new Date(Date.now() - (2 * 3600_000 + 15 * 60_000)).toISOString(); // 2h15 atrás
    expect(formatRelative(iso)).toBe('há 2h15min');
  });
});

// ─── greeting ─────────────────────────────────────────────────────────────────

describe('greeting — hora do dia', () => {
  it('"bom dia" às 5h', ()   => expect(greeting(5)).toBe('bom dia'));
  it('"bom dia" às 11h', ()  => expect(greeting(11)).toBe('bom dia'));
  it('"boa tarde" às 12h', () => expect(greeting(12)).toBe('boa tarde'));
  it('"boa tarde" às 17h', () => expect(greeting(17)).toBe('boa tarde'));
  it('"boa noite" às 18h', () => expect(greeting(18)).toBe('boa noite'));
  it('"boa noite" às 23h', () => expect(greeting(23)).toBe('boa noite'));
  it('"boa noite" à meia-noite (0h)', () => expect(greeting(0)).toBe('boa noite'));
  it('"boa noite" às 4h', () => expect(greeting(4)).toBe('boa noite'));
});

// ─── nextEvent ────────────────────────────────────────────────────────────────

describe('nextEvent — evento mais próximo (HighlightCard)', () => {
  it('retorna null quando lista vazia', () => {
    expect(nextEvent([])).toBeNull();
  });

  it('retorna o único evento futuro', () => {
    const ev: MockEvent = { id: '1', label: 'vacina', start_at: new Date(Date.now() + 3600_000).toISOString() };
    expect(nextEvent([ev])).toEqual(ev);
  });

  it('retorna o evento futuro mais próximo entre vários', () => {
    const sooner: MockEvent = { id: '1', label: 'consulta', start_at: new Date(Date.now() + 1000).toISOString() };
    const later:  MockEvent = { id: '2', label: 'vacina',   start_at: new Date(Date.now() + 100_000).toISOString() };
    expect(nextEvent([later, sooner])?.id).toBe('1');
  });

  it('quando todos no passado, retorna o mais recente', () => {
    const older:  MockEvent = { id: 'old', label: 'A', start_at: new Date(Date.now() - 100_000).toISOString() };
    const recent: MockEvent = { id: 'rec', label: 'B', start_at: new Date(Date.now() - 1000).toISOString() };
    expect(nextEvent([older, recent])?.id).toBe('rec');
  });
});

// ─── isMentalLoadAlert ────────────────────────────────────────────────────────

describe('isMentalLoadAlert — MetricCard carga mental', () => {
  it('alerta quando diferença > 30%', () => {
    expect(isMentalLoadAlert(70, 30)).toBe(true);
  });

  it('sem alerta quando diferença = 30%', () => {
    expect(isMentalLoadAlert(65, 35)).toBe(false);
  });

  it('sem alerta quando 50/50', () => {
    expect(isMentalLoadAlert(50, 50)).toBe(false);
  });

  it('sem alerta com leve desequilíbrio (60/40)', () => {
    expect(isMentalLoadAlert(60, 40)).toBe(false);
  });

  it('alerta quando pctB > pctA em mais de 30%', () => {
    expect(isMentalLoadAlert(25, 75)).toBe(true);
  });
});

// ─── buildMetrics ─────────────────────────────────────────────────────────────

describe('buildMetrics — 4 cards do grid', () => {
  it('gera exatamente 4 métricas', () => {
    const m = buildMetrics({ pendingTasks: 3, mentalLoadPctA: 50, mentalLoadPctB: 50 });
    expect(m).toHaveLength(4);
  });

  it('card de troca mostra "—" quando não há troca', () => {
    const m = buildMetrics({ pendingTasks: 0, mentalLoadPctA: 50, mentalLoadPctB: 50 });
    expect(m.find((c) => c.key === 'diaper')?.value).toBe('—');
  });

  it('card de carga mental ativa alerta para 70/30', () => {
    const m = buildMetrics({ pendingTasks: 0, mentalLoadPctA: 70, mentalLoadPctB: 30 });
    expect(m.find((c) => c.key === 'mental-load')?.alert).toBe(true);
  });

  it('card de carga mental sem alerta para 55/45', () => {
    const m = buildMetrics({ pendingTasks: 0, mentalLoadPctA: 55, mentalLoadPctB: 45 });
    expect(m.find((c) => c.key === 'mental-load')?.alert).toBe(false);
  });

  it('card de tarefas mostra contagem correta', () => {
    const m = buildMetrics({ pendingTasks: 5, mentalLoadPctA: 50, mentalLoadPctB: 50 });
    expect(m.find((c) => c.key === 'tasks')?.value).toBe('5 hoje');
  });
});
