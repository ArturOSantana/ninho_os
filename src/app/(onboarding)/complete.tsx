// src/app/(onboarding)/complete.tsx
// Paleta dark do handoff — fundo color-bg-page, tipografia serif, FoxMark SVG.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polygon, Path, Ellipse } from 'react-native-svg';
import { useFamily } from '@/hooks';
import { useAuthStore } from '@/stores/auth.store';
import { Colors, Radius, Spacing, FontSize } from '@/constants/theme';

function FoxMark({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Polygon points="20,10 45,50 10,45" fill="#e8720c" />
      <Polygon points="80,10 55,50 90,45" fill="#e8720c" />
      <Path d="M50,30 C70,30 85,50 82,72 C79,92 65,100 50,100 C35,100 21,92 18,72 C15,50 30,30 50,30 Z" fill="#e8720c" />
      <Path d="M50,55 C62,55 70,66 68,80 C66,92 58,98 50,99 C42,98 34,92 32,80 C30,66 38,55 50,55 Z" fill="#f5d9b0" />
      <Ellipse cx="40" cy="62" rx="3.2" ry="4.2" fill="#0d1b2a" />
      <Ellipse cx="60" cy="62" rx="3.2" ry="4.2" fill="#0d1b2a" />
      <Polygon points="46,85 54,85 50,92" fill="#0d1b2a" />
    </Svg>
  );
}

export default function CompleteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { family, currentBaby } = useFamily();
  const { setIsOnboarded } = useAuthStore();

  return (
    <View style={[s.root, { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl }]}>
      {/* Logo */}
      <View style={s.logoRow}>
        <FoxMark size={32} />
        <Text style={s.wordmark}>ninho</Text>
      </View>

      {/* Conteúdo central */}
      <View style={s.center}>
        {/* Card blob de sucesso */}
        <View style={s.successCard}>
          <Text style={s.checkmark}>✓</Text>
          <Text style={s.headline}>tudo pronto</Text>
          <Text style={s.subheadline}>sua família foi criada e você já pode começar.</Text>
        </View>

        {/* Resumo família/bebê */}
        {family && (
          <View style={s.summaryCard}>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>família</Text>
              <Text style={s.summaryValue} numberOfLines={1}>{family.name}</Text>
            </View>
            {currentBaby && (
              <View style={[s.summaryRow, { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border }]}>
                <Text style={s.summaryLabel}>bebê</Text>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={s.summaryValue} numberOfLines={1}>{currentBaby.name}</Text>
                  <Text style={s.summaryMeta}>
                    {new Date(currentBaby.birth_date).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      {/* CTA */}
      <TouchableOpacity
        onPress={() => {
          setIsOnboarded(true);
          router.replace('/(app)/(dashboard)');
        }}
        activeOpacity={0.82}
        style={s.btnPrimary}
      >
        <Text style={s.btnPrimaryText}>ir para o início →</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.xxl,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: Spacing.xxl,
  },
  wordmark: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 22,
    color: Colors.tertiary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  // Blob assimétrico — mesmo padrão dos cards do onboarding
  successCard: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 48,
    borderTopRightRadius: 36,
    borderBottomRightRadius: 48,
    borderBottomLeftRadius: 36,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 40,
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  headline: {
    fontFamily: 'Georgia',
    fontSize: 26,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subheadline: {
    color: Colors.muted,
    fontSize: FontSize.base,
    textAlign: 'center',
    lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryLabel: {
    color: Colors.muted,
    fontSize: FontSize.xs,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  summaryValue: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  summaryMeta: {
    color: Colors.muted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  btnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: Colors.onLight,
    fontSize: FontSize.lg,
    fontWeight: '500',
  },
});
