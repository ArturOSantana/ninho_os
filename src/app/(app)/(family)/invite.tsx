// src/app/(app)/(family)/invite.tsx
// UC025 — Gerar link/QR de convite com escolha de role e duração
//          + listagem de convites ativos com contagem regressiva

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  IconChevronLeft, IconShare, IconCopy, IconCheck, IconX,
} from '@tabler/icons-react-native';
import * as Clipboard from 'expo-clipboard';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';
import {
  IconUserHeart,
  IconBabyBottle,
  IconEye,
  type Icon,
} from '@tabler/icons-react-native';
import { useFamily } from '@/hooks';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { RoleBadge } from '@/components/family';
import { UserRole, PendingInvite } from '@/types';

const ROLE_OPTIONS: { role: UserRole; label: string; description: string; icon: Icon }[] = [
  {
    role: 'parent',
    label: 'Responsável',
    description: 'Acesso total — registros, agenda, tarefas',
    icon: IconUserHeart,
  },
  {
    role: 'babysitter',
    label: 'Babá',
    description: 'Pode registrar atividades do bebê',
    icon: IconBabyBottle,
  },
  {
    role: 'guest',
    label: 'Convidado',
    description: 'Somente visualização (avós, etc.)',
    icon: IconEye,
  },
];

const DURATION_OPTIONS: { days: 1 | 7 | 30; label: string }[] = [
  { days: 1,  label: '1 dia' },
  { days: 7,  label: '7 dias' },
  { days: 30, label: '30 dias' },
];

function daysLeftLabel(days: number): string {
  if (days <= 0) return 'Expirado';
  if (days === 1) return 'Expira amanhã';
  return `Expira em ${days} dias`;
}

export default function InviteScreen() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const { family } = useFamily();
  const {
    loading, inviteLink, pendingInvites,
    generateInvite, revokeInvite, loadPendingInvites,
  } = useFamilyMembers(family?.id);

  const [selectedRole, setSelectedRole] = useState<UserRole>('parent');
  const [selectedDays, setSelectedDays] = useState<1 | 7 | 30>(7);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadPendingInvites();
  }, [loadPendingInvites]);

  const handleGenerate = async () => {
    await generateInvite(selectedRole, selectedDays);
  };

  const handleCopy = async () => {
    if (!inviteLink) return;
    await Clipboard.setStringAsync(inviteLink.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    if (!inviteLink) return;
    try {
      // Android usa 'message'; iOS usa 'url' (universal link) como preview rico.
      // O deeplink abre o app diretamente; o link web é fallback para quem não tem o app.
      await Share.share({
        message: `Você foi convidado para o Ninho! Use este link para entrar na família: ${inviteLink.deeplink ?? inviteLink.link}`,
        url: inviteLink.link,
      });
    } catch {
      Alert.alert('Erro', 'Não foi possível compartilhar o link.');
    }
  };

  const handleRevoke = (invite: PendingInvite) => {
    Alert.alert(
      'Revogar convite',
      'O link ficará inativo imediatamente. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Revogar',
          style: 'destructive',
          onPress: async () => {
            try {
              await revokeInvite(invite.id);
            } catch {
              Alert.alert('Erro', 'Não foi possível revogar o convite.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, paddingTop: insets.top }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg,
        paddingBottom: Spacing.md, gap: 12,
      }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <IconChevronLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={{ flex: 1, color: Colors.text, fontSize: FontSize.xxl, fontWeight: '500' }}>
          Convidar membro
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Instrução */}
        <Text style={{ color: Colors.muted, fontSize: FontSize.md, marginBottom: Spacing.xl, lineHeight: 22 }}>
          Escolha a permissão, o prazo e gere um link de convite temporário.
        </Text>

        {/* Seletor de role */}
        <Text style={{ color: Colors.muted, fontSize: FontSize.sm, fontWeight: '500', marginBottom: 10, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          Tipo de acesso
        </Text>

        <View style={{ gap: 8, marginBottom: Spacing.xl }}>
          {ROLE_OPTIONS.map(({ role, label, description, icon: RoleIcon }) => {
            const selected = selectedRole === role;
            return (
              <TouchableOpacity
                key={role}
                onPress={() => setSelectedRole(role)}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 14,
                  paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
                  backgroundColor: Colors.card,
                  borderRadius: Radius.md,
                  borderWidth: 1.5,
                  borderColor: selected ? Colors.primary : Colors.border,
                }}
              >
                <RoleIcon size={26} color={selected ? Colors.primary : Colors.muted} strokeWidth={1.5} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: Colors.text, fontSize: FontSize.md, fontWeight: '500' }}>
                      {label}
                    </Text>
                    <RoleBadge role={role} />
                  </View>
                  <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginTop: 4 }}>
                    {description}
                  </Text>
                </View>
                {selected && (
                  <IconCheck size={18} color={Colors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Seletor de duração */}
        <Text style={{ color: Colors.muted, fontSize: FontSize.sm, fontWeight: '500', marginBottom: 10, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          Validade do link
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: Spacing.xl }}>
          {DURATION_OPTIONS.map(({ days, label }) => {
            const sel = selectedDays === days;
            return (
              <TouchableOpacity
                key={days}
                onPress={() => setSelectedDays(days)}
                activeOpacity={0.7}
                style={{
                  flex: 1, paddingVertical: 10,
                  borderRadius: Radius.sm,
                  backgroundColor: sel ? Colors.primary : Colors.card,
                  borderWidth: 1.5,
                  borderColor: sel ? Colors.primary : Colors.border,
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  color: sel ? Colors.onLight : Colors.muted,
                  fontSize: FontSize.sm,
                  fontWeight: sel ? '600' : '400',
                }}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Botão gerar */}
        {!inviteLink ? (
          <TouchableOpacity
            onPress={handleGenerate}
            disabled={loading}
            activeOpacity={0.8}
            style={{
              height: 50, borderRadius: Radius.md,
              backgroundColor: Colors.primary,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            {loading ? (
              <ActivityIndicator color={Colors.onLight} />
            ) : (
              <Text style={{ color: Colors.onLight, fontSize: FontSize.md, fontWeight: '500' }}>
                Gerar link de convite
              </Text>
            )}
          </TouchableOpacity>
        ) : (
          /* Card do link gerado */
          <View style={{
            backgroundColor: Colors.card, borderRadius: Radius.md,
            borderWidth: 1, borderColor: Colors.border,
            padding: Spacing.lg, gap: 12,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ color: Colors.muted, fontSize: FontSize.sm, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, flex: 1 }}>
                Link gerado
              </Text>
              <RoleBadge role={selectedRole} />
            </View>
            <Text
              style={{ color: Colors.text, fontSize: FontSize.sm, lineHeight: 20 }}
              numberOfLines={2}
            >
              {inviteLink.link}
            </Text>
            <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>
              {daysLeftLabel(inviteLink.expiresInDays ?? 7)} •{' '}
              {new Date(inviteLink.expires_at).toLocaleDateString('pt-BR', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </Text>

            {/* Ações */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <TouchableOpacity
                onPress={handleCopy}
                activeOpacity={0.7}
                style={{
                  flex: 1, height: 44, borderRadius: Radius.sm,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                  backgroundColor: copied ? Colors.bg : Colors.card,
                  borderWidth: 1, borderColor: copied ? Colors.primary : Colors.border,
                }}
              >
                {copied
                  ? <IconCheck size={16} color={Colors.primary} />
                  : <IconCopy size={16} color={Colors.muted} />
                }
                <Text style={{ color: copied ? Colors.primary : Colors.muted, fontSize: FontSize.sm }}>
                  {copied ? 'Copiado!' : 'Copiar'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleShare}
                activeOpacity={0.8}
                style={{
                  flex: 1, height: 44, borderRadius: Radius.sm,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                  backgroundColor: Colors.primary,
                }}
              >
                <IconShare size={16} color={Colors.onLight} />
                <Text style={{ color: Colors.onLight, fontSize: FontSize.sm, fontWeight: '500' }}>
                  Compartilhar
                </Text>
              </TouchableOpacity>
            </View>

            {/* Gerar novo link */}
            <TouchableOpacity onPress={handleGenerate} style={{ alignSelf: 'center', marginTop: 4 }}>
              <Text style={{ color: Colors.muted, fontSize: FontSize.sm }}>
                Gerar novo link
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Convites pendentes ── */}
        {pendingInvites.length > 0 && (
          <View style={{ marginTop: Spacing.xl }}>
            <Text style={{
              color: Colors.muted, fontSize: FontSize.sm, fontWeight: '500',
              textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
            }}>
              Links ativos ({pendingInvites.length})
            </Text>
            <View style={{ gap: 8 }}>
              {pendingInvites.map((inv) => (
                <View
                  key={inv.id}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
                    backgroundColor: Colors.card, borderRadius: Radius.md,
                    borderWidth: 1, borderColor: Colors.border,
                  }}
                >
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <RoleBadge role={inv.scope} />
                      {inv.label ? (
                        <Text style={{ color: Colors.text, fontSize: FontSize.sm }} numberOfLines={1}>
                          {inv.label}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={{
                      color: inv.daysLeft <= 1 ? Colors.warning : Colors.muted,
                      fontSize: FontSize.xs,
                    }}>
                      {daysLeftLabel(inv.daysLeft)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRevoke(inv)}
                    hitSlop={8}
                    activeOpacity={0.7}
                  >
                    <IconX size={16} color={Colors.muted} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
