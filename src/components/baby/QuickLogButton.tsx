// src/components/baby/QuickLogButton.tsx
// Botão grande de registro rápido — spec: handoff registro rápido do bebê
// Toque simples: registra agora. Toque longo: abre detalhes.

import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors } from '@/constants/theme';

interface QuickLogButtonProps {
  label: string;
  sublabel?: string; // ex: "2h 15min atrás" ou cronômetro ativo
  color: string;
  icon: React.ReactNode;
  onPress: () => void;
  onLongPress?: () => void;
  /** Quando true, mostra estado "ativo" (ex: sono em andamento) */
  active?: boolean;
  style?: ViewStyle;
}

export function QuickLogButton({
  label,
  sublabel,
  color,
  icon,
  onPress,
  onLongPress,
  active = false,
  style,
}: QuickLogButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityHint="Toque duas vezes e segure para adicionar detalhes"
      style={[
        {
          backgroundColor: active ? `${color}22` : color,
          borderRadius: 16,
          paddingVertical: 18,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: active ? 1.5 : 0,
          borderColor: active ? color : 'transparent',
        },
        style,
      ]}
    >
      {/* Ícone */}
      <View style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: active ? color : `${Colors.onLight}22`,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
      }}>
        {icon}
      </View>

      {/* Labels */}
      <View style={{ flex: 1 }}>
        <Text style={{
          color: active ? color : Colors.onLight,
          fontSize: 16,
          fontWeight: '500',
        }}>
          {label}
        </Text>
        {sublabel ? (
          <Text style={{
            color: active ? `${color}cc` : `${Colors.onLight}99`,
            fontSize: 12,
            marginTop: 2,
          }}>
            {sublabel}
          </Text>
        ) : null}
      </View>

      {/* Indicador de toque longo */}
      {onLongPress ? (
        <View style={{
          width: 4,
          height: 32,
          borderRadius: 2,
          backgroundColor: active ? color : `${Colors.onLight}40`,
        }} />
      ) : null}
    </TouchableOpacity>
  );
}
