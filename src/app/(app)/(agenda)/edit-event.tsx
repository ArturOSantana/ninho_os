// src/app/(app)/(agenda)/edit-event.tsx
// UC015/UC016/UC017 — Editar evento existente
// Recebe `eventId` via parâmetro de rota e pré-popula os campos

import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Switch,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  IconStethoscope,
  IconVaccine,
  IconSchool,
  IconUser,
  IconCalendar,
  type Icon,
} from '@tabler/icons-react-native';
import { useAgenda, useFamily } from '@/hooks';
import { EventCategory, EventRecurrence } from '@/types/productivity.types';
import { Colors } from '@/constants/theme';

// ─── Constantes locais (idênticas a new-event.tsx) ───────────────
const CATEGORIES: { value: EventCategory; label: string; icon: Icon }[] = [
  { value: 'appointment', label: 'Consulta',  icon: IconStethoscope },
  { value: 'vaccine',     label: 'Vacina',    icon: IconVaccine     },
  { value: 'school',      label: 'Escola',    icon: IconSchool      },
  { value: 'personal',    label: 'Pessoal',   icon: IconUser        },
  { value: 'other',       label: 'Outro',     icon: IconCalendar    },
];

const RECURRENCES: { value: EventRecurrence; label: string }[] = [
  { value: 'none',    label: 'Não repete' },
  { value: 'daily',   label: 'Todo dia' },
  { value: 'weekly',  label: 'Toda semana' },
  { value: 'monthly', label: 'Todo mês' },
  { value: 'yearly',  label: 'Todo ano' },
];

const MONTHS_PT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

function pad(n: number) { return String(n).padStart(2, '0'); }

function formatDateLabel(d: Date, allDay: boolean): string {
  const date = `${d.getDate()} de ${MONTHS_PT[d.getMonth()]} de ${d.getFullYear()}`;
  if (allDay) return date;
  return `${date} às ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ─── Componentes auxiliares ───────────────────────────────────────
function FieldLabel({ label }: { label: string }) {
  return (
    <Text style={{ color: Colors.muted, fontSize: 11, fontWeight: '500', marginBottom: 6, opacity: 0.8 }}>
      {label.toUpperCase()}
    </Text>
  );
}

const inputStyle = {
  backgroundColor: Colors.bgCard,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: Colors.border,
  paddingHorizontal: 14,
  paddingVertical: 12,
  color: Colors.text,
  fontSize: 15,
  marginBottom: 20,
} as const;

// ─── Tela principal ───────────────────────────────────────────────
export default function EditEventScreen() {
  const router     = useRouter();
  const insets     = useSafeAreaInsets();
  const { family } = useFamily();
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();

  const { events, updateEvent, loading } = useAgenda(family?.id ?? '');

  // Encontra o evento correspondente ao ID passado por parâmetro
  const event = useMemo(
    () => events.find((e) => e.id === eventId),
    [events, eventId]
  );

  // ── Estado dos campos ──────────────────────────────────────────
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [startDate,   setStartDate]   = useState(new Date());
  const [allDay,      setAllDay]      = useState(false);
  const [category,    setCategory]    = useState<EventCategory>('appointment');
  const [recurrence,  setRecurrence]  = useState<EventRecurrence>('none');

  // Controle do DateTimePicker nativo
  const [androidStep, setAndroidStep] = useState<'date' | 'time' | null>(null);

  // Inicializa campos quando o evento carregar
  useEffect(() => {
    if (!event) return;
    setTitle(event.title);
    setDescription(event.description ?? '');
    setStartDate(new Date(event.start_at));
    setAllDay(event.all_day);
    setCategory(event.category as EventCategory);
    setRecurrence((event.recurrence ?? 'none') as EventRecurrence);
  }, [event?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers do DateTimePicker ──────────────────────────────────
  const onDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (!date) { setAndroidStep(null); return; }
    setStartDate(date);
  };

  const onDateValueChange = (_event: any, date?: Date) => {
    if (!date) return;
    if (androidStep === 'date') {
      const merged = new Date(date);
      merged.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0);
      setStartDate(merged);
      setAndroidStep(allDay ? null : 'time');
    } else {
      const merged = new Date(startDate);
      merged.setHours(date.getHours(), date.getMinutes(), 0, 0);
      setStartDate(merged);
      setAndroidStep(null);
    }
  };

  const onDateDismiss = () => setAndroidStep(null);

  // ── Salvar ──────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Campo obrigatório', 'Informe o título do evento.');
      return;
    }
    if (!eventId) return;

    const isoDate = allDay
      ? new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())).toISOString()
      : startDate.toISOString();

    try {
      await updateEvent(eventId, {
        title:       title.trim(),
        description: description.trim() || undefined,
        start_at:    isoDate,
        all_day:     allDay,
        category,
        recurrence:  recurrence !== 'none' ? recurrence : undefined,
      });
      router.back();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o evento. Tente novamente.');
    }
  };

  // ── Evento não encontrado (ainda carregando ou ID inválido) ──────
  if (!event && !loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: Colors.muted, fontSize: 15 }}>Evento não encontrado.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: Colors.primary, fontSize: 15 }}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render ──────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={{ paddingTop: insets.top }} />

      {/* Header */}
      <View style={{
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={{ color: Colors.muted, fontSize: 15 }}>Cancelar</Text>
        </TouchableOpacity>

        <Text style={{ color: Colors.text, fontSize: 16, fontFamily: 'Georgia' }}>editar evento</Text>

        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {loading
            ? <ActivityIndicator size="small" color={Colors.primary} />
            : <Text style={{ color: Colors.primary, fontSize: 15, fontWeight: '500' }}>Salvar</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Título ── */}
        <FieldLabel label="Título *" />
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Título do evento"
          placeholderTextColor={Colors.border}
          style={inputStyle}
          autoFocus
          maxLength={120}
          returnKeyType="next"
        />

        {/* ── Categoria ── */}
        <FieldLabel label="Categoria" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 20 }}
          contentContainerStyle={{ gap: 8 }}
          keyboardShouldPersistTaps="handled"
        >
          {CATEGORIES.map((cat) => {
            const active = category === cat.value;
            return (
              <TouchableOpacity
                key={cat.value}
                onPress={() => setCategory(cat.value)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Categoria ${cat.label}${active ? ', selecionada' : ''}`}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 5,
                  paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
                  borderWidth: 1,
                  borderColor: active ? Colors.primary : Colors.border,
                  backgroundColor: active ? Colors.primary + '22' : Colors.bgCard,
                }}
              >
                {React.createElement(cat.icon, { size: 13, color: active ? Colors.primary : Colors.muted, strokeWidth: 1.8 })}
                <Text style={{ fontSize: 13, color: active ? Colors.primary : Colors.muted, fontWeight: active ? '500' : '400' }}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Dia inteiro toggle ── */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          backgroundColor: Colors.bgCard, borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
          paddingHorizontal: 14, paddingVertical: 12, marginBottom: 20,
        }}>
          <Text style={{ color: Colors.text, fontSize: 14 }}>Dia inteiro</Text>
          <Switch
            value={allDay}
            onValueChange={(v) => { setAllDay(v); if (v && androidStep === 'time') setAndroidStep(null); }}
            trackColor={{ true: Colors.primary, false: Colors.border }}
            thumbColor={allDay ? Colors.onLight : Colors.muted}
          />
        </View>

        {/* ── Data e hora ── */}
        <FieldLabel label={allDay ? 'Data *' : 'Data e Hora *'} />
        {Platform.OS === 'android' ? (
          <>
            <TouchableOpacity
              onPress={() => setAndroidStep('date')}
              activeOpacity={0.8}
              accessibilityLabel={`Data selecionada: ${formatDateLabel(startDate, allDay)}. Toque para alterar.`}
              style={[inputStyle, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
            >
              <Text style={{ color: Colors.text, fontSize: 15 }}>{formatDateLabel(startDate, allDay)}</Text>
              <Text style={{ color: Colors.muted, fontSize: 13 }}>✎</Text>
            </TouchableOpacity>
            {androidStep === 'date' && (
              <DateTimePicker value={startDate} mode="date" display="default" onValueChange={onDateValueChange} onDismiss={onDateDismiss} />
            )}
            {androidStep === 'time' && !allDay && (
              <DateTimePicker value={startDate} mode="time" display="default" is24Hour onValueChange={onDateValueChange} onDismiss={onDateDismiss} />
            )}
          </>
        ) : (
          <View style={{
            backgroundColor: Colors.bgCard, borderRadius: 10,
            borderWidth: 1, borderColor: Colors.border,
            overflow: 'hidden', marginBottom: 20,
          }}>
            <DateTimePicker
              value={startDate}
              mode={allDay ? 'date' : 'datetime'}
              display="inline"
              onChange={onDateChange}
              themeVariant="dark"
              accentColor={Colors.primary}
              textColor={Colors.text}
              style={{ height: allDay ? 320 : 440 }}
            />
          </View>
        )}

        {/* ── Recorrência ── */}
        <FieldLabel label="Repetição" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 20 }}
          contentContainerStyle={{ gap: 8 }}
          keyboardShouldPersistTaps="handled"
        >
          {RECURRENCES.map((rec) => {
            const active = recurrence === rec.value;
            return (
              <TouchableOpacity
                key={rec.value}
                onPress={() => setRecurrence(rec.value)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Repetição ${rec.label}${active ? ', selecionada' : ''}`}
                style={{
                  paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
                  borderWidth: 1,
                  borderColor: active ? Colors.primary : Colors.border,
                  backgroundColor: active ? Colors.primary + '22' : Colors.bgCard,
                }}
              >
                <Text style={{ fontSize: 13, color: active ? Colors.primary : Colors.muted, fontWeight: active ? '500' : '400' }}>
                  {rec.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Observações ── */}
        <FieldLabel label="Observações (opcional)" />
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Notas adicionais..."
          placeholderTextColor={Colors.border}
          style={[inputStyle, { height: 88, textAlignVertical: 'top', paddingTop: 12 }]}
          multiline
          numberOfLines={3}
          maxLength={500}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
