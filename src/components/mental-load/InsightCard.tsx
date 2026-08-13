// src/components/mental-load/InsightCard.tsx
// Card de insight com ação sugerida

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { IconInfoCircle, IconAlertTriangle, IconCircleCheck } from '@tabler/icons-react-native';
import { AIInsight, InsightSeverity } from '@/types/differential.types';

interface InsightCardProps {
  insight: AIInsight;
  onAction?: () => void;
  compact?: boolean;
}

const SEVERITY_CONFIG: Record<
  InsightSeverity,
  { bg: string; border: string; textColor: string; icon: React.ReactNode }
> = {
  info:     { bg: 'bg-blue-50',  border: 'border-blue-200',  textColor: 'text-blue-700',  icon: <IconInfoCircle     size={18} color="#1d4ed8" /> },
  warning:  { bg: 'bg-amber-50', border: 'border-amber-200', textColor: 'text-amber-700', icon: <IconAlertTriangle  size={18} color="#b45309" /> },
  positive: { bg: 'bg-green-50', border: 'border-green-200', textColor: 'text-green-700', icon: <IconCircleCheck    size={18} color="#15803d" /> },
};

export function InsightCard({ insight, onAction, compact = false }: InsightCardProps) {
  const config = SEVERITY_CONFIG[insight.severity];

  return (
    <View className={`${config.bg} border ${config.border} rounded-xl p-4`}>
      <View className="flex-row items-start gap-2">
        {config.icon}
        <View className="flex-1">
          <Text className={`text-sm font-semibold ${config.textColor}`}>
            {insight.title}
          </Text>
          {!compact && (
            <Text className="text-sm text-gray-600 mt-1">{insight.description}</Text>
          )}
          {!compact && insight.suggested_action && (
            <Text className="text-xs text-gray-500 italic mt-1.5">
              {insight.suggested_action}
            </Text>
          )}
        </View>
      </View>

      {onAction && insight.suggested_action && (
        <TouchableOpacity
          onPress={onAction}
          className="mt-3 bg-white border border-gray-300 rounded-lg py-2 items-center"
          activeOpacity={0.7}
        >
          <Text className="text-xs font-medium text-gray-700">Ver detalhes</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
