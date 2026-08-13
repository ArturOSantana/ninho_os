// src/app/(app)/(agenda)/new-event.tsx
// UC015 — Criar consulta | UC016 — Agendar vacina | UC017 — Agendar evento
// Critério de aceite: criar um evento em menos de 20 segundos
// Datepicker nativo via @react-native-community/datetimepicker

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Switch,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
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
import { notificationService } from '@/services/notifications/notificationService';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';

// ─── Constantes locais ────────────────────────────────────────────
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

/** Retorna true se a data ISO está nos próximos 3 dias */
function isWithin3Days(isoDate: string): boolean {
  const diff = new Date(isoDate).getTime() - Date.now();
  return diff >= 0 && diff <= 3 * 24 * 60 * 60 * 1000;
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

export default function NewEventScreen() {
  const router     = useRouter();
  const insets     = useSafeAreaInsets();
  const { family } = useFamily();
  const { user }   = useAuth();
  const { createEvent, loading } = useAgenda(family?.id ?? '');

  // Hora padrão: próxima hora cheia
  const defaultDate = new Date();
  defaultDate.setMinutes(0, 0, 0);
  defaultDate.setHours(defaultDate.getHours() + 1);

  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [startDate,   setStartDate]   = useState(defaultDate);
  const [allDay,      setAllDay]      = useState(false);
  const [category,    setCategory]    = useState<EventCategory>('appointment');
  const [recurrence,  setRecurrence]  = useState<EventRecurrence>('none');
  const [pushEnabled, setPushEnabled] = useState(true);

  // Controle do DateTimePicker nativo
  // No iOS: inline (sempre visível). No Android: abre picker modal ao tocar.
  const [showDatePicker, setShowDatePicker] = useState(Platform.OS === 'ios');
  const [pickerMode, setPickerMode]         = useState<'date' | 'time'>('date');
  // No Android, picker de data e hora são dois passos separados
  const [androidStep, setAndroidStep]       = useState<'date' | 'time' | null>(null);

  const showPushToggle = category === 'vaccine';

  // ── Handlers do DateTimePicker ──────────────────────────────────

  // iOS: onChange inline (não depreciado no iOS)
  const onDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (date) setStartDate(date);
  };

  // Android: onValueChange substitui onChange (data confirmada pelo usuário)
  const onDateValueChange = (_event: any, date?: Date) => {
    if (!date) return;
    if (androidStep === 'date') {
      // Passo 1: data escolhida → abre picker de hora (se não for dia inteiro)
      const merged = new Date(date);
      merged.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0);
      setStartDate(merged);
      setAndroidStep(allDay ? null : 'time');
    } else {
      // Passo 2: hora escolhida
      const merged = new Date(startDate);
      merged.setHours(date.getHours(), date.getMinutes(), 0, 0);
      setStartDate(merged);
      setAndroidStep(null);
    }
  };

  const onDateDismiss = () => setAndroidStep(null);

  const openAndroidDatePicker = () => {
    setAndroidStep('date');
  };

  // ── Salvar ──────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Campo obrigatório', 'Informe o título do evento.');
      return;
    }

    const isoDate = allDay
      ? new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())).toISOString()
      : startDate.toISOString();

    try {
      const event = await createEvent({
        title:       title.trim(),
        description: description.trim() || undefined,
        start_at:    isoDate,
        all_day:     allDay,
        category,
        recurrence:  recurrence !== 'none' ? recurrence : undefined,
      });

      // UC-Vacina: notificação in-app ao criar vacina nos próximos 3 dias
      if (event.category === 'vaccine' && pushEnabled && user?.id && family?.id && isWithin3Days(event.start_at)) {
        try {
          await notificationService.createInAppNotification(
            user.id,
            family.id,
            'vaccine_reminder',
            'Vacina agendada',
            `"${event.title}" está marcada para ${new Date(event.start_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}. Não esqueça!`,
            { event_id: event.id }
          );
        } catch {
          // Falha silenciosa — notificação é opcional
        }
      }

      router.back();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o evento. Tente novamente.');
    }
  };

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

        <Text style={{ color: Colors.text, fontSize: 16, fontFamily: 'Georgia' }}>novo evento</Text>

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
        {/* ── Título (campo autoFocus — critério 20s) ── */}
        <FieldLabel label="Título *" />
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder=""
          placeholderTextColor={Colors.border}
          style={inputStyle}
          autoFocus
          maxLength={120}
          returnKeyType="next"
        />

        {/* ── Categoria (chips horizontais) ── */}
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
                  backgroundColor: active ? Colors.primary + '22' : Colors.card,
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
          backgroundColor: Colors.card, borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
          paddingHorizontal: 14, paddingVertical: 12, marginBottom: 20,
        }}>
          <Text style={{ color: Colors.text, fontSize: 14 }}>Dia inteiro</Text>
          <Switch
            value={allDay}
            onValueChange={(v) => {
              setAllDay(v);
              // Fecha o picker de hora no Android se mudar para dia inteiro
              if (v && androidStep === 'time') setAndroidStep(null);
            }}
            trackColor={{ true: Colors.primary, false: Colors.border }}
            thumbColor={allDay ? Colors.onLight : Colors.muted}
          />
        </View>

        {/* ── Data e hora ── */}
        <FieldLabel label={allDay ? 'Data *' : 'Data e Hora *'} />

        {Platform.OS === 'android' ? (
          // Android: botão que abre o picker modal nativo
          <>
            <TouchableOpacity
              onPress={openAndroidDatePicker}
              activeOpacity={0.8}
              accessibilityLabel={`Data selecionada: ${formatDateLabel(startDate, allDay)}. Toque para alterar.`}
              style={[inputStyle, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
            >
              <Text style={{ color: Colors.text, fontSize: 15 }}>
                {formatDateLabel(startDate, allDay)}
              </Text>
              <Text style={{ color: Colors.muted, fontSize: 13 }}>✎</Text>
            </TouchableOpacity>

            {/* Pickers Android modais — renderizados condicionalmente */}
            {androidStep === 'date' && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display="default"
                onValueChange={onDateValueChange}
                onDismiss={onDateDismiss}
              />
            )}
            {androidStep === 'time' && !allDay && (
              <DateTimePicker
                value={startDate}
                mode="time"
                display="default"
                is24Hour
                onValueChange={onDateValueChange}
                onDismiss={onDateDismiss}
              />
            )}
          </>
        ) : (
          // iOS: picker inline sempre visível
          <View style={{
            backgroundColor: Colors.card, borderRadius: 10,
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
                  backgroundColor: active ? Colors.primary + '22' : Colors.card,
                }}
              >
                <Text style={{ fontSize: 13, color: active ? Colors.primary : Colors.muted, fontWeight: active ? '500' : '400' }}>
                  {rec.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Toggle de lembrete (apenas vacinas) ── */}
        {showPushToggle && (
          <View
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: Colors.amberBg, borderRadius: 10,
              borderWidth: 1, borderColor: Colors.amber,
              paddingHorizontal: 14, paddingVertical: 12, marginBottom: 20,
            }}
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ color: Colors.amber, fontSize: 14, fontWeight: '500' }}>
                Lembrete de vacina
              </Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ true: Colors.amber, false: Colors.border }}
              thumbColor={pushEnabled ? '#fff' : Colors.muted}
              accessibilityLabel="Ativar lembrete de vacina"
            />
          </View>
        )}

        {/* ── Observações ── */}
        <FieldLabel label="Observações (opcional)" />
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder=""
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
