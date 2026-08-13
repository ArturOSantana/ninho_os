// src/components/ui/Button.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
  View,
} from 'react-native';
import { Colors, Radius, FontSize } from '@/constants/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'dashed';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  leftIcon,
  ...props
}: ButtonProps) {
  const sizeStyles: Record<string, ViewStyle> = {
    sm: { paddingVertical: 7,  paddingHorizontal: 14 },
    md: { paddingVertical: 12, paddingHorizontal: 20 },
    lg: { paddingVertical: 15, paddingHorizontal: 28 },
  };

  const variantStyles: Record<string, ViewStyle> = {
    primary:   { backgroundColor: Colors.primary },
    secondary: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
    ghost:     { backgroundColor: 'transparent' },
    danger:    { backgroundColor: '#3a1212', borderWidth: 1, borderColor: Colors.error },
    dashed:    { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed' },
  };

  const textColors: Record<string, string> = {
    primary:   Colors.textOnPrimary,
    secondary: Colors.text,
    ghost:     Colors.primary,
    danger:    Colors.error,
    dashed:    Colors.muted,
  };

  const fontSizes: Record<string, number> = {
    sm: FontSize.sm,
    md: FontSize.md,
    lg: FontSize.lg,
  };

  return (
    <TouchableOpacity
      style={[
        {
          borderRadius:   Radius.md,
          alignItems:     'center',
          justifyContent: 'center',
          flexDirection:  'row',
          gap:            8,
        },
        sizeStyles[size],
        variantStyles[variant],
        fullWidth ? { width: '100%' } : undefined,
        (disabled || loading) ? { opacity: 0.45 } : undefined,
        style as ViewStyle,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.75}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColors[variant]} />
      ) : leftIcon ? (
        <View>{leftIcon}</View>
      ) : null}
      <Text style={{
        color:       textColors[variant],
        fontSize:    fontSizes[size],
        fontWeight:  '500',
        letterSpacing: 0.1,
      }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
