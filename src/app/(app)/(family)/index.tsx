// src/app/(app)/(family)/index.tsx
// UC027 — Lista de membros da família + acesso a convites

import React, { useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  IconUserPlus, IconChevronLeft,
} from '@tabler/icons-react-native';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';
import { useFamily } from '@/hooks';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { useAuthStore } from '@/stores/auth.store';
import { MemberCard } from '@/components/family';
import { Profile } from '@/types';

export default function FamilyMembersScreen() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const { family } = useFamily();
  const { profile } = useAuthStore();

  const { members, loading, error, load, acceptedInviteMap, loadAcceptedInvites } = useFamilyMembers(family?.id);

  useEffect(() => {
    load();
    loadAcceptedInvites();
  }, [load, loadAcceptedInvites]);

  const currentUserProfile = members.find((m) => m.user_id === profile?.user_id);
  const isAdmin = currentUserProfile?.role === 'admin';

  const handleMemberPress = (member: Profile) => {
    if (!isAdmin || member.user_id === profile?.user_id) return;
    router.push(`/(app)/(family)/member/${member.id}` as never);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, paddingTop: insets.top }}>
      {/* Header — serif v2 */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg,
        paddingBottom: Spacing.md, gap: 12,
      }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <IconChevronLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={{ flex: 1, color: Colors.text, fontSize: 20, fontFamily: 'Georgia' }}>
          família
        </Text>
        {isAdmin && (
          <TouchableOpacity
            onPress={() => router.push('/(app)/(family)/invite' as never)}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              paddingHorizontal: 12, paddingVertical: 7,
              backgroundColor: Colors.primary, borderRadius: Radius.full,
            }}
            activeOpacity={0.8}
          >
            <IconUserPlus size={16} color={Colors.onLight} />
            <Text style={{ color: Colors.onLight, fontSize: FontSize.sm, fontWeight: '500' }}>
              Convidar
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Nome da família */}
      {family && (
        <View style={{
          marginHorizontal: Spacing.lg, marginBottom: Spacing.lg,
          paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
          backgroundColor: Colors.card, borderRadius: Radius.md,
          borderWidth: 1, borderColor: Colors.border,
          flexDirection: 'row', alignItems: 'center', gap: 12,
        }}>
          <View style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: Colors.primary,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 20 }}>🪺</Text>
          </View>
          <View>
            <Text style={{ color: Colors.text, fontSize: FontSize.md, fontWeight: '500' }}>
              Família {family.name}
            </Text>
            <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginTop: 2 }}>
              {members.length} {members.length === 1 ? 'membro' : 'membros'}
            </Text>
          </View>
        </View>
      )}

      {/* Lista */}
      {loading && members.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ color: Colors.muted, textAlign: 'center', fontSize: FontSize.md }}>
            {error}
          </Text>
          <TouchableOpacity onPress={load} style={{ marginTop: 16 }}>
            <Text style={{ color: Colors.primary, fontSize: FontSize.md }}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: insets.bottom + 88, gap: 8 }}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={load}
              tintColor={Colors.primary}
            />
          }
          renderItem={({ item }) => (
            <MemberCard
              member={item}
              currentUserId={profile?.user_id}
              isAdmin={isAdmin}
              inviteDaysLeft={acceptedInviteMap[item.id]}
              onPress={handleMemberPress}
            />
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 48 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>👥</Text>
              <Text style={{ color: Colors.text, fontSize: FontSize.lg, fontWeight: '500' }}>
                Nenhum membro ainda
              </Text>
              <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginTop: 6, textAlign: 'center' }}>
                Convide pessoas para a família
              </Text>
            </View>
          }
          ListFooterComponent={
            isAdmin ? (
              /* FAB blob — convidar alguém (handoff v2) */
              <View style={{ alignItems: 'flex-end', marginTop: 12, paddingHorizontal: 0 }}>
                <TouchableOpacity
                  onPress={() => router.push('/(app)/(family)/invite' as never)}
                  activeOpacity={0.82}
                  accessibilityRole="button"
                  accessibilityLabel="Convidar alguém para a família"
                  style={{
                    width: 52, height: 52,
                    borderTopLeftRadius: 30, borderTopRightRadius: 24,
                    borderBottomRightRadius: 22, borderBottomLeftRadius: 28,
                    backgroundColor: Colors.primary,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <IconUserPlus size={22} color={Colors.onLight} />
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
