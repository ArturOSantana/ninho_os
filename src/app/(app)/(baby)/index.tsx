// src/app/(app)/(baby)/index.tsx
// Fase 3 — UC011-UC014, UC043 (seletor unificado Bebê/Filhos)
// Critério de aceite: registrar uma mamada em < 5 segundos.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  IconBabyBottle,
  IconChevronDown,
  IconClock,
  IconDroplet,
  IconMoon,
  IconPlus,
  IconWifi,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconStar,
} from '@tabler/icons-react-native';
import { useFamily } from '@/hooks';
import { useBabyLogger } from '@/hooks/useBabyLogger';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { Baby, RecordType, BabyRecord, Profile } from '@/types';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { AddChildForm, AddChildResult } from '@/components/baby/AddChildForm';
import { familyService } from '@/services/family/familyService';
import { TutorialOverlay } from '@/components/ui/TutorialOverlay';
import { useTutorial } from '@/hooks/useTutorial';

// ─── Tipos do seletor unificado ─────────────────────────────────
// Um "filho" pode ser bebê (módulo bebê) ou criança/adolescente (módulo kids).
type ChildChip =
  | { kind: 'baby'; id: string; name: string }
  | { kind: 'child'; id: string; name: string };

// ─── Seletor unificado Bebê/Filhos (UC043) ─────────────────────
// Exibe chips horizontais: bebê = ícone mamadeira (primary), criança = estrela (secondary).
// Botão "+" abre modal de escolha de tipo.
function ChildSelector({
  chips,
  activeId,
  onSelect,
  onAdd,
}: {
  chips: ChildChip[];
  activeId: string | null;
  onSelect: (chip: ChildChip) => void;
  onAdd: () => void;
}) {
  if (chips.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: Spacing.sm, paddingRight: Spacing.lg }}
      style={{ marginBottom: Spacing.lg }}
      accessibilityRole="tablist"
    >
      {chips.map((chip) => {
        const active = chip.id === activeId;
        const initials = chip.name.trim().split(' ').slice(0, 2).map((s) => s[0].toUpperCase()).join('');
        return (
          <TouchableOpacity
            key={chip.id}
            onPress={() => onSelect(chip)}
            activeOpacity={0.82}
            accessibilityRole="tab"
            accessibilityLabel={`${chip.name}, ${chip.kind === 'baby' ? 'bebê' : 'criança'}`}
            accessibilityState={{ selected: active }}
            style={{
              alignItems: 'center',
              gap: 4,
              opacity: active ? 1 : 0.6,
            }}
          >
            {/* Círculo com iniciais + ícone de tipo na borda inferior */}
            <View style={{ position: 'relative' }}>
              <View
                style={{
                  width: 52, height: 52, borderRadius: 26,
                  backgroundColor: active ? Colors.tertiary : Colors.bgCard,
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: active ? Colors.primary : Colors.border,
                }}
              >
                <Text style={{ color: active ? Colors.textOnLight : Colors.muted, fontSize: FontSize.md, fontWeight: '700' }}>
                  {initials}
                </Text>
              </View>
              {/* Ícone de tipo: mamadeira para bebê, estrela para criança */}
              <View
                style={{
                  position: 'absolute', bottom: -2, right: -2,
                  width: 18, height: 18, borderRadius: 9,
                  backgroundColor: active ? Colors.primary : Colors.border,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                {chip.kind === 'baby'
                  ? <IconBabyBottle size={10} color={Colors.textOnLight} />
                  : <IconStar       size={10} color={Colors.textOnLight} />
                }
              </View>
            </View>
            <Text
              style={{ color: active ? Colors.text : Colors.muted, fontSize: FontSize.xs, fontWeight: active ? '600' : '400' }}
              numberOfLines={1}
            >
              {chip.name.split(' ')[0]}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* Botão "+" para UC043 */}
      <TouchableOpacity
        onPress={onAdd}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel="adicionar filho"
        style={{ alignItems: 'center', gap: 4 }}
      >
        <View
          style={{
            width: 52, height: 52, borderRadius: 26,
            backgroundColor: Colors.bgCard,
            borderWidth: 2, borderColor: Colors.border,
            borderStyle: 'dashed',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <IconPlus size={18} color={Colors.muted} />
        </View>
        <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>adicionar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Formatação de hora ──────────────────────────────────────────
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function fmtRelative(iso: string) {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `há ${h}h${m}min` : `há ${h}h`;
}

const TYPE_LABEL: Partial<Record<RecordType, string>> = {
  feeding: 'mamada',
  sleep:   'sono',
  diaper:  'troca',
};

const FEEDING_LABEL: Record<string, string> = {
  breast_left:  'seio esq.',
  breast_right: 'seio dir.',
  bottle:       'mamadeira',
  solid:        'sólido',
};

// ─── Banner: sono esquecido ──────────────────────────────────────
// Aparece quando sleepStartedAt existe há mais de 4h sem ended_at.
// Permite ao usuário informar o horário real em que o bebê acordou (HH:MM).
function StaleSleepBanner({
  sleepStartedAt,
  saving,
  onConfirm,
  onDismiss,
}: {
  sleepStartedAt: string;
  saving: boolean;
  onConfirm: (wakeTime: Date | undefined) => void;
  onDismiss: () => void;
}) {
  // Horário de início formatado para exibir ao usuário
  const startLabel = new Date(sleepStartedAt).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Input de hora (HH:MM) — pré-preenchido com a hora atual
  const [timeInput, setTimeInput] = useState(() => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  });
  const [inputError, setInputError] = useState(false);

  function parseWakeTime(): Date | null {
    const match = timeInput.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    if (h > 23 || m > 59) return null;

    // Usa o dia do sleepStartedAt como base; se a hora informada for
    // menor que a hora de início, assume que cruzou a meia-noite.
    const base = new Date(sleepStartedAt);
    const wake = new Date(base);
    wake.setHours(h, m, 0, 0);
    if (wake <= base) wake.setDate(wake.getDate() + 1);
    // Não permite horário no futuro
    if (wake > new Date()) return new Date();
    return wake;
  }

  function handleConfirm() {
    const wake = parseWakeTime();
    if (!wake) { setInputError(true); return; }
    setInputError(false);
    onConfirm(wake);
  }

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityLabel="Sono muito longo detectado"
      style={{
        backgroundColor: '#1a1000',
        borderWidth: 1,
        borderColor: Colors.secondary,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
      }}
    >
      {/* Cabeçalho */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md }}>
        <IconAlertTriangle size={16} color={Colors.secondary} />
        <Text style={{ flex: 1, color: Colors.secondary, fontSize: FontSize.sm, fontWeight: '600' }}>
          sono longo detectado
        </Text>
        <TouchableOpacity
          onPress={onDismiss}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Ignorar aviso"
        >
          <IconX size={16} color={Colors.muted} />
        </TouchableOpacity>
      </View>

      {/* Descrição */}
      <Text style={{ color: Colors.muted, fontSize: FontSize.sm, lineHeight: 18, marginBottom: Spacing.lg }}>
        o sono começou às <Text style={{ color: Colors.text, fontWeight: '500' }}>{startLabel}</Text> e ainda não foi encerrado.
        o bebê já acordou?
      </Text>

      {/* Campo de hora */}
      <View style={{ marginBottom: Spacing.sm }}>
        <Text style={{ color: Colors.muted, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>
          que horas acordou?
        </Text>
        <TextInput
          value={timeInput}
          onChangeText={(v) => { setTimeInput(v); setInputError(false); }}
          placeholder="HH:MM"
          placeholderTextColor={Colors.border}
          keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
          maxLength={5}
          style={{
            backgroundColor: Colors.bg,
            borderWidth: 1,
            borderColor: inputError ? '#e05252' : Colors.border,
            borderRadius: Radius.md,
            paddingHorizontal: Spacing.md,
            paddingVertical: 10,
            color: Colors.text,
            fontSize: FontSize.lg,
            letterSpacing: 2,
            width: 90,
          }}
        />
        {inputError && (
          <Text style={{ color: '#e05252', fontSize: FontSize.xs, marginTop: 4 }}>
            formato inválido (ex: 09:30)
          </Text>
        )}
      </View>

      {/* Ações */}
      <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm }}>
        <TouchableOpacity
          onPress={handleConfirm}
          disabled={saving}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="Confirmar que bebê acordou"
          style={{
            flex: 1,
            backgroundColor: Colors.secondary,
            borderRadius: Radius.md,
            paddingVertical: 10,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 6,
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving
            ? <ActivityIndicator size="small" color="#412402" />
            : <>
                <IconCheck size={14} color="#412402" />
                <Text style={{ color: '#412402', fontSize: FontSize.sm, fontWeight: '600' }}>sim, acordou</Text>
              </>
          }
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onConfirm(undefined)}
          disabled={saving}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="Encerrar sono agora"
          style={{
            backgroundColor: Colors.bgCard,
            borderWidth: 1,
            borderColor: Colors.border,
            borderRadius: Radius.md,
            paddingVertical: 10,
            paddingHorizontal: Spacing.md,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: Colors.muted, fontSize: FontSize.sm }}>encerrar agora</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Toast "registrado" ──────────────────────────────────────────
// Desliza do topo, some após 1.5s. accessibilityLiveRegion="polite".
function Toast({ visible, message }: { visible: boolean; message: string }) {
  const translateY = useRef(new Animated.Value(-60)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: -60,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY]);

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      accessibilityLabel={message}
      style={{
        position: 'absolute',
        top: 0,
        left: Spacing.lg,
        right: Spacing.lg,
        zIndex: 100,
        transform: [{ translateY }],
      }}
    >
      <View
        style={{
          backgroundColor: Colors.bgCard,
          borderRadius: Radius.md,
          borderWidth: 1,
          borderColor: Colors.border,
          paddingVertical: Spacing.sm,
          paddingHorizontal: Spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.sm,
        }}
      >
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: Colors.primary,
          }}
        />
        <Text style={{ color: Colors.text, fontSize: FontSize.sm, fontWeight: '500' }}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

// ─── Linha da timeline ───────────────────────────────────────────
function TimelineRow({ record }: { record: BabyRecord }) {
  const label = TYPE_LABEL[record.type] ?? record.type;
  const detail =
    record.type === 'feeding' && record.feeding_type
      ? FEEDING_LABEL[record.feeding_type] ?? record.feeding_type
      : record.type === 'diaper' && record.diaper_type
      ? record.diaper_type
      : '';
  const displayLabel = detail ? `${label}, ${detail}` : label;
  const isPending    = !!(record as any)._pending;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        opacity: isPending ? 0.6 : 1,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
        <Text style={{ color: Colors.text, fontSize: FontSize.base }}>{displayLabel}</Text>
        {isPending && (
          <IconWifi size={12} color={Colors.muted} />
        )}
      </View>
      <Text style={{ color: Colors.muted, fontSize: FontSize.sm }}>
        {fmtTime(record.started_at)}
      </Text>
    </View>
  );
}

// ─── MiniMetric ──────────────────────────────────────────────────
function MiniMetric({ label, value, compact }: { label: string; value: string; compact?: boolean }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.bg,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: compact ? Spacing.sm : Spacing.md,
      }}
    >
      <Text
        numberOfLines={1}
        style={{
          color: Colors.muted,
          fontSize: compact ? 9 : FontSize.xs,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Text>
      <Text
        numberOfLines={1}
        style={{
          color: Colors.text,
          fontSize: compact ? FontSize.lg : FontSize.xl,
          fontWeight: '600',
          marginTop: compact ? 4 : 8,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

// ─── Tela ────────────────────────────────────────────────────────
// ─── Seletor de bebê ─────────────────────────────────────────────
function BabyPicker({
  babies,
  currentBaby,
  onSelect,
  onAdd,
}: {
  babies: Baby[];
  currentBaby: Baby | null;
  onSelect: (baby: Baby) => void;
  onAdd: () => void;
}) {
  const [open, setOpen] = useState(false);

  if (babies.length <= 1 && currentBaby) {
    // Só um bebê: mostra nome + botão de adicionar
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ color: Colors.text, fontSize: FontSize.xxl, fontWeight: '600' }}>
          {currentBaby.name}
        </Text>
        <TouchableOpacity
          onPress={onAdd}
          accessibilityLabel="Adicionar outro bebê"
          style={{
            backgroundColor: Colors.bgCard,
            borderWidth: 1,
            borderColor: Colors.border,
            borderRadius: Radius.full,
            paddingHorizontal: 8,
            paddingVertical: 3,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <IconPlus size={12} color={Colors.muted} />
          <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>adicionar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        accessibilityLabel={`Bebê atual: ${currentBaby?.name ?? 'nenhum'}. Toque para trocar`}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
      >
        <Text style={{ color: Colors.text, fontSize: FontSize.xxl, fontWeight: '600' }}>
          {currentBaby?.name ?? 'selecionar'}
        </Text>
        <IconChevronDown size={18} color={Colors.muted} />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', paddingHorizontal: Spacing.lg }}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View
            style={{
              backgroundColor: Colors.bgCard,
              borderRadius: Radius.xl,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            <Text
              style={{
                color: Colors.muted,
                fontSize: FontSize.xs,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                paddingHorizontal: Spacing.lg,
                paddingTop: Spacing.lg,
                paddingBottom: Spacing.sm,
              }}
            >
              selecionar bebê
            </Text>
            {babies.map((baby, idx) => (
              <TouchableOpacity
                key={baby.id}
                onPress={() => { onSelect(baby); setOpen(false); }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: Spacing.lg,
                  paddingVertical: 14,
                  borderTopWidth: idx === 0 ? 0 : 1,
                  borderTopColor: Colors.border,
                  backgroundColor: currentBaby?.id === baby.id ? Colors.bg : 'transparent',
                }}
              >
                <View
                  style={{
                    width: 36, height: 36, borderRadius: Radius.full,
                    backgroundColor: Colors.tertiary,
                    alignItems: 'center', justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <Text style={{ color: Colors.textOnLight, fontSize: FontSize.sm, fontWeight: '700' }}>
                    {baby.name.trim().split(' ').slice(0, 2).map((s: string) => s[0].toUpperCase()).join('')}
                  </Text>
                </View>
                <Text style={{ flex: 1, color: Colors.text, fontSize: FontSize.md, fontWeight: '500' }}>
                  {baby.name}
                </Text>
                {currentBaby?.id === baby.id && (
                  <IconCheck size={16} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
            {/* Adicionar bebê */}
            <TouchableOpacity
              onPress={() => { setOpen(false); onAdd(); }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: Spacing.lg,
                paddingVertical: 14,
                borderTopWidth: 1,
                borderTopColor: Colors.border,
              }}
            >
              <View
                style={{
                  width: 36, height: 36, borderRadius: Radius.full,
                  backgroundColor: Colors.bg,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  borderStyle: 'dashed',
                  alignItems: 'center', justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <IconPlus size={18} color={Colors.muted} />
              </View>
              <Text style={{ color: Colors.muted, fontSize: FontSize.md }}>
                adicionar bebê
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

export default function BabyScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { currentBaby, babies, family, loading, setCurrentBaby, addBaby } = useFamily();

  // ── UC043: membros com role=child para o seletor unificado ──
  const { members, load: loadMembers } = useFamilyMembers(family?.id);
  const childProfiles = members.filter((m: Profile) => m.role === 'child');

  useEffect(() => {
    if (family?.id) loadMembers();
  }, [family?.id, loadMembers]);

  // ── Chips unificados: bebês primeiro, depois crianças ──────
  const chips: ChildChip[] = [
    ...babies.map((b): ChildChip => ({ kind: 'baby', id: b.id, name: b.name })),
    ...childProfiles.map((c: Profile): ChildChip => ({ kind: 'child', id: c.id, name: c.name })),
  ];
  const activeChipId = currentBaby?.id ?? null;

  // Formulário de adição de filho (UC043)
  const [addFormVisible, setAddFormVisible]   = useState(false);
  const [addFormSaving,  setAddFormSaving]    = useState(false);

  const handleChipSelect = useCallback((chip: ChildChip) => {
    if (chip.kind === 'baby') {
      const baby = babies.find((b) => b.id === chip.id);
      if (baby) setCurrentBaby(baby);
    } else {
      // Navega para o módulo filhos com a criança selecionada
      router.push({ pathname: '/(app)/(kids)', params: { childId: chip.id } } as never);
    }
  }, [babies, setCurrentBaby, router]);

  const {
    todayRecords,
    lastByType,
    sleepStartedAt,
    sleepTimer,
    staleSleep,
    pendingCount,
    loadingTypes,
    log,
    endStaleSleep,
  } = useBabyLogger(currentBaby?.id, family?.id);

  // Controla se o banner foi dispensado manualmente nesta sessão
  const [staleDismissed, setStaleDismissed]   = useState(false);
  const [staleSaving,    setStaleSaving]       = useState(false);

  const showStaleBanner = staleSleep && !staleDismissed;

  const handleStaleSleepConfirm = useCallback(async (wakeTime: Date | undefined) => {
    setStaleSaving(true);
    try {
      await endStaleSleep(wakeTime);
      setStaleDismissed(false); // banner some porque staleSleep vai a false
    } finally {
      setStaleSaving(false);
    }
  }, [endStaleSleep]);

  // ── Toast ────────────────────────────────────────────────────
  const [toastMsg,     setToastMsg]     = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg(msg);
    setToastVisible(true);
    // Anuncia ao leitor de tela (fallback para plataformas que não suportam liveRegion)
    AccessibilityInfo.announceForAccessibility(msg);
    toastTimer.current = setTimeout(() => setToastVisible(false), 1500);
  }, []);

  // ── Toque simples: registra e exibe toast ────────────────────
  const handleTap = useCallback(async (type: RecordType) => {
    await log(type);
    const labels: Record<string, string> = {
      feeding: 'mamada registrada',
      sleep:   sleepStartedAt ? 'sono encerrado' : 'sono iniciado',
      diaper:  'troca registrada',
    };
    showToast(labels[type] ?? 'registrado');
  }, [log, sleepStartedAt, showToast]);

  // ── Toque longo: abre modal de detalhes ──────────────────────
  const handleLongPress = useCallback((type: RecordType) => {
    router.push(`/(app)/(baby)/register/${type}` as never);
  }, [router]);

  // ─── Estados sem bebê / carregando ───────────────────────────
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!currentBaby) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg, paddingHorizontal: Spacing['2xl'] }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.tertiary, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg }}>
          <Text style={{ color: Colors.textOnLight, fontSize: FontSize.xxxl, fontWeight: '700' }}>B</Text>
        </View>
        <Text style={{ fontSize: FontSize.lg, color: Colors.text, fontWeight: '600', textAlign: 'center', marginBottom: Spacing.sm }}>
          nenhum bebê cadastrado
        </Text>
        <Text style={{ fontSize: FontSize.base, color: Colors.muted, textAlign: 'center', marginBottom: Spacing['2xl'] }}>
          adicione um bebê para começar a registrar.
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(onboarding)/add-baby' as never)}
          activeOpacity={0.82}
          style={{ backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: Spacing.lg, paddingHorizontal: Spacing['2xl'] }}
        >
          <Text style={{ color: Colors.onLight, fontSize: FontSize.lg, fontWeight: '600' }}>cadastrar bebê</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const weeks = Math.floor(
    (Date.now() - new Date(currentBaby.birth_date).getTime()) / (7 * 24 * 60 * 60 * 1000)
  );

  const lastSleepRecord = lastByType.sleep;
  const lastSleepLabel  = sleepStartedAt
    ? sleepTimer
    : lastSleepRecord
    ? fmtRelative(lastSleepRecord.started_at)
    : '—';

  // Métricas derivadas do dia
  const feedingCount = todayRecords.filter((r) => r.type === 'feeding').length;
  const diaperCount  = todayRecords.filter((r) => r.type === 'diaper').length;

  // Tempo total de sono completo hoje (com ended_at) em minutos
  const totalSleepMin = todayRecords
    .filter((r) => r.type === 'sleep' && r.ended_at)
    .reduce((acc, r) => {
      const min = Math.floor(
        (new Date(r.ended_at!).getTime() - new Date(r.started_at).getTime()) / 60_000
      );
      return acc + (min > 0 ? min : 0);
    }, 0);

  const sleepTotalLabel = sleepStartedAt
    ? `ativo · ${sleepTimer}`
    : totalSleepMin === 0
    ? '—'
    : totalSleepMin < 60
    ? `${totalSleepMin}min`
    : `${Math.floor(totalSleepMin / 60)}h${totalSleepMin % 60 > 0 ? `${totalSleepMin % 60}min` : ''}`;

  const tutorial = useTutorial('baby');

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <TutorialOverlay
        visible={tutorial.visible}
        screenKey="baby"
        onDismiss={tutorial.dismiss}
      />
      {/* Toast — posição absoluta sobre o conteúdo */}
      <Toast visible={toastVisible} message={toastMsg} />

      {/* Formulário de adição de filho — UC043 */}
      <AddChildForm
        visible={addFormVisible}
        saving={addFormSaving}
        onClose={() => setAddFormVisible(false)}
        onSubmit={async (result: AddChildResult) => {
          if (!family?.id) return;
          setAddFormSaving(true);
          try {
            if (result.type === 'baby') {
              // addBaby cria no banco E atualiza AuthStore + context
              const newBaby = await addBaby({
                name:       result.name,
                birth_date: result.birthDate,
                sex:        'male', // padrão neutro; editável no perfil do bebê
              });
              setCurrentBaby(newBaby);
            } else {
              await familyService.createChildProfile(family.id, result.name, result.birthDate);
              // Recarrega membros para o chip da criança aparecer imediatamente
              await loadMembers();
            }
            setAddFormVisible(false);
          } catch {
            // Erro silencioso — mantém modal aberto; o usuário pode tentar de novo
          } finally {
            setAddFormSaving(false);
          }
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.lg,
          paddingBottom: insets.bottom + 110,
          paddingHorizontal: Spacing.lg,
        }}
      >
        {/* ── Seletor unificado Bebê/Filhos (UC043) ── */}
        <ChildSelector
          chips={chips}
          activeId={activeChipId}
          onSelect={handleChipSelect}
          onAdd={() => setAddFormVisible(true)}
        />

        {/* ── Banner: sono esquecido ── */}
        {showStaleBanner && sleepStartedAt && (
          <StaleSleepBanner
            sleepStartedAt={sleepStartedAt}
            saving={staleSaving}
            onConfirm={handleStaleSleepConfirm}
            onDismiss={() => setStaleDismissed(true)}
          />
        )}

        {/* ── Header do bebê ── */}
        <View
          style={{
            backgroundColor: Colors.bgCard,
            borderRadius: Radius.xxl,
            borderWidth: 1,
            borderColor: Colors.border,
            padding: Spacing.xl,
            marginBottom: Spacing.lg,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View
              style={{
                width: 60, height: 60, borderRadius: Radius.full,
                backgroundColor: Colors.tertiary,
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 2, borderColor: Colors.primary,
              }}
            >
              <Text style={{ color: Colors.textOnLight, fontSize: FontSize.xxl, fontWeight: '700' }}>
                {currentBaby.name.trim().split(' ').slice(0, 2).map((s: string) => s[0].toUpperCase()).join('')}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: Colors.text, fontSize: FontSize.xxl, fontWeight: '600' }}>
                {currentBaby.name}
              </Text>
              <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginTop: 4 }}>
                {weeks} semana{weeks !== 1 ? 's' : ''} de vida
              </Text>
            </View>
            {/* Badge de itens offline */}
            {pendingCount > 0 && (
              <View
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 4,
                  backgroundColor: Colors.bgCard, borderRadius: Radius.full,
                  borderWidth: 1, borderColor: Colors.border,
                  paddingHorizontal: Spacing.sm, paddingVertical: 3,
                }}
                accessibilityLabel={`${pendingCount} registro${pendingCount > 1 ? 's' : ''} aguardando sincronização`}
              >
                <IconWifi size={12} color={Colors.muted} />
                <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>{pendingCount}</Text>
              </View>
            )}
          </View>

          {/* Mini métricas do dia */}
          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xl }}>
            <MiniMetric compact label="registros" value={String(todayRecords.length)} />
            <MiniMetric compact label="mamadas" value={String(feedingCount)} />
            <MiniMetric compact label="trocas" value={String(diaperCount)} />
            <MiniMetric
              compact
              label={sleepStartedAt ? 'sono ativo' : 'sono hoje'}
              value={sleepTotalLabel}
            />
          </View>
        </View>

        {/* ── Subtítulo + título serif ── */}
        <Text style={{ color: Colors.muted, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.8, textAlign: 'center', marginBottom: 4 }}>
          registrar agora
        </Text>
        <Text style={{ fontFamily: 'Georgia', fontSize: 20, color: Colors.text, textAlign: 'center', marginBottom: Spacing.xl }}>
          o que aconteceu?
        </Text>

        {/* ── Botão mamada ── */}
        <TouchableOpacity
          onPress={() => handleTap('feeding')}
          onLongPress={() => handleLongPress('feeding')}
          delayLongPress={400}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="Registrar mamada"
          accessibilityHint="Toque duas vezes e segure para adicionar detalhes"
          disabled={loadingTypes.feeding}
          style={{
            backgroundColor: Colors.primary,
            borderTopLeftRadius: 28, borderTopRightRadius: 18,
            borderBottomRightRadius: 26, borderBottomLeftRadius: 22,
            paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl,
            flexDirection: 'row', alignItems: 'center', gap: 14,
            marginBottom: 12,
            opacity: loadingTypes.feeding ? 0.7 : 1,
          }}
        >
          {loadingTypes.feeding
            ? <ActivityIndicator size="small" color={Colors.onLight} />
            : <IconBabyBottle size={24} color={Colors.onLight} />
          }
          <Text style={{ color: Colors.onLight, fontSize: FontSize.md, fontWeight: '500' }}>mamada</Text>
          {lastByType.feeding && (
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={{ color: `${Colors.onLight}99`, fontSize: FontSize.xs }}>
                {fmtRelative(lastByType.feeding.started_at)}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ── Botão sono ── */}
        <TouchableOpacity
          onPress={() => handleTap('sleep')}
          onLongPress={() => handleLongPress('sleep')}
          delayLongPress={400}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel={sleepStartedAt ? `Encerrar sono — ${sleepTimer}` : 'Iniciar sono'}
          accessibilityHint="Toque duas vezes e segure para adicionar detalhes"
          disabled={loadingTypes.sleep}
          style={{
            backgroundColor: Colors.secondary,
            borderTopLeftRadius: 22, borderTopRightRadius: 28,
            borderBottomRightRadius: 22, borderBottomLeftRadius: 26,
            paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl,
            flexDirection: 'row', alignItems: 'center', gap: 14,
            marginBottom: 12, marginLeft: 14,
            opacity: loadingTypes.sleep ? 0.7 : 1,
          }}
        >
          {loadingTypes.sleep
            ? <ActivityIndicator size="small" color="#412402" />
            : sleepStartedAt
            ? <IconClock size={24} color="#412402" />
            : <IconMoon  size={24} color="#412402" />
          }
          <Text style={{ color: '#412402', fontSize: FontSize.md, fontWeight: '500' }}>
            {sleepStartedAt ? `acordou · ${sleepTimer}` : 'sono'}
          </Text>
        </TouchableOpacity>

        {/* ── Botão troca ── */}
        <TouchableOpacity
          onPress={() => handleTap('diaper')}
          onLongPress={() => handleLongPress('diaper')}
          delayLongPress={400}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="Registrar troca de fralda"
          accessibilityHint="Toque duas vezes e segure para adicionar detalhes"
          disabled={loadingTypes.diaper}
          style={{
            backgroundColor: Colors.tertiary,
            borderTopLeftRadius: 26, borderTopRightRadius: 22,
            borderBottomRightRadius: 24, borderBottomLeftRadius: 28,
            paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl,
            flexDirection: 'row', alignItems: 'center', gap: 14,
            marginBottom: 12, marginLeft: 6,
            opacity: loadingTypes.diaper ? 0.7 : 1,
          }}
        >
          {loadingTypes.diaper
            ? <ActivityIndicator size="small" color="#712b13" />
            : <IconDroplet size={24} color="#712b13" />
          }
          <Text style={{ color: '#712b13', fontSize: FontSize.md, fontWeight: '500' }}>troca de fralda</Text>
          {lastByType.diaper && (
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={{ color: '#712b1399', fontSize: FontSize.xs }}>
                {fmtRelative(lastByType.diaper.started_at)}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ── Timeline do dia ── */}
        <View
          style={{
            backgroundColor: Colors.bgCard,
            borderRadius: Radius.xl,
            borderWidth: 1,
            borderColor: Colors.border,
            padding: Spacing.lg,
            marginTop: Spacing.sm,
          }}
        >
          <Text style={{ color: Colors.muted, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.md }}>
            linha do tempo do dia
          </Text>

          {todayRecords.length === 0 ? (
            <Text style={{ color: Colors.muted, fontSize: FontSize.sm, textAlign: 'center', paddingVertical: Spacing.lg }}>
              nenhum registro ainda hoje
            </Text>
          ) : (
            todayRecords.slice(0, 8).map((r) => (
              <TimelineRow key={r.id} record={r} />
            ))
          )}

          {todayRecords.length > 8 && (
            <TouchableOpacity
              onPress={() => router.push('/(app)/(baby)/history' as never)}
              style={{ paddingTop: Spacing.md }}
              activeOpacity={0.7}
            >
              <Text style={{ color: Colors.primary, fontSize: FontSize.sm, textAlign: 'center' }}>
                ver todos ({todayRecords.length})
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
