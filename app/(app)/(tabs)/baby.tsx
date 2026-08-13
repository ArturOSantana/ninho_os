import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth.store';
import { getBabyRecordsToday } from '@/services/api';
import { RecordCard } from '@/components/baby/RecordCard';
import { QuickRegister } from '@/components/baby/QuickRegister';
import { differenceInDays } from 'date-fns';

export default function BabyScreen() {
  const insets = useSafeAreaInsets();
  const { babies } = useAuthStore();
  const baby = babies[0];

  const [records, setRecords] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function loadRecords() {
    if (!baby) return;
    const data = await getBabyRecordsToday(baby.id);
    setRecords(data);
  }

  useEffect(() => { loadRecords(); }, [baby]);

  async function onRefresh() {
    setRefreshing(true);
    await loadRecords();
    setRefreshing(false);
  }

  const ageInDays = baby ? differenceInDays(new Date(), new Date(baby.birth_date)) : 0;
  const ageText = ageInDays < 30
    ? `${ageInDays} dias`
    : ageInDays < 365
      ? `${Math.floor(ageInDays / 30)} meses`
      : `${Math.floor(ageInDays / 365)} ano${ageInDays >= 730 ? 's' : ''}`;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} />}
    >
      {/* Header */}
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 16 }}>
        <Text style={{ color: Colors.muted, fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' }}>
          Bebê
        </Text>
        {baby ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Text style={{ color: Colors.text, fontSize: 22, fontWeight: '800', flex: 1 }}>{baby.name}</Text>
            <View style={{ backgroundColor: Colors.orangeBg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 }}>
              <Text style={{ color: Colors.orange, fontSize: 12, fontWeight: '600' }}>{ageText}</Text>
            </View>
          </View>
        ) : (
          <Text style={{ color: Colors.text, fontSize: 22, fontWeight: '800', marginTop: 4 }}>Meu bebê</Text>
        )}
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        {/* Registro rápido */}
        {baby ? (
          <>
            <Text style={{ color: Colors.text, fontSize: 15, fontWeight: '700', marginBottom: 12 }}>
              Registrar agora
            </Text>
            <QuickRegister onSelect={(type) => router.push(`/(app)/baby/record?type=${type}` as any)} />
          </>
        ) : (
          <TouchableOpacity
            onPress={() => router.push('/(auth)/onboarding')}
            style={{
              backgroundColor: Colors.orangeBg,
              borderRadius: 16,
              padding: 24,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: Colors.orange + '40',
            }}
          >
            <Text style={{ fontSize: 36 }}>🍼</Text>
            <Text style={{ color: Colors.orange, fontSize: 16, fontWeight: '700', marginTop: 8 }}>
              Adicionar bebê
            </Text>
            <Text style={{ color: Colors.muted, fontSize: 13, marginTop: 4, textAlign: 'center' }}>
              Registre o nome e a data de nascimento
            </Text>
          </TouchableOpacity>
        )}

        {/* Timeline do dia */}
        <View style={{ marginTop: 28 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: Colors.text, fontSize: 15, fontWeight: '700' }}>
              Hoje
            </Text>
            <Text style={{ color: Colors.muted, fontSize: 12 }}>{records.length} registros</Text>
          </View>

          {records.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <Text style={{ fontSize: 32 }}>📋</Text>
              <Text style={{ color: Colors.muted, fontSize: 14, marginTop: 8, textAlign: 'center' }}>
                Nenhum registro hoje ainda.{'\n'}Toque em uma ação acima para começar.
              </Text>
            </View>
          ) : (
            records.map((record) => (
              <RecordCard key={record.id} record={record} />
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}
