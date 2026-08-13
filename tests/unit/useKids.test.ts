// tests/unit/useKids.test.ts
// UC035: Tarefas/pontos | UC036: Mesada | UC037: Conquistas | UC038: Agenda escolar
// UC039: Tempo de tela
// Testa lógica pura do hook/service sem depender do Supabase.

import { describe, it, expect } from '@jest/globals';
import {
  KidPointsSummary,
  AllowanceSummary,
  AllowanceConfig,
  ChildAchievement,
  SchoolEvent,
  ScreenTimeStatus,
  ACHIEVEMENT_MILESTONES,
  SCHOOL_EVENT_LABELS,
  SCHOOL_EVENT_ICON,
  SchoolEventType,
} from '@/types/kids.types';

// ─── Funções puras replicadas do kidsService / useKids ────────────────────────

/** UC035 — Calcula KidPointsSummary a partir de lista de tasks */
interface MockTask {
  id: string;
  assigned_to: string;
  status: 'pending' | 'done';
  points: number | null;
}

function calcularPontos(
  children: Array<{ id: string; name: string; avatar_url?: string }>,
  tasks: MockTask[],
): KidPointsSummary[] {
  return children.map((child) => {
    const childTasks = tasks.filter((t) => t.assigned_to === child.id);
    const completed  = childTasks.filter((t) => t.status === 'done');
    const totalPoints = completed.reduce((sum, t) => sum + (t.points ?? 0), 0);
    return {
      child_id:        child.id,
      child_name:      child.name,
      avatar_url:      child.avatar_url,
      total_points:    totalPoints,
      completed_tasks: completed.length,
      pending_tasks:   childTasks.length - completed.length,
    };
  });
}

/** UC036 — Calcula mesada a partir de pontos e configuração */
function calcularMesada(
  childId: string,
  periodStart: string,
  periodEnd: string,
  pointsEarned: number,
  config: AllowanceConfig = { points_per_real: 10, reset_period: 'week' },
): AllowanceSummary {
  const allowanceCents = Math.round((pointsEarned / config.points_per_real) * 100);
  return {
    child_id:        childId,
    period_start:    periodStart,
    period_end:      periodEnd,
    points_earned:   pointsEarned,
    allowance_cents: allowanceCents,
  };
}

/** UC037 — Verifica quais marcos de conquista serão desbloqueados */
function verificarMarcos(
  currentPoints: number,
  existingPointsSet: Set<number>,
): typeof ACHIEVEMENT_MILESTONES {
  return ACHIEVEMENT_MILESTONES.filter(
    (m) => currentPoints >= m.points && !existingPointsSet.has(m.points),
  );
}

/** UC039 — Calcula status de tempo de tela */
function calcularStatusTela(allowed: number, used: number, date: string): ScreenTimeStatus {
  return {
    date,
    allowed_min:     allowed,
    used_min:        used,
    remaining_min:   Math.max(0, allowed - used),
    percentage_used: Math.min(100, Math.round((used / allowed) * 100)),
    over_limit:      used > allowed,
  };
}

/** Adiciona evento escolar na lista ordenada */
function adicionarEventoEscolar(lista: SchoolEvent[], novo: SchoolEvent): SchoolEvent[] {
  return [novo, ...lista].sort(
    (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
  );
}

/** Remove evento escolar */
function removerEventoEscolar(lista: SchoolEvent[], id: string): SchoolEvent[] {
  return lista.filter((e) => e.id !== id);
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const CHILD_A  = 'child-001';
const FAMILY   = 'family-001';

function makeTask(overrides: Partial<MockTask> = {}): MockTask {
  return { id: 'task-001', assigned_to: CHILD_A, status: 'pending', points: 10, ...overrides };
}

function makeSchoolEvent(overrides: Partial<SchoolEvent> = {}): SchoolEvent {
  return {
    id:          'ev-001',
    family_id:   FAMILY,
    child_id:    CHILD_A,
    school_type: 'homework',
    title:       'Tarefa de matemática',
    start_at:    '2025-07-10T09:00:00.000Z',
    all_day:     false,
    created_by:  'parent-001',
    created_at:  new Date().toISOString(),
    ...overrides,
  };
}

// ─── UC035 — Pontos ───────────────────────────────────────────────────────────

describe('calcularPontos — UC035', () => {
  it('soma pontos apenas das tarefas concluídas', () => {
    const tasks = [
      makeTask({ status: 'done', points: 10 }),
      makeTask({ id: 't2', status: 'pending', points: 5 }),
      makeTask({ id: 't3', status: 'done', points: 20 }),
    ];
    const [summary] = calcularPontos([{ id: CHILD_A, name: 'Duda' }], tasks);
    expect(summary.total_points).toBe(30);
    expect(summary.completed_tasks).toBe(2);
    expect(summary.pending_tasks).toBe(1);
  });

  it('pontos null são tratados como 0', () => {
    const tasks = [makeTask({ status: 'done', points: null })];
    const [summary] = calcularPontos([{ id: CHILD_A, name: 'Duda' }], tasks);
    expect(summary.total_points).toBe(0);
  });

  it('nenhuma tarefa → summary zerado', () => {
    const [summary] = calcularPontos([{ id: CHILD_A, name: 'Duda' }], []);
    expect(summary.total_points).toBe(0);
    expect(summary.completed_tasks).toBe(0);
    expect(summary.pending_tasks).toBe(0);
  });

  it('tarefas de outras crianças não entram no cálculo', () => {
    const tasks = [makeTask({ assigned_to: 'other-child', status: 'done', points: 50 })];
    const [summary] = calcularPontos([{ id: CHILD_A, name: 'Duda' }], tasks);
    expect(summary.total_points).toBe(0);
  });

  it('retorna um summary por criança', () => {
    const children = [{ id: CHILD_A, name: 'A' }, { id: 'child-002', name: 'B' }];
    const result = calcularPontos(children, []);
    expect(result).toHaveLength(2);
  });
});

// ─── UC036 — Mesada ───────────────────────────────────────────────────────────

describe('calcularMesada — UC036', () => {
  it('10 pontos = R$ 1,00 com config padrão', () => {
    const s = calcularMesada(CHILD_A, '2025-07-01', '2025-07-07', 10);
    expect(s.allowance_cents).toBe(100); // R$ 1,00
  });

  it('0 pontos = R$ 0,00', () => {
    const s = calcularMesada(CHILD_A, '2025-07-01', '2025-07-07', 0);
    expect(s.allowance_cents).toBe(0);
  });

  it('config 5 pontos por real: 10 pontos = R$ 2,00', () => {
    const config: AllowanceConfig = { points_per_real: 5, reset_period: 'week' };
    const s = calcularMesada(CHILD_A, '2025-07-01', '2025-07-07', 10, config);
    expect(s.allowance_cents).toBe(200);
  });

  it('arredonda centavos corretamente (1 ponto com config 3/real)', () => {
    const config: AllowanceConfig = { points_per_real: 3, reset_period: 'week' };
    const s = calcularMesada(CHILD_A, '2025-07-01', '2025-07-07', 1, config);
    // 1/3 * 100 = 33.33 → Math.round = 33
    expect(s.allowance_cents).toBe(33);
  });
});

// ─── UC037 — Conquistas ───────────────────────────────────────────────────────

describe('verificarMarcos — UC037', () => {
  it('desbloqueia marco de 10 pontos ao atingir 10', () => {
    const novos = verificarMarcos(10, new Set());
    expect(novos.some((m) => m.points === 10)).toBe(true);
  });

  it('não duplica marco já concedido', () => {
    const novos = verificarMarcos(10, new Set([10]));
    expect(novos.some((m) => m.points === 10)).toBe(false);
  });

  it('desbloqueia múltiplos marcos quando atinge 100 pontos sem histórico', () => {
    const novos = verificarMarcos(100, new Set());
    // 10, 50, 100
    expect(novos.length).toBe(3);
  });

  it('sem pontos → nenhum marco desbloqueado', () => {
    expect(verificarMarcos(0, new Set())).toHaveLength(0);
  });

  it('marcos têm title, icon e description', () => {
    for (const m of ACHIEVEMENT_MILESTONES) {
      expect(m.title).toBeTruthy();
      expect(m.icon).toBeTruthy();
      expect(m.description).toBeTruthy();
    }
  });
});

// ─── UC038 — Agenda escolar ───────────────────────────────────────────────────

describe('adicionarEventoEscolar / removerEventoEscolar — UC038', () => {
  it('adiciona e mantém ordenação por start_at', () => {
    const earlier = makeSchoolEvent({ id: 'e1', start_at: '2025-07-08T09:00:00.000Z' });
    const later   = makeSchoolEvent({ id: 'e2', start_at: '2025-07-15T09:00:00.000Z' });
    const result = adicionarEventoEscolar([later], earlier);
    expect(result[0].id).toBe('e1');
    expect(result[1].id).toBe('e2');
  });

  it('remove evento correto', () => {
    const lista = [makeSchoolEvent({ id: 'e1' }), makeSchoolEvent({ id: 'e2' })];
    expect(removerEventoEscolar(lista, 'e1')).toHaveLength(1);
    expect(removerEventoEscolar(lista, 'e1')[0].id).toBe('e2');
  });

  it('todos os tipos de evento têm label e icon', () => {
    const types: SchoolEventType[] = ['homework', 'test', 'meeting', 'trip', 'other'];
    for (const t of types) {
      expect(SCHOOL_EVENT_LABELS[t]).toBeTruthy();
      expect(SCHOOL_EVENT_ICON[t]).toBeTruthy();
    }
  });
});

// ─── UC039 — Tempo de tela ────────────────────────────────────────────────────

describe('calcularStatusTela — UC039', () => {
  const DATE = '2025-07-01';

  it('sem uso: 0% utilizado, limite não atingido', () => {
    const s = calcularStatusTela(60, 0, DATE);
    expect(s.percentage_used).toBe(0);
    expect(s.remaining_min).toBe(60);
    expect(s.over_limit).toBe(false);
  });

  it('metade do limite: 50% utilizado', () => {
    const s = calcularStatusTela(60, 30, DATE);
    expect(s.percentage_used).toBe(50);
    expect(s.remaining_min).toBe(30);
  });

  it('exatamente no limite: 100%, não excedeu', () => {
    const s = calcularStatusTela(60, 60, DATE);
    expect(s.percentage_used).toBe(100);
    expect(s.over_limit).toBe(false);
  });

  it('além do limite: over_limit = true e remaining = 0', () => {
    const s = calcularStatusTela(60, 80, DATE);
    expect(s.over_limit).toBe(true);
    expect(s.remaining_min).toBe(0);
    expect(s.percentage_used).toBe(100); // capped em 100
  });

  it('percentage_used não passa de 100 mesmo com muito uso', () => {
    const s = calcularStatusTela(30, 300, DATE);
    expect(s.percentage_used).toBe(100);
  });
});
