// src/app/(app)/(tasks)/new-task.tsx
// UC018: Criar tarefa | UC020: Delegar tarefa
// Critério: criar tarefa com título + prioridade em < 15 segundos

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTasks, useFamily, useFamilyMembers } from '@/hooks';
import { useAuthStore } from '@/stores/auth.store';
import { TaskPriority } from '@/types';
import { Colors } from '@/constants/theme';
import { Avatar } from '@/components/ui/Avatar';

// ─── Constantes ────────────────────────────────────────────────────

interface PriorityOption {
  value:       TaskPriority;
  label:       string;
  dotColor:    string;
  activeColor: string;
}

const PRIORITIES: PriorityOption[] = [
  { value: 'low',    label: 'Baixa',  dotColor: Colors.muted,     activeColor: Colors.muted    + '33' },
  { value: 'medium', label: 'Média',  dotColor: Colors.secondary, activeColor: Colors.secondary + '33' },
  { value: 'high',   label: 'Alta',   dotColor: Colors.primary,   activeColor: Colors.primary  + '33' },
];

interface CategoryOption {
  value: string;
  label: string;
  emoji: string;
}

// Categorias alinhadas com a Carga Mental — cada uma pesa diferente nos insights
const CATEGORIES: CategoryOption[] = [
  { value: 'other',    label: 'Geral',    emoji: '📋' },
  { value: 'health',   label: 'Saúde',    emoji: '💊' },
  { value: 'home',     label: 'Casa',     emoji: '🏠' },
  { value: 'finance',  label: 'Finanças', emoji: '💰' },
  { value: 'school',   label: 'Escola',   emoji: '🎒' },
  { value: 'feeding',  label: 'Alimentação', emoji: '🍼' },
  { value: 'personal', label: 'Pessoal',  emoji: '👤' },
];

const MONTHS_PT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
function pad(n: number) { return String(n).padStart(2, '0'); }

function formatDueDate(d: Date): string {
  return `${d.getDate()} de ${MONTHS_PT[d.getMonth()]} de ${d.getFullYear()}`;
}

// ─── Componentes auxiliares ─────────────────────────────────────────

function FieldLabel({ label }: { label: string }) {
  return (
    <Text style={{ color: Colors.muted, fontSize: 12, fontWeight: '500', marginBottom: 6, opacity: 0.8 }}>
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

// ─── Tela ───────────────────────────────────────────────────────────

export default function NewTaskScreen() {
  const router     = useRouter();
  const insets     = useSafeAreaInsets();
  const { family } = useFamily();
  const { createTask, loading } = useTasks(family?.id ?? '');
  const { members, load: loadMembers } = useFamilyMembers(family?.id);
  const myProfile = useAuthStore((s) => s.profile);

  // Carrega membros ao montar
  React.useEffect(() => { loadMembers(); }, [loadMembers]);

  const adults   = members.filter((m) => m.role !== 'child');
  const children = members.filter((m) => m.role === 'child');

  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [priority,    setPriority]    = useState<TaskPriority>('medium');
  const [assignedTo,  setAssignedTo]  = useState<string | undefined>(undefined);
  const [category,    setCategory]    = useState<string>('other');

  // Prazo — datepicker nativo
  const [hasDueDate,      setHasDueDate]      = useState(false);
  const [dueDate,         setDueDate]         = useState(new Date());
  const [showDatePicker,  setShowDatePicker]  = useState(false);
  const [androidPickerOn, setAndroidPickerOn] = useState(false);

  // iOS: onChange inline (não depreciado no iOS)
  const onDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (date) setDueDate(date);
  };

  // Android: onValueChange substitui onChange
  const onDateValueChange = (_event: any, date?: Date) => {
    setAndroidPickerOn(false);
    if (date) setDueDate(date);
  };

  const onDateDismiss = () => setAndroidPickerOn(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Campo obrigatório', 'Informe o título da tarefa.');
      return;
    }
    try {
      await createTask({
        title:       title.trim(),
        description: description.trim() || undefined,
        priority,
        category,
        assigned_to: assignedTo,
        due_date:    hasDueDate ? dueDate.toISOString() : undefined,
      });
      router.back();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a tarefa. Tente novamente.');
    }
  };

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

        <Text style={{ color: Colors.text, fontSize: 16, fontFamily: 'Georgia' }}>nova tarefa</Text>

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
        {/* ── Título (autoFocus — critério de velocidade) ── */}
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

        {/* ── Prioridade ── */}
        <FieldLabel label="Prioridade" />
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          {PRIORITIES.map((p) => {
            const active = priority === p.value;
            return (
              <TouchableOpacity
                key={p.value}
                onPress={() => setPriority(p.value)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Prioridade ${p.label}${active ? ', selecionada' : ''}`}
                style={{
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                  paddingVertical: 10, borderRadius: 10, borderWidth: 1,
                  borderColor: active ? p.dotColor : Colors.border,
                  backgroundColor: active ? p.activeColor : Colors.card,
                }}
              >
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.dotColor }} />
                <Text style={{ fontSize: 13, color: active ? p.dotColor : Colors.muted, fontWeight: active ? '500' : '400' }}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Prazo ── */}
        <FieldLabel label="Prazo (opcional)" />
        {/* Toggle "definir prazo" */}
        <TouchableOpacity
          onPress={() => {
            const next = !hasDueDate;
            setHasDueDate(next);
            if (next && Platform.OS === 'android') setAndroidPickerOn(true);
          }}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            backgroundColor: Colors.card, borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
            paddingHorizontal: 14, paddingVertical: 12,
            marginBottom: hasDueDate ? 12 : 20,
          }}
        >
          <Text style={{ color: Colors.text, fontSize: 14 }}>
            {hasDueDate ? formatDueDate(dueDate) : 'Sem prazo definido'}
          </Text>
          <Text style={{ color: Colors.muted, fontSize: 13 }}>
            {hasDueDate ? '✕ remover' : '+ definir'}
          </Text>
        </TouchableOpacity>

        {/* Picker de prazo */}
        {hasDueDate && (
          <>
            {Platform.OS === 'android' ? (
              <>
                <TouchableOpacity
                  onPress={() => setAndroidPickerOn(true)}
                  activeOpacity={0.8}
                  style={[inputStyle, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                >
                  <Text style={{ color: Colors.text, fontSize: 15 }}>{formatDueDate(dueDate)}</Text>
                  <Text style={{ color: Colors.muted, fontSize: 13 }}>✎</Text>
                </TouchableOpacity>
                {androidPickerOn && (
                  <DateTimePicker
                    value={dueDate}
                    mode="date"
                    display="default"
                    onValueChange={onDateValueChange}
                    onDismiss={onDateDismiss}
                  />
                )}
              </>
            ) : (
              <View style={{
                backgroundColor: Colors.card, borderRadius: 10,
                borderWidth: 1, borderColor: Colors.border,
                overflow: 'hidden', marginBottom: 20,
              }}>
                <DateTimePicker
                  value={dueDate}
                  mode="date"
                  display="inline"
                  onChange={onDateChange}
                  themeVariant="dark"
                  accentColor={Colors.primary}
                  textColor={Colors.text}
                  style={{ height: 320 }}
                />
              </View>
            )}
          </>
        )}

        {/* ── Responsável ── */}
        <FieldLabel label="Responsável (opcional)" />
        <View style={{ marginBottom: 20, gap: 8 }}>

          {/* Linha: sem responsável + eu mesmo */}
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <TouchableOpacity
              onPress={() => setAssignedTo(undefined)}
              activeOpacity={0.7}
              style={{
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                borderWidth: 1,
                borderColor: !assignedTo ? Colors.primary : Colors.border,
                backgroundColor: !assignedTo ? Colors.primary + '22' : Colors.card,
              }}
            >
              <Text style={{ fontSize: 13, color: !assignedTo ? Colors.primary : Colors.muted, fontWeight: !assignedTo ? '500' : '400' }}>
                Sem responsável
              </Text>
            </TouchableOpacity>

            {myProfile && (
              <TouchableOpacity
                onPress={() => setAssignedTo(myProfile.id)}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
                  borderWidth: 1,
                  borderColor: assignedTo === myProfile.id ? Colors.secondary : Colors.border,
                  backgroundColor: assignedTo === myProfile.id ? Colors.secondary + '22' : Colors.card,
                }}
              >
                <Avatar name={myProfile.name} size={18} />
                <Text style={{ fontSize: 13, color: assignedTo === myProfile.id ? Colors.secondary : Colors.muted, fontWeight: assignedTo === myProfile.id ? '500' : '400' }}>
                  eu mesmo
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Outros adultos da família */}
          {adults.filter((m) => m.id !== myProfile?.id).length > 0 && (
            <>
              <Text style={{ fontSize: 11, color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4 }}>
                família
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} keyboardShouldPersistTaps="handled">
                {adults.filter((m) => m.id !== myProfile?.id).map((m) => {
                  const active = assignedTo === m.id;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      onPress={() => setAssignedTo(m.id)}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 8,
                        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
                        borderWidth: 1,
                        borderColor: active ? Colors.primary : Colors.border,
                        backgroundColor: active ? Colors.primary + '22' : Colors.card,
                      }}
                    >
                      <Avatar name={m.name} size={22} />
                      <Text style={{ fontSize: 13, color: active ? Colors.primary : Colors.muted, fontWeight: active ? '500' : '400' }}>
                        {m.name.split(' ')[0]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          )}

          {/* Crianças */}
          {children.length > 0 && (
            <>
              <Text style={{ fontSize: 11, color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4 }}>
                crianças
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} keyboardShouldPersistTaps="handled">
                {children.map((m) => {
                  const active = assignedTo === m.id;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      onPress={() => setAssignedTo(m.id)}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 8,
                        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
                        borderWidth: 1,
                        borderColor: active ? Colors.secondary : Colors.border,
                        backgroundColor: active ? Colors.secondary + '22' : Colors.card,
                      }}
                    >
                      <Avatar name={m.name} size={22} />
                      <Text style={{ fontSize: 13, color: active ? Colors.secondary : Colors.muted, fontWeight: active ? '500' : '400' }}>
                        {m.name.split(' ')[0]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          )}
        </View>

        {/* ── Categoria ── */}
        <FieldLabel label="Categoria" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, marginBottom: 20 }}
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
                  flexDirection:   'row',
                  alignItems:      'center',
                  gap:             6,
                  paddingVertical:  8,
                  paddingHorizontal: 12,
                  borderRadius:    20,
                  borderWidth:     1,
                  borderColor:     active ? Colors.primary : Colors.border,
                  backgroundColor: active ? Colors.primary + '22' : Colors.card,
                }}
              >
                <Text style={{ fontSize: 14 }}>{cat.emoji}</Text>
                <Text style={{ fontSize: 13, color: active ? Colors.primary : Colors.muted, fontWeight: active ? '500' : '400' }}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Descrição ── */}
        <FieldLabel label="Descrição (opcional)" />
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
