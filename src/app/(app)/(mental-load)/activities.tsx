// src/app/(app)/(mental-load)/activities.tsx
// UC029 — Histórico de atividades por membro
// Listagem cronológica reversa de tarefas concluídas e registros do bebê
// Filtrável por membro adulto

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActivityHistory } from '@/hooks/useActivityHistory';
import { useMentalLoad } from '@/hooks/useMentalLoad';
import { ActivityHistoryEntry, MentalLoadPeriod } from '@/types/differential.types';
import { Colors, Radius, Spacing, FontSize } from '@/constants/theme';

// ─── Utilitários ──────────────────────────────────────────────────

const SOURCE_LABELS: Record<ActivityHistoryEntry['source'], string> = {
  baby_record: 'bebê',
  task:        'tarefa',
};

const SOURCE_COLORS: Record<ActivityHistoryEntry['source'], string> = {
  baby_record: Colors.secondary,
  task:        Colors.primary,
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day:    '2-digit',
    month:  'short',
    hour:   '2-digit',
    minute: '2-digit',
  });
}

function formatDateGroup(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  if (sameDay(d, today)) return 'hoje';
  if (sameDay(d, yesterday)) return 'ontem';

  return d.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
  });
}

/** Agrupa entradas por data (YYYY-MM-DD) preservando a ordem reversa */
function groupByDay(entries: ActivityHistoryEntry[]): { date: string; items: ActivityHistoryEntry[] }[] {
  const map: Record<string, ActivityHistoryEntry[]> = {};
  for (const e of entries) {
    const day = e.occurred_at.substring(0, 10);
    if (!map[day]) map[day] = [];
    map[day].push(e);
  }
  // Retorna em ordem reversa (mais recente primeiro)
  return Object.keys(map)
    .sort((a, b) => b.localeCompare(a))
    .map(date => ({ date, items: map[date] }));
}

// ─── Activity Row ─────────────────────────────────────────────────

function ActivityRow({
  entry,
  memberName,
}: {
  entry: ActivityHistoryEntry;
  memberName: string;
}) {
  const sourceColor = SOURCE_COLORS[entry.source];

  return (
    <View style={{
      flexDirection:  'row',
      alignItems:     'center',
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      gap: Spacing.md,
    }}>
      {/* Indicador de fonte */}
      <View style={{
        width:           4,
        alignSelf:       'stretch',
        borderRadius:    Radius.full,
        backgroundColor: sourceColor,
      }} />

      {/* Conteúdo */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: FontSize.base, fontWeight: '500', color: Colors.text }}>
          {entry.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 2 }}>
          <Text style={{ fontSize: FontSize.xs, color: Colors.muted }}>
            {memberName}
          </Text>
          <Text style={{ fontSize: FontSize.xs, color: Colors.border }}>·</Text>
          <Text style={{ fontSize: FontSize.xs, color: Colors.muted }}>
            {formatDateTime(entry.occurred_at)}
          </Text>
          <Text style={{ fontSize: FontSize.xs, color: Colors.border }}>·</Text>
          <Text style={{ fontSize: FontSize.xs, color: sourceColor }}>
            {SOURCE_LABELS[entry.source]}
          </Text>
        </View>
      </View>

      {/* Pontos */}
      <View style={{
        backgroundColor: sourceColor + '22',
        borderRadius:    Radius.sm,
        paddingHorizontal: 7,
        paddingVertical: 2,
        minWidth: 38,
        alignItems: 'center',
      }}>
        <Text style={{ fontSize: FontSize.xs, fontWeight: '600', color: sourceColor }}>
          +{entry.points}
        </Text>
      </View>
    </View>
  );
}

// ─── Tela principal ───────────────────────────────────────────────

const PERIOD_OPTIONS: { key: MentalLoadPeriod; label: string }[] = [
  { key: 'week',  label: '7 dias' },
  { key: 'month', label: '30 dias' },
];

export default function ActivitiesScreen() {
  const router    = useRouter();
  const insets    = useSafeAreaInsets();

  const { summary } = useMentalLoad();
  const {
    entries,
    period,
    filterMemberId,
    loading,
    error,
    setPeriod,
    setFilterMemberId,
    refresh,
  } = useActivityHistory();

  const members  = summary?.members ?? [];
  const grouped  = groupByDay(entries);

  // Map memberId → name
  const memberNameMap: Record<string, string> = {};
  members.forEach(m => { memberNameMap[m.member_id] = m.member_name; });

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, paddingTop: insets.top }}>

      {/* Header */}
      <View style={{
        flexDirection:     'row',
        alignItems:        'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical:   Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        gap: Spacing.md,
      }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={{ fontSize: 24, color: Colors.primary }}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: FontSize.xl, fontWeight: '500', color: Colors.text }}>
            atividades
          </Text>
          <Text style={{ fontSize: FontSize.xs, color: Colors.muted, marginTop: 2 }}>
            histórico por responsável
          </Text>
        </View>
      </View>

      {/* Seletor de período */}
      <View style={{
        flexDirection:   'row',
        backgroundColor: Colors.card,
        margin:          Spacing.lg,
        borderRadius:    Radius.md,
        padding:         4,
        borderWidth:     1,
        borderColor:     Colors.border,
      }}>
        {PERIOD_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.key}
            onPress={() => setPeriod(opt.key)}
            style={{
              flex:            1,
              paddingVertical: Spacing.sm,
              borderRadius:    Radius.sm,
              alignItems:      'center',
              backgroundColor: period === opt.key ? Colors.primary : 'transparent',
            }}
            activeOpacity={0.7}
          >
            <Text style={{
              fontSize:   FontSize.base,
              fontWeight: '500',
              color:      period === opt.key ? Colors.onLight : Colors.muted,
            }}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Filtro por membro */}
      {members.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.md }}
          style={{ flexGrow: 0 }}
        >
          <TouchableOpacity
            onPress={() => setFilterMemberId(null)}
            style={{
              paddingHorizontal: Spacing.md,
              paddingVertical:   6,
              borderRadius:      Radius.full,
              backgroundColor:   filterMemberId === null ? Colors.primary : Colors.card,
              borderWidth:       1,
              borderColor:       filterMemberId === null ? Colors.primary : Colors.border,
            }}
            activeOpacity={0.7}
          >
            <Text style={{
              fontSize:   FontSize.sm,
              fontWeight: '500',
              color:      filterMemberId === null ? Colors.onLight : Colors.muted,
            }}>
              todos
            </Text>
          </TouchableOpacity>

          {members.map(m => (
            <TouchableOpacity
              key={m.member_id}
              onPress={() => setFilterMemberId(m.member_id === filterMemberId ? null : m.member_id)}
              style={{
                paddingHorizontal: Spacing.md,
                paddingVertical:   6,
                borderRadius:      Radius.full,
                backgroundColor:   filterMemberId === m.member_id ? Colors.primary : Colors.card,
                borderWidth:       1,
                borderColor:       filterMemberId === m.member_id ? Colors.primary : Colors.border,
              }}
              activeOpacity={0.7}
            >
              <Text style={{
                fontSize:   FontSize.sm,
                fontWeight: '500',
                color:      filterMemberId === m.member_id ? Colors.onLight : Colors.muted,
              }}>
                {m.member_name.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: insets.bottom + 32 }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Loading */}
        {loading && entries.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginTop: Spacing.md }}>
              carregando atividades...
            </Text>
          </View>
        )}

        {/* Erro */}
        {error && (
          <View style={{
            backgroundColor: Colors.card,
            borderRadius:    Radius.md,
            padding:         Spacing.lg,
            marginBottom:    Spacing.lg,
            borderWidth:     1,
            borderColor:     Colors.error,
          }}>
            <Text style={{ color: Colors.error, fontSize: FontSize.sm }}>{error}</Text>
          </View>
        )}

        {/* Sem dados */}
        {!loading && entries.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <Text style={{ fontSize: 36, marginBottom: Spacing.md }}>📭</Text>
            <Text style={{ fontSize: FontSize.lg, fontWeight: '500', color: Colors.text, textAlign: 'center' }}>
              nenhuma atividade neste período
            </Text>
            <Text style={{ fontSize: FontSize.sm, color: Colors.muted, textAlign: 'center', marginTop: Spacing.sm }}>
              registre tarefas e atividades do bebê para ver o histórico
            </Text>
          </View>
        )}

        {/* Grupos por dia */}
        {grouped.map(({ date, items }) => (
          <View key={date} style={{ marginBottom: Spacing.xl }}>
            {/* Cabeçalho do dia */}
            <View style={{
              flexDirection:  'row',
              alignItems:     'center',
              marginBottom:   Spacing.sm,
              gap:            Spacing.sm,
            }}>
              <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, textTransform: 'capitalize' }}>
                {formatDateGroup(date + 'T12:00:00')}
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: Colors.border }} />
              <Text style={{ fontSize: FontSize.xs, color: Colors.muted }}>
                {items.reduce((s, e) => s + e.points, 0)} pts
              </Text>
            </View>

            {/* Card do dia */}
            <View style={{
              backgroundColor: Colors.card,
              borderRadius:    Radius.md,
              paddingHorizontal: Spacing.md,
              borderWidth:     1,
              borderColor:     Colors.border,
            }}>
              {items.map((entry, idx) => (
                <ActivityRow
                  key={entry.id + idx}
                  entry={entry}
                  memberName={memberNameMap[entry.member_id] ?? 'membro'}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
