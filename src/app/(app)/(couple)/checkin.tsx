// src/app/(app)/(couple)/checkin.tsx
// UC032: Check-in emocional do casal

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCouple } from '@/hooks/useCouple';
import { MoodLevel, MOOD_EMOJI, MOOD_LABELS } from '@/types/couple.types';
import { Colors, Radius, Spacing, FontSize } from '@/constants/theme';

const MOODS: MoodLevel[] = ['terrible', 'bad', 'ok', 'good', 'great'];

export default function CoupleCheckinScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { checkins, upsertCheckin } = useCouple();

  const todayStr = new Date().toISOString().split('T')[0];
  const existing = checkins.find((c) => c.checked_at === todayStr);

  const [mood, setMood] = useState<MoodLevel>(existing?.mood ?? 'ok');
  const [note, setNote] = useState(existing?.note ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertCheckin({ mood, note: note.trim() || undefined });
      router.back();
    } catch (err) {
      Alert.alert('Erro', err instanceof Error ? err.message : 'Não foi possível salvar o check-in.');
    } finally {
      setSaving(false);
    }
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
          <Text style={{ fontFamily: 'Georgia', color: Colors.text, fontSize: 20 }}>check-in emocional</Text>
          <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginTop: 2 }}>como você está hoje?</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: Spacing['2xl'],
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: Spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Seletor de humor */}
        <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.lg }}>
          selecione seu estado
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm, marginBottom: Spacing['2xl'] }}>
          {MOODS.map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setMood(m)}
              activeOpacity={0.78}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: Spacing.md,
                borderRadius: Radius.lg,
                borderWidth: 2,
                borderColor: mood === m ? Colors.primary : Colors.border,
                backgroundColor: mood === m ? Colors.primary + '22' : Colors.bgCard,
              }}
            >
              <Text style={{ fontSize: 26, marginBottom: 4 }}>{MOOD_EMOJI[m]}</Text>
              <Text
                style={{
                  fontSize: FontSize.xs,
                  color: mood === m ? Colors.primary : Colors.muted,
                  fontWeight: mood === m ? '600' : '400',
                  textAlign: 'center',
                }}
              >
                {MOOD_LABELS[m]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Selecionado — destaque grande */}
        <View
          style={{
            backgroundColor: Colors.bgCard,
            borderRadius: Radius.xl,
            borderWidth: 1,
            borderColor: Colors.border,
            padding: Spacing.xl,
            alignItems: 'center',
            marginBottom: Spacing['2xl'],
          }}
        >
          <Text style={{ fontSize: 52, marginBottom: 8 }}>{MOOD_EMOJI[mood]}</Text>
          <Text style={{ color: Colors.text, fontSize: FontSize.xxl, fontWeight: '600' }}>
            {MOOD_LABELS[mood]}
          </Text>
        </View>

        {/* Nota opcional */}
        <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.sm }}>
          nota (opcional)
        </Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="algo que quer compartilhar com o parceiro(a)..."
          placeholderTextColor={Colors.muted + '99'}
          multiline
          numberOfLines={4}
          maxLength={280}
          style={{
            backgroundColor: Colors.bgCard,
            borderRadius: Radius.lg,
            borderWidth: 1,
            borderColor: Colors.border,
            padding: Spacing.lg,
            color: Colors.text,
            fontSize: FontSize.base,
            lineHeight: 20,
            textAlignVertical: 'top',
            minHeight: 100,
            marginBottom: Spacing.sm,
          }}
        />
        <Text style={{ color: Colors.muted, fontSize: FontSize.xs, textAlign: 'right', marginBottom: Spacing['2xl'] }}>
          {note.length}/280
        </Text>

        {/* Botão salvar */}
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
              salvar check-in
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
