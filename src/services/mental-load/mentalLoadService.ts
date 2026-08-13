// src/services/mental-load/mentalLoadService.ts
// Fase 6 — UC024, UC025, UC026, UC028, UC029

import { supabase } from '@/lib/supabase';
import {
  FamilyMentalLoadSummary,
  MemberLoadSummary,
  MentalLoadDayEntry,
  MentalLoadActivityType,
  MentalLoadPeriod,
  MENTAL_LOAD_POINTS,
  ActivityHistoryEntry,
  BABY_RECORD_LABELS,
} from '@/types/differential.types';
import { UUID } from '@/types/common.types';

/**
 * Retorna o intervalo de datas para um período
 */
function getPeriodRange(period: MentalLoadPeriod): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString();

  if (period === 'week') {
    const start = new Date(now);
    start.setDate(now.getDate() - 7);
    return { start: start.toISOString(), end };
  }

  const start = new Date(now);
  start.setDate(now.getDate() - 30);
  return { start: start.toISOString(), end };
}

/**
 * Mental Load Service
 * Calcula a carga mental de cada membro com base nas atividades registradas
 * nas tabelas baby_logs, tasks e shopping_items.
 *
 * A pontuação NÃO é armazenada — é recalculada em runtime para garantir
 * consistência com as entradas reais.
 */
export const mentalLoadService = {
  /**
   * UC024 — Resumo de carga mental da família
   * Agrega pontuação de todos os membros em um período
   */
  async getFamilySummary(
    familyId: UUID,
    period: MentalLoadPeriod = 'week'
  ): Promise<FamilyMentalLoadSummary> {
    const { start, end } = getPeriodRange(period);

    // 1. Buscar membros adultos da família (exclui filhos — role='child' não executa tarefas)
    const { data: members, error: membersError } = await supabase
      .from('profiles')
      .select('id, user_id, name, avatar_url')
      .eq('family_id', familyId)
      .neq('role', 'child');

    if (membersError) throw new Error(membersError.message);
    if (!members || members.length === 0) {
      throw new Error('Nenhum membro encontrado para esta família');
    }

    // Mapa auxiliar: profile.id → user_id (para correlacionar tasks/baby_logs)
    const profileToUser: Record<UUID, UUID> = {};
    for (const m of members) {
      profileToUser[m.id] = m.user_id;
    }

    // 2. Buscar atividades do bebê por membro no período
    const { data: babyActivities } = await supabase
      .from('baby_logs')
      .select('created_by, type, created_at')
      .eq('family_id', familyId)
      .gte('created_at', start)
      .lte('created_at', end);

    // 3. Buscar tarefas concluídas por membro no período
    // UC028: usa completed_by e completed_at para atribuir ao responsável real
    const { data: completedTasks } = await supabase
      .from('tasks')
      .select('completed_by, assigned_to, priority, completed_at, category')
      .eq('family_id', familyId)
      .eq('status', 'done')
      .gte('completed_at', start)
      .lte('completed_at', end);

    // 4. Buscar itens de compra adicionados por membro no período
    const { data: shoppingItems } = await supabase
      .from('shopping_items')
      .select('added_by, created_at')
      .eq('family_id', familyId)
      .gte('created_at', start)
      .lte('created_at', end);

    // 5. Calcular pontuação por membro (chave = user_id)
    const pointsMap: Record<UUID, Record<MentalLoadActivityType, number>> = {};

    for (const m of members) {
      pointsMap[m.user_id] = {} as Record<MentalLoadActivityType, number>;
    }

    // Atividades do bebê (created_by = profile.id → converte para user_id)
    for (const act of babyActivities ?? []) {
      const userId = profileToUser[act.created_by];
      if (!userId || !pointsMap[userId]) continue;

      const type = mapBabyActivityType(act.type);
      if (!type) continue;

      pointsMap[userId][type] =
        (pointsMap[userId][type] ?? 0) + MENTAL_LOAD_POINTS[type];
    }

    // Tarefas concluídas — UC028: prioriza completed_by; fallback assigned_to
    // Ambos são profile.id → converte para user_id
    for (const task of completedTasks ?? []) {
      const profileId = task.completed_by ?? task.assigned_to;
      const userId = profileId ? profileToUser[profileId] : undefined;
      if (!userId || !pointsMap[userId]) continue;

      const type: MentalLoadActivityType =
        task.priority === 'high'
          ? 'task_high'
          : task.priority === 'medium'
            ? 'task_medium'
            : 'task_low';

      pointsMap[userId][type] =
        (pointsMap[userId][type] ?? 0) + MENTAL_LOAD_POINTS[type];
    }

    // Itens de compra (added_by = profile.id → converte para user_id)
    for (const item of shoppingItems ?? []) {
      const userId = profileToUser[item.added_by];
      if (!userId || !pointsMap[userId]) continue;

      pointsMap[userId]['shopping_item'] =
        (pointsMap[userId]['shopping_item'] ?? 0) +
        MENTAL_LOAD_POINTS['shopping_item'];
    }

    // 6. Montar resumo por membro
    const totalFamilyPoints = Object.values(pointsMap).reduce((acc, breakdown) => {
      return acc + Object.values(breakdown).reduce((a, b) => a + b, 0);
    }, 0);

    const memberSummaries: MemberLoadSummary[] = members.map(m => {
      const breakdown = pointsMap[m.user_id];
      const memberTotal = Object.values(breakdown).reduce((a, b) => a + b, 0);
      const percentage = totalFamilyPoints > 0
        ? Math.round((memberTotal / totalFamilyPoints) * 100)
        : 0;

      return {
        member_id: m.user_id,
        member_name: m.name,
        avatar_url: m.avatar_url,
        total_points: memberTotal,
        percentage,
        activity_breakdown: breakdown,
      };
    });

    // 7. Calcular métricas de equilíbrio
    const sortedByPoints = [...memberSummaries].sort(
      (a, b) => b.total_points - a.total_points
    );

    const maxPoints = sortedByPoints[0]?.total_points ?? 0;
    const minPoints = sortedByPoints[sortedByPoints.length - 1]?.total_points ?? 0;
    const maxPct = sortedByPoints[0]?.percentage ?? 0;
    const minPct = sortedByPoints[sortedByPoints.length - 1]?.percentage ?? 0;
    const imbalance = maxPct - minPct;

    return {
      family_id: familyId,
      period_start: start,
      period_end: end,
      members: memberSummaries,
      is_balanced: imbalance <= 10, // UC028: flag de desequilíbrio se diferença > 10%
      imbalance_percentage: imbalance,
      most_active_member_id: sortedByPoints[0]?.member_id ?? '',
      least_active_member_id:
        sortedByPoints[sortedByPoints.length - 1]?.member_id ?? '',
    };
  },

  /**
   * UC025 — Série temporal para o gráfico de histórico
   * Retorna pontos por dia para cada membro (baby_logs + tasks)
   */
  async getDailyHistory(
    familyId: UUID,
    period: MentalLoadPeriod = 'week'
  ): Promise<MentalLoadDayEntry[]> {
    const { start, end } = getPeriodRange(period);

    const [{ data: activities, error: actError }, { data: tasks }] = await Promise.all([
      supabase
        .from('baby_logs')
        .select('created_by, type, created_at')
        .eq('family_id', familyId)
        .gte('created_at', start)
        .lte('created_at', end),
      supabase
        .from('tasks')
        .select('completed_by, assigned_to, priority, completed_at')
        .eq('family_id', familyId)
        .eq('status', 'done')
        .gte('completed_at', start)
        .lte('completed_at', end),
    ]);

    if (actError) throw new Error(actError.message);

    // Agrupar por dia e membro
    const dayMap: Record<string, Record<UUID, number>> = {};

    for (const act of activities ?? []) {
      if (!act.created_by) continue;
      const day = act.created_at.substring(0, 10);
      const type = mapBabyActivityType(act.type);
      const pts = type ? MENTAL_LOAD_POINTS[type] : 1;

      if (!dayMap[day]) dayMap[day] = {};
      dayMap[day][act.created_by] = (dayMap[day][act.created_by] ?? 0) + pts;
    }

    for (const task of tasks ?? []) {
      const responsibleId = task.completed_by ?? task.assigned_to;
      if (!responsibleId || !task.completed_at) continue;
      const day = task.completed_at.substring(0, 10);
      const taskType: MentalLoadActivityType =
        task.priority === 'high' ? 'task_high'
        : task.priority === 'medium' ? 'task_medium'
        : 'task_low';
      const pts = MENTAL_LOAD_POINTS[taskType];

      if (!dayMap[day]) dayMap[day] = {};
      dayMap[day][responsibleId] = (dayMap[day][responsibleId] ?? 0) + pts;
    }

    const result: MentalLoadDayEntry[] = [];
    for (const [date, memberPoints] of Object.entries(dayMap)) {
      for (const [memberId, pts] of Object.entries(memberPoints)) {
        result.push({ date, member_id: memberId, points: pts });
      }
    }

    return result.sort((a, b) => a.date.localeCompare(b.date));
  },

  /**
   * UC029 — Histórico de atividades por membro
   * Listagem cronológica reversa de tasks e baby_logs
   */
  async getActivityHistory(
    familyId: UUID,
    period: MentalLoadPeriod = 'week',
    memberId?: UUID
  ): Promise<ActivityHistoryEntry[]> {
    const { start, end } = getPeriodRange(period);

    const [{ data: babyActs }, { data: taskActs }] = await Promise.all([
      supabase
        .from('baby_logs')
        .select('id, created_by, type, created_at, started_at')
        .eq('family_id', familyId)
        .gte('created_at', start)
        .lte('created_at', end),
      supabase
        .from('tasks')
        .select('id, completed_by, assigned_to, title, priority, category, completed_at')
        .eq('family_id', familyId)
        .eq('status', 'done')
        .gte('completed_at', start)
        .lte('completed_at', end),
    ]);

    const entries: ActivityHistoryEntry[] = [];

    for (const act of babyActs ?? []) {
      if (!act.created_by) continue;
      if (memberId && act.created_by !== memberId) continue;
      const actType = mapBabyActivityType(act.type);
      entries.push({
        id:            act.id,
        member_id:     act.created_by,
        title:         BABY_RECORD_LABELS[act.type] ?? act.type,
        category:      'baby',
        occurred_at:   act.started_at ?? act.created_at,
        points:        actType ? MENTAL_LOAD_POINTS[actType] : 1,
        source:        'baby_record',
      });
    }

    for (const task of taskActs ?? []) {
      if (!task.completed_at) continue;
      const responsibleId = task.completed_by ?? task.assigned_to;
      if (!responsibleId) continue;
      if (memberId && responsibleId !== memberId) continue;
      const taskType: MentalLoadActivityType =
        task.priority === 'high' ? 'task_high'
        : task.priority === 'medium' ? 'task_medium'
        : 'task_low';
      entries.push({
        id:          task.id,
        member_id:   responsibleId,
        title:       task.title,
        category:    task.category ?? 'other',
        occurred_at: task.completed_at,
        points:      MENTAL_LOAD_POINTS[taskType],
        source:      'task',
      });
    }

    // Ordem cronológica reversa (mais recente primeiro)
    return entries.sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
  },
};

/**
 * Mapeia o tipo de atividade do banco para MentalLoadActivityType
 */
function mapBabyActivityType(type: string): MentalLoadActivityType | null {
  // Mapeamento dos valores do enum baby_record_type para MentalLoadActivityType
  const map: Record<string, MentalLoadActivityType> = {
    feeding:     'feeding_bottle', // feeding_type define se é breast ou bottle
    diaper:      'diaper',
    sleep:       'sleep_monitor',
    medication:  'medication',
    note:        'feeding_bottle', // fallback — sem ponto específico para notas
  };
  return map[type] ?? null;
}
