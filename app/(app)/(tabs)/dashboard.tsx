import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth.store';
import { getLastBabyRecord, getTasksToday, getNextEvent } from '@/services/api';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { QuickRegister } from '@/components/baby/QuickRegister';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

interface SummaryCard {
  icon: string;
  label: string;
  value: string;
  color: string;
  onPress?: () => void;
}

function DashCard({ icon, label, value, color, onPress }: SummaryCard) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        backgroundColor: Colors.card,
        borderRadius: 16,
        padding: 16,
        flex: 1,
        minWidth: '46%',
        borderWidth: 1,
        borderColor: Colors.border,
      }}
    >
      <Text style={{ fontSize: 20, marginBottom: 10 }}>{icon}</Text>
      <Text style={{ color: Colors.text, fontSize: 15, fontWeight: '700', lineHeight: 20 }}>
        {value}
      </Text>
      <Text style={{ color: Colors.muted, fontSize: 12, marginTop: 2 }}>{label}</Text>
    </TouchableOpacity>
  );
}

const PILLAR_BUTTONS = [
  { key: 'baby', icon: '🍼', label: 'Bebê', color: Colors.orange, route: '/(app)/(tabs)/baby' },
  { key: 'couple', icon: '💑', label: 'Casal', color: Colors.amber, route: '/(app)/(tabs)/couple' },
  { key: 'kids', icon: '🧒', label: 'Filhos', color: Colors.cream, route: '/(app)/(tabs)/kids' },
  { key: 'home', icon: '🏠', label: 'Casa', color: Colors.sand, route: '/(app)/(tabs)/home' },
];

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { family, babies, profile } = useAuthStore();

  const [lastFeeding, setLastFeeding] = useState<string>('–');
  const [lastDiaper, setLastDiaper] = useState<string>('–');
  const [tasksToday, setTasksToday] = useState<{ done: number; total: number }>({ done: 0, total: 0 });
  const [nextEvent, setNextEvent] = useState<string>('Sem eventos');
  const [refreshing, setRefreshing] = useState(false);
  const [showQuickRegister, setShowQuickRegister] = useState(false);

  const baby = babies[0];

  async function loadData() {
    if (!family || !baby) return;

    const [feeding, diaper, tasks, event] = await Promise.all([
      getLastBabyRecord(baby.id, 'feeding'),
      getLastBabyRecord(baby.id, 'diaper'),
      getTasksToday(family.id),
      getNextEvent(family.id),
    ]);

    if (feeding?.started_at) {
      setLastFeeding(
        formatDistanceToNow(new Date(feeding.started_at), { addSuffix: true, locale: ptBR })
      );
    }
    if (diaper?.started_at) {
      setLastDiaper(
        formatDistanceToNow(new Date(diaper.started_at), { addSuffix: true, locale: ptBR })
      );
    }
    if (tasks) {
      const done = tasks.filter((t: any) => t.status === 'done').length;
      setTasksToday({ done, total: tasks.length });
    }
    if (event?.start_at) {
      const dt = new Date(event.start_at);
      setNextEvent(`${event.title} · ${format(dt, "d MMM 'às' HH'h'", { locale: ptBR })}`);
    }
  }

  useEffect(() => { loadData(); }, [family, baby]);

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  function handleQuickRegister(type: string) {
    setShowQuickRegister(false);
    router.push(`/(app)/baby/record?type=${type}`);
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} />}
    >
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Image
          source={require('../../../assets/ninho-logo.png')}
          style={{ width: 36, height: 36, borderRadius: 10, marginRight: 10 }}
          resizeMode="cover"
        />
        <Text style={{ color: Colors.text, fontSize: 20, fontWeight: '800', flex: 1 }}>ninho</Text>
        <TouchableOpacity
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: Colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => router.push('/(app)/family/settings')}
        >
          <Text style={{ color: Colors.text, fontSize: 13, fontWeight: '700' }}>
            {profile?.name?.slice(0, 2).toUpperCase() ?? '?'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        {/* Saudação */}
        <Text style={{ color: Colors.muted, fontSize: 14, marginBottom: 2 }}>
          {getGreeting()}, {profile?.name?.split(' ')[0] ?? 'família'} 👋
        </Text>
        <Text style={{ color: Colors.text, fontSize: 22, fontWeight: '800', marginBottom: 24, letterSpacing: -0.3 }}>
          Aqui está o resumo de hoje
        </Text>

        {/* Cards de resumo */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
          <DashCard
            icon="🍼"
            label="Última mamada"
            value={lastFeeding}
            color={Colors.orange}
            onPress={() => router.push('/(app)/(tabs)/baby')}
          />
          <DashCard
            icon="😴"
            label="Última troca"
            value={lastDiaper}
            color={Colors.amber}
          />
          <DashCard
            icon="✅"
            label="Tarefas hoje"
            value={`${tasksToday.done} de ${tasksToday.total} feitas`}
            color={Colors.success}
            onPress={() => router.push('/(app)/(tabs)/home')}
          />
          <DashCard
            icon="📅"
            label="Próximo evento"
            value={nextEvent}
            color={Colors.info}
            onPress={() => router.push('/(app)/(tabs)/couple')}
          />
        </View>

        {/* Registro rápido */}
        <View style={{ marginBottom: 28 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: Colors.text, fontSize: 16, fontWeight: '700' }}>
              Registrar
            </Text>
            {baby ? (
              <Text style={{ color: Colors.muted, fontSize: 12 }}>{baby.name}</Text>
            ) : null}
          </View>
          {baby ? (
            <QuickRegister onSelect={handleQuickRegister} />
          ) : (
            <TouchableOpacity
              onPress={() => router.push('/(auth)/onboarding')}
              style={{
                backgroundColor: Colors.orangeBg,
                borderRadius: 14,
                padding: 16,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: Colors.orange + '40',
              }}
            >
              <Text style={{ color: Colors.orange, fontSize: 14, fontWeight: '600' }}>
                + Adicionar bebê
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Pilares */}
        <Text style={{ color: Colors.text, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
          Módulos
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {PILLAR_BUTTONS.map((p) => (
            <TouchableOpacity
              key={p.key}
              onPress={() => router.push(p.route as any)}
              activeOpacity={0.8}
              style={{
                flex: 1,
                minWidth: '44%',
                backgroundColor: p.color + '20',
                borderRadius: 16,
                paddingVertical: 20,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: p.color + '40',
              }}
            >
              <Text style={{ fontSize: 26 }}>{p.icon}</Text>
              <Text style={{ color: p.color, fontSize: 14, fontWeight: '700', marginTop: 8 }}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
