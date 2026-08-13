// src/components/mental-load/MemberLoadCard.tsx
// Card com pontuação e ranking de um membro

import React from 'react';
import { View, Text } from 'react-native';
import { MemberLoadSummary } from '@/types/differential.types';

interface MemberLoadCardProps {
  member: MemberLoadSummary;
  rank: number;
  totalFamilyPoints: number;
}

const MEDALS = ['🥇', '🥈', '🥉'];
const RANK_COLORS = ['#3b82d4', '#7c5cd8', '#f59e0b'];

export function MemberLoadCard({
  member,
  rank,
  totalFamilyPoints,
}: MemberLoadCardProps) {
  const medal = MEDALS[rank] ?? '🏅';
  const barColor = RANK_COLORS[rank] ?? '#9ca3af';

  return (
    <View className="bg-white border border-gray-200 rounded-xl p-4">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <Text className="text-2xl">{medal}</Text>
          <View>
            <Text className="text-sm font-semibold text-gray-900">
              {member.member_name}
            </Text>
            <Text className="text-xs text-gray-500">
              {member.total_points} pontos
            </Text>
          </View>
        </View>
        <Text className="text-lg font-bold" style={{ color: barColor }}>
          {member.percentage}%
        </Text>
      </View>

      {/* Barra de progresso */}
      <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{
            width: `${member.percentage}%`,
            backgroundColor: barColor,
          }}
        />
      </View>

      {/* Detalhe de pontos total da família */}
      {totalFamilyPoints > 0 && (
        <Text className="text-xs text-gray-400 mt-2 text-right">
          de {totalFamilyPoints} pts totais
        </Text>
      )}
    </View>
  );
}
