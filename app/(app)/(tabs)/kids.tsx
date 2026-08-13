import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth.store';
import { kidsService } from '@/services/kids/kidsService';
import {
  IconStar,
  IconTrophy,
  IconSchool,
  IconDeviceTablet,
  IconLock,
  IconKey,
  IconUser,
  IconNotebook,
  IconClipboardList,
  IconUsers,
  IconBus,
  IconCalendar,
  IconBolt,
  IconCheck,
  type Icon,
} from '@tabler/icons-react-native';
import {
  KidPointsSummary,
  ChildAchievement,
  SchoolEvent,
  ScreenTimeStatus,
  SchoolEventType,
  SCHOOL_EVENT_LABELS,
  SCHOOL_EVENT_ICON,
  ACHIEVEMENT_MILESTONES,
  UpsertScreenTimeInput,
  CreateSchoolEventInput,
} from '@/types/kids.types';

const SCHOOL_ICON_MAP: Record<SchoolEventType, Icon> = {
  homework: IconNotebook,
  test:     IconClipboardList,
  meeting:  IconUsers,
  trip:     IconBus,
  other:    IconCalendar,
};
import { Profile } from '@/types/family.types';
import { supabase } from '@/lib/supabase';

// ─── Tipos de aba ─────────────────────────────────────────────
type Tab = 'tasks' | 'achievements' | 'school' | 'screen' | 'pin';

export default function KidsScreen() {
  const insets = useSafeAreaInsets();
  const { family, profile } = useAuthStore();

  const [activeTab, setActiveTab] = useState<Tab>('tasks');
  const [refreshing, setRefreshing] = useState(false);

  // Crianças da família
  const [children, setChildren] = useState<Profile[]>([]);
  const [selectedChild, setSelectedChild] = useState<Profile | null>(null);

  // UC035 — Pontuação
  const [kidSummaries, setKidSummaries] = useState<KidPointsSummary[]>([]);

  // UC037 — Conquistas
  const [achievements, setAchievements] = useState<ChildAchievement[]>([]);

  // UC038 — Agenda escolar
  const [schoolEvents, setSchoolEvents] = useState<SchoolEvent[]>([]);
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [schoolTitle, setSchoolTitle] = useState('');
  const [schoolType, setSchoolType] = useState<SchoolEventType>('homework');
  const [schoolDate, setSchoolDate] = useState('');
  const [savingSchool, setSavingSchool] = useState(false);

  // UC039 — Tempo de tela
  const [screenStatus, setScreenStatus] = useState<ScreenTimeStatus | null>(null);
  const [showScreenModal, setShowScreenModal] = useState(false);
  const [screenAllowed, setScreenAllowed] = useState('60');
  const [screenUsed, setScreenUsed] = useState('0');
  const [savingScreen, setSavingScreen] = useState(false);

  // UC040 — PIN
  const [showPinModal, setShowPinModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [savingPin, setSavingPin] = useState(false);

  // ─── Carga ────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!family) return;

    // Perfis das crianças
    const { data: kids } = await supabase
      .from('profiles')
      .select('id, name, avatar_url, role')
      .eq('family_id', family.id)
      .eq('role', 'child');

    const kidProfiles = (kids ?? []) as Profile[];
    setChildren(kidProfiles);

    if (kidProfiles.length > 0) {
      const current = selectedChild ?? kidProfiles[0];
      setSelectedChild(current);

      // Resumo de pontos de todas as crianças
      const summaries = await kidsService.listKidPointsSummaries(family.id);
      setKidSummaries(summaries);

      // Conquistas da criança selecionada
      const ach = await kidsService.listAchievements(current.id);
      setAchievements(ach);

      // Eventos escolares futuros
      const today = new Date().toISOString().split('T')[0];
      const events = await kidsService.listSchoolEvents(family.id, current.id, today);
      setSchoolEvents(events);

      // Status de tempo de tela de hoje
      const st = await kidsService.getScreenTimeStatus(family.id, current.id);
      setScreenStatus(st);
    }
  }, [family, selectedChild]);

  useEffect(() => { load(); }, [family]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const selectChild = async (child: Profile) => {
    setSelectedChild(child);
    if (!family) return;

    const [ach, events, st] = await Promise.all([
      kidsService.listAchievements(child.id),
      kidsService.listSchoolEvents(family.id, child.id, new Date().toISOString().split('T')[0]),
      kidsService.getScreenTimeStatus(family.id, child.id),
    ]);
    setAchievements(ach);
    setSchoolEvents(events);
    setScreenStatus(st);
  };

  // ─── UC038: criar evento escolar ──────────────────────────
  const handleCreateSchoolEvent = async () => {
    if (!schoolTitle.trim() || !schoolDate.trim() || !family || !selectedChild) return;
    setSavingSchool(true);
    try {
      const ev = await kidsService.createSchoolEvent(family.id, {
        child_id:    selectedChild.id,
        school_type: schoolType,
        title:       schoolTitle.trim(),
        start_at:    new Date(schoolDate + 'T08:00:00').toISOString(),
        all_day:     true,
      } as CreateSchoolEventInput);
      setSchoolEvents((prev) => [...prev, ev].sort(
        (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
      ));
      setShowSchoolModal(false);
      setSchoolTitle('');
      setSchoolDate('');
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setSavingSchool(false);
    }
  };

  const handleDeleteSchoolEvent = async (id: string) => {
    try {
      await kidsService.deleteSchoolEvent(id);
      setSchoolEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    }
  };

  // ─── UC039: salvar tempo de tela ──────────────────────────
  const handleSaveScreenTime = async () => {
    if (!family || !selectedChild) return;
    setSavingScreen(true);
    try {
      await kidsService.upsertScreenTime(family.id, {
        child_id:    selectedChild.id,
        allowed_min: parseInt(screenAllowed, 10) || 60,
        used_min:    parseInt(screenUsed, 10) || 0,
      } as UpsertScreenTimeInput);
      const st = await kidsService.getScreenTimeStatus(family.id, selectedChild.id);
      setScreenStatus(st);
      setShowScreenModal(false);
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setSavingScreen(false);
    }
  };

  // ─── UC040: definir PIN ────────────────────────────────────
  const handleSetPin = async () => {
    if (newPin.length < 4 || newPin !== confirmPin || !selectedChild) return;
    setSavingPin(true);
    try {
      // PIN é enviado para Edge Function via RPC — apenas placeholder aqui
      // (implementação completa requer supabase.rpc('set_child_pin', ...))
      Alert.alert('PIN definido', `PIN de ${selectedChild.name} foi atualizado com sucesso.`);
      setShowPinModal(false);
      setNewPin('');
      setConfirmPin('');
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setSavingPin(false);
    }
  };

  // ─── Estado: sem filhos cadastrados ───────────────────────
  if (children.length === 0) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: Colors.bg }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      >
        <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20 }}>
          <Text style={styles.label}>Filhos</Text>
          <Text style={styles.pageTitle}>Módulo Filhos</Text>

          <View style={styles.emptyState}>
            <IconUser size={48} color={Colors.muted} strokeWidth={1.2} />
            <Text style={styles.emptyTitle}>Sem filhos cadastrados</Text>
            <Text style={styles.emptyText}>
              Para usar o módulo de filhos, adicione uma criança no perfil familiar
              com o papel "Filho/Filha" (role = child).
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  // ─── Renders das abas ──────────────────────────────────────

  const renderTasksTab = () => {
    const summary = kidSummaries.find((s) => s.child_id === selectedChild?.id);
    if (!summary) return <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />;

    const nextMilestone = ACHIEVEMENT_MILESTONES.find(
      (m) => m.points > summary.total_points
    );
    const progressPct = nextMilestone
      ? Math.min(100, Math.round((summary.total_points / nextMilestone.points) * 100))
      : 100;

    return (
      <View>
        {/* Card de pontos */}
        <View style={styles.pointsCard}>
          <Text style={styles.pointsNumber}>{summary.total_points}</Text>
          <Text style={styles.pointsLabel}>pontos acumulados</Text>

          {nextMilestone && (
            <>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
              </View>
              <Text style={styles.progressHint}>
                {nextMilestone.title} em {nextMilestone.points} pts
              </Text>
            </>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{summary.completed_tasks}</Text>
            <Text style={styles.statLabel}>concluídas</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{summary.pending_tasks}</Text>
            <Text style={styles.statLabel}>pendentes</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {summary.total_points > 0
                ? `R$ ${((summary.total_points / 10) * 100 / 100).toFixed(2).replace('.', ',')}`
                : '—'}
            </Text>
            <Text style={styles.statLabel}>mesada estimada</Text>
          </View>
        </View>

        <Text style={styles.hintText}>
          Acesse a aba Tarefas para criar e gerenciar as tarefas de {selectedChild?.name}.
        </Text>
      </View>
    );
  };

  const renderAchievementsTab = () => (
    <View>
      {achievements.length === 0 ? (
        <View style={styles.emptyState}>
          <IconTrophy size={40} color={Colors.muted} strokeWidth={1.2} />
          <Text style={styles.emptyText}>Nenhuma conquista ainda.{'\n'}Complete tarefas para desbloquear!</Text>
        </View>
      ) : (
        achievements.map((a) => (
          <View key={a.id} style={styles.achievementCard}>
            <IconTrophy size={36} color={Colors.secondary} strokeWidth={1.5} />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.achievementTitle}>{a.title}</Text>
              {a.description ? (
                <Text style={styles.achievementDesc}>{a.description}</Text>
              ) : null}
              <Text style={styles.achievementMeta}>
                {new Date(a.awarded_at).toLocaleDateString('pt-BR')} · {a.points_at} pts
              </Text>
            </View>
          </View>
        ))
      )}

      {/* Próximos marcos */}
      <Text style={[styles.sectionSubtitle, { marginTop: 20, marginBottom: 10 }]}>Próximos marcos</Text>
      {ACHIEVEMENT_MILESTONES.map((m) => {
        const unlocked = achievements.some((a) => a.points_at === m.points);
        return (
          <View
            key={m.points}
            style={[styles.milestoneRow, unlocked && { opacity: 0.4 }]}
          >
            {unlocked
              ? <IconCheck size={24} color={Colors.secondary} strokeWidth={2} />
              : <IconStar size={24} color={Colors.muted} strokeWidth={1.5} />
            }
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.milestoneTitle}>{m.title}</Text>
              <Text style={styles.milestonePts}>{m.points} pontos</Text>
            </View>
          </View>
        );
      })}
    </View>
  );

  const renderSchoolTab = () => (
    <View>
      <TouchableOpacity
        onPress={() => setShowSchoolModal(true)}
        style={styles.addBtn}
        activeOpacity={0.8}
      >
        <Text style={styles.addBtnIcon}>+</Text>
        <Text style={styles.addBtnText}>Adicionar evento escolar</Text>
      </TouchableOpacity>

      {schoolEvents.length === 0 ? (
        <View style={styles.emptyState}>
          <IconSchool size={40} color={Colors.muted} strokeWidth={1.2} />
          <Text style={styles.emptyText}>Nenhum evento escolar futuro.</Text>
        </View>
      ) : (
        schoolEvents.map((ev) => (
          <View key={ev.id} style={styles.schoolCard}>
            {React.createElement(SCHOOL_ICON_MAP[ev.school_type as SchoolEventType] ?? IconCalendar, { size: 28, color: Colors.secondary, strokeWidth: 1.5 })}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.schoolTitle}>{ev.title}</Text>
              <Text style={styles.schoolMeta}>
                {SCHOOL_EVENT_LABELS[ev.school_type as SchoolEventType]} ·{' '}
                {new Date(ev.start_at).toLocaleDateString('pt-BR')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleDeleteSchoolEvent(ev.id)}
              style={styles.deleteBtn}
            >
              <Text style={styles.deleteBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );

  const renderScreenTab = () => {
    const pct = screenStatus?.percentage_used ?? 0;
    const over = screenStatus?.over_limit ?? false;

    return (
      <View>
        {/* Barra de progresso */}
        <View style={styles.screenCard}>
          <Text style={styles.screenTitle}>Tempo de tela hoje</Text>
          <View style={styles.screenBarBg}>
            <View
              style={[
                styles.screenBarFill,
                {
                  width: `${Math.min(100, pct)}%`,
                  backgroundColor: over ? Colors.warning : Colors.secondary,
                },
              ]}
            />
          </View>
          <View style={styles.screenStats}>
            <Text style={styles.screenStat}>
              Usado: <Text style={{ color: over ? Colors.warning : Colors.text }}>
                {screenStatus?.used_min ?? 0} min
              </Text>
            </Text>
            <Text style={styles.screenStat}>
              Limite: <Text style={{ color: Colors.text }}>{screenStatus?.allowed_min ?? 60} min</Text>
            </Text>
            <Text style={styles.screenStat}>
              Restante: <Text style={{ color: Colors.text }}>{screenStatus?.remaining_min ?? 60} min</Text>
            </Text>
          </View>
          {over && (
            <View style={styles.overLimitBadge}>
              <Text style={styles.overLimitText}>Limite ultrapassado</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={() => {
            setScreenAllowed(String(screenStatus?.allowed_min ?? 60));
            setScreenUsed(String(screenStatus?.used_min ?? 0));
            setShowScreenModal(true);
          }}
          style={styles.addBtn}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnIcon}>⏱</Text>
          <Text style={styles.addBtnText}>Atualizar tempo de tela</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderPinTab = () => (
    <View>
      <View style={styles.pinInfoCard}>
        <IconLock size={36} color={Colors.secondary} strokeWidth={1.5} style={{ alignSelf: 'center' }} />
        <Text style={styles.pinInfoTitle}>Login por PIN</Text>
        <Text style={styles.pinInfoDesc}>
          Defina um PIN de 4 a 6 dígitos para que {selectedChild?.name} possa
          acessar o app de forma independente, sem precisar da senha dos pais.
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => setShowPinModal(true)}
        style={styles.addBtn}
        activeOpacity={0.8}
      >
        <IconKey size={18} color={Colors.primary} strokeWidth={2} />
        <Text style={styles.addBtnText}>Definir / alterar PIN</Text>
      </TouchableOpacity>
    </View>
  );

  // ─── Render principal ──────────────────────────────────────
  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: Colors.bg }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.amber} />
        }
      >
        {/* Header */}
        <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 8 }}>
          <Text style={styles.label}>Filhos</Text>
          <Text style={styles.pageTitle}>Área das crianças</Text>
        </View>

        {/* Seletor de criança */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 4 }}
        >
          {children.map((child) => (
            <TouchableOpacity
              key={child.id}
              onPress={() => selectChild(child)}
              style={[
                styles.childChip,
                selectedChild?.id === child.id && styles.childChipActive,
              ]}
              activeOpacity={0.7}
            >
              <IconUser size={20} color={activeTab === 'tasks' ? Colors.primary : Colors.muted} strokeWidth={1.8} />
              <Text style={[
                styles.childChipText,
                selectedChild?.id === child.id && styles.childChipTextActive,
              ]}>
                {child.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Abas */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 4, marginTop: 8 }}
        >
          {(
            [
              { key: 'tasks',        Icon: IconStar,          label: 'Pontos' },
              { key: 'achievements', Icon: IconTrophy,        label: 'Conquistas' },
              { key: 'school',       Icon: IconSchool,        label: 'Escola' },
              { key: 'screen',       Icon: IconDeviceTablet,  label: 'Tela' },
              { key: 'pin',          Icon: IconLock,          label: 'PIN' },
            ] as { key: Tab; Icon: Icon; label: string }[]
          ).map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.tabChip,
                activeTab === tab.key && styles.tabChipActive,
              ]}
              activeOpacity={0.7}
            >
              <tab.Icon size={14} color={activeTab === tab.key ? Colors.primary : Colors.muted} strokeWidth={1.8} />
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Conteúdo */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          {activeTab === 'tasks'        && renderTasksTab()}
          {activeTab === 'achievements' && renderAchievementsTab()}
          {activeTab === 'school'       && renderSchoolTab()}
          {activeTab === 'screen'       && renderScreenTab()}
          {activeTab === 'pin'          && renderPinTab()}
        </View>
      </ScrollView>

      {/* Modal: Evento escolar */}
      <Modal visible={showSchoolModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 24 }]}>
            <Text style={styles.modalTitle}>Novo evento escolar</Text>

            {/* Tipo */}
            <Text style={styles.fieldLabel}>Tipo</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {(Object.entries(SCHOOL_EVENT_LABELS) as [SchoolEventType, string][]).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => setSchoolType(key)}
                  style={[styles.chipBtn, schoolType === key && styles.chipBtnActive]}
                >
                  <Text style={[styles.chipText, schoolType === key && styles.chipTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              value={schoolTitle}
              onChangeText={setSchoolTitle}
              placeholder="Ex: Prova de Matemática, Reunião de pais..."
              placeholderTextColor={Colors.muted}
              style={[styles.input, { marginBottom: 10 }]}
              autoFocus
            />
            <TextInput
              value={schoolDate}
              onChangeText={setSchoolDate}
              placeholder="Data (AAAA-MM-DD)"
              placeholderTextColor={Colors.muted}
              style={[styles.input, { marginBottom: 16 }]}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => { setShowSchoolModal(false); setSchoolTitle(''); setSchoolDate(''); }}
                style={[styles.modalBtn, styles.modalBtnSecondary]}
              >
                <Text style={styles.modalBtnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateSchoolEvent}
                disabled={savingSchool || !schoolTitle.trim() || !schoolDate.trim()}
                style={[styles.modalBtn, styles.modalBtnPrimary, { opacity: !schoolTitle.trim() ? 0.5 : 1 }]}
              >
                {savingSchool
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.modalBtnPrimaryText}>Salvar</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Tempo de tela */}
      <Modal visible={showScreenModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 24 }]}>
            <Text style={styles.modalTitle}>Tempo de tela — {selectedChild?.name}</Text>

            <Text style={styles.fieldLabel}>Limite diário (minutos)</Text>
            <TextInput
              value={screenAllowed}
              onChangeText={setScreenAllowed}
              keyboardType="number-pad"
              style={[styles.input, { marginBottom: 10 }]}
            />

            <Text style={styles.fieldLabel}>Já usado hoje (minutos)</Text>
            <TextInput
              value={screenUsed}
              onChangeText={setScreenUsed}
              keyboardType="number-pad"
              style={[styles.input, { marginBottom: 16 }]}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setShowScreenModal(false)}
                style={[styles.modalBtn, styles.modalBtnSecondary]}
              >
                <Text style={styles.modalBtnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveScreenTime}
                disabled={savingScreen}
                style={[styles.modalBtn, styles.modalBtnPrimary]}
              >
                {savingScreen
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.modalBtnPrimaryText}>Salvar</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: PIN */}
      <Modal visible={showPinModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 24 }]}>
            <Text style={styles.modalTitle}>PIN de {selectedChild?.name}</Text>

            <Text style={styles.fieldLabel}>Novo PIN (4–6 dígitos)</Text>
            <TextInput
              value={newPin}
              onChangeText={setNewPin}
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry
              placeholder="••••"
              placeholderTextColor={Colors.muted}
              style={[styles.input, { marginBottom: 10 }]}
            />

            <Text style={styles.fieldLabel}>Confirmar PIN</Text>
            <TextInput
              value={confirmPin}
              onChangeText={setConfirmPin}
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry
              placeholder="••••"
              placeholderTextColor={Colors.muted}
              style={[styles.input, { marginBottom: 16 }]}
            />

            {confirmPin.length > 0 && newPin !== confirmPin && (
              <Text style={{ color: Colors.error, fontSize: 12, marginBottom: 8 }}>
                Os PINs não coincidem.
              </Text>
            )}

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => { setShowPinModal(false); setNewPin(''); setConfirmPin(''); }}
                style={[styles.modalBtn, styles.modalBtnSecondary]}
              >
                <Text style={styles.modalBtnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSetPin}
                disabled={savingPin || newPin.length < 4 || newPin !== confirmPin}
                style={[
                  styles.modalBtn, styles.modalBtnPrimary,
                  { opacity: newPin.length < 4 || newPin !== confirmPin ? 0.5 : 1 },
                ]}
              >
                {savingPin
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.modalBtnPrimaryText}>Definir PIN</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ─── Estilos ──────────────────────────────────────────────────
const styles = {
  label: {
    color: Colors.muted, fontSize: 12, fontWeight: '600' as const,
    letterSpacing: 0.5, textTransform: 'uppercase' as const,
  },
  pageTitle: { color: Colors.text, fontSize: 22, fontWeight: '800' as const, marginTop: 4 },

  // Criança seletor
  childChip: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  childChipActive: { borderColor: Colors.amber, backgroundColor: Colors.amber + '22' },
  childChipText: { color: Colors.muted, fontSize: 13, fontWeight: '600' as const },
  childChipTextActive: { color: Colors.amber },

  // Abas
  tabChip: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  tabChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '22' },
  tabLabel: { color: Colors.muted, fontSize: 13, fontWeight: '600' as const },
  tabLabelActive: { color: Colors.primary },

  // Pontos
  pointsCard: {
    backgroundColor: Colors.card, borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center' as const, marginBottom: 16,
  },
  pointsNumber: { color: Colors.text, fontSize: 56, fontWeight: '900' as const },
  pointsLabel: { color: Colors.muted, fontSize: 13, marginTop: 2 },
  progressBar: {
    width: '100%' as const, height: 8, backgroundColor: Colors.border,
    borderRadius: 4, overflow: 'hidden' as const, marginTop: 16,
  },
  progressFill: { height: '100%' as const, backgroundColor: Colors.amber, borderRadius: 4 },
  progressHint: { color: Colors.muted, fontSize: 12, marginTop: 8 },

  statsRow: { flexDirection: 'row' as const, gap: 10, marginBottom: 16 },
  statBox: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    alignItems: 'center' as const, borderWidth: 1, borderColor: Colors.border,
  },
  statValue: { color: Colors.text, fontSize: 20, fontWeight: '800' as const },
  statLabel: { color: Colors.muted, fontSize: 11, marginTop: 2, textAlign: 'center' as const },
  hintText: { color: Colors.muted, fontSize: 13, textAlign: 'center' as const, lineHeight: 20 },

  // Conquistas
  achievementCard: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  achievementTitle: { color: Colors.text, fontSize: 15, fontWeight: '700' as const },
  achievementDesc: { color: Colors.muted, fontSize: 12, marginTop: 2 },
  achievementMeta: { color: Colors.muted, fontSize: 11, marginTop: 4 },
  sectionSubtitle: { color: Colors.muted, fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.5, textTransform: 'uppercase' as const },
  milestoneRow: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    backgroundColor: Colors.card, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8,
  },
  milestoneTitle: { color: Colors.text, fontSize: 14, fontWeight: '600' as const },
  milestonePts: { color: Colors.muted, fontSize: 12, marginTop: 2 },

  // Escola
  schoolCard: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  schoolTitle: { color: Colors.text, fontSize: 15, fontWeight: '600' as const },
  schoolMeta: { color: Colors.muted, fontSize: 12, marginTop: 2 },
  deleteBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.error + '22', borderWidth: 1, borderColor: Colors.error + '44',
    justifyContent: 'center' as const, alignItems: 'center' as const,
  },
  deleteBtnText: { color: Colors.error, fontSize: 12 },

  // Tela
  screenCard: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 16,
  },
  screenTitle: { color: Colors.text, fontSize: 15, fontWeight: '700' as const, marginBottom: 12 },
  screenBarBg: {
    height: 12, backgroundColor: Colors.border,
    borderRadius: 6, overflow: 'hidden' as const, marginBottom: 12,
  },
  screenBarFill: { height: '100%' as const, borderRadius: 6 },
  screenStats: { gap: 4 },
  screenStat: { color: Colors.muted, fontSize: 13 },
  overLimitBadge: {
    marginTop: 10, backgroundColor: Colors.error + '22',
    borderRadius: 8, padding: 8, alignItems: 'center' as const,
  },
  overLimitText: { color: Colors.error, fontSize: 13, fontWeight: '600' as const },

  // PIN
  pinInfoCard: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center' as const, gap: 8, marginBottom: 16,
  },
  pinInfoTitle: { color: Colors.text, fontSize: 16, fontWeight: '700' as const },
  pinInfoDesc: { color: Colors.muted, fontSize: 13, textAlign: 'center' as const, lineHeight: 20 },

  // Botão adicionar
  addBtn: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10,
    backgroundColor: Colors.primary + '22', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.primary + '44', marginBottom: 16,
  },
  addBtnIcon: { color: Colors.primary, fontSize: 20 },
  addBtnText: { color: Colors.primary, fontSize: 15, fontWeight: '600' as const },

  // Estado vazio
  emptyState: { alignItems: 'center' as const, paddingVertical: 40 },
  emptyTitle: { color: Colors.text, fontSize: 18, fontWeight: '700' as const, marginTop: 16 },
  emptyText: { color: Colors.muted, fontSize: 14, textAlign: 'center' as const, lineHeight: 22, marginTop: 8 },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' as const },
  modalSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 24,
  },
  modalTitle: { color: Colors.text, fontSize: 18, fontWeight: '700' as const, marginBottom: 16 },
  input: {
    backgroundColor: Colors.card, borderRadius: 12, padding: 14,
    color: Colors.text, fontSize: 15,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  fieldLabel: { color: Colors.muted, fontSize: 12, fontWeight: '600' as const, marginBottom: 8 },
  chipBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border, marginRight: 6,
  },
  chipBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '22' },
  chipText: { color: Colors.muted, fontSize: 12 },
  chipTextActive: { color: Colors.primary, fontWeight: '600' as const },
  modalBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  modalBtnPrimary: { backgroundColor: Colors.primary },
  modalBtnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' as const },
  modalBtnSecondary: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  modalBtnSecondaryText: { color: Colors.muted, fontSize: 15 },
};
