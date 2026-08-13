// src/app/(kids-app)/index.tsx
// Dashboard da criança — visão do filho logado via PIN.
// Mostra: saudação, pontos, progresso de tarefas, mesada e conquistas recentes.

import React, { useEffect, useCallback } from 'react';
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
import {
  IconStar,
  IconTrophy,
  IconLogout,
  IconChevronRight,
} from '@tabler/icons-react-native';
import { useAuthStore } from '@/stores/auth.store';
import { useKids } from '@/hooks/useKids';
import { ACHIEVEMENT_MILESTONES } from '@/types/kids.types';
import { Colors, Radius, Spacing, FontSize } from '@/constants/theme';

// ─── Helpers ─────────────────────────────────────────────────

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'bom dia';
  if (h < 18) return 'boa tarde';
  return 'boa noite';
}

// ─── Tela ─────────────────────────────────────────────────────

export default function KidsDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { childSession, setChildSession } = useAuthStore();

  const { summaries, achievements, allowance, loading, loadForChild, refresh } = useKids(
    childSession?.profileId,
  );

  const child = summaries.find((c) => c.child_id === childSession?.profileId);

  useEffect(() => {
    if (childSession?.profileId) {
      loadForChild(childSession.profileId);
    }
  }, [childSession?.profileId]);

  const handleLogout = useCallback(() => {
    setChildSession(null);
    router.replace('/(app)/(dashboard)' as never);
  }, [setChildSession, router]);

  const completionPct = child && child.completed_tasks + child.pending_tasks > 0
    ? Math.round((child.completed_tasks / (child.completed_tasks + child.pending_tasks)) * 100)
    : 0;

  // Próximo marco ainda não desbloqueado
  const unlockedPoints = new Set(achievements.map((a) => a.points_at));
  const nextMilestone = ACHIEVEMENT_MILESTONES.find((m) => !unlockedPoints.has(m.points));
  const totalPoints = child?.total_points ?? 0;
  const progressToNext = nextMilestone
    ? Math.min(100, Math.round((totalPoints / nextMilestone.points) * 100))
    : 100;

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
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        }}
      >
        <View>
          <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' }}>
            {greeting()}
          </Text>
          <Text style={{ fontFamily: 'Georgia', color: Colors.text, fontSize: 22, marginTop: 4 }}>
            {childSession?.name.split(' ')[0] ?? 'filho'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleLogout}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="sair da conta do filho"
          style={{
            backgroundColor: Colors.bgCard,
            borderRadius: Radius.full,
            padding: 10,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        >
          <IconLogout size={18} color={Colors.muted} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: Spacing.lg,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: Spacing.lg,
        }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={Colors.secondary}
            colors={[Colors.secondary]}
          />
        }
      >
        {loading && !child ? (
          <View style={{ alignItems: 'center', paddingVertical: 64 }}>
            <ActivityIndicator size="large" color={Colors.secondary} />
          </View>
        ) : (
          <>
            {/* ── Card de pontos ────────────────────────── */}
            <TouchableOpacity
              onPress={() => router.push('/(kids-app)/points' as never)}
              activeOpacity={0.88}
              accessibilityLabel={`${totalPoints} pontos. ver detalhes`}
              style={{
                backgroundColor: Colors.bgCard,
                borderRadius: Radius.xl,
                borderWidth: 1,
                borderColor: Colors.secondary + '55',
                padding: Spacing.xl,
                marginBottom: Spacing.lg,
                alignItems: 'center',
              }}
            >
              <IconStar size={40} color={Colors.secondary} strokeWidth={1.6} />
              <Text style={{ color: Colors.secondary, fontSize: 52, fontWeight: '700', marginTop: 8 }}>
                {totalPoints}
              </Text>
              <Text style={{ color: Colors.muted, fontSize: FontSize.base, marginTop: 2 }}>
                pontos acumulados
              </Text>

              {/* Progresso para o próximo marco */}
              {nextMilestone && (
                <View style={{ width: '100%', marginTop: Spacing.lg }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs }}>
                    <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>
                      próxima conquista: {nextMilestone.title}
                    </Text>
                    <Text style={{ color: Colors.secondary, fontSize: FontSize.xs, fontWeight: '600' }}>
                      {totalPoints}/{nextMilestone.points}
                    </Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: Colors.bg, borderRadius: Radius.full, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border }}>
                    <View
                      style={{
                        height: '100%',
                        width: `${progressToNext}%` as any,
                        backgroundColor: Colors.secondary,
                        borderRadius: Radius.full,
                      }}
                    />
                  </View>
                </View>
              )}
            </TouchableOpacity>

            {/* ── Tarefas ───────────────────────────────── */}
            {child && (
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
                  tarefas de hoje
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
                      backgroundColor: Colors.primary,
                      borderRadius: Radius.full,
                    }}
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md }}>
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
                  {allowance && (
                    <View style={{ flex: 1, backgroundColor: Colors.bg, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border }}>
                      <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>mesada</Text>
                      <Text style={{ color: Colors.secondary, fontSize: FontSize.xl, fontWeight: '700', marginTop: 2 }}>
                        R${(allowance.allowance_cents / 100).toFixed(0)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* ── Conquistas ────────────────────────────── */}
            <TouchableOpacity
              onPress={() => router.push('/(kids-app)/achievements' as never)}
              activeOpacity={0.88}
              accessibilityLabel={`${achievements.length} conquistas desbloqueadas. ver todas`}
              style={{
                backgroundColor: Colors.bgCard,
                borderRadius: Radius.xl,
                borderWidth: 1,
                borderColor: Colors.border,
                padding: Spacing.lg,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: Radius.md,
                    backgroundColor: Colors.primary + '22',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconTrophy size={22} color={Colors.primary} strokeWidth={1.8} />
                </View>
                <View>
                  <Text style={{ color: Colors.text, fontSize: FontSize.base, fontWeight: '600' }}>
                    conquistas
                  </Text>
                  <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginTop: 2 }}>
                    {achievements.length} desbloqueadas
                  </Text>
                </View>
              </View>
              <IconChevronRight size={18} color={Colors.muted} strokeWidth={2} />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}
