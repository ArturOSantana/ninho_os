import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth.store';
import { createBabyRecord } from '@/services/api';
import { Button } from '@/components/ui';

type FeedingType = 'breast_left' | 'breast_right' | 'bottle' | 'solid';
type DiaperType = 'pee' | 'poo' | 'both';
type SleepType = 'nap' | 'night';

const RECORD_TITLES: Record<string, string> = {
  feeding: '🍼 Mamada',
  diaper: '🩲 Fralda',
  sleep: '😴 Sono',
  medication: '💊 Medicamento',
  weight: '⚖️ Peso',
  height: '📏 Altura',
  temperature: '🌡️ Temperatura',
  note: '📝 Observação',
};

export default function BabyRecordScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ type: string }>();
  const type = params.type ?? 'note';
  const { babies, profile } = useAuthStore();
  const baby = babies[0];

  // Estados comuns
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Feeding
  const [feedingType, setFeedingType] = useState<FeedingType>('breast_left');
  const [feedingAmount, setFeedingAmount] = useState('');

  // Diaper
  const [diaperType, setDiaperType] = useState<DiaperType>('pee');

  // Sleep
  const [sleepType, setSleepType] = useState<SleepType>('nap');
  const [sleepRunning, setSleepRunning] = useState(false);
  const [sleepSeconds, setSleepSeconds] = useState(0);
  const sleepInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const sleepStart = useRef<string | null>(null);

  // Measurements
  const [measureValue, setMeasureValue] = useState('');

  // Medication
  const [medName, setMedName] = useState('');
  const [medDose, setMedDose] = useState('');

  useEffect(() => {
    return () => {
      if (sleepInterval.current) clearInterval(sleepInterval.current);
    };
  }, []);

  function toggleSleepTimer() {
    if (!sleepRunning) {
      sleepStart.current = new Date().toISOString();
      setSleepRunning(true);
      sleepInterval.current = setInterval(() => setSleepSeconds((s) => s + 1), 1000);
    } else {
      if (sleepInterval.current) clearInterval(sleepInterval.current);
      setSleepRunning(false);
    }
  }

  function formatSeconds(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }

  async function handleSave() {
    if (!baby || !profile) {
      Alert.alert('Erro', 'Nenhum bebê encontrado.');
      return;
    }

    const payload: any = {
      baby_id: baby.id,
      family_id: baby.family_id,
      created_by: profile.id,
      type,
      started_at: sleepStart.current ?? new Date().toISOString(),
      notes: notes.trim() || undefined,
    };

    if (type === 'feeding') {
      payload.feeding_type = feedingType;
      if (feedingAmount) payload.feeding_amount_ml = parseInt(feedingAmount, 10);
    }
    if (type === 'diaper') {
      payload.diaper_type = diaperType;
    }
    if (type === 'sleep') {
      payload.sleep_type = sleepType;
      if (sleepRunning || sleepSeconds > 0) {
        if (sleepInterval.current) clearInterval(sleepInterval.current);
        payload.ended_at = new Date().toISOString();
      }
    }
    if (type === 'weight' && measureValue) {
      payload.weight_kg = parseFloat(measureValue);
    }
    if (type === 'height' && measureValue) {
      payload.height_cm = parseFloat(measureValue);
    }
    if (type === 'temperature' && measureValue) {
      payload.temperature_c = parseFloat(measureValue);
    }
    if (type === 'medication') {
      payload.medication_name = medName.trim();
      payload.medication_dose = medDose.trim() || undefined;
    }

    try {
      setSaving(true);
      await createBabyRecord(payload);
      router.back();
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Não foi possível salvar o registro.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Text style={{ color: Colors.orange, fontSize: 24 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ color: Colors.text, fontSize: 20, fontWeight: '800', flex: 1 }}>
          {RECORD_TITLES[type] ?? 'Registrar'}
        </Text>
        {baby ? (
          <Text style={{ color: Colors.muted, fontSize: 13 }}>{baby.name}</Text>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Mamada ── */}
        {type === 'feeding' && (
          <>
            <Text style={{ color: Colors.muted, fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>
              Tipo
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
              {([
                { v: 'breast_left' as FeedingType, label: 'Peito ←', icon: '👶' },
                { v: 'breast_right' as FeedingType, label: 'Peito →', icon: '👶' },
                { v: 'bottle' as FeedingType, label: 'Mamadeira', icon: '🍼' },
                { v: 'solid' as FeedingType, label: 'Sólido', icon: '🥣' },
              ]).map((opt) => (
                <TouchableOpacity
                  key={opt.v}
                  onPress={() => setFeedingType(opt.v)}
                  style={{
                    flex: 1,
                    minWidth: '44%',
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: feedingType === opt.v ? Colors.orange : Colors.border,
                    backgroundColor: feedingType === opt.v ? Colors.orangeBg : Colors.card,
                  }}
                >
                  <Text style={{ fontSize: 22 }}>{opt.icon}</Text>
                  <Text style={{ color: feedingType === opt.v ? Colors.orange : Colors.text, fontSize: 13, fontWeight: '600', marginTop: 4 }}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              value={feedingAmount}
              onChangeText={setFeedingAmount}
              placeholder="Quantidade (ml) — opcional"
              placeholderTextColor={Colors.muted}
              keyboardType="numeric"
              style={{
                backgroundColor: Colors.card,
                borderRadius: 12,
                padding: 14,
                color: Colors.text,
                fontSize: 15,
                borderWidth: 1.5,
                borderColor: Colors.border,
                marginBottom: 20,
              }}
            />
          </>
        )}

        {/* ── Fralda ── */}
        {type === 'diaper' && (
          <>
            <Text style={{ color: Colors.muted, fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>
              Tipo
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              {([
                { v: 'pee' as DiaperType, label: 'Xixi', icon: '💧' },
                { v: 'poo' as DiaperType, label: 'Cocô', icon: '💩' },
                { v: 'both' as DiaperType, label: 'Ambos', icon: '🩲' },
              ]).map((opt) => (
                <TouchableOpacity
                  key={opt.v}
                  onPress={() => setDiaperType(opt.v)}
                  style={{
                    flex: 1,
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: diaperType === opt.v ? Colors.amber : Colors.border,
                    backgroundColor: diaperType === opt.v ? Colors.amberBg : Colors.card,
                  }}
                >
                  <Text style={{ fontSize: 22 }}>{opt.icon}</Text>
                  <Text style={{ color: diaperType === opt.v ? Colors.amber : Colors.text, fontSize: 13, fontWeight: '600', marginTop: 4 }}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* ── Sono ── */}
        {type === 'sleep' && (
          <>
            <Text style={{ color: Colors.muted, fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>
              Tipo
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
              {([
                { v: 'nap' as SleepType, label: 'Cochilo', icon: '😴' },
                { v: 'night' as SleepType, label: 'Noite', icon: '🌙' },
              ]).map((opt) => (
                <TouchableOpacity
                  key={opt.v}
                  onPress={() => setSleepType(opt.v)}
                  style={{
                    flex: 1,
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: sleepType === opt.v ? Colors.info : Colors.border,
                    backgroundColor: sleepType === opt.v ? Colors.info + '22' : Colors.card,
                  }}
                >
                  <Text style={{ fontSize: 22 }}>{opt.icon}</Text>
                  <Text style={{ color: sleepType === opt.v ? Colors.info : Colors.text, fontSize: 13, fontWeight: '600', marginTop: 4 }}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Cronômetro */}
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ color: Colors.text, fontSize: 48, fontWeight: '200', letterSpacing: 4 }}>
                {formatSeconds(sleepSeconds)}
              </Text>
              <TouchableOpacity
                onPress={toggleSleepTimer}
                style={{
                  marginTop: 16,
                  backgroundColor: sleepRunning ? Colors.error + '22' : Colors.info + '22',
                  borderRadius: 24,
                  paddingHorizontal: 28,
                  paddingVertical: 10,
                  borderWidth: 2,
                  borderColor: sleepRunning ? Colors.error : Colors.info,
                }}
              >
                <Text style={{ color: sleepRunning ? Colors.error : Colors.info, fontSize: 15, fontWeight: '700' }}>
                  {sleepRunning ? '⏹ Parar' : '▶ Iniciar cronômetro'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ── Medicamento ── */}
        {type === 'medication' && (
          <>
            <TextInput
              value={medName}
              onChangeText={setMedName}
              placeholder="Nome do medicamento *"
              placeholderTextColor={Colors.muted}
              style={{
                backgroundColor: Colors.card,
                borderRadius: 12,
                padding: 14,
                color: Colors.text,
                fontSize: 15,
                borderWidth: 1.5,
                borderColor: Colors.border,
                marginBottom: 12,
              }}
            />
            <TextInput
              value={medDose}
              onChangeText={setMedDose}
              placeholder="Dose (ex: 2ml) — opcional"
              placeholderTextColor={Colors.muted}
              style={{
                backgroundColor: Colors.card,
                borderRadius: 12,
                padding: 14,
                color: Colors.text,
                fontSize: 15,
                borderWidth: 1.5,
                borderColor: Colors.border,
                marginBottom: 20,
              }}
            />
          </>
        )}

        {/* ── Medidas ── */}
        {(type === 'weight' || type === 'height' || type === 'temperature') && (
          <>
            <TextInput
              value={measureValue}
              onChangeText={setMeasureValue}
              placeholder={
                type === 'weight' ? 'Peso em kg (ex: 4.2)' :
                type === 'height' ? 'Altura em cm (ex: 52)' :
                'Temperatura em °C (ex: 36.5)'
              }
              placeholderTextColor={Colors.muted}
              keyboardType="numeric"
              style={{
                backgroundColor: Colors.card,
                borderRadius: 12,
                padding: 14,
                color: Colors.text,
                fontSize: 15,
                borderWidth: 1.5,
                borderColor: Colors.border,
                marginBottom: 20,
              }}
            />
          </>
        )}

        {/* Observações */}
        <Text style={{ color: Colors.muted, fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>
          Observações (opcional)
        </Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Alguma nota adicional..."
          placeholderTextColor={Colors.muted}
          multiline
          numberOfLines={3}
          style={{
            backgroundColor: Colors.card,
            borderRadius: 12,
            padding: 14,
            color: Colors.text,
            fontSize: 15,
            borderWidth: 1.5,
            borderColor: Colors.border,
            marginBottom: 32,
            textAlignVertical: 'top',
            minHeight: 80,
          }}
        />

        <Button
          title="Salvar registro"
          onPress={handleSave}
          loading={saving}
          fullWidth
          size="lg"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
