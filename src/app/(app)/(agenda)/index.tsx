// src/app/(app)/(agenda)/index.tsx
// UC017 — Visualizar Agenda | UC-Vacina — Alerta visual ≤ 3 dias | UC010 — Deep-link com destaque

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
  PanResponder, useWindowDimensions, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  IconPlus, IconCalendar, IconChevronLeft,
  IconChevronRight, IconRepeat,
} from '@tabler/icons-react-native';
import { useFamily } from '@/hooks';
import { useAgenda } from '@/hooks/useAgenda';
import {
  FamilyEvent, EventCategory, EventRecurrence,
  EVENT_CATEGORY_LABELS,
} from '@/types/productivity.types';
import { Colors } from '@/constants/theme';
import { TutorialOverlay } from '@/components/ui/TutorialOverlay';
import { useTutorial } from '@/hooks/useTutorial';

const DAYS_OF_WEEK = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const DAYS_FULL    = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

const MONTHS_PT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

const CATEGORY_COLORS: Record<string, string> = {
  health:      Colors.primary,
  vaccine:     Colors.secondary,
  appointment: Colors.primary,
  birthday:    Colors.secondary,
  school:      Colors.tertiary,
  personal:    Colors.border,
  other:       Colors.border,
};

// Cores do banner de alerta de vacina — handoff v2: sem vermelho para estados normais.
// Vacina urgente usa accent-secondary (âmbar) — tom de atenção, não de erro técnico.
const VACCINE_ALERT_BG     = '#261e0a';
const VACCINE_ALERT_BORDER = '#f0b429'; // Colors.secondary
const VACCINE_ALERT_TEXT   = '#f0b429';

/** Rótulos de recorrência em pt-BR */
const RECURRENCE_LABELS: Record<EventRecurrence, string> = {
  none:    '',
  daily:   'Diário',
  weekly:  'Semanal',
  monthly: 'Mensal',
  yearly:  'Anual',
};

function formatEventTime(iso: string, allDay: boolean): string {
  const d = new Date(iso);
  if (allDay) return `${d.getDate()} de ${MONTHS_PT[d.getMonth()]}`;
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function daysUntil(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

/** Retorna a segunda-feira da semana que contém `d` */
function weekStart(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  const dow = copy.getDay(); // 0=dom
  // Semana começa no domingo (getDay() === 0)
  copy.setDate(copy.getDate() - dow);
  return copy;
}

/** Gera os 7 dias da semana de `sunday` em diante */
function weekDays(sunday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

// ─── EventCard ───────────────────────────────────────────────────

function EventCard({
  event,
  onDelete,
  onEdit,
  highlighted,
}: {
  event: FamilyEvent;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  highlighted?: boolean;
}) {
  const catColor = CATEGORY_COLORS[event.category] ?? Colors.border;
  const diff     = new Date(event.start_at).getTime() - Date.now();
  const isUrgent = event.category === 'vaccine' && diff >= 0 && diff <= 3 * 24 * 60 * 60 * 1000;
  const isRecurring = event.recurrence && event.recurrence !== 'none';

  const days = isUrgent ? daysUntil(event.start_at) : 0;
  const alertLabel = days === 0 ? 'Hoje!' : days === 1 ? 'Amanhã!' : `Em ${days} dias`;

  return (
    <TouchableOpacity
      onPress={() => onEdit(event.id)}
      onLongPress={() =>
        Alert.alert(event.title, 'O que deseja fazer?', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Editar', onPress: () => onEdit(event.id) },
          { text: 'Excluir', style: 'destructive', onPress: () => onDelete(event.id) },
        ])
      }
      activeOpacity={0.78}
      accessibilityLabel={
        `${event.title}, ` +
        `${EVENT_CATEGORY_LABELS[event.category as EventCategory] ?? 'Evento'}, ` +
        `${formatEventTime(event.start_at, event.all_day)}` +
        `${isRecurring ? `, recorrência ${RECURRENCE_LABELS[event.recurrence!]}` : ''}` +
        `${isUrgent ? `, alerta: vacina ${alertLabel}` : ''}`
      }
      style={{
        backgroundColor: isUrgent ? VACCINE_ALERT_BG : Colors.card,
        borderRadius: 12,
        borderWidth: highlighted ? 2 : 1,
        borderColor: highlighted ? Colors.primary : isUrgent ? VACCINE_ALERT_BORDER : Colors.border,
        flexDirection: 'row',
        overflow: 'hidden',
        marginBottom: 10,
      }}
    >
      {/* Barra lateral de categoria (4px) */}
      <View style={{ width: 4, backgroundColor: isUrgent ? VACCINE_ALERT_BORDER : catColor }} />

      <View style={{ flex: 1, padding: 14 }}>
        {/* Linha do título + ícone de repetição */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text
            style={{ flex: 1, color: isUrgent ? VACCINE_ALERT_TEXT : Colors.text, fontSize: 14, fontWeight: '500' }}
            numberOfLines={1}
          >
            {event.title}
          </Text>
          {isRecurring && (
            <IconRepeat
              size={14}
              color={isUrgent ? VACCINE_ALERT_TEXT : Colors.muted}
              accessibilityLabel={`Evento recorrente: ${RECURRENCE_LABELS[event.recurrence!]}`}
            />
          )}
        </View>

        <Text style={{ color: isUrgent ? VACCINE_ALERT_TEXT : Colors.muted, fontSize: 12, marginTop: 3 }}>
          {EVENT_CATEGORY_LABELS[event.category as EventCategory] ?? 'Evento'} · {formatEventTime(event.start_at, event.all_day)}
          {isRecurring ? ` · ${RECURRENCE_LABELS[event.recurrence!]}` : ''}
        </Text>

        {event.description ? (
          <Text style={{ color: Colors.muted, fontSize: 12, marginTop: 4 }} numberOfLines={2}>
            {event.description}
          </Text>
        ) : null}

        {/* Badge urgente — vacinas ≤ 3 dias */}
        {isUrgent && (
          <View style={{
            marginTop: 6, alignSelf: 'flex-start',
            backgroundColor: VACCINE_ALERT_BORDER + '33',
            borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
            borderWidth: 1,
            borderColor: VACCINE_ALERT_BORDER,
          }}>
            <Text style={{ color: VACCINE_ALERT_TEXT, fontSize: 11, fontWeight: '600' }}>
              💉 {alertLabel}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── VaccineAlertBanner ───────────────────────────────────────────

function VaccineAlertBanner({ alerts, onPress }: { alerts: FamilyEvent[]; onPress: () => void }) {
  if (alerts.length === 0) return null;
  const first = alerts[0];
  const days  = daysUntil(first.start_at);
  const urgencyText = days === 0 ? 'hoje' : days === 1 ? 'amanhã' : `em ${days} dias`;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Alerta: ${alerts.length} vacina${alerts.length > 1 ? 's' : ''} próxima${alerts.length > 1 ? 's' : ''}`}
      style={{
        marginHorizontal: 16, marginTop: 10, marginBottom: 2,
        borderRadius: 12, borderWidth: 1,
        borderColor: VACCINE_ALERT_BORDER, backgroundColor: VACCINE_ALERT_BG,
        flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10,
      }}
    >
      <Text style={{ fontSize: 22 }}>💉</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ color: VACCINE_ALERT_TEXT, fontSize: 13, fontWeight: '600' }}>
          {alerts.length === 1
            ? `Vacina "${first.title}" ${urgencyText}`
            : `${alerts.length} vacinas nos próximos 3 dias`}
        </Text>
        <Text style={{ color: VACCINE_ALERT_TEXT + 'cc', fontSize: 11, marginTop: 2 }}>
          Toque para ver os eventos do dia
        </Text>
      </View>
      <Text style={{ color: VACCINE_ALERT_TEXT, fontSize: 18 }}>›</Text>
    </TouchableOpacity>
  );
}

// ─── DayPicker com scroll semanal ────────────────────────────────

function DayPicker({
  selected,
  onChange,
  events,
  weekSunday,
  onWeekChange,
}: {
  selected: Date;
  onChange: (d: Date) => void;
  events: FamilyEvent[];
  weekSunday: Date;
  onWeekChange: (sunday: Date) => void;
}) {
  const days = weekDays(weekSunday);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // PanResponder para swipe horizontal na linha de dias
  const swipeRef = useRef(0);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_e, gs) => Math.abs(gs.dx) > 12 && Math.abs(gs.dy) < 30,
      onPanResponderGrant: (_e, gs) => { swipeRef.current = gs.dx; },
      onPanResponderRelease: (_e, gs) => {
        if (gs.dx < -40) {
          // swipe left → semana seguinte
          const next = new Date(weekSunday);
          next.setDate(next.getDate() + 7);
          onWeekChange(next);
        } else if (gs.dx > 40) {
          // swipe right → semana anterior
          const prev = new Date(weekSunday);
          prev.setDate(prev.getDate() - 7);
          onWeekChange(prev);
        }
      },
    })
  ).current;

  const goToPrevWeek = () => {
    const prev = new Date(weekSunday);
    prev.setDate(prev.getDate() - 7);
    onWeekChange(prev);
  };
  const goToNextWeek = () => {
    const next = new Date(weekSunday);
    next.setDate(next.getDate() + 7);
    onWeekChange(next);
  };

  // Rótulo do mês/semana no cabeçalho: "jul 2025" ou "jul–ago 2025"
  const firstDay = days[0];
  const lastDay  = days[6];
  const monthLabel =
    firstDay.getMonth() === lastDay.getMonth()
      ? `${MONTHS_PT[firstDay.getMonth()]} ${firstDay.getFullYear()}`
      : `${MONTHS_PT[firstDay.getMonth()]}–${MONTHS_PT[lastDay.getMonth()]} ${lastDay.getFullYear()}`;

  return (
    <View>
      {/* Navegação de semana: ← mês/semana → */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4,
      }}>
        <TouchableOpacity
          onPress={goToPrevWeek}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Semana anterior"
          accessibilityRole="button"
        >
          <IconChevronLeft size={18} color={Colors.muted} />
        </TouchableOpacity>

        <Text style={{ color: Colors.muted, fontSize: 12, fontWeight: '500' }}>
          {monthLabel}
        </Text>

        <TouchableOpacity
          onPress={goToNextWeek}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Próxima semana"
          accessibilityRole="button"
        >
          <IconChevronRight size={18} color={Colors.muted} />
        </TouchableOpacity>
      </View>

      {/* Linha de 7 dias com suporte a swipe */}
      <View
        {...panResponder.panHandlers}
        style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 }}
      >
        {days.map((d, i) => {
          const isSelected = d.toDateString() === selected.toDateString();
          const isToday    = d.toDateString() === today.toDateString();
          const hasEvents  = events.some(e => new Date(e.start_at).toDateString() === d.toDateString());
          const hasVaccineAlert = events.some(
            e => e.category === 'vaccine' &&
                 new Date(e.start_at).toDateString() === d.toDateString() &&
                 new Date(e.start_at).getTime() - Date.now() >= 0 &&
                 new Date(e.start_at).getTime() - Date.now() <= 3 * 24 * 60 * 60 * 1000
          );

          return (
            <TouchableOpacity
              key={i}
              onPress={() => onChange(d)}
              accessibilityRole="button"
              accessibilityLabel={
                `${DAYS_FULL[d.getDay()]}, ${d.getDate()} de ${MONTHS_PT[d.getMonth()]}` +
                (hasVaccineAlert ? ', vacina urgente' : hasEvents ? `, ${events.filter(e => new Date(e.start_at).toDateString() === d.toDateString()).length} evento(s)` : ', sem eventos')
              }
              style={{ alignItems: 'center', width: 38 }}
            >
              <Text style={{ color: Colors.muted, fontSize: 11, fontWeight: '500', marginBottom: 6, textTransform: 'uppercase' }}>
                {DAYS_OF_WEEK[d.getDay()]}
              </Text>
              <View style={{
                width: 34, height: 34, borderRadius: 17,
                backgroundColor: isSelected ? Colors.primary : 'transparent',
                alignItems: 'center', justifyContent: 'center',
                borderWidth: isToday && !isSelected ? 1 : 0,
                borderColor: Colors.primary,
              }}>
                <Text style={{ color: isSelected ? Colors.onLight : Colors.text, fontSize: 14, fontWeight: isToday ? '500' : '400' }}>
                  {d.getDate()}
                </Text>
              </View>
              {/* Indicador: vermelho para vacina urgente, âmbar para outros */}
              {hasVaccineAlert ? (
                <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: VACCINE_ALERT_BORDER, marginTop: 4 }} />
              ) : hasEvents ? (
                <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: Colors.secondary, marginTop: 4 }} />
              ) : (
                <View style={{ height: 9 }} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Visão mensal (desktop ≥ 1024px) ─────────────────────────────

function MonthlyView({
  year, month, selected, onChange, events,
}: {
  year: number; month: number; selected: Date;
  onChange: (d: Date) => void; events: FamilyEvent[];
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Primeira célula da grade = domingo da semana que contém o dia 1
  const firstOfMonth = new Date(year, month, 1);
  const gridStart    = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());

  // 6 semanas × 7 dias = 42 células
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const eventCountByDay = (d: Date) =>
    events.filter(e => new Date(e.start_at).toDateString() === d.toDateString()).length;
  const hasVaccine = (d: Date) =>
    events.some(
      e => e.category === 'vaccine' &&
           new Date(e.start_at).toDateString() === d.toDateString() &&
           new Date(e.start_at).getTime() - Date.now() >= 0 &&
           new Date(e.start_at).getTime() - Date.now() <= 3 * 24 * 60 * 60 * 1000
    );

  return (
    <View style={{ paddingHorizontal: 8 }}>
      {/* Cabeçalho dos dias da semana */}
      <View style={{ flexDirection: 'row' }}>
        {DAYS_OF_WEEK.map(d => (
          <Text key={d} style={{ flex: 1, textAlign: 'center', color: Colors.muted, fontSize: 11, fontWeight: '500', paddingVertical: 6, textTransform: 'uppercase' }}>
            {d}
          </Text>
        ))}
      </View>
      {/* Células da grade */}
      {Array.from({ length: 6 }, (_, week) => (
        <View key={week} style={{ flexDirection: 'row' }}>
          {cells.slice(week * 7, week * 7 + 7).map((d, i) => {
            const isSelected  = d.toDateString() === selected.toDateString();
            const isToday     = d.toDateString() === today.toDateString();
            const isThisMonth = d.getMonth() === month;
            const count       = eventCountByDay(d);
            const vaccineDay  = hasVaccine(d);

            return (
              <TouchableOpacity
                key={i}
                onPress={() => onChange(d)}
                accessibilityRole="button"
                accessibilityLabel={`${d.getDate()} de ${MONTHS_PT[d.getMonth()]}${count ? `, ${count} evento(s)` : ''}`}
                style={{ flex: 1, alignItems: 'center', paddingVertical: 6 }}
              >
                <View style={{
                  width: 30, height: 30, borderRadius: 15,
                  backgroundColor: isSelected ? Colors.primary : 'transparent',
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: isToday && !isSelected ? 1 : 0,
                  borderColor: Colors.primary,
                }}>
                  <Text style={{
                    fontSize: 13,
                    color: isSelected
                      ? Colors.onLight
                      : isThisMonth ? Colors.text : Colors.border,
                    fontWeight: isToday ? '500' : '400',
                  }}>
                    {d.getDate()}
                  </Text>
                </View>
                {/* Pontos de eventos */}
                {count > 0 && (
                  <View style={{ width: 5, height: 5, borderRadius: 2.5, marginTop: 2,
                    backgroundColor: vaccineDay ? VACCINE_ALERT_BORDER : Colors.secondary }} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ─── Tela principal ───────────────────────────────────────────────

export default function AgendaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const { family } = useFamily();
  const { events, vaccineAlerts, loading, load, deleteEvent } = useAgenda(family?.id ?? null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Semana exibida no DayPicker — sempre sincronizada com selectedDate
  const [weekSunday, setWeekSunday] = useState(() => weekStart(new Date()));

  // Estado do mês para visão desktop
  const [monthYear, setMonthYear] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() });

  // UC010 — deep-link: recebe eventId vindo do dashboard
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();
  const scrollViewRef    = useRef<ScrollView>(null);
  const itemOffsetsRef   = useRef<Record<string, number>>({});

  const dayEvents = events.filter(e =>
    new Date(e.start_at).toDateString() === selectedDate.toDateString()
  );

  /** Ao trocar de dia, sincroniza semana se o dia não estiver na semana atual */
  const handleDayChange = useCallback((d: Date) => {
    setSelectedDate(d);
    const sunday = weekStart(d);
    if (sunday.toDateString() !== weekSunday.toDateString()) {
      setWeekSunday(sunday);
    }
  }, [weekSunday]);

  /** Ao trocar de semana, muda para o primeiro dia da nova semana */
  const handleWeekChange = useCallback((sunday: Date) => {
    setWeekSunday(sunday);
    // Seleciona o domingo da nova semana (ou o dia atual se estiver nela)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySunday = weekStart(today);
    if (sunday.toDateString() === todaySunday.toDateString()) {
      setSelectedDate(today);
    } else {
      setSelectedDate(new Date(sunday));
    }
  }, []);

  // UC010: deep-link — muda para o dia do evento
  useEffect(() => {
    if (!eventId || events.length === 0) return;
    const target = events.find(e => e.id === eventId);
    if (target) {
      const d = new Date(target.start_at);
      handleDayChange(d);
    }
  }, [eventId, events]);

  // Após o dia mudar por deep-link, faz scroll até o item
  useEffect(() => {
    if (!eventId) return;
    const offset = itemOffsetsRef.current[eventId];
    if (offset !== undefined) {
      scrollViewRef.current?.scrollTo({ y: offset, animated: true });
    }
  }, [eventId, dayEvents]);

  const handleBannerPress = () => {
    if (vaccineAlerts.length > 0) {
      handleDayChange(new Date(vaccineAlerts[0].start_at));
    }
  };

  // Navega para o mês anterior/próximo na visão mensal
  const goToPrevMonth = () => setMonthYear(({ year, month }) => month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 });
  const goToNextMonth = () => setMonthYear(({ year, month }) => month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 });

  const tutorial = useTutorial('agenda');

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, paddingTop: insets.top }}>
      <TutorialOverlay
        visible={tutorial.visible}
        screenKey="agenda"
        onDismiss={tutorial.dismiss}
      />
      {/* Header serif v2 */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 }}>
        <Text style={{ color: Colors.text, fontSize: 20, fontFamily: 'Georgia' }}>agenda</Text>
        <Text style={{ color: Colors.muted, fontSize: 12, marginTop: 2 }}>
          {events.filter(e => new Date(e.start_at) >= new Date()).length} próximos eventos
        </Text>
      </View>

      {/* Banner de vacinas próximas */}
      <VaccineAlertBanner alerts={vaccineAlerts} onPress={handleBannerPress} />

      {/* Seletor — desktop: mensal | mobile: semanal */}
      {isDesktop ? (
        <View style={{ borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 8 }}>
          {/* Navegação de mês */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 }}>
            <TouchableOpacity onPress={goToPrevMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Mês anterior">
              <IconChevronLeft size={18} color={Colors.muted} />
            </TouchableOpacity>
            <Text style={{ color: Colors.text, fontSize: 14, fontWeight: '500' }}>
              {MONTHS_PT[monthYear.month].charAt(0).toUpperCase() + MONTHS_PT[monthYear.month].slice(1)} {monthYear.year}
            </Text>
            <TouchableOpacity onPress={goToNextMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Próximo mês">
              <IconChevronRight size={18} color={Colors.muted} />
            </TouchableOpacity>
          </View>
          <MonthlyView
            year={monthYear.year}
            month={monthYear.month}
            selected={selectedDate}
            onChange={handleDayChange}
            events={events}
          />
        </View>
      ) : (
        <View style={{ borderBottomWidth: 1, borderBottomColor: Colors.border }}>
          <DayPicker
            selected={selectedDate}
            onChange={handleDayChange}
            events={events}
            weekSunday={weekSunday}
            onWeekChange={handleWeekChange}
          />
        </View>
      )}

      {loading && events.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 80 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Label do dia selecionado */}
          <Text style={{ color: Colors.muted, fontSize: 12, marginBottom: 12, fontWeight: '500' }}>
            {DAYS_FULL[selectedDate.getDay()]}, {selectedDate.getDate()} de {MONTHS_PT[selectedDate.getMonth()]}
          </Text>

          {dayEvents.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <IconCalendar size={40} color={Colors.border} />
              <Text style={{ color: Colors.muted, fontSize: 14, marginTop: 12 }}>
                Nada agendado pra esse dia
              </Text>
            </View>
          ) : (
            dayEvents.map((e) => (
              <View
                key={e.id}
                onLayout={ev => { itemOffsetsRef.current[e.id] = ev.nativeEvent.layout.y; }}
              >
                <EventCard
                  event={e}
                  onDelete={deleteEvent}
                  onEdit={(id) => router.push({ pathname: '/(app)/(agenda)/edit-event', params: { eventId: id } } as never)}
                  highlighted={e.id === eventId}
                />
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* FAB blob — novo evento */}
      <View style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16, paddingTop: 12, alignItems: 'flex-end' }}>
        <TouchableOpacity
          onPress={() => router.push('/(app)/(agenda)/new-event' as never)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Criar novo evento"
          style={{
            width: 52, height: 52,
            borderTopLeftRadius: 28, borderTopRightRadius: 22,
            borderBottomRightRadius: 24, borderBottomLeftRadius: 30,
            backgroundColor: Colors.primary,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <IconPlus size={22} color={Colors.onLight} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
