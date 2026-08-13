// src/components/agenda/EventCard.tsx

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  IconStethoscope,
  IconVaccine,
  IconSchool,
  IconUser,
  IconCalendar,
  type Icon,
} from '@tabler/icons-react-native';
import { FamilyEvent, EventCategory } from '@/types';
import { isVaccineAlert } from '@/hooks/useAgenda';

const CATEGORY_CONFIG: Record<EventCategory, { icon: Icon; label: string; bg: string; text: string }> = {
  appointment: { icon: IconStethoscope, label: 'Consulta', bg: 'bg-blue-50',   text: 'text-blue-600'   },
  vaccine:     { icon: IconVaccine,     label: 'Vacina',   bg: 'bg-amber-50',  text: 'text-amber-600'  },
  school:      { icon: IconSchool,      label: 'Escola',   bg: 'bg-yellow-50', text: 'text-yellow-600' },
  personal:    { icon: IconUser,        label: 'Pessoal',  bg: 'bg-purple-50', text: 'text-purple-600' },
  other:       { icon: IconCalendar,    label: 'Outro',    bg: 'bg-gray-50',   text: 'text-gray-600'   },
};

// Cores de alerta para vacina urgente (≤ 3 dias) — Design token Colors.warning (#FF9500)
// Nota: alerta de vacina usa laranja/âmbar, nunca vermelho (#FF3B30)
const ALERT_BORDER  = '#FF9500';
const ALERT_BG      = '#1e1a0a';
const ALERT_TEXT    = '#f0b429';
const ALERT_ICON_BG = '#2a2010';

function formatDate(iso: string, allDay: boolean): string {
  const date = new Date(iso);
  if (allDay) {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Retorna quantos dias faltam para a vacina (arredondado pra cima, mínimo 0) */
function daysUntil(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

interface EventCardProps {
  event: FamilyEvent;
  onDelete: () => void;
}

export function EventCard({ event, onDelete }: EventCardProps) {
  const config  = CATEGORY_CONFIG[event.category] ?? CATEGORY_CONFIG.other;
  const isPast  = new Date(event.start_at) < new Date();
  const isAlert = isVaccineAlert(event); // vacina nos próximos 3 dias

  const days = isAlert ? daysUntil(event.start_at) : 0;
  const alertLabel = days === 0 ? 'Hoje!' : days === 1 ? 'Amanhã!' : `Em ${days} dias`;

  return (
    <View
      className={`rounded-xl border p-4 ${isPast ? 'opacity-60' : ''}`}
      style={isAlert ? { borderColor: ALERT_BORDER, backgroundColor: ALERT_BG } : undefined}
      accessible
      accessibilityLabel={`${event.title}${isAlert ? `, alerta: vacina ${alertLabel}` : ''}`}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-row items-start flex-1">
          {/* Ícone de categoria */}
          <View
            className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${isAlert ? '' : config.bg}`}
            style={isAlert ? { backgroundColor: ALERT_ICON_BG } : undefined}
          >
            {React.createElement(config.icon, { size: 20, color: isAlert ? ALERT_TEXT : '#888', strokeWidth: 1.8 })}
          </View>

          <View className="flex-1">
            <Text
              className="text-sm font-semibold"
              style={{ color: isAlert ? ALERT_TEXT : undefined }}
              numberOfLines={1}
            >
              {event.title}
            </Text>
            <Text
              className={`text-xs mt-0.5 ${isAlert ? '' : config.text}`}
              style={isAlert ? { color: ALERT_TEXT } : undefined}
            >
              {config.label} · {formatDate(event.start_at, event.all_day)}
            </Text>
            {event.description ? (
              <Text className="text-xs text-gray-400 mt-1" numberOfLines={2}>
                {event.description}
              </Text>
            ) : null}

            {/* Badge de urgência — só aparece para vacinas ≤ 3 dias */}
            {isAlert && (
              <View
                style={{
                  marginTop: 6,
                  alignSelf: 'flex-start',
                  backgroundColor: ALERT_BORDER,
                  borderRadius: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                }}
                accessibilityLabel={`Urgente: vacina ${alertLabel}`}
              >
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>
                  {alertLabel}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Botão excluir */}
        <TouchableOpacity
          onPress={onDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
          className="ml-2"
          accessibilityLabel="Excluir evento"
          accessibilityRole="button"
        >
          <Text className="text-gray-300 text-lg">✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
