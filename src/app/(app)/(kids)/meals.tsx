// src/app/(app)/(kids)/meals.tsx
// UC041: Alimentação diária da criança

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
import {
  IconSun,
  IconCup,
  IconApple,
  IconMoon,
  IconSalad,
  IconMoodHappy,
  IconMoodNeutral,
  IconMoodSad,
  type Icon,
} from '@tabler/icons-react-native';
import { useKids } from '@/hooks/useKids';
import {
  ChildMeal,
  MealSlot,
  MealRating,
  UpsertMealInput,
  MEAL_SLOT_LABELS,
  MEAL_SLOT_ICON,
  MEAL_RATING_LABELS,
  MEAL_RATING_ICON,
  MEAL_RATING_COLOR,
} from '@/types/kids.types';
import { Colors, Radius, Spacing, FontSize } from '@/constants/theme';

const MEAL_SLOT_TABLER: Record<MealSlot, Icon> = {
  breakfast: IconSun,
  lunch:     IconCup,
  snack:     IconApple,
  dinner:    IconMoon,
  other:     IconSalad,
};

const MEAL_RATING_TABLER: Record<MealRating, Icon> = {
  great:   IconMoodHappy,
  ok:      IconMoodNeutral,
  refused: IconMoodSad,
};

const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'snack', 'dinner', 'other'];
const RATINGS: MealRating[] = ['great', 'ok', 'refused'];

// ─── MealSlotCard ─────────────────────────────────────────────
function MealSlotCard({
  slot,
  meal,
  onPress,
  onDelete,
}: {
  slot: MealSlot;
  meal?: ChildMeal;
  onPress: () => void;
  onDelete?: () => void;
}) {
  const filled = !!meal;
  const accentColor = filled ? MEAL_RATING_COLOR[meal!.rating] : Colors.border;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      style={{
        backgroundColor: Colors.bgCard,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: filled ? accentColor + '55' : Colors.border,
        padding: Spacing.lg,
        marginBottom: Spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: Radius.md,
          backgroundColor: filled ? accentColor + '22' : Colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: filled ? accentColor + '44' : Colors.border,
        }}
      >
        {React.createElement(MEAL_SLOT_TABLER[slot], { size: 20, color: filled ? accentColor : Colors.muted, strokeWidth: 1.8 })}
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ color: Colors.text, fontSize: FontSize.base, fontWeight: '600' }}>
          {MEAL_SLOT_LABELS[slot]}
        </Text>
        {filled ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
              {React.createElement(MEAL_RATING_TABLER[meal!.rating], { size: 12, color: accentColor, strokeWidth: 1.8 })}
              <Text style={{ color: accentColor, fontSize: FontSize.xs, fontWeight: '600' }}>
                {MEAL_RATING_LABELS[meal!.rating]}
              </Text>
            </View>
            {meal!.description ? (
              <Text style={{ color: Colors.muted, fontSize: FontSize.xs, marginTop: 2 }} numberOfLines={1}>
                {meal!.description}
              </Text>
            ) : null}
          </>
        ) : (
          <Text style={{ color: Colors.muted, fontSize: FontSize.xs, marginTop: 3 }}>
            toque para registrar
          </Text>
        )}
      </View>

      {filled && onDelete ? (
        <TouchableOpacity
          onPress={onDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Text style={{ color: Colors.error + 'aa', fontSize: FontSize.lg }}>✕</Text>
        </TouchableOpacity>
      ) : (
        <Text style={{ color: Colors.muted, fontSize: FontSize.xl }}>+</Text>
      )}
    </TouchableOpacity>
  );
}

// ─── MealModal ────────────────────────────────────────────────
function MealModal({
  visible,
  childId,
  initialSlot,
  existingMeal,
  onClose,
  onSave,
}: {
  visible: boolean;
  childId: string;
  initialSlot: MealSlot;
  existingMeal?: ChildMeal;
  onClose: () => void;
  onSave: (input: UpsertMealInput) => Promise<void>;
}) {
  const [slot, setSlot] = useState<MealSlot>(initialSlot);
  const [rating, setRating] = useState<MealRating>(existingMeal?.rating ?? 'great');
  const [description, setDescription] = useState(existingMeal?.description ?? '');
  const [notes, setNotes] = useState(existingMeal?.notes ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSlot(initialSlot);
    setRating(existingMeal?.rating ?? 'great');
    setDescription(existingMeal?.description ?? '');
    setNotes(existingMeal?.notes ?? '');
  }, [visible, initialSlot, existingMeal]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        child_id:    childId,
        slot,
        rating,
        description: description.trim() || undefined,
        notes:       notes.trim() || undefined,
      });
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
          <Text style={{ color: Colors.text, fontSize: FontSize.xl, fontWeight: '600' }}>
            {existingMeal ? 'editar refeição' : 'registrar refeição'}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={{ color: Colors.muted, fontSize: FontSize.xl }}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 60 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Slot */}
          <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.sm }}>
            refeição
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg }}>
            {SLOTS.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setSlot(s)}
                activeOpacity={0.78}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  paddingHorizontal: 12, paddingVertical: 8,
                  borderRadius: Radius.md, borderWidth: 1,
                  borderColor: slot === s ? Colors.secondary : Colors.border,
                  backgroundColor: slot === s ? Colors.secondary + '22' : Colors.bgCard,
                }}
              >
                {React.createElement(MEAL_SLOT_TABLER[s], { size: 14, color: slot === s ? Colors.secondary : Colors.muted, strokeWidth: 1.8 })}
                <Text style={{ color: slot === s ? Colors.secondary : Colors.muted, fontSize: FontSize.sm, fontWeight: slot === s ? '600' : '400' }}>
                  {MEAL_SLOT_LABELS[s]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Rating */}
          <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.sm }}>
            como foi?
          </Text>
          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg }}>
            {RATINGS.map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setRating(r)}
                activeOpacity={0.78}
                style={{
                  flex: 1, alignItems: 'center', paddingVertical: Spacing.md,
                  borderRadius: Radius.md, borderWidth: 2,
                  borderColor: rating === r ? MEAL_RATING_COLOR[r] : Colors.border,
                  backgroundColor: rating === r ? MEAL_RATING_COLOR[r] + '22' : Colors.bgCard,
                }}
              >
                {React.createElement(MEAL_RATING_TABLER[r], { size: 22, color: rating === r ? MEAL_RATING_COLOR[r] : Colors.muted, strokeWidth: 1.8 })}
                <Text style={{ color: rating === r ? MEAL_RATING_COLOR[r] : Colors.muted, fontSize: FontSize.xs, fontWeight: '600', marginTop: 4, textAlign: 'center' }}>
                  {MEAL_RATING_LABELS[r]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Descrição */}
          <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.sm }}>
            o que comeu? (opcional)
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="arroz, feijão, frango..."
            placeholderTextColor={Colors.muted + '88'}
            style={{ backgroundColor: Colors.bgCard, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, color: Colors.text, fontSize: FontSize.base, marginBottom: Spacing.lg }}
          />

          {/* Notas */}
          <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.sm }}>
            observações (opcional)
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="teve alergia, preferência, etc."
            placeholderTextColor={Colors.muted + '88'}
            multiline
            numberOfLines={3}
            style={{ backgroundColor: Colors.bgCard, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, color: Colors.text, fontSize: FontSize.base, textAlignVertical: 'top', minHeight: 72, marginBottom: Spacing.lg }}
          />

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.82}
            style={{ backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: Spacing.lg, alignItems: 'center' }}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.onLight} />
            ) : (
              <Text style={{ color: Colors.onLight, fontSize: FontSize.lg, fontWeight: '600' }}>salvar refeição</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────
export default function MealsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { summaries, meals, dailyMealSummary, loading, loadForChild, upsertMeal, deleteMeal, refresh } = useKids(childId);

  const [modalSlot, setModalSlot] = useState<MealSlot>('lunch');
  const [showModal, setShowModal] = useState(false);

  const child = summaries.find((c) => c.child_id === childId);

  useEffect(() => {
    if (childId) loadForChild(childId);
  }, [childId]);

  const openSlot = (slot: MealSlot) => {
    setModalSlot(slot);
    setShowModal(true);
  };

  const handleDelete = (meal: ChildMeal) => {
    Alert.alert('Remover refeição', `Remover ${MEAL_SLOT_LABELS[meal.slot]}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => deleteMeal(meal.id).catch(() => {}) },
    ]);
  };

  const mealBySlot = (slot: MealSlot) => meals.find((m) => m.slot === slot);

  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + Spacing.lg, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={{ color: Colors.primary, fontSize: FontSize.xl }}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: Colors.text, fontSize: FontSize.xl, fontWeight: '600' }}>alimentação</Text>
          {child && <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginTop: 2 }}>{child.child_name} · {today}</Text>}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 100 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
      >
        {/* Resumo do dia */}
        {dailyMealSummary && dailyMealSummary.total_slots > 0 && (
          <View style={{ backgroundColor: Colors.bgCard, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, marginBottom: Spacing.lg, flexDirection: 'row', gap: Spacing.md }}>
            {[
              { label: 'comeu bem',   count: dailyMealSummary.great_count,   color: Colors.primary  },
              { label: 'comeu pouco', count: dailyMealSummary.ok_count,      color: Colors.warning  },
              { label: 'recusou',     count: dailyMealSummary.refused_count, color: Colors.muted    },
            ].map((item) => (
              <View key={item.label} style={{ flex: 1, alignItems: 'center', backgroundColor: Colors.bg, borderRadius: Radius.md, padding: Spacing.sm, borderWidth: 1, borderColor: Colors.border }}>
                <Text style={{ color: item.color, fontSize: FontSize.xxl, fontWeight: '700' }}>{item.count}</Text>
                <Text style={{ color: Colors.muted, fontSize: FontSize.xs, textAlign: 'center', marginTop: 2 }}>{item.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Slots do dia */}
        <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.md }}>
          refeições de hoje
        </Text>

        {loading && meals.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          SLOTS.map((slot) => (
            <MealSlotCard
              key={slot}
              slot={slot}
              meal={mealBySlot(slot)}
              onPress={() => openSlot(slot)}
              onDelete={mealBySlot(slot) ? () => handleDelete(mealBySlot(slot)!) : undefined}
            />
          ))
        )}
      </ScrollView>

      {childId && (
        <MealModal
          visible={showModal}
          childId={childId}
          initialSlot={modalSlot}
          existingMeal={mealBySlot(modalSlot)}
          onClose={() => setShowModal(false)}
          onSave={upsertMeal}
        />
      )}
    </View>
  );
}
