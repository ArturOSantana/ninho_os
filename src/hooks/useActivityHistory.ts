// src/hooks/useActivityHistory.ts
// UC029 — Histórico de atividades por membro

import { useState, useEffect, useCallback } from 'react';
import { mentalLoadService } from '@/services/mental-load/mentalLoadService';
import { ActivityHistoryEntry, MentalLoadPeriod } from '@/types/differential.types';
import { useFamily } from '@/context/FamilyContext';
import { UUID } from '@/types/common.types';

interface UseActivityHistoryState {
  entries: ActivityHistoryEntry[];
  period: MentalLoadPeriod;
  filterMemberId: UUID | null;
  loading: boolean;
  error: string | null;
}

interface UseActivityHistoryActions {
  setPeriod: (period: MentalLoadPeriod) => void;
  setFilterMemberId: (id: UUID | null) => void;
  refresh: () => Promise<void>;
}

export type UseActivityHistoryResult = UseActivityHistoryState & UseActivityHistoryActions;

export function useActivityHistory(): UseActivityHistoryResult {
  const { family } = useFamily();
  const [entries, setEntries] = useState<ActivityHistoryEntry[]>([]);
  const [period, setPeriodState] = useState<MentalLoadPeriod>('week');
  const [filterMemberId, setFilterMemberIdState] = useState<UUID | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (familyId: string, p: MentalLoadPeriod, memberId: UUID | null) => {
      setLoading(true);
      setError(null);
      try {
        const data = await mentalLoadService.getActivityHistory(
          familyId,
          p,
          memberId ?? undefined
        );
        setEntries(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar histórico');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (family?.id) load(family.id, period, filterMemberId);
  }, [family?.id, period, filterMemberId, load]);

  const setPeriod = useCallback((p: MentalLoadPeriod) => setPeriodState(p), []);
  const setFilterMemberId = useCallback((id: UUID | null) => setFilterMemberIdState(id), []);
  const refresh = useCallback(async () => {
    if (family?.id) await load(family.id, period, filterMemberId);
  }, [family?.id, period, filterMemberId, load]);

  return { entries, period, filterMemberId, loading, error, setPeriod, setFilterMemberId, refresh };
}
