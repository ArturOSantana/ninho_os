// src/services/couple/coupleService.ts
// Módulo Casal V2 — UC031–034

import { supabase } from '@/lib/supabase';
import { UUID } from '@/types/common.types';
import {
  CoupleAppreciation,
  CreateAppreciationInput,
  CoupleCheckin,
  UpsertCoupleCheckinInput,
  DailyMoodSummary,
  CoupleExpense,
  CreateExpenseInput,
  UpdateExpenseInput,
  ExpenseBalance,
} from '@/types/couple.types';

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

// ─── UC031: Apreciações ───────────────────────────────────────

export const coupleService = {
  /**
   * UC031 — Enviar apreciação ao parceiro
   */
  async sendAppreciation(
    familyId: UUID,
    input: CreateAppreciationInput,
  ): Promise<CoupleAppreciation> {
    const fromMember = await getMyProfileId();

    const { data, error } = await supabase
      .from('couple_appreciations')
      .insert({
        family_id:   familyId,
        from_member: fromMember,
        to_member:   input.to_member,
        message:     input.message,
        emoji:       input.emoji ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as CoupleAppreciation;
  },

  /**
   * UC031 — Listar apreciações recentes da família (últimas 30)
   */
  async listAppreciations(familyId: UUID): Promise<CoupleAppreciation[]> {
    const { data, error } = await supabase
      .from('couple_appreciations')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw new Error(error.message);
    return (data ?? []) as CoupleAppreciation[];
  },

  // ─── UC032: Check-in emocional ──────────────────────────────

  /**
   * UC032 — Criar ou atualizar check-in emocional do dia
   */
  async upsertCheckin(
    familyId: UUID,
    input: UpsertCoupleCheckinInput,
  ): Promise<CoupleCheckin> {
    const memberId  = await getMyProfileId();
    const checkedAt = input.checked_at ?? new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('couple_checkins')
      .upsert(
        {
          family_id:  familyId,
          member_id:  memberId,
          mood:       input.mood,
          note:       input.note ?? null,
          checked_at: checkedAt,
        },
        { onConflict: 'family_id,member_id,checked_at' },
      )
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as CoupleCheckin;
  },

  /**
   * UC032 — Buscar check-ins dos últimos N dias
   */
  async listCheckins(familyId: UUID, days = 7): Promise<CoupleCheckin[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('couple_checkins')
      .select('*')
      .eq('family_id', familyId)
      .gte('checked_at', sinceStr)
      .order('checked_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as CoupleCheckin[];
  },

  /**
   * UC032 — Resumo do dia atual (par de check-ins)
   */
  async getDailyMoodSummary(
    familyId: UUID,
    memberIds: [UUID, UUID],
    date?: string,
  ): Promise<DailyMoodSummary> {
    const today = date ?? new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('couple_checkins')
      .select('*')
      .eq('family_id', familyId)
      .eq('checked_at', today)
      .in('member_id', memberIds);

    if (error) throw new Error(error.message);
    const checkins = (data ?? []) as CoupleCheckin[];

    return {
      date: today,
      member_a: checkins.find((c) => c.member_id === memberIds[0]),
      member_b: checkins.find((c) => c.member_id === memberIds[1]),
    };
  },

  // ─── UC034: Gastos ────────────────────────────────────────

  /**
   * UC034 — Criar despesa do casal
   */
  async createExpense(
    familyId: UUID,
    input: CreateExpenseInput,
  ): Promise<CoupleExpense> {
    const paidBy = await getMyProfileId();

    const { data, error } = await supabase
      .from('couple_expenses')
      .insert({
        family_id:    familyId,
        title:        input.title,
        amount_cents: input.amount_cents,
        category:     input.category ?? 'other',
        paid_by:      paidBy,
        split_mode:   input.split_mode ?? 'equal',
        paid_by_pct:  input.paid_by_pct ?? null,
        notes:        input.notes ?? null,
        expense_date: input.expense_date ?? new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as CoupleExpense;
  },

  /**
   * UC034 — Listar despesas (não quitadas por padrão)
   */
  async listExpenses(
    familyId: UUID,
    onlyUnsettled = false,
  ): Promise<CoupleExpense[]> {
    let query = supabase
      .from('couple_expenses')
      .select('*')
      .eq('family_id', familyId)
      .order('expense_date', { ascending: false });

    if (onlyUnsettled) {
      query = query.eq('settled', false);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as CoupleExpense[];
  },

  /**
   * UC034 — Atualizar despesa (ex: quitar)
   */
  async updateExpense(
    id: UUID,
    input: UpdateExpenseInput,
  ): Promise<CoupleExpense> {
    const { data, error } = await supabase
      .from('couple_expenses')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as CoupleExpense;
  },

  /**
   * UC034 — Deletar despesa
   */
  async deleteExpense(id: UUID): Promise<void> {
    const { error } = await supabase
      .from('couple_expenses')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  /**
   * UC034 — Calcular balanço entre os dois membros do casal
   * Apenas despesas não quitadas são consideradas.
   */
  async getExpenseBalance(
    familyId: UUID,
    memberAId: UUID,
    memberBId: UUID,
  ): Promise<ExpenseBalance> {
    const { data, error } = await supabase
      .from('couple_expenses')
      .select('amount_cents, paid_by, split_mode, paid_by_pct')
      .eq('family_id', familyId)
      .eq('settled', false);

    if (error) throw new Error(error.message);
    const expenses = data ?? [];

    let memberAPaid = 0;
    let memberBPaid = 0;
    let memberAShare = 0;
    let memberBShare = 0;

    for (const exp of expenses) {
      const amount = exp.amount_cents as number;
      const paidBy = exp.paid_by as UUID;
      const mode   = exp.split_mode as string;

      if (paidBy === memberAId) memberAPaid += amount;
      else if (paidBy === memberBId) memberBPaid += amount;

      if (mode === 'equal') {
        memberAShare += Math.round(amount / 2);
        memberBShare += amount - Math.round(amount / 2);
      } else if (mode === 'one_pays') {
        if (paidBy === memberAId) memberAShare += amount;
        else memberBShare += amount;
      } else if (mode === 'custom') {
        const pct = (exp.paid_by_pct as number) ?? 50;
        const payerShare = Math.round(amount * (pct / 100));
        const otherShare = amount - payerShare;
        if (paidBy === memberAId) {
          memberAShare += payerShare;
          memberBShare += otherShare;
        } else {
          memberBShare += payerShare;
          memberAShare += otherShare;
        }
      }
    }

    const memberAOwes = memberAShare - memberAPaid;
    const memberBOwes = memberBShare - memberBPaid;
    const total = memberAPaid + memberBPaid;

    return {
      total_cents:         total,
      member_a_paid_cents: memberAPaid,
      member_b_paid_cents: memberBPaid,
      member_a_owes_cents: memberAOwes,
      member_b_owes_cents: memberBOwes,
      is_balanced:         Math.abs(memberAOwes) < 100, // menos de R$ 1,00 de diferença
    };
  },
};
