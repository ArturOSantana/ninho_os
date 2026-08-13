// src/app/(app)/(couple)/expenses.tsx
// UC034: Divisão de gastos do casal

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCouple } from '@/hooks/useCouple';
import {
  CoupleExpense,
  CreateExpenseInput,
  ExpenseSplitMode,
  EXPENSE_SPLIT_LABELS,
  EXPENSE_CATEGORY_LABELS,
} from '@/types/couple.types';
import { Colors, Radius, Spacing, FontSize } from '@/constants/theme';

const CATEGORIES = Object.entries(EXPENSE_CATEGORY_LABELS);
const SPLIT_MODES: ExpenseSplitMode[] = ['equal', 'one_pays', 'custom'];

function formatCents(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
}

function ExpenseRow({
  expense,
  onSettle,
  onDelete,
}: {
  expense: CoupleExpense;
  onSettle: () => void;
  onDelete: () => void;
}) {
  return (
    <View
      style={{
        backgroundColor: Colors.bgCard,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: expense.settled ? Colors.border : Colors.primary + '44',
        padding: Spacing.lg,
        marginBottom: Spacing.sm,
        opacity: expense.settled ? 0.6 : 1,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: Colors.text, fontSize: FontSize.base, fontWeight: '600' }}>
            {expense.title}
          </Text>
          <Text style={{ color: Colors.muted, fontSize: FontSize.xs, marginTop: 2 }}>
            {EXPENSE_CATEGORY_LABELS[expense.category] ?? expense.category} · {EXPENSE_SPLIT_LABELS[expense.split_mode]}
          </Text>
          <Text style={{ color: Colors.muted, fontSize: FontSize.xs, marginTop: 2 }}>
            {new Date(expense.expense_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
          </Text>
        </View>
        <Text style={{ color: Colors.secondary, fontSize: FontSize.xl, fontWeight: '600', marginLeft: Spacing.md }}>
          {formatCents(expense.amount_cents)}
        </Text>
      </View>

      {!expense.settled && (
        <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
          <TouchableOpacity
            onPress={onSettle}
            activeOpacity={0.78}
            style={{
              flex: 1,
              borderRadius: Radius.md,
              paddingVertical: Spacing.sm,
              alignItems: 'center',
              backgroundColor: Colors.secondary + '22',
              borderWidth: 1,
              borderColor: Colors.secondary + '44',
            }}
          >
            <Text style={{ color: Colors.secondary, fontSize: FontSize.sm, fontWeight: '600' }}>
              quitar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDelete}
            activeOpacity={0.78}
            style={{
              flex: 1,
              borderRadius: Radius.md,
              paddingVertical: Spacing.sm,
              alignItems: 'center',
              backgroundColor: Colors.error + '22',
              borderWidth: 1,
              borderColor: Colors.error + '44',
            }}
          >
            <Text style={{ color: Colors.error, fontSize: FontSize.sm, fontWeight: '600' }}>
              remover
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function NewExpenseModal({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (input: CreateExpenseInput) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState('other');
  const [splitMode, setSplitMode] = useState<ExpenseSplitMode>('equal');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      Alert.alert('Título obrigatório', 'Informe um título para a despesa.');
      return;
    }
    const amount = parseFloat(amountStr.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Valor inválido', 'Informe um valor em reais (ex: 50,00).');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        title: trimmed,
        amount_cents: Math.round(amount * 100),
        category,
        split_mode: splitMode,
        notes: notes.trim() || undefined,
      });
      setTitle('');
      setAmountStr('');
      setCategory('other');
      setSplitMode('equal');
      setNotes('');
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
          <Text style={{ color: Colors.text, fontSize: FontSize.xl, fontWeight: '600' }}>nova despesa</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={{ color: Colors.muted, fontSize: FontSize.xl }}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Título */}
          <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.sm }}>título</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="ex: Jantar fora, Farmácia..."
            placeholderTextColor={Colors.muted + '88'}
            style={{
              backgroundColor: Colors.bgCard,
              borderRadius: Radius.md,
              borderWidth: 1,
              borderColor: Colors.border,
              padding: Spacing.md,
              color: Colors.text,
              fontSize: FontSize.base,
              marginBottom: Spacing.lg,
            }}
          />

          {/* Valor */}
          <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.sm }}>valor (R$)</Text>
          <TextInput
            value={amountStr}
            onChangeText={setAmountStr}
            placeholder="0,00"
            placeholderTextColor={Colors.muted + '88'}
            keyboardType="decimal-pad"
            style={{
              backgroundColor: Colors.bgCard,
              borderRadius: Radius.md,
              borderWidth: 1,
              borderColor: Colors.border,
              padding: Spacing.md,
              color: Colors.text,
              fontSize: FontSize.xl,
              fontWeight: '600',
              marginBottom: Spacing.lg,
            }}
          />

          {/* Categoria */}
          <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.sm }}>categoria</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg }}>
            {CATEGORIES.map(([key, label]) => (
              <TouchableOpacity
                key={key}
                onPress={() => setCategory(key)}
                activeOpacity={0.78}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: Radius.full,
                  borderWidth: 1,
                  borderColor: category === key ? Colors.primary : Colors.border,
                  backgroundColor: category === key ? Colors.primary + '22' : Colors.bgCard,
                }}
              >
                <Text style={{ color: category === key ? Colors.primary : Colors.muted, fontSize: FontSize.sm, fontWeight: category === key ? '600' : '400' }}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Divisão */}
          <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.sm }}>como dividir</Text>
          <View style={{ gap: Spacing.sm, marginBottom: Spacing.lg }}>
            {SPLIT_MODES.map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => setSplitMode(mode)}
                activeOpacity={0.78}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: Spacing.md,
                  padding: Spacing.md,
                  borderRadius: Radius.md,
                  borderWidth: 1,
                  borderColor: splitMode === mode ? Colors.primary : Colors.border,
                  backgroundColor: splitMode === mode ? Colors.primary + '22' : Colors.bgCard,
                }}
              >
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    borderWidth: 2,
                    borderColor: splitMode === mode ? Colors.primary : Colors.border,
                    backgroundColor: splitMode === mode ? Colors.primary : 'transparent',
                  }}
                />
                <Text style={{ color: splitMode === mode ? Colors.primary : Colors.text, fontSize: FontSize.base, fontWeight: splitMode === mode ? '600' : '400' }}>
                  {EXPENSE_SPLIT_LABELS[mode]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Observações */}
          <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.sm }}>observação (opcional)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="detalhes adicionais..."
            placeholderTextColor={Colors.muted + '88'}
            multiline
            numberOfLines={3}
            style={{
              backgroundColor: Colors.bgCard,
              borderRadius: Radius.md,
              borderWidth: 1,
              borderColor: Colors.border,
              padding: Spacing.md,
              color: Colors.text,
              fontSize: FontSize.base,
              textAlignVertical: 'top',
              minHeight: 80,
              marginBottom: Spacing.lg,
            }}
          />

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.82}
            style={{
              backgroundColor: Colors.primary,
              borderRadius: Radius.lg,
              paddingVertical: Spacing.lg,
              alignItems: 'center',
            }}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.onLight} />
            ) : (
              <Text style={{ color: Colors.onLight, fontSize: FontSize.lg, fontWeight: '600' }}>
                adicionar despesa
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function ExpensesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { expenses, balance, loading, createExpense, updateExpense, deleteExpense, refresh } = useCouple();
  const [showModal, setShowModal] = useState(false);
  const [showSettled, setShowSettled] = useState(false);

  const unsettled = expenses.filter((e) => !e.settled);
  const settled = expenses.filter((e) => e.settled);
  const displayed = showSettled ? expenses : unsettled;

  const handleSettle = (id: string) => {
    Alert.alert('Quitar despesa', 'Marcar essa despesa como quitada?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Quitar', onPress: () => updateExpense(id, { settled: true }).catch(() => {}) },
    ]);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Remover despesa', 'Isso não pode ser desfeito.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => deleteExpense(id).catch(() => {}) },
    ]);
  };

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
          <Text style={{ color: Colors.primary, fontSize: FontSize.xl }}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: Colors.text, fontSize: FontSize.xl, fontWeight: '600' }}>gastos do casal</Text>
          <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginTop: 2 }}>divisão transparente e sem atrito</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          style={{ backgroundColor: Colors.primary, borderRadius: Radius.full, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
          activeOpacity={0.82}
        >
          <Text style={{ color: Colors.onLight, fontSize: 20, fontWeight: '600', lineHeight: 22 }}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: Spacing.lg,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: Spacing.lg,
        }}
      >
        {/* Balanço */}
        {balance && (
          <View
            style={{
              backgroundColor: Colors.bgCard,
              borderRadius: Radius.xl,
              borderWidth: 1,
              borderColor: balance.is_balanced ? Colors.secondary + '44' : Colors.warning + '44',
              padding: Spacing.lg,
              marginBottom: Spacing.lg,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md }}>
              <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                balanço atual
              </Text>
              <View style={{ backgroundColor: balance.is_balanced ? Colors.secondary + '22' : Colors.warning + '22', borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ color: balance.is_balanced ? Colors.secondary : Colors.warning, fontSize: FontSize.xs, fontWeight: '600' }}>
                  {balance.is_balanced ? 'equilibrado' : 'desequilibrado'}
                </Text>
              </View>
            </View>
            <Text style={{ color: Colors.text, fontSize: FontSize.xxl, fontWeight: '600' }}>
              {formatCents(balance.total_cents)} total
            </Text>
            <View style={{ flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.md }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>membro A pagou</Text>
                <Text style={{ color: Colors.text, fontSize: FontSize.lg, fontWeight: '600', marginTop: 4 }}>
                  {formatCents(balance.member_a_paid_cents)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>membro B pagou</Text>
                <Text style={{ color: Colors.text, fontSize: FontSize.lg, fontWeight: '600', marginTop: 4 }}>
                  {formatCents(balance.member_b_paid_cents)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Toggle quitadas */}
        <TouchableOpacity
          onPress={() => setShowSettled(!showSettled)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md }}
          activeOpacity={0.7}
        >
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              borderWidth: 2,
              borderColor: showSettled ? Colors.primary : Colors.border,
              backgroundColor: showSettled ? Colors.primary : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {showSettled ? <Text style={{ color: Colors.onLight, fontSize: 12, fontWeight: '700', lineHeight: 14 }}>✓</Text> : null}
          </View>
          <Text style={{ color: Colors.muted, fontSize: FontSize.sm }}>
            mostrar quitadas ({settled.length})
          </Text>
        </TouchableOpacity>

        {/* Lista */}
        {loading && expenses.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : displayed.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <Text style={{ fontSize: 32, marginBottom: Spacing.md }}>💰</Text>
            <Text style={{ color: Colors.text, fontSize: FontSize.lg, fontWeight: '500' }}>sem despesas</Text>
            <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginTop: 6, textAlign: 'center' }}>
              adicione a primeira despesa do casal usando o + no topo.
            </Text>
          </View>
        ) : (
          displayed.map((expense) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              onSettle={() => handleSettle(expense.id)}
              onDelete={() => handleDelete(expense.id)}
            />
          ))
        )}
      </ScrollView>

      <NewExpenseModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSave={createExpense}
      />
    </View>
  );
}
