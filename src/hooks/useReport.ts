// src/hooks/useReport.ts

import { useState, useCallback } from 'react';
import { reportService, FamilyReport, ReportPeriod } from '@/services/report/reportService';
import { UUID } from '@/types/common.types';

export function useReport(familyId: UUID | undefined) {
  const [report, setReport]   = useState<FamilyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const generate = useCallback(
    async (period: ReportPeriod) => {
      if (!familyId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await reportService.generate(familyId, period);
        setReport(data);
      } catch (e: any) {
        setError(e.message ?? 'Erro ao gerar relatório');
      } finally {
        setLoading(false);
      }
    },
    [familyId],
  );

  return { report, loading, error, generate };
}
