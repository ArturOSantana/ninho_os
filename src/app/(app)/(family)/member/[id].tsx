// src/app/(app)/(family)/member/[id].tsx
// UC028 + UC029 — Perfil do membro: alterar permissão e remover

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  IconChevronLeft, IconCheck, IconTrash,
} from '@tabler/icons-react-native';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';
import { useFamily } from '@/hooks';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { useAuthStore } from '@/stores/auth.store';
import { Avatar } from '@/components/ui/Avatar';
import { RoleBadge } from '@/components/family';
import { UserRole, Profile } from '@/types';

const ROLE_OPTIONS: { role: UserRole; label: string; description: string }[] = [
  { role: 'parent',     label: 'Responsável', description: 'Acesso total' },
  { role: 'babysitter', label: 'Babá',        description: 'Registrar atividades' },
  { role: 'guest',      label: 'Convidado',   description: 'Somente visualização' },
];

export default function MemberDetailScreen() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const { id }   = useLocalSearchParams<{ id: string }>();
  const { family } = useFamily();
  const { profile: authProfile } = useAuthStore();

  const { members, loading, load, updateRole, removeMember } =
    useFamilyMembers(family?.id);

  useEffect(() => { load(); }, [load]);

  const member: Profile | undefined = members.find((m) => m.id === id);

  const [selectedRole, setSelectedRole] = useState<UserRole>(
    member?.role ?? 'guest'
  );
  const [saving, setSaving] = useState(false);

  // Sincroniza role quando member carregar
  useEffect(() => {
    if (member) setSelectedRole(member.role);
  }, [member?.role]);

  if (!member && !loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: Colors.muted }}>Membro não encontrado</Text>
      </View>
    );
  }

  // Contagem de admins atuais para bloquear rebaixamento do último admin na UI
  const adminCount = members.filter((m) => m.role === 'admin').length;
  const isLastAdmin = member?.role === 'admin' && adminCount <= 1;

  const hasChanges = member && selectedRole !== member.role;
  // Bloqueia salvar se tentaria rebaixar o único admin
  const wouldLeaveZeroAdmins = isLastAdmin && selectedRole !== 'admin';

  const handleSave = async () => {
    if (!member || !hasChanges) return;

    if (wouldLeaveZeroAdmins) {
      Alert.alert(
        'Ação bloqueada',
        'A família precisa ter ao menos um administrador. Promova outro membro antes de rebaixar este.'
      );
      return;
    }

    setSaving(true);
    try {
      await updateRole(member.id, selectedRole);
      router.back();
    } catch (err) {
      Alert.alert('Erro', err instanceof Error ? err.message : 'Não foi possível alterar a permissão.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = () => {
    if (!member) return;

    if (isLastAdmin) {
      Alert.alert(
        'Ação bloqueada',
        'Não é possível remover o único administrador da família. Promova outro membro primeiro.'
      );
      return;
    }

    Alert.alert(
      'Remover membro',
      `Tem certeza que deseja remover ${member.name} da família? O acesso será revogado imediatamente.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMember(member.id);
              router.back();
            } catch (err) {
              Alert.alert('Erro', err instanceof Error ? err.message : 'Não foi possível remover o membro.');
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
          Membro
        </Text>
        {hasChanges && (
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={{
              paddingHorizontal: 14, paddingVertical: 7,
              backgroundColor: Colors.primary, borderRadius: Radius.full,
              flexDirection: 'row', alignItems: 'center', gap: 6,
            }}
            activeOpacity={0.8}
          >
            {saving
              ? <ActivityIndicator size="small" color={Colors.onLight} />
              : <IconCheck size={16} color={Colors.onLight} />
            }
            <Text style={{ color: Colors.onLight, fontSize: FontSize.sm, fontWeight: '500' }}>
              Salvar
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {loading && !member ? (
          <View style={{ paddingTop: 80, alignItems: 'center' }}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : member ? (
          <>
            {/* Card de perfil */}
            <View style={{
              backgroundColor: Colors.card, borderRadius: Radius.md,
              borderWidth: 1, borderColor: Colors.border,
              padding: Spacing.xl, alignItems: 'center', gap: 12,
              marginBottom: Spacing.xl,
            }}>
              <Avatar name={member.name} size={72} />
              <View style={{ alignItems: 'center', gap: 6 }}>
                <Text style={{ color: Colors.text, fontSize: FontSize.xl, fontWeight: '500' }}>
                  {member.name}
                </Text>
                <RoleBadge role={member.role} filled />
              </View>
              <Text style={{ color: Colors.muted, fontSize: FontSize.sm }}>
                Membro desde{' '}
                {new Date(member.created_at).toLocaleDateString('pt-BR', {
                  month: 'long', year: 'numeric',
                })}
              </Text>
            </View>

            {/* Seletor de role — UC028 */}
            <Text style={{
              color: Colors.muted, fontSize: FontSize.sm, fontWeight: '500',
              textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
            }}>
              Permissão
            </Text>

            <View style={{ gap: 8, marginBottom: Spacing.xl }}>
              {ROLE_OPTIONS.map(({ role, label, description }) => {
                const sel = selectedRole === role;
                return (
                  <TouchableOpacity
                    key={role}
                    onPress={() => setSelectedRole(role)}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 14,
                      paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
                      backgroundColor: Colors.card, borderRadius: Radius.md,
                      borderWidth: 1.5,
                      borderColor: sel ? Colors.primary : Colors.border,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: Colors.text, fontSize: FontSize.md, fontWeight: '500' }}>
                        {label}
                      </Text>
                      <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginTop: 3 }}>
                        {description}
                      </Text>
                    </View>
                    {sel && <IconCheck size={18} color={Colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Remover membro — UC027 */}
            {isLastAdmin && (
              <View style={{
                paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
                backgroundColor: Colors.card, borderRadius: Radius.md,
                borderWidth: 1, borderColor: Colors.border,
                marginBottom: 8,
              }}>
                <Text style={{ color: Colors.muted, fontSize: FontSize.sm, lineHeight: 18 }}>
                  Este é o único administrador. Para removê-lo ou rebaixá-lo, primeiro promova outro membro.
                </Text>
              </View>
            )}
            <TouchableOpacity
              onPress={handleRemove}
              activeOpacity={0.7}
              disabled={isLastAdmin}
              style={{
                height: 48, borderRadius: Radius.md,
                borderWidth: 1.5,
                borderColor: isLastAdmin ? Colors.border : Colors.error,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: isLastAdmin ? 0.45 : 1,
              }}
            >
              <IconTrash size={18} color={isLastAdmin ? Colors.muted : Colors.error} />
              <Text style={{
                color: isLastAdmin ? Colors.muted : Colors.error,
                fontSize: FontSize.md, fontWeight: '500',
              }}>
                Remover da família
              </Text>
            </TouchableOpacity>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
