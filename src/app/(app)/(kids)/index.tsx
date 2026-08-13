// src/app/(app)/(kids)/index.tsx — Módulo Filhos (Kids hub)
// Hub principal do módulo Filhos — UC035–042

import React, { useState } from 'react';
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
  IconBowlSpoon,
  IconNotes,
  IconStar,
  IconTrophy,
  IconDeviceTv,
  IconSchool,
  IconLogin2,
  type Icon,
} from '@tabler/icons-react-native';
import { useKids } from '@/hooks/useKids';
import { KidPointsSummary } from '@/types/kids.types';
import { Colors, Radius, Spacing, FontSize } from '@/constants/theme';
import { AddChildForm, AddChildResult } from '@/components/baby/AddChildForm';
import { familyService } from '@/services/family/familyService';
import { useFamily } from '@/context/FamilyContext';
import { TutorialOverlay } from '@/components/ui/TutorialOverlay';
import { useTutorial } from '@/hooks/useTutorial';

function KidCard({
  child,
  selected,
  onPress,
}: {
  child: KidPointsSummary;
  selected: boolean;
  onPress: () => void;
}) {
  const initials = child.child_name
    .trim()
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join('');

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      style={{
        backgroundColor: selected ? Colors.primary + '22' : Colors.bgCard,
        borderRadius: Radius.xl,
        borderWidth: 2,
        borderColor: selected ? Colors.primary : Colors.border,
        padding: Spacing.lg,
        alignItems: 'center',
        minWidth: 110,
        marginRight: Spacing.sm,
      }}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: Radius.full,
          backgroundColor: Colors.secondary + '44',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: Spacing.sm,
          borderWidth: 2,
          borderColor: selected ? Colors.primary : Colors.secondary + '44',
        }}
      >
        <Text style={{ fontSize: FontSize.xl, fontWeight: '700', color: Colors.secondary }}>
          {initials}
        </Text>
      </View>
      <Text style={{ color: Colors.text, fontSize: FontSize.sm, fontWeight: '600', textAlign: 'center' }} numberOfLines={1}>
        {child.child_name.split(' ')[0]}
      </Text>
      <Text style={{ color: Colors.secondary, fontSize: FontSize.xs, marginTop: 2, fontWeight: '600' }}>
        {child.total_points} pts
      </Text>
    </TouchableOpacity>
  );
}

function ChildModuleCard({
  icon: ModuleIcon,
  title,
  subtitle,
  accent,
  onPress,
}: {
  icon: Icon;
  title: string;
  subtitle: string;
  accent: string;
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
            {React.createElement(ModuleIcon, { size: 22, color: accent, strokeWidth: 1.8 })}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: Colors.text, fontSize: FontSize.lg, fontWeight: '600' }}>{title}</Text>
            <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginTop: 4, lineHeight: 18 }}>{subtitle}</Text>
          </View>
        </View>
        <Text style={{ color: accent, fontSize: FontSize.xl }}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function KidsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { family } = useFamily();
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const { summaries, screenTimeStatus, allowance, dailyMealSummary, homework, loading, error, loadForChild, refresh } = useKids(selectedId);

  // Formulário de adição de filho (UC043)
  const [addFormVisible, setAddFormVisible] = useState(false);
  const [addFormSaving,  setAddFormSaving]  = useState(false);

  const handleAddChild = async (result: AddChildResult) => {
    if (!family?.id) return;
    setAddFormSaving(true);
    try {
      if (result.type === 'child') {
        const newProfile = await familyService.createChildProfile(family.id, result.name, result.birthDate);
        // Seleciona a criança recém-criada após o refresh
        await refresh();
        setSelectedId(newProfile.id);
      } else {
        // Bebê: delega para o fluxo do onboarding (não faz sentido aqui)
        await familyService.createChildProfile(family.id, result.name, result.birthDate);
        await refresh();
      }
      setAddFormVisible(false);
    } catch {
      // Mantém modal aberto para o usuário tentar de novo
    } finally {
      setAddFormSaving(false);
    }
  };

  const selectedChild = summaries.find((c) => c.child_id === selectedId) ?? summaries[0];

  const handleSelectChild = (childId: string) => {
    setSelectedId(childId);
    loadForChild(childId);
  };

  const tutorial = useTutorial('kids');

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <TutorialOverlay
        visible={tutorial.visible}
        screenKey="kids"
        onDismiss={tutorial.dismiss}
      />
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
        <Text style={{ color: Colors.secondary, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' }}>
          módulo filhos
        </Text>
        {/* Título em serif — voz de destaque (handoff v2) */}
        <Text style={{ fontFamily: 'Georgia', color: Colors.text, fontSize: 22, marginTop: 6 }}>
          crescendo juntos
        </Text>
        <Text style={{ color: Colors.muted, fontSize: FontSize.md, marginTop: 6, lineHeight: 20 }}>
          Pontos, mesada, conquistas, agenda escolar e tempo de tela — tudo num espaço dedicado.
        </Text>
      </View>

      {/* Formulário de adição de filho — UC043 (disponível em qualquer estado da tela) */}
      <AddChildForm
        visible={addFormVisible}
        saving={addFormSaving}
        onClose={() => setAddFormVisible(false)}
        onSubmit={handleAddChild}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: Spacing.lg,
          paddingBottom: insets.bottom + 120,
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
        {error ? (
          <View style={{ marginHorizontal: Spacing.lg, backgroundColor: Colors.bgCard, borderRadius: Radius.md, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.error }}>
            <Text style={{ color: Colors.error, fontSize: FontSize.sm }}>{error}</Text>
          </View>
        ) : null}

        {loading && summaries.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 64 }}>
            <ActivityIndicator size="large" color={Colors.secondary} />
          </View>
        ) : summaries.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 64, paddingHorizontal: Spacing['2xl'] }}>
            <Text style={{ fontSize: 40, marginBottom: Spacing.lg }}>✦</Text>
            <Text style={{ color: Colors.text, fontSize: FontSize.lg, fontWeight: '600', textAlign: 'center' }}>
              nenhuma criança cadastrada
            </Text>
            <Text style={{ color: Colors.muted, fontSize: FontSize.base, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 20 }}>
              adicione uma criança para usar este espaço.
            </Text>
            <TouchableOpacity
              onPress={() => setAddFormVisible(true)}
              activeOpacity={0.82}
              style={{ marginTop: Spacing.xl, backgroundColor: Colors.secondary, borderRadius: Radius.lg, paddingVertical: Spacing.md, paddingHorizontal: Spacing['2xl'] }}
            >
              <Text style={{ color: Colors.onLight, fontSize: FontSize.base, fontWeight: '600' }}>
                adicionar filho
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Seletor de criança */}
            <View style={{ paddingLeft: Spacing.lg, marginBottom: Spacing.lg }}>
              <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.md }}>
                selecione a criança
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: Spacing.lg }}>
                {summaries.map((child) => (
                  <KidCard
                    key={child.child_id}
                    child={child}
                    selected={(selectedId ?? summaries[0]?.child_id) === child.child_id}
                    onPress={() => handleSelectChild(child.child_id)}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Resumo da criança selecionada */}
            {selectedChild && (
              <View style={{ paddingHorizontal: Spacing.lg }}>
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
                    resumo
                  </Text>
                  {/* Nome da criança em serif — voz de destaque (handoff v2) */}
                  <Text style={{ fontFamily: 'Georgia', color: Colors.text, fontSize: 24, marginTop: 8 }}>
                    {selectedChild.child_name.split(' ')[0]}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md }}>
                    <View style={{ flex: 1, backgroundColor: Colors.bg, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border }}>
                      <Text style={{ color: Colors.muted, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.5 }}>pontos</Text>
                      <Text style={{ color: Colors.secondary, fontSize: FontSize.xl, fontWeight: '700', marginTop: 4 }}>
                        {selectedChild.total_points}
                      </Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: Colors.bg, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border }}>
                      <Text style={{ color: Colors.muted, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.5 }}>tarefas</Text>
                      <Text style={{ color: Colors.text, fontSize: FontSize.xl, fontWeight: '700', marginTop: 4 }}>
                        {selectedChild.completed_tasks}/{selectedChild.completed_tasks + selectedChild.pending_tasks}
                      </Text>
                    </View>
                    {allowance && (
                      <View style={{ flex: 1, backgroundColor: Colors.bg, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border }}>
                        <Text style={{ color: Colors.muted, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.5 }}>mesada</Text>
                        <Text style={{ color: Colors.primary, fontSize: FontSize.xl, fontWeight: '700', marginTop: 4 }}>
                          R${(allowance.allowance_cents / 100).toFixed(2).replace('.', ',')}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Tempo de tela */}
                  {screenTimeStatus && (
                    <View style={{ marginTop: Spacing.md }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs }}>
                        <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>tempo de tela hoje</Text>
                          <Text style={{
                            color: screenTimeStatus.over_limit ? Colors.warning : Colors.secondary,
                          fontSize: FontSize.xs,
                          fontWeight: '600',
                        }}>
                          {screenTimeStatus.used_min}min / {screenTimeStatus.allowed_min}min
                        </Text>
                      </View>
                      <View style={{ height: 6, backgroundColor: Colors.bg, borderRadius: Radius.full, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border }}>
                        <View
                          style={{
                            height: '100%',
                            width: `${Math.min(100, screenTimeStatus.percentage_used)}%` as any,
                            backgroundColor: screenTimeStatus.over_limit ? Colors.warning : Colors.secondary,
                            borderRadius: Radius.full,
                          }}
                        />
                      </View>
                    </View>
                  )}
                </View>

                {/* Acesso do filho */}
                <TouchableOpacity
                  onPress={() => router.push('/child-login' as never)}
                  activeOpacity={0.82}
                  accessibilityLabel={`Abrir app do filho ${selectedChild.child_name.split(' ')[0]}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: Spacing.md,
                    backgroundColor: Colors.secondary + '18',
                    borderRadius: Radius.lg,
                    borderWidth: 1,
                    borderColor: Colors.secondary + '44',
                    padding: Spacing.md,
                    marginBottom: Spacing.lg,
                  }}
                >
                  <View style={{ width: 38, height: 38, borderRadius: Radius.md, backgroundColor: Colors.secondary + '33', alignItems: 'center', justifyContent: 'center' }}>
                    <IconLogin2 size={20} color={Colors.secondary} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: Colors.secondary, fontSize: FontSize.sm, fontWeight: '700' }}>
                      entrar como filho
                    </Text>
                    <Text style={{ color: Colors.muted, fontSize: FontSize.xs, marginTop: 1 }}>
                      {selectedChild.child_name.split(' ')[0]} vê só os pontos e conquistas dele
                    </Text>
                  </View>
                  <Text style={{ color: Colors.secondary, fontSize: FontSize.xl }}>›</Text>
                </TouchableOpacity>

                {/* Ações */}
                <Text style={{ color: Colors.secondary, fontSize: FontSize.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.md }}>
                  gerenciar
                </Text>

                {/* ── Alimentação ─────────────────────────── */}
                <ChildModuleCard
                  icon={IconBowlSpoon}
                  title="Alimentação"
                  subtitle={
                    dailyMealSummary && dailyMealSummary.total_slots > 0
                      ? `hoje: ${dailyMealSummary.great_count} ✓ · ${dailyMealSummary.refused_count} recusou`
                      : 'registre as refeições do dia — café, almoço, lanche, janta.'
                  }
                  accent={Colors.primary}
                  onPress={() => router.push({ pathname: '/(app)/(kids)/meals', params: { childId: selectedId ?? summaries[0]?.child_id } } as never)}
                />

                {/* ── Deveres ──────────────────────────────── */}
                <ChildModuleCard
                  icon={IconNotes}
                  title="Deveres de casa"
                  subtitle={(() => {
                    const pending = homework.filter((h) => !h.done).length;
                    return pending > 0
                      ? `${pending} dever${pending > 1 ? 'es' : ''} pendente${pending > 1 ? 's' : ''}`
                      : 'checklist de lição por matéria com revisão dos pais.';
                  })()}
                  accent={Colors.secondary}
                  onPress={() => router.push({ pathname: '/(app)/(kids)/homework', params: { childId: selectedId ?? summaries[0]?.child_id } } as never)}
                />

                {/* ── Pontos / Mesada ──────────────────────── */}
                <ChildModuleCard
                  icon={IconStar}
                  title="Pontos e mesada"
                  subtitle="Tarefas concluídas, pontuação acumulada e mesada do período."
                  accent={Colors.secondary}
                  onPress={() => router.push({ pathname: '/(app)/(kids)/points', params: { childId: selectedId ?? summaries[0]?.child_id } } as never)}
                />
                <ChildModuleCard
                  icon={IconTrophy}
                  title="Conquistas"
                  subtitle="Badges desbloqueados por marcos de pontos e conquistas manuais."
                  accent={Colors.primary}
                  onPress={() => router.push({ pathname: '/(app)/(kids)/achievements', params: { childId: selectedId ?? summaries[0]?.child_id } } as never)}
                />
                <ChildModuleCard
                  icon={IconDeviceTv}
                  title="Tempo de tela"
                  subtitle="Limite diário, uso registrado e histórico semanal."
                  accent={Colors.tertiary}
                  onPress={() => router.push({ pathname: '/(app)/(kids)/screen-time', params: { childId: selectedId ?? summaries[0]?.child_id } } as never)}
                />
                <ChildModuleCard
                  icon={IconSchool}
                  title="Agenda escolar"
                  subtitle="Provas, reuniões e passeios — tudo num lugar."
                  accent={Colors.secondary}
                  onPress={() => router.push({ pathname: '/(app)/(kids)/school', params: { childId: selectedId ?? summaries[0]?.child_id } } as never)}
                />
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
