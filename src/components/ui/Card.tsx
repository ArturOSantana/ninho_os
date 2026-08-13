import React from 'react';
import { View, ViewProps, ViewStyle } from 'react-native';
import { Colors, Radius } from '@/constants/theme';

interface CardProps extends ViewProps {
  variant?: 'default' | 'outlined' | 'dashed';
  padding?: number;
  /** Aplica border-radius assimétrico "orgânico" — usado em cards de destaque */
  organic?: boolean;
}

export function Card({ variant = 'default', padding = 16, organic = false, style, children, ...props }: CardProps) {
  const variantStyle: ViewStyle =
    variant === 'outlined'
      ? { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.border }
      : variant === 'dashed'
      ? { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed' }
      : { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border };

  // border-radius assimétrico quando organic=true (spec do handoff)
  const radiusStyle: ViewStyle = organic
    ? {
        borderTopLeftRadius:     Radius['2xl'],
        borderTopRightRadius:    Radius.lg,
        borderBottomRightRadius: Radius['2xl'],
        borderBottomLeftRadius:  Radius.md,
      }
    : { borderRadius: Radius.lg };

  return (
    <View
      style={[
        { padding },
        radiusStyle,
        variantStyle,
        style as ViewStyle,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
