// src/components/notifications/NotificationBadge.tsx
// Badge numérico para ícone de notificações na tab bar

import React from 'react';
import { View, Text } from 'react-native';

interface NotificationBadgeProps {
  count: number;
  maxCount?: number;
}

export function NotificationBadge({
  count,
  maxCount = 99,
}: NotificationBadgeProps) {
  if (count <= 0) return null;

  const label = count > maxCount ? `${maxCount}+` : String(count);

  return (
    <View
      className="absolute -top-1 -right-1 bg-red-500 rounded-full items-center justify-center"
      style={{
        minWidth: 16,
        height: 16,
        paddingHorizontal: 3,
      }}
    >
      <Text className="text-white font-bold" style={{ fontSize: 9 }}>
        {label}
      </Text>
    </View>
  );
}
