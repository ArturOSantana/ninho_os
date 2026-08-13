// src/app/(app)/(more)/index.tsx
// Tela de Perfil — design v2

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  IconUser,
  IconLock,
  IconBell,
  IconLanguage,
  IconUsers,
  IconLogout,
  IconTrash,
  IconChevronRight,
  IconShoppingCart,
  IconScale,
  IconHeart,
  IconBabyBottle,
  IconFileReport,
} from '@tabler/icons-react-native';
import { useAuthStore } from '@/stores/auth.store';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { useFamily } from '@/hooks';
import { supabase } from '@/lib/supabase';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';

// ─── Seção com título ────────────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return (
    <Text
      style={{
        color: Colors.muted,
        fontSize: FontSize.sm,
        marginBottom: 8,
        marginTop: Spacing.xl,
        paddingHorizontal: 2,
      }}
    >
      {label}
    </Text>
  );
}

// ─── Card de grupo ────────────────────────────────────────────────────────────
function SettingsGroup({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: Colors.bgCard,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
      }}
    >
      {children}
    </View>
  );
}

// ─── Item de navegação (com chevron) ──────────────────────────────────────────
function NavRow({
  icon,
  label,
  onPress,
  isLast,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: Colors.border,
      }}
    >
      <View style={{ marginRight: 14 }}>{icon}</View>
      <Text style={{ flex: 1, color: Colors.text, fontSize: FontSize.lg }}>
        {label}
      </Text>
      <IconChevronRight size={16} color={Colors.muted} />
    </TouchableOpacity>
  );
}

// ─── Item de toggle ──────────────────────────────────────────────────────────
function ToggleRow({
  icon,
  label,
  value,
  onValueChange,
  isLast,
}: {
  icon: React.ReactNode;
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  isLast?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: Colors.border,
      }}
    >
      <View style={{ marginRight: 14 }}>{icon}</View>
      <Text style={{ flex: 1, color: Colors.text, fontSize: FontSize.lg }}>
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.border, true: Colors.primary }}
        thumbColor="#ffffff"
      />
    </View>
  );
}

// ─── Item de valor textual ────────────────────────────────────────────────────
function ValueRow({
  icon,
  label,
  value,
  isLast,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: Colors.border,
      }}
    >
      <View style={{ marginRight: 14 }}>{icon}</View>
      <Text style={{ flex: 1, color: Colors.text, fontSize: FontSize.lg }}>
        {label}
      </Text>
      <Text style={{ color: Colors.muted, fontSize: FontSize.md }}>{value}</Text>
    </View>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, user, reset } = useAuthStore();
  const { family } = useFamily();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Carga mental só aparece com 2+ adultos responsáveis (admin ou parent)
  const { members, load: loadMembers } = useFamilyMembers(family?.id);
  useEffect(() => { if (family?.id) loadMembers(); }, [family?.id, loadMembers]);
  const adultCount = useMemo(
    () => members.filter((m) => m.role === 'admin' || m.role === 'parent').length,
    [members],
  );
  const showMentalLoad = adultCount >= 2;

  const initials = profile?.name
    ? profile.name
        .trim()
        .split(' ')
        .slice(0, 2)
        .map((s: string) => s[0].toUpperCase())
        .join('')
    : '?';

  const handleLogout = () => {
    Alert.alert('sair da conta', 'Deseja fazer logout?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          reset();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'excluir conta',
      'Esta ação é irreversível. Todos os dados serão apagados. Confirmar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: async () => {
          await supabase.auth.signOut();
          reset();
        }},
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.xl,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: Spacing.lg,
        }}
      >
        {/* Avatar + nome + e-mail */}
        <View style={{ alignItems: 'center', marginBottom: Spacing.md }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: Radius.full,
              backgroundColor: Colors.tertiary,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <Text
              style={{
                color: Colors.textOnLight,
                fontSize: FontSize.xxl,
                fontWeight: '600',
              }}
            >
              {initials}
            </Text>
          </View>

          <Text
            style={{
              color: Colors.text,
              fontSize: FontSize.xxl,
              fontWeight: '600',
              fontFamily: 'Georgia',
            }}
          >
            {profile?.name ?? 'Usuário'}
          </Text>
          <Text style={{ color: Colors.muted, fontSize: FontSize.md, marginTop: 4 }}>
            {user?.email ?? ''}
          </Text>
        </View>

        {/* Seção: conta */}
        <SectionLabel label="conta" />
        <SettingsGroup>
          <NavRow
            icon={<IconUser size={20} color={Colors.secondary} />}
            label="editar perfil"
            onPress={() => router.push('/(app)/(more)/edit-profile' as never)}
          />
          <NavRow
            icon={<IconLock size={20} color={Colors.secondary} />}
            label="trocar senha"
            onPress={() => router.push('/(app)/(more)/change-password' as never)}
            isLast
          />
        </SettingsGroup>

        {/* Seção: preferências */}
        <SectionLabel label="preferências" />
        <SettingsGroup>
          <ToggleRow
            icon={<IconBell size={20} color={Colors.secondary} />}
            label="notificações"
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />
          <ValueRow
            icon={<IconLanguage size={20} color={Colors.secondary} />}
            label="idioma"
            value="português"
            isLast
          />
        </SettingsGroup>

        {/* Seção: módulos */}
        <SectionLabel label="módulos" />
        <SettingsGroup>
          <NavRow
            icon={<IconShoppingCart size={20} color={Colors.secondary} />}
            label="lista de compras"
            onPress={() => router.push('/(app)/(shopping)' as never)}
          />
          {showMentalLoad && (
            <NavRow
              icon={<IconScale size={20} color={Colors.secondary} />}
              label="carga mental"
              onPress={() => router.push('/(app)/(mental-load)' as never)}
            />
          )}
          <NavRow
            icon={<IconHeart size={20} color={Colors.secondary} />}
            label="casal"
            onPress={() => router.push('/(app)/(couple)' as never)}
          />
          <NavRow
            icon={<IconBabyBottle size={20} color={Colors.secondary} />}
            label="módulo filhos"
            onPress={() => router.push('/(app)/(kids)' as never)}
            isLast
          />
        </SettingsGroup>

        {/* Seção: relatório */}
        <SectionLabel label="relatório" />
        <SettingsGroup>
          <NavRow
            icon={<IconFileReport size={20} color={Colors.secondary} />}
            label="relatório familiar"
            onPress={() => router.push('/(app)/(more)/report' as never)}
            isLast
          />
        </SettingsGroup>

        {/* Seção: família */}
        <SectionLabel label="família" />
        <SettingsGroup>
          <NavRow
            icon={<IconUsers size={20} color={Colors.secondary} />}
            label="membros da família"
            onPress={() => router.push('/(app)/(family)' as never)}
            isLast
          />
        </SettingsGroup>

        {/* Divisor */}
        <View
          style={{
            height: 1,
            backgroundColor: Colors.border,
            marginTop: Spacing.xl,
            marginBottom: Spacing.lg,
          }}
        />

        {/* Sair da conta */}
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.75}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingVertical: 8,
          }}
        >
          <IconLogout size={20} color={Colors.text} />
          <Text style={{ color: Colors.text, fontSize: FontSize.lg }}>
            sair da conta
          </Text>
        </TouchableOpacity>

        {/* Excluir conta */}
        <TouchableOpacity
          onPress={handleDeleteAccount}
          activeOpacity={0.75}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingVertical: 8,
            marginTop: 4,
          }}
        >
          <IconTrash size={20} color={Colors.primary} />
          <Text style={{ color: Colors.primary, fontSize: FontSize.lg }}>
            excluir conta
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
