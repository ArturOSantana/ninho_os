// src/hooks/useKids.ts
// Módulo Filhos — UC035–042

import { useState, useEffect, useCallback } from 'react';
import { kidsService } from '@/services/kids/kidsService';
import {
  KidPointsSummary,
  ChildAchievement,
  SchoolEvent,
  CreateSchoolEventInput,
  ScreenTimeStatus,
  UpsertScreenTimeInput,
  AllowanceSummary,
  ChildMeal,
  UpsertMealInput,
  DailyMealSummary,
  ChildHomework,
  CreateHomeworkInput,
  HomeworkDayGroup,
} from '@/types/kids.types';
import { UUID } from '@/types/common.types';
import { useFamily } from '@/context/FamilyContext';

interface UseKidsState {
  summaries: KidPointsSummary[];
  achievements: ChildAchievement[];
  schoolEvents: SchoolEvent[];
  screenTimeStatus: ScreenTimeStatus | null;
  allowance: AllowanceSummary | null;
  // UC041
  dailyMealSummary: DailyMealSummary | null;
  meals: ChildMeal[];
  // UC042
  homework: ChildHomework[];
  homeworkGroups: HomeworkDayGroup[];
  loading: boolean;
  error: string | null;
}

interface UseKidsActions {
  loadForChild: (childId: UUID) => Promise<void>;
  createSchoolEvent: (input: CreateSchoolEventInput) => Promise<void>;
  deleteSchoolEvent: (id: UUID) => Promise<void>;
  upsertScreenTime: (input: UpsertScreenTimeInput) => Promise<void>;
  // UC041
  upsertMeal: (input: UpsertMealInput) => Promise<void>;
  deleteMeal: (id: UUID) => Promise<void>;
  // UC042
  createHomework: (input: CreateHomeworkInput) => Promise<void>;
  toggleHomework: (id: UUID, done: boolean) => Promise<void>;
  reviewHomework: (id: UUID) => Promise<void>;
  deleteHomework: (id: UUID) => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

export type UseKidsResult = UseKidsState & UseKidsActions;

export function useKids(activeChildId?: UUID): UseKidsResult {
  const { family } = useFamily();
  const [summaries, setSummaries] = useState<KidPointsSummary[]>([]);
  const [achievements, setAchievements] = useState<ChildAchievement[]>([]);
  const [schoolEvents, setSchoolEvents] = useState<SchoolEvent[]>([]);
  const [screenTimeStatus, setScreenTimeStatus] = useState<ScreenTimeStatus | null>(null);
  const [allowance, setAllowance] = useState<AllowanceSummary | null>(null);
  const [dailyMealSummary, setDailyMealSummary] = useState<DailyMealSummary | null>(null);
  const [meals, setMeals] = useState<ChildMeal[]>([]);
  const [homework, setHomework] = useState<ChildHomework[]>([]);
  const [homeworkGroups, setHomeworkGroups] = useState<HomeworkDayGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSummaries = useCallback(async (familyId: string) => {
    const data = await kidsService.listKidPointsSummaries(familyId);
    setSummaries(data);
  }, []);

  const loadForChild = useCallback(async (childId: UUID) => {
    if (!family?.id) return;
    setLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      const periodStart = new Date();
      periodStart.setDate(periodStart.getDate() - 6);
      const periodStartStr = periodStart.toISOString().split('T')[0];

      const [ach, events, screenStatus, allowData, mealSummary, hw] = await Promise.all([
        kidsService.listAchievements(childId),
        kidsService.listSchoolEvents(family.id, childId),
        kidsService.getScreenTimeStatus(family.id, childId, today),
        kidsService.calculateAllowance(childId, periodStartStr, today),
        kidsService.getDailyMealSummary(family.id, childId, today),
        kidsService.listHomework(family.id, childId, periodStartStr),
      ]);
      setAchievements(ach);
      setSchoolEvents(events);
      setScreenTimeStatus(screenStatus);
      setAllowance(allowData);
      setDailyMealSummary(mealSummary);
      setMeals(mealSummary.meals);
      setHomework(hw);
      setHomeworkGroups(kidsService.groupHomeworkByDate(hw));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados da criança');
    } finally {
      setLoading(false);
    }
  }, [family?.id]);

  useEffect(() => {
    if (family?.id) {
      setLoading(true);
      loadSummaries(family.id)
        .catch((err) => setError(err instanceof Error ? err.message : 'Erro'))
        .finally(() => setLoading(false));
    }
  }, [family?.id, loadSummaries]);

  useEffect(() => {
    if (activeChildId) {
      loadForChild(activeChildId);
    }
  }, [activeChildId, loadForChild]);

  const createSchoolEvent = useCallback(async (input: CreateSchoolEventInput) => {
    if (!family?.id) return;
    const event = await kidsService.createSchoolEvent(family.id, input);
    setSchoolEvents((prev) => [event, ...prev].sort(
      (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
    ));
  }, [family?.id]);

  const deleteSchoolEvent = useCallback(async (id: UUID) => {
    await kidsService.deleteSchoolEvent(id);
    setSchoolEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const upsertScreenTime = useCallback(async (input: UpsertScreenTimeInput) => {
    if (!family?.id) return;
    await kidsService.upsertScreenTime(family.id, input);
    if (activeChildId) {
      const today = new Date().toISOString().split('T')[0];
      const status = await kidsService.getScreenTimeStatus(family.id, activeChildId, today);
      setScreenTimeStatus(status);
    }
  }, [family?.id, activeChildId]);

  // ── UC041: Alimentação ──────────────────────────────────────
  const upsertMeal = useCallback(async (input: UpsertMealInput) => {
    if (!family?.id) return;
    const meal = await kidsService.upsertMeal(family.id, input);
    setMeals((prev) => {
      const idx = prev.findIndex((m) => m.slot === meal.slot && m.date === meal.date);
      if (idx >= 0) { const next = [...prev]; next[idx] = meal; return next; }
      return [...prev, meal].sort((a, b) => a.slot.localeCompare(b.slot));
    });
    // Recalcula resumo do dia
    const today = new Date().toISOString().split('T')[0];
    const summary = await kidsService.getDailyMealSummary(family.id, input.child_id, today);
    setDailyMealSummary(summary);
  }, [family?.id]);

  const deleteMeal = useCallback(async (id: UUID) => {
    await kidsService.deleteMeal(id);
    setMeals((prev) => prev.filter((m) => m.id !== id));
  }, []);

  // ── UC042: Deveres ──────────────────────────────────────────
  const createHomework = useCallback(async (input: CreateHomeworkInput) => {
    if (!family?.id) return;
    const hw = await kidsService.createHomework(family.id, input);
    setHomework((prev) => {
      const next = [...prev, hw].sort((a, b) => a.due_date.localeCompare(b.due_date));
      setHomeworkGroups(kidsService.groupHomeworkByDate(next));
      return next;
    });
  }, [family?.id]);

  const toggleHomework = useCallback(async (id: UUID, done: boolean) => {
    const updated = await kidsService.toggleHomework(id, done);
    setHomework((prev) => {
      const next = prev.map((h) => (h.id === id ? updated : h));
      setHomeworkGroups(kidsService.groupHomeworkByDate(next));
      return next;
    });
  }, []);

  const reviewHomework = useCallback(async (id: UUID) => {
    const updated = await kidsService.reviewHomework(id);
    setHomework((prev) => {
      const next = prev.map((h) => (h.id === id ? updated : h));
      setHomeworkGroups(kidsService.groupHomeworkByDate(next));
      return next;
    });
  }, []);

  const deleteHomework = useCallback(async (id: UUID) => {
    await kidsService.deleteHomework(id);
    setHomework((prev) => {
      const next = prev.filter((h) => h.id !== id);
      setHomeworkGroups(kidsService.groupHomeworkByDate(next));
      return next;
    });
  }, []);

  const refresh = useCallback(async () => {
    if (!family?.id) return;
    await loadSummaries(family.id);
    if (activeChildId) await loadForChild(activeChildId);
  }, [family?.id, activeChildId, loadSummaries, loadForChild]);

  const clearError = useCallback(() => setError(null), []);

  return {
    summaries,
    achievements,
    schoolEvents,
    screenTimeStatus,
    allowance,
    dailyMealSummary,
    meals,
    homework,
    homeworkGroups,
    loading,
    error,
    loadForChild,
    createSchoolEvent,
    deleteSchoolEvent,
    upsertScreenTime,
    upsertMeal,
    deleteMeal,
    createHomework,
    toggleHomework,
    reviewHomework,
    deleteHomework,
    refresh,
    clearError,
  };
}
