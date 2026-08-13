// src/app/(onboarding)/invite-partner.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
  StyleSheet,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFamily } from '@/hooks';
import { familyService } from '@/services/family/familyService';
import { Colors, Radius, Spacing, FontSize } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Invite Partner Screen — Tela 4 do Onboarding
 * UC009 - Convidar Parceiro
 * Critério: enviar convite em menos de 30 segundos
 */
export default function InvitePartnerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { family } = useFamily();
  const { profile } = useAuthStore();

  const [inviteLink, setInviteLink] = useState<{ link: string; expires_at: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendState, setSendState] = useState<'idle' | 'sending' | 'sent'>('idle');

  // UC — skip automático: se já existe parceiro na família, vai direto para complete
  useEffect(() => {
    if (!family?.id || !profile?.user_id) return;
    familyService.listMembers(family.id).then((members) => {
      // Parceiro existe = há pelo menos outro membro na família (excluindo o próprio usuário)
      const hasPartner = members.some((m) => m.user_id !== profile.user_id);
      if (hasPartner) {
        router.replace('/(onboarding)/complete');
      }
    }).catch(() => {/* falha silenciosa — continua mostrando a tela normalmente */});
  }, [family?.id, profile?.user_id, router]);

  useEffect(() => {
    if (!family?.id) { setLoading(false); return; }
    familyService
      .createInviteLink(family.id)
      .then(setInviteLink)
      .catch(() => Alert.alert('Erro', 'Não foi possível gerar o convite'))
      .finally(() => setLoading(false));
  }, [family?.id]);

  const handleSend = async () => {
    if (!inviteLink) return;
    try {
      setSendState('sending');
      await Share.share({
        message: `Entra na nossa família no Ninho!\n\n${inviteLink.link}`,
        title: 'Convite para o Ninho',
      });
      setSendState('sent');
      setTimeout(() => router.push('/(onboarding)/complete'), 2000);
    } catch {
      setSendState('idle');
    }
  };

  const handleCopy = async () => {
    if (!inviteLink) return;
    await Clipboard.setStringAsync(inviteLink.link);
    Alert.alert('Copiado!', 'Link copiado para a área de transferência.');
  };

  if (loading) {
    return (
      <View style={[s.root, s.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[s.root, { paddingTop: insets.top + Spacing.xxl, paddingBottom: insets.bottom + Spacing.xl }]}>
      {/* Steps */}
      <View style={s.steps}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={[s.stepDot, i === 4 && s.stepDotActive]} />
        ))}
      </View>

      {/* Conteúdo */}
      <View style={{ flex: 1, justifyContent: 'center' }}>
        {/* Card "você" (admin) */}
        <View style={s.memberCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>
              {family?.name?.slice(0, 1).toUpperCase() ?? 'V'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.memberName} numberOfLines={1}>{family?.name ?? 'Sua família'}</Text>
            <Text style={s.memberRole}>admin</Text>
          </View>
        </View>

        {/* Card "parceiro" — vazio clicável */}
        <TouchableOpacity
          style={s.inviteCard}
          onPress={handleSend}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Convidar parceiro para a família"
        >
          <View style={s.invitePlus}>
            <Text style={s.invitePlusText}>+</Text>
          </View>
          <Text style={s.inviteLabel}>convidar parceiro</Text>
        </TouchableOpacity>

        {/* Info expiração */}
        {inviteLink && (
          <Text style={s.expiryText}>
            convite válido até {new Date(inviteLink.expires_at).toLocaleDateString('pt-BR')}
          </Text>
        )}
      </View>

      {/* Ações */}
      <View style={{ gap: Spacing.md }}>
        <TouchableOpacity
          style={[s.btnPrimary, (sendState !== 'idle' || !inviteLink) && { opacity: 0.7 }]}
          onPress={handleSend}
          disabled={sendState !== 'idle' || !inviteLink}
          activeOpacity={0.8}
        >
          {sendState === 'sending' ? (
            <ActivityIndicator color={Colors.onLight} />
          ) : sendState === 'sent' ? (
            <Text style={s.btnPrimaryText}>convite enviado ✓</Text>
          ) : (
            <Text style={s.btnPrimaryText}>enviar convite</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleCopy} disabled={!inviteLink} activeOpacity={0.7}>
          <Text style={s.copyText}>copiar link</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(onboarding)/complete')}
          activeOpacity={0.7}
        >
          <Text style={s.skipText}>pular por agora</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: Spacing.xxl },
  center: { alignItems: 'center', justifyContent: 'center' },

  steps: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.xxl * 2,
  },
  stepDot: {
    width: 28,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  stepDotActive: { backgroundColor: Colors.primary },

  // Títulos em serif — voz de destaque (handoff v2)
  headline: {
    fontFamily: 'Georgia',
    fontSize: 20,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 5,
  },
  subheadline: {
    color: Colors.muted,
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },

  // Card preenchido — blob assimétrico (handoff v2)
  memberCard: {
    backgroundColor: Colors.card,
    // blob: 44% 56% 50% 50% / 60% 40% 60% 40% — aproximado com 4 cantos RN
    borderTopLeftRadius: 44,
    borderTopRightRadius: 36,
    borderBottomRightRadius: 44,
    borderBottomLeftRadius: 36,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { color: Colors.onLight, fontSize: FontSize.base, fontWeight: '500' },
  memberName: { color: Colors.text, fontSize: FontSize.base, fontWeight: '500' },
  memberRole: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: '400', marginTop: 2 },

  // Card tracejado vazio — blob ligeiramente diferente (handoff v2)
  inviteCard: {
    backgroundColor: 'transparent',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 44,
    borderBottomRightRadius: 36,
    borderBottomLeftRadius: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  invitePlus: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  invitePlusText: { color: Colors.muted, fontSize: FontSize.lg, fontWeight: '400', lineHeight: 22 },
  inviteLabel: { color: Colors.muted, fontSize: FontSize.base, fontWeight: '400' },

  expiryText: {
    color: Colors.border,
    fontSize: FontSize.xs,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: Spacing.sm,
  },

  btnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnPrimaryText: { color: Colors.onLight, fontSize: FontSize.lg, fontWeight: '500' },

  copyText: {
    color: Colors.muted,
    fontSize: FontSize.sm,
    fontWeight: '400',
    textAlign: 'center',
  },
  skipText: {
    color: Colors.border,
    fontSize: FontSize.sm,
    fontWeight: '400',
    textAlign: 'center',
  },
});
