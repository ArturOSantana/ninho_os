// tests/unit/useSubscription.test.ts
// Fase 12: Teste unitário da lógica de gerenciamento de assinaturas e planos premium

import { describe, it, expect } from '@jest/globals';

type SubscriptionPlan = 'free' | 'premium';

interface MockSubscriptionData {
  plan: SubscriptionPlan;
  premium_until: string | null;
}

// Lógica de derivação do plano premium testada isoladamente
function evaluateSubscription(data: MockSubscriptionData | null): {
  plan: SubscriptionPlan;
  isPremium: boolean;
  hasExpired: boolean;
} {
  if (!data) {
    return { plan: 'free', isPremium: false, hasExpired: false };
  }

  const currentPlan = data.plan ?? 'free';
  const until = data.premium_until;

  if (currentPlan === 'premium' && until) {
    const hasExpired = new Date(until).getTime() < Date.now();
    if (hasExpired) {
      return { plan: 'free', isPremium: false, hasExpired: true };
    }
    return { plan: 'premium', isPremium: true, hasExpired: false };
  }

  return { plan: currentPlan, isPremium: currentPlan === 'premium', hasExpired: false };
}

describe('Módulo de Assinaturas (Fase 12) - Lógica de Negócio', () => {
  it('deve retornar plano gratuito por padrão quando não houver dados de assinatura', () => {
    const res = evaluateSubscription(null);
    expect(res.plan).toBe('free');
    expect(res.isPremium).toBe(false);
    expect(res.hasExpired).toBe(false);
  });

  it('deve retornar premium ativo se a data de validade for no futuro', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15); // +15 dias no futuro

    const mockData: MockSubscriptionData = {
      plan: 'premium',
      premium_until: futureDate.toISOString(),
    };

    const res = evaluateSubscription(mockData);
    expect(res.plan).toBe('premium');
    expect(res.isPremium).toBe(true);
    expect(res.hasExpired).toBe(false);
  });

  it('deve marcar como expirado e reverter para gratuito se a validade estiver no passado', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 2); // -2 dias no passado

    const mockData: MockSubscriptionData = {
      plan: 'premium',
      premium_until: pastDate.toISOString(),
    };

    const res = evaluateSubscription(mockData);
    expect(res.plan).toBe('free');
    expect(res.isPremium).toBe(false);
    expect(res.hasExpired).toBe(true);
  });

  it('deve manter plano gratuito se configurado explicitamente sem validade', () => {
    const mockData: MockSubscriptionData = {
      plan: 'free',
      premium_until: null,
    };

    const res = evaluateSubscription(mockData);
    expect(res.plan).toBe('free');
    expect(res.isPremium).toBe(false);
    expect(res.hasExpired).toBe(false);
  });
});
