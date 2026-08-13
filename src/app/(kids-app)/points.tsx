// src/app/(kids-app)/points.tsx
// UC035 + UC036 — Visão do filho: pontos e mesada.

import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconStar, IconChevronLeft } from '@tabler/icons-react-native';
import { useAuthStore } from '@/stores/auth.store';
import { useKids } from '@/hooks/useKids';
import { Colors, Radius, Spacing, FontSize } from '@/constants/theme';

export default function KidsPointsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { childSession } = useAuthStore();

  const { summaries, allowance, loading, loadForChild, refresh } = useKids(childSession?.profileId);

  useEffect(() => {
    if (childSession?.profileId) loadForChild(childSession.profileId);
  }, [childSession?.profileId]);

  const child = summaries.find((c) => c.child_id === childSession?.profileId);

  const completionPct = child && child.completed_tasks + child.pending_tasks > 0
    ? Math.round((child.completed_tasks / (child.completed_tasks + child.pending_tasks)) * 100)
    : 0;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
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
          <IconChevronLeft size={24} color={Colors.secondary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={{ color: Colors.text, fontSize: FontSize.xl, fontWeight: '600' }}>
          meus pontos e mesada
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: Spacing.lg,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: Spacing.lg,
        }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={Colors.secondary} />
        }
      >
        {loading && !child ? (
          <View style={{ alignItems: 'center', paddingVertical: 64 }}>
            <ActivityIndicator size="large" color={Colors.secondary} />
          </View>
        ) : child ? (
          <>
            {/* Pontos */}
            <View
              style={{
                backgroundColor: Colors.bgCard,
                borderRadius: Radius.xl,
                borderWidth: 1,
                borderColor: Colors.secondary + '44',
                padding: Spacing.xl,
                alignItems: 'center',
                marginBottom: Spacing.lg,
              }}
            >
              <IconStar size={48} color={Colors.secondary} strokeWidth={1.6} />
              <Text style={{ color: Colors.secondary, fontSize: 52, fontWeight: '700', marginTop: 8 }}>
                {child.total_points}
              </Text>
              <Text style={{ color: Colors.muted, fontSize: FontSize.base, marginTop: 2 }}>
                pontos acumulados
              </Text>
            </View>

            {/* Progresso */}
            <View
              style={{
                backgroundColor: Colors.bgCard,
                borderRadius: Radius.xl,
                borderWidth: 1,
                borderColor: Colors.border,
                padding: Spacing.lg,
                marginBottom: Spacing.lg,
              }}
            >
              <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.md }}>
                progresso de tarefas
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
                <Text style={{ color: Colors.text, fontSize: FontSize.sm }}>
                  {child.completed_tasks} de {child.completed_tasks + child.pending_tasks} concluídas
                </Text>
                <Text style={{ color: Colors.secondary, fontSize: FontSize.sm, fontWeight: '700' }}>
                  {completionPct}%
                </Text>
              </View>
              <View style={{ height: 8, backgroundColor: Colors.bg, borderRadius: Radius.full, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border }}>
                <View
                  style={{
                    height: '100%',
                    width: `${completionPct}%` as any,
                    backgroundColor: Colors.secondary,
                    borderRadius: Radius.full,
                  }}
                />
              </View>
              <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg }}>
                <View style={{ flex: 1, backgroundColor: Colors.bg, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border }}>
                  <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>concluídas</Text>
                  <Text style={{ color: Colors.primary, fontSize: FontSize.xl, fontWeight: '700', marginTop: 2 }}>
                    {child.completed_tasks}
                  </Text>
                </View>
                <View style={{ flex: 1, backgroundColor: Colors.bg, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border }}>
                  <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>pendentes</Text>
                  <Text style={{ color: Colors.warning, fontSize: FontSize.xl, fontWeight: '700', marginTop: 2 }}>
                    {child.pending_tasks}
                  </Text>
                </View>
              </View>
            </View>

            {/* Mesada */}
            {allowance && (
              <View
                style={{
                  backgroundColor: Colors.bgCard,
                  borderRadius: Radius.xl,
                  borderWidth: 1,
                  borderColor: Colors.secondary + '44',
                  padding: Spacing.lg,
                }}
              >
                <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.md }}>
                  mesada do período (7 dias)
                </Text>
                <Text style={{ color: Colors.secondary, fontSize: 40, fontWeight: '700' }}>
                  R$ {(allowance.allowance_cents / 100).toFixed(2).replace('.', ',')}
                </Text>
                <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginTop: 6 }}>
                  {allowance.points_earned} pontos · 10 pts = R$ 1,00
                </Text>
                <Text style={{ color: Colors.muted, fontSize: FontSize.xs, marginTop: 4 }}>
                  {new Date(allowance.period_start + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} –{' '}
                  {new Date(allowance.period_end + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 64 }}>
            <Text style={{ color: Colors.muted, fontSize: FontSize.base }}>dados não encontrados.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
