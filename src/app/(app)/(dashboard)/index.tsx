// src/app/(app)/(dashboard)/index.tsx
// Dashboard v3 — design moderno, responsivo (web/mobile)

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import Svg, { Polygon, Path, Ellipse } from 'react-native-svg';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  IconBabyBottle,
  IconHeart,
  IconCheckbox,
  IconCalendarEvent,
  IconPlus,
  IconAlertCircle,
  IconX,
  IconEdit,
  IconStar,
  IconShoppingCart,
  IconArrowRight,
} from '@tabler/icons-react-native';
import { useFamily, useAgenda, useTasks, useShopping, useMentalLoad, useBabyRecords } from '@/hooks';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { useAuthStore } from '@/stores/auth.store';
import { Colors, Radius, Spacing, FontSize } from '@/constants/theme';
import { Avatar } from '@/components/ui/Avatar';
import { TutorialOverlay } from '@/components/ui/TutorialOverlay';
import { useTutorial } from '@/hooks/useTutorial';
import { useBreakpoint } from '@/hooks/useBreakpoint';

// ─── Utilitários ────────────────────────────────────────────────
function formatRelative(iso: string | undefined): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1)   return 'agora';
  if (mins < 60)  return `${mins}min atrás`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24)   return `${hrs}h atrás`;
  return `${Math.round(hrs / 24)}d atrás`;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

// ─── Skeleton ───────────────────────────────────────────────────
function SkeletonRect({ width, height, borderRadius = 8, style }: {
  width: number | string; height: number; borderRadius?: number; style?: any;
}) {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.8, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  return (
    <Animated.View style={[
      { width: width as any, height, borderRadius, backgroundColor: Colors.border, opacity: anim },
      style,
    ]} />
  );
}

// ─── FadeSlide — entrada suave com stagger ───────────────────────
/**
 * Envolve um bloco com animação fade + slide-up ao montar.
 * `index` define o delay: cada unidade adiciona 40ms.
 */
function FadeSlide({ children, index = 0 }: { children: React.ReactNode; index?: number }) {
  const opacity   = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    const delay = index * 40;
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 260, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 260, delay, useNativeDriver: true }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

// ─── Stat card ──────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  accent,
  onPress,
}: {
  icon:    React.ReactNode;
  label:   string;
  value:   string;
  accent?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      style={{
        flex:            1,
        backgroundColor: Colors.bgCard,
        borderRadius:    Radius.lg,
        borderWidth:     1,
        borderColor:     Colors.border,
        padding:         16,
        minWidth:        0,
      }}
    >
      <View style={{
        width:           32,
        height:          32,
        borderRadius:    8,
        backgroundColor: accent ? accent + '18' : Colors.bgPage,
        alignItems:      'center',
        justifyContent:  'center',
        marginBottom:    12,
      }}>
        {icon}
      </View>
      <Text style={{
        color:      Colors.muted,
        fontSize:   FontSize.xs,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
        marginBottom: 4,
      }} numberOfLines={1}>
        {label}
      </Text>
      <Text style={{
        color:         accent ?? Colors.text,
        fontSize:      FontSize.xxl,
        fontWeight:    '700',
        letterSpacing: -0.5,
      }}>
        {value}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Quick action ────────────────────────────────────────────────
function QuickAction({ icon, label, onPress }: {
  icon: React.ReactNode; label: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        flex:           1,
        alignItems:     'center',
        gap:            8,
        paddingVertical: 14,
        backgroundColor: Colors.bgCard,
        borderRadius:    Radius.lg,
        borderWidth:     1,
        borderColor:     Colors.border,
      }}
    >
      {icon}
      <Text style={{
        color:      Colors.muted,
        fontSize:   FontSize.xs,
        fontWeight: '500',
        textAlign:  'center',
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Badge de dado stale ─────────────────────────────────────────
function StaleBadge() {
  return (
    <View style={{
      flexDirection:  'row',
      alignItems:     'center',
      gap:            6,
      backgroundColor: Colors.amberBg,
      borderWidth:    1,
      borderColor:    Colors.amber + '40',
      borderRadius:   Radius.sm,
      padding:        8,
      marginBottom:   Spacing.md,
    }}>
      <IconAlertCircle size={14} color={Colors.amber} />
      <Text style={{ color: Colors.amber, fontSize: FontSize.xs }}>
        Alguns dados podem estar desatualizados
      </Text>
    </View>
  );
}

// ─── Dashboard ──────────────────────────────────────────────────
export default function DashboardScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { isDesktop } = useBreakpoint();

  const { family, currentBaby, babies, setCurrentBaby } = useFamily();
  const profile  = useAuthStore((s) => s.profile);
  const { members, load: loadMembers } = useFamilyMembers(family?.id);

  const [selectedModalItem, setSelectedModalItem] = useState<{
    id: string;
    type: 'baby' | 'child';
    name: string;
    birth_date?: string;
  } | null>(null);

  const { events,       loading: loadingAgenda,   error: errorAgenda   } = useAgenda(family?.id ?? '');
  const { tasks,        loading: loadingTasks,    error: errorTasks,    loadTasks   } = useTasks(family?.id ?? '');
  const { pendingItems, loading: loadingShopping, error: errorShopping, loadItems  } = useShopping(family?.id ?? '');
  const { summary: mentalSummary, loading: loadingMental, error: errorMental } = useMentalLoad();
  const { todayCount, loading: loadingBaby, error: errorBaby, reload: reloadBabyRecords } =
    useBabyRecords(currentBaby?.id);

  useFocusEffect(useCallback(() => {
    if (family?.id) {
      loadMembers();
      loadTasks();
      loadItems();
      reloadBabyRecords();
    }
  }, [family?.id, loadMembers, loadTasks, loadItems, reloadBabyRecords]));

  useEffect(() => {
    if (!selectedModalItem) return;
    if (selectedModalItem.type === 'baby') {
      const b = babies.find((b) => b.id === selectedModalItem.id);
      if (b && (b.name !== selectedModalItem.name || b.birth_date !== selectedModalItem.birth_date)) {
        setSelectedModalItem({ id: b.id, type: 'baby', name: b.name, birth_date: b.birth_date });
      }
    } else {
      const m = members.find((m) => m.id === selectedModalItem.id);
      if (m && (m.name !== selectedModalItem.name || m.birth_date !== selectedModalItem.birth_date)) {
        setSelectedModalItem({ id: m.id, type: 'child', name: m.name, birth_date: m.birth_date });
      }
    }
  }, [babies, members, selectedModalItem]);

  useEffect(() => {
    if (family?.id) { loadTasks(); loadItems(); }
  }, [family?.id, loadTasks, loadItems]);

  const isFirstLoad   = loadingAgenda || loadingTasks || loadingShopping || loadingMental || loadingBaby;
  const hasAnyData    = events.length > 0 || tasks.length > 0 || pendingItems.length > 0 || mentalSummary !== null;
  const hasError      = !!(errorAgenda || errorTasks || errorShopping || errorMental || errorBaby);
  const showStaleBadge = hasError && hasAnyData;

  const [refreshing,   setRefreshing]   = useState(false);
  const [babyInfoOpen, setBabyInfoOpen] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([loadTasks(), loadItems(), reloadBabyRecords()]).finally(() => setRefreshing(false));
  }, [loadTasks, loadItems, reloadBabyRecords]);

  const nextEvent    = events.find((e) => new Date(e.start_at) >= new Date(new Date().setHours(0, 0, 0, 0)));
  const pendingCount = tasks.filter((t) => t.status !== 'done').length;

  const [memberA, memberB] = mentalSummary?.members ?? [];
  const hasPartner = !!(memberA && memberB);
  const pctA       = hasPartner ? Math.round(memberA.percentage) : 0;
  const pctB       = hasPartner ? Math.round(memberB.percentage) : 0;

  const tutorial = useTutorial('dashboard');

  const topPadding = Platform.OS === 'web' ? 24 : insets.top + Spacing.lg;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgPage }}>
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
          paddingTop:    topPadding,
          paddingBottom: insets.bottom + 90,
          paddingHorizontal: isDesktop ? 32 : Spacing.lg,
          maxWidth:      isDesktop ? 800 : undefined,
          alignSelf:     isDesktop ? 'center' : undefined,
          width:         isDesktop ? '100%' : undefined,
        }}
      >
        {/* ── Header ── */}
        <View style={{
          flexDirection:  'row',
          alignItems:     'center',
          justifyContent: 'space-between',
          marginBottom:   Spacing['2xl'],
        }}>
          <View>
            <Text style={{
              color:         Colors.text,
              fontSize:      FontSize.xxl,
              fontWeight:    '700',
              letterSpacing: -0.5,
            }}>
              {greeting()}{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}
            </Text>
            <Text style={{
              color:         Colors.muted,
              fontSize:      FontSize.sm,
              marginTop:     3,
              textTransform: 'capitalize',
            }}>
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>

          {/* Avatares da família */}
          <View style={{ flexDirection: 'row', gap: -8 }}>
            {members.filter((m) => m.role !== 'child').slice(0, 3).map((member, i) => (
              <View key={member.id} style={{ zIndex: 10 - i }}>
                <Avatar
                  name={member.name}
                  size={36}
                  style={{
                    borderWidth: 2,
                    borderColor: Colors.bgPage,
                  }}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Stale badge */}
        {showStaleBadge && <StaleBadge />}

        {/* ── Próximo evento — card principal ── */}
        {isFirstLoad && !hasAnyData ? (
          <View style={{ gap: 8, marginBottom: Spacing.lg }}>
            <SkeletonRect width="100%" height={90} borderRadius={14} />
          </View>
        ) : (
          <FadeSlide index={0}>
          <TouchableOpacity
            onPress={() => nextEvent
              ? router.push(`/(app)/(agenda)?eventId=${nextEvent.id}` as never)
              : router.push('/(app)/(agenda)' as never)
            }
            activeOpacity={0.78}
            style={{
              backgroundColor: Colors.primaryBg,
              borderRadius:    Radius.lg,
              borderWidth:     1,
              borderColor:     Colors.primary + '30',
              padding:         20,
              marginBottom:    Spacing.lg,
              flexDirection:   'row',
              alignItems:      'center',
              justifyContent:  'space-between',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{
                color:         Colors.primary,
                fontSize:      FontSize.xs,
                fontWeight:    '600',
                letterSpacing: 0.6,
                textTransform: 'uppercase',
                marginBottom:  6,
              }}>
                {nextEvent ? 'Próximo evento' : 'Sem eventos'}
              </Text>
              <Text style={{
                color:      Colors.text,
                fontSize:   FontSize.lg,
                fontWeight: '600',
              }} numberOfLines={1}>
                {nextEvent ? nextEvent.title : 'Nenhum agendamento'}
              </Text>
              {nextEvent ? (
                <Text style={{
                  color:     Colors.muted,
                  fontSize:  FontSize.sm,
                  marginTop: 3,
                }}>
                  {new Date(nextEvent.start_at).toLocaleDateString('pt-BR', {
                    weekday: 'short', day: '2-digit', month: 'short',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
              ) : (
                <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginTop: 3 }}>
                  Use a agenda para organizar consultas e eventos
                </Text>
              )}
            </View>
            <IconArrowRight size={18} color={Colors.primary} style={{ marginLeft: 12 }} />
          </TouchableOpacity>
          </FadeSlide>
        )}

        {/* ── Stats ── */}
        {isFirstLoad && !hasAnyData ? (
          <View style={{ flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg }}>
            {[0, 1, 2].map((i) => <SkeletonRect key={i} width="33%" height={100} borderRadius={14} />)}
          </View>
        ) : (
          <FadeSlide index={1}>
          <View style={{ flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg }}>
            {babies.length > 0 && (
              <StatCard
                icon={<IconBabyBottle size={16} color={Colors.coral} />}
                label="bebê hoje"
                value={String(todayCount)}
                accent={Colors.coral}
                onPress={() => router.push('/(app)/(baby)' as never)}
              />
            )}
            <StatCard
              icon={<IconCheckbox size={16} color={Colors.primary} />}
              label="tarefas"
              value={String(pendingCount)}
              accent={pendingCount > 0 ? Colors.primary : Colors.success}
              onPress={() => router.push('/(app)/(tasks)' as never)}
            />
            {hasPartner ? (
              <StatCard
                icon={<IconHeart size={16} color={Colors.secondary} />}
                label="equilíbrio"
                value={`${pctA}/${pctB}`}
                accent={Math.abs(pctA - pctB) > 30 ? Colors.amber : Colors.success}
                onPress={() => router.push('/(app)/(mental-load)' as never)}
              />
            ) : (
              <StatCard
                icon={<IconShoppingCart size={16} color={Colors.secondary} />}
                label="compras"
                value={String(pendingItems.length)}
                accent={Colors.secondary}
                onPress={() => router.push('/(app)/(shopping)' as never)}
              />
            )}
          </View>
          </FadeSlide>
        )}

        {/* ── Seção tarefas rápidas ── */}
        {tasks.filter((t) => t.status === 'pending').length > 0 && (
          <FadeSlide index={2}>
          <View style={{
            backgroundColor: Colors.bgCard,
            borderRadius:    Radius.lg,
            borderWidth:     1,
            borderColor:     Colors.border,
            marginBottom:    Spacing.lg,
            overflow:        'hidden',
          }}>
            <View style={{
              flexDirection:  'row',
              alignItems:     'center',
              justifyContent: 'space-between',
              paddingHorizontal: Spacing.lg,
              paddingVertical:   14,
              borderBottomWidth: 1,
              borderBottomColor: Colors.border,
            }}>
              <Text style={{
                color:      Colors.text,
                fontSize:   FontSize.md,
                fontWeight: '600',
              }}>
                Tarefas pendentes
              </Text>
              <TouchableOpacity onPress={() => router.push('/(app)/(tasks)' as never)}>
                <Text style={{ color: Colors.primary, fontSize: FontSize.sm }}>
                  Ver todas
                </Text>
              </TouchableOpacity>
            </View>
            {tasks.filter((t) => t.status === 'pending').slice(0, 3).map((task, i, arr) => (
              <TouchableOpacity
                key={task.id}
                onPress={() => router.push('/(app)/(tasks)' as never)}
                activeOpacity={0.7}
                style={{
                  flexDirection:     'row',
                  alignItems:        'center',
                  gap:               12,
                  paddingHorizontal: Spacing.lg,
                  paddingVertical:   12,
                  borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                  borderBottomColor: Colors.border,
                }}
              >
                <View style={{
                  width:       18,
                  height:      18,
                  borderRadius: 4,
                  borderWidth: 1.5,
                  borderColor: Colors.borderMid,
                }} />
                <Text style={{
                  color:    Colors.text,
                  fontSize: FontSize.md,
                  flex:     1,
                }} numberOfLines={1}>
                  {task.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          </FadeSlide>
        )}

        {/* ── Lista de compras ── */}
        <FadeSlide index={3}>
        <TouchableOpacity
          onPress={() => router.push('/(app)/(shopping)' as never)}
          activeOpacity={0.78}
          style={{
            backgroundColor: Colors.bgCard,
            borderRadius:    Radius.lg,
            borderWidth:     1,
            borderColor:     Colors.border,
            padding:         Spacing.lg,
            flexDirection:   'row',
            alignItems:      'center',
            justifyContent:  'space-between',
            marginBottom:    Spacing.lg,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{
              width:           36,
              height:          36,
              borderRadius:    8,
              backgroundColor: Colors.bgPage,
              alignItems:      'center',
              justifyContent:  'center',
            }}>
              <IconShoppingCart size={18} color={Colors.secondary} />
            </View>
            <View>
              <Text style={{ color: Colors.text, fontSize: FontSize.md, fontWeight: '500' }}>
                Lista de compras
              </Text>
              <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginTop: 2 }}>
                {isFirstLoad && !hasAnyData
                  ? '…'
                  : pendingItems.length > 0
                  ? `${pendingItems.length} item${pendingItems.length === 1 ? '' : 's'} pendente${pendingItems.length === 1 ? '' : 's'}`
                  : 'Lista em ordem'
                }
              </Text>
            </View>
          </View>
          <IconArrowRight size={16} color={Colors.muted} />
        </TouchableOpacity>
        </FadeSlide>

        {/* ── Ações rápidas ── */}
        <FadeSlide index={4}>
        <Text style={{
          color:         Colors.muted,
          fontSize:      FontSize.xs,
          fontWeight:    '600',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          marginBottom:  10,
        }}>
          Ações rápidas
        </Text>
        <View style={{ flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg }}>
          {babies.length > 0 && (
            <QuickAction
              icon={<IconBabyBottle size={20} color={Colors.coral} />}
              label="Registrar bebê"
              onPress={() => router.push('/(app)/(baby)' as never)}
            />
          )}
          <QuickAction
            icon={<IconCalendarEvent size={20} color={Colors.primary} />}
            label="Novo evento"
            onPress={() => router.push('/(app)/(agenda)/new-event' as never)}
          />
          <QuickAction
            icon={<IconPlus size={20} color={Colors.success} />}
            label="Nova tarefa"
            onPress={() => router.push('/(app)/(tasks)/new-task' as never)}
          />
        </View>
        </FadeSlide>

        {/* ── Modal bebês/filhos ── */}
        {(currentBaby || members.some((m) => m.role === 'child')) && (
          <Modal
            visible={babyInfoOpen}
            transparent
            animationType="slide"
            onRequestClose={() => setBabyInfoOpen(false)}
          >
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}
              activeOpacity={1}
              onPress={() => setBabyInfoOpen(false)}
            >
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => {}}
                style={{
                  backgroundColor:      Colors.bgCard,
                  borderTopLeftRadius:  Radius.xl,
                  borderTopRightRadius: Radius.xl,
                  borderWidth:          1,
                  borderColor:          Colors.border,
                  padding:              Spacing.lg,
                }}
              >
                {/* Header modal */}
                <View style={{
                  flexDirection:  'row',
                  alignItems:     'center',
                  justifyContent: 'space-between',
                  marginBottom:   Spacing.lg,
                }}>
                  <Text style={{
                    color:         Colors.muted,
                    fontSize:      FontSize.xs,
                    fontWeight:    '600',
                    textTransform: 'uppercase',
                    letterSpacing: 0.6,
                  }}>
                    Seus filhos
                  </Text>
                  <TouchableOpacity onPress={() => setBabyInfoOpen(false)}>
                    <IconX size={18} color={Colors.muted} />
                  </TouchableOpacity>
                </View>

                {/* Chips */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.lg }}>
                  {babies.map((baby) => {
                    const isActive = selectedModalItem?.id === baby.id;
                    return (
                      <TouchableOpacity
                        key={baby.id}
                        onPress={() => {
                          setCurrentBaby(baby);
                          setSelectedModalItem({ id: baby.id, type: 'baby', name: baby.name, birth_date: baby.birth_date });
                        }}
                        style={{ alignItems: 'center', gap: 6 }}
                      >
                        <View style={{
                          width:           52,
                          height:          52,
                          borderRadius:    26,
                          backgroundColor: isActive ? Colors.primary : Colors.bgPage,
                          borderWidth:     isActive ? 0 : 1,
                          borderColor:     Colors.border,
                          alignItems:      'center',
                          justifyContent:  'center',
                        }}>
                          <Text style={{ color: isActive ? '#fff' : Colors.text, fontSize: FontSize.md, fontWeight: '700' }}>
                            {baby.name.trim().split(' ').slice(0, 2).map((s: string) => s[0].toUpperCase()).join('')}
                          </Text>
                        </View>
                        <Text style={{ color: isActive ? Colors.text : Colors.muted, fontSize: FontSize.xs, fontWeight: isActive ? '600' : '400' }}>
                          {baby.name.split(' ')[0]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  {members.filter((m) => m.role === 'child').map((kid) => {
                    const isKidActive = selectedModalItem?.id === kid.id;
                    return (
                      <TouchableOpacity
                        key={kid.id}
                        onPress={() => setSelectedModalItem({ id: kid.id, type: 'child', name: kid.name, birth_date: kid.birth_date })}
                        style={{ alignItems: 'center', gap: 6 }}
                      >
                        <View style={{
                          width:           52,
                          height:          52,
                          borderRadius:    26,
                          backgroundColor: isKidActive ? Colors.primary : Colors.bgPage,
                          borderWidth:     isKidActive ? 0 : 1,
                          borderColor:     Colors.border,
                          alignItems:      'center',
                          justifyContent:  'center',
                        }}>
                          <Text style={{ color: isKidActive ? '#fff' : Colors.text, fontSize: FontSize.md, fontWeight: '700' }}>
                            {kid.name.trim().split(' ').slice(0, 2).map((s) => s[0].toUpperCase()).join('')}
                          </Text>
                        </View>
                        <Text style={{ color: isKidActive ? Colors.text : Colors.muted, fontSize: FontSize.xs }}>
                          {kid.name.split(' ')[0]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    onPress={() => { setBabyInfoOpen(false); router.push('/(app)/(baby)' as never); }}
                    style={{ alignItems: 'center', gap: 6 }}
                  >
                    <View style={{
                      width:       52,
                      height:      52,
                      borderRadius: 26,
                      backgroundColor: Colors.bgPage,
                      borderWidth: 1,
                      borderColor: Colors.border,
                      borderStyle: 'dashed',
                      alignItems:  'center',
                      justifyContent: 'center',
                    }}>
                      <IconPlus size={18} color={Colors.muted} />
                    </View>
                    <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>adicionar</Text>
                  </TouchableOpacity>
                </View>

                {selectedModalItem && (
                  <View style={{
                    backgroundColor: Colors.bgPage,
                    borderRadius:    Radius.md,
                    padding:         Spacing.md,
                    marginBottom:    Spacing.md,
                  }}>
                    <Text style={{ color: Colors.muted, fontSize: FontSize.xs, marginBottom: 4 }}>mostrando</Text>
                    <Text style={{ color: Colors.text, fontSize: FontSize.md, fontWeight: '500' }}>
                      {selectedModalItem.name}
                      {' · '}
                      {selectedModalItem.type === 'baby' ? 'módulo bebê' : 'módulo filho'}
                      {selectedModalItem.birth_date ? (
                        ` · ${Math.floor((Date.now() - new Date(selectedModalItem.birth_date).getTime()) / (7 * 24 * 60 * 60 * 1000))} sem.`
                      ) : null}
                    </Text>
                  </View>
                )}

                {selectedModalItem && (
                  <TouchableOpacity
                    onPress={() => {
                      setBabyInfoOpen(false);
                      if (selectedModalItem.type === 'baby') {
                        router.push('/(app)/(baby)/edit-baby' as never);
                      } else {
                        router.push({
                          pathname: '/(app)/(baby)/edit-baby',
                          params: { type: 'child', id: selectedModalItem.id, name: selectedModalItem.name, birth_date: selectedModalItem.birth_date ?? '' },
                        } as never);
                      }
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.sm }}
                  >
                    <IconEdit size={14} color={Colors.muted} />
                    <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>editar informações</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        )}
      </ScrollView>
    </View>
  );
}
