// src/hooks/useMentalLoad.ts
// Fase 6 — UC024, UC025, UC026

import { useState, useEffect, useCallback } from 'react';
import { mentalLoadService } from '@/services/mental-load/mentalLoadService';
import {
  FamilyMentalLoadSummary,
  MentalLoadDayEntry,
  MentalLoadPeriod,
} from '@/types/differential.types';
import { useFamily } from '@/context/FamilyContext';

interface UseMentalLoadState {
  summary: FamilyMentalLoadSummary | null;
  history: MentalLoadDayEntry[];
  period: MentalLoadPeriod;
  loading: boolean;
  error: string | null;
}

interface UseMentalLoadActions {
  setPeriod: (period: MentalLoadPeriod) => void;
  refresh: () => Promise<void>;
  clearError: () => void;
}

export type UseMentalLoadResult = UseMentalLoadState & UseMentalLoadActions;

export function useMentalLoad(): UseMentalLoadResult {
  const { family } = useFamily();
  const [summary, setSummary] = useState<FamilyMentalLoadSummary | null>(null);
  const [history, setHistory] = useState<MentalLoadDayEntry[]>([]);
  const [period, setPeriodState] = useState<MentalLoadPeriod>('week');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (familyId: string, p: MentalLoadPeriod) => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, historyData] = await Promise.all([
        mentalLoadService.getFamilySummary(familyId, p),
        mentalLoadService.getDailyHistory(familyId, p),
      ]);
      setSummary(summaryData);
      setHistory(historyData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar carga mental');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (family?.id) {
      load(family.id, period);
    }
  }, [family?.id, period, load]);

  const setPeriod = useCallback((p: MentalLoadPeriod) => {
    setPeriodState(p);
  }, []);

  const refresh = useCallback(async () => {
    if (family?.id) {
      await load(family.id, period);
    }
  }, [family?.id, period, load]);

  const clearError = useCallback(() => setError(null), []);

  return { summary, history, period, loading, error, setPeriod, refresh, clearError };
}
