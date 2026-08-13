// src/components/mental-load/MentalLoadBar.tsx
// Barra de progresso comparativa entre dois membros

import React from 'react';
import { View, Text } from 'react-native';
import { MemberLoadSummary } from '@/types/differential.types';

interface MentalLoadBarProps {
  members: MemberLoadSummary[];
  showLabels?: boolean;
  height?: number;
}

const COLORS = ['#3b82d4', '#7c5cd8', '#f59e0b', '#10b981'];

export function MentalLoadBar({
  members,
  showLabels = true,
  height = 10,
}: MentalLoadBarProps) {
  const sorted = [...members].sort((a, b) => b.total_points - a.total_points);

  return (
    <View>
      {/* Barra */}
      <View
        className="flex-row rounded-full overflow-hidden bg-gray-100"
        style={{ height }}
      >
        {sorted.map((m, i) => (
          <View
            key={m.member_id}
            style={{
              flex: m.percentage > 0 ? m.percentage : 0,
              backgroundColor: COLORS[i % COLORS.length],
            }}
          />
        ))}
      </View>

      {/* Labels */}
      {showLabels && (
        <View className="flex-row flex-wrap gap-3 mt-2">
          {sorted.map((m, i) => (
            <View key={m.member_id} className="flex-row items-center gap-1">
              <View
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <Text className="text-xs text-gray-600">
                {m.member_name.split(' ')[0]} {m.percentage}%
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
