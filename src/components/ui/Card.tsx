// src/components/ui/Card.tsx
import React from 'react';
import { View, ViewProps, ViewStyle, TouchableOpacity } from 'react-native';
import { Colors, Radius } from '@/constants/theme';

interface CardProps extends ViewProps {
  variant?: 'default' | 'outlined' | 'dashed' | 'flat';
  padding?: number;
  onPress?: () => void;
  /**
   * Aplica border-radius assimétrico tipo "blob orgânico" ao card.
   * Usado nos cards de membros e destaques do handoff v2.
   */
  organic?: boolean;
}

// Border-radius assimétrico — spec handoff v2
const ORGANIC_RADIUS: ViewStyle = {
  borderTopLeftRadius:     38,
  borderTopRightRadius:    58,
  borderBottomRightRadius: 52,
  borderBottomLeftRadius:  44,
};

export function Card({
  variant = 'default',
  padding = 16,
  onPress,
  organic = false,
  style,
  children,
  ...props
}: CardProps) {
  const variantStyle: ViewStyle =
    variant === 'outlined'
      ? { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.border }
      : variant === 'dashed'
      ? { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed' }
      : variant === 'flat'
      ? { backgroundColor: Colors.bgCard }
      : { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border };

  const baseStyle: ViewStyle = {
    ...(organic ? ORGANIC_RADIUS : { borderRadius: Radius.lg }),
    padding,
    ...(variantStyle as object),
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.78}
        style={[baseStyle, style as ViewStyle]}
        {...(props as any)}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[baseStyle, style as ViewStyle]}
      {...props}
    >
      {children}
    </View>
  );
}
