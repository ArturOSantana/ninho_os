// src/app/(kids-app)/achievements.tsx
// UC037 — Visão do filho: conquistas.

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
import {
  IconStar,
  IconMedal,
  IconTrophy,
  IconDiamond,
  IconLock,
  IconBolt,
  IconChevronLeft,
  type Icon,
} from '@tabler/icons-react-native';
import { useAuthStore } from '@/stores/auth.store';
import { useKids } from '@/hooks/useKids';
import { ChildAchievement, ACHIEVEMENT_MILESTONES } from '@/types/kids.types';
import { Colors, Radius, Spacing, FontSize } from '@/constants/theme';

const TABLER_ICON_MAP: Record<string, Icon> = {
  star:    IconStar,
  medal:   IconMedal,
  trophy:  IconTrophy,
  diamond: IconDiamond,
};

function BadgeIcon({ name, size = 26, color }: { name: string; size?: number; color: string }) {
  const IconComp = TABLER_ICON_MAP[name] ?? IconBolt;
  return <IconComp size={size} color={color} strokeWidth={1.8} />;
}

function AchievementCard({ item, unlocked }: { item: ChildAchievement | typeof ACHIEVEMENT_MILESTONES[0]; unlocked: boolean }) {
  const isAchievement = 'id' in item;
  const iconName = isAchievement ? (item as ChildAchievement).badge_icon : (item as typeof ACHIEVEMENT_MILESTONES[0]).icon;
  const date = isAchievement
    ? new Date((item as ChildAchievement).awarded_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
    : null;

  return (
    <View
      style={{
        backgroundColor: Colors.bgCard,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: unlocked ? Colors.secondary + '66' : Colors.border,
        padding: Spacing.lg,
        marginBottom: Spacing.sm,
        opacity: unlocked ? 1 : 0.45,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
      }}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: Radius.full,
          backgroundColor: unlocked ? Colors.secondary + '33' : Colors.border + '44',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <BadgeIcon name={iconName} size={26} color={unlocked ? Colors.secondary : Colors.muted} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <Text style={{ color: Colors.text, fontSize: FontSize.base, fontWeight: '600', flex: 1 }}>
            {item.title}
          </Text>
          {unlocked && date ? (
            <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>{date}</Text>
          ) : !unlocked ? (
            <View style={{ backgroundColor: Colors.border, borderRadius: Radius.full, padding: 6 }}>
              <IconLock size={12} color={Colors.muted} strokeWidth={1.8} />
            </View>
          ) : null}
        </View>
        <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginTop: 4, lineHeight: 18 }}>
          {item.description ?? ''}
        </Text>
      </View>
    </View>
  );
}

export default function KidsAchievementsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { childSession } = useAuthStore();

  const { achievements, loading, loadForChild, refresh } = useKids(childSession?.profileId);

  useEffect(() => {
    if (childSession?.profileId) loadForChild(childSession.profileId);
  }, [childSession?.profileId]);

  const unlockedPoints = new Set(achievements.map((a) => a.points_at));
  const milestonePoints = new Set(ACHIEVEMENT_MILESTONES.map((m) => m.points));
  const customAchievements = achievements.filter((a) => !milestonePoints.has(a.points_at));

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
        <View style={{ flex: 1 }}>
          <Text style={{ color: Colors.text, fontSize: FontSize.xl, fontWeight: '600' }}>
            minhas conquistas
          </Text>
        </View>
        <View style={{ backgroundColor: Colors.secondary + '22', borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 4 }}>
          <Text style={{ color: Colors.secondary, fontSize: FontSize.sm, fontWeight: '700' }}>
            {achievements.length} desbloqueadas
          </Text>
        </View>
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
        {loading && achievements.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 64 }}>
            <ActivityIndicator size="large" color={Colors.secondary} />
          </View>
        ) : (
          <>
            <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.md }}>
              marcos de pontuação
            </Text>
            {ACHIEVEMENT_MILESTONES.map((milestone) => {
              const unlocked = unlockedPoints.has(milestone.points);
              const achievement = achievements.find((a) => a.points_at === milestone.points);
              return (
                <AchievementCard
                  key={milestone.points}
                  item={achievement ?? milestone}
                  unlocked={unlocked}
                />
              );
            })}

            {customAchievements.length > 0 && (
              <>
                <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: Spacing['2xl'], marginBottom: Spacing.md }}>
                  conquistas especiais
                </Text>
                {customAchievements.map((ach) => (
                  <AchievementCard key={ach.id} item={ach} unlocked />
                ))}
              </>
            )}

            {achievements.length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <IconLock size={40} color={Colors.muted} strokeWidth={1.2} style={{ marginBottom: Spacing.md }} />
                <Text style={{ color: Colors.muted, fontSize: FontSize.base, textAlign: 'center' }}>
                  nenhuma conquista ainda.{'\n'}complete tarefas para desbloquear!
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
