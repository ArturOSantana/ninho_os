// src/app/(app)/(kids)/screen-time.tsx
// UC039: Tempo de tela da criança

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconDeviceTv } from '@tabler/icons-react-native';
import { useKids } from '@/hooks/useKids';
import { Colors, Radius, Spacing, FontSize } from '@/constants/theme';

const QUICK_LIMITS = [30, 60, 90, 120];

function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 480,
  step = 15,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.bgCard,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.md,
        alignItems: 'center',
      }}
    >
      <Text style={{ color: Colors.muted, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
        <TouchableOpacity
          onPress={() => onChange(Math.max(min, value - step))}
          style={{ width: 36, height: 36, borderRadius: Radius.full, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' }}
          activeOpacity={0.78}
        >
          <Text style={{ color: Colors.text, fontSize: FontSize.xl, fontWeight: '700', lineHeight: 22 }}>−</Text>
        </TouchableOpacity>
        <Text style={{ color: Colors.text, fontSize: FontSize.xxl, fontWeight: '700', minWidth: 48, textAlign: 'center' }}>
          {value}
        </Text>
        <TouchableOpacity
          onPress={() => onChange(Math.min(max, value + step))}
          style={{ width: 36, height: 36, borderRadius: Radius.full, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' }}
          activeOpacity={0.78}
        >
          <Text style={{ color: Colors.text, fontSize: FontSize.xl, fontWeight: '700', lineHeight: 22 }}>+</Text>
        </TouchableOpacity>
      </View>
      <Text style={{ color: Colors.muted, fontSize: FontSize.xs, marginTop: 4 }}>minutos</Text>
    </View>
  );
}

export default function ScreenTimeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { summaries, screenTimeStatus, loading, loadForChild, upsertScreenTime, refresh } = useKids(childId);

  const child = summaries.find((c) => c.child_id === childId);

  const [allowedMin, setAllowedMin] = useState(screenTimeStatus?.allowed_min ?? 60);
  const [usedMin, setUsedMin] = useState(screenTimeStatus?.used_min ?? 0);
  const [saving, setSaving] = useState(false);

  // Sincroniza com dados do servidor quando carregam
  useEffect(() => {
    if (screenTimeStatus) {
      setAllowedMin(screenTimeStatus.allowed_min);
      setUsedMin(screenTimeStatus.used_min);
    }
  }, [screenTimeStatus]);

  useEffect(() => {
    if (childId) loadForChild(childId);
  }, [childId]);

  const handleSave = async () => {
    if (!childId) return;
    setSaving(true);
    try {
      await upsertScreenTime({ child_id: childId, allowed_min: allowedMin, used_min: usedMin });
      Alert.alert('Salvo', 'Tempo de tela atualizado.');
    } catch (err) {
      Alert.alert('Erro', err instanceof Error ? err.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  const status = screenTimeStatus;
  const overLimit = status ? status.over_limit : usedMin > allowedMin;
  const pct = allowedMin > 0 ? Math.min(100, Math.round((usedMin / allowedMin) * 100)) : 0;

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
          <Text style={{ color: Colors.tertiary, fontSize: FontSize.xl }}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: Colors.text, fontSize: FontSize.xl, fontWeight: '600' }}>tempo de tela</Text>
          {child && (
            <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginTop: 2 }}>{child.child_name}</Text>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: Spacing.lg,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: Spacing.lg,
        }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={Colors.tertiary} />
        }
      >
        {loading && !screenTimeStatus ? (
          <View style={{ alignItems: 'center', paddingVertical: 64 }}>
            <ActivityIndicator size="large" color={Colors.tertiary} />
          </View>
        ) : (
          <>
            {/* Status do dia */}
            <View
              style={{
                backgroundColor: Colors.bgCard,
                borderRadius: Radius.xl,
                borderWidth: 1,
                borderColor: overLimit ? Colors.warning + '44' : Colors.border,
                padding: Spacing.xl,
                alignItems: 'center',
                marginBottom: Spacing.lg,
              }}
            >
              <IconDeviceTv size={44} color={Colors.muted} strokeWidth={1.2} style={{ marginBottom: Spacing.sm }} />
              <Text
                style={{
                  color: overLimit ? Colors.warning : Colors.text,
                  fontSize: FontSize.display,
                  fontWeight: '700',
                }}
              >
                {pct}%
              </Text>
              <Text style={{ color: Colors.muted, fontSize: FontSize.base, marginTop: 4 }}>
                {usedMin}min usados de {allowedMin}min permitidos
              </Text>
              <View style={{ width: '100%', height: 10, backgroundColor: Colors.bg, borderRadius: Radius.full, overflow: 'hidden', marginTop: Spacing.lg, borderWidth: 1, borderColor: Colors.border }}>
                <View
                  style={{
                    height: '100%',
                    width: `${pct}%` as any,
                    backgroundColor: overLimit ? Colors.warning : Colors.secondary,
                    borderRadius: Radius.full,
                  }}
                />
              </View>
              {overLimit && (
                <Text style={{ color: Colors.warning, fontSize: FontSize.sm, fontWeight: '600', marginTop: Spacing.sm }}>
                  limite excedido em {usedMin - allowedMin} minutos
                </Text>
              )}
            </View>

            {/* Limites rápidos */}
            <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.md }}>
              limite rápido
            </Text>
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg }}>
              {QUICK_LIMITS.map((l) => (
                <TouchableOpacity
                  key={l}
                  onPress={() => setAllowedMin(l)}
                  activeOpacity={0.78}
                  style={{
                    flex: 1,
                    paddingVertical: Spacing.sm,
                    borderRadius: Radius.md,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: allowedMin === l ? Colors.tertiary : Colors.border,
                    backgroundColor: allowedMin === l ? Colors.tertiary + '22' : Colors.bgCard,
                  }}
                >
                  <Text style={{ color: allowedMin === l ? Colors.tertiary : Colors.muted, fontSize: FontSize.sm, fontWeight: allowedMin === l ? '600' : '400' }}>
                    {l}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Steppers */}
            <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.md }}>
              ajuste fino
            </Text>
            <View style={{ flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl }}>
              <NumberStepper value={allowedMin} onChange={setAllowedMin} label="permitido" />
              <NumberStepper value={usedMin} onChange={setUsedMin} label="usado" />
            </View>

            {/* Botão salvar */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.82}
              style={{
                backgroundColor: Colors.tertiary,
                borderRadius: Radius.lg,
                paddingVertical: Spacing.lg,
                alignItems: 'center',
              }}
            >
              {saving ? (
                <ActivityIndicator size="small" color={Colors.onLight} />
              ) : (
                <Text style={{ color: Colors.onLight, fontSize: FontSize.lg, fontWeight: '600' }}>
                  salvar registro de hoje
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}
