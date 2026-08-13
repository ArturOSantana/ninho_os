// src/app/(app)/(mental-load)/insights.tsx
// UC026 — Insights automáticos gerados por análise de padrões — paleta dark do handoff

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
import {
  IconInfoCircle, IconAlertTriangle, IconSparkles,
  IconBabyBottle, IconDroplet, IconMoon, IconChecklist, IconClipboardList, IconMedal,
} from '@tabler/icons-react-native';
import { useAIInsights } from '@/hooks/useAIInsights';
import { AIInsight, InsightSeverity, WeeklySummary } from '@/types/differential.types';
import { Colors, Radius, Spacing, FontSize } from '@/constants/theme';

// ─── Tokens de severidade — todos dentro da paleta dark ──────────

const SEVERITY: Record<InsightSeverity, { border: string; text: string; icon: React.ReactNode }> = {
  info:     { border: Colors.border,    text: Colors.muted,     icon: <IconInfoCircle     size={16} color={Colors.muted}     /> },
  warning:  { border: Colors.secondary, text: Colors.secondary, icon: <IconAlertTriangle  size={16} color={Colors.secondary} /> },
  positive: { border: Colors.primary,   text: Colors.primary,   icon: <IconSparkles       size={16} color={Colors.primary}   /> },
};

// ─── InsightCard ─────────────────────────────────────────────────

function InsightCard({ insight }: { insight: AIInsight }) {
  const sev = SEVERITY[insight.severity];
  return (
    <View style={{
      backgroundColor: Colors.bgCard,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: sev.border,
      padding: Spacing.lg,
      marginBottom: Spacing.sm,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.xs }}>
        {sev.icon}
        <Text style={{ flex: 1, fontSize: FontSize.base, fontWeight: '500', color: sev.text }}>
          {insight.title}
        </Text>
      </View>
      <Text style={{ fontSize: FontSize.sm, color: Colors.muted, marginLeft: 26, lineHeight: 18 }}>
        {insight.description}
      </Text>
      {insight.suggested_action ? (
        <Text style={{ fontSize: FontSize.xs, color: Colors.muted, marginLeft: 26, marginTop: Spacing.xs, fontStyle: 'italic' }}>
          {insight.suggested_action}
        </Text>
      ) : null}
      {insight.data_points != null ? (
        <Text style={{ fontSize: FontSize.xs, color: Colors.border, marginLeft: 26, marginTop: Spacing.xs }}>
          Baseado em {insight.data_points} registro{insight.data_points !== 1 ? 's' : ''}
        </Text>
      ) : null}
    </View>
  );
}

// ─── WeeklySummaryCard ───────────────────────────────────────────

function WeeklySummaryCard({ summary }: { summary: WeeklySummary }) {
  const stats: Array<{ icon: React.ReactNode; label: string; value: string }> = [
    { icon: <IconBabyBottle   size={18} color={Colors.primary}   />, label: 'mamadas',    value: String(summary.total_feedings) },
    { icon: <IconDroplet      size={18} color={Colors.secondary} />, label: 'trocas',     value: String(summary.total_diaper_changes) },
    { icon: <IconMoon         size={18} color={Colors.secondary} />, label: 'sono',       value: `${summary.avg_sleep_hours}h` },
    { icon: <IconChecklist    size={18} color={Colors.secondary} />, label: 'feitas',     value: String(summary.tasks_completed) },
    { icon: <IconClipboardList size={18} color={Colors.secondary} />, label: 'pendentes', value: String(summary.tasks_pending) },
    { icon: <IconMedal        size={18} color={Colors.secondary} />, label: 'mais ativo', value: summary.most_active_member.split(' ')[0] },
  ];

  return (
    <View style={{
      backgroundColor: Colors.bgCard,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: Colors.border,
      padding: Spacing.lg,
      marginBottom: Spacing.xl,
    }}>
      <Text style={{ fontSize: FontSize.sm, fontWeight: '500', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.md }}>
        resumo da semana
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
        {stats.map(stat => (
          <View
            key={stat.label}
            style={{
              backgroundColor: Colors.bg,
              borderRadius: Radius.md,
              borderWidth: 1,
              borderColor: Colors.border,
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.sm,
              alignItems: 'center',
              minWidth: '30%',
              flex: 1,
            }}
          >
            {stat.icon}
            <Text style={{ fontFamily: 'Georgia', fontSize: FontSize.xl, color: Colors.text, marginTop: 2 }}>
              {stat.value}
            </Text>
            <Text style={{ fontSize: FontSize.xs, color: Colors.muted, textAlign: 'center', marginTop: 2 }}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Tela principal ──────────────────────────────────────────────

export default function InsightsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { insights, weeklySummary, loading, error, refresh } = useAIInsights();

  const positiveInsights = insights.filter(i => i.severity === 'positive');
  const warningInsights  = insights.filter(i => i.severity !== 'positive');

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, paddingTop: insets.top }}>
      {/* Header — serif v2 */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        gap: Spacing.md,
      }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={{ color: Colors.primary, fontSize: FontSize.xl }}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={{ fontFamily: 'Georgia', fontSize: 20, color: Colors.text }}>insights</Text>
          <Text style={{ fontSize: FontSize.xs, color: Colors.muted, marginTop: 2 }}>análise automática de padrões</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 32 }}
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
        {loading && insights.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginTop: Spacing.md }}>analisando dados…</Text>
          </View>
        )}

        {/* Erro */}
        {error ? (
          <View style={{
            backgroundColor: Colors.bgCard,
            borderRadius: Radius.md,
            borderWidth: 1,
            borderColor: Colors.error,
            padding: Spacing.lg,
            marginBottom: Spacing.lg,
          }}>
            <Text style={{ color: Colors.error, fontSize: FontSize.sm }}>{error}</Text>
          </View>
        ) : null}

        {/* Resumo semanal */}
        {weeklySummary ? <WeeklySummaryCard summary={weeklySummary} /> : null}

        {/* Alertas e avisos */}
        {warningInsights.length > 0 && (
          <>
            <Text style={{ fontSize: FontSize.xs, fontWeight: '600', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.md }}>
              atenção
            </Text>
            {warningInsights.map(insight => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </>
        )}

        {/* Pontos positivos */}
        {positiveInsights.length > 0 && (
          <>
            <Text style={{ fontSize: FontSize.xs, fontWeight: '600', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: Spacing.xl, marginBottom: Spacing.md }}>
              parabéns
            </Text>
            {positiveInsights.map(insight => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </>
        )}

        {/* Sem insights */}
        {!loading && insights.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <Text style={{ fontSize: 36, marginBottom: Spacing.md }}>📭</Text>
            <Text style={{ fontSize: FontSize.base, color: Colors.muted, textAlign: 'center', lineHeight: 20 }}>
              registre mais atividades para receber insights personalizados.
            </Text>
          </View>
        )}

        {/* Aviso sobre IA */}
        <View style={{
          backgroundColor: Colors.bgCard,
          borderRadius: Radius.md,
          borderWidth: 1,
          borderColor: Colors.border,
          padding: Spacing.md,
          marginTop: Spacing.lg,
        }}>
          <Text style={{ fontSize: FontSize.xs, color: Colors.muted, textAlign: 'center', lineHeight: 18 }}>
            Os insights são gerados automaticamente com base nos dados registrados.{' '}
            Não substituem orientação médica profissional.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
