// src/app/child-login.tsx
// UC040 — Login por PIN para crianças
// O pai/mãe vê esta tela quando toca em "Entrar como filho".
// A criança seleciona o perfil dela → digita o PIN → app restrito é aberto.

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconX, IconChevronLeft } from '@tabler/icons-react-native';
import { useAuthStore } from '@/stores/auth.store';
import { familyService } from '@/services/family/familyService';
import { kidsService } from '@/services/kids/kidsService';
import { Profile } from '@/types';
import { Colors, Radius, Spacing, FontSize } from '@/constants/theme';

// ─── Teclado numérico virtual ────────────────────────────────

const PIN_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

function PinKeypad({ onKey }: { onKey: (key: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.md, marginTop: Spacing.xl }}>
      {PIN_KEYS.map((key, idx) => {
        if (key === '') {
          return <View key={idx} style={{ width: 72, height: 72 }} />;
        }
        return (
          <TouchableOpacity
            key={idx}
            onPress={() => onKey(key)}
            activeOpacity={0.7}
            accessibilityLabel={key === 'del' ? 'apagar' : `dígito ${key}`}
            style={{
              width: 72,
              height: 72,
              borderRadius: Radius.full,
              backgroundColor: Colors.bgCard,
              borderWidth: 1,
              borderColor: Colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {key === 'del' ? (
              <IconChevronLeft size={20} color={Colors.muted} strokeWidth={2} />
            ) : (
              <Text style={{ color: Colors.text, fontSize: 22, fontWeight: '600' }}>{key}</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Indicador de PIN (bolinhas) ─────────────────────────────

function PinDots({ length, filled }: { length: number; filled: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 14, justifyContent: 'center', marginTop: Spacing.xl }}>
      {Array.from({ length }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: i < filled ? Colors.secondary : 'transparent',
            borderWidth: 2,
            borderColor: i < filled ? Colors.secondary : Colors.border,
          }}
        />
      ))}
    </View>
  );
}

// ─── Card de seleção de criança ───────────────────────────────

function ChildCard({
  profile,
  selected,
  onPress,
}: {
  profile: Profile;
  selected: boolean;
  onPress: () => void;
}) {
  const initials = profile.name
    .trim()
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join('');

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={`Selecionar perfil de ${profile.name}`}
      accessibilityState={{ selected }}
      style={{
        backgroundColor: selected ? Colors.secondary + '22' : Colors.bgCard,
        borderRadius: Radius.xl,
        borderWidth: 2,
        borderColor: selected ? Colors.secondary : Colors.border,
        padding: Spacing.lg,
        alignItems: 'center',
        minWidth: 100,
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
          borderColor: selected ? Colors.secondary : 'transparent',
        }}
      >
        <Text style={{ fontSize: FontSize.xl, fontWeight: '700', color: Colors.secondary }}>
          {initials}
        </Text>
      </View>
      <Text
        style={{ color: Colors.text, fontSize: FontSize.sm, fontWeight: '600', textAlign: 'center' }}
        numberOfLines={1}
      >
        {profile.name.split(' ')[0]}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Tela principal ───────────────────────────────────────────

type Step = 'select' | 'pin';

export default function ChildLoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { family, setChildSession } = useAuthStore();

  const [step, setStep] = useState<Step>('select');
  const [children, setChildren] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [pin, setPin] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animação de shake para PIN errado
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const PIN_LENGTH = 6;

  // Carrega apenas perfis com role=child
  useEffect(() => {
    if (!family?.id) return;
    familyService
      .listMembers(family.id)
      .then((members) => setChildren(members.filter((m) => m.role === 'child')))
      .catch(() => setChildren([]))
      .finally(() => setLoadingProfiles(false));
  }, [family?.id]);

  // Verifica o PIN automaticamente quando 6 dígitos forem inseridos
  useEffect(() => {
    if (pin.length === PIN_LENGTH && selected) {
      handleVerifyPin();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const handleKey = (key: string) => {
    setError(null);
    if (key === 'del') {
      setPin((p) => p.slice(0, -1));
    } else if (pin.length < PIN_LENGTH) {
      setPin((p) => p + key);
    }
  };

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8,   duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleVerifyPin = async () => {
    if (!selected || !family) return;
    setVerifying(true);
    setError(null);
    try {
      const ok = await kidsService.verifyChildPin(selected.id, pin);
      if (ok) {
        setChildSession({
          profileId: selected.id,
          name:      selected.name,
          familyId:  family.id!,
          authenticatedAt: Date.now(),
        });
        // O NavigationGuard no _layout.tsx detectará o childSession e redirecionará
        router.replace('/kids-app' as never);
      } else {
        shake();
        setError('PIN incorreto. tente de novo.');
        setPin('');
      }
    } catch {
      shake();
      setError('Erro ao verificar PIN. tente de novo.');
      setPin('');
    } finally {
      setVerifying(false);
    }
  };

  const handleSelectChild = (profile: Profile) => {
    setSelected(profile);
    setPin('');
    setError(null);
    setStep('pin');
  };

  const handleBack = () => {
    if (step === 'pin') {
      setStep('select');
      setPin('');
      setError(null);
    } else {
      router.back();
    }
  };

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
          gap: Spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        }}
      >
        <TouchableOpacity
          onPress={handleBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="voltar"
        >
          <IconChevronLeft size={24} color={Colors.secondary} strokeWidth={2} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: Colors.text, fontSize: FontSize.xl, fontWeight: '600' }}>
            {step === 'select' ? 'quem está entrando?' : `oi, ${selected?.name.split(' ')[0]}!`}
          </Text>
          <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginTop: 2 }}>
            {step === 'select' ? 'toca no teu nome' : 'digita o teu PIN'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="fechar"
        >
          <IconX size={20} color={Colors.muted} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: Spacing.xl,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: Spacing.lg,
          alignItems: 'center',
        }}
      >
        {step === 'select' ? (
          /* ── Seleção de criança ──────────────────────── */
          loadingProfiles ? (
            <ActivityIndicator size="large" color={Colors.secondary} style={{ marginTop: 64 }} />
          ) : children.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 64 }}>
              <Text style={{ color: Colors.muted, fontSize: FontSize.base, textAlign: 'center' }}>
                nenhuma criança cadastrada nesta família.
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: Spacing.sm, gap: Spacing.sm }}
            >
              {children.map((child) => (
                <ChildCard
                  key={child.id}
                  profile={child}
                  selected={selected?.id === child.id}
                  onPress={() => handleSelectChild(child)}
                />
              ))}
            </ScrollView>
          )
        ) : (
          /* ── Entrada de PIN ──────────────────────────── */
          <>
            <Animated.View style={{ transform: [{ translateX: shakeAnim }], alignItems: 'center' }}>
              <PinDots length={PIN_LENGTH} filled={pin.length} />
              {error ? (
                <Text
                  style={{ color: Colors.warning, fontSize: FontSize.sm, marginTop: Spacing.md, textAlign: 'center' }}
                  accessibilityLiveRegion="polite"
                >
                  {error}
                </Text>
              ) : (
                <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginTop: Spacing.md }}>
                  {verifying ? 'verificando...' : ' '}
                </Text>
              )}
            </Animated.View>

            {verifying ? (
              <ActivityIndicator size="large" color={Colors.secondary} style={{ marginTop: Spacing['2xl'] }} />
            ) : (
              <PinKeypad onKey={handleKey} />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
