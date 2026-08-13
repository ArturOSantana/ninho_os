// src/app/(onboarding)/add-baby.tsx

import React, { useState, useRef } from 'react';
import { View, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useFamily } from '@/hooks';
import { useAuthStore } from '@/stores/auth.store';
import { OnboardingStep, BabyForm } from '@/components/onboarding';
import { BabyGender } from '@/types';
import { Colors } from '@/constants/theme';

/**
 * Add Baby Screen - Tela 3 do Onboarding
 * UC008 - Adicionar Bebé
 *
 * Pode ser chamado de dois contextos:
 * 1. Onboarding completo (sem família) → segue para invite-partner
 * 2. App (usuário já tem família, apenas não tem bebê) → volta para /(app)/(baby)
 */
export default function AddBabyScreen() {
  const router = useRouter();
  const { addBaby, loading, error, clearError } = useFamily();
  const { isOnboarded } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitRef = useRef<(() => void) | null>(null);

  const handleSubmit = async (babyData: {
    name: string;
    birth_date: string;
    sex: BabyGender;
    photo_url?: string;
  }) => {
    try {
      setIsSubmitting(true);
      clearError();

      await addBaby(babyData);
      // FamilyContext.addBaby já sincroniza o AuthStore internamente

      if (isOnboarded) {
        // Veio do app (usuário já tem família) → volta para a tela de bebê
        router.replace('/(app)/(baby)');
      } else {
        // Veio do onboarding completo → segue o fluxo normal
        router.push('/(onboarding)/invite-partner');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao adicionar bebé';
      Alert.alert('Erro', message, [
        {
          text: 'Tentar Novamente',
          onPress: () => setIsSubmitting(false),
        },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (isOnboarded) {
      router.replace('/(app)/(baby)');
    } else {
      router.push('/(onboarding)/invite-partner');
    }
  };

  return (
    <OnboardingStep
      title="Primeiro Bebé"
      description="Adicione os dados do seu primeiro bebé"
      step={3}
      totalSteps={5}
      onNext={() => submitRef.current?.()}
      onBack={() => router.back()}
      onSkip={handleSkip}
      isLoading={loading || isSubmitting}
      nextLabel={isSubmitting ? 'Criando...' : 'Próximo'}
      backLabel="Voltar"
      skipLabel="Pular por agora"
    >
      <BabyForm
        onSubmit={handleSubmit}
        onRegisterSubmit={(fn) => { submitRef.current = fn; }}
        isLoading={loading || isSubmitting}
        error={error ?? undefined}
      />

      {isSubmitting && (
        <View style={s.overlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
    </OnboardingStep>
  );
}

const s = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
});
