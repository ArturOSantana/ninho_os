// src/components/onboarding/OnboardingStep.tsx
// Paleta dark do handoff

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, FontSize } from '@/constants/theme';

interface OnboardingStepProps {
  title:       string;
  description?: string;
  step:         number;
  totalSteps:   number;
  children:     React.ReactNode;
  onNext:       () => void;
  onSkip?:      () => void;
  onBack?:      () => void;
  isLoading?:   boolean;
  nextLabel?:   string;
  skipLabel?:   string;
  backLabel?:   string;
}

export const OnboardingStep: React.FC<OnboardingStepProps> = ({
  title,
  description,
  step,
  totalSteps,
  children,
  onNext,
  onSkip,
  onBack,
  isLoading = false,
  nextLabel = 'Próximo',
  skipLabel = 'Pular',
  backLabel = 'Voltar',
}) => {
  const insets = useSafeAreaInsets();
  const progress = (step / totalSteps) * 100;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={{ paddingTop: insets.top }} />

      {/* Barra de progresso */}
      <View style={{ height: 2, backgroundColor: Colors.border }}>
        <View style={{ height: '100%', backgroundColor: Colors.primary, width: `${progress}%` as any }} />
      </View>

      {/* Conteúdo */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Indicador de etapa */}
        <Text style={{ fontSize: FontSize.xs, color: Colors.muted, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.lg }}>
          etapa {step} de {totalSteps}
        </Text>

        {/* Título */}
        <Text style={{ fontSize: 22, fontWeight: '500', color: Colors.text, marginBottom: Spacing.sm }}>
          {title}
        </Text>

        {/* Descrição */}
        {description ? (
          <Text style={{ fontSize: FontSize.base, color: Colors.muted, marginBottom: Spacing['2xl'], lineHeight: 20 }}>
            {description}
          </Text>
        ) : null}

        {/* Slot de conteúdo */}
        <View>{children}</View>
      </ScrollView>

      {/* Botões */}
      <View style={{
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingHorizontal: Spacing.lg,
        paddingVertical:   Spacing.lg,
        paddingBottom:     insets.bottom + Spacing.lg,
        gap:               Spacing.sm,
      }}>
        {/* Botão primário */}
        <TouchableOpacity
          onPress={onNext}
          disabled={isLoading}
          accessible
          accessibilityRole="button"
          activeOpacity={0.8}
          style={{
            backgroundColor: Colors.primary,
            borderRadius:    Radius.lg,
            paddingVertical: Spacing.lg,
            alignItems:      'center',
            flexDirection:   'row',
            justifyContent:  'center',
            gap:             Spacing.sm,
            opacity:         isLoading ? 0.6 : 1,
          }}
        >
          {isLoading ? <ActivityIndicator size="small" color={Colors.onLight} /> : null}
          <Text style={{ color: Colors.onLight, fontSize: FontSize.lg, fontWeight: '500' }}>
            {isLoading ? 'carregando...' : nextLabel}
          </Text>
        </TouchableOpacity>

        {/* Botões secundários */}
        {(onSkip || onBack) && (
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            {onBack && (
              <TouchableOpacity
                onPress={onBack}
                disabled={isLoading}
                accessible
                accessibilityRole="button"
                activeOpacity={0.7}
                style={{
                  flex:            1,
                  paddingVertical: Spacing.md,
                  alignItems:      'center',
                  borderRadius:    Radius.md,
                  borderWidth:     1,
                  borderColor:     Colors.border,
                }}
              >
                <Text style={{ color: Colors.muted, fontSize: FontSize.base, fontWeight: '500' }}>
                  {backLabel}
                </Text>
              </TouchableOpacity>
            )}
            {onSkip && (
              <TouchableOpacity
                onPress={onSkip}
                disabled={isLoading}
                accessible
                accessibilityRole="button"
                activeOpacity={0.7}
                style={{ flex: 1, paddingVertical: Spacing.md, alignItems: 'center' }}
              >
                {/* Deliberadamente discreto — não compete com o CTA */}
                <Text style={{ color: Colors.muted, fontSize: FontSize.base, fontWeight: '400' }}>
                  {skipLabel}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
};
