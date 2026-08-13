// src/hooks/useBabyRecords.ts
// Hook para buscar os registros do bebê — usado no dashboard e na tela do bebê.
// Fornece o último registro de cada tipo (feeding, diaper, sleep) e a contagem do dia.

import { useState, useEffect, useCallback } from 'react';
import { BabyRecord } from '@/types';
import { getLastBabyRecord, getBabyRecordsToday } from '@/services/api';

interface BabyRecordsSummary {
  lastFeeding: BabyRecord | null;
  lastDiaper:  BabyRecord | null;
  lastSleep:   BabyRecord | null;
  todayCount:  number;
  loading:     boolean;
  error:       string | null;
}

export function useBabyRecords(babyId: string | undefined): BabyRecordsSummary & { reload: () => void } {
  const [lastFeeding, setLastFeeding] = useState<BabyRecord | null>(null);
  const [lastDiaper,  setLastDiaper]  = useState<BabyRecord | null>(null);
  const [lastSleep,   setLastSleep]   = useState<BabyRecord | null>(null);
  const [todayCount,  setTodayCount]  = useState(0);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!babyId) return;
    setLoading(true);
    setError(null);
    try {
      const [feeding, diaper, sleep, today] = await Promise.all([
        getLastBabyRecord(babyId, 'feeding'),
        getLastBabyRecord(babyId, 'diaper'),
        getLastBabyRecord(babyId, 'sleep'),
        getBabyRecordsToday(babyId),
      ]);
      setLastFeeding(feeding);
      setLastDiaper(diaper);
      setLastSleep(sleep);
      setTodayCount(today.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar registros');
    } finally {
      setLoading(false);
    }
  }, [babyId]);

  useEffect(() => {
    load();
  }, [load]);

  return { lastFeeding, lastDiaper, lastSleep, todayCount, loading, error, reload: load };
}
