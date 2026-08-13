// src/components/ui/Avatar.tsx
import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { Colors } from '@/constants/theme';

interface AvatarProps {
  name: string;
  size?: number;
  bgColor?: string;
  style?: ViewStyle;
}

const PALETTE = [
  '#5b7cf6', // indigo
  '#38bdf8', // sky
  '#22c55e', // green
  '#f59e0b', // amber
  '#a78bfa', // violet
  '#f472b6', // pink
];

function nameToColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

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
      style={[{
        width:           size,
        height:          size,
        borderRadius:    size / 2,
        backgroundColor: bg,
        alignItems:      'center',
        justifyContent:  'center',
      }, style]}
      accessible
      accessibilityLabel={`Avatar de ${name}`}
    >
      <Text style={{
        color:       '#ffffff',
        fontSize,
        fontWeight:  '600',
        letterSpacing: 0.3,
      }} numberOfLines={1}>
        {initials}
      </Text>
    </View>
  );
}
