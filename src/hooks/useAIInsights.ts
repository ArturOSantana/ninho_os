// src/hooks/useAIInsights.ts
// Fase 6 — Insights automáticos e resumo semanal

import { useState, useEffect, useCallback } from 'react';
import { aiService } from '@/services/ai/aiService';
import { AIInsight, WeeklySummary } from '@/types/differential.types';
import { useFamily } from '@/context/FamilyContext';

interface UseAIInsightsState {
  insights: AIInsight[];
  weeklySummary: WeeklySummary | null;
  loading: boolean;
  error: string | null;
}

interface UseAIInsightsActions {
  refresh: () => Promise<void>;
  clearError: () => void;
}

export type UseAIInsightsResult = UseAIInsightsState & UseAIInsightsActions;

export function useAIInsights(): UseAIInsightsResult {
  const { family, currentBaby } = useFamily();

  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (familyId: string, babyId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const [generatedInsights, summary] = await Promise.all([
        aiService.generateInsights(familyId, babyId),
        aiService.getWeeklySummary(familyId, babyId),
      ]);
      setInsights(generatedInsights);
      setWeeklySummary(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar insights');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (family?.id) {
      load(family.id, currentBaby?.id);
    }
  }, [family?.id, currentBaby?.id, load]);

  const refresh = useCallback(async () => {
    if (family?.id) await load(family.id, currentBaby?.id);
  }, [family?.id, currentBaby?.id, load]);

  const clearError = useCallback(() => setError(null), []);

  return { insights, weeklySummary, loading, error, refresh, clearError };
}
