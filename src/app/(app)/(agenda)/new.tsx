// src/app/(app)/(agenda)/new.tsx
// UC016 — Criar evento na agenda
// Design: dark theme Ninho

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFamily } from '@/hooks';
import { useAgenda } from '@/hooks/useAgenda';
import {
  EventCategory,
  EVENT_CATEGORY_LABELS,
} from '@/types/productivity.types';
import {
  IconCalendar, IconVaccine, IconSchool, IconUser, IconDots,
} from '@tabler/icons-react-native';

// Ícones de categoria — Tabler, sem emoji
const EVENT_CATEGORY_ICON: Record<EventCategory, React.ReactNode> = {
  appointment: <IconCalendar size={14} color="#f0b429" />,
  vaccine:     <IconVaccine  size={14} color="#f0b429" />,
  school:      <IconSchool   size={14} color="#f0b429" />,
  personal:    <IconUser     size={14} color="#f0b429" />,
  other:       <IconDots     size={14} color="#f0b429" />,
};

const C = {
  pageBg:   '#0d1b2a',
  cardBg:   '#16283d',
  border:   '#2a3d52',
  primary:  '#e8720c',
  secondary:'#f0b429',
  textBase: '#fdf6ec',
  textMuted:'#f5d9b0',
  onLight:  '#4a1b0c',
  input:    '#1e3248',
} as const;

const CATEGORIES: EventCategory[] = ['appointment', 'vaccine', 'school', 'personal', 'other'];

function pad(n: number) { return String(n).padStart(2, '0'); }
function toLocalDatetime(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function NewEventScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { family } = useFamily();
  const { createEvent } = useAgenda(family?.id ?? null);

  const defaultStart = new Date();
  defaultStart.setMinutes(0, 0, 0);
  defaultStart.setHours(defaultStart.getHours() + 1);

  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory]     = useState<EventCategory>('appointment');
  const [allDay, setAllDay]         = useState(false);
  const [startDate, setStartDate]   = useState(toLocalDatetime(defaultStart));
  const [saving, setSaving]         = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Campo obrigatório', 'Informe um título para o evento.');
      return;
    }
    try {
      setSaving(true);
      await createEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        all_day: allDay,
        start_at: allDay
          ? new Date(startDate).toISOString().slice(0, 10) + 'T00:00:00.000Z'
          : new Date(startDate).toISOString(),
      });
      router.back();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o evento. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: C.pageBg, paddingTop: insets.top }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: C.primary, fontSize: 15 }}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={{ color: C.textBase, fontSize: 15, fontWeight: '500' }}>Novo Evento</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator size="small" color={C.primary} />
            : <Text style={{ color: C.primary, fontSize: 15, fontWeight: '500' }}>Salvar</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Título */}
        <Text style={{ color: C.textMuted, fontSize: 11, fontWeight: '500', marginBottom: 6 }}>TÍTULO *</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Ex: Consulta pediátrica"
          placeholderTextColor={C.border}
          style={{ backgroundColor: C.input, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 12, color: C.textBase, fontSize: 14, marginBottom: 20 }}
          autoFocus
          maxLength={80}
        />

        {/* Categoria */}
        <Text style={{ color: C.textMuted, fontSize: 11, fontWeight: '500', marginBottom: 8 }}>CATEGORIA</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategory(cat)}
              style={{
                marginRight: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 1,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: category === cat ? C.primary : C.cardBg,
                borderColor: category === cat ? C.primary : C.border,
              }}
            >
              <View style={{ marginRight: 4 }}>{EVENT_CATEGORY_ICON[cat]}</View>
              <Text style={{ fontSize: 12, fontWeight: '500', color: category === cat ? C.onLight : C.textMuted }}>
                {EVENT_CATEGORY_LABELS[cat]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Dia inteiro */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border, marginBottom: 20 }}>
          <Text style={{ color: C.textBase, fontSize: 14 }}>Dia inteiro</Text>
          <Switch
            value={allDay}
            onValueChange={setAllDay}
            trackColor={{ true: C.primary, false: C.border }}
            thumbColor={C.textBase}
          />
        </View>

        {/* Data/hora */}
        <Text style={{ color: C.textMuted, fontSize: 11, fontWeight: '500', marginBottom: 6 }}>
          {allDay ? 'DATA' : 'DATA E HORA'}
        </Text>
        <TextInput
          value={startDate}
          onChangeText={setStartDate}
          placeholder={toLocalDatetime(defaultStart)}
          placeholderTextColor={C.border}
          style={{ backgroundColor: C.input, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 12, color: C.textBase, fontSize: 14, marginBottom: 20 }}
          keyboardType="numbers-and-punctuation"
        />

        {/* Descrição */}
        <Text style={{ color: C.textMuted, fontSize: 11, fontWeight: '500', marginBottom: 6 }}>DESCRIÇÃO (opcional)</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Detalhes do evento..."
          placeholderTextColor={C.border}
          style={{ backgroundColor: C.input, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 12, color: C.textBase, fontSize: 14, minHeight: 80, textAlignVertical: 'top' }}
          multiline
          maxLength={300}
        />

        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
