// src/hooks/useCouple.ts
// Módulo Casal — UC031–034

import { useState, useEffect, useCallback } from 'react';
import { coupleService } from '@/services/couple/coupleService';
import {
  CoupleAppreciation,
  CoupleCheckin,
  CoupleExpense,
  ExpenseBalance,
  CreateAppreciationInput,
  UpsertCoupleCheckinInput,
  CreateExpenseInput,
  UpdateExpenseInput,
  DailyMoodSummary,
} from '@/types/couple.types';
import { UUID } from '@/types/common.types';
import { useFamily } from '@/context/FamilyContext';

interface UseCoupleState {
  appreciations: CoupleAppreciation[];
  checkins: CoupleCheckin[];
  dailyMood: DailyMoodSummary | null;
  expenses: CoupleExpense[];
  balance: ExpenseBalance | null;
  loading: boolean;
  error: string | null;
}

interface UseCoupleActions {
  sendAppreciation: (input: CreateAppreciationInput) => Promise<void>;
  upsertCheckin: (input: UpsertCoupleCheckinInput) => Promise<void>;
  createExpense: (input: CreateExpenseInput) => Promise<void>;
  updateExpense: (id: UUID, input: UpdateExpenseInput) => Promise<void>;
  deleteExpense: (id: UUID) => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

export type UseCoupleResult = UseCoupleState & UseCoupleActions;

export function useCouple(partnerIds?: [UUID, UUID]): UseCoupleResult {
  const { family } = useFamily();
  const [appreciations, setAppreciations] = useState<CoupleAppreciation[]>([]);
  const [checkins, setCheckins] = useState<CoupleCheckin[]>([]);
  const [dailyMood, setDailyMood] = useState<DailyMoodSummary | null>(null);
  const [expenses, setExpenses] = useState<CoupleExpense[]>([]);
  const [balance, setBalance] = useState<ExpenseBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (familyId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [appr, chk, exp] = await Promise.all([
        coupleService.listAppreciations(familyId),
        coupleService.listCheckins(familyId, 7),
        coupleService.listExpenses(familyId),
      ]);
      setAppreciations(appr);
      setCheckins(chk);
      setExpenses(exp);

      if (partnerIds) {
        const [mood, bal] = await Promise.all([
          coupleService.getDailyMoodSummary(familyId, partnerIds),
          coupleService.getExpenseBalance(familyId, partnerIds[0], partnerIds[1]),
        ]);
        setDailyMood(mood);
        setBalance(bal);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar módulo casal');
    } finally {
      setLoading(false);
    }
  }, [partnerIds]);

  useEffect(() => {
    if (family?.id) {
      load(family.id);
    }
  }, [family?.id, load]);

  const sendAppreciation = useCallback(async (input: CreateAppreciationInput) => {
    if (!family?.id) return;
    const newItem = await coupleService.sendAppreciation(family.id, input);
    setAppreciations((prev) => [newItem, ...prev]);
  }, [family?.id]);

  const upsertCheckin = useCallback(async (input: UpsertCoupleCheckinInput) => {
    if (!family?.id) return;
    const checkin = await coupleService.upsertCheckin(family.id, input);
    setCheckins((prev) => {
      const exists = prev.findIndex(
        (c) => c.member_id === checkin.member_id && c.checked_at === checkin.checked_at,
      );
      if (exists >= 0) {
        const next = [...prev];
        next[exists] = checkin;
        return next;
      }
      return [checkin, ...prev];
    });
  }, [family?.id]);

  const createExpense = useCallback(async (input: CreateExpenseInput) => {
    if (!family?.id) return;
    const exp = await coupleService.createExpense(family.id, input);
    setExpenses((prev) => [exp, ...prev]);
  }, [family?.id]);

  const updateExpense = useCallback(async (id: UUID, input: UpdateExpenseInput) => {
    const updated = await coupleService.updateExpense(id, input);
    setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
  }, []);

  const deleteExpense = useCallback(async (id: UUID) => {
    await coupleService.deleteExpense(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const refresh = useCallback(async () => {
    if (family?.id) await load(family.id);
  }, [family?.id, load]);

  const clearError = useCallback(() => setError(null), []);

  return {
    appreciations,
    checkins,
    dailyMood,
    expenses,
    balance,
    loading,
    error,
    sendAppreciation,
    upsertCheckin,
    createExpense,
    updateExpense,
    deleteExpense,
    refresh,
    clearError,
  };
}
