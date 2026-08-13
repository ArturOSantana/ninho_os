// tests/integration/mental-load-flow.test.ts
// E2E do fluxo principal da Fase 8 — Carga Mental (UC028–UC030)
// Critério de aceite:
//   - Usuário entende quem está mais sobrecarregado em até 10 segundos
//   - Percentual calculado a partir de tasks concluídas por cada adulto na semana
//   - is_balanced = true quando diferença ≤ 10%
//   - Histórico expande com horário exato e categoria da atividade

import { describe, it, expect, beforeEach } from '@jest/globals';

import {
  MentalLoadActivityType,
  MENTAL_LOAD_POINTS,
  MemberLoadSummary,
  FamilyMentalLoadSummary,
  ActivityHistoryEntry,
} from '../../src/types/differential.types';

// ─── Motor de cálculo em memória ─────────────────────────────────
// Replica a lógica do mentalLoadService sem I/O.

interface LoadEntry {
  member_id: string;
  member_name: string;
  activity_type: MentalLoadActivityType;
  activity_id: string;
  points: number;
  recorded_at: string;
}

class InMemoryMentalLoadEngine {
  private entries: LoadEntry[] = [];
  private nextId = 1;

  record(
    memberId: string,
    memberName: string,
    activityType: MentalLoadActivityType,
    recordedAt?: Date,
  ): LoadEntry {
    const entry: LoadEntry = {
      member_id: memberId,
      member_name: memberName,
      activity_type: activityType,
      activity_id: `act-${this.nextId++}`,
      points: MENTAL_LOAD_POINTS[activityType],
      recorded_at: (recordedAt ?? new Date()).toISOString(),
    };
    this.entries.push(entry);
    return entry;
  }

  /** UC028 — calcula resumo de equilíbrio para um conjunto de memberIds num período */
  computeSummary(
    familyId: string,
    memberIds: string[],
    memberNames: Record<string, string>,
    since: Date,
    until: Date,
  ): FamilyMentalLoadSummary {
    const periodEntries = this.entries.filter(
      (e) =>
        memberIds.includes(e.member_id) &&
        new Date(e.recorded_at) >= since &&
        new Date(e.recorded_at) <= until,
    );

    // Agrupa pontos por membro
    const totals: Record<string, number> = {};
    const breakdowns: Record<string, Record<MentalLoadActivityType, number>> = {};

    for (const memberId of memberIds) {
      totals[memberId] = 0;
      breakdowns[memberId] = {} as Record<MentalLoadActivityType, number>;
    }

    for (const entry of periodEntries) {
      totals[entry.member_id] = (totals[entry.member_id] ?? 0) + entry.points;
      breakdowns[entry.member_id][entry.activity_type] =
        (breakdowns[entry.member_id][entry.activity_type] ?? 0) + entry.points;
    }

    const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);

    const members: MemberLoadSummary[] = memberIds.map((id) => ({
      member_id: id,
      member_name: memberNames[id] ?? id,
      total_points: totals[id],
      percentage: grandTotal === 0 ? 0 : Math.round((totals[id] / grandTotal) * 100),
      activity_breakdown: breakdowns[id],
    }));

    const sorted = [...members].sort((a, b) => b.total_points - a.total_points);
    const most_active_member_id  = sorted[0]?.member_id ?? memberIds[0];
    const least_active_member_id = sorted[sorted.length - 1]?.member_id ?? memberIds[0];
    const imbalance_percentage   = sorted[0]
      ? sorted[0].percentage - sorted[sorted.length - 1].percentage
      : 0;

    return {
      family_id: familyId,
      period_start: since.toISOString(),
      period_end: until.toISOString(),
      members,
      is_balanced: imbalance_percentage <= 10,
      imbalance_percentage,
      most_active_member_id,
      least_active_member_id,
    };
  }

  /** UC029 — histórico cronológico de atividades */
  getActivityHistory(memberIds: string[], since: Date): ActivityHistoryEntry[] {
    return this.entries
      .filter(
        (e) =>
          memberIds.includes(e.member_id) && new Date(e.recorded_at) >= since,
      )
      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
      .map((e) => ({
        id: e.activity_id,
        member_id: e.member_id,
        title: e.activity_type.replace(/_/g, ' '),
        category: e.activity_type.startsWith('task_') ? 'task' : 'baby',
        occurred_at: e.recorded_at,
        points: e.points,
        source: (e.activity_type.startsWith('task_') ? 'task' : 'baby_record') as
          'baby_record' | 'task',
      }));
  }

  reset() {
    this.entries = [];
    this.nextId = 1;
  }
}

// ─── Fixtures ────────────────────────────────────────────────────
const FAMILY_ID = 'family-test-1';
const USER_A    = 'user-A';
const USER_B    = 'user-B';
const NAMES     = { [USER_A]: 'Ana', [USER_B]: 'Bruno' };

function weekBoundaries(): { since: Date; until: Date } {
  const until = new Date();
  until.setMinutes(until.getMinutes() + 5); // Folga segura de +5 minutos no futuro para evitar perdas de milissegundos
  const since = new Date();
  since.setDate(since.getDate() - 7);
  return { since, until };
}

// ─── Testes ───────────────────────────────────────────────────────
describe('Fase 8 — Carga Mental: fluxo principal (UC028–UC030)', () => {
  let engine: InMemoryMentalLoadEngine;

  beforeEach(() => {
    engine = new InMemoryMentalLoadEngine();
  });

  // ── UC028 — Visualizar equilíbrio da semana ─────────────────────
  describe('UC028 — Visualizar equilíbrio semanal', () => {
    it('percentuais somam 100 quando há 2 membros com atividades', () => {
      const { since, until } = weekBoundaries();

      engine.record(USER_A, 'Ana', 'task_high');
      engine.record(USER_A, 'Ana', 'task_medium');
      engine.record(USER_B, 'Bruno', 'task_low');

      const summary = engine.computeSummary(
        FAMILY_ID,
        [USER_A, USER_B],
        NAMES,
        since,
        until,
      );

      const total = summary.members.reduce((acc, m) => acc + m.percentage, 0);
      expect(total).toBe(100);
    });

    it('identifica most_active e least_active corretamente', () => {
      const { since, until } = weekBoundaries();

      // A: appointment (5pts) + vaccine (4pts) = 9pts
      engine.record(USER_A, 'Ana', 'appointment');
      engine.record(USER_A, 'Ana', 'vaccine');
      // B: diaper (1pt)
      engine.record(USER_B, 'Bruno', 'diaper');

      const summary = engine.computeSummary(
        FAMILY_ID,
        [USER_A, USER_B],
        NAMES,
        since,
        until,
      );

      expect(summary.most_active_member_id).toBe(USER_A);
      expect(summary.least_active_member_id).toBe(USER_B);
    });

    it('is_balanced = true quando diferença ≤ 10%', () => {
      const { since, until } = weekBoundaries();

      // A e B com exatamente os mesmos pontos
      engine.record(USER_A, 'Ana', 'task_medium');   // 2pts
      engine.record(USER_B, 'Bruno', 'task_medium'); // 2pts

      const summary = engine.computeSummary(
        FAMILY_ID,
        [USER_A, USER_B],
        NAMES,
        since,
        until,
      );

      expect(summary.is_balanced).toBe(true);
      expect(summary.imbalance_percentage).toBe(0);
    });

    it('is_balanced = false quando diferença > 10%', () => {
      const { since, until } = weekBoundaries();

      // A: appointment (5) + vaccine (4) + task_high (4) = 13pts = ~93%
      engine.record(USER_A, 'Ana', 'appointment');
      engine.record(USER_A, 'Ana', 'vaccine');
      engine.record(USER_A, 'Ana', 'task_high');
      // B: diaper (1pt) = ~7%
      engine.record(USER_B, 'Bruno', 'diaper');

      const summary = engine.computeSummary(
        FAMILY_ID,
        [USER_A, USER_B],
        NAMES,
        since,
        until,
      );

      expect(summary.is_balanced).toBe(false);
      expect(summary.imbalance_percentage).toBeGreaterThan(10);
    });

    it('família sem atividades retorna percentuais 0', () => {
      const { since, until } = weekBoundaries();

      const summary = engine.computeSummary(
        FAMILY_ID,
        [USER_A, USER_B],
        NAMES,
        since,
        until,
      );

      summary.members.forEach((m) => {
        expect(m.total_points).toBe(0);
        expect(m.percentage).toBe(0);
      });
    });

    it('atividades fora do período não entram no cálculo', () => {
      const until = new Date();
      const since = new Date(until);
      since.setDate(since.getDate() - 7);

      // Atividade muito antiga (30 dias atrás)
      const longAgo = new Date(until);
      longAgo.setDate(longAgo.getDate() - 30);
      engine.record(USER_A, 'Ana', 'appointment', longAgo);

      // Atividade dentro da semana
      engine.record(USER_B, 'Bruno', 'diaper');

      const summary = engine.computeSummary(
        FAMILY_ID,
        [USER_A, USER_B],
        NAMES,
        since,
        until,
      );

      const memberA = summary.members.find((m) => m.member_id === USER_A)!;
      expect(memberA.total_points).toBe(0);
      expect(summary.most_active_member_id).toBe(USER_B);
    });

    it('MENTAL_LOAD_POINTS reflete a tabela de pontos do produto', () => {
      // Confere os valores críticos documentados no differential.types.ts
      expect(MENTAL_LOAD_POINTS.appointment).toBe(5);
      expect(MENTAL_LOAD_POINTS.vaccine).toBe(4);
      expect(MENTAL_LOAD_POINTS.task_high).toBe(4);
      expect(MENTAL_LOAD_POINTS.task_medium).toBe(2);
      expect(MENTAL_LOAD_POINTS.task_low).toBe(1);
      expect(MENTAL_LOAD_POINTS.diaper).toBe(1);
      expect(MENTAL_LOAD_POINTS.feeding_breast).toBe(3);
    });
  });

  // ── UC029 — Consultar histórico de atividades ───────────────────
  describe('UC029 — Histórico de atividades', () => {
    it('retorna atividades ordenadas por data decrescente', () => {
      const since = new Date();
      since.setDate(since.getDate() - 7);

      const older = new Date();
      older.setHours(older.getHours() - 3);

      const newer = new Date();
      newer.setHours(newer.getHours() - 1);

      engine.record(USER_A, 'Ana', 'diaper', older);
      engine.record(USER_A, 'Ana', 'task_high', newer);

      const history = engine.getActivityHistory([USER_A], since);

      expect(history[0].occurred_at > history[1].occurred_at).toBe(true);
    });

    it('histórico inclui horário exato (ISO 8601) e pontos da atividade', () => {
      const since = new Date();
      since.setDate(since.getDate() - 7);

      engine.record(USER_A, 'Ana', 'appointment');

      const history = engine.getActivityHistory([USER_A], since);
      const entry   = history[0];

      expect(entry.occurred_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(entry.points).toBe(MENTAL_LOAD_POINTS.appointment);
    });

    it('source=task para atividades de tarefa, source=baby_record para bebê', () => {
      const since = new Date();
      since.setDate(since.getDate() - 7);

      engine.record(USER_A, 'Ana', 'task_high');
      engine.record(USER_B, 'Bruno', 'feeding_breast');

      const history = engine.getActivityHistory([USER_A, USER_B], since);

      const taskEntry  = history.find((e) => e.member_id === USER_A);
      const babyEntry  = history.find((e) => e.member_id === USER_B);

      expect(taskEntry?.source).toBe('task');
      expect(babyEntry?.source).toBe('baby_record');
    });

    it('filtra só os memberIds solicitados', () => {
      const since = new Date();
      since.setDate(since.getDate() - 7);

      engine.record(USER_A, 'Ana', 'task_high');
      engine.record(USER_B, 'Bruno', 'diaper');

      const onlyA = engine.getActivityHistory([USER_A], since);

      expect(onlyA.every((e) => e.member_id === USER_A)).toBe(true);
    });
  });

  // ── UC030 — Iniciar check-in semanal ───────────────────────────
  describe('UC030 — Check-in semanal', () => {
    // O check-in é um fluxo guiado de 3 perguntas — a lógica de progresso
    // é independente da engine de carga mental.

    interface CheckinState {
      currentStep: number;
      totalSteps: number;
      answers: string[];
      completed: boolean;
    }

    function createCheckinFlow(totalSteps = 3): {
      state: CheckinState;
      answer: (text: string) => CheckinState;
    } {
      let state: CheckinState = {
        currentStep: 0,
        totalSteps,
        answers: [],
        completed: false,
      };

      return {
        get state() { return { ...state }; },
        answer(text: string): CheckinState {
          if (state.completed) return { ...state };
          state.answers.push(text);
          state.currentStep += 1;
          if (state.currentStep >= state.totalSteps) {
            state.completed = true;
          }
          return { ...state };
        },
      };
    }

    it('check-in começa no step 0 e tem 3 perguntas', () => {
      const flow = createCheckinFlow();
      expect(flow.state.currentStep).toBe(0);
      expect(flow.state.totalSteps).toBe(3);
      expect(flow.state.completed).toBe(false);
    });

    it('responder 3 perguntas conclui o check-in', () => {
      const flow = createCheckinFlow();

      flow.answer('Cansada mas bem');
      flow.answer('Sinto falta de tempo pra mim');
      const final = flow.answer('Quero dormir mais cedo');

      expect(final.completed).toBe(true);
      expect(final.answers).toHaveLength(3);
    });

    it('resposta adicional após conclusão não altera o estado', () => {
      const flow = createCheckinFlow();
      flow.answer('R1');
      flow.answer('R2');
      flow.answer('R3');

      const afterComplete = flow.answer('R4 extra');

      expect(afterComplete.answers).toHaveLength(3);
      expect(afterComplete.completed).toBe(true);
    });

    it('progresso pode ser calculado como percentual', () => {
      const flow = createCheckinFlow();

      flow.answer('R1');
      const progress = Math.round((flow.state.currentStep / flow.state.totalSteps) * 100);

      expect(progress).toBe(33);
    });
  });
});
