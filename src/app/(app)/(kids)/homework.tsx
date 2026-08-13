// src/app/(app)/(kids)/homework.tsx
// UC042: Deveres e tarefas de casa da criança

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
  ChildHomework,
  HomeworkDayGroup,
  CreateHomeworkInput,
} from '@/types/kids.types';
import { Colors, Radius, Spacing, FontSize } from '@/constants/theme';

// ─── HomeworkItem ─────────────────────────────────────────────
function HomeworkItem({
  item,
  onToggle,
  onReview,
  onDelete,
}: {
  item: ChildHomework;
  onToggle: () => void;
  onReview: () => void;
  onDelete: () => void;
}) {
  const isReviewed = !!item.reviewed_at;

  return (
    <View
      style={{
        backgroundColor: Colors.bgCard,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: item.done ? Colors.secondary + '44' : Colors.border,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.md,
        opacity: item.done ? 0.7 : 1,
      }}
    >
      {/* Checkbox */}
      <TouchableOpacity
        onPress={onToggle}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.75}
        style={{
          width: 26,
          height: 26,
          borderRadius: Radius.sm,
          borderWidth: 2,
          borderColor: item.done ? Colors.secondary : Colors.border,
          backgroundColor: item.done ? Colors.secondary + '22' : Colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 1,
        }}
      >
        {item.done && <Text style={{ color: Colors.secondary, fontSize: 14, fontWeight: '700' }}>✓</Text>}
      </TouchableOpacity>

      <View style={{ flex: 1 }}>
        {/* Matéria */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <Text style={{
            color: Colors.secondary,
            fontSize: FontSize.xs,
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: 0.6,
          }}>
            {item.subject}
          </Text>
          {isReviewed && (
            <View style={{ backgroundColor: Colors.info + '22', borderRadius: Radius.sm, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ color: Colors.info, fontSize: 10, fontWeight: '600' }}>revisado ✓</Text>
            </View>
          )}
        </View>
        {item.description ? (
          <Text style={{ color: item.done ? Colors.muted : Colors.text, fontSize: FontSize.base, marginTop: 3, lineHeight: 18, textDecorationLine: item.done ? 'line-through' : 'none' }}>
            {item.description}
          </Text>
        ) : null}

        {/* Ações rápidas */}
        {!isReviewed && item.done && (
          <TouchableOpacity
            onPress={onReview}
            activeOpacity={0.78}
            style={{ marginTop: Spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <Text style={{ color: Colors.info, fontSize: FontSize.xs, fontWeight: '600' }}>marcar como revisado</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Deletar */}
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

// ─── DaySection ───────────────────────────────────────────────
function DaySection({
  group,
  onToggle,
  onReview,
  onDelete,
}: {
  group: HomeworkDayGroup;
  onToggle: (id: string, done: boolean) => void;
  onReview: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const date = new Date(group.due_date + 'T12:00:00');
  const isToday = group.due_date === new Date().toISOString().split('T')[0];
  const isPast  = date < new Date() && !isToday;
  const label   = isToday
    ? 'hoje'
    : date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <View style={{ marginBottom: Spacing.xl }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
        <Text style={{
          color: isToday ? Colors.primary : isPast ? Colors.warning : Colors.muted,
          fontSize: FontSize.xs,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        }}>
          {label}
        </Text>
        <Text style={{ color: group.pending_count > 0 ? Colors.warning : Colors.secondary, fontSize: FontSize.xs, fontWeight: '600' }}>
          {group.pending_count > 0 ? `${group.pending_count} pendente${group.pending_count > 1 ? 's' : ''}` : 'tudo feito ✓'}
        </Text>
      </View>
      {group.items.map((item) => (
        <HomeworkItem
          key={item.id}
          item={item}
          onToggle={() => onToggle(item.id, !item.done)}
          onReview={() => onReview(item.id)}
          onDelete={() => onDelete(item.id)}
        />
      ))}
    </View>
  );
}

// ─── NewHomeworkModal ─────────────────────────────────────────
function NewHomeworkModal({
  visible,
  childId,
  onClose,
  onSave,
}: {
  visible: boolean;
  childId: string;
  onClose: () => void;
  onSave: (input: CreateHomeworkInput) => Promise<void>;
}) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!subject.trim()) {
      Alert.alert('Matéria obrigatória', 'Informe a matéria do dever.');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        child_id:    childId,
        subject:     subject.trim(),
        description: description.trim() || undefined,
        due_date:    dueDate,
      });
      setSubject('');
      setDescription('');
      setDueDate(new Date().toISOString().split('T')[0]);
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
          <Text style={{ color: Colors.text, fontSize: FontSize.xl, fontWeight: '600' }}>novo dever de casa</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={{ color: Colors.muted, fontSize: FontSize.xl }}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 60 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Matéria */}
          <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.sm }}>
            matéria
          </Text>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="Matemática, Português, Ciências..."
            placeholderTextColor={Colors.muted + '88'}
            style={{ backgroundColor: Colors.bgCard, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, color: Colors.text, fontSize: FontSize.base, marginBottom: Spacing.lg }}
          />

          {/* Descrição */}
          <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.sm }}>
            o que precisa fazer? (opcional)
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="página 42 ex. 3 e 4, redação sobre..."
            placeholderTextColor={Colors.muted + '88'}
            multiline
            numberOfLines={3}
            style={{ backgroundColor: Colors.bgCard, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, color: Colors.text, fontSize: FontSize.base, textAlignVertical: 'top', minHeight: 80, marginBottom: Spacing.lg }}
          />

          {/* Data de entrega */}
          <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.sm }}>
            data de entrega (AAAA-MM-DD)
          </Text>
          <TextInput
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="2025-01-20"
            placeholderTextColor={Colors.muted + '88'}
            keyboardType="numbers-and-punctuation"
            style={{ backgroundColor: Colors.bgCard, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, color: Colors.text, fontSize: FontSize.base, marginBottom: Spacing.lg }}
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
              <Text style={{ color: Colors.onLight, fontSize: FontSize.lg, fontWeight: '600' }}>adicionar dever</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────
export default function HomeworkScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { summaries, homeworkGroups, homework, loading, loadForChild, createHomework, toggleHomework, reviewHomework, deleteHomework, refresh } = useKids(childId);

  const [showModal, setShowModal] = useState(false);
  const [showDone, setShowDone] = useState(false);

  const child = summaries.find((c) => c.child_id === childId);

  useEffect(() => {
    if (childId) loadForChild(childId);
  }, [childId]);

  const handleDelete = (id: string) => {
    Alert.alert('Remover dever', 'Isso não pode ser desfeito.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => deleteHomework(id).catch(() => {}) },
    ]);
  };

  const pendingGroups = homeworkGroups.map((g) => ({
    ...g,
    items: g.items.filter((h) => !h.done),
  })).filter((g) => g.items.length > 0);

  const doneGroups = homeworkGroups.map((g) => ({
    ...g,
    items: g.items.filter((h) => h.done),
  })).filter((g) => g.items.length > 0);

  const totalPending = homework.filter((h) => !h.done).length;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + Spacing.lg, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={{ color: Colors.secondary, fontSize: FontSize.xl }}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: Colors.text, fontSize: FontSize.xl, fontWeight: '600' }}>deveres de casa</Text>
          {child && (
            <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginTop: 2 }}>
              {child.child_name}
              {totalPending > 0 ? ` · ${totalPending} pendente${totalPending > 1 ? 's' : ''}` : ' · tudo em dia ✓'}
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          style={{ backgroundColor: Colors.secondary, borderRadius: Radius.full, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
          activeOpacity={0.82}
        >
          <Text style={{ color: Colors.onLight, fontSize: 20, fontWeight: '600', lineHeight: 22 }}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 100 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={Colors.secondary} />}
      >
        {loading && homeworkGroups.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 64 }}>
            <ActivityIndicator size="large" color={Colors.secondary} />
          </View>
        ) : homeworkGroups.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 64 }}>
            <Text style={{ fontSize: 40, marginBottom: Spacing.md }}>📝</Text>
            <Text style={{ color: Colors.text, fontSize: FontSize.lg, fontWeight: '500' }}>nenhum dever cadastrado</Text>
            <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginTop: 6, textAlign: 'center' }}>
              adicione o primeiro usando o + no topo.
            </Text>
          </View>
        ) : (
          <>
            {/* Pendentes */}
            {pendingGroups.length > 0 && (
              <>
                <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.md }}>
                  pendentes
                </Text>
                {pendingGroups.map((group) => (
                  <DaySection
                    key={group.due_date}
                    group={group}
                    onToggle={toggleHomework}
                    onReview={reviewHomework}
                    onDelete={handleDelete}
                  />
                ))}
              </>
            )}

            {/* Concluídos (colapsável) */}
            {doneGroups.length > 0 && (
              <>
                <TouchableOpacity
                  onPress={() => setShowDone((v) => !v)}
                  activeOpacity={0.78}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md, marginTop: Spacing.sm }}
                >
                  <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                    concluídos ({homework.filter((h) => h.done).length})
                  </Text>
                  <Text style={{ color: Colors.muted, fontSize: FontSize.sm }}>{showDone ? '▲' : '▼'}</Text>
                </TouchableOpacity>
                {showDone && doneGroups.map((group) => (
                  <DaySection
                    key={group.due_date}
                    group={group}
                    onToggle={toggleHomework}
                    onReview={reviewHomework}
                    onDelete={handleDelete}
                  />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      {childId && (
        <NewHomeworkModal
          visible={showModal}
          childId={childId}
          onClose={() => setShowModal(false)}
          onSave={createHomework}
        />
      )}
    </View>
  );
}
