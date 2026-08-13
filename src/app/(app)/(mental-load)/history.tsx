// src/app/(app)/(mental-load)/history.tsx
// UC025 — Histórico de contribuições por membro

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconChevronLeft } from '@tabler/icons-react-native';
import { useMentalLoad } from '@/hooks/useMentalLoad';
import { MentalLoadDayEntry, MentalLoadPeriod } from '@/types/differential.types';
import { Colors } from '@/constants/theme';

// ─── Paleta de membros usando apenas tokens ───────────────────────
// Dois primeiros usam primary/secondary do produto; extras ficam em
// variações da mesma família para nunca sair da paleta definida.
const MEMBER_COLORS = [
  Colors.primary,    // #e8720c — laranja
  Colors.secondary,  // #f0b429 — âmbar
  Colors.tertiary,   // #f5d9b0 — creme
  Colors.border,     // #2a3d52 — azul-aço (4º membro, caso exista)
];

/** Agrupa entradas por data */
function groupByDate(
  entries: MentalLoadDayEntry[]
): Record<string, MentalLoadDayEntry[]> {
  return entries.reduce(
    (acc, e) => {
      if (!acc[e.date]) acc[e.date] = [];
      acc[e.date].push(e);
      return acc;
    },
    {} as Record<string, MentalLoadDayEntry[]>
  );
}

/** Formata data YYYY-MM-DD para exibição */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export default function MentalLoadHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { history, summary, loading, period, setPeriod, refresh } = useMentalLoad();

  const periodOptions: { key: MentalLoadPeriod; label: string }[] = [
    { key: 'week', label: '7 dias' },
    { key: 'month', label: '30 dias' },
  ];

  // Cor estável por membro durante a sessão
  const memberColorMap: Record<string, string> = {};
  summary?.members.forEach((m, i) => {
    memberColorMap[m.member_id] = MEMBER_COLORS[i % MEMBER_COLORS.length];
  });

  const groupedHistory = groupByDate(history);
  const sortedDates = Object.keys(groupedHistory).sort((a, b) =>
    b.localeCompare(a)
  );

  // Valor máximo para normalizar as barras
  const maxPoints = history.reduce((max, e) => Math.max(max, e.points), 1);

  return (
    <View style={styles.screen}>
      <View style={{ paddingTop: insets.top }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityLabel="Voltar"
        >
          <IconChevronLeft size={22} color={Colors.muted} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Histórico</Text>
          <Text style={styles.headerSub}>Contribuições por dia</Text>
        </View>
      </View>

      {/* Seletor de período */}
      <View style={styles.periodBar}>
        {periodOptions.map(opt => (
          <TouchableOpacity
            key={opt.key}
            onPress={() => setPeriod(opt.key)}
            style={[styles.periodBtn, period === opt.key && styles.periodBtnActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.periodLabel, period === opt.key && styles.periodLabelActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={Colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Legenda de membros */}
        {summary && (
          <View style={styles.legend}>
            {summary.members.map((m, i) => (
              <View key={m.member_id} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: MEMBER_COLORS[i % MEMBER_COLORS.length] },
                  ]}
                />
                <Text style={styles.legendName}>{m.member_name.split(' ')[0]}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Loading */}
        {loading && history.length === 0 && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}

        {/* Sem dados */}
        {!loading && history.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>
              Nenhuma atividade registrada neste período.
            </Text>
          </View>
        )}

        {/* Timeline por dia */}
        {sortedDates.map(date => {
          const dayEntries = groupedHistory[date];
          const dayTotal = dayEntries.reduce((s, e) => s + e.points, 0);

          return (
            <View key={date} style={styles.dayCard}>
              {/* Data + total */}
              <View style={styles.dayHeader}>
                <Text style={styles.dayDate}>{formatDate(date)}</Text>
                <Text style={styles.dayTotal}>{dayTotal} pts</Text>
              </View>

              {/* Barras por membro */}
              {dayEntries.map(entry => {
                const color = memberColorMap[entry.member_id] ?? Colors.primary;
                const barWidth = Math.round((entry.points / maxPoints) * 100);
                const memberName =
                  summary?.members.find(m => m.member_id === entry.member_id)
                    ?.member_name.split(' ')[0] ?? 'Membro';

                return (
                  <View key={entry.member_id} style={styles.barRow}>
                    <View style={styles.barLabels}>
                      <Text style={styles.barMember}>{memberName}</Text>
                      <Text style={styles.barPoints}>{entry.points} pts</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { width: `${barWidth}%`, backgroundColor: color },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: 'Georgia',
    fontSize: 20,
    color: Colors.text,
  },
  headerSub: {
    fontSize: 11,
    color: Colors.muted,
    marginTop: 1,
  },
  periodBar: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
  },
  periodBtnActive: {
    backgroundColor: Colors.bg,
  },
  periodLabel: {
    fontSize: 13,
    color: Colors.muted,
  },
  periodLabelActive: {
    color: Colors.primary,
    fontWeight: '500',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendName: {
    fontSize: 12,
    color: Colors.muted,
  },
  centered: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 36,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  // DayCard
  dayCard: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayDate: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
  },
  dayTotal: {
    fontSize: 11,
    color: Colors.muted,
  },
  // Barra
  barRow: {
    marginBottom: 8,
  },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  barMember: {
    fontSize: 12,
    color: Colors.muted,
  },
  barPoints: {
    fontSize: 11,
    color: Colors.border,
  },
  barTrack: {
    height: 6,
    backgroundColor: Colors.bg,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
});
