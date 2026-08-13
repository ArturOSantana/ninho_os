// src/components/baby/QuickRegister.tsx
// Registro rápido do bebê — fluxo crítico, <5s para registrar uma mamada

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Colors, Radius, Spacing, FontSize } from '@/constants/theme';
import { IconBabyBottle, IconMoon, IconDroplet } from '@tabler/icons-react-native';

interface QuickRegisterProps {
  onSelect: (type: 'feeding' | 'sleep' | 'diaper') => void;
  sleepActive?: boolean; // sono em andamento
  sleepTimer?: string;   // "01:23:45"
  lastRecords?: { type: string; timeAgo: string }[];
}

const ACTIONS: {
  type: 'feeding' | 'sleep' | 'diaper';
  label: string;
  activeLabel: string;
  bgColor: string;
  iconColor: string;
  icon: React.ReactNode;
}[] = [
  {
    type: 'feeding',
    label: 'mamada',
    activeLabel: 'mamada',
    bgColor: Colors.primary,
    iconColor: Colors.onLight,
    icon: null, // preenchido abaixo
  },
  {
    type: 'sleep',
    label: 'sono',
    activeLabel: 'acordou',
    bgColor: Colors.secondary,
    iconColor: '#412402',
    icon: null,
  },
  {
    type: 'diaper',
    label: 'troca de fralda',
    activeLabel: 'troca de fralda',
    bgColor: Colors.tertiary,
    iconColor: '#712b13',
    icon: null,
  },
];

export function QuickRegister({
  onSelect,
  sleepActive = false,
  sleepTimer,
  lastRecords = [],
}: QuickRegisterProps) {
  // Debounce de 800ms por botão
  const lastTap = useRef<Record<string, number>>({});

  const handlePress = useCallback(
    (type: 'feeding' | 'sleep' | 'diaper') => {
      const now = Date.now();
      if (now - (lastTap.current[type] ?? 0) < 800) return; // debounce
      lastTap.current[type] = now;
      onSelect(type);
    },
    [onSelect]
  );

  return (
    <View style={{ gap: Spacing.md }}>
      {/* Três botões grandes empilhados */}
      {ACTIONS.map(({ type, label, activeLabel, bgColor, iconColor }) => {
        const isActiveSleep = type === 'sleep' && sleepActive;
        const displayLabel = isActiveSleep ? activeLabel : label;

        return (
          <TouchableOpacity
            key={type}
            onPress={() => handlePress(type)}
            activeOpacity={0.85}
            style={{
              backgroundColor: bgColor,
              borderRadius: Radius.lg,
              paddingVertical: 22,
              paddingHorizontal: Spacing['2xl'],
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
            accessibilityRole="button"
            accessibilityHint="toque duas vezes e segure para adicionar detalhes"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              {type === 'feeding' && (
                <IconBabyBottle size={24} color={iconColor} />
              )}
              {type === 'sleep' && (
                <IconMoon size={24} color={iconColor} />
              )}
              {type === 'diaper' && (
                <IconDroplet size={24} color={iconColor} />
              )}
              <Text
                style={{
                  color: iconColor,
                  fontSize: FontSize.lg,
                  fontWeight: '500',
                }}
              >
                {displayLabel}
              </Text>
            </View>

            {/* Cronômetro de sono ativo */}
            {isActiveSleep && sleepTimer ? (
              <Text
                style={{
                  color: iconColor,
                  fontSize: FontSize.md,
                  fontWeight: '500',
                  fontVariant: ['tabular-nums'],
                }}
              >
                {sleepTimer}
              </Text>
            ) : null}
          </TouchableOpacity>
        );
      })}

      {/* Divisor */}
      {lastRecords.length > 0 && (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: Colors.border,
            marginTop: Spacing.sm,
            paddingTop: Spacing.md,
            gap: Spacing.sm,
          }}
        >
          <Text
            style={{
              color: Colors.muted,
              fontSize: FontSize.xs,
              fontWeight: '500',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}
          >
            últimos registros
          </Text>
          {lastRecords.slice(0, 3).map((r, i) => (
            <View
              key={i}
              style={{ flexDirection: 'row', justifyContent: 'space-between' }}
            >
              <Text style={{ color: Colors.text, fontSize: FontSize.sm }}>
                {r.type}
              </Text>
              <Text style={{ color: Colors.muted, fontSize: FontSize.sm }}>
                {r.timeAgo}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
