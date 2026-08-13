// src/components/family/RoleBadge.tsx
// Badge visual para exibir o role de um membro da família

import React from 'react';
import { View, Text } from 'react-native';
import { Colors, FontSize, Radius } from '@/constants/theme';
import { UserRole } from '@/types';

const ROLE_LABEL: Record<UserRole, string> = {
  admin:      'Admin',
  parent:     'Responsável',
  child:      'Criança',
  babysitter: 'Babá',
  guest:      'Convidado',
};

// Cores da borda/fundo por role — dentro da paleta escura
const ROLE_COLOR: Record<UserRole, string> = {
  admin:      Colors.primary,    // laranja — destaque máximo
  parent:     Colors.secondary,  // âmbar
  child:      Colors.secondary,  // âmbar — mesmo destaque do parent
  babysitter: Colors.tertiary,   // creme
  guest:      Colors.border,     // sutil
};

interface RoleBadgeProps {
  role: UserRole;
  /** Se true, exibe como chip preenchido; default: outline */
  filled?: boolean;
}

export function RoleBadge({ role, filled = false }: RoleBadgeProps) {
  const color = ROLE_COLOR[role];
  const label = ROLE_LABEL[role];

  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: Radius.full,
        backgroundColor: filled ? color : 'transparent',
        borderWidth: 1,
        borderColor: color,
      }}
    >
      <Text
        style={{
          fontSize: FontSize.xs,
          fontWeight: '500',
          color: filled ? Colors.onLight : color,
          letterSpacing: 0.3,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
