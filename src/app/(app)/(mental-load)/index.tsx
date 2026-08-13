// src/app/(app)/(mental-load)/index.tsx
// UC024 — Carga Mental com paleta dark do handoff

import React, { useEffect } from 'react';
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
import { IconScale, IconClipboardList, IconChartBar, IconRobot, IconMoodEmpty } from '@tabler/icons-react-native';
import { useMentalLoad } from '@/hooks/useMentalLoad';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { useFamily } from '@/hooks';
import { MentalLoadPeriod, MemberLoadSummary } from '@/types/differential.types';
import { Colors, Radius, Spacing, FontSize } from '@/constants/theme';

// ─── BalanceBar ───────────────────────────────────────────────────

function BalanceBar({
  members,
  isBalanced,
  imbalancePct,
}: {
  members: MemberLoadSummary[];
  isBalanced: boolean;
  imbalancePct: number;
}) {
  if (members.length < 2) return null;

  const sorted = [...members].sort((a, b) => b.total_points - a.total_points);

  // UC028: flag de desequilíbrio se diferença > 10%
  const a11yLabel =
    `Distribuição de carga: ` +
    sorted.map((m) => `${m.member_name} com ${m.percentage}%`).join(' e ') +
    (isBalanced ? ', equilibrado' : `, desequilíbrio de ${imbalancePct}%`);

  return (
    <View>
      {/* Labels acima da barra */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
        {sorted.map((m) => (
          <Text key={m.member_id} style={{ fontSize: FontSize.sm, color: Colors.text, fontWeight: '500' }}>
            {m.member_name.split(' ')[0]}
            <Text style={{ color: Colors.muted, fontWeight: '400' }}> {m.percentage}%</Text>
          </Text>
        ))}
      </View>

      {/* Barra proporcional */}
      <View
        accessible
        accessibilityLabel={a11yLabel}
        style={{ flexDirection: 'row', height: 10, borderRadius: Radius.full, overflow: 'hidden', backgroundColor: Colors.bg }}
      >
        {sorted.map((m, i) => (
          <View
            key={m.member_id}
            style={{
              flex:            m.percentage,
              // Nunca usa verde (success) — identidade visual só usa primário/secondary/border
              // Desequilíbrio >30%: laranja primário (Colors.primary). Caso contrário: secondary/border.
              backgroundColor: !isBalanced && imbalancePct > 30
                ? (i === 0 ? Colors.primary : Colors.border)
                : (i === 0 ? Colors.secondary : Colors.border),
            }}
          />
        ))}
      </View>

      {/* UC028: flag de desequilíbrio > 10% */}
      {!isBalanced && (
        <View style={{
          flexDirection:   'row',
          alignItems:      'center',
          gap:             Spacing.xs,
          marginTop:       Spacing.sm,
          backgroundColor: Colors.warning + '22',
          borderRadius:    Radius.sm,
          paddingHorizontal: Spacing.sm,
          paddingVertical:   4,
        }}>
          <IconScale
            size={13}
            color={imbalancePct > 30 ? Colors.primary : Colors.warning}
            strokeWidth={2}
          />
          <Text style={{ fontSize: FontSize.xs, color: imbalancePct > 30 ? Colors.primary : Colors.warning, fontWeight: '600' }}>
            desequilíbrio de {imbalancePct}%
          </Text>
          <Text style={{ fontSize: FontSize.xs, color: Colors.muted, flex: 1 }}>
            {/* tom observacional — sem acusação (handoff DoD) */}
            essa semana pesou mais pro lado de {sorted[0].member_name.split(' ')[0]}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── MemberCard ───────────────────────────────────────────────────

// Blob assimétrico ligeiramente diferente entre rank 0 e rank 1 (handoff v2)
// rank 0 = quem tem mais pontos na semana
const BLOB_RADIUS: Record<number, object> = {
  0: { borderTopLeftRadius: 42, borderTopRightRadius: 58, borderBottomRightRadius: 52, borderBottomLeftRadius: 44 },
  1: { borderTopLeftRadius: 58, borderTopRightRadius: 42, borderBottomRightRadius: 44, borderBottomLeftRadius: 52 },
};

function MemberCard({ member, rank }: { member: MemberLoadSummary; rank: number }) {
  const blob = BLOB_RADIUS[rank] ?? BLOB_RADIUS[0];
  return (
    <View style={{
      backgroundColor: Colors.card,
      ...blob,
      padding:      Spacing.lg,
      borderWidth:  1,
      borderColor:  Colors.border,
      marginBottom: Spacing.sm,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
        <Text style={{ fontSize: FontSize.base, fontWeight: '500', color: Colors.text }}>
          {member.member_name}
        </Text>
        {/* Percentual em serif 27px — voz de destaque (handoff v2) */}
        <Text style={{ fontFamily: 'Georgia', fontSize: 27, color: Colors.text, lineHeight: 32 }}>
          {member.percentage}%
        </Text>
      </View>
      <Text style={{ fontSize: FontSize.xs, color: Colors.muted, marginBottom: Spacing.sm }}>
        {member.total_points} ponto{member.total_points !== 1 ? 's' : ''}
      </Text>
      {/* Mini barra */}
      <View style={{ height: 4, backgroundColor: Colors.bg, borderRadius: Radius.full, overflow: 'hidden' }}>
        <View style={{ height: '100%', backgroundColor: Colors.primary, width: `${member.percentage}%` as any }} />
      </View>
    </View>
  );
}

// ─── Tela principal ───────────────────────────────────────────────

export default function MentalLoadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { summary, loading, error, period, setPeriod, refresh } = useMentalLoad();

  // Handoff: tela não deve mostrar comparação sem pelo menos 2 adultos na família.
  const { family } = useFamily();
  const { members, load: loadMembers } = useFamilyMembers(family?.id);
  useEffect(() => { loadMembers(); }, [loadMembers]);
  const adultCount = members.filter((m) => m.role === 'admin' || m.role === 'parent').length;
  const hasTwoAdults = adultCount >= 2;

  const periodOptions: { key: MentalLoadPeriod; label: string }[] = [
    { key: 'week',  label: '7 dias' },
    { key: 'month', label: '30 dias' },
  ];

  const sortedMembers = summary
    ? [...summary.members].sort((a, b) => b.total_points - a.total_points)
    : [];

  // ── Tela: família com 1 adulto ─────────────────────────────────
  if (!loading && members.length > 0 && !hasTwoAdults) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, paddingTop: insets.top, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxl }}>
        <Text style={{ fontFamily: 'Georgia', fontSize: 26, color: Colors.text, textAlign: 'center', marginBottom: Spacing.md }}>
          equilíbrio do casal
        </Text>
        <Text style={{ color: Colors.muted, fontSize: FontSize.base, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xl }}>
          essa tela compara a distribuição de tarefas entre dois adultos.{'\n'}
          convide seu parceiro(a) para a família para ativar este módulo.
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(app)/(family)' as never)}
          activeOpacity={0.82}
          style={{ backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: Spacing.md, paddingHorizontal: Spacing['2xl'] }}
        >
          <Text style={{ color: Colors.onLight, fontSize: FontSize.base, fontWeight: '500' }}>
            convidar parceiro(a)
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, paddingTop: insets.top }}>
      {/* Header — serif v2 */}
      <View style={{
        paddingHorizontal: Spacing.lg,
        paddingVertical:   Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
      }}>
        <Text style={{ fontSize: 20, fontFamily: 'Georgia', color: Colors.text }}>
          equilíbrio do casal
        </Text>
        <Text style={{ fontSize: FontSize.xs, color: Colors.muted, marginTop: 2 }}>
          distribuição de tarefas na semana
        </Text>
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
        {/* Seletor de período */}
        <View style={{
          flexDirection:   'row',
          backgroundColor: Colors.card,
          borderRadius:    Radius.md,
          padding:         4,
          marginBottom:    Spacing.xl,
          borderWidth:     1,
          borderColor:     Colors.border,
        }}>
          {periodOptions.map((opt) => (
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

        {/* Loading */}
        {loading && !summary && (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginTop: Spacing.md }}>
              calculando carga mental...
            </Text>
          </View>
        )}

        {/* Erro */}
        {error && (
          <View style={{ backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.error }}>
            <Text style={{ color: Colors.error, fontSize: FontSize.sm }}>{error}</Text>
          </View>
        )}

        {/* Conteúdo */}
        {summary && (
          <>
            {/* Card da barra de equilíbrio */}
            <View style={{
              backgroundColor: Colors.card,
              borderRadius:    Radius.md,
              padding:         Spacing.lg,
              borderWidth:     1,
              borderColor:     Colors.border,
              marginBottom:    Spacing.xl,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md }}>
                <Text style={{ fontSize: FontSize.sm, fontWeight: '500', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  distribuição da carga
                </Text>
                <View style={{
                  backgroundColor: summary.is_balanced ? Colors.secondary + '22' : Colors.warning + '22',
                  borderRadius: Radius.full,
                  paddingHorizontal: Spacing.sm,
                  paddingVertical: 2,
                }}>
                  <Text style={{ fontSize: FontSize.xs, fontWeight: '600', color: summary.is_balanced ? Colors.secondary : Colors.warning }}>
                    {summary.is_balanced ? 'equilibrado' : 'desequilíbrio'}
                  </Text>
                </View>
              </View>
              <BalanceBar
                members={summary.members}
                isBalanced={summary.is_balanced}
                imbalancePct={summary.imbalance_percentage}
              />
            </View>

            {/* Cards por membro */}
            <Text style={{ fontSize: FontSize.xs, fontWeight: '500', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.md }}>
              por responsável
            </Text>
            {sortedMembers.map((member, index) => (
              <MemberCard key={member.member_id} member={member} rank={index} />
            ))}

            {/* CTA check-in */}
            <TouchableOpacity
              onPress={() => router.push('/(app)/(mental-load)/checkin' as never)}
              activeOpacity={0.8}
              style={{
                backgroundColor: Colors.primary,
                borderRadius:    Radius.md,
                paddingVertical: Spacing.lg,
                alignItems:      'center',
                marginTop:       Spacing.xl,
              }}
            >
              <Text style={{ fontSize: FontSize.base, fontWeight: '500', color: Colors.onLight }}>
                iniciar check-in da semana
              </Text>
            </TouchableOpacity>

            {/* Atalhos */}
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
              <TouchableOpacity
                onPress={() => router.push('/(app)/(mental-load)/activities' as never)}
                style={{ flex: 1, backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: Colors.border }}
                activeOpacity={0.7}
              >
                <IconClipboardList size={22} color={Colors.secondary} style={{ marginBottom: 4 }} />
                <Text style={{ fontSize: FontSize.sm, fontWeight: '500', color: Colors.text }}>atividades</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/(app)/(mental-load)/history' as never)}
                style={{ flex: 1, backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: Colors.border }}
                activeOpacity={0.7}
              >
                <IconChartBar size={22} color={Colors.secondary} style={{ marginBottom: 4 }} />
                <Text style={{ fontSize: FontSize.sm, fontWeight: '500', color: Colors.text }}>gráfico</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/(app)/(mental-load)/insights' as never)}
                style={{ flex: 1, backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: Colors.border }}
                activeOpacity={0.7}
              >
                <IconRobot size={22} color={Colors.secondary} style={{ marginBottom: 4 }} />
                <Text style={{ fontSize: FontSize.sm, fontWeight: '500', color: Colors.text }}>insights</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Estado vazio — sem registros na semana */}
        {!loading && summary && summary.members.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <View style={{
              width: 48, height: 48, borderRadius: 12,
              backgroundColor: Colors.bgCard,
              borderWidth: 1, borderColor: Colors.border,
              alignItems: 'center', justifyContent: 'center',
              marginBottom: Spacing.md,
            }}>
              <IconMoodEmpty size={24} color={Colors.muted} />
            </View>
            <Text style={{ fontSize: FontSize.lg, fontWeight: '500', color: Colors.text, textAlign: 'center' }}>
              nada registrado ainda essa semana
            </Text>
            <Text style={{ fontSize: FontSize.sm, color: Colors.muted, textAlign: 'center', marginTop: Spacing.xs }}>
              conclua tarefas para ver a distribuição aqui
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
