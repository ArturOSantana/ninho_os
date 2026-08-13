// src/app/accept-invite.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFamily } from '@/hooks/useFamily';
import { useAuthStore } from '@/stores/auth.store';
import { familyService } from '@/services/family/familyService';
import { Colors, Radius, Spacing, FontSize } from '@/constants/theme';
import type { GuestInvite } from '@/types';

export default function AcceptInviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { joinFamilyByInvite } = useFamily();
  const session = useAuthStore((s) => s.session);

  const [invite, setInvite] = useState<GuestInvite | null>(null);
  const [validating, setValidating] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!token) { setValidating(false); return; }
    familyService
      .validateInvite(token)
      .then(setInvite)
      .catch(() => setInvite(null))
      .finally(() => setValidating(false));
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;

    // Se não há sessão, o usuário precisa fazer login/cadastro primeiro.
    // Armazenamos o token na rota para voltar depois do auth.
    if (!session) {
      router.replace(`/(auth)/login?invite_token=${token}` as never);
      return;
    }

    try {
      setJoining(true);
      await joinFamilyByInvite(token);
      // Redireciona para o app após entrar na família com sucesso
      router.replace('/(app)/(dashboard)');
    } catch (err) {
      Alert.alert('Erro', err instanceof Error ? err.message : 'Erro ao entrar na família');
      setJoining(false);
    }
  };

  if (validating) {
    return (
      <View style={[s.root, s.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={s.loadingText}>verificando convite…</Text>
      </View>
    );
  }

  if (!token || !invite) {
    return (
      <View style={[s.root, s.center, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Text style={s.bigIcon}>⚠️</Text>
        <Text style={s.title}>Convite inválido</Text>
        <Text style={s.subtitle}>
          Este link expirou ou já foi utilizado.{'\n'}Peça um novo convite ao administrador.
        </Text>
        <TouchableOpacity style={s.btnPrimary} onPress={() => router.replace('/(auth)/login')} activeOpacity={0.8}>
          <Text style={s.btnPrimaryText}>Voltar ao início</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[s.root, { paddingTop: insets.top + Spacing.xxl, paddingBottom: insets.bottom + Spacing.xl }]}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text style={[s.bigIcon, { textAlign: 'center', marginBottom: Spacing.xl }]}>🏠</Text>
        <Text style={[s.title, { textAlign: 'center', marginBottom: Spacing.sm }]}>Você foi convidado!</Text>
        <Text style={[s.subtitle, { textAlign: 'center', marginBottom: Spacing.xxl * 2 }]}>
          Aceite o convite para entrar na família e começar a colaborar.
        </Text>

        {/* Info card */}
        <View style={s.infoCard}>
          <Text style={s.infoLabel}>FUNÇÃO</Text>
          <Text style={s.infoValue}>{invite.scope}</Text>
          <View style={s.divider} />
          <Text style={s.infoLabel}>VÁLIDO ATÉ</Text>
          <Text style={s.infoValue}>
            {new Date(invite.expires_at).toLocaleDateString('pt-BR', {
              day: '2-digit', month: 'long', year: 'numeric',
            })}
          </Text>
        </View>
      </View>

      <View style={{ gap: Spacing.md }}>
        <TouchableOpacity
          style={[s.btnPrimary, (joining) && { opacity: 0.6 }]}
          onPress={handleAccept}
          disabled={joining}
          activeOpacity={0.8}
        >
          {joining
            ? <ActivityIndicator color={Colors.onLight} />
            : <Text style={s.btnPrimaryText}>Aceitar convite</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/(auth)/login')} disabled={joining} activeOpacity={0.7}>
          <Text style={[s.subtitle, { textAlign: 'center' }]}>Recusar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: Spacing.xxl },
  center: { alignItems: 'center', justifyContent: 'center' },
  bigIcon: { fontSize: 52 },
  title: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    color: Colors.muted,
    fontSize: FontSize.base,
    fontWeight: '400',
    lineHeight: 20,
  },
  loadingText: {
    color: Colors.muted,
    fontSize: FontSize.sm,
    marginTop: Spacing.md,
  },
  infoCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.xl,
    gap: Spacing.xs,
  },
  infoLabel: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: '500',
    letterSpacing: 0.8,
  },
  infoValue: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
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
