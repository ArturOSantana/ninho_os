// src/app/(app)/(dashboard)/index.tsx
// Dashboard v2 — direção visual do handoff:
//   • Marca da raposa SVG + wordmark "ninho" em serif itálico no header
//   • Saudação em serif 23px (voz de destaque)
//   • Card de destaque com border-radius blob assimétrico
//   • Cards de métricas escalonados (stagger de margin-top)
//   • FAB circular/blob no lugar de CTA de largura total
//   • Skeleton pulsante no primeiro carregamento
//   • Badge "dados podem estar desatualizados" em caso de erro

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Svg, { Polygon, Path, Ellipse } from 'react-native-svg';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  IconBabyBottle,
  IconHeart,
  IconChecklist,
  IconCalendar,
  IconPlus,
  IconAlertCircle,
  IconX,
  IconEdit,
  IconStar,
} from '@tabler/icons-react-native';
import { useFamily, useAgenda, useTasks, useShopping, useMentalLoad, useBabyRecords } from '@/hooks';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { useAuthStore } from '@/stores/auth.store';
import { Colors, Radius, Spacing, FontSize } from '@/constants/theme';
import { Avatar } from '@/components/ui/Avatar';
import { TutorialOverlay } from '@/components/ui/TutorialOverlay';
import { useTutorial } from '@/hooks/useTutorial';

// ─── Tempo relativo da última mamada ────────────────────────────
function formatRelative(iso: string | undefined): string {
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  if (diffMs < 0) return '—';
  const totalMin = Math.floor(diffMs / 60_000);
  if (totalMin < 1)  return 'agora';
  if (totalMin < 60) return `há ${totalMin}min`;
  const h   = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  return min > 0 ? `há ${h}h${min}min` : `há ${h}h`;
}

// ─── Skeleton pulsante ──────────────────────────────────────────
// Anima opacity 0.35 ↔ 0.7 em loop enquanto carrega.
// Cada instância recebe um delay para criar stagger natural.
function SkeletonRect({
  width,
  height,
  borderRadius = 8,
  delay = 0,
  style,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  delay?: number;
  style?: object;
}) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7,  duration: 500, delay, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 500, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity, delay]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: Colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

// Skeleton do card de destaque (blob)
function SkeletonHighlight() {
  return (
    <View
      style={{
        backgroundColor: Colors.bgCard,
        borderTopLeftRadius: 38,
        borderTopRightRadius: 62,
        borderBottomRightRadius: 58,
        borderBottomLeftRadius: 42,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.xl,
        minHeight: 120,
        marginBottom: Spacing.lg,
        gap: 10,
      }}
    >
      <SkeletonRect width={90} height={10} borderRadius={5} delay={0} />
      <SkeletonRect width="85%" height={22} borderRadius={6} delay={80} />
      <SkeletonRect width="60%" height={14} borderRadius={5} delay={160} />
    </View>
  );
}

// Skeleton dos 4 cards de métrica
function SkeletonMetrics() {
  const stagger = [0, 16, 6, 0];
  return (
    <View style={{ flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg }}>
      {stagger.map((mt, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            backgroundColor: Colors.bgCard,
            borderTopLeftRadius: 50,
            borderTopRightRadius: 50,
            borderBottomRightRadius: 42,
            borderBottomLeftRadius: 58,
            borderWidth: 1,
            borderColor: Colors.border,
            padding: Spacing.md,
            alignItems: 'center',
            marginTop: mt,
            minHeight: 88,
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <SkeletonRect width={18} height={18} borderRadius={9} delay={i * 40} />
          <SkeletonRect width={32} height={8}  borderRadius={4} delay={i * 40 + 60} />
          <SkeletonRect width={40} height={14} borderRadius={5} delay={i * 40 + 120} />
        </View>
      ))}
    </View>
  );
}

// ─── Badge "dados podem estar desatualizados" ───────────────────
function StaleBadge() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: Colors.bgCard,
        borderRadius: Radius.sm,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        alignSelf: 'flex-start',
        marginBottom: Spacing.md,
      }}
      accessible
      accessibilityLabel="Dados podem estar desatualizados"
    >
      <IconAlertCircle size={12} color={Colors.muted} />
      <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>
        dados podem estar desatualizados
      </Text>
    </View>
  );
}

// ─── Componente da raposa (marca) ──────────────────────────────
function FoxMark({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Polygon points="20,10 45,50 10,45" fill="#e8720c" />
      <Polygon points="80,10 55,50 90,45" fill="#e8720c" />
      <Path
        d="M50,30 C70,30 85,50 82,72 C79,92 65,100 50,100 C35,100 21,92 18,72 C15,50 30,30 50,30 Z"
        fill="#e8720c"
      />
      <Path
        d="M50,55 C62,55 70,66 68,80 C66,92 58,98 50,99 C42,98 34,92 32,80 C30,66 38,55 50,55 Z"
        fill="#f5d9b0"
      />
      <Ellipse cx={40} cy={62} rx={3.2} ry={4.2} fill="#0d1b2a" />
      <Ellipse cx={60} cy={62} rx={3.2} ry={4.2} fill="#0d1b2a" />
      <Polygon points="46,85 54,85 50,92" fill="#0d1b2a" />
    </Svg>
  );
}

// ─── Utilitários ───────────────────────────────────────────────
function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'bom dia';
  if (h < 18) return 'boa tarde';
  return 'boa noite';
}

// ─── Card de destaque — blob assimétrico ───────────────────────
function HighlightCard({
  eyebrow,
  title,
  subtitle,
  badge,
  onPress,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  badge?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      style={{
        backgroundColor: Colors.bgCard,
        borderTopLeftRadius: 38,
        borderTopRightRadius: 62,
        borderBottomRightRadius: 58,
        borderBottomLeftRadius: 42,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.xl,
        minHeight: 120,
        marginBottom: Spacing.lg,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm }}>
        <Text style={{ color: Colors.tertiary, fontSize: FontSize.xs, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.8 }}>
          {eyebrow}
        </Text>
        {badge ? (
          <View style={{ backgroundColor: Colors.primary + '22', borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ color: Colors.primary, fontSize: FontSize.xs, fontWeight: '600' }}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text
        style={{ color: Colors.text, fontSize: 22, fontFamily: 'Georgia', marginBottom: subtitle ? 6 : 0, lineHeight: 28 }}
        numberOfLines={2}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ color: Colors.muted, fontSize: FontSize.sm, lineHeight: 18 }} numberOfLines={2}>
          {subtitle}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

// ─── Card de métrica de apoio ───────────────────────────────────
// Cada card tem border-radius blob DIFERENTE — assimétrico, não círculo uniforme.
// Os valores abaixo cobrem 4 variações para stagger visual.
const METRIC_RADII: Array<[number, number, number, number]> = [
  [50, 34, 46, 58], // card 0 — pendulo esquerda-cima
  [38, 54, 40, 50], // card 1 — pendulo direita-baixo
  [46, 50, 56, 36], // card 2 — pendulo direita-cima
  [54, 40, 44, 62], // card 3 — pendulo esquerda-baixo
];

function MetricCard({
  icon,
  label,
  value,
  marginTop = 0,
  radiusIndex = 0,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  marginTop?: number;
  radiusIndex?: number;
  onPress?: () => void;
}) {
  const [tl, tr, br, bl] = METRIC_RADII[radiusIndex % METRIC_RADII.length];
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: Colors.bgCard,
        borderTopLeftRadius: tl,
        borderTopRightRadius: tr,
        borderBottomRightRadius: br,
        borderBottomLeftRadius: bl,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.md,
        alignItems: 'center',
        marginTop,
        minHeight: 88,
        justifyContent: 'center',
        gap: 6,
      }}
    >
      {icon}
      <Text style={{ color: Colors.muted, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.6, textAlign: 'center' }}>
        {label}
      </Text>
      <Text style={{ color: Colors.text, fontSize: FontSize.xl, fontWeight: '600', textAlign: 'center' }}>
        {value}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Tela ───────────────────────────────────────────────────────
export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { family, currentBaby, babies, setCurrentBaby } = useFamily();
  const profile = useAuthStore((s) => s.profile);
  const { members, load: loadMembers } = useFamilyMembers(family?.id);

  const [selectedModalItem, setSelectedModalItem] = useState<{
    id: string;
    type: 'baby' | 'child';
    name: string;
    birth_date?: string;
  } | null>(null);

  // Hooks de dados — todos com loading/error para controle de skeleton e stale badge
  const { events, loading: loadingAgenda, error: errorAgenda } = useAgenda(family?.id ?? '');
  const { tasks, loading: loadingTasks, error: errorTasks, loadTasks } = useTasks(family?.id ?? '');
  const { pendingItems, loading: loadingShopping, error: errorShopping, loadItems } = useShopping(family?.id ?? '');
  const { summary: mentalSummary, loading: loadingMental, error: errorMental } = useMentalLoad();
  const {
    todayCount,
    loading: loadingBaby,
    error: errorBaby,
    reload: reloadBabyRecords,
  } = useBabyRecords(currentBaby?.id);

  // Recarrega dados e membros da família sempre que a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      if (family?.id) {
        loadMembers();
        loadTasks();
        loadItems();
        reloadBabyRecords();
      }
    }, [family?.id, loadMembers, loadTasks, loadItems, reloadBabyRecords])
  );

  // Sincroniza o item selecionado no modal caso o nome ou data de nascimento dele mude no banco
  useEffect(() => {
    if (!selectedModalItem) return;
    if (selectedModalItem.type === 'baby') {
      const updatedBaby = babies.find((b) => b.id === selectedModalItem.id);
      if (updatedBaby && (updatedBaby.name !== selectedModalItem.name || updatedBaby.birth_date !== selectedModalItem.birth_date)) {
        setSelectedModalItem({
          id: updatedBaby.id,
          type: 'baby',
          name: updatedBaby.name,
          birth_date: updatedBaby.birth_date,
        });
      }
    } else {
      const updatedChild = members.find((m) => m.id === selectedModalItem.id);
      if (updatedChild && (updatedChild.name !== selectedModalItem.name || updatedChild.birth_date !== selectedModalItem.birth_date)) {
        setSelectedModalItem({
          id: updatedChild.id,
          type: 'child',
          name: updatedChild.name,
          birth_date: updatedChild.birth_date,
        });
      }
    }
  }, [babies, members, selectedModalItem]);

  // Carrega tasks e shopping no mount (não têm autoload)
  useEffect(() => {
    if (family?.id) {
      loadTasks();
      loadItems();
    }
  }, [family?.id, loadTasks, loadItems]);

  // Primeiro carregamento: todos ainda sem dados → mostra skeleton
  // Após o primeiro ciclo completo, erros posteriores mostram o badge stale.
  const isFirstLoad =
    loadingAgenda || loadingTasks || loadingShopping || loadingMental || loadingBaby;

  // Há dados em cache (pelo menos uma fonte retornou algo)
  const hasAnyData =
    events.length > 0 || tasks.length > 0 || pendingItems.length > 0 || mentalSummary !== null;

  // Stale: houve erro em alguma fonte mas já tínhamos dados antes
  const hasError = !!(errorAgenda || errorTasks || errorShopping || errorMental || errorBaby);
  const showStaleBadge = hasError && hasAnyData;

  const [refreshing, setRefreshing] = useState(false);
  const [babyInfoOpen, setBabyInfoOpen] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([loadTasks(), loadItems(), reloadBabyRecords()]).finally(() =>
      setRefreshing(false)
    );
  }, [loadTasks, loadItems, reloadBabyRecords]);

  // Dados derivados
  const nextEvent = events.find(
    (e) => new Date(e.start_at) >= new Date(new Date().setHours(0, 0, 0, 0))
  );
  const pendingCount = tasks.filter((t) => t.status !== 'done').length;

  // Equilíbrio de carga mental — só exibe se há exatamente 2 membros com dados reais
  const [memberA, memberB] = mentalSummary?.members ?? [];
  const hasPartner = !!(memberA && memberB);
  const pctA = hasPartner ? Math.round(memberA.percentage) : 0;
  const pctB = hasPartner ? Math.round(memberB.percentage) : 0;

  const highlightTitle    = nextEvent ? nextEvent.title : 'nada agendado — aproveite';
  const highlightSubtitle = nextEvent
    ? new Date(nextEvent.start_at).toLocaleDateString('pt-BR', {
        weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
      })
    : 'Use a agenda para organizar consultas, vacinas e encontros.';

  const tutorial = useTutorial('dashboard');

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <TutorialOverlay
        visible={tutorial.visible}
        screenKey="dashboard"
        onDismiss={tutorial.dismiss}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.lg,
          paddingBottom: insets.bottom + 90,
          paddingHorizontal: Spacing.lg,
        }}
      >
        {/* ── Header: raposa + wordmark + saudação ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: Spacing.xl }}>
          <FoxMark size={28} />
          <Text style={{ fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 19, color: Colors.tertiary }}>
            ninho
          </Text>
        </View>

        <Text style={{ fontFamily: 'Georgia', fontSize: 23, color: Colors.text, marginBottom: 3 }}>
          {greeting()}{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}
        </Text>
        <Text style={{ color: Colors.muted, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.lg }}>
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>

        {/* ── Avatares dos membros da família ── */}
        {members.filter((m) => m.role !== 'child').length > 0 && (
          <View style={{ flexDirection: 'row', gap: Spacing.lg, marginBottom: Spacing.xl }}>
            {members.filter((m) => m.role !== 'child').map((member) => {
              const isSelf = member.user_id === profile?.user_id;
              return (
                <TouchableOpacity
                  key={member.id}
                  onPress={isSelf && (currentBaby || members.some((m) => m.role === 'child')) ? () => {
                    if (currentBaby) {
                      setSelectedModalItem({
                        id: currentBaby.id,
                        type: 'baby',
                        name: currentBaby.name,
                        birth_date: currentBaby.birth_date,
                      });
                    } else {
                      const firstChild = members.find((m) => m.role === 'child');
                      if (firstChild) {
                        setSelectedModalItem({
                          id: firstChild.id,
                          type: 'child',
                          name: firstChild.name,
                          birth_date: firstChild.birth_date,
                        });
                      }
                    }
                    setBabyInfoOpen(true);
                  } : undefined}
                  activeOpacity={isSelf && (currentBaby || members.some((m) => m.role === 'child')) ? 0.75 : 1}
                  style={{ alignItems: 'center', gap: 6 }}
                >
                  <View style={{ position: 'relative' }}>
                    <Avatar
                      name={member.name}
                      size={48}
                      style={isSelf ? {
                        borderWidth: 2,
                        borderColor: Colors.primary,
                      } : undefined}
                    />
                    {isSelf && (currentBaby || members.some((m) => m.role === 'child')) && (
                      <View style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        backgroundColor: Colors.primary,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <IconBabyBottle size={10} color={Colors.onLight} />
                      </View>
                    )}
                  </View>
                  <Text style={{ color: Colors.muted, fontSize: FontSize.xs }} numberOfLines={1}>
                    {member.name.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Modal de informações do bebê/filhos ── */}
        {(currentBaby || members.some((m) => m.role === 'child')) && (
          <Modal
            visible={babyInfoOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setBabyInfoOpen(false)}
          >
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}
              activeOpacity={1}
              onPress={() => setBabyInfoOpen(false)}
            >
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => {}}
                style={{
                  backgroundColor: Colors.bgCard,
                  borderTopLeftRadius: Radius.xl,
                  borderTopRightRadius: Radius.xl,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  padding: Spacing.lg,
                }}
              >
                {/* Cabeçalho do modal */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg }}>
                  <Text style={{ color: Colors.muted, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    seus filhos
                  </Text>
                  <TouchableOpacity onPress={() => setBabyInfoOpen(false)}>
                    <IconX size={18} color={Colors.muted} />
                  </TouchableOpacity>
                </View>

                {/* Chips: bebês + filhos (kids) + adicionar */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.lg }}>
                  {/* Bebês */}
                  {babies.map((baby) => {
                    const isActive = selectedModalItem?.id === baby.id;
                    return (
                      <TouchableOpacity
                        key={baby.id}
                        onPress={() => {
                          setCurrentBaby(baby);
                          setSelectedModalItem({
                            id: baby.id,
                            type: 'baby',
                            name: baby.name,
                            birth_date: baby.birth_date,
                          });
                        }}
                        style={{ alignItems: 'center', gap: 6 }}
                      >
                        <View style={{
                          width: 52,
                          height: 52,
                          borderRadius: 26,
                          backgroundColor: isActive ? Colors.primary : Colors.bg,
                          borderWidth: isActive ? 0 : 1,
                          borderColor: Colors.border,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Text style={{ color: isActive ? Colors.onLight : Colors.text, fontSize: FontSize.md, fontWeight: '700' }}>
                            {baby.name.trim().split(' ').slice(0, 2).map((s: string) => s[0].toUpperCase()).join('')}
                          </Text>
                        </View>
                        <Text style={{ color: isActive ? Colors.text : Colors.muted, fontSize: FontSize.xs, fontWeight: isActive ? '600' : '400' }}>
                          {baby.name.split(' ')[0]}
                        </Text>
                        <View style={{ position: 'absolute', bottom: 22, right: -2 }}>
                          <IconBabyBottle size={12} color={isActive ? Colors.primary : Colors.muted} />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                  {/* Filhos (kids — role=child) */}
                  {members.filter((m) => m.role === 'child').map((kid) => {
                    const isKidActive = selectedModalItem?.id === kid.id;
                    return (
                      <TouchableOpacity
                        key={kid.id}
                        onPress={() => {
                          setSelectedModalItem({
                            id: kid.id,
                            type: 'child',
                            name: kid.name,
                            birth_date: kid.birth_date,
                          });
                        }}
                        style={{ alignItems: 'center', gap: 6 }}
                      >
                        <View style={{
                          width: 52,
                          height: 52,
                          borderRadius: 26,
                          backgroundColor: isKidActive ? Colors.primary : Colors.bg,
                          borderWidth: isKidActive ? 0 : 1,
                          borderColor: Colors.border,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Text style={{ color: isKidActive ? Colors.onLight : Colors.text, fontSize: FontSize.md, fontWeight: '700' }}>
                            {kid.name.trim().split(' ').slice(0, 2).map((s) => s[0].toUpperCase()).join('')}
                          </Text>
                        </View>
                        <Text style={{ color: isKidActive ? Colors.text : Colors.muted, fontSize: FontSize.xs, fontWeight: isKidActive ? '600' : '400' }}>
                          {kid.name.split(' ')[0]}
                        </Text>
                        <View style={{ position: 'absolute', bottom: 22, right: -2 }}>
                          <IconStar size={12} color={isKidActive ? Colors.primary : Colors.secondary} />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                  {/* Botão adicionar */}
                  <TouchableOpacity
                    onPress={() => { setBabyInfoOpen(false); router.push('/(app)/(baby)' as never); }}
                    style={{ alignItems: 'center', gap: 6 }}
                  >
                    <View style={{
                      width: 52,
                      height: 52,
                      borderRadius: 26,
                      backgroundColor: Colors.bg,
                      borderWidth: 1,
                      borderColor: Colors.border,
                      borderStyle: 'dashed',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <IconPlus size={18} color={Colors.muted} />
                    </View>
                    <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>adicionar</Text>
                  </TouchableOpacity>
                </View>

                {/* Resumo do filho selecionado no modal */}
                {selectedModalItem && (
                  <View style={{
                    backgroundColor: Colors.bg,
                    borderRadius: Radius.md,
                    padding: Spacing.md,
                    marginBottom: Spacing.md,
                  }}>
                    <Text style={{ color: Colors.muted, fontSize: FontSize.xs, marginBottom: 4 }}>mostrando</Text>
                    <Text style={{ color: Colors.text, fontSize: FontSize.md, fontWeight: '500' }}>
                      {selectedModalItem.name}
                      {' · '}
                      {selectedModalItem.type === 'baby' ? 'módulo bebê' : 'módulo filho'}
                      {selectedModalItem.birth_date ? (
                        <>
                          {' · '}
                          {Math.floor((Date.now() - new Date(selectedModalItem.birth_date).getTime()) / (7 * 24 * 60 * 60 * 1000))} sem.
                        </>
                      ) : null}
                    </Text>
                  </View>
                )}

                {/* Botão de editar — ação secundária separada baseada no selecionado */}
                {selectedModalItem && (
                  <TouchableOpacity
                    onPress={() => {
                      setBabyInfoOpen(false);
                      if (selectedModalItem.type === 'baby') {
                        router.push('/(app)/(baby)/edit-baby' as never);
                      } else {
                        router.push({
                          pathname: '/(app)/(baby)/edit-baby',
                          params: {
                            type: 'child',
                            id: selectedModalItem.id,
                            name: selectedModalItem.name,
                            birth_date: selectedModalItem.birth_date ?? '',
                          },
                        } as never);
                      }
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      paddingVertical: Spacing.sm,
                    }}
                  >
                    <IconEdit size={14} color={Colors.muted} />
                    <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>editar informações</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        )}

        {/* ── Badge stale — dados podem estar desatualizados ── */}
        {showStaleBadge && <StaleBadge />}

        {/* ── Skeleton no primeiro carregamento ── */}
        {isFirstLoad && !hasAnyData ? (
          <>
            <SkeletonHighlight />
            <SkeletonMetrics />
          </>
        ) : (
          <>
            {/* ── Card de destaque (blob) ── */}
            <HighlightCard
              eyebrow="próximo momento"
              title={highlightTitle}
              subtitle={highlightSubtitle}
              badge={nextEvent ? 'hoje' : undefined}
              onPress={() =>
                nextEvent
                  ? router.push(`/(app)/(agenda)?eventId=${nextEvent.id}` as never)
                  : router.push('/(app)/(agenda)' as never)
              }
            />

            {/* ── Métricas escalonadas — stagger de margin-top + blob assimétrico por índice ── */}
            <View style={{ flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg }}>
              {/* card 0 — bebê hoje: ícone destaque (primary laranja) */}
              <MetricCard
                icon={<IconBabyBottle size={18} color={Colors.primary} />}
                label="bebê hoje"
                value={String(todayCount)}
                marginTop={0}
                radiusIndex={0}
                onPress={() => router.push('/(app)/(baby)' as never)}
              />
              {/* card 1 — agenda: secundário (dourado) */}
              <MetricCard
                icon={<IconCalendar size={18} color={Colors.secondary} />}
                label="agenda"
                value={nextEvent ? '1' : '0'}
                marginTop={16}
                radiusIndex={1}
                onPress={() => router.push('/(app)/(agenda)' as never)}
              />
              {/* card 2 — tarefas: secundário (dourado) */}
              <MetricCard
                icon={<IconChecklist size={18} color={Colors.secondary} />}
                label="tarefas"
                value={String(pendingCount)}
                marginTop={6}
                radiusIndex={2}
                onPress={() => router.push('/(app)/(tasks)' as never)}
              />
              {hasPartner && (
                <MetricCard
                  icon={
                    <IconHeart
                      size={18}
                      color={Math.abs(pctA - pctB) > 30 ? Colors.primary : Colors.secondary}
                    />
                  }
                  label="equilíbrio"
                  value={`${pctA}/${pctB}`}
                  marginTop={0}
                  radiusIndex={3}
                  onPress={() => router.push('/(app)/(mental-load)' as never)}
                />
              )}
            </View>
          </>
        )}

        {/* ── Compras — sempre visível ── */}
        <TouchableOpacity
          onPress={() => router.push('/(app)/(shopping)' as never)}
          activeOpacity={0.82}
          style={{
            backgroundColor: Colors.bgCard,
            borderRadius: Radius.lg,
            borderWidth: 1,
            borderColor: Colors.border,
            padding: Spacing.lg,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: Spacing.md,
          }}
        >
          <View>
            <Text style={{ color: Colors.muted, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.7 }}>compras</Text>
            {loadingShopping && !hasAnyData ? (
              <SkeletonRect width={80} height={14} borderRadius={5} delay={0} style={{ marginTop: 6 }} />
            ) : (
              <Text style={{ color: Colors.text, fontSize: FontSize.xl, fontWeight: '600', marginTop: 4 }}>
                {pendingItems.length > 0
                  ? `${pendingItems.length} pendente${pendingItems.length === 1 ? '' : 's'}`
                  : 'lista em ordem'}
              </Text>
            )}
          </View>
          <Text style={{ color: Colors.primary, fontSize: 20 }}>›</Text>
        </TouchableOpacity>

        {/* ── FAB blob — registrar agora ── */}
        <View style={{ alignItems: 'flex-end', marginTop: Spacing.md }}>
          <TouchableOpacity
            onPress={() => router.push('/(app)/(baby)' as never)}
            activeOpacity={0.82}
            accessibilityRole="button"
            accessibilityLabel="Registrar novo evento do bebê"
            style={{
              width: 52,
              height: 52,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 28,
              borderBottomRightRadius: 30,
              borderBottomLeftRadius: 22,
              backgroundColor: Colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconPlus size={22} color={Colors.onLight} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
