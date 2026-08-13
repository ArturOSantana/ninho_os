// src/services/report/reportService.ts
// Relatório mensal/total para responsáveis (admin | parent)

import { supabase } from '@/lib/supabase';
import { UUID } from '@/types/common.types';

// ─── Tipos ────────────────────────────────────────────────────

export type ReportPeriod = 'month' | 'all';

export interface ReportMemberRow {
  member_id: UUID;
  member_name: string;
  avatar_url?: string;
  tasks_done: number;
  tasks_pending: number;
  baby_logs: number;
  shopping_added: number;
  couple_checkins: number;
  mental_load_points: number;
  mental_load_pct: number;
}

export interface ReportExpenseRow {
  category: string;
  total_cents: number;
  count: number;
}

export interface ReportTaskRow {
  category: string;
  done: number;
  pending: number;
}

/** Resumo de um filho no relatório */
export interface ReportChildRow {
  child_id: UUID;
  child_name: string;
  avatar_url?: string;
  // Tarefas / pontos
  tasks_done: number;
  tasks_pending: number;
  total_points: number;
  allowance_cents: number;  // pontos / 10 em centavos (1 ponto = R$ 0,10)
  // Conquistas
  achievements_total: number;
  achievements_new: number; // conquistadas no período
  // Deveres
  homework_done: number;
  homework_pending: number;
  // Alimentação
  meals_total: number;
  meals_great: number;
  meals_ok: number;
  meals_refused: number;
  // Tempo de tela (média diária em minutos no período)
  screen_time_avg_min: number;
  screen_time_over_limit_days: number;
}

/** Resumo de um bebê (baby_logs) no relatório */
export interface ReportBabyRow {
  baby_id: UUID;
  baby_name: string;
  birth_date: string;  // YYYY-MM-DD
  logs_total: number;
  logs_by_type: Array<{ type: string; label: string; count: number }>;
}

export interface FamilyReport {
  family_id: UUID;
  family_name: string;
  period: ReportPeriod;
  period_label: string;     // ex: "Maio 2025" | "Todo o período"
  generated_at: string;     // ISO 8601
  // Membros adultos
  members: ReportMemberRow[];
  // Tarefas (adultos)
  tasks_total: number;
  tasks_done: number;
  tasks_by_category: ReportTaskRow[];
  // Bebês — um item por bebê cadastrado
  babies: ReportBabyRow[];
  // Compras
  shopping_total_items: number;
  shopping_checked_items: number;
  // Gastos do casal
  expenses_total_cents: number;
  expenses_by_category: ReportExpenseRow[];
  // Carga mental
  mental_load_balanced: boolean;
  mental_load_imbalance_pct: number;
  // Filhos (role=child — crianças com login)
  children: ReportChildRow[];
}

// ─── Labels ───────────────────────────────────────────────────

const BABY_LOG_LABELS: Record<string, string> = {
  feeding:     'Alimentação',
  diaper:      'Fralda',
  sleep:       'Sono',
  medication:  'Medicação',
  weight:      'Peso',
  height:      'Altura',
  temperature: 'Temperatura',
  note:        'Anotação',
};

const EXPENSE_CAT_LABELS: Record<string, string> = {
  food:          'Alimentação',
  health:        'Saúde',
  transport:     'Transporte',
  entertainment: 'Lazer',
  home:          'Casa',
  kids:          'Crianças',
  other:         'Outros',
};

// ─── Service ──────────────────────────────────────────────────

export const reportService = {
  /**
   * Gera relatório completo da família para um período.
   * period = 'month' → mês corrente (1º ao último dia)
   * period = 'all'   → sem filtro de data
   */
  async generate(familyId: UUID, period: ReportPeriod): Promise<FamilyReport> {
    const now = new Date();

    // Cálculo do range de datas
    let startIso: string | null = null;
    let endIso: string | null = null;
    let periodLabel: string;

    if (period === 'month') {
      const y = now.getFullYear();
      const m = now.getMonth(); // 0-based
      startIso = new Date(y, m, 1).toISOString();
      endIso   = new Date(y, m + 1, 0, 23, 59, 59, 999).toISOString();
      periodLabel = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    } else {
      periodLabel = 'Todo o período';
    }

    // ── 1. Família + membros adultos + filhos + bebês ───────────
    const [
      { data: familyData },
      { data: membersData },
      { data: childrenData },
      { data: babiesData },
    ] = await Promise.all([
      supabase.from('families').select('id, name').eq('id', familyId).single(),
      supabase
        .from('profiles')
        .select('id, user_id, name, avatar_url')
        .eq('family_id', familyId)
        .neq('role', 'child'),
      supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .eq('family_id', familyId)
        .eq('role', 'child'),
      supabase
        .from('babies')
        .select('id, name, birth_date')
        .eq('family_id', familyId)
        .order('birth_date', { ascending: true }),
    ]);

    const familyName = (familyData as any)?.name ?? 'Família';
    const members: Array<{ id: UUID; user_id: UUID; name: string; avatar_url?: string }> =
      (membersData ?? []) as any;
    const children: Array<{ id: UUID; name: string; avatar_url?: string }> =
      (childrenData ?? []) as any;
    const childIds = children.map((c) => c.id);
    const babies: Array<{ id: UUID; name: string; birth_date: string }> =
      (babiesData ?? []) as any;
    const babyIds = babies.map((b) => b.id);

    const profileToUser: Record<UUID, UUID> = {};
    const userToProfile: Record<UUID, UUID> = {};
    for (const m of members) {
      profileToUser[m.id]      = m.user_id;
      userToProfile[m.user_id] = m.id;
    }

    // ── 2. Tarefas (todas — adultos e filhos) ───────────────────
    let tasksQuery = supabase
      .from('tasks')
      .select('id, status, priority, category, points, completed_by, assigned_to, completed_at, created_at')
      .eq('family_id', familyId);
    if (startIso) tasksQuery = tasksQuery.gte('created_at', startIso).lte('created_at', endIso!);
    const { data: tasksData } = await tasksQuery;
    const tasks = (tasksData ?? []) as any[];
    // Separa tarefas de adultos vs filhos
    const adultTasks = tasks.filter(
      (t) => !childIds.includes(t.assigned_to) || t.completed_by,
    );
    const childTasks = tasks.filter((t) => childIds.includes(t.assigned_to));

    // ── 3. Baby logs (com baby_id para separar por bebê) ────────
    let babyQuery = supabase
      .from('baby_logs')
      .select('id, baby_id, type, created_by, created_at')
      .eq('family_id', familyId);
    if (startIso) babyQuery = babyQuery.gte('created_at', startIso).lte('created_at', endIso!);
    const { data: babyData } = await babyQuery;
    const babyLogs = (babyData ?? []) as any[];

    // ── 4. Compras ──────────────────────────────────────────────
    let shoppingQuery = supabase
      .from('shopping_items')
      .select('id, checked, added_by, created_at')
      .eq('family_id', familyId);
    if (startIso) shoppingQuery = shoppingQuery.gte('created_at', startIso).lte('created_at', endIso!);
    const { data: shoppingData } = await shoppingQuery;
    const shoppingItems = (shoppingData ?? []) as any[];

    // ── 5. Gastos do casal ──────────────────────────────────────
    let expensesQuery = supabase
      .from('couple_expenses')
      .select('id, amount_cents, category, paid_by, expense_date')
      .eq('family_id', familyId);
    if (startIso) {
      const startDate = startIso.split('T')[0];
      const endDate   = endIso!.split('T')[0];
      expensesQuery = expensesQuery.gte('expense_date', startDate).lte('expense_date', endDate);
    }
    const { data: expensesData } = await expensesQuery;
    const expenses = (expensesData ?? []) as any[];

    // ── 6. Check-ins do casal ───────────────────────────────────
    let checkinsQuery = supabase
      .from('couple_checkins')
      .select('id, member_id, checked_at')
      .eq('family_id', familyId);
    if (startIso) {
      const startDate = startIso.split('T')[0];
      const endDate   = endIso!.split('T')[0];
      checkinsQuery = checkinsQuery.gte('checked_at', startDate).lte('checked_at', endDate);
    }
    const { data: checkinsData } = await checkinsQuery;
    const checkins = (checkinsData ?? []) as any[];

    // ── 7. Queries paralelas dos filhos ─────────────────────────
    const startDate = startIso ? startIso.split('T')[0] : null;
    const endDate   = endIso   ? endIso.split('T')[0]   : null;

    const childrenRows: ReportChildRow[] = [];

    if (childIds.length > 0) {
      // Conquistas
      let achievQuery = supabase
        .from('child_achievements')
        .select('child_id, awarded_at')
        .eq('family_id', familyId)
        .in('child_id', childIds);
      const { data: allAchievs } = await achievQuery;

      // Deveres
      let hwQuery = supabase
        .from('child_homework')
        .select('child_id, done, due_date')
        .eq('family_id', familyId)
        .in('child_id', childIds);
      if (startDate) hwQuery = hwQuery.gte('due_date', startDate);
      if (endDate)   hwQuery = hwQuery.lte('due_date', endDate);
      const { data: allHomework } = await hwQuery;

      // Refeições
      let mealsQuery = supabase
        .from('child_meals')
        .select('child_id, rating, date')
        .eq('family_id', familyId)
        .in('child_id', childIds);
      if (startDate) mealsQuery = mealsQuery.gte('date', startDate);
      if (endDate)   mealsQuery = mealsQuery.lte('date', endDate);
      const { data: allMeals } = await mealsQuery;

      // Tempo de tela
      let screenQuery = supabase
        .from('screen_time_logs')
        .select('child_id, date, allowed_min, used_min')
        .eq('family_id', familyId)
        .in('child_id', childIds);
      if (startDate) screenQuery = screenQuery.gte('date', startDate);
      if (endDate)   screenQuery = screenQuery.lte('date', endDate);
      const { data: allScreen } = await screenQuery;

      for (const child of children) {
        const cid = child.id;

        // Tarefas do filho
        const cTasks     = childTasks.filter((t) => t.assigned_to === cid);
        const cDone      = cTasks.filter((t) => t.status === 'done');
        const cPending   = cTasks.filter((t) => t.status !== 'done');
        const totalPts   = cDone.reduce((s: number, t: any) => s + (t.points ?? 0), 0);

        // Conquistas
        const cAchievs      = (allAchievs ?? []).filter((a: any) => a.child_id === cid);
        const cAchievNew    = startDate
          ? cAchievs.filter((a: any) => a.awarded_at >= startIso!)
          : cAchievs;

        // Deveres
        const cHw        = (allHomework ?? []).filter((h: any) => h.child_id === cid);
        const cHwDone    = cHw.filter((h: any) => h.done).length;
        const cHwPending = cHw.filter((h: any) => !h.done).length;

        // Refeições
        const cMeals   = (allMeals ?? []).filter((m: any) => m.child_id === cid);
        const mGreat   = cMeals.filter((m: any) => m.rating === 'great').length;
        const mOk      = cMeals.filter((m: any) => m.rating === 'ok').length;
        const mRefused = cMeals.filter((m: any) => m.rating === 'refused').length;

        // Tempo de tela
        const cScreen     = (allScreen ?? []).filter((s: any) => s.child_id === cid);
        const avgMin      = cScreen.length > 0
          ? Math.round(cScreen.reduce((s: number, r: any) => s + (r.used_min ?? 0), 0) / cScreen.length)
          : 0;
        const overDays    = cScreen.filter((r: any) => (r.used_min ?? 0) > (r.allowed_min ?? 0)).length;

        childrenRows.push({
          child_id:                  cid,
          child_name:                child.name,
          avatar_url:                child.avatar_url,
          tasks_done:                cDone.length,
          tasks_pending:             cPending.length,
          total_points:              totalPts,
          allowance_cents:           Math.round((totalPts / 10) * 100),
          achievements_total:        cAchievs.length,
          achievements_new:          cAchievNew.length,
          homework_done:             cHwDone,
          homework_pending:          cHwPending,
          meals_total:               cMeals.length,
          meals_great:               mGreat,
          meals_ok:                  mOk,
          meals_refused:             mRefused,
          screen_time_avg_min:       avgMin,
          screen_time_over_limit_days: overDays,
        });
      }
    }

    // ── 8. Agrega por membro adulto ─────────────────────────────
    const memberMap: Record<UUID, ReportMemberRow> = {};
    for (const m of members) {
      memberMap[m.id] = {
        member_id:          m.id,
        member_name:        m.name,
        avatar_url:         m.avatar_url,
        tasks_done:         0,
        tasks_pending:      0,
        baby_logs:          0,
        shopping_added:     0,
        couple_checkins:    0,
        mental_load_points: 0,
        mental_load_pct:    0,
      };
    }

    // Tarefas por membro adulto (exclui tarefas exclusivas de filhos)
    for (const t of adultTasks) {
      const profileId = t.completed_by ?? t.assigned_to;
      if (profileId && memberMap[profileId]) {
        if (t.status === 'done') memberMap[profileId].tasks_done++;
        else                     memberMap[profileId].tasks_pending++;
      }
    }

    // Baby logs por membro (created_by = profile.id)
    for (const l of babyLogs) {
      if (l.created_by && memberMap[l.created_by]) {
        memberMap[l.created_by].baby_logs++;
      }
    }

    // Compras por membro (added_by = profile.id)
    for (const s of shoppingItems) {
      if (s.added_by && memberMap[s.added_by]) {
        memberMap[s.added_by].shopping_added++;
      }
    }

    // Check-ins por membro (member_id = profile.id)
    for (const c of checkins) {
      if (c.member_id && memberMap[c.member_id]) {
        memberMap[c.member_id].couple_checkins++;
      }
    }

    // Pontos de carga mental simplificados (tarefas + baby_logs)
    const POINTS: Record<string, number> = {
      feeding: 2, diaper: 1, sleep: 1, medication: 3,
      weight: 1, height: 1, temperature: 1, note: 1,
      task_high: 4, task_medium: 2, task_low: 1,
    };
    for (const l of babyLogs) {
      if (l.created_by && memberMap[l.created_by]) {
        memberMap[l.created_by].mental_load_points += POINTS[l.type] ?? 1;
      }
    }
    for (const t of tasks) {
      if (t.status === 'done') {
        const profileId = t.completed_by ?? t.assigned_to;
        if (profileId && memberMap[profileId]) {
          const key = `task_${t.priority}`;
          memberMap[profileId].mental_load_points += POINTS[key] ?? 1;
        }
      }
    }

    const totalPoints = Object.values(memberMap).reduce((s, m) => s + m.mental_load_points, 0);
    for (const row of Object.values(memberMap)) {
      row.mental_load_pct = totalPoints > 0
        ? Math.round((row.mental_load_points / totalPoints) * 100)
        : 0;
    }

    // ── 9. Tarefas adultas por categoria ────────────────────────
    const taskCatMap: Record<string, { done: number; pending: number }> = {};
    for (const t of adultTasks) {
      const cat = t.category ?? 'other';
      if (!taskCatMap[cat]) taskCatMap[cat] = { done: 0, pending: 0 };
      if (t.status === 'done') taskCatMap[cat].done++;
      else taskCatMap[cat].pending++;
    }
    const tasksByCategory: ReportTaskRow[] = Object.entries(taskCatMap).map(([category, v]) => ({
      category, ...v,
    }));

    // ── 10. Baby logs — separados por bebê ─────────────────────
    const babyRows: ReportBabyRow[] = babies.map((b) => {
      const logs = babyLogs.filter((l: any) => l.baby_id === b.id);
      const typeMap: Record<string, number> = {};
      for (const l of logs) {
        typeMap[l.type] = (typeMap[l.type] ?? 0) + 1;
      }
      return {
        baby_id:    b.id,
        baby_name:  b.name,
        birth_date: b.birth_date,
        logs_total: logs.length,
        logs_by_type: Object.entries(typeMap).map(([type, count]) => ({
          type, label: BABY_LOG_LABELS[type] ?? type, count,
        })),
      };
    });
    // Fallback: se não há bebês cadastrados mas há logs (dado legado sem baby_id)
    if (babies.length === 0 && babyLogs.length > 0) {
      const typeMap: Record<string, number> = {};
      for (const l of babyLogs) {
        typeMap[l.type] = (typeMap[l.type] ?? 0) + 1;
      }
      babyRows.push({
        baby_id:    'unknown',
        baby_name:  'Bebê',
        birth_date: '',
        logs_total: babyLogs.length,
        logs_by_type: Object.entries(typeMap).map(([type, count]) => ({
          type, label: BABY_LOG_LABELS[type] ?? type, count,
        })),
      });
    }

    // ── 11. Gastos por categoria ────────────────────────────────
    const expCatMap: Record<string, { total: number; count: number }> = {};
    for (const e of expenses) {
      const cat = e.category ?? 'other';
      if (!expCatMap[cat]) expCatMap[cat] = { total: 0, count: 0 };
      expCatMap[cat].total += e.amount_cents;
      expCatMap[cat].count++;
    }
    const expensesByCategory: ReportExpenseRow[] = Object.entries(expCatMap).map(
      ([category, v]) => ({
        category,
        total_cents: v.total,
        count: v.count,
      }),
    );

    // ── 12. Carga mental — equilíbrio ───────────────────────────
    const pts = Object.values(memberMap).map((m) => m.mental_load_pct);
    const maxPct = Math.max(...pts, 0);
    const minPct = Math.min(...pts, 0);
    const imbalance = pts.length >= 2 ? maxPct - minPct : 0;

    return {
      family_id:                  familyId,
      family_name:                familyName,
      period,
      period_label:               periodLabel,
      generated_at:               now.toISOString(),
      members:                    Object.values(memberMap),
      tasks_total:                adultTasks.length,
      tasks_done:                 adultTasks.filter((t) => t.status === 'done').length,
      tasks_by_category:          tasksByCategory,
      babies:                     babyRows,
      shopping_total_items:       shoppingItems.length,
      shopping_checked_items:     shoppingItems.filter((s) => s.checked).length,
      expenses_total_cents:       expenses.reduce((s, e) => s + (e.amount_cents ?? 0), 0),
      expenses_by_category:       expensesByCategory,
      mental_load_balanced:       imbalance <= 10,
      mental_load_imbalance_pct:  imbalance,
      children:                   childrenRows,
    };
  },
};
