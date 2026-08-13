import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';
import { Colors, Radius, FontSize } from '@/constants/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'dashed';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const sizeStyles: Record<string, ViewStyle> = {
    sm: { paddingVertical: 8,  paddingHorizontal: 16 },
    md: { paddingVertical: 14, paddingHorizontal: 24 },
    lg: { paddingVertical: 18, paddingHorizontal: 32 },
  };

  const variantStyles: Record<string, ViewStyle> = {
    primary:   { backgroundColor: Colors.primary },
    secondary: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
    ghost:     { backgroundColor: 'transparent' },
    danger:    { backgroundColor: Colors.error },
    dashed:    { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed' },
  };

  const textColors: Record<string, string> = {
    primary:   Colors.onLight,
    secondary: Colors.text,
    ghost:     Colors.primary,
    danger:    Colors.onLight,
    dashed:    Colors.muted,
  };

  const fontSizes: Record<string, number> = {
    sm: FontSize.sm,
    md: FontSize.lg,
    lg: FontSize.xl,
  };

  return (
    <TouchableOpacity
      style={[
        {
          borderRadius:    Radius.lg,
          alignItems:      'center',
          justifyContent:  'center',
          flexDirection:   'row',
        },
        sizeStyles[size],
        variantStyles[variant],
        fullWidth ? { width: '100%' } : undefined,
        (disabled || loading) ? { opacity: 0.55 } : undefined,
        style as ViewStyle,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.78}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColors[variant]} style={{ marginRight: 8 }} />
      ) : null}
      <Text style={{ color: textColors[variant], fontSize: fontSizes[size], fontWeight: '500', letterSpacing: 0.2 }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
