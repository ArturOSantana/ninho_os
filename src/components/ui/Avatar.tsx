// src/components/ui/Avatar.tsx
// Componente Avatar — gera iniciais a partir do nome
// Usado em: onboarding, tarefas, membros da família

import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { Colors } from '@/constants/theme';

interface AvatarProps {
  name: string;
  size?: number;
  /** Cor de fundo customizada. Padrão: derivada do nome */
  bgColor?: string;
  style?: ViewStyle;
}

/** Gera uma cor de fundo determinística a partir do nome */
function nameToColor(name: string): string {
  const palette = [
    Colors.primary,
    Colors.secondary,
    '#3b82d4',
    '#7c5cd8',
    '#22c55e',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

/** Extrai no máximo 2 iniciais de um nome completo */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function Avatar({ name, size = 34, bgColor, style }: AvatarProps) {
  const bg = bgColor ?? nameToColor(name);
  const initials = getInitials(name);
  const fontSize = Math.round(size * 0.38);

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
      accessible
      accessibilityLabel={`Avatar de ${name}`}
    >
      <Text
        style={{
          color: Colors.onLight,
          fontSize,
          fontWeight: '600',
          letterSpacing: 0.5,
        }}
        numberOfLines={1}
      >
        {initials}
      </Text>
    </View>
  );
}
