// src/app/(app)/(baby)/register/[type].tsx
// Modal de registro detalhado — abre via toque longo nos botões do index
// Recebe `type` = 'feeding' | 'sleep' | 'diaper' via parâmetro de rota

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconX } from '@tabler/icons-react-native';
import { useFamily } from '@/hooks';
import { useBabyLogger } from '@/hooks/useBabyLogger';
import { RecordType, BabyRecord } from '@/types';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';

// ─── Opções de seleção ───────────────────────────────────────────
const FEEDING_OPTIONS: { value: BabyRecord['feeding_type']; label: string }[] = [
  { value: 'breast_left',  label: 'seio esquerdo' },
  { value: 'breast_right', label: 'seio direito'  },
  { value: 'bottle',       label: 'mamadeira'      },
  { value: 'solid',        label: 'alimentação sólida' },
];

const DIAPER_OPTIONS: { value: BabyRecord['diaper_type']; label: string }[] = [
  { value: 'pee',  label: 'xixi'        },
  { value: 'poo',  label: 'cocô'        },
  { value: 'both', label: 'xixi e cocô' },
];

// ─── Chip de seleção ─────────────────────────────────────────────
function Chip<T extends string>({
  value,
  label,
  selected,
  onPress,
}: {
  value: T;
  label: string;
  selected: boolean;
  onPress: (v: T) => void;
}) {
  return (
    <TouchableOpacity
      onPress={() => onPress(value)}
      activeOpacity={0.78}
      style={{
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: Radius.full,
        backgroundColor: selected ? Colors.primary : Colors.bgCard,
        borderWidth: 1,
        borderColor: selected ? Colors.primary : Colors.border,
        marginRight: Spacing.sm,
        marginBottom: Spacing.sm,
      }}
    >
      <Text
        style={{
          color: selected ? Colors.onLight : Colors.text,
          fontSize: FontSize.sm,
          fontWeight: selected ? '500' : '400',
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Tela ────────────────────────────────────────────────────────
export default function RegisterDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { type } = useLocalSearchParams<{ type: string }>();
  const recordType = (type as RecordType) ?? 'feeding';

  const { currentBaby, family } = useFamily();
  const { log } = useBabyLogger(currentBaby?.id, family?.id);

  const [feedingType, setFeedingType] = useState<BabyRecord['feeding_type']>('breast_left');
  const [diaperType,  setDiaperType]  = useState<BabyRecord['diaper_type']>('pee');
  const [notes,       setNotes]       = useState('');
  const [saving,      setSaving]      = useState(false);

  const TITLE: Record<string, string> = {
    feeding: 'detalhes da mamada',
    sleep:   'detalhes do sono',
    diaper:  'detalhes da troca',
  };

  const ACCENT: Record<string, string> = {
    feeding: Colors.primary,
    sleep:   Colors.secondary,
    diaper:  Colors.tertiary,
  };

  const accent = ACCENT[recordType] ?? Colors.primary;

  async function handleSave() {
    setSaving(true);
    try {
      await log(recordType, {
        feeding_type: recordType === 'feeding' ? feedingType : undefined,
        diaper_type:  recordType === 'diaper'  ? diaperType  : undefined,
        notes:        notes.trim() || undefined,
      });
      router.back();
    } finally {
      setSaving(false);
    }
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.bg,
        paddingTop: Platform.OS === 'ios' ? insets.top + 12 : Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: Spacing.lg,
          paddingBottom: Spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        }}
      >
        <Text style={{ flex: 1, fontFamily: 'Georgia', fontSize: 18, color: Colors.text }}>
          {TITLE[recordType] ?? 'detalhes'}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
        >
          <IconX size={20} color={Colors.muted} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.xl }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Opções de mamada ── */}
        {recordType === 'feeding' && (
          <View>
            <Text style={{ color: Colors.muted, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: Spacing.md }}>
              tipo
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {FEEDING_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  value={o.value!}
                  label={o.label}
                  selected={feedingType === o.value}
                  onPress={setFeedingType}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── Opções de fralda ── */}
        {recordType === 'diaper' && (
          <View>
            <Text style={{ color: Colors.muted, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: Spacing.md }}>
              tipo
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {DIAPER_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  value={o.value!}
                  label={o.label}
                  selected={diaperType === o.value}
                  onPress={setDiaperType}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── Observações ── */}
        <View>
          <Text style={{ color: Colors.muted, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: Spacing.md }}>
            observações
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="opcional..."
            placeholderTextColor={Colors.border}
            multiline
            numberOfLines={3}
            maxLength={300}
            style={{
              backgroundColor: Colors.bgCard,
              borderRadius: Radius.md,
              borderWidth: 1,
              borderColor: Colors.border,
              padding: Spacing.md,
              color: Colors.text,
              fontSize: FontSize.base,
              minHeight: 80,
              textAlignVertical: 'top',
            }}
          />
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.md }}>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="Salvar registro"
          style={{
            backgroundColor: accent,
            borderRadius: Radius.lg,
            height: 52,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving
            ? <ActivityIndicator size="small" color={Colors.onLight} />
            : <Text style={{ color: Colors.onLight, fontSize: FontSize.lg, fontWeight: '500' }}>
                salvar registro
              </Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}
