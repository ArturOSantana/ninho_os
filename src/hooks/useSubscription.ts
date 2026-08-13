// src/hooks/useSubscription.ts
// Fase 12: Módulo de Assinaturas e Plano Premium da Família

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useFamily } from './useFamily';

export type SubscriptionPlan = 'free' | 'premium';

export interface SubscriptionState {
  plan: SubscriptionPlan;
  premiumUntil: string | null;
  isPremium: boolean;
  loading: boolean;
  error: string | null;
  upgradeToPremium: (days?: number) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useSubscription(): SubscriptionState {
  const { family, loadFamily } = useFamily();
  const [plan, setPlan] = useState<SubscriptionPlan>('free');
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadSubscription = useCallback(async () => {
    if (!family?.id) {
      setPlan('free');
      setPremiumUntil(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('families')
        .select('plan, premium_until')
        .eq('id', family.id)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        // Valida se o plano premium ainda está ativo/válido cronologicamente
        const currentPlan = (data.plan as SubscriptionPlan) ?? 'free';
        const until = data.premium_until;

        if (currentPlan === 'premium' && until) {
          const hasExpired = new Date(until).getTime() < Date.now();
          if (hasExpired) {
            setPlan('free');
          } else {
            setPlan('premium');
          }
        } else {
          setPlan(currentPlan);
        }
        setPremiumUntil(until);
      }
    } catch (err: any) {
      console.warn('[useSubscription] Error fetching subscription:', err);
      setError(err.message || 'Erro ao carregar dados da assinatura.');
    } finally {
      setLoading(false);
    }
  }, [family?.id]);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  const upgradeToPremium = async (days = 30) => {
    if (!family?.id) return;

    setLoading(true);
    setError(null);
    try {
      // Tenta chamar a RPC segura do Supabase criada na migração
      const { error: rpcError } = await supabase.rpc('upgrade_family_to_premium', {
        p_family_id: family.id,
        p_duration_days: days,
      });

      if (rpcError) {
        // Se a RPC falhar (por ex. não aplicada localmente), fazemos um fallback de update direto
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + days);

        const { error: updateError } = await supabase
          .from('families')
          .update({
            plan: 'premium',
            premium_until: targetDate.toISOString(),
          })
          .eq('id', family.id);

        if (updateError) throw updateError;
      }

      await loadSubscription();
      await loadFamily(family.id);
    } catch (err: any) {
      console.error('[useSubscription] Upgrade error:', err);
      setError(err.message || 'Erro ao processar assinatura Premium.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const isPremium = plan === 'premium';

  return {
    plan,
    premiumUntil,
    isPremium,
    loading,
    error,
    upgradeToPremium,
    refresh: loadSubscription,
  };
}
