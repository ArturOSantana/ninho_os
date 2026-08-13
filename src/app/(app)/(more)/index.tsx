// src/app/(app)/(more)/index.tsx
// Tela de Perfil — design v3
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Switch, Alert, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  IconUser, IconLock, IconBell, IconLanguage, IconUsers,
  IconLogout, IconTrash, IconChevronRight, IconShoppingCart,
  IconScale, IconHeart, IconBabyBottle, IconFileReport,
} from '@tabler/icons-react-native';
import { useAuthStore } from '@/stores/auth.store';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { useFamily } from '@/hooks';
import { supabase } from '@/lib/supabase';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { Avatar } from '@/components/ui/Avatar';
import { useBreakpoint } from '@/hooks/useBreakpoint';

function SectionLabel({ label }: { label: string }) {
  return (
    <Text style={{
      color:         Colors.textDisabled,
      fontSize:      FontSize.xs,
      fontWeight:    '600',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginBottom:  8,
      marginTop:     Spacing.xl,
      paddingHorizontal: 4,
    }}>
      {label}
    </Text>
  );
}

function SettingsGroup({ children }: { children: React.ReactNode }) {
  return (
    <View style={{
      backgroundColor: Colors.bgCard,
      borderRadius:    Radius.lg,
      borderWidth:     1,
      borderColor:     Colors.border,
      overflow:        'hidden',
    }}>
      {children}
    </View>
  );
}

function NavRow({ icon, label, onPress, isLast }: {
  icon: React.ReactNode; label: string; onPress: () => void; isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection:     'row',
        alignItems:        'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical:   15,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: Colors.border,
      }}
    >
      <View style={{ marginRight: 14 }}>{icon}</View>
      <Text style={{
        flex:       1,
        color:      Colors.text,
        fontSize:   FontSize.md,
      }}>
        {label}
      </Text>
      <IconChevronRight size={15} color={Colors.textDisabled} />
    </TouchableOpacity>
  );
}

function ToggleRow({ icon, label, value, onValueChange, isLast }: {
  icon: React.ReactNode; label: string; value: boolean;
  onValueChange: (v: boolean) => void; isLast?: boolean;
}) {
  return (
    <View style={{
      flexDirection:     'row',
      alignItems:        'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical:   15,
      borderBottomWidth: isLast ? 0 : 1,
      borderBottomColor: Colors.border,
    }}>
      <View style={{ marginRight: 14 }}>{icon}</View>
      <Text style={{ flex: 1, color: Colors.text, fontSize: FontSize.md }}>
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

function ValueRow({ icon, label, value, isLast }: {
  icon: React.ReactNode; label: string; value: string; isLast?: boolean;
}) {
  return (
    <View style={{
      flexDirection:     'row',
      alignItems:        'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical:   15,
      borderBottomWidth: isLast ? 0 : 1,
      borderBottomColor: Colors.border,
    }}>
      <View style={{ marginRight: 14 }}>{icon}</View>
      <Text style={{ flex: 1, color: Colors.text, fontSize: FontSize.md }}>
        {label}
      </Text>
      <Text style={{ color: Colors.muted, fontSize: FontSize.sm }}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDesktop } = useBreakpoint();
  const { profile, user, reset } = useAuthStore();
  const { family } = useFamily();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const { members, load: loadMembers } = useFamilyMembers(family?.id);
  useEffect(() => { if (family?.id) loadMembers(); }, [family?.id, loadMembers]);

  const adultCount = useMemo(
    () => members.filter((m) => m.role === 'admin' || m.role === 'parent').length,
    [members],
  );
  const hasPartner = adultCount >= 2;

  const handleLogout = () => {
    Alert.alert('Sair da conta', 'Deseja fazer logout?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text:  'Sair',
        style: 'destructive',
        onPress: async () => { await supabase.auth.signOut(); reset(); },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir conta',
      'Esta ação é irreversível. Todos os dados serão apagados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text:  'Excluir',
          style: 'destructive',
          onPress: async () => { await supabase.auth.signOut(); reset(); },
        },
      ]
    );
  };

  const topPadding = Platform.OS === 'web' ? 24 : insets.top + Spacing.xl;
  const iconColor  = Colors.muted;
  const iconSize   = 18;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgPage }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop:        topPadding,
          paddingBottom:     insets.bottom + 100,
          paddingHorizontal: isDesktop ? 32 : Spacing.lg,
          maxWidth:          isDesktop ? 600 : undefined,
          alignSelf:         isDesktop ? 'center' : undefined,
          width:             isDesktop ? '100%' : undefined,
        }}
      >
        {/* Avatar + nome + e-mail */}
        <View style={{ alignItems: 'center', marginBottom: Spacing.xl }}>
          <Avatar
            name={profile?.name ?? 'Usuário'}
            size={72}
            style={{ marginBottom: 14 }}
          />
          <Text style={{
            color:         Colors.text,
            fontSize:      FontSize.xxl,
            fontWeight:    '700',
            letterSpacing: -0.5,
          }}>
            {profile?.name ?? 'Usuário'}
          </Text>
          <Text style={{ color: Colors.muted, fontSize: FontSize.md, marginTop: 4 }}>
            {user?.email ?? ''}
          </Text>
        </View>

        {/* Conta */}
        <SectionLabel label="Conta" />
        <SettingsGroup>
          <NavRow
            icon={<IconUser size={iconSize} color={iconColor} />}
            label="Editar perfil"
            onPress={() => router.push('/(app)/(more)/edit-profile' as never)}
          />
          <NavRow
            icon={<IconLock size={iconSize} color={iconColor} />}
            label="Trocar senha"
            onPress={() => router.push('/(app)/(more)/change-password' as never)}
            isLast
          />
        </SettingsGroup>

        {/* Preferências */}
        <SectionLabel label="Preferências" />
        <SettingsGroup>
          <ToggleRow
            icon={<IconBell size={iconSize} color={iconColor} />}
            label="Notificações"
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />
          <ValueRow
            icon={<IconLanguage size={iconSize} color={iconColor} />}
            label="Idioma"
            value="Português"
            isLast
          />
        </SettingsGroup>

        {/* Módulos */}
        <SectionLabel label="Módulos" />
        <SettingsGroup>
          <NavRow
            icon={<IconShoppingCart size={iconSize} color={iconColor} />}
            label="Lista de compras"
            onPress={() => router.push('/(app)/(shopping)' as never)}
          />
          {hasPartner && (
            <NavRow
              icon={<IconScale size={iconSize} color={iconColor} />}
              label="Carga mental"
              onPress={() => router.push('/(app)/(mental-load)' as never)}
            />
          )}
          {hasPartner && (
            <NavRow
              icon={<IconHeart size={iconSize} color={iconColor} />}
              label="Casal"
              onPress={() => router.push('/(app)/(couple)' as never)}
            />
          )}
          <NavRow
            icon={<IconBabyBottle size={iconSize} color={iconColor} />}
            label="Módulo filhos"
            onPress={() => router.push('/(app)/(kids)' as never)}
            isLast
          />
        </SettingsGroup>

        {/* Relatório */}
        <SectionLabel label="Relatório" />
        <SettingsGroup>
          <NavRow
            icon={<IconFileReport size={iconSize} color={iconColor} />}
            label="Relatório familiar"
            onPress={() => router.push('/(app)/(more)/report' as never)}
            isLast
          />
        </SettingsGroup>

        {/* Família */}
        <SectionLabel label="Família" />
        <SettingsGroup>
          <NavRow
            icon={<IconUsers size={iconSize} color={iconColor} />}
            label="Membros da família"
            onPress={() => router.push('/(app)/(family)' as never)}
            isLast
          />
        </SettingsGroup>

        {/* Divisor */}
        <View style={{ height: 1, backgroundColor: Colors.border, marginTop: 28, marginBottom: Spacing.lg }} />

        {/* Sair */}
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}
        >
          <IconLogout size={iconSize} color={Colors.muted} />
          <Text style={{ color: Colors.muted, fontSize: FontSize.md }}>Sair da conta</Text>
        </TouchableOpacity>

        {/* Excluir conta */}
        <TouchableOpacity
          onPress={handleDeleteAccount}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, marginTop: 4 }}
        >
          <IconTrash size={iconSize} color={Colors.error} />
          <Text style={{ color: Colors.error, fontSize: FontSize.md }}>Excluir conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
