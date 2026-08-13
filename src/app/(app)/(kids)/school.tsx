// src/app/(app)/(kids)/school.tsx
// UC038: Agenda escolar da criança

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKids } from '@/hooks/useKids';
import {
  IconNotebook,
  IconClipboardList,
  IconUsers,
  IconBus,
  IconCalendar,
  type Icon,
} from '@tabler/icons-react-native';
import {
  SchoolEvent,
  SchoolEventType,
  CreateSchoolEventInput,
  SCHOOL_EVENT_LABELS,
  SCHOOL_EVENT_ICON,
} from '@/types/kids.types';
import { Colors, Radius, Spacing, FontSize } from '@/constants/theme';

const SCHOOL_EVENT_TABLER: Record<SchoolEventType, Icon> = {
  homework: IconNotebook,
  test:     IconClipboardList,
  meeting:  IconUsers,
  trip:     IconBus,
  other:    IconCalendar,
};

const EVENT_TYPES: SchoolEventType[] = ['homework', 'test', 'meeting', 'trip', 'other'];

function EventCard({
  event,
  onDelete,
}: {
  event: SchoolEvent;
  onDelete: () => void;
}) {
  const isPast = new Date(event.start_at) < new Date();
  return (
    <View
      style={{
        backgroundColor: Colors.bgCard,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.lg,
        marginBottom: Spacing.sm,
        opacity: isPast ? 0.6 : 1,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.md,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: Radius.md,
          backgroundColor: Colors.secondary + '22',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {React.createElement(SCHOOL_EVENT_TABLER[event.school_type], { size: 20, color: Colors.secondary, strokeWidth: 1.8 })}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: Colors.text, fontSize: FontSize.base, fontWeight: '600' }}>{event.title}</Text>
        <Text style={{ color: Colors.secondary, fontSize: FontSize.xs, marginTop: 2 }}>
          {SCHOOL_EVENT_LABELS[event.school_type]}
        </Text>
        <Text style={{ color: Colors.muted, fontSize: FontSize.xs, marginTop: 2 }}>
          {new Date(event.start_at).toLocaleDateString('pt-BR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          })}
          {event.end_at && event.end_at !== event.start_at
            ? ` – ${new Date(event.end_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}`
            : ''}
        </Text>
        {event.description ? (
          <Text style={{ color: Colors.muted, fontSize: FontSize.xs, marginTop: 4, lineHeight: 16 }}>
            {event.description}
          </Text>
        ) : null}
      </View>
      <TouchableOpacity
        onPress={onDelete}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.7}
      >
        <Text style={{ color: Colors.error + 'aa', fontSize: FontSize.lg }}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

function NewEventModal({
  visible,
  childId,
  onClose,
  onSave,
}: {
  visible: boolean;
  childId: string;
  onClose: () => void;
  onSave: (input: CreateSchoolEventInput) => Promise<void>;
}) {
  const [eventType, setEventType] = useState<SchoolEventType>('homework');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Título obrigatório', 'Informe o título do evento.');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        child_id: childId,
        school_type: eventType,
        title: title.trim(),
        description: description.trim() || undefined,
        start_at: date + 'T08:00:00',
        all_day: true,
      });
      setTitle('');
      setDescription('');
      setEventType('homework');
      setDate(new Date().toISOString().split('T')[0]);
      onClose();
    } catch (err) {
      Alert.alert('Erro', err instanceof Error ? err.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: Colors.bg }}>
        <View style={{ padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: Colors.text, fontSize: FontSize.xl, fontWeight: '600' }}>novo evento escolar</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={{ color: Colors.muted, fontSize: FontSize.xl }}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 60 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Tipo */}
          <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.sm }}>tipo</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg }}>
            {EVENT_TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setEventType(t)}
                activeOpacity={0.78}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: Radius.md,
                  borderWidth: 1,
                  borderColor: eventType === t ? Colors.secondary : Colors.border,
                  backgroundColor: eventType === t ? Colors.secondary + '22' : Colors.bgCard,
                }}
              >
                {React.createElement(SCHOOL_EVENT_TABLER[t], { size: 16, color: eventType === t ? Colors.secondary : Colors.muted, strokeWidth: 1.8 })}
                <Text style={{ color: eventType === t ? Colors.secondary : Colors.muted, fontSize: FontSize.sm, fontWeight: eventType === t ? '600' : '400' }}>
                  {SCHOOL_EVENT_LABELS[t]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Título */}
          <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.sm }}>título</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="ex: Prova de Matemática"
            placeholderTextColor={Colors.muted + '88'}
            style={{ backgroundColor: Colors.bgCard, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, color: Colors.text, fontSize: FontSize.base, marginBottom: Spacing.lg }}
          />

          {/* Data */}
          <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.sm }}>data (AAAA-MM-DD)</Text>
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="2025-01-15"
            placeholderTextColor={Colors.muted + '88'}
            keyboardType="numbers-and-punctuation"
            style={{ backgroundColor: Colors.bgCard, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, color: Colors.text, fontSize: FontSize.base, marginBottom: Spacing.lg }}
          />

          {/* Descrição */}
          <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.sm }}>descrição (opcional)</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="capítulos, materiais, observações..."
            placeholderTextColor={Colors.muted + '88'}
            multiline
            numberOfLines={3}
            style={{ backgroundColor: Colors.bgCard, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, color: Colors.text, fontSize: FontSize.base, textAlignVertical: 'top', minHeight: 80, marginBottom: Spacing.lg }}
          />

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.82}
            style={{ backgroundColor: Colors.secondary, borderRadius: Radius.lg, paddingVertical: Spacing.lg, alignItems: 'center' }}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.onLight} />
            ) : (
              <Text style={{ color: Colors.onLight, fontSize: FontSize.lg, fontWeight: '600' }}>adicionar evento</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function SchoolScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { summaries, schoolEvents, loading, loadForChild, createSchoolEvent, deleteSchoolEvent, refresh } = useKids(childId);

  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState<SchoolEventType | 'all'>('all');

  const child = summaries.find((c) => c.child_id === childId);

  useEffect(() => {
    if (childId) loadForChild(childId);
  }, [childId]);

  const handleDelete = (id: string) => {
    Alert.alert('Remover evento', 'Isso não pode ser desfeito.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => deleteSchoolEvent(id).catch(() => {}) },
    ]);
  };

  const filtered = filterType === 'all'
    ? schoolEvents
    : schoolEvents.filter((e) => e.school_type === filterType);

  const upcoming = filtered.filter((e) => new Date(e.start_at) >= new Date());
  const past = filtered.filter((e) => new Date(e.start_at) < new Date());

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + Spacing.lg,
          paddingBottom: Spacing.lg,
          paddingHorizontal: Spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={{ color: Colors.secondary, fontSize: FontSize.xl }}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: Colors.text, fontSize: FontSize.xl, fontWeight: '600' }}>agenda escolar</Text>
          {child && <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginTop: 2 }}>{child.child_name}</Text>}
        </View>
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          style={{ backgroundColor: Colors.secondary, borderRadius: Radius.full, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
          activeOpacity={0.82}
        >
          <Text style={{ color: Colors.onLight, fontSize: 20, fontWeight: '600', lineHeight: 22 }}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Filtro de tipo */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, gap: Spacing.sm }}
        style={{ flexGrow: 0, borderBottomWidth: 1, borderBottomColor: Colors.border }}
      >
        {(['all', ...EVENT_TYPES] as (SchoolEventType | 'all')[]).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setFilterType(t)}
            activeOpacity={0.78}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: Radius.full,
              borderWidth: 1,
              borderColor: filterType === t ? Colors.secondary : Colors.border,
              backgroundColor: filterType === t ? Colors.secondary + '22' : Colors.bgCard,
            }}
          >
            {t !== 'all' && React.createElement(SCHOOL_EVENT_TABLER[t], { size: 13, color: filterType === t ? Colors.secondary : Colors.muted, strokeWidth: 1.8 })}
            <Text style={{ color: filterType === t ? Colors.secondary : Colors.muted, fontSize: FontSize.sm, fontWeight: filterType === t ? '600' : '400' }}>
              {t === 'all' ? 'Todos' : SCHOOL_EVENT_LABELS[t]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: Spacing.lg,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: Spacing.lg,
        }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={Colors.secondary} />
        }
      >
        {loading && schoolEvents.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 64 }}>
            <ActivityIndicator size="large" color={Colors.secondary} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 64 }}>
            <Text style={{ fontSize: 40, marginBottom: Spacing.md }}>📚</Text>
            <Text style={{ color: Colors.text, fontSize: FontSize.lg, fontWeight: '500' }}>agenda vazia</Text>
            <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginTop: 6, textAlign: 'center' }}>
              adicione o primeiro evento usando o + no topo.
            </Text>
          </View>
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.md }}>
                  próximos ({upcoming.length})
                </Text>
                {upcoming.map((event) => (
                  <EventCard key={event.id} event={event} onDelete={() => handleDelete(event.id)} />
                ))}
              </>
            )}

            {past.length > 0 && (
              <>
                <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: Spacing.xl, marginBottom: Spacing.md }}>
                  passados ({past.length})
                </Text>
                {past.map((event) => (
                  <EventCard key={event.id} event={event} onDelete={() => handleDelete(event.id)} />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      {childId && (
        <NewEventModal
          visible={showModal}
          childId={childId}
          onClose={() => setShowModal(false)}
          onSave={createSchoolEvent}
        />
      )}
    </View>
  );
}
