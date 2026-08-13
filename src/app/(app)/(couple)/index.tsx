// src/app/(app)/(couple)/index.tsx
// UC031–034: Hub do módulo Casal

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
import { useCouple } from '@/hooks/useCouple';
import { useFamily } from '@/context/FamilyContext';
import {
  MOOD_EMOJI,
  MOOD_LABELS,
  MoodLevel,
} from '@/types/couple.types';
import { Colors, Radius, Spacing, FontSize } from '@/constants/theme';

function ActionCard({
  emoji,
  title,
  subtitle,
  accent,
  badge,
  onPress,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  accent: string;
  badge?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      style={{
        backgroundColor: Colors.bgCard,
        borderRadius: Radius.xl,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: Radius.md,
              backgroundColor: accent + '22',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 22 }}>{emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ color: Colors.text, fontSize: FontSize.lg, fontWeight: '600' }}>{title}</Text>
              {badge ? (
                <View style={{ backgroundColor: accent + '33', borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text style={{ color: accent, fontSize: FontSize.xs, fontWeight: '600' }}>{badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginTop: 4, lineHeight: 18 }}>{subtitle}</Text>
          </View>
        </View>
        <Text style={{ color: accent, fontSize: FontSize.xl }}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

function MoodChip({ mood }: { mood: MoodLevel }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.bg,
        borderRadius: Radius.full,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: Colors.border,
      }}
    >
      <Text style={{ fontSize: 16 }}>{MOOD_EMOJI[mood]}</Text>
      <Text style={{ color: Colors.text, fontSize: FontSize.sm, fontWeight: '500' }}>
        {MOOD_LABELS[mood]}
      </Text>
    </View>
  );
}

export default function CoupleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { family } = useFamily();
  const { appreciations, checkins, loading, error, refresh } = useCouple();

  const todayStr = new Date().toISOString().split('T')[0];
  const myCheckinToday = checkins.find((c) => c.checked_at === todayStr);
  const lastAppreciation = appreciations[0];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + Spacing.lg,
          paddingBottom: Spacing.lg,
          paddingHorizontal: Spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        }}
      >
        <Text style={{ color: Colors.primary, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' }}>
          módulo casal
        </Text>
        {/* Título em serif — voz de destaque (handoff v2) */}
        <Text style={{ fontFamily: 'Georgia', color: Colors.text, fontSize: 22, marginTop: 6 }}>
          conexão e cuidado a dois
        </Text>
        <Text style={{ color: Colors.muted, fontSize: FontSize.md, marginTop: 6, lineHeight: 20 }}>
          Apreciação, estado emocional, gastos e tempo livre — tudo num espaço só para vocês dois.
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: Spacing.lg,
          paddingBottom: insets.bottom + 120,
          paddingHorizontal: Spacing.lg,
        }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {error ? (
          <View style={{ backgroundColor: Colors.bgCard, borderRadius: Radius.md, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.error }}>
            <Text style={{ color: Colors.error, fontSize: FontSize.sm }}>{error}</Text>
          </View>
        ) : null}

        {loading && appreciations.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <>
            {/* Status do dia */}
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
              <Text style={{ color: Colors.primary, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                hoje
              </Text>
              <Text style={{ color: Colors.text, fontSize: FontSize.xl, fontWeight: '600', marginTop: 8 }}>
                {myCheckinToday ? 'seu check-in do dia' : 'como você está hoje?'}
              </Text>
              {myCheckinToday ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.md }}>
                  <MoodChip mood={myCheckinToday.mood} />
                  {myCheckinToday.note ? (
                    <Text style={{ color: Colors.muted, fontSize: FontSize.sm, flex: 1 }} numberOfLines={2}>
                      "{myCheckinToday.note}"
                    </Text>
                  ) : null}
                </View>
              ) : (
                <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginTop: 8, lineHeight: 18 }}>
                  registre como está se sentindo — seu parceiro(a) também pode ver.
                </Text>
              )}

              <TouchableOpacity
                onPress={() => router.push('/(app)/(couple)/checkin' as never)}
                activeOpacity={0.8}
                style={{
                  marginTop: Spacing.lg,
                  backgroundColor: Colors.primary,
                  borderRadius: Radius.md,
                  paddingVertical: Spacing.md,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: Colors.onLight, fontSize: FontSize.base, fontWeight: '600' }}>
                  {myCheckinToday ? 'atualizar check-in' : 'fazer check-in'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Última apreciação */}
            {lastAppreciation ? (
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
                <Text style={{ color: Colors.secondary, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                  última apreciação
                </Text>
                <Text style={{ color: Colors.text, fontSize: FontSize.xl, fontWeight: '500', marginTop: 8 }}>
                  {lastAppreciation.emoji ?? '💛'} {lastAppreciation.message}
                </Text>
                <Text style={{ color: Colors.muted, fontSize: FontSize.xs, marginTop: 6 }}>
                  {new Date(lastAppreciation.created_at).toLocaleDateString('pt-BR', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </Text>
              </View>
            ) : null}

            {/* Ações principais */}
            <Text style={{ color: Colors.primary, fontSize: FontSize.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.md }}>
              ações
            </Text>

            <ActionCard
              emoji="💌"
              title="Enviar apreciação"
              subtitle="Uma mensagem rápida para mostrar que você vê e valoriza o parceiro(a)."
              accent={Colors.secondary}
              onPress={() => router.push('/(app)/(couple)/appreciation' as never)}
            />
            <ActionCard
              emoji="💰"
              title="Gastos do casal"
              subtitle="Registre e divida despesas de forma transparente e sem atrito."
              accent={Colors.primary}
              onPress={() => router.push('/(app)/(couple)/expenses' as never)}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}
