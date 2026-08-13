// src/components/family/MemberCard.tsx
// Card de membro da família — exibe avatar, nome, role e ações

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { IconChevronRight, IconCrown, IconClock } from '@tabler/icons-react-native';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { Profile } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { RoleBadge } from './RoleBadge';

interface MemberCardProps {
  member: Profile;
  /** ID do usuário autenticado — para esconder opções no próprio perfil */
  currentUserId?: string;
  /** Usuário autenticado é admin? */
  isAdmin?: boolean;
  /** Dias restantes do convite pendente (exibe badge de expiração) */
  inviteDaysLeft?: number;
  onPress?: (member: Profile) => void;
}

export function MemberCard({
  member,
  currentUserId,
  isAdmin,
  inviteDaysLeft,
  onPress,
}: MemberCardProps) {
  const isSelf = member.user_id === currentUserId;
  const showChevron = isAdmin && !isSelf;
  const showExpiryBadge = inviteDaysLeft !== undefined;

  return (
    <TouchableOpacity
      onPress={() => onPress?.(member)}
      activeOpacity={onPress ? 0.7 : 1}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        backgroundColor: Colors.card,
        borderRadius: Radius.md,
        gap: 12,
      }}
    >
      {/* Avatar */}
      <Avatar name={member.name} size={42} />

      {/* Info */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text
            style={{
              color: Colors.text,
              fontSize: FontSize.md,
              fontWeight: '500',
            }}
            numberOfLines={1}
          >
            {member.name}
          </Text>
          {isSelf && (
            <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>
              (você)
            </Text>
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
          <RoleBadge role={member.role} />
          {showExpiryBadge && (
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 3,
              paddingHorizontal: 7, paddingVertical: 2,
              borderRadius: Radius.full,
              backgroundColor: inviteDaysLeft! <= 1 ? Colors.warning + '22' : Colors.border + '55',
              borderWidth: 1,
              borderColor: inviteDaysLeft! <= 1 ? Colors.warning : Colors.border,
            }}>
              <IconClock size={10} color={inviteDaysLeft! <= 1 ? Colors.warning : Colors.muted} />
              <Text style={{
                fontSize: FontSize.xs,
                color: inviteDaysLeft! <= 1 ? Colors.warning : Colors.muted,
                fontWeight: '500',
              }}>
                {inviteDaysLeft! <= 0
                  ? 'Expirado'
                  : inviteDaysLeft! === 1
                  ? 'Expira amanhã'
                  : `${inviteDaysLeft} dias`}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Admin crown para admins */}
      {member.role === 'admin' && (
        <IconCrown size={16} color={Colors.primary} />
      )}

      {/* Chevron se pode editar */}
      {showChevron && <IconChevronRight size={16} color={Colors.border} />}
    </TouchableOpacity>
  );
}
