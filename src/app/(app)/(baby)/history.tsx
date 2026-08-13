// src/app/(app)/(baby)/history.tsx
// UC011–UC014 — Histórico completo de registros do bebê
// Timeline agrupada por dia, filtros por tipo, pull-to-refresh

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  IconBabyBottle,
  IconDroplet,
  IconMoon,
  IconX,
} from '@tabler/icons-react-native';
import { useFamily } from '@/hooks';
import { getBabyRecordsHistory } from '@/services/api';
import { BabyRecord, RecordType } from '@/types';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';

// ─── Constantes ──────────────────────────────────────────────────
const PERIOD_OPTIONS = [
  { value: 7,  label: '7 dias' },
  { value: 14, label: '14 dias' },
  { value: 30, label: '30 dias' },
];

const TYPE_FILTERS: { value: RecordType | 'all'; label: string }[] = [
  { value: 'all',     label: 'Todos' },
  { value: 'feeding', label: 'Mamadas' },
  { value: 'sleep',   label: 'Sono' },
  { value: 'diaper',  label: 'Trocas' },
];

const TYPE_ICON: Partial<Record<RecordType, React.ReactNode>> = {
  feeding: <IconBabyBottle size={14} color={Colors.primary} />,
  sleep:   <IconMoon       size={14} color={Colors.secondary} />,
  diaper:  <IconDroplet    size={14} color={Colors.tertiary} />,
};

const TYPE_LABEL: Record<string, string> = {
  feeding: 'mamada',
  sleep:   'sono',
  diaper:  'troca',
};

const FEEDING_LABEL: Record<string, string> = {
  breast_left:  'seio esq.',
  breast_right: 'seio dir.',
  bottle:       'mamadeira',
  solid:        'sólido',
};

const DIAPER_LABEL: Record<string, string> = {
  pee:  'xixi',
  poo:  'cocô',
  both: 'xixi e cocô',
};

const MONTHS_PT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

// ─── Helpers ─────────────────────────────────────────────────────
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function fmtDuration(startIso: string, endIso?: string | null): string | null {
  if (!endIso) return null;
  const sec = Math.floor((new Date(endIso).getTime() - new Date(startIso).getTime()) / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h${m}min` : `${h}h`;
}

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dayLabel(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Hoje';
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
  return `${date.getDate()} de ${MONTHS_PT[date.getMonth()]}`;
}

function groupByDay(records: BabyRecord[]): { key: string; label: string; items: BabyRecord[] }[] {
  const map = new Map<string, BabyRecord[]>();
  for (const r of records) {
    const k = dayKey(r.started_at);
    const arr = map.get(k) ?? [];
    arr.push(r);
    map.set(k, arr);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, items]) => ({ key, label: dayLabel(key), items }));
}

function recordSubtitle(record: BabyRecord): string {
  const parts: string[] = [];
  if (record.type === 'feeding' && record.feeding_type) {
    parts.push(FEEDING_LABEL[record.feeding_type] ?? record.feeding_type);
  }
  if (record.type === 'diaper' && record.diaper_type) {
    parts.push(DIAPER_LABEL[record.diaper_type] ?? record.diaper_type);
  }
  const dur = fmtDuration(record.started_at, record.ended_at);
  if (dur) parts.push(dur);
  if (record.notes) parts.push(record.notes);
  return parts.join(' · ');
}

// ─── Componente RecordRow ─────────────────────────────────────────
function RecordRow({ record }: { record: BabyRecord }) {
  const subtitle = recordSubtitle(record);
  const icon = TYPE_ICON[record.type as RecordType];
  const isSleepActive = record.type === 'sleep' && !record.ended_at;

  return (
    <View style={styles.row} accessibilityRole="text" accessibilityLabel={
      `${TYPE_LABEL[record.type] ?? record.type}${subtitle ? ', ' + subtitle : ''}, ${fmtTime(record.started_at)}`
    }>
      <View style={styles.rowIconCol}>{icon}</View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle}>
          {TYPE_LABEL[record.type] ?? record.type}
          {isSleepActive && (
            <Text style={styles.activeBadge}> • em andamento</Text>
          )}
        </Text>
        {subtitle ? (
          <Text style={styles.rowSubtitle} numberOfLines={1}>{subtitle}</Text>
        ) : null}
      </View>
      <Text style={styles.rowTime}>{fmtTime(record.started_at)}</Text>
    </View>
  );
}

// ─── Tela ─────────────────────────────────────────────────────────
export default function BabyHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentBaby } = useFamily();

  const [records, setRecords]   = useState<BabyRecord[]>([]);
  const [loading, setLoading]   = useState(false);
  const [days,    setDays]       = useState(7);
  const [filter,  setFilter]     = useState<RecordType | 'all'>('all');

  const load = useCallback(async () => {
    if (!currentBaby?.id) return;
    setLoading(true);
    try {
      const data = await getBabyRecordsHistory(currentBaby.id, days);
      setRecords(data as BabyRecord[]);
    } finally {
      setLoading(false);
    }
  }, [currentBaby?.id, days]);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all'
    ? records
    : records.filter((r) => r.type === filter);

  const groups = groupByDay(filtered);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <IconX size={20} color={Colors.muted} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>histórico</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Filtros de período */}
      <View style={styles.filterRow}>
        {PERIOD_OPTIONS.map((opt) => {
          const active = days === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setDays(opt.value)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Período: ${opt.label}${active ? ', selecionado' : ''}`}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Filtros de tipo */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.typeFilterRow}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
      >
        {TYPE_FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <TouchableOpacity
              key={f.value}
              onPress={() => setFilter(f.value)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Filtrar por: ${f.label}${active ? ', selecionado' : ''}`}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading && records.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>
            Nenhum registro nos últimos {days} dias.
          </Text>
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
        >
          {groups.map((group) => (
            <View key={group.key} style={styles.dayGroup}>
              {/* Label do dia */}
              <Text style={styles.dayLabel}>{group.label}</Text>
              {/* Registros do dia */}
              <View style={styles.dayCard}>
                {group.items.map((record, idx) => (
                  <View key={record.id}>
                    {idx > 0 && <View style={styles.divider} />}
                    <RecordRow record={record} />
                  </View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 18,
    fontFamily: 'Georgia',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  typeFilterRow: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  filterChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '22',
  },
  filterChipText: {
    fontSize: FontSize.sm,
    color: Colors.muted,
  },
  filterChipTextActive: {
    color: Colors.primary,
    fontWeight: '500',
  },
  dayGroup: {
    marginTop: Spacing.xl,
  },
  dayLabel: {
    color: Colors.muted,
    fontSize: FontSize.xs,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  dayCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    gap: Spacing.md,
  },
  rowIconCol: {
    width: 22,
    alignItems: 'center',
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    color: Colors.text,
    fontSize: FontSize.base,
  },
  rowSubtitle: {
    color: Colors.muted,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  activeBadge: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  rowTime: {
    color: Colors.muted,
    fontSize: FontSize.sm,
  },
  emptyText: {
    color: Colors.muted,
    fontSize: FontSize.base,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
