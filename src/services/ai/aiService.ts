// src/services/ai/aiService.ts
// Fase 6 — Insights automáticos (análise local, sem chamada a APIs externas no MVP)

import { supabase } from '@/lib/supabase';
import {
  AIInsight,
  InsightCategory,
  InsightSeverity,
  WeeklySummary,
} from '@/types/differential.types';
import { UUID } from '@/types/common.types';

/**
 * Gera um ID simples e reprodutível para um insight
 * (evita duplicatas na lista se o hook re-executar)
 */
function makeInsightId(category: InsightCategory, seed: string): string {
  return `${category}-${seed}`;
}

/**
 * AI Service (Preview — MVP)
 * Gera insights por análise de padrões nos dados existentes do Supabase.
 * Não faz chamadas a APIs externas — toda a lógica roda no cliente.
 * Na Fase 7+ isso será substituído por chamadas a um modelo LLM.
 */
export const aiService = {
  /**
   * UC026 — Gerar insights automáticos para a família
   */
  async generateInsights(
    familyId: UUID,
    babyId?: UUID
  ): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    // ── 1. Padrão de sono ───────────────────────────────────────────
    if (babyId) {
      const { data: sleepRecords } = await supabase
        .from('baby_logs')
        .select('started_at, ended_at')
        .eq('family_id', familyId)
        .eq('baby_id', babyId)
        .eq('type', 'sleep')
        .gte('created_at', weekAgo.toISOString())
        .order('created_at', { ascending: false });

      if (sleepRecords && sleepRecords.length > 0) {
        const avgMinutes =
          sleepRecords.reduce((acc, r) => {
            if (!r.started_at || !r.ended_at) return acc;
            return acc + (new Date(r.ended_at).getTime() - new Date(r.started_at).getTime()) / 60000;
          }, 0) / sleepRecords.length;
        const avgHours = avgMinutes / 60;

        if (avgHours < 14) {
          insights.push({
            id: makeInsightId('sleep_pattern', weekAgo.toISOString().substring(0, 10)),
            family_id: familyId,
            baby_id: babyId,
            category: 'sleep_pattern',
            severity: 'warning',
            title: 'Sono abaixo do ideal',
            description: `O bebê dormiu em média ${avgHours.toFixed(1)}h/dia esta semana. Para a faixa etária, o recomendado é 14-17h.`,
            suggested_action: 'Considere estabelecer uma rotina de sono mais consistente.',
            generated_at: now.toISOString(),
            data_points: sleepRecords.length,
          });
        } else if (avgHours >= 15) {
          insights.push({
            id: makeInsightId('sleep_pattern', `good-${weekAgo.toISOString().substring(0, 10)}`),
            family_id: familyId,
            baby_id: babyId,
            category: 'sleep_pattern',
            severity: 'positive',
            title: 'Sono regulado 🌙',
            description: `Ótimo! O bebê dormiu em média ${avgHours.toFixed(1)}h/dia — dentro do intervalo ideal.`,
            generated_at: now.toISOString(),
            data_points: sleepRecords.length,
          });
        }
      }

      // ── 2. Padrão de alimentação ──────────────────────────────────
      const { data: feedingRecords } = await supabase
        .from('baby_logs')
        .select('created_at')
        .eq('family_id', familyId)
        .eq('baby_id', babyId)
        .eq('type', 'feeding')
        .gte('created_at', weekAgo.toISOString());

      if (feedingRecords && feedingRecords.length > 0) {
        const avgPerDay = feedingRecords.length / 7;

        if (avgPerDay < 6) {
          insights.push({
            id: makeInsightId('feeding_pattern', weekAgo.toISOString().substring(0, 10)),
            family_id: familyId,
            baby_id: babyId,
            category: 'feeding_pattern',
            severity: 'warning',
            title: 'Poucas mamadas registradas',
            description: `Foram registradas em média ${avgPerDay.toFixed(1)} mamadas/dia. Para recém-nascidos, o normal é 8-12x/dia.`,
            suggested_action: 'Verifique se todos os registros estão sendo feitos ou consulte seu pediatra.',
            generated_at: now.toISOString(),
            data_points: feedingRecords.length,
          });
        }
      }
    }

    // ── 3. Tarefas em atraso ───────────────────────────────────────
    const { data: overdueTasks } = await supabase
      .from('tasks')
      .select('id')
      .eq('family_id', familyId)
      .neq('status', 'done')
      .lt('due_date', now.toISOString());

    if (overdueTasks && overdueTasks.length > 0) {
      insights.push({
        id: makeInsightId('task_overdue', String(overdueTasks.length)),
        family_id: familyId,
        category: 'task_overdue',
        severity: 'warning',
        title: `${overdueTasks.length} tarefa${overdueTasks.length > 1 ? 's' : ''} em atraso`,
        description: `Existem ${overdueTasks.length} tarefa${overdueTasks.length > 1 ? 's' : ''} com prazo vencido. Considere reatribuí-las ou atualizá-las.`,
        suggested_action: 'Abra a lista de tarefas e revise os prazos.',
        generated_at: now.toISOString(),
        data_points: overdueTasks.length,
      });
    }

    // ── 4. Desequilíbrio de carga mental ──────────────────────────
    const { data: activities } = await supabase
      .from('baby_logs')
      .select('created_by')
      .eq('family_id', familyId)
      .gte('created_at', weekAgo.toISOString());

    if (activities && activities.length > 0) {
      const countMap: Record<string, number> = {};
      for (const act of activities) {
        if (!act.created_by) continue;
        countMap[act.created_by] = (countMap[act.created_by] ?? 0) + 1;
      }

      const counts = Object.values(countMap);
      if (counts.length >= 2) {
        const max = Math.max(...counts);
        const min = Math.min(...counts);
        const total = counts.reduce((a, b) => a + b, 0);
        const imbalancePct = Math.round(((max - min) / total) * 100);

        if (imbalancePct > 30) {
          insights.push({
            id: makeInsightId('mental_load', weekAgo.toISOString().substring(0, 10)),
            family_id: familyId,
            category: 'mental_load',
            severity: 'warning',
            title: 'Carga mental desbalanceada',
            description: `Um parceiro assumiu ${imbalancePct}% mais tarefas esta semana. Conversem sobre redistribuir as responsabilidades.`,
            suggested_action: 'Acesse o painel de Carga Mental para ver os detalhes.',
            generated_at: now.toISOString(),
            data_points: activities.length,
          });
        }
      }
    }

    return insights;
  },

  /**
   * Gerar resumo semanal da família
   */
  async getWeeklySummary(
    familyId: UUID,
    babyId?: UUID
  ): Promise<WeeklySummary> {
    const now = new Date();
    // Início da semana (segunda-feira)
    const dayOfWeek = now.getDay(); // 0 = domingo
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekStartISO = weekStart.toISOString();
    const weekEndISO = weekEnd.toISOString();

    const filters = babyId
      ? { family_id: familyId, baby_id: babyId }
      : { family_id: familyId };

    // Mamadas
    const { count: feedingCount } = await supabase
      .from('baby_logs')
      .select('*', { count: 'exact', head: true })
      .match(filters)
      .eq('type', 'feeding')
      .gte('created_at', weekStartISO)
      .lte('created_at', weekEndISO);

    // Trocas
    const { count: diaperCount } = await supabase
      .from('baby_logs')
      .select('*', { count: 'exact', head: true })
      .match(filters)
      .eq('type', 'diaper')
      .gte('created_at', weekStartISO)
      .lte('created_at', weekEndISO);

    // Sono — média de horas (calculado via started_at/ended_at)
    const { data: sleepData } = await supabase
      .from('baby_logs')
      .select('started_at, ended_at')
      .match(filters)
      .eq('type', 'sleep')
      .gte('created_at', weekStartISO)
      .lte('created_at', weekEndISO);

    const avgSleepMinutes =
      sleepData && sleepData.length > 0
        ? sleepData.reduce((a, r) => {
            if (!r.started_at || !r.ended_at) return a;
            return a + (new Date(r.ended_at).getTime() - new Date(r.started_at).getTime()) / 60000;
          }, 0) / sleepData.length
        : 0;

    // Tarefas
    const { count: tasksCompleted } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('family_id', familyId)
      .eq('status', 'done')
      .gte('updated_at', weekStartISO)
      .lte('updated_at', weekEndISO);

    const { count: tasksPending } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('family_id', familyId)
      .neq('status', 'done');

    // Membro mais ativo
    const { data: activityCounts } = await supabase
      .from('baby_logs')
      .select('created_by')
      .eq('family_id', familyId)
      .gte('created_at', weekStartISO)
      .lte('created_at', weekEndISO);

    let mostActiveMemberId = '';
    if (activityCounts && activityCounts.length > 0) {
      const map: Record<string, number> = {};
      for (const r of activityCounts) {
        if (!r.created_by) continue;
        map[r.created_by] = (map[r.created_by] ?? 0) + 1;
      }
      mostActiveMemberId = Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
    }

    // Buscar nome do membro mais ativo
    let mostActiveName = 'Não identificado';
    if (mostActiveMemberId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', mostActiveMemberId)
        .single();
      mostActiveName = profile?.name ?? mostActiveName;
    }

    // Gerar insights para o resumo
    const insights = await aiService.generateInsights(familyId, babyId);

    return {
      family_id: familyId,
      week_start: weekStart.toISOString().substring(0, 10),
      week_end: weekEnd.toISOString().substring(0, 10),
      total_feedings: feedingCount ?? 0,
      total_diaper_changes: diaperCount ?? 0,
      avg_sleep_hours: Math.round((avgSleepMinutes / 60) * 10) / 10,
      tasks_completed: tasksCompleted ?? 0,
      tasks_pending: tasksPending ?? 0,
      most_active_member: mostActiveName,
      insights,
    };
  },
};
