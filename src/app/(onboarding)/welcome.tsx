// src/app/(onboarding)/welcome.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polygon, Path, Ellipse } from 'react-native-svg';
import { IconBabyBottle, IconCalendar, IconScale } from '@tabler/icons-react-native';
import { useAuthStore } from '@/stores/auth.store';
import { Colors, Radius, Spacing, FontSize } from '@/constants/theme';

// Raposa — assinatura da marca (handoff v2). Aparece uma vez, no header.
function FoxMark({ size = 48 }: { size?: number }) {
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

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { family, setIsOnboarded } = useAuthStore();

  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom + Spacing.lg }]}>
      {/* Logo */}
      <View style={s.logoWrap}>
        {/* Anel duplo + raposa SVG substituindo o emoji 🪶 */}
        <View style={s.logoRing}>
          <View style={s.logoInner}>
            <FoxMark size={40} />
          </View>
        </View>
        <Text style={s.appName}>ninho</Text>
        <Text style={s.tagline}>o sistema operacional da sua família</Text>
      </View>

      {/* Features */}
      <View style={s.featureList}>
        {(
          [
            { icon: <IconBabyBottle size={18} color={Colors.secondary} />, text: 'Registre mamadas, sono e trocas em segundos' },
            { icon: <IconCalendar   size={18} color={Colors.secondary} />, text: 'Agenda e tarefas compartilhadas em tempo real' },
            { icon: <IconScale      size={18} color={Colors.secondary} />, text: 'Equilibre a carga mental entre os parceiros' },
          ] as Array<{ icon: React.ReactNode; text: string }>
        ).map((f) => (
          <View key={f.text} style={s.featureRow}>
            <View style={s.featureIcon}>{f.icon}</View>
            <Text style={s.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>

      {/* Botões */}
      <View style={s.actions}>
        <TouchableOpacity
          style={s.btnPrimary}
          onPress={() => router.push('/(onboarding)/create-family')}
          activeOpacity={0.8}
        >
          <Text style={s.btnPrimaryText}>Vamos começar →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            // Se já tem família no store, marca como onboarded para não voltar aqui
            if (family) setIsOnboarded(true);
            router.replace('/(app)/(dashboard)');
          }}
          activeOpacity={0.7}
        >
          <Text style={s.skipText}>pular por agora</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.xxl,
    justifyContent: 'space-between',
  },
  logoWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRing: {
    width: 88,
    height: 88,
    borderRadius: Radius.full,
    borderWidth: 3,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    // anel duplo via shadow
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  logoInner: {
    width: 68,
    height: 68,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    color: Colors.text,
    fontSize: FontSize.display,
    fontWeight: '500',
    letterSpacing: -1,
    marginBottom: Spacing.xs,
  },
  tagline: {
    color: Colors.muted,
    fontSize: FontSize.sm,
    fontWeight: '400',
  },
  featureList: {
    gap: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  featureIcon: {
    fontSize: 22,
    width: 32,
    textAlign: 'center',
  },
  featureText: {
    flex: 1,
    color: Colors.muted,
    fontSize: FontSize.base,
    fontWeight: '400',
    lineHeight: 20,
  },
  actions: {
    gap: Spacing.lg,
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: Colors.onLight,
    fontSize: FontSize.lg,
    fontWeight: '500',
  },
  skipText: {
    color: Colors.muted,
    fontSize: FontSize.sm,
    fontWeight: '400',
  },
});
