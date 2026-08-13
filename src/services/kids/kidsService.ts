// src/services/kids/kidsService.ts
// Módulo Filhos V2/V3 — UC035–042

import { supabase } from '@/lib/supabase';
import { UUID } from '@/types/common.types';
import { Task } from '@/types/productivity.types';
import {
  KidPointsSummary,
  AllowanceSummary,
  AllowanceConfig,
  ChildAchievement,
  CreateAchievementInput,
  SchoolEvent,
  CreateSchoolEventInput,
  ScreenTimeLog,
  UpsertScreenTimeInput,
  ScreenTimeStatus,
  ACHIEVEMENT_MILESTONES,
  ChildMeal,
  UpsertMealInput,
  DailyMealSummary,
  ChildHomework,
  CreateHomeworkInput,
  HomeworkDayGroup,
} from '@/types/kids.types';

// ─── Helper: busca profile.id do usuário autenticado ──────────
async function getMyProfileId(): Promise<UUID> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.id) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', auth.user.id)
    .single();

  if (error || !data) throw new Error('Perfil não encontrado');
  return data.id;
}

export const kidsService = {
  // ─── UC035: Tarefas das crianças (reutiliza tasks) ──────────

  /**
   * UC035 — Listar tarefas atribuídas a uma criança
   */
  async listKidTasks(childProfileId: UUID): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', childProfileId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as Task[];
  },

  /**
   * UC035 — Resumo de pontos de todas as crianças da família
   */
  async listKidPointsSummaries(familyId: UUID): Promise<KidPointsSummary[]> {
    // Busca profiles com role = 'child'
    const { data: children, error: childError } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .eq('family_id', familyId)
      .eq('role', 'child');

    if (childError) throw new Error(childError.message);
    if (!children?.length) return [];

    const childIds = children.map((c) => c.id);

    // Tarefas das crianças
    const { data: tasks, error: taskError } = await supabase
      .from('tasks')
      .select('assigned_to, status, points')
      .eq('family_id', familyId)
      .in('assigned_to', childIds);

    if (taskError) throw new Error(taskError.message);

    return children.map((child) => {
      const childTasks = (tasks ?? []).filter((t) => t.assigned_to === child.id);
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
  },

  // ─── UC036: Mesada ────────────────────────────────────────

  /**
   * UC036 — Calcular mesada de uma criança em um período
   */
  async calculateAllowance(
    childProfileId: UUID,
    periodStart: string,
    periodEnd: string,
    config: AllowanceConfig = { points_per_real: 10, reset_period: 'week' },
  ): Promise<AllowanceSummary> {
    // completed_at é timestamptz — adiciona hora para incluir o dia inteiro do fim do período
    const endInclusive = `${periodEnd}T23:59:59`;
    const { data, error } = await supabase
      .from('tasks')
      .select('points')
      .eq('assigned_to', childProfileId)
      .eq('status', 'done')
      .gte('completed_at', periodStart)
      .lte('completed_at', endInclusive);

    if (error) throw new Error(error.message);

    const pointsEarned = (data ?? []).reduce((sum, t) => sum + (t.points ?? 0), 0);
    const allowanceCents = Math.round((pointsEarned / config.points_per_real) * 100);

    return {
      child_id:        childProfileId,
      period_start:    periodStart,
      period_end:      periodEnd,
      points_earned:   pointsEarned,
      allowance_cents: allowanceCents,
    };
  },

  // ─── UC037: Conquistas ────────────────────────────────────

  /**
   * UC037 — Listar conquistas de uma criança
   */
  async listAchievements(childProfileId: UUID): Promise<ChildAchievement[]> {
    const { data, error } = await supabase
      .from('child_achievements')
      .select('*')
      .eq('child_id', childProfileId)
      .order('awarded_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as ChildAchievement[];
  },

  /**
   * UC037 — Conceder conquista manualmente
   */
  async awardAchievement(
    familyId: UUID,
    input: CreateAchievementInput,
  ): Promise<ChildAchievement> {
    const { data, error } = await supabase
      .from('child_achievements')
      .insert({
        family_id:   familyId,
        child_id:    input.child_id,
        title:       input.title,
        description: input.description ?? null,
        badge_icon:  input.badge_icon ?? 'star',
        points_at:   input.points_at,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as ChildAchievement;
  },

  /**
   * UC037 — Verificar e conceder conquistas automáticas por marcos de pontos
   * Retorna as novas conquistas desbloqueadas (pode ser vazio).
   */
  async checkAndGrantMilestones(
    familyId: UUID,
    childProfileId: UUID,
    currentPoints: number,
  ): Promise<ChildAchievement[]> {
    // Busca conquistas já concedidas para não duplicar
    const existing = await kidsService.listAchievements(childProfileId);
    const existingPoints = new Set(existing.map((a) => a.points_at));

    const newAchievements: ChildAchievement[] = [];

    for (const milestone of ACHIEVEMENT_MILESTONES) {
      if (currentPoints >= milestone.points && !existingPoints.has(milestone.points)) {
        const achievement = await kidsService.awardAchievement(familyId, {
          child_id:    childProfileId,
          title:       milestone.title,
          description: milestone.description,
          badge_icon:  milestone.icon,
          points_at:   milestone.points,
        });
        newAchievements.push(achievement);
      }
    }

    return newAchievements;
  },

  // ─── UC038: Agenda escolar ────────────────────────────────

  /**
   * UC038 — Listar eventos escolares de uma criança
   */
  async listSchoolEvents(
    familyId: UUID,
    childProfileId: UUID,
    from?: string,
  ): Promise<SchoolEvent[]> {
    let query = supabase
      .from('family_events')
      .select('*')
      .eq('family_id', familyId)
      .eq('child_id', childProfileId)
      .not('school_type', 'is', null)
      .order('start_at', { ascending: true });

    if (from) {
      query = query.gte('start_at', from);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as SchoolEvent[];
  },

  /**
   * UC038 — Criar evento escolar
   */
  async createSchoolEvent(
    familyId: UUID,
    input: CreateSchoolEventInput,
  ): Promise<SchoolEvent> {
    const createdBy = await getMyProfileId();

    const { data, error } = await supabase
      .from('family_events')
      .insert({
        family_id:   familyId,
        child_id:    input.child_id,
        school_type: input.school_type,
        title:       input.title,
        description: input.description ?? null,
        start_at:    input.start_at,
        end_at:      input.end_at ?? null,
        all_day:     input.all_day ?? false,
        category:    'school',
        created_by:  createdBy,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as unknown as SchoolEvent;
  },

  /**
   * UC038 — Deletar evento escolar
   */
  async deleteSchoolEvent(id: UUID): Promise<void> {
    const { error } = await supabase
      .from('family_events')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  // ─── UC039: Tempo de tela ─────────────────────────────────

  /**
   * UC039 — Upsert do registro diário de tempo de tela
   */
  async upsertScreenTime(
    familyId: UUID,
    input: UpsertScreenTimeInput,
  ): Promise<ScreenTimeLog> {
    const date = input.date ?? new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('screen_time_logs')
      .upsert(
        {
          family_id:   familyId,
          child_id:    input.child_id,
          date,
          allowed_min: input.allowed_min ?? 60,
          used_min:    input.used_min ?? 0,
        },
        { onConflict: 'family_id,child_id,date' },
      )
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as ScreenTimeLog;
  },

  /**
   * UC039 — Status de tempo de tela de hoje para uma criança
   */
  async getScreenTimeStatus(
    familyId: UUID,
    childProfileId: UUID,
    date?: string,
  ): Promise<ScreenTimeStatus> {
    const today = date ?? new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('screen_time_logs')
      .select('allowed_min, used_min')
      .eq('family_id', familyId)
      .eq('child_id', childProfileId)
      .eq('date', today)
      .maybeSingle();

    if (error) throw new Error(error.message);

    const allowed = data?.allowed_min ?? 60;
    const used    = data?.used_min ?? 0;

    return {
      date:             today,
      allowed_min:      allowed,
      used_min:         used,
      remaining_min:    Math.max(0, allowed - used),
      percentage_used:  Math.min(100, Math.round((used / allowed) * 100)),
      over_limit:       used > allowed,
    };
  },

  /**
   * UC039 — Listar histórico semanal de tempo de tela
   */
  async listScreenTimeWeek(
    familyId: UUID,
    childProfileId: UUID,
  ): Promise<ScreenTimeLog[]> {
    const since = new Date();
    since.setDate(since.getDate() - 6);
    const sinceStr = since.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('screen_time_logs')
      .select('*')
      .eq('family_id', familyId)
      .eq('child_id', childProfileId)
      .gte('date', sinceStr)
      .order('date', { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []) as ScreenTimeLog[];
  },

  // ─── UC040: PIN de acesso ─────────────────────────────────
  // O hash é gerado server-side via Edge Function ou Supabase Function.
  // O cliente apenas envia o PIN em texto; o hash acontece no servidor.

  /**
   * UC040 — Verificar PIN de uma criança (via RPC que usa crypt())
   */
  async verifyChildPin(childProfileId: UUID, pin: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('verify_child_pin', {
      p_profile_id: childProfileId,
      p_pin:        pin,
    });

    if (error) throw new Error(error.message);
    return data as boolean;
  },

  // ─── UC041: Alimentação diária da criança ─────────────────

  /**
   * UC041 — Upsert de uma refeição do dia
   * Um slot por dia por criança — conflict no (family_id, child_id, date, slot).
   */
  async upsertMeal(familyId: UUID, input: UpsertMealInput): Promise<ChildMeal> {
    const loggedBy = await getMyProfileId();
    const date = input.date ?? new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('child_meals')
      .upsert(
        {
          family_id:   familyId,
          child_id:    input.child_id,
          date,
          slot:        input.slot,
          description: input.description ?? null,
          rating:      input.rating,
          notes:       input.notes ?? null,
          logged_by:   loggedBy,
        },
        { onConflict: 'family_id,child_id,date,slot' },
      )
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as ChildMeal;
  },

  /**
   * UC041 — Listar refeições de uma criança em um período
   */
  async listMeals(
    familyId: UUID,
    childId: UUID,
    from: string,
    to?: string,
  ): Promise<ChildMeal[]> {
    let query = supabase
      .from('child_meals')
      .select('*')
      .eq('family_id', familyId)
      .eq('child_id', childId)
      .gte('date', from)
      .order('date', { ascending: false })
      .order('slot', { ascending: true });

    if (to) query = query.lte('date', to);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as ChildMeal[];
  },

  /**
   * UC041 — Resumo do dia alimentar de hoje
   */
  async getDailyMealSummary(
    familyId: UUID,
    childId: UUID,
    date?: string,
  ): Promise<DailyMealSummary> {
    const today = date ?? new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('child_meals')
      .select('*')
      .eq('family_id', familyId)
      .eq('child_id', childId)
      .eq('date', today)
      .order('slot', { ascending: true });

    if (error) throw new Error(error.message);
    const meals = (data ?? []) as ChildMeal[];

    return {
      date,
      meals,
      total_slots:   meals.length,
      great_count:   meals.filter((m) => m.rating === 'great').length,
      ok_count:      meals.filter((m) => m.rating === 'ok').length,
      refused_count: meals.filter((m) => m.rating === 'refused').length,
    } as DailyMealSummary;
  },

  /**
   * UC041 — Deletar refeição
   */
  async deleteMeal(id: UUID): Promise<void> {
    const { error } = await supabase.from('child_meals').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // ─── UC042: Deveres e tarefas de casa ─────────────────────

  /**
   * UC042 — Criar dever de casa
   */
  async createHomework(familyId: UUID, input: CreateHomeworkInput): Promise<ChildHomework> {
    const createdBy = await getMyProfileId();

    const { data, error } = await supabase
      .from('child_homework')
      .insert({
        family_id:   familyId,
        child_id:    input.child_id,
        subject:     input.subject.trim(),
        description: input.description?.trim() ?? null,
        due_date:    input.due_date,
        created_by:  createdBy,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as ChildHomework;
  },

  /**
   * UC042 — Listar deveres de uma criança (opcionalmente filtrado por data)
   */
  async listHomework(
    familyId: UUID,
    childId: UUID,
    from?: string,
  ): Promise<ChildHomework[]> {
    let query = supabase
      .from('child_homework')
      .select('*')
      .eq('family_id', familyId)
      .eq('child_id', childId)
      .order('due_date', { ascending: true })
      .order('done', { ascending: true });

    if (from) query = query.gte('due_date', from);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as ChildHomework[];
  },

  /**
   * UC042 — Marcar dever como feito (ou desmarcar)
   */
  async toggleHomework(id: UUID, done: boolean): Promise<ChildHomework> {
    const { data, error } = await supabase
      .from('child_homework')
      .update({
        done,
        done_at: done ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as ChildHomework;
  },

  /**
   * UC042 — Marcar como revisado pelo pai/mãe
   */
  async reviewHomework(id: UUID): Promise<ChildHomework> {
    const reviewedBy = await getMyProfileId();

    const { data, error } = await supabase
      .from('child_homework')
      .update({
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as ChildHomework;
  },

  /**
   * UC042 — Deletar dever de casa
   */
  async deleteHomework(id: UUID): Promise<void> {
    const { error } = await supabase.from('child_homework').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  /**
   * UC042 — Agrupar deveres por data de entrega
   */
  groupHomeworkByDate(items: ChildHomework[]): HomeworkDayGroup[] {
    const map = new Map<string, ChildHomework[]>();
    for (const item of items) {
      const key = item.due_date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries()).map(([due_date, hw]) => ({
      due_date,
      items: hw,
      pending_count: hw.filter((h) => !h.done).length,
      done_count:    hw.filter((h) => h.done).length,
    }));
  },
};
