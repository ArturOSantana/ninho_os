// src/components/agenda/DayPicker.tsx
// Seletor semanal de 7 dias — spec: handoff agenda
// Scroll horizontal centrado no dia atual

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Colors } from '@/constants/theme';

const WEEKDAY_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

interface DayPickerProps {
  /** Data selecionada (YYYY-MM-DD) */
  selectedDate: string;
  /** Array de datas com eventos (YYYY-MM-DD) */
  datesWithEvents?: string[];
  onSelect: (date: string) => void;
}

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

/** Gera os 7 dias da semana a partir da data selecionada */
function getWeekDays(selected: string): Date[] {
  const sel = new Date(selected + 'T12:00:00');
  const dayOfWeek = sel.getDay(); // 0 = dom
  const sunday = new Date(sel);
  sunday.setDate(sel.getDate() - dayOfWeek);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
}

export function DayPicker({ selectedDate, datesWithEvents = [], onSelect }: DayPickerProps) {
  const scrollRef = useRef<ScrollView>(null);
  const today = isoDate(new Date());
  const days = getWeekDays(selectedDate);

  // Rola para que o dia selecionado fique visível
  useEffect(() => {
    const idx = days.findIndex((d) => isoDate(d) === selectedDate);
    if (scrollRef.current && idx >= 0) {
      scrollRef.current.scrollTo({ x: idx * 52, animated: true });
    }
  }, [selectedDate]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      style={{ flexGrow: 0 }}
    >
      {days.map((day) => {
        const dateStr = isoDate(day);
        const isSelected = dateStr === selectedDate;
        const isToday = dateStr === today;
        const hasEvent = datesWithEvents.includes(dateStr);

        return (
          <TouchableOpacity
            key={dateStr}
            onPress={() => onSelect(dateStr)}
            activeOpacity={0.7}
            style={{
              width: 44,
              alignItems: 'center',
              paddingVertical: 8,
            }}
            accessibilityRole="button"
            accessibilityLabel={`${WEEKDAY_SHORT[day.getDay()]}, ${day.getDate()}, ${hasEvent ? 'com eventos' : 'sem eventos'}`}
            accessibilityState={{ selected: isSelected }}
          >
            {/* Rótulo do dia da semana */}
            <Text style={{
              fontSize: 10,
              color: isSelected ? Colors.primary : Colors.muted,
              fontWeight: '500',
              marginBottom: 4,
              textTransform: 'uppercase',
            }}>
              {WEEKDAY_SHORT[day.getDay()]}
            </Text>

            {/* Círculo do número */}
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: isSelected ? Colors.primary : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: isToday && !isSelected ? 1 : 0,
              borderColor: Colors.primary,
            }}>
              <Text style={{
                fontSize: 14,
                fontWeight: isSelected || isToday ? '600' : '400',
                color: isSelected ? Colors.onLight : Colors.text,
              }}>
                {day.getDate()}
              </Text>
            </View>

            {/* Ponto indicando eventos */}
            <View style={{
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: hasEvent ? Colors.secondary : 'transparent',
              marginTop: 4,
            }} />
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
